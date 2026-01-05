import { promiseWithResolvers } from "../utils/misc";

const {
  promise,
  resolve,
  reset: resetPromise,
} = promiseWithResolvers<string | undefined>();

export { promise };

// Google-only build: captcha disabled, immediately resolve with undefined
export async function show(): Promise<void> {
  resetPromise();
  resolve(undefined);
}
