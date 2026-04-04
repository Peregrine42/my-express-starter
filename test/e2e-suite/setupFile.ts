import { chromium } from "playwright";
import { inject } from "vitest";

const wsEndpoint = inject("wsEndpoint");
const browser = await chromium.connect(wsEndpoint);
const page = await browser.newPage();

Object.assign(globalThis, { browser, page });
