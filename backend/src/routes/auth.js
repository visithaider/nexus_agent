import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      "INSERT INTO users(email, password_hash) VALUES($1,$2) RETURNING id,email,role",
      [email.toLowerCase(), hash]
    );
    const token = jwt.sign({ id: rows[0].id, email: rows[0].email, role: rows[0].role },
      process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email already registered" });
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email.toLowerCase()]);
    if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash)))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: rows[0].id, email: rows[0].email, role: rows[0].role },
      process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: rows[0].id, email: rows[0].email, role: rows[0].role } });
  } catch (err) { next(err); }
});

export default router;
