import express from "express";
import { BaseController } from "../lib/Controller";
import {
  generateSessionId,
  hasSession,
  setupSession,
  setStringValueFromSession,
  destroySession,
  REMEMBER_ME_TTL_MS,
} from "../lib/session";
import { isSafeRedirect } from "../lib/auth";
import { getPool } from "../lib/db";
import { verifyPassword } from "../lib/password";

export class Login extends BaseController {
  GET = async (req: express.Request, res: express.Response) => {
    // Ensure a session exists so we can bind a CSRF token to it
    if (!req.cookies?.session || !(await hasSession(req, res))) {
      const sessionId = generateSessionId();
      await setupSession(req, res, sessionId);
      res.cookie("session", sessionId, { path: "/" });
      req.cookies.session = sessionId;
    }

    res.render("login", {
      redirectTo: (req.query.redirect as string | undefined) || null,
    });
  };

  POST = async (req: express.Request, res: express.Response) => {
    const username = (req.body?.username as string | undefined)?.trim();
    // Don't trim password — leading/trailing spaces may be intentional
    const password = req.body?.password as string | undefined;

    if (!username) {
      res.render("login", {
        error: "Username is required.",
        username,
        redirectTo: (req.query.redirect as string | undefined) || null,
      });
      return;
    }

    if (!password) {
      res.render("login", {
        error: "Password is required.",
        username,
        redirectTo: (req.query.redirect as string | undefined) || null,
      });
      return;
    }

    const result = await this.authenticateUser(username, password);
    if (!result) {
      res.render("login", {
        error: "Invalid username or password.",
        username,
        redirectTo: (req.query.redirect as string | undefined) || null,
      });
      return;
    }

    // Determine where to redirect after login
    const rawRedirect = req.query.redirect as string | undefined;
    const redirectTo =
      rawRedirect && isSafeRedirect(rawRedirect) ? rawRedirect : "/counter";

    const remember = req.body?.remember === "on";
    await this.createSessionAndRedirect(
      req,
      res,
      result.userId,
      redirectTo,
      remember,
    );
  };

  /**
   * Authenticate an existing user against the database.
   * Returns the userId on success, or null if authentication fails.
   */
  private async authenticateUser(
    username: string,
    password: string,
  ): Promise<{ userId: number } | null> {
    const pool = getPool();

    const existing = await pool.query(
      `SELECT id, password_hash FROM users WHERE username = $1`,
      [username],
    );

    if (existing.rows.length === 0) {
      return null;
    }

    const { id: userId, password_hash } = existing.rows[0];
    if (!(await verifyPassword(password, password_hash))) {
      return null;
    }
    return { userId };
  }

  /**
   * Create a fresh session (session fixation protection) and redirect.
   * Always destroys the old session and creates a new one.
   */
  private async createSessionAndRedirect(
    req: express.Request,
    res: express.Response,
    userId: number,
    redirectTo: string,
    remember: boolean = false,
  ) {
    // Destroy old session to prevent session fixation
    const oldSessionId = req.cookies?.session;
    if (oldSessionId) {
      await destroySession(oldSessionId);
    }

    const ttlMs = remember ? REMEMBER_ME_TTL_MS : undefined;

    // Always create a brand-new session
    const sessionId = generateSessionId();
    await setupSession(req, res, sessionId, ttlMs);
    res.cookie("session", sessionId, {
      path: "/",
      ...(remember ? { maxAge: REMEMBER_ME_TTL_MS } : {}),
    });
    req.cookies.session = sessionId;

    await setStringValueFromSession(req, res, "user_id", String(userId), ttlMs);

    res.redirect(redirectTo);
  }
}
