// Supabase Client Helper for by.Nvdila CRM
// Mendukung integrasi REST langsung tanpa ketergantungan library eksternal

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project-id'));
};

export const getSupabaseConfig = () => ({
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  configured: isSupabaseConfigured(),
});

// Simple fetch-based REST client untuk Supabase
export const supabaseRest = {
  async get(table, query = '') {
    if (!isSupabaseConfigured()) return null;
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async insert(table, data) {
    if (!isSupabaseConfigured()) return null;
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async upsert(table, data) {
    if (!isSupabaseConfigured()) return null;
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(table, filterColumn, filterValue, data) {
    if (!isSupabaseConfigured()) return null;
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filterColumn}=eq.${encodeURIComponent(filterValue)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(table, filterColumn, filterValue) {
    if (!isSupabaseConfigured()) return null;
    const url = `${SUPABASE_URL}/rest/v1/${table}?${filterColumn}=eq.${encodeURIComponent(filterValue)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return true;
  },

  async rpc(functionName, params = {}) {
    if (!isSupabaseConfigured()) return null;
    const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
