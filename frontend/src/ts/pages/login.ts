import Page from "./page";
import * as Skeleton from "../utils/skeleton";
import { qsa, qsr, qs, onWindowLoad } from "../utils/dom";

export function enableInputs(): void {
  qsa(".pageLogin input")?.enable();
  qsa(".pageLogin button")?.enable();
}

export function disableInputs(): void {
  qsa(".pageLogin input")?.disable();
  qsa(".pageLogin button")?.disable();
}

export function showPreloader(): void {
  qs(".pageLogin .preloader")?.show();
}

export function hidePreloader(): void {
  qs(".pageLogin .preloader")?.hide();
}

export const page = new Page({
  id: "login",
  element: qsr(".page.pageLogin"),
  path: "/login",
  afterHide: async (): Promise<void> => {
    hidePreloader();
    Skeleton.remove("pageLogin");
  },
  beforeShow: async (): Promise<void> => {
    Skeleton.append("pageLogin", "main");
    enableInputs();
    hidePreloader();
  },
});

onWindowLoad(() => {
  Skeleton.save("pageLogin");
});

// Google-only build: signup removed, keep these exports for compatibility
export function enableSignUpButton(): void {
  // no-op: signup disabled
}

export function disableSignUpButton(): void {
  // no-op: signup disabled
}

export function updateSignupButton(): void {
  // no-op: signup disabled
}

export function getSignupData(): false {
  return false;
}
