import { type RoutesConfig } from "./lib/getRouter";
import { Home } from "./controllers/home";

export function getMyRoutes() {
  const routes: RoutesConfig = {
    "GET /": [new Home(), "GET"],
  };

  return routes;
}
