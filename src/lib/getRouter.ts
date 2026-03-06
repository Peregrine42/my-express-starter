import { Router } from "express";
import { BaseController } from "./Controller";
import _ from "lodash";

export type Method = "GET" | "POST";
export type RoutesConfig = Record<string, [typeof BaseController, Method]>;
export type LowerCaseMethod = "get" | "post";
export const reservedRoutes = ["404"];

function buildRoutesKey(key: string): [Method, string] {
  return key.split(" ", 2) as [Method, string];
}

export function configureAndAttachRoutes(
  targetRouter: Router,
  routesConfig: RoutesConfig,
) {
  for (const routeConfigKey in _.omit(routesConfig, reservedRoutes)) {
    const [method, path] = buildRoutesKey(routeConfigKey);
    const [ControllerClass, funcName] = routesConfig[routeConfigKey];

    const controller = new ControllerClass();

    targetRouter[method.toLocaleLowerCase() as LowerCaseMethod](
      path,
      (req, res, next) => {
        (async () => {
          await controller[funcName](req, res);
        })().catch(next);
      },
    );
  }

  if (routesConfig["404"]) {
    const [ControllerClass, funcName] = routesConfig["404"];
    const controller = new ControllerClass();
    targetRouter.all("{*splat}", controller[funcName]);
  } else {
    targetRouter.all("{*splat}", new BaseController().FALLBACK);
  }
}

export async function getRouter(routes: RoutesConfig) {
  const myRouter = Router();
  configureAndAttachRoutes(myRouter, routes);

  return myRouter;
}
