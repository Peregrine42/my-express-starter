import { BaseController } from "../../../src/lib/Controller";
import { LowerCaseMethod, Method } from "../../../src/lib/getRouter";
import express from "express";
import { createRecordingProxy, RecordedObject } from "./RecordingProxy";
import inject, { InjectOptions, Response } from "light-my-request";
import { getApp } from "../../../src/lib/getApp";

export type DispatchResult = {
  req: RecordedObject<express.Request>;
  res: RecordedObject<express.Response>;
  /** The resolved light-my-request Response */
  response: Response;
};

export const setupController = async (
  controllerPair: [typeof BaseController, Method],
  {
    withApp = async () => {},
  }: { withApp?: (_app: express.Application) => Promise<void> } = {},
) => {
  return [
    async (options: Partial<InjectOptions> = {}): Promise<DispatchResult> => {
      let request!: RecordedObject<express.Request>;
      let response!: RecordedObject<express.Response>;

      return new Promise<DispatchResult>((resolve, reject) => {
        (async () => {
          const [Controller, method] = controllerPair;
          const controller = new Controller();
          const [wrappingApp] = await getApp({ withApp });
          const lowerCaseMethod = method.toLocaleLowerCase() as LowerCaseMethod;

          // Register handler BEFORE firing the request
          wrappingApp[lowerCaseMethod](
            "/",
            (req: express.Request, res: express.Response) => {
              request = createRecordingProxy<express.Request>(req);
              response = createRecordingProxy<express.Response>(res);

              controller[method](
                request as express.Request,
                response as express.Response,
              )
                .then(async () => {
                  // Controller finished — inject should have resolved too
                  // (the controller sent a response before its promise resolved).
                  const lmResponse = await injectPromise;
                  resolve({
                    req: request,
                    res: response,
                    response: lmResponse,
                  });
                })
                .catch(reject);
            },
          );

          // Fire the request — triggers the handler above
          const injectPromise = inject(wrappingApp, {
            method: lowerCaseMethod,
            path: "/",
            ...options,
          });
        })();
      });
    },
  ];
};
