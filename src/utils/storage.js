const LOCAL_KEY = 'rojas-state';
const AUTH_KEY = 'rojas-key';

export const getKey = () => sessionStorage.getItem(AUTH_KEY) || '';
export const setKey = (value) => sessionStorage.setItem(AUTH_KEY, value);
export const clearKey = () => sessionStorage.removeItem(AUTH_KEY);

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
    const stores = localStorage.getItem('rojas-stores');
    const schedule = localStorage.getItem('rojas-schedule');
    if (stores && schedule) {
      return {
        stores: JSON.parse(stores),
        schedule: JSON.parse(schedule),
        batch: JSON.parse(localStorage.getItem('rojas-batch') || '[]')
      };
    }
  } catch {
    return null;
  }
  return null;
}

function writeLocal(doc) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(doc));
  } catch {
    return;
  }
}

export async function verifyPassword(password) {
  try {
    const res = await fetch('/api/state', { headers: { 'x-admin-key': password } });
    if (res.status === 401) return 'invalid';
    if (res.ok) return 'ok';
    return 'offline';
  } catch {
    return 'offline';
  }
}

export async function loadState() {
  try {
    const res = await fetch('/api/state', { headers: { 'x-admin-key': getKey() } });
    if (res.ok) {
      const { data } = await res.json();
      if (data) {
        writeLocal(data);
        return { data, remote: true };
      }
      return { data: readLocal(), remote: true };
    }
  } catch {
    return { data: readLocal(), remote: false };
  }
  return { data: readLocal(), remote: false };
}

export async function saveState(doc, remote) {
  writeLocal(doc);
  if (!remote) return true;
  try {
    const res = await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': getKey() },
      body: JSON.stringify(doc)
    });
    return res.ok;
  } catch {
    return false;
  }
}