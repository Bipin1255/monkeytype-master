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
    // If the server already created something, try to delete it (safe to fail)
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

// Keep the signature in case something imports it.
export async function show(_credential: UserCredential): Promise<void> {
  Notifications.add(
    "Sign up is disabled. Please sign in with Google instead.",
    0,
    { duration: 4 }
  );
}

subscribeToSignUpEvent((credential, isNewUser) => {
  // This callback fires when the app detects a Google auth result.
  // If it thinks it's a "new user", Monkeytype would normally show the captcha modal.
  // In Google-only mode, we block that and clean up.
  if (credential && isNewUser) {
    Notifications.add("Sign up is disabled on this build.", 0, { duration: 4 });

    // If Firebase marks it as a new user, clean up the temporary user to avoid dangling state
    if (getAdditionalUserInfo(credential)?.isNewUser) {
      void cleanupNewUser(credential);
    } else {
      // still ensure UI isn't stuck
      try {
        LoginPage.hidePreloader();
        LoginPage.enableInputs();
      } catch {
        // ignore
      }
    }
  }
});
