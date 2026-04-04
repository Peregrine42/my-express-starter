import type { Browser, Page } from "playwright";

declare global {
  var browser: Browser;
  var page: Page;
}

declare module "vitest" {
  export interface ProvidedContext {
    wsEndpoint: string;
  }
}
