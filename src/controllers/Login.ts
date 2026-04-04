import express from "express";
import { BaseController } from "../lib/Controller";
import {
  generateSessionId,
  hasSession,
  setupSession,
  setStringValueFromSession,
} from "../lib/session";
import { getPool } from "../lib/db";

export class Login extends BaseController {
  GET = async (_req: express.Request, res: express.Response) => {
    res.render("login");
  };

  POST = async (req: express.Request, res: express.Response) => {
    const username = (req.body?.username as string | undefined)?.trim();

    if (!username) {
      res.render("login", { error: "Username is required." });
      return;
    }

    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO users (username) VALUES ($1)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [username],
    );

    let userId: number;
    if (result.rows.length > 0) {
      userId = result.rows[0].id;
    } else {
      const existing = await pool.query(
        `SELECT id FROM users WHERE username = $1`,
        [username],
      );
      userId = existing.rows[0].id;
    }

    // Create or reuse session, then store user_id
    const sessionId = req.cookies?.session || generateSessionId();
    if (!(await hasSession(req, res))) {
      await setupSession(req, res, sessionId);
      res.cookie("session", sessionId, { path: "/" });
      req.cookies.session = sessionId;
    }
    await setStringValueFromSession(req, res, "user_id", String(userId));

    res.redirect("/counter");
  };
}
