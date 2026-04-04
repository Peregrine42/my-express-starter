import { type RoutesConfig } from "./lib/getRouter";
import { Home } from "./controllers/Home";
import { SessionCounter } from "./controllers/SessionCounter";
import { Login } from "./controllers/Login";
import { Logout } from "./controllers/Logout";

export function getMyRoutes() {
  const routes: RoutesConfig = {
    "GET /": [Home, "GET"],
    "GET /login": [Login, "GET"],
    "POST /login": [Login, "POST"],
    "POST /logout": [Logout, "POST"],
    "GET /counter": [SessionCounter, "GET"],
    "POST /counter": [SessionCounter, "POST"],
    "DELETE /counter": [SessionCounter, "DELETE"],
    "PUT /counter": [SessionCounter, "PUT"],
  };

  return routes;
}
