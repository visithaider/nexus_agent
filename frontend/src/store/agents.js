import { create } from "zustand";
import { agents as agentsApi, runs as runsApi } from "../api/client";

export const useAgentStore = create((set, get) => ({
  agents: [],
  activeId: null,
  runs: {},
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true });
    try {
      const data = await agentsApi.list();
      set({ agents: data, loading: false });
      if (!get().activeId && data.length) set({ activeId: data[0].id });
    } catch (e) { set({ error: e.error, loading: false }); }
  },

  createAgent: async (name = "New Agent") => {
    const agent = await agentsApi.create({ name, nodes: [], edges: [] });
    set(s => ({ agents: [agent, ...s.agents], activeId: agent.id }));
    return agent;
  },

  updateAgent: async (id, patch) => {
    const agent = await agentsApi.update(id, patch);
    set(s => ({ agents: s.agents.map(a => a.id === id ? agent : a) }));
    return agent;
  },

  deleteAgent: async (id) => {
    await agentsApi.delete(id);
    set(s => {
      const agents = s.agents.filter(a => a.id !== id);
      return { agents, activeId: agents[0]?.id || null };
    });
  },

  runAgent: async (id, input) => {
    const result = await agentsApi.run(id, input);
    await get().fetchRuns(id);
    return result;
  },

  fetchRuns: async (agentId) => {
    const data = await runsApi.list(agentId);
    set(s => ({ runs: { ...s.runs, [agentId]: data } }));
  },

  setActive: (id) => set({ activeId: id }),
}));
