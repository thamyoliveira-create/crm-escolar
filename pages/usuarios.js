import { db } from '../db.js';
import { showToast } from '../utils.js';

let containerElement;

export async function render(container) {
  containerElement = container;
  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Gestão de Usuários & Perfis</h1>
          <p class="text-xs text-gray-500">Cadastre professores, líderes de vendas e estudantes das miniempresas.</p>
        </div>
        <button id="btn-novo-usuario" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2">
          <i class="fa-solid fa-user-plus"></i> Novo Usuário / Aluno
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 bg-slate-50">
          <div class="relative flex-1">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400 text-xs"></i>
            <input type="text" id="filtro-busca" placeholder="Buscar por nome ou e-mail..." class="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500">
          </div>
          <select id="filtro-perfil" class="rounded-lg border border-gray-300 text-xs p-2 bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Perfis</option>
            <option value="administrador">Administrador</option>
            <option value="professor">Professor / Orientador</option>
            <option value="estudante">Estudante / Miniempresário</option>
          </select>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Papel Pedagógico</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Privilégio</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody id="usuarios-tbody" class="bg-white divide-y divide-gray-100">
              <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-400 text-xs">Carregando usuários...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Usuário -->
    <div id="usuario-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md my-6 animate-fadeIn">
        <div class="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 class="text-lg font-bold text-gray-800" id="modal-title">Novo Usuário</h2>
          <button id="btn-close-modal" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-6">
          <form id="usuario-form" class="space-y-4">
            <input type="hidden" id="usuario-id">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo *</label>
              <input type="text" id="usuario-nome" required placeholder="Ex: Lucas Mendes" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail Institucional *</label>
              <input type="email" id="usuario-email" required placeholder="lucas@escola.edu" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Função / Perfil</label>
              <select id="usuario-perfil" required class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
                <option value="estudante">Estudante (Líder Comercial / Financeiro)</option>
                <option value="professor">Professor(a) / Orientador(a)</option>
                <option value="administrador">Administrador Geral</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" id="btn-cancel-modal" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200">Cancelar</button>
              <button type="submit" class="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow">Salvar Perfil</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-novo-usuario')?.addEventListener('click', () => openModal());
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
  document.getElementById('usuario-form')?.addEventListener('submit', saveUsuario);

  document.getElementById('filtro-busca')?.addEventListener('input', renderTable);
  document.getElementById('filtro-perfil')?.addEventListener('change', renderTable);

  await loadUsuarios();
}

let allUsuarios = [];

async function loadUsuarios() {
  try {
    const { data: usuarios } = await db.from('profiles').select('*').order('nome');
    allUsuarios = usuarios || [];
    renderTable();
  } catch (e) {
    console.error(e);
    const tbody = document.getElementById('usuarios-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500 text-xs">Erro ao carregar usuários.</td></tr>';
  }
}

function renderTable() {
  const tbody = document.getElementById('usuarios-tbody');
  if (!tbody) return;

  const busca = (document.getElementById('filtro-busca')?.value || '').toLowerCase();
  const perfilFiltro = document.getElementById('filtro-perfil')?.value || '';

  const filtrados = allUsuarios.filter(u => {
    if (perfilFiltro && (u.perfil !== perfilFiltro && u.role !== perfilFiltro)) return false;
    if (busca) {
      const matchName = (u.nome || '').toLowerCase().includes(busca);
      const matchEmail = (u.email || '').toLowerCase().includes(busca);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  tbody.innerHTML = '';

  if (filtrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400 text-xs">Nenhum usuário encontrado.</td></tr>';
    return;
  }

  filtrados.forEach(u => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';

    const p = u.perfil || u.role || 'estudante';
    let badgeClass = 'bg-emerald-100 text-emerald-800';
    let labelPerfil = 'Estudante';
    if (p === 'admin' || p === 'administrador') {
      badgeClass = 'bg-purple-100 text-purple-800';
      labelPerfil = 'Administrador';
    } else if (p === 'professor') {
      badgeClass = 'bg-blue-100 text-blue-800';
      labelPerfil = 'Professor Orientador';
    }

    const initial = (u.nome || u.email || 'U').substring(0, 1).toUpperCase();

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
            ${initial}
          </div>
          <div>
            <div class="text-xs font-bold text-gray-900">${u.nome || 'Sem Nome'}</div>
            <div class="text-[11px] text-gray-500">${u.email || ''}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2.5 py-0.5 inline-flex text-[11px] font-bold rounded-full ${badgeClass}">
          ${labelPerfil}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <i class="fa-solid fa-shield-halved text-[10px]"></i> Acesso Completo
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-0.5 inline-flex text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Ativo
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
        <button class="text-blue-600 hover:text-blue-800 font-bold edit-btn px-2 py-1 rounded hover:bg-blue-50"><i class="fa-solid fa-pencil mr-1"></i>Editar</button>
      </td>
    `;

    tr.querySelector('.edit-btn')?.addEventListener('click', () => openModal(u));
    tbody.appendChild(tr);
  });
}

function openModal(usuario = null) {
  const modal = document.getElementById('usuario-modal');
  const form = document.getElementById('usuario-form');
  document.getElementById('modal-title').textContent = usuario ? 'Editar Perfil de Usuário' : 'Novo Usuário';

  if (usuario) {
    document.getElementById('usuario-id').value = usuario.id;
    document.getElementById('usuario-nome').value = usuario.nome || '';
    document.getElementById('usuario-email').value = usuario.email || '';
    document.getElementById('usuario-perfil').value = usuario.perfil || usuario.role || 'estudante';
  } else {
    form?.reset();
    document.getElementById('usuario-id').value = '';
  }

  modal?.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('usuario-modal')?.classList.add('hidden');
}

async function saveUsuario(e) {
  e.preventDefault();

  const id = document.getElementById('usuario-id').value;
  const nome = document.getElementById('usuario-nome').value.trim();
  const email = document.getElementById('usuario-email').value.trim();
  const perfil = document.getElementById('usuario-perfil').value;

  const data = {
    nome,
    email,
    perfil,
    role: perfil,
    ativo: true
  };

  try {
    if (id) {
      const { error } = await db.from('profiles').update(data).eq('id', id);
      if (error) throw error;
      showToast('Perfil atualizado com sucesso!', 'success');
    } else {
      const { error } = await db.from('profiles').insert([data]);
      if (error) throw error;
      showToast('Usuário cadastrado com sucesso!', 'success');
    }

    closeModal();
    await loadUsuarios();
  } catch (error) {
    console.error(error);
    showToast('Erro ao salvar usuário: ' + error.message, 'error');
  }
}

export function cleanup() {
  containerElement = null;
  allUsuarios = [];
}
