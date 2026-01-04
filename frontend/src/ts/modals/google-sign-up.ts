import * as Notifications from "../elements/notifications";
import { UserCredential, getAdditionalUserInfo } from "firebase/auth";
import * as LoginPage from "../pages/login";
import * as AccountController from "../auth";
import { subscribe as subscribeToSignUpEvent } from "../observables/google-sign-up-event";

/**
 * Google-only build (no captcha + no Monkeytype backend):
 * Disable Google SIGN-UP flow entirely (it expects captcha + server user creation).
 * IMPORTANT: Do NOT call Ape/users API here.
 */

async function cleanupNewUser(credential: UserCredential): Promise<void> {
  try {
    // Remove the temporary Firebase user so we don't leave a dangling account
    await credential.user.delete().catch(() => undefined);
  } catch {
    // ignore
  }

  try {
    AccountController.signOut();
  } catch {
    // ignore
  }

  try {
    LoginPage.hidePreloader();
    LoginPage.enableInputs();
  } catch {
    // ignore
  }
}

// Keep the signature in case something imports it
export async function show(_credential: UserCredential): Promise<void> {
  Notifications.add("Sign up is disabled. Please sign in with Google instead.", 0, {
    duration: 4,
  });
}

subscribeToSignUpEvent((credential, isNewUser) => {
  if (credential && isNewUser) {
    Notifications.add("Sign up is disabled on this build.", 0, { duration: 4 });

    if (getAdditionalUserInfo(credential)?.isNewUser) {
      void cleanupNewUser(credential);
    } else {
      try {
        LoginPage.hidePreloader();
        LoginPage.enableInputs();
      } catch {
        // ignore
      }
    }
  }
});
