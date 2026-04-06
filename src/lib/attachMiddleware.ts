import express from "express";
import methodOverride from "method-override";
import { getRouter } from "./getRouter";
import { getMyRoutes } from "../getMyRoutes";
import { sessionSetupMiddleware, hasSession } from "./session";

export async function attachAppMiddleware(
  app: express.Application,
  options?: { withRouter?: boolean },
) {
  const { withRouter = true } = options ?? {};

  app.use(
    "/",
    sessionSetupMiddleware({ allowedSessionObjectKeys: ["user_id"] }),
  );
  app.use(async (req: express.Request, res: express.Response, next) => {
    res.locals.isLoggedIn = await hasSession(req, res);
    next();
  });
  app.use(express.urlencoded({ extended: false }));
  app.use(
    methodOverride((req) => {
      return req.body?._method;
    }),
  );

  if (withRouter) {
    const routes = getMyRoutes();
    const myRouter = await getRouter(routes);
    app.use("/", myRouter);
  }
}
