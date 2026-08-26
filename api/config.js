// api/config.js — Endpoint Serverless Vercel para expor apenas chaves PÚBLICAS do Supabase
// NUNCA expor SUPABASE_SERVICE_ROLE_KEY ou chaves privadas!

export default function handler(req, res) {
  // CORS & Cache
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas variáveis públicas são lidas
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return res.status(200).json({
    supabaseUrl: supabaseUrl.trim(),
    supabaseAnonKey: supabaseAnonKey.trim(),
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey)
  });
}
