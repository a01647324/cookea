export function log(...args: unknown[]): void {
  if (__DEV__) {
    console.log(...args);
  }
}