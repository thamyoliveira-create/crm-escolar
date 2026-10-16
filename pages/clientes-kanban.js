import { db } from '../db.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

let kanbanClients = [];
let allProfiles = [];
let allProjects = [];

export async function render(container) {
  container.innerHTML = `
    <div class="p-4 md:p-6 h-full flex flex-col space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Kanban de Clientes & Leads (Funil da Turma)</h1>
          <p class="text-sm text-gray-500">Arraste os cards entre as colunas para atualizar a etapa comercial e gerenciar o time de vendas.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button id="btn-novo-kanban-cliente" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors">
            <i class="fas fa-plus"></i> Novo Cliente / Lead
          </button>
        </div>
      </div>

      <!-- KPI Summary Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" id="kanban-kpis"></div>

      <!-- Filtros e Busca -->
      <div class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <i class="fas fa-search text-xs"></i>
            </span>
            <input type="text" id="kanban-search-input" placeholder="Buscar por nome, telefone ou interesse..." class="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        <div class="w-48">
          <select id="kanban-filtro-resp" class="w-full border border-gray-200 rounded-lg p-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Responsáveis</option>
          </select>
        </div>
        <div class="w-48">
          <select id="kanban-filtro-proj" class="w-full border border-gray-200 rounded-lg p-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="">Todos os Projetos</option>
          </select>
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
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-gray-400 col-total-val">$0</span>
          <span class="px-2 py-0.5 rounded-full text-xs font-bold ${badgeClass} count-badge">0</span>
        </div>
      </div>
      <div class="p-3 flex-1 overflow-y-auto space-y-3 kanban-col custom-scrollbar min-h-[400px]" data-stage="${id}">
        <!-- Cards renderizados dinamicamente -->
      </div>
    </div>
  `;
}

