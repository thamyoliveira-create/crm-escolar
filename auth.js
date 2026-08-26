// auth.js — Gerenciamento de Autenticação (Supabase & Mock)
import { auth, db, initDatabase, isUsingRealSupabase } from './db.js';

let currentUserProfile = null;

export async function loginWithGoogle(options = {}) {
  await initDatabase();

  if (isUsingRealSupabase()) {
    // Supabase Real: Redirecionar para o fluxo OAuth oficial do Google
    const redirectUrl = window.location.origin + window.location.pathname.replace(/index\.html$/, '') + 'app.html';
    const { data, error } = await auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        ...options
      }
    });
    if (error) throw error;
    return data;
  } else {
    // Mock Local: Simula login com Google
    const { data, error } = await auth.signInWithOAuth({
      provider: 'google',
      options
    });
    if (error) throw error;

    const session = data?.session;
    if (session && session.profile) {
      currentUserProfile = { ...session.profile, perfil: 'administrador' };
      localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
    }
    return currentUserProfile;
  }
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
    const { data } = await auth.getSession();
    const session = data?.session;

    if (session?.user) {
      const user = session.user;
      const email = user.email || '';
      const nome = user.user_metadata?.full_name || user.user_metadata?.nome || email.split('@')[0] || 'Administrador';

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
