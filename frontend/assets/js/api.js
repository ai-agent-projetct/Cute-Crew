/* Cute Crew — tiny REST client */
const API = {
  token() { return localStorage.getItem('ll_token') || ''; },

  async request(path, opts = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (API.token()) headers.Authorization = `Bearer ${API.token()}`;
    if (opts.body instanceof FormData) delete headers['Content-Type'];
    const res = await fetch(`/api${path}`, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  },

  get(path) { return API.request(path); },
  post(path, body) { return API.request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }); },
  put(path, body) { return API.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
  patch(path, body) { return API.request(path, { method: 'PATCH', body: JSON.stringify(body) }); },
  del(path) { return API.request(path, { method: 'DELETE' }); }
};
window.API = API;