function createKanbanCard(client) {
  const card = document.createElement('div');
  card.className = 'kanban-card bg-white p-3.5 rounded-lg shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-all select-none group relative';
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

  const cleanPhone = client.telefone ? client.telefone.replace(/\D/g, '') : '';
  const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(client.nome)},%20tudo%20bem?%20Falamos%20da%20miniempresa.` : '';

  card.innerHTML = `
    <div class="flex justify-between items-start mb-1.5">
      <h4 class="font-bold text-gray-900 text-sm truncate flex-1 cursor-pointer hover:text-blue-600 title-click">${client.nome}</h4>
      <span class="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">${tipoLabel}</span>
    </div>
    ${client.interesse ? `<p class="text-xs text-blue-600 font-medium mb-2 truncate"><i class="fas fa-tag mr-1 text-[10px]"></i>${client.interesse}</p>` : ''}
    <div class="text-xs text-gray-500 space-y-1 mb-2">
      <p class="flex items-center gap-1.5"><i class="fas fa-user-circle text-gray-400 w-3 text-center"></i><span class="truncate">${resp}</span></p>
      <div class="flex items-center justify-between">
        ${client.telefone ? `<p class="flex items-center gap-1.5"><i class="fas fa-phone text-gray-400 w-3 text-center"></i><a href="tel:${client.telefone}" class="text-blue-600 hover:underline">${client.telefone}</a></p>` : '<span></span>'}
        ${waLink ? `<a href="${waLink}" target="_blank" title="Abrir WhatsApp" class="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1 rounded transition-colors"><i class="fab fa-whatsapp"></i></a>` : ''}
      </div>
      ${client.valor_estimado ? `<p class="text-xs font-bold text-gray-700 mt-1"><i class="fas fa-dollar-sign text-green-600 mr-1"></i>${formatCurrency(client.valor_estimado)}</p>` : ''}
    </div>
    <div class="flex justify-between items-center pt-2 border-t border-gray-100 text-[11px] text-gray-400">
      <span><i class="far fa-calendar-alt mr-1"></i>${client.criado_em ? formatDate(client.criado_em.split('T')[0]) : 'Recente'}</span>
      <span class="text-gray-300 group-hover:text-blue-500 transition-colors font-bold"><i class="fas fa-grip-lines"></i></span>
    </div>
  `;

  // Clique no título ou card para abrir detalhes/edição
  card.querySelector('.title-click')?.addEventListener('click', () => {
    openEditarClienteModal(client);
  });

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
  renderKanbanKPIs();
}

function renderKanbanKPIs() {
  const container = document.getElementById('kanban-kpis');
  if (!container) return;

  const ativos = kanbanClients.filter(c => c.ativo !== false);
  const pipeline = ativos.filter(c => !['venda_concluida', 'desistencia'].includes(c.etapa_comercial));
  const concluidos = ativos.filter(c => c.etapa_comercial === 'venda_concluida');
  const valorTotal = pipeline.reduce((sum, c) => sum + (Number(c.valor_estimado) || 0), 0);

  const kpis = [
    { label: 'Total de Leads', value: ativos.length, color: 'blue', icon: 'fa-users' },
    { label: 'Em Negociação', value: pipeline.length, color: 'amber', icon: 'fa-spinner' },
    { label: 'Vendas Concluídas', value: concluidos.length, color: 'green', icon: 'fa-handshake' },
    { label: 'Valor no Pipeline', value: formatCurrency(valorTotal), color: 'purple', icon: 'fa-sack-dollar' }
  ];

  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  container.innerHTML = kpis.map(k => `
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-3.5 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl ${colors[k.color]} flex items-center justify-center flex-shrink-0 text-lg">
        <i class="fas ${k.icon}"></i>
      </div>
      <div>
        <p class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">${k.label}</p>
        <p class="text-base font-extrabold text-gray-900">${k.value}</p>
      </div>
    </div>
  `).join('');
}

function renderCardsInColumns() {
  const respFilter = document.getElementById('kanban-filtro-resp')?.value;
  const projFilter = document.getElementById('kanban-filtro-proj')?.value;
  const searchFilter = document.getElementById('kanban-search-input')?.value.toLowerCase().trim() || '';

  let filtered = kanbanClients.filter(c => c.ativo !== false);
  if (respFilter) filtered = filtered.filter(c => c.responsavel_id === respFilter);
  if (projFilter) filtered = filtered.filter(c => c.projeto_id === projFilter);
  if (searchFilter) {
    filtered = filtered.filter(c =>
      (c.nome && c.nome.toLowerCase().includes(searchFilter)) ||
      (c.interesse && c.interesse.toLowerCase().includes(searchFilter)) ||
      (c.telefone && c.telefone.includes(searchFilter)) ||
      (c.email && c.email.toLowerCase().includes(searchFilter))
    );
  }

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

  updateCountsAndValues(filtered);
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
        renderCardsInColumns();

        // Atualizar no banco de dados local
        const client = kanbanClients.find(c => c.id === clientId);
        if (client) {
          client.etapa_comercial = newStage;
          await db.from('clientes').update({ etapa_comercial: newStage }).eq('id', clientId);
          showToast(`Cliente movido para "${getStageLabel(newStage)}"`, 'success');
          renderKanbanKPIs();
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

function updateCountsAndValues(filteredClients) {
  document.querySelectorAll('.kanban-col').forEach(col => {
    const stage = col.dataset.stage;
    const cardsInCol = filteredClients.filter(c => (c.etapa_comercial || 'novo_contato') === stage);
    const count = cardsInCol.length;
    const valSum = cardsInCol.reduce((sum, c) => sum + (Number(c.valor_estimado) || 0), 0);

    const cardContainer = col.closest('.rounded-xl');
    const badge = cardContainer?.querySelector('.count-badge');
    const valSpan = cardContainer?.querySelector('.col-total-val');

    if (badge) badge.textContent = count;
    if (valSpan) valSpan.textContent = valSum > 0 ? formatCurrency(valSum) : '';
  });
}

function setupEvents() {
  document.getElementById('kanban-filtro-resp')?.addEventListener('change', renderCardsInColumns);
  document.getElementById('kanban-filtro-proj')?.addEventListener('change', renderCardsInColumns);
  document.getElementById('kanban-search-input')?.addEventListener('input', renderCardsInColumns);
  document.getElementById('btn-novo-kanban-cliente')?.addEventListener('click', () => openNovoClienteModal());
}

function openNovoClienteModal() {
  const modalRoot = document.getElementById('kanban-modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
        <div class="flex items-center justify-between border-b pb-3 mb-4">
          <h3 class="text-lg font-bold text-gray-800">Novo Cliente / Lead</h3>
          <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600 text-lg"><i class="fas fa-times"></i></button>
        </div>
        <form id="form-novo-cliente-kanban" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo / Empresa *</label>
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
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone / WhatsApp</label>
              <input type="text" id="k-tel" class="w-full border rounded-lg p-2 text-sm" placeholder="(11) 98888-7777">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
              <input type="email" id="k-email" class="w-full border rounded-lg p-2 text-sm" placeholder="lucas@escola.edu">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Interesse / Produto</label>
              <input type="text" id="k-interesse" class="w-full border rounded-lg p-2 text-sm" placeholder="Ex: Camisetas personalizadas">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Valor Estimado (R$)</label>
              <input type="number" step="0.01" id="k-valor" class="w-full border rounded-lg p-2 text-sm" placeholder="150.00">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Estudante Responsável</label>
            <select id="k-resp" class="w-full border rounded-lg p-2 text-sm">
              <option value="">Selecione o responsável</option>
              ${allProfiles.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
            </select>
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
      valor_estimado: parseFloat(document.getElementById('k-valor').value) || 0,
      responsavel_id: document.getElementById('k-resp').value || allProfiles[0]?.id || null,
      projeto_id: allProjects[0]?.id || null,
      ativo: true,
      criado_em: new Date().toISOString()
    };

    const { error } = await db.from('clientes').insert(novo);
    if (!error) {
      showToast('Cliente cadastrado com sucesso!', 'success');
      close();
      await loadKanbanData();
    } else {
      showToast('Erro ao cadastrar cliente: ' + error.message, 'error');
    }
  });
}

function openEditarClienteModal(client) {
  const modalRoot = document.getElementById('kanban-modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
        <div class="flex items-center justify-between border-b pb-3 mb-4">
          <h3 class="text-lg font-bold text-gray-800">Editar Cliente / Lead</h3>
          <button id="close-modal-btn" class="text-gray-400 hover:text-gray-600 text-lg"><i class="fas fa-times"></i></button>
        </div>
        <form id="form-editar-cliente-kanban" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo / Empresa *</label>
            <input type="text" id="k-edit-nome" required value="${client.nome || ''}" class="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo</label>
              <select id="k-edit-tipo" class="w-full border rounded-lg p-2 text-sm">
                <option value="estudante" ${client.tipo === 'estudante' ? 'selected' : ''}>Estudante</option>
                <option value="familiar" ${client.tipo === 'familiar' ? 'selected' : ''}>Familiar</option>
                <option value="funcionario" ${client.tipo === 'funcionario' ? 'selected' : ''}>Funcionário</option>
                <option value="comunidade" ${client.tipo === 'comunidade' ? 'selected' : ''}>Comunidade</option>
                <option value="organizacao" ${client.tipo === 'organizacao' ? 'selected' : ''}>Organização</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Etapa Comercial</label>
              <select id="k-edit-etapa" class="w-full border rounded-lg p-2 text-sm">
                <option value="novo_contato" ${client.etapa_comercial === 'novo_contato' ? 'selected' : ''}>Novo Contato</option>
                <option value="interessado" ${client.etapa_comercial === 'interessado' ? 'selected' : ''}>Interessado</option>
                <option value="proposta" ${client.etapa_comercial === 'proposta' ? 'selected' : ''}>Proposta</option>
                <option value="negociacao" ${client.etapa_comercial === 'negociacao' ? 'selected' : ''}>Negociação</option>
                <option value="venda_concluida" ${client.etapa_comercial === 'venda_concluida' ? 'selected' : ''}>Venda Concluída</option>
                <option value="desistencia" ${client.etapa_comercial === 'desistencia' ? 'selected' : ''}>Desistência</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone / WhatsApp</label>
              <input type="text" id="k-edit-tel" value="${client.telefone || ''}" class="w-full border rounded-lg p-2 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
              <input type="email" id="k-edit-email" value="${client.email || ''}" class="w-full border rounded-lg p-2 text-sm">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Interesse / Produto</label>
              <input type="text" id="k-edit-interesse" value="${client.interesse || ''}" class="w-full border rounded-lg p-2 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Valor Estimado (R$)</label>
              <input type="number" step="0.01" id="k-edit-valor" value="${client.valor_estimado || ''}" class="w-full border rounded-lg p-2 text-sm">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Estudante Responsável</label>
            <select id="k-edit-resp" class="w-full border rounded-lg p-2 text-sm">
              <option value="">Selecione o responsável</option>
              ${allProfiles.map(p => `<option value="${p.id}" ${client.responsavel_id === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}
            </select>
          </div>
          <div class="flex justify-between items-center pt-4 border-t mt-4">
            <button type="button" id="btn-excluir-k" class="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"><i class="fas fa-trash mr-1"></i> Excluir</button>
            <div class="flex gap-2">
              <button type="button" id="btn-cancelar-k" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Atualizar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('close-modal-btn')?.addEventListener('click', close);
  document.getElementById('btn-cancelar-k')?.addEventListener('click', close);

  document.getElementById('btn-excluir-k')?.addEventListener('click', async () => {
    if (confirm(`Deseja realmente remover o cliente "${client.nome}"?`)) {
      await db.from('clientes').update({ ativo: false }).eq('id', client.id);
      showToast('Cliente removido com sucesso!', 'success');
      close();
      await loadKanbanData();
    }
  });

  document.getElementById('form-editar-cliente-kanban')?.addEventListener('submit', async e => {
    e.preventDefault();
    const atualizacoes = {
      nome: document.getElementById('k-edit-nome').value.trim(),
      tipo: document.getElementById('k-edit-tipo').value,
      etapa_comercial: document.getElementById('k-edit-etapa').value,
      telefone: document.getElementById('k-edit-tel').value.trim(),
      email: document.getElementById('k-edit-email').value.trim(),
      interesse: document.getElementById('k-edit-interesse').value.trim(),
      valor_estimado: parseFloat(document.getElementById('k-edit-valor').value) || 0,
      responsavel_id: document.getElementById('k-edit-resp').value || null
    };

    const { error } = await db.from('clientes').update(atualizacoes).eq('id', client.id);
    if (!error) {
      showToast('Cliente atualizado com sucesso!', 'success');
      close();
      await loadKanbanData();
    } else {
      showToast('Erro ao atualizar cliente: ' + error.message, 'error');
    }
  });
}

export function cleanup() {
  kanbanClients = [];
}
