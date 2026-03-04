import { Router } from "express";
import { BaseController, Controller } from "./Controller";
import _ from "lodash";

export type Method = "GET" | "POST";
export type RoutesConfig = Record<string, [Controller, Method]>;
type LowerCaseMethod = "get" | "post";
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
    const [controller, funcName] = routesConfig[routeConfigKey];
    targetRouter[method.toLocaleLowerCase() as LowerCaseMethod](
      path,
      controller[funcName],
    );
  }

  if (routesConfig["404"]) {
    const [controller, funcName] = routesConfig["404"];
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
