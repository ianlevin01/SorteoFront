// En dev: '/api' lo proxea Vite al backend local.
// En prod: VITE_API_URL = origen de la API (ej. https://api.tudominio.com), sin /api.
const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const BASE = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';
const TOKEN_KEY = 'sorteo.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* almacenamiento no disponible */
  }
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Cliente HTTP de la API.
 * @param {string} path  ej. '/raffles'
 * @param {object} opts  { method, body, headers, auth = true, form = false }
 */
export async function api(path, opts = {}) {
  const { method = 'GET', body, headers = {}, auth = true, form = false } = opts;

  const init = { method, headers: { Accept: 'application/json', ...headers } };

  if (auth) {
    const token = getToken();
    if (token) init.headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    if (form) {
      init.body = body; // FormData: el navegador setea el Content-Type
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiError(0, 'network', 'No pudimos conectar con el servidor. Revisá tu conexión.');
  }

  const raw = await res.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const err = data?.error || {};
    throw new ApiError(
      res.status,
      err.code || 'error',
      err.message || 'Ocurrió un error inesperado',
      err.details,
    );
  }

  return data;
}
