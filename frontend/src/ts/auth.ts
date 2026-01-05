import * as Notifications from "./elements/notifications";
import Config, { applyConfig, saveFullConfigToLocalStorage } from "./config";
import * as Misc from "./utils/misc";
import * as DB from "./db";
import * as Loader from "./elements/loader";
import * as LoginPage from "./pages/login";
import {
  GoogleAuthProvider,
  linkWithPopup,
  User as UserType,
  AuthProvider,
} from "firebase/auth";
import {
  isAuthAvailable,
  getAuthenticatedUser,
  isAuthenticated,
  signOut as authSignOut,
  signInWithPopup,
} from "./firebase";
import * as ConnectionState from "./states/connection";
import { navigate } from "./controllers/route-controller";
import { getActiveFunboxesWithFunction } from "./test/funbox/list";
import * as Sentry from "./sentry";
import { tryCatch } from "@monkeytype/util/trycatch";
import * as AuthEvent from "./observables/auth-event";
import { qs } from "./utils/dom";

export const gmailProvider = new GoogleAuthProvider();

async function getDataAndInit(): Promise<boolean> {
  try {
    console.log("getting account data");
    const snapshot = await DB.initSnapshot();

    if (snapshot === false) {
      throw new Error(
        "Snapshot didn't initialize due to lacking authentication even though user is authenticated",
      );
    }

    void Sentry.setUser(snapshot.uid, snapshot.name);
    if (snapshot.needsToChangeName) {
      Notifications.addPSA(
        "You need to update your account name. <a class='openNameChange'>Click here</a> to change it and learn more about why.",
        -1,
        undefined,
        true,
        undefined,
        true,
      );
    }

    const areConfigsEqual =
      JSON.stringify(Config) === JSON.stringify(snapshot.config);

    if (Config === undefined || !areConfigsEqual) {
      console.log(
        "no local config or local and db configs are different - applying db",
      );
      await applyConfig(snapshot.config);
      saveFullConfigToLocalStorage(true);

      for (const fb of getActiveFunboxesWithFunction("applyGlobalCSS")) {
        fb.functions.applyGlobalCSS();
      }
    }
    return true;
  } catch (error) {
    console.error(error);
    LoginPage.enableInputs();
    qs("header nav .view-account")?.setStyle({ opacity: "1" });
    if (error instanceof DB.SnapshotInitError) {
      if (error.responseCode === 429) {
        Notifications.add(
          "Doing so will save you bandwidth, make the next test be ready faster and will not sign you out (which could mean your new personal best would not save to your account).",
          0,
          {
            duration: 0,
          },
        );
        Notifications.add(
          "You will run into this error if you refresh the website to restart the test. It is NOT recommended to do that. Instead, use tab + enter or just tab (with quick tab mode enabled) to restart.",
          0,
          {
            duration: 0,
          },
        );
      }

      Notifications.add("Failed to get user data: " + error.message, -1);
    } else {
      const message = Misc.createErrorMessage(error, "Failed to get user data");
      Notifications.add(message, -1);
    }
    return false;
  }
}

export async function loadUser(_user: UserType): Promise<void> {
  if (!(await getDataAndInit())) {
    signOut();
    return;
  }
  AuthEvent.dispatch({ type: "snapshotUpdated", data: { isInitial: true } });
}

export async function onAuthStateChanged(
  authInitialisedAndConnected: boolean,
  user: UserType | null,
): Promise<void> {
  console.debug(`account controller ready`);

  let userPromise: Promise<void> = Promise.resolve();

  if (authInitialisedAndConnected) {
    console.debug(`auth state changed, user ${user !== null ? "true" : "false"}`);
    console.debug(user);
    if (user !== null) {
      userPromise = loadUser(user);
    } else {
      DB.setSnapshot(undefined);
    }
  }

  if (!authInitialisedAndConnected || user === null) {
    void Sentry.clearUser();
  }

  const keyframes = [
    {
      percentage: 90,
      durationMs: 1000,
      text: "Downloading user data...",
    },
  ];

  await navigate(undefined, {
    force: true,
    loadingOptions: {
      loadingMode: () => {
        if (user !== null) {
          return "sync";
        } else {
          return "none";
        }
      },
      loadingPromise: async () => {
        await userPromise;
      },
      style: "bar",
      keyframes: keyframes,
    },
  });

  AuthEvent.dispatch({
    type: "authStateChanged",
    data: { isUserSignedIn: user !== null },
  });
}

async function signInWithProvider(provider: AuthProvider): Promise<void> {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }

  LoginPage.showPreloader();
  LoginPage.disableInputs();

  const { error } = await tryCatch(signInWithPopup(provider, false));

  if (error !== null) {
    if (error.message !== "") {
      Notifications.add(error.message, -1);
    }
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
    return;
  }
}

async function signInWithGoogle(): Promise<void> {
  return signInWithProvider(gmailProvider);
}

async function addGoogleAuth(): Promise<void> {
  return addAuthProvider("Google", gmailProvider);
}

async function addAuthProvider(
  providerName: string,
  provider: AuthProvider,
): Promise<void> {
  if (!ConnectionState.get()) {
    Notifications.add("You are offline", 0, {
      duration: 2,
    });
    return;
  }
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  Loader.show();
  const user = getAuthenticatedUser();
  if (user === undefined) return;
  try {
    await linkWithPopup(user, provider);
    Loader.hide();
    Notifications.add(`${providerName} authentication added`, 1);
    AuthEvent.dispatch({ type: "authConfigUpdated" });
  } catch (error) {
    Loader.hide();
    const message = Misc.createErrorMessage(
      error,
      `Failed to add ${providerName} authentication`,
    );
    Notifications.add(message, -1);
  }
}

export function signOut(): void {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  if (!isAuthenticated()) return;
  void authSignOut();
}

qs(".pageLogin .login button.signInWithGoogle")?.on("click", () => {
  void signInWithGoogle();
});

qs("nav .accountButtonAndMenu .menu button.signOut")?.on("click", () => {
  if (!isAuthAvailable()) {
    Notifications.add("Authentication uninitialized", -1, {
      duration: 3,
    });
    return;
  }
  signOut();
});

qs(".pageAccountSettings")?.onChild("click", "#addGoogleAuth", () => {
  void addGoogleAuth();
});
