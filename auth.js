// auth.js
import { auth, db } from './db.js';

let currentUserProfile = null;

export async function login(email, password) {
  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // Buscar perfil
  const { data: profileData } = await db.from('profiles').eq('email', email).limit(1);
  if (profileData && profileData.length > 0) {
    currentUserProfile = profileData[0];
    localStorage.setItem('user_profile', JSON.stringify(currentUserProfile));
  }
  
  return currentUserProfile;
}

export async function logout() {
  await auth.signOut();
  currentUserProfile = null;
  localStorage.removeItem('user_profile');
  window.location.href = 'index.html';
}

export function getCurrentUser() {
  if (!currentUserProfile) {
    const stored = localStorage.getItem('user_profile');
    if (stored) {
      currentUserProfile = JSON.parse(stored);
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
  if (!user || !roles.includes(user.perfil)) {
    window.location.hash = '#/dashboard';
    return false;
  }
  return true;
}

export function isAdmin() {
  const user = getCurrentUser();
  return user?.perfil === 'administrador';
}

export function isProfessor() {
  const user = getCurrentUser();
  return user?.perfil === 'professor';
}

export function isEstudante() {
  const user = getCurrentUser();
  return user?.perfil === 'estudante';
}

export function isConsulta() {
  const user = getCurrentUser();
  return user?.perfil === 'consulta';
}

export function canEdit() {
  const user = getCurrentUser();
  return user && ['administrador', 'professor', 'estudante'].includes(user.perfil);
}

export async function getEquipeAtual() {
  const user = getCurrentUser();
  if (!user || user.perfil !== 'estudante') return null;
  
  const { data: membro } = await db.from('equipe_membros').eq('estudante_id', user.id).limit(1);
  if (membro && membro.length > 0) {
    const { data: equipe } = await db.from('equipes').eq('id', membro[0].equipe_id).limit(1);
    return equipe ? equipe[0] : null;
  }
  return null;
}
