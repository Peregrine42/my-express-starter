import inject, {
  InjectOptions,
  Response as InjectResponse,
} from "light-my-request";
import { BaseController } from "../src/lib/Controller";
import { LowerCaseMethod, Method } from "../src/lib/getRouter";
import { getApp } from "../src/lib/getApp";

type RouteClient = (overrides?: InjectOptions) => Promise<InjectResponse>;

export const setupController = async (
  routeName: string,
  [ControllerClass, funcName]: [typeof BaseController, Method],
): Promise<[RouteClient, Express.Application]> => {
  const [method, path] = routeName.split(" ");
  const controllerUnderTest = new ControllerClass();
  const [server] = await getApp({
    withApp: async (app) => {
      app[method.toLocaleLowerCase() as LowerCaseMethod](path, (req, res) => {
        controllerUnderTest[funcName](req, res);
      });
    },
  });

  return [
    (overrides = {}) => {
      return inject(server, {
        method: method.toLocaleLowerCase() as LowerCaseMethod,
        url: path,
        ...overrides,
      });
    },
    server,
  ];
};
