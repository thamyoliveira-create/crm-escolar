// db.js — Abstração de Banco de Dados (Supabase Real ou Mock Local)
import { supabaseMock, supabaseAuth as mockAuth } from './supabase-mock.js';
import { getAppConfig } from './config.js';

let _currentDb = supabaseMock;
let _currentAuth = mockAuth;
let _isRealSupabase = false;
let _initPromise = null;

// Inicializa a conexão com o Supabase real se configurado
export async function initDatabase() {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const config = await getAppConfig();
      if (config.isRealSupabase && config.supabaseUrl && config.supabaseAnonKey) {
        const { createClient } = window.supabase || {};
        if (typeof createClient === 'function') {
          const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storage: window.localStorage
            }
          });
          _currentDb = client;
          _currentAuth = client.auth;
          _isRealSupabase = true;
          console.info('⚡ [CRM Escolar] Conectado ao Supabase Real:', config.supabaseUrl);
          return { db: _currentDb, auth: _currentAuth, isRealSupabase: true };
        }
      }
    } catch (err) {
      console.warn('⚠️ [CRM Escolar] Falha ao conectar ao Supabase real, usando armazenamento local:', err);
    }

    _currentDb = supabaseMock;
    _currentAuth = mockAuth;
    _isRealSupabase = false;
    return { db: _currentDb, auth: _currentAuth, isRealSupabase: false };
  })();

  return _initPromise;
}

// Disparar inicialização em background imediatamente
initDatabase();

// Proxy transparente para db
export const db = new Proxy({}, {
  get(target, prop) {
    if (prop === 'from') {
      return (...args) => _currentDb.from(...args);
    }
    if (prop === 'auth') {
      return _currentAuth;
    }
    if (prop in _currentDb) {
      const val = _currentDb[prop];
      return typeof val === 'function' ? val.bind(_currentDb) : val;
    }
    return undefined;
  }
});

// Proxy transparente para auth
export const auth = new Proxy({}, {
  get(target, prop) {
    if (prop in _currentAuth) {
      const val = _currentAuth[prop];
      return typeof val === 'function' ? val.bind(_currentAuth) : val;
    }
    return undefined;
  }
});

export function isUsingRealSupabase() {
  return _isRealSupabase;
}

export default db;
