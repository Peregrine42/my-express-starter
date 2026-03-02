import dotenv from "dotenv"
dotenv.config()
import { getMyRouter } from "./getMyRouter";
import { getMyApp } from "./getMyApp";

(async () => {
  const PORT = Number(process.env.PORT || "3000");

  const app = await getMyApp();
  const myRouter = await getMyRouter();
  app.use("/", myRouter);

  app.listen(PORT, () => {
    console.log(`App is listening at http://localhost:${PORT}`);
  });
})().catch((e) => {
  process.exitCode = 1;
  console.error(e);
});
