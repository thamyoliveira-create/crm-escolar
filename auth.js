// auth.js — Gerenciamento de Autenticação (Supabase & Mock)
import { auth, db, initDatabase, isUsingRealSupabase } from './db.js';

const STAFF_EMAILS = {
  'tamiris@escola.edu': 'administrador',
  'thamyoliveira0@gmail.com': 'administrador'
};

let currentUserProfile = null;
let cachedEquipeIds = null;
let cachedProjetoIds = null;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function roleForEmail(email) {
  return STAFF_EMAILS[normalizeEmail(email)] || 'estudante';
}

function normalizeProfile(profile = {}) {
  const email = normalizeEmail(profile.email);
  const perfil = profile.perfil || profile.role || roleForEmail(email);
  return {
    ...profile,
    email,
    perfil,
    role: perfil,
    ativo: profile.ativo !== false
  };
}

function profileNameFromEmail(email) {
  return String(email || 'usuario@escola.edu')
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

async function loadOrCreateProfile({ id, user_id, email, nome, avatar_url }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  let profile = null;
  try {
    const { data } = await db.from('profiles').select('*').eq('email', normalizedEmail).limit(1);
    if (data && data.length > 0) profile = data[0];
  } catch (e) {}

  if (!profile) {
    profile = {
      id: id || user_id || ('usr-' + Date.now().toString(36)),
      user_id: user_id || null,
      nome: nome || profileNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      perfil: roleForEmail(normalizedEmail),
      role: roleForEmail(normalizedEmail),
      avatar_url: avatar_url || null,
      ativo: true
    };

    try {
      await db.from('profiles').insert([profile]);
    } catch (e) {}
  } else {
    profile = normalizeProfile(profile);
    const updates = {};
    if (user_id && !profile.user_id) updates.user_id = user_id;
    if (avatar_url && !profile.avatar_url) updates.avatar_url = avatar_url;
    if (Object.keys(updates).length > 0) {
      try {
        await db.from('profiles').update(updates).eq('id', profile.id);
        profile = { ...profile, ...updates };
      } catch (e) {}
    }
  }

  currentUserProfile = normalizeProfile(profile);
  localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
  cachedEquipeIds = null;
  cachedProjetoIds = null;
  return currentUserProfile;
}

export async function loginWithGoogle(options = {}) {
  await initDatabase();

  if (isUsingRealSupabase() && !options.forceMock) {
    const redirectUrl = window.location.origin + window.location.pathname.replace(/index\.html$/, '').replace(/\/$/, '') + '/app.html';
    const { data, error } = await auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        ...options
      }
    });
    if (error) throw error;
    return data;
  }

  return fallbackGoogleLogin(options);
}

async function fallbackGoogleLogin(options = {}) {
  const email = normalizeEmail(options.email || options.data?.email || 'tamiris@escola.edu');
  const nome = options.nome || options.data?.full_name || options.data?.name || profileNameFromEmail(email);
  const avatar_url = options.avatar_url || null;

  const { data, error } = await auth.signInWithOAuth({
    provider: 'google',
    options: { email, nome, avatar_url, ...options }
  });
  if (error) throw error;

  const session = data?.session;
  const authUser = session?.user;
  return loadOrCreateProfile({
    id: session?.profile?.id || authUser?.id,
    user_id: authUser?.id,
    email,
    nome,
    avatar_url
  });
}

export async function login(email, password) {
  await initDatabase();

  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error) throw error;

  const authUser = data?.user;
  const userEmail = normalizeEmail(email || authUser?.email);
  return loadOrCreateProfile({
    id: authUser?.id,
    user_id: authUser?.id,
    email: userEmail,
    nome: authUser?.user_metadata?.full_name || profileNameFromEmail(userEmail),
    avatar_url: authUser?.user_metadata?.avatar_url || null
  });
}

