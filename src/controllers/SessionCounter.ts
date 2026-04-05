import express from "express";
import { BaseController } from "../lib/Controller";
import { getStringValueFromSession, hasSession } from "../lib/session";
import { getPool } from "../lib/db";

export class SessionCounter extends BaseController {
  private getUserId = async (
    req: express.Request,
    res: express.Response,
  ): Promise<number | null> => {
    const userIdStr = await getStringValueFromSession(req, res, "user_id");
    if (!userIdStr) {
      return null;
    }
    return Number(userIdStr);
  };

  /**
   * Ensure the user has a valid session with a user_id.
   * Returns the userId on success, or redirects to /login and returns null.
   */
  private ensureLoggedIn = async (
    req: express.Request,
    res: express.Response,
  ): Promise<number | null> => {
    if (!req.cookies?.session || !(await hasSession(req, res))) {
      res.redirect("/login");
      return null;
    }

    const userId = await this.getUserId(req, res);
    if (!userId) {
      res.redirect("/login");
      return null;
    }

    return userId;
  };

  private getCounter = async (userId: number): Promise<number> => {
    const pool = getPool();
    const result = await pool.query(
      `SELECT value FROM counters WHERE user_id = $1`,
      [userId],
    );
    if (result.rows.length === 0) {
      return 0;
    }
    return result.rows[0].value;
  };

  private incrementCounter = async (userId: number): Promise<number> => {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO counters (user_id, value) VALUES ($1, 1)
       ON CONFLICT (user_id) DO UPDATE SET value = counters.value + 1
       RETURNING value`,
      [userId],
    );
    return result.rows[0].value;
  };

  private resetCounter = async (userId: number): Promise<void> => {
    const pool = getPool();
    await pool.query(`DELETE FROM counters WHERE user_id = $1`, [userId]);
  };

  private decrementCounter = async (userId: number): Promise<number> => {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO counters (user_id, value) VALUES ($1, -1)
       ON CONFLICT (user_id) DO UPDATE SET value = counters.value - 1
       RETURNING value`,
      [userId],
    );
    return result.rows[0].value;
  };

  GET = async (req: express.Request, res: express.Response) => {
    const userId = await this.ensureLoggedIn(req, res);
    if (!userId) {
      return;
    }

    const value = await this.getCounter(userId);
    res.render("counter", { value });
  };

  POST = async (req: express.Request, res: express.Response) => {
    const userId = await this.ensureLoggedIn(req, res);
    if (!userId) {
      return;
    }

    await this.incrementCounter(userId);
    res.redirect("/counter");
  };

  DELETE = async (req: express.Request, res: express.Response) => {
    const userId = await this.ensureLoggedIn(req, res);
    if (!userId) {
      return;
    }

    await this.decrementCounter(userId);
    res.redirect("/counter");
  };

  PUT = async (req: express.Request, res: express.Response) => {
    const userId = await this.ensureLoggedIn(req, res);
    if (!userId) {
      return;
    }

    await this.resetCounter(userId);
    res.redirect("/counter");
  };
}
