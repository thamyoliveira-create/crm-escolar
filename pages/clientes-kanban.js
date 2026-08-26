import { db } from '../db.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

let kanbanClients = [];
let allProfiles = [];
let allProjects = [];

export async function render(container) {
  container.innerHTML = `
    <div class="p-4 md:p-6 h-full flex flex-col">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Kanban de Clientes & Leads</h1>
          <p class="text-sm text-gray-500">Arraste os cards entre as colunas para atualizar a etapa comercial.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <select id="kanban-filtro-resp" class="border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Responsáveis</option>
          </select>
          <select id="kanban-filtro-proj" class="border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Projetos</option>
          </select>
          <button id="btn-novo-kanban-cliente" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors">
            <i class="fas fa-plus"></i> Novo Cliente
          </button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div class="flex gap-4 min-w-max h-full" id="kanban-board">
          ${renderColumn('novo_contato', 'Novo Contato', 'border-t-4 border-gray-400', 'bg-gray-100 text-gray-700')}
          ${renderColumn('interessado', 'Interessado', 'border-t-4 border-blue-500', 'bg-blue-100 text-blue-800')}
          ${renderColumn('proposta', 'Proposta', 'border-t-4 border-purple-500', 'bg-purple-100 text-purple-800')}
          ${renderColumn('negociacao', 'Negociação', 'border-t-4 border-amber-500', 'bg-amber-100 text-amber-800')}
          ${renderColumn('venda_concluida', 'Venda Concluída', 'border-t-4 border-green-500', 'bg-green-100 text-green-800')}
          ${renderColumn('desistencia', 'Desistência', 'border-t-4 border-red-500', 'bg-red-100 text-red-800')}
        </div>
      </div>
    </div>

    <div id="kanban-modal-root"></div>
  `;

  await loadKanbanData();
  setupEvents();
  setupDragAndDrop();
}

function renderColumn(id, title, borderClass, badgeClass) {
  return `
    <div class="w-72 flex flex-col rounded-xl bg-slate-100/90 border border-slate-200 shadow-sm ${borderClass} max-h-full">
      <div class="p-3 bg-white border-b border-slate-200 font-semibold flex justify-between items-center rounded-t-lg">
        <span class="text-sm font-bold text-gray-700">${title}</span>
        <span class="px-2 py-0.5 rounded-full text-xs font-bold ${badgeClass} count-badge">0</span>
      </div>
      <div class="p-3 flex-1 overflow-y-auto space-y-3 kanban-col custom-scrollbar min-h-[400px]" data-stage="${id}">
        <!-- Cards renderizados dinamicamente -->
      </div>
    </div>
  `;
}

function createKanbanCard(client) {
  const card = document.createElement('div');
  card.className = 'kanban-card bg-white p-3.5 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-all select-none';
  card.draggable = true;
  card.dataset.id = client.id;

  const resp = allProfiles.find(p => p.id === client.responsavel_id)?.nome || 'Não atribuído';
  const tipoLabel = {
    estudante: 'Estudante',
    familiar: 'Familiar',
    funcionario: 'Funcionário',
    comunidade: 'Comunidade',
    organizacao: 'Organização'
  }[client.tipo] || client.tipo || 'Geral';

  card.innerHTML = `
    <div class="flex justify-between items-start mb-1.5">
      <h4 class="font-bold text-gray-900 text-sm truncate flex-1">${client.nome}</h4>
      <span class="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">${tipoLabel}</span>
    </div>
    ${client.interesse ? `<p class="text-xs text-blue-600 font-medium mb-2 truncate"><i class="fas fa-tag mr-1 text-[10px]"></i>${client.interesse}</p>` : ''}
    <div class="text-xs text-gray-500 space-y-1 mb-2">
      <p class="flex items-center gap-1.5"><i class="fas fa-user-circle text-gray-400 w-3 text-center"></i><span class="truncate">${resp}</span></p>
      ${client.telefone ? `<p class="flex items-center gap-1.5"><i class="fas fa-phone text-gray-400 w-3 text-center"></i><a href="tel:${client.telefone}" class="text-blue-600 hover:underline">${client.telefone}</a></p>` : ''}
    </div>
    <div class="flex justify-between items-center pt-2 border-t border-gray-100 text-[11px] text-gray-400">
      <span><i class="far fa-calendar-alt mr-1"></i>${client.criado_em ? formatDate(client.criado_em.split('T')[0]) : 'Recente'}</span>
      <span class="text-gray-300 font-bold"><i class="fas fa-grip-lines"></i></span>
    </div>
  `;
  return card;
}