export async function syncSession() {
  await initDatabase();

  try {
    if (window.location.hash && window.location.hash.includes('error=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = hashParams.get('error_description') || hashParams.get('error') || 'Erro na autenticação';
      localStorage.setItem('auth_error', errorDesc);
      window.location.href = 'index.html';
      return null;
    }

    const hasOAuthParams = (window.location.hash && window.location.hash.includes('access_token')) ||
                           (window.location.search && window.location.search.includes('code='));

    let session = null;
    const { data } = await auth.getSession();
    session = data?.session;

    if (!session && isUsingRealSupabase() && hasOAuthParams) {
      for (let i = 0; i < 8 && !session; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const res = await auth.getSession();
        session = res?.data?.session;
      }
    }

    if (session?.user) {
      const user = session.user;
      const email = normalizeEmail(user.email || session.profile?.email);
      const nome = user.user_metadata?.full_name || user.user_metadata?.nome || user.user_metadata?.name || session.profile?.nome || profileNameFromEmail(email);
      const avatar_url = user.user_metadata?.avatar_url || user.user_metadata?.picture || session.profile?.avatar_url || null;

      return loadOrCreateProfile({
        id: session.profile?.id || user.id,
        user_id: user.id,
        email,
        nome,
        avatar_url
      });
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
  cachedEquipeIds = null;
  cachedProjetoIds = null;
  localStorage.removeItem('user_profile');
  localStorage.removeItem('crm_session');
  window.location.href = 'index.html';
}

export function getCurrentUser() {
  if (!currentUserProfile) {
    const stored = localStorage.getItem('user_profile');
    if (stored) {
      try {
        currentUserProfile = normalizeProfile(JSON.parse(stored));
      } catch (e) {
        currentUserProfile = null;
      }
    }
  }
  return currentUserProfile;
}

export function getUserRole(user = getCurrentUser()) {
  return user?.perfil || user?.role || 'estudante';
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
  if (!roles || roles.includes('all') || roles.includes(getUserRole(user))) return true;
  window.location.hash = '#/dashboard';
  return false;
}

export function isAdmin() {
  return getUserRole() === 'administrador';
}

export function isProfessor() {
  return getUserRole() === 'professor';
}

export function isEstudante() {
  return getUserRole() === 'estudante';
}

export function isConsulta() {
  return getUserRole() === 'consulta';
}

export function isTeacherOrAdmin() {
  return ['administrador', 'professor'].includes(getUserRole());
}

export function canEdit() {
  return isTeacherOrAdmin();
}

export function canManageStructure() {
  return isTeacherOrAdmin();
}

export function canManageSettings() {
  return isAdmin();
}

export function canManagePedagogy() {
  return isTeacherOrAdmin();
}

export function canDeleteData() {
  return isTeacherOrAdmin();
}

export async function getAllowedEquipeIds() {
  const user = getCurrentUser();
  if (!user) return [];
  if (isTeacherOrAdmin()) return null;
  if (cachedEquipeIds) return cachedEquipeIds;

  try {
    const { data } = await db.from('equipe_membros').select('*').eq('estudante_id', user.id);
    cachedEquipeIds = (data || []).map(m => m.equipe_id).filter(Boolean);
  } catch (e) {
    cachedEquipeIds = [];
  }
  return cachedEquipeIds;
}

export async function getAllowedProjetoIds() {
  if (isTeacherOrAdmin()) return null;
  if (cachedProjetoIds) return cachedProjetoIds;

  const equipeIds = await getAllowedEquipeIds();
  if (!equipeIds || equipeIds.length === 0) {
    cachedProjetoIds = [];
    return cachedProjetoIds;
  }

  try {
    const { data } = await db.from('equipes').select('*');
    cachedProjetoIds = [...new Set((data || [])
      .filter(e => equipeIds.includes(e.id) && e.projeto_id)
      .map(e => e.projeto_id))];
  } catch (e) {
    cachedProjetoIds = [];
  }
  return cachedProjetoIds;
}

export async function getEquipeAtual() {
  const ids = await getAllowedEquipeIds();
  return Array.isArray(ids) && ids.length === 1 ? ids[0] : null;
}

export async function filterByAllowedEquipes(records, field = 'equipe_id') {
  if (isTeacherOrAdmin()) return records || [];
  const equipeIds = await getAllowedEquipeIds();
  return (records || []).filter(record => equipeIds.includes(record[field]));
}

export function isAllowedEquipe(equipeId) {
  if (isTeacherOrAdmin()) return true;
  return Array.isArray(cachedEquipeIds) && cachedEquipeIds.includes(equipeId);
}
