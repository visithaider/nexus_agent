import { executeAgent } from "./executor.js";

const DEFAULT_CASES = [
  "Reset my password",
  "What is your refund policy?",
  "I need urgent help",
  "Cancel my subscription",
  "How do I export my data?",
];

export async function runEvalSuite(agent, cases = DEFAULT_CASES) {
  const results = [];
  for (const input of cases) {
    const t0 = Date.now();
    try {
      const result = await executeAgent(agent, input, agent.user_id);
      const score = scoreOutput(result.output, input);
      results.push({ input, score, latency: result.latency, tokens: result.tokens,
        status: score >= 75 ? "pass" : "review" });
    } catch {
      results.push({ input, score: 0, latency: Date.now()-t0, tokens: 0, status: "fail" });
    }
  }
  return results;
}

function scoreOutput(output, input) {
  if (!output || output.startsWith("Error:")) return 0;
  let score = 60;
  if (output.length > 100) score += 10;
  if (output.includes("[OUTPUT]") || output.includes("[AGENT]")) score += 10;
  if (!output.toLowerCase().includes("i don't know") && !output.toLowerCase().includes("i cannot")) score += 10;
  if (output.length > 300) score += 5;
  if (input.split(" ").some(w => output.toLowerCase().includes(w.toLowerCase()))) score += 5;
  return Math.min(score, 100);
}