async function loadKanbanData() {
  const { data: clients } = await db.from('clientes');
  const { data: profiles } = await db.from('profiles');
  const { data: projects } = await db.from('projetos');

  kanbanClients = clients || [];
  allProfiles = profiles || [];
  allProjects = projects || [];

  // Popular selects de filtro
  const selectResp = document.getElementById('kanban-filtro-resp');
  const selectProj = document.getElementById('kanban-filtro-proj');

  if (selectResp && selectResp.options.length <= 1) {
    allProfiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nome;
      selectResp.appendChild(opt);
    });
  }

  if (selectProj && selectProj.options.length <= 1) {
    allProjects.forEach(prj => {
      const opt = document.createElement('option');
      opt.value = prj.id;
      opt.textContent = prj.nome;
      selectProj.appendChild(opt);
    });
  }

  renderCardsInColumns();
}

function renderCardsInColumns() {
  const respFilter = document.getElementById('kanban-filtro-resp')?.value;
  const projFilter = document.getElementById('kanban-filtro-proj')?.value;

  let filtered = kanbanClients.filter(c => c.ativo !== false);
  if (respFilter) filtered = filtered.filter(c => c.responsavel_id === respFilter);
  if (projFilter) filtered = filtered.filter(c => c.projeto_id === projFilter);

  // Limpar colunas
  document.querySelectorAll('.kanban-col').forEach(col => {
    col.innerHTML = '';
  });

  // Distribuir cards
  filtered.forEach(c => {
    const stage = c.etapa_comercial || 'novo_contato';
    const col = document.querySelector(`.kanban-col[data-stage="${stage}"]`);
    if (col) {
      col.appendChild(createKanbanCard(c));
    }
  });

  updateCounts();
}

let draggedCard = null;

function setupDragAndDrop() {
  const board = document.getElementById('kanban-board');
  if (!board) return;

  board.addEventListener('dragstart', e => {
    const card = e.target.closest('.kanban-card');
    if (card) {
      draggedCard = card;
      card.classList.add('opacity-50', 'scale-95');
      e.dataTransfer.setData('text/plain', card.dataset.id);
    }
  });

  board.addEventListener('dragend', e => {
    const card = e.target.closest('.kanban-card');
    if (card) {
      card.classList.remove('opacity-50', 'scale-95');
      draggedCard = null;
    }
  });

  const cols = document.querySelectorAll('.kanban-col');
  cols.forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      col.classList.add('bg-blue-50/70', 'ring-2', 'ring-blue-400');
    });

    col.addEventListener('dragleave', e => {
      col.classList.remove('bg-blue-50/70', 'ring-2', 'ring-blue-400');
    });

    col.addEventListener('drop', async e => {
      e.preventDefault();
      col.classList.remove('bg-blue-50/70', 'ring-2', 'ring-blue-400');
      if (draggedCard) {
        const clientId = draggedCard.dataset.id;
        const newStage = col.dataset.stage;

        col.appendChild(draggedCard);
        updateCounts();

        // Atualizar no banco de dados local
        const client = kanbanClients.find(c => c.id === clientId);
        if (client) {
          client.etapa_comercial = newStage;
          await db.from('clientes').eq('id', clientId).update({ etapa_comercial: newStage });
          showToast(`Cliente movido para "${getStageLabel(newStage)}"`, 'success');
        }
      }
    });
  });
}

