import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { initDb } from "./db.js";
import authRouter from "./routes/auth.js";
import agentsRouter from "./routes/agents.js";
import runsRouter from "./routes/runs.js";
import deployRouter from "./routes/deploy.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.use("/api/auth",   authRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/runs",   runsRouter);
app.use("/api/deploy", deployRouter);

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal error" });
});

const PORT = process.env.PORT || 4000;
initDb().then(() => {
  app.listen(PORT, () => console.log(`NexusAgent API on :${PORT}`));
});
