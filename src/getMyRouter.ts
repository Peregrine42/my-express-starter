import { Router } from "express";

export async function getMyRouter() {
  const myRouter = Router();

  myRouter.get("/", (_req, res) => {
    res.render("index");
  });

  return myRouter;
}