function getStageLabel(stage) {
  const map = {
    novo_contato: 'Novo Contato',
    interessado: 'Interessado',
    proposta: 'Proposta',
    negociacao: 'Negociação',
    venda_concluida: 'Venda Concluída',
    desistencia: 'Desistência'
  };
  return map[stage] || stage;
}

function updateCounts() {
  document.querySelectorAll('.kanban-col').forEach(col => {
    const count = col.children.length;
    const badge = col.closest('.rounded-xl')?.querySelector('.count-badge');
    if (badge) badge.textContent = count;
  });
}

function setupEvents() {
  document.getElementById('kanban-filtro-resp')?.addEventListener('change', renderCardsInColumns);
  document.getElementById('kanban-filtro-proj')?.addEventListener('change', renderCardsInColumns);
  document.getElementById('btn-novo-kanban-cliente')?.addEventListener('click', openNovoClienteModal);
}

function openNovoClienteModal() {
  const modalRoot = document.getElementById('kanban-modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
        <div class="flex items-center justify-between border-b pb-3 mb-4">
          <h3 class="text-lg font-bold text-gray-800">Novo Cliente</h3>
          <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600 text-lg"><i class="fas fa-times"></i></button>
        </div>
        <form id="form-novo-cliente-kanban" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo *</label>
            <input type="text" id="k-nome" required class="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ex: Lucas Mendes">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo</label>
              <select id="k-tipo" class="w-full border rounded-lg p-2 text-sm">
                <option value="estudante">Estudante</option>
                <option value="familiar">Familiar</option>
                <option value="funcionario">Funcionário</option>
                <option value="comunidade">Comunidade</option>
                <option value="organizacao">Organização</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Etapa Inicial</label>
              <select id="k-etapa" class="w-full border rounded-lg p-2 text-sm">
                <option value="novo_contato">Novo Contato</option>
                <option value="interessado">Interessado</option>
                <option value="proposta">Proposta</option>
                <option value="negociacao">Negociação</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone</label>
              <input type="text" id="k-tel" class="w-full border rounded-lg p-2 text-sm" placeholder="(11) 98888-7777">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
              <input type="email" id="k-email" class="w-full border rounded-lg p-2 text-sm" placeholder="lucas@escola.edu">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Interesse / Produto</label>
            <input type="text" id="k-interesse" class="w-full border rounded-lg p-2 text-sm" placeholder="Ex: Bolsas ecológicas personalizadas">
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t mt-4">
            <button type="button" id="btn-cancelar-k" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Salvar Cliente</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('close-modal-btn')?.addEventListener('click', close);
  document.getElementById('btn-cancelar-k')?.addEventListener('click', close);

  document.getElementById('form-novo-cliente-kanban')?.addEventListener('submit', async e => {
    e.preventDefault();
    const novo = {
      nome: document.getElementById('k-nome').value.trim(),
      tipo: document.getElementById('k-tipo').value,
      etapa_comercial: document.getElementById('k-etapa').value,
      telefone: document.getElementById('k-tel').value.trim(),
      email: document.getElementById('k-email').value.trim(),
      interesse: document.getElementById('k-interesse').value.trim(),
      projeto_id: allProjects[0]?.id || null,
      responsavel_id: allProfiles[0]?.id || null,
      ativo: true,
      criado_em: new Date().toISOString()
    };

    const { data, error } = await db.from('clientes').insert(novo);
    if (!error) {
      showToast('Cliente cadastrado com sucesso!', 'success');
      close();
      await loadKanbanData();
    } else {
      showToast('Erro ao cadastrar cliente: ' + error.message, 'error');
    }
  });
}

export function cleanup() {
  kanbanClients = [];
}

