import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("na_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r.data,
  err => Promise.reject(err.response?.data || err)
);

export const auth = {
  register: (email, password) => api.post("/auth/register", { email, password }),
  login:    (email, password) => api.post("/auth/login",    { email, password }),
};

export const agents = {
  list:    ()           => api.get("/agents"),
  get:     (id)         => api.get(`/agents/${id}`),
  create:  (data)       => api.post("/agents", data),
  update:  (id, data)   => api.put(`/agents/${id}`, data),
  delete:  (id)         => api.delete(`/agents/${id}`),
  run:     (id, input)  => api.post(`/agents/${id}/run`, { input }),
  eval:    (id, cases)  => api.post(`/agents/${id}/eval`, { cases }),
  version: (id)         => api.post(`/agents/${id}/version`),
};

export const runs = {
  list: (agentId) => api.get(`/runs/${agentId}`),
};

export const deploy = {
  getSecrets:    (agentId)        => api.get(`/deploy/${agentId}/secrets`),
  setSecret:     (agentId, k, v)  => api.put(`/deploy/${agentId}/secrets`, { key:k, value:v }),
  deleteSecret:  (agentId, key)   => api.delete(`/deploy/${agentId}/secrets/${key}`),
  getVersions:   (agentId)        => api.get(`/deploy/${agentId}/versions`),
};

export default api;
