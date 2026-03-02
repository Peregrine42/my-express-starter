import express from "express";
import path from "path";
import compression from "compression";

export async function getMyApp() {
  const app = express();

  app.use(
    "/public",
    compression(),
    express.static(path.join(import.meta.dirname, "..", "public")),
  );
  app.set("view engine", "pug");

  return app;
}
