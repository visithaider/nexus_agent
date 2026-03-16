import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();
router.use(requireAuth);

// Get secrets (keys only, never values)
router.get("/:agentId/secrets", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id,key FROM secrets WHERE agent_id=$1", [req.params.agentId]);
    res.json(rows);
  } catch (err) { next(err); }
});

// Upsert secret
router.put("/:agentId/secrets", async (req, res, next) => {
  try {
    const { key, value } = req.body;
    await pool.query(
      `INSERT INTO secrets(agent_id,key,value) VALUES($1,$2,$3)
       ON CONFLICT (agent_id,key) DO UPDATE SET value=$3`,
      [req.params.agentId, key, value]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Delete secret
router.delete("/:agentId/secrets/:key", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM secrets WHERE agent_id=$1 AND key=$2",
      [req.params.agentId, req.params.key]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Version history
router.get("/:agentId/versions", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id,version,created_at FROM versions WHERE agent_id=$1 ORDER BY version DESC",
      [req.params.agentId]);
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
