import { createClient } from '@supabase/supabase-js';

// Supabase Credentials
export const SU = 'https://nwkoqyoakfyhdnezliil.supabase.co';
export const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a29xeW9ha2Z5aGRuZXpsaWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTUzNDQsImV4cCI6MjA5MzU5MTM0NH0.Ev0-6RprJKHSjbGijNJ8QY8xqKhsHFFEu1EY9dcMF7M';

// Official Supabase JS SDK Client
export const supabase = createClient(SU, SK);

// Headers for direct fetch requests
export const SH = {
  'Content-Type': 'application/json',
  'apikey': SK,
  'Authorization': 'Bearer ' + SK
};

// ── BACKWARDS COMPATIBILITY WRAPPERS (Direct Supabase REST fetches) ──

/**
 * Perform a GET query.
 * @param {string} table 
 * @param {string} query 
 */
export const sGet = (table, query = '') => 
  fetch(`${SU}/rest/v1/${table}?${query}`, { headers: SH })
    .then(async res => {
      if (!res.ok) {
        let errMsg = `sGet from "${table}" failed: ${res.statusText}`;
        try {
          const errBody = await res.json();
          if (errBody && errBody.message) errMsg += ` - ${errBody.message}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      return res.json();
    });

/**
 * Perform a POST query.
 * @param {string} table 
 * @param {object} data 
 */
export const sPost = (table, data) => 
  fetch(`${SU}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SH, 'Prefer': 'return=representation' },
    body: JSON.stringify(data)
  })
    .then(async res => {
      if (!res.ok) {
        let errMsg = `sPost to "${table}" failed: ${res.statusText}`;
        try {
          const errBody = await res.json();
          if (errBody && errBody.message) errMsg += ` - ${errBody.message}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    });

/**
 * Perform a PATCH query on a specific row ID.
 * @param {string} table 
 * @param {number|string} id 
 * @param {object} data 
 */
export const sPatch = (table, id, data) => 
  fetch(`${SU}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: SH,
    body: JSON.stringify(data)
  })
    .then(async res => {
      if (!res.ok) {
        let errMsg = `sPatch on "${table}" (id=${id}) failed: ${res.statusText}`;
        try {
          const errBody = await res.json();
          if (errBody && errBody.message) errMsg += ` - ${errBody.message}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      return res;
    });

/**
 * Perform a DELETE query on a specific query parameter.
 * @param {string} table 
 * @param {string} query 
 */
export const sDelQ = (table, query) => 
  fetch(`${SU}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: SH
  })
    .then(async res => {
      if (!res.ok) {
        let errMsg = `sDelQ on "${table}" failed: ${res.statusText}`;
        try {
          const errBody = await res.json();
          if (errBody && errBody.message) errMsg += ` - ${errBody.message}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      return res;
    });

/**
 * Perform a DELETE query on a specific row ID.
 * @param {string} table 
 * @param {number|string} id 
 */
export const sDel = (table, id) => 
  fetch(`${SU}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: SH
  })
    .then(async res => {
      if (!res.ok) {
        let errMsg = `sDel on "${table}" (id=${id}) failed: ${res.statusText}`;
        try {
          const errBody = await res.json();
          if (errBody && errBody.message) errMsg += ` - ${errBody.message}`;
        } catch (_) {}
        throw new Error(errMsg);
      }
      return res;
    });
