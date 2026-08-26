import { supabaseMock, supabaseAuth as mockAuth } from './supabase-mock.js';

// Verificar configuração do Supabase real
const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_KEY = window.SUPABASE_KEY || '';

let _db, _auth;

if (SUPABASE_URL && SUPABASE_KEY) {
  // Usar Supabase real (requer CDN do supabase-js)
  const { createClient } = window.supabase || {};
  if (createClient) {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    _db = client;
    _auth = client.auth;
  } else {
    _db = supabaseMock;
    _auth = mockAuth;
  }
} else {
  _db = supabaseMock;
  _auth = mockAuth;
}

export const db = _db;
export const auth = _auth;
export default _db;
