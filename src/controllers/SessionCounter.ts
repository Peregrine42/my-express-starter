import express from "express";
import { BaseController } from "../lib/Controller";
import { getStringValueFromSession, hasSession } from "../lib/session";
import { getPool } from "../lib/db";

export class SessionCounter extends BaseController {
  private getUserId = async (
    req: express.Request,
    res: express.Response,
  ): Promise<number> => {
    const userIdStr = await getStringValueFromSession(req, res, "user_id");
    if (!userIdStr) {
      return -1;
    }
    return Number(userIdStr);
  };

  private ensureLoggedIn = async (
    req: express.Request,
    res: express.Response,
  ): Promise<boolean> => {
    if (!req.cookies?.session || !(await hasSession(req, res))) {
      res.redirect("/login");
      return false;
    }

    const userId = await this.getUserId(req, res);
    if (!userId || userId < 0) {
      res.redirect("/login");
      return false;
    }

    return true;
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
    if (!(await this.ensureLoggedIn(req, res))) {
      return;
    }

    const userId = await this.getUserId(req, res);
    const value = await this.getCounter(userId);
    res.render("counter", { value });
  };

  POST = async (req: express.Request, res: express.Response) => {
    if (!(await this.ensureLoggedIn(req, res))) {
      return;
    }

    const userId = await this.getUserId(req, res);
    const value = await this.incrementCounter(userId);
    res.render("counter", { value });
  };

  DELETE = async (req: express.Request, res: express.Response) => {
    if (!(await this.ensureLoggedIn(req, res))) {
      return;
    }

    const userId = await this.getUserId(req, res);
    const value = await this.decrementCounter(userId);
    res.render("counter", { value });
  };
}
