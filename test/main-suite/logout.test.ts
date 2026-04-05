import { Logout } from "../../src/controllers/Logout";
import { wasCalledWith } from "./lib/RecordingProxy";
import { setupMyController } from "../setupMyController";

describe("the Logout controller", () => {
  describe("POST", () => {
    it("clears the session cookie and redirects to /login", async () => {
      const [dispatch] = await setupMyController([Logout, "POST"]);
      const { res, response } = await dispatch({ method: "POST" });
      expect(response.statusCode).toEqual(302);
      expect(response.headers.location).toEqual("/login");
      wasCalledWith(res, "clearCookie", "session", { path: "/" });
    });
  });
});
