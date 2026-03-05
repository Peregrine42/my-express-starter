import dotenv from "dotenv";
dotenv.config();
import { getRouter } from "./lib/getRouter";
import { getApp } from "./lib/getApp";
import { getMyRoutes } from "./getMyRoutes";

(async () => {
  const PORT = Number(process.env.PORT || "3000");

  const routes = getMyRoutes();
  const myRouter = await getRouter(routes);
  const app = await getApp({
    withApp: async (app) => {
      app.use("/", myRouter);
    },
  });

  app.listen(PORT, () => {
    console.log(`App is listening at http://localhost:${PORT}`);
  });
})().catch((e) => {
  process.exitCode = 1;
  console.error(e);
});
