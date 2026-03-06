import { type RoutesConfig } from "./lib/getRouter";
import { Home } from "./controllers/Home";
import { SessionCounter } from "./controllers/SessionCounter";

export function getMyRoutes() {
  const routes: RoutesConfig = {
    "GET /": [Home, "GET"],
    "GET /counter": [SessionCounter, "GET"],
    "POST /counter": [SessionCounter, "POST"],
  };

  return routes;
}
