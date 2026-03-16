import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();
router.use(requireAuth);

router.get("/:agentId", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM runs WHERE agent_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 100",
      [req.params.agentId, req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
