const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers, ...options });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Error ${res.status}`);
  }
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const register = (email, username, password) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });

export const login = (email, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const updateProfile = (updates) =>
  request("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });

// ─── Proyectos ────────────────────────────────────────────────────────────────

export const crearProyecto = (nombre, descripcion) =>
  request("/projects", {
    method: "POST",
    body: JSON.stringify({ nombre, descripcion }),
  });

export const listarProyectos = () => request("/projects");

export const obtenerProyecto = (projectId) => request(`/projects/${projectId}`);

export const eliminarProyecto = (projectId) =>
  request(`/projects/${projectId}`, { method: "DELETE" });

// ─── Requisitos ───────────────────────────────────────────────────────────────

export const crearRequisito = (projectId, texto) =>
  request(`/projects/${projectId}/requisitos`, {
    method: "POST",
    body: JSON.stringify({ texto }),
  });

export const listarRequisitos = (projectId) =>
  request(`/projects/${projectId}/requisitos`);

export const priorizar = (projectId) =>
  request(`/projects/${projectId}/priorizar`, { method: "POST" });

export const obtenerPriorizacion = (projectId) =>
  request(`/projects/${projectId}/priorizacion`);

// ─── Documento ────────────────────────────────────────────────────────────────

export const generarDocumento = (projectId) =>
  request(`/projects/${projectId}/documento`, { method: "POST" });

export const obtenerPreview = (projectId) =>
  request(`/projects/${projectId}/documento/preview`);

export const urlDescarga = (projectId, formato) =>
  `${BASE}/projects/${projectId}/documento/${formato}?token=${getToken()}`;
