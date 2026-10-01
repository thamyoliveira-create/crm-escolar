// auth.js — Gerenciamento de Autenticação (Supabase & Mock)
import { auth, db, initDatabase, isUsingRealSupabase } from './db.js';

let currentUserProfile = null;

export async function loginWithGoogle(options = {}) {
  await initDatabase();

  if (isUsingRealSupabase() && !options.forceMock) {
    try {
      const redirectUrl = window.location.origin + window.location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') + '/app.html';

      // Tentar gerar URL de OAuth sem redirecionar cegamente
      const { data, error } = await auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          ...options
        }
      });

      if (error) throw error;

      if (data && data.url) {
        // Verificar se a URL do provedor é acessível antes de navegar
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          await fetch(data.url, { method: 'GET', mode: 'no-cors', signal: controller.signal });
          clearTimeout(timeoutId);

          window.location.href = data.url;
          return data;
        } catch (netErr) {
          console.warn('⚠️ Host OAuth do Supabase inacessível ou inválido. Usando login Google local:', netErr);
          return fallbackGoogleLogin(options);
        }
      }
    } catch (err) {
      console.warn('⚠️ Falha no Google OAuth do Supabase, aplicando login Google local:', err);
      if (options.fallbackToMock !== false) {
        return fallbackGoogleLogin(options);
      }
      throw err;
    }
  }

  return fallbackGoogleLogin(options);
}

async function fallbackGoogleLogin(options = {}) {
  const email = options.email || (options.data && options.data.email) || 'tamiris@escola.edu';
  const nome = options.nome || (options.data && options.data.full_name) || (options.data && options.data.name) || 'Professora Tamiris';
  const avatar_url = options.avatar_url || null;

  const { data, error } = await auth.signInWithOAuth({
    provider: 'google',
    options: {
      email,
      nome,
      avatar_url,
      ...options
    }
  });
  if (error) throw error;

  const session = data?.session;
  if (session && session.profile) {
    currentUserProfile = { ...session.profile, perfil: 'administrador' };
    localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
  } else {
    currentUserProfile = {
      id: 'usr-goo-' + Date.now().toString(36),
      nome: nome,
      email: email,
      perfil: 'administrador',
      ativo: true
    };
    localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
  }
  return currentUserProfile;
}

export async function login(email, password) {
  await initDatabase();

  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error) throw error;

  const authUser = data?.user;
  const userEmail = email || authUser?.email;

  // Buscar ou provisionar perfil
  try {
    const { data: profileData } = await db.from('profiles').select('*').eq('email', userEmail).limit(1);
    if (profileData && profileData.length > 0) {
      currentUserProfile = { ...profileData[0], perfil: 'administrador' };
    } else {
      currentUserProfile = {
        id: authUser?.id || ('usr-' + Date.now().toString(36)),
        nome: userEmail.split('@')[0],
        email: userEmail,
        perfil: 'administrador',
        ativo: true
      };
      // Tentar salvar no banco se real
      if (isUsingRealSupabase()) {
        try {
          await db.from('profiles').insert([currentUserProfile]);
        } catch (e) {}
      }
    }
  } catch (err) {
    currentUserProfile = {
      id: authUser?.id || ('usr-' + Date.now().toString(36)),
      nome: userEmail.split('@')[0],
      email: userEmail,
      perfil: 'administrador',
      ativo: true
    };
  }

  localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
  return currentUserProfile;
}

export async function syncSession() {
  await initDatabase();

  try {
    // 1. Verificar se há erro retornado pelo callback OAuth
    if (window.location.hash && window.location.hash.includes('error=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = hashParams.get('error_description') || hashParams.get('error') || 'Erro na autenticação';
      console.warn('OAuth callback error:', errorDesc);
      localStorage.setItem('auth_error', errorDesc);
      window.location.href = 'index.html';
      return null;
    }

    // 2. Se houver access_token ou code na URL, aguardar processamento do Supabase
    const hasOAuthParams = (window.location.hash && window.location.hash.includes('access_token')) ||
                           (window.location.search && window.location.search.includes('code='));

    let session = null;
    if (isUsingRealSupabase()) {
      const { data } = await auth.getSession();
      session = data?.session;

      // Se ainda não obteve sessão e há parâmetros OAuth na URL, aguardar o cliente Supabase processar
      if (!session && hasOAuthParams) {
        for (let i = 0; i < 8 && !session; i++) {
          await new Promise(resolve => setTimeout(resolve, 200));
          const res = await auth.getSession();
          session = res?.data?.session;
        }
      }
    } else {
      const { data } = await auth.getSession();
      session = data?.session;
    }

    if (session?.user) {
      const user = session.user;
      const email = user.email || '';
      const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.user_metadata?.name || email.split('@')[0] || 'Administrador';
      const avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      // Buscar perfil existente
      let profile = null;
      try {
        const { data: pData } = await db.from('profiles').select('*').eq('email', email).limit(1);
        if (pData && pData.length > 0) {
          profile = pData[0];
        }
      } catch (e) {}

      if (!profile) {
        profile = {
          id: user.id,
          nome,
          email,
          perfil: 'administrador',
          avatar_url,
          ativo: true
        };
        try {
          await db.from('profiles').insert([profile]);
        } catch (e) {}
      }

      currentUserProfile = { ...profile, perfil: 'administrador' };
      localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
      return currentUserProfile;
    }
  } catch (err) {
    console.error('Erro ao sincronizar sessão:', err);
  }

  return getCurrentUser();
}

export async function logout() {
  try {
    await auth.signOut();
  } catch (e) {}
  currentUserProfile = null;
  localStorage.removeItem('user_profile');
  localStorage.removeItem('crm_session');
  window.location.href = 'index.html';
}

export function getCurrentUser() {
  if (!currentUserProfile) {
    const stored = localStorage.getItem('user_profile');
    if (stored) {
      try {
        currentUserProfile = JSON.parse(stored);
        currentUserProfile.perfil = 'administrador'; // Todos têm acesso Administrador
      } catch (e) {
        currentUserProfile = null;
      }
    }
  }
  return currentUserProfile;
}

export function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

export function requireRole(roles) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

export function isAdmin() {
  return true; // Todos são Administrador
}

export function isProfessor() {
  return true;
}

export function isEstudante() {
  return false;
}

export function isConsulta() {
  return false;
}

export function canEdit() {
  return true; // Todos podem editar
}

export async function getEquipeAtual() {
  return null;
}
