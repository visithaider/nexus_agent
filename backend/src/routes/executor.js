import Anthropic from "@anthropic-ai/sdk";
import { pool } from "../db.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function executeAgent(agent, input, userId) {
  const logs = [];
  const log = (msg, type = "info") => logs.push({ t: new Date().toISOString(), msg, type });
  const t0 = Date.now();

  log(`Pipeline started: ${agent.name}`);

  const nodes = agent.nodes || [];
  const edges = agent.edges || [];
  const mcpList = Object.keys(agent.mcp_servers || {}).filter(k => agent.mcp_servers[k]).join(", ") || "none";
  const skillList = Object.keys(agent.skills || {}).filter(k => agent.skills[k]).join(", ") || "none";

  nodes.forEach(n => log(`Initialized node: ${n.label} (${n.type})`));

  const agentNode = nodes.find(n => n.type === "agent" || n.type === "llm");
  const systemPrompt = agentNode?.config?.prompt || "You are a helpful AI assistant.";
  const model = agentNode?.config?.model || "claude-sonnet-4-20250514";
  const maxTokens = agentNode?.config?.maxTokens || agent.settings?.maxTokens || 1024;
  const temperature = agentNode?.config?.temperature ?? agent.settings?.temperature ?? 1;

  const pipelineDesc = nodes.map(n => `${n.type}(${n.label})`).join(" → ");

  const fullSystem = `${systemPrompt}

You are part of an AI agent pipeline: ${pipelineDesc}
Active MCP servers: ${mcpList}
Active skills: ${skillList}

When responding, show each pipeline stage processing the input with headers like [INPUT] [AGENT] [GUARDRAIL] [OUTPUT].`;

  let output = "", tokens = 0, status = "success";
  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: fullSystem,
      messages: [{ role: "user", content: input }],
    });
    output = response.content[0]?.text || "";
    tokens = response.usage?.output_tokens || 0;
    log(`Pipeline completed. Tokens used: ${tokens}`, "success");
  } catch (err) {
    status = "error";
    output = `Error: ${err.message}`;
    log(err.message, "error");
  }

  const latency = Date.now() - t0;

  await pool.query(
    `INSERT INTO runs(agent_id,user_id,input,output,status,latency,tokens,logs)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [agent.id, userId, input, output, status, latency, tokens, JSON.stringify(logs)]
  );

  return { output, latency, tokens, status, logs };
}
