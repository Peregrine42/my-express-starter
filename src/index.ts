import dotenv from "dotenv";
dotenv.config();
import { getRouter } from "./getRouter";
import { getMyApp } from "./getMyApp";
import { getMyRoutes } from "./getMyRoutes";

(async () => {
  const PORT = Number(process.env.PORT || "3000");

  const app = await getMyApp();
  const routes = getMyRoutes();
  const myRouter = await getRouter(routes);
  app.use("/", myRouter);

  app.listen(PORT, () => {
    console.log(`App is listening at http://localhost:${PORT}`);
  });
})().catch((e) => {
  process.exitCode = 1;
  console.error(e);
});
