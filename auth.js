// auth.js
import { auth, db } from './db.js';

let currentUserProfile = null;

export async function loginWithGoogle(options = {}) {
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

export async function login(email, password) {
  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // Buscar perfil
  const { data: profileData } = await db.from('profiles').eq('email', email).limit(1);
  if (profileData && profileData.length > 0) {
    currentUserProfile = { ...profileData[0], perfil: 'administrador' };
    localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
  } else {
    currentUserProfile = {
      id: 'usr-' + Date.now().toString(36),
      nome: email.split('@')[0],
      email: email,
      perfil: 'administrador',
      ativo: true
    };
    localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
  }
  
  return currentUserProfile;
}

export async function logout() {
  await auth.signOut();
  currentUserProfile = null;
  localStorage.removeItem('user_profile');
  localStorage.removeItem('crm_session');
  window.location.href = 'index.html';
}

export function getCurrentUser() {
  if (!currentUserProfile) {
    const stored = localStorage.getItem('user_profile');
    if (stored) {
      currentUserProfile = JSON.parse(stored);
      currentUserProfile.perfil = 'administrador'; // Todos são Administrador
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
  // Todos os usuários autenticados têm papel de administrador e acesso irrestrito
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

