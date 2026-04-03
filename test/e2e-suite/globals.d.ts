import type puppeteer from "puppeteer";

declare global {
  var browser: puppeteer.Browser;
  var page: puppeteer.Page;
}

declare module "vitest" {
  export interface ProvidedContext {
    wsEndpoint: string;
  }
}
