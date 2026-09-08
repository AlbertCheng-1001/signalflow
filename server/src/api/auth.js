import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/index.js";
import { signToken } from "../auth/jwt.js";

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const INSERT_USER_SQL = `
  INSERT INTO users (email, password_hash) VALUES ($1, $2)
  RETURNING id
`;

const SELECT_USER_BY_EMAIL_SQL = `
  SELECT id, password_hash FROM users WHERE email = $1
`;

authRouter.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "valid email required" });
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(INSERT_USER_SQL, [normalizedEmail, passwordHash]);
    const token = signToken(rows[0].id);
    res.status(201).json({ token, email: normalizedEmail });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "an account with that email already exists" });
    }
    throw err;
  }
});

authRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "email and password required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { rows } = await pool.query(SELECT_USER_BY_EMAIL_SQL, [normalizedEmail]);
  const user = rows[0];

  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const token = signToken(user.id);
  res.json({ token, email: normalizedEmail });
});
