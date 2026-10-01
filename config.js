// config.js — Gerenciador de Configuração do Ambiente do CRM Escolar
// Lê configurações dinamicamente via /api/config (Vercel), window.__ENV__ ou config.local.js

let _cachedConfig = null;

function isValidSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return false;
  if (trimmed.includes('SEU-PROJETO') ||
      trimmed.includes('your-project') ||
      trimmed.includes('example.supabase.co')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.hostname.endsWith('.supabase.co') || parsed.hostname.includes('supabase');
  } catch (e) {
    return false;
  }
}

export async function getAppConfig() {
  if (_cachedConfig) return _cachedConfig;

  // 1. Verificar se window.__ENV__ ou variáveis globais já foram injetadas
  const globalEnv = window.__ENV__ || {};
  const globalUrl = (globalEnv.SUPABASE_URL || globalEnv.NEXT_PUBLIC_SUPABASE_URL || window.SUPABASE_URL || '').trim();
  const globalKey = (globalEnv.SUPABASE_ANON_KEY || globalEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || globalEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || window.SUPABASE_KEY || window.SUPABASE_ANON_KEY || '').trim();

  if (isValidSupabaseUrl(globalUrl) && globalKey && !globalKey.includes('sua-chave')) {
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
      if (isValidSupabaseUrl(data.supabaseUrl) && data.supabaseAnonKey && !data.supabaseAnonKey.includes('sua-chave')) {
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
