import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../auth.js";
import { executeAgent } from "../services/executor.js";
import { runEvalSuite } from "../services/evaluator.js";

const router = Router();
router.use(requireAuth);

// List agents
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id,name,status,version,nodes,edges,mcp_servers,skills,settings,created_at,updated_at FROM agents WHERE user_id=$1 ORDER BY updated_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// Get one
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM agents WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Create
router.post("/", async (req, res, next) => {
  try {
    const { name, nodes, edges, mcp_servers, skills, settings } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO agents(user_id,name,nodes,edges,mcp_servers,skills,settings)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, name||"New Agent", JSON.stringify(nodes||[]),
       JSON.stringify(edges||[]), JSON.stringify(mcp_servers||{}),
       JSON.stringify(skills||{}), JSON.stringify(settings||{})]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// Update
router.put("/:id", async (req, res, next) => {
  try {
    const { name, status, nodes, edges, mcp_servers, skills, settings } = req.body;
    const { rows } = await pool.query(
      `UPDATE agents SET name=$1,status=$2,nodes=$3,edges=$4,mcp_servers=$5,
       skills=$6,settings=$7,updated_at=now()
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [name, status, JSON.stringify(nodes), JSON.stringify(edges),
       JSON.stringify(mcp_servers), JSON.stringify(skills),
       JSON.stringify(settings), req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// Delete
router.delete("/:id", async (req, res, next) => {
  try {
    await pool.query("DELETE FROM agents WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Run agent
router.post("/:id/run", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM agents WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    const result = await executeAgent(rows[0], req.body.input, req.user.id);
    res.json(result);
  } catch (err) { next(err); }
});

// Run eval
router.post("/:id/eval", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM agents WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    const results = await runEvalSuite(rows[0], req.body.cases);
    res.json(results);
  } catch (err) { next(err); }
});

// Bump version
router.post("/:id/version", async (req, res, next) => {
  try {
    const { rows: [agent] } = await pool.query(
      "SELECT * FROM agents WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
    if (!agent) return res.status(404).json({ error: "Not found" });
    await pool.query(
      "INSERT INTO versions(agent_id,version,snapshot) VALUES($1,$2,$3)",
      [agent.id, agent.version, JSON.stringify(agent)]
    );
    const { rows } = await pool.query(
      "UPDATE agents SET version=version+1,updated_at=now() WHERE id=$1 RETURNING *", [agent.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
