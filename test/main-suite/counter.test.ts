import { SessionCounter } from "../../src/controllers/SessionCounter";
import { wasCalledWith } from "./lib/RecordingProxy";
import {
  getStringValueFromSession,
  SessionReq,
  SessionRes,
} from "../../src/lib/session";
import { setupMyController } from "../setupMyController";
import { cleanSessionKeys, seedSession } from "../helpers/session";

const existingSessionId = "foo";
const allowedSessionObjectKeys = ["counter"];

describe("the counter", () => {
  beforeEach(() => {
    return cleanSessionKeys(existingSessionId);
  });

  it("throws when no session cookie is present", async () => {
    // ARRANGE
    const [dispatch] = await setupMyController([SessionCounter, "GET"]);
    // ACT / ASSERT
    await expect(dispatch()).rejects.toThrow("No session!");
  });

  it("throws when session cookie is present but session does not exist in Redis", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    await cleanSessionKeys(existingSessionId); // remove what seedSession just created
    const [dispatch] = await setupMyController([SessionCounter, "GET"]);
    // ACT / ASSERT
    await expect(dispatch({ headers })).rejects.toThrow("No session!");
  });

  it("renders the counter view", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "GET"]);
    // ACT
    const { res, response } = await dispatch({ headers });
    // ASSERT
    expect(response.statusCode).toEqual(200);
    wasCalledWith(res, "render", "counter", { value: 0 });
  });

  it("sets the counter to 1 on first POST", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "POST"]);
    // ACT
    const { req, res } = await dispatch({ method: "POST", headers });
    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );
    expect(val).toEqual("1");
  });

  it("accumulates on repeated POSTs", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "POST"]);
    // ACT
    await dispatch({ method: "POST", headers });
    const { req, res } = await dispatch({ method: "POST", headers });
    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );
    expect(val).toEqual("2");
  });

  it("sets the counter to -1 on first DELETE", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
    // ACT
    const { req, res } = await dispatch({ method: "DELETE", headers });
    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );
    expect(val).toEqual("-1");
  });

  it("accumulates on repeated DELETEs", async () => {
    // ARRANGE
    const { headers } = await seedSession(
      existingSessionId,
      allowedSessionObjectKeys,
    );
    const [dispatch] = await setupMyController([SessionCounter, "DELETE"]);
    // ACT
    await dispatch({ method: "DELETE", headers });
    const { req, res } = await dispatch({ method: "DELETE", headers });
    // ASSERT
    const val = await getStringValueFromSession(
      req as SessionReq,
      res as SessionRes,
      "counter",
    );
    expect(val).toEqual("-2");
  });
});
