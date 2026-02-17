import { ApplicationController, view } from "./application.mjs";

export class HomeController extends ApplicationController {
  index() {
    return view("index");
  }
}
