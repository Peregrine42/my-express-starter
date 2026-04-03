import puppeteer from "puppeteer";
import { inject } from "vitest";

const wsEndpoint = inject("wsEndpoint");
const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
const page = await browser.newPage();

Object.assign(globalThis, { browser, page });
