import { BaseController } from "../../../src/lib/Controller";
import { LowerCaseMethod, Method } from "../../../src/lib/getRouter";
import express from "express";
import { createRecordingProxy } from "./RecordingProxy";
import inject, { InjectOptions } from "light-my-request";
import { getApp } from "../../../src/lib/getApp";

export const setupController = async (
  controllerPair: [typeof BaseController, Method],
  {
    withApp = async () => {},
  }: { withApp?: (_app: express.Application) => Promise<void> } = {},
) => {
  return [
    async (options: Partial<InjectOptions> = {}) => {
      let request: ReturnType<typeof createRecordingProxy<express.Request>>;
      let response: ReturnType<typeof createRecordingProxy<express.Response>>;

      await new Promise<void>((resolve, reject) => {
        (async () => {
          const [Controller, method] = controllerPair;

          const controller = new Controller();

          const [wrappingApp] = await getApp({
            withApp,
          });
          const lowerCaseMethod = method.toLocaleLowerCase() as LowerCaseMethod;

          wrappingApp[lowerCaseMethod](
            "/",
            (req: express.Request, res: express.Response) => {
              request = createRecordingProxy<express.Request>(req);
              response = createRecordingProxy<express.Response>(res);

              (async () => {
                await controller[method](
                  request as express.Request,
                  response as express.Response,
                );
              })()
                .then(resolve)
                .catch(reject);
            },
          );

          await inject(wrappingApp, {
            method: lowerCaseMethod,
            path: "/",
            ...options,
          });
        })();
      });

      return [request!, response!] as [typeof request, typeof response];
    },
  ];
};
