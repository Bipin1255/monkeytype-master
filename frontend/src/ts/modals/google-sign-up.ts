import * as Notifications from "../elements/notifications";
import { UserCredential, getAdditionalUserInfo } from "firebase/auth";
import Ape from "../ape";
import * as LoginPage from "../pages/login";
import * as AccountController from "../auth";
import { subscribe as subscribeToSignUpEvent } from "../observables/google-sign-up-event";

/**
 * Google-only build (no captcha):
 * Monkeytype's Google SIGN-UP flow requires reCAPTCHA + server-side user creation.
 * Since we removed captcha + email/password signup, we disable this modal entirely.
 *
 * We still clean up "new user" credentials so Firebase doesn't keep a dangling user.
 */

async function cleanupNewUser(credential: UserCredential): Promise<void> {
  try {
    await Ape.users.delete().catch(() => {});
  } catch {
    // ignore
  }

  try {
    await credential.user.delete().catch(() => {});
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
