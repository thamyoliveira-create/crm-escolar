// config.js — Gerenciador de Configuração do Ambiente do CRM Escolar
// Lê configurações dinamicamente via /api/config (Vercel) ou window.__ENV__

let _cachedConfig = null;

export async function getAppConfig() {
  if (_cachedConfig) return _cachedConfig;

  // 1. Verificar se window.__ENV__ ou variáveis globais já foram injetadas
  const globalEnv = window.__ENV__ || {};
  const globalUrl = globalEnv.SUPABASE_URL || window.SUPABASE_URL || '';
  const globalKey = globalEnv.SUPABASE_ANON_KEY || window.SUPABASE_KEY || window.SUPABASE_ANON_KEY || '';

  if (globalUrl && globalKey) {
    _cachedConfig = {
      supabaseUrl: globalUrl,
      supabaseAnonKey: globalKey,
      isRealSupabase: true
    };
    return _cachedConfig;
  }

  // 2. Tentar buscar da API Serverless da Vercel (/api/config)
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl && data.supabaseAnonKey) {
        _cachedConfig = {
          supabaseUrl: data.supabaseUrl,
          supabaseAnonKey: data.supabaseAnonKey,
          isRealSupabase: true
        };
        return _cachedConfig;
      }
    }
  } catch (err) {
    // Modo local / offline / sem backend serverless
  }

  // 3. Fallback: Usar armazenamento local mock
  _cachedConfig = {
    supabaseUrl: '',
    supabaseAnonKey: '',
    isRealSupabase: false
  };
  return _cachedConfig;
}
