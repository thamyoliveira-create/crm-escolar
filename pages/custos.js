import { db } from '../db.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

let state = {
  custos: [],
  equipes: [],
  projetos: [],
  categorias: []
};

export async function render(container) {
  container.innerHTML = `
    <div class="p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Custos & Despesas</h1>
          <p class="text-xs text-gray-500 mt-1">Controle de custos fixos e variáveis para análise de margem e ponto de equilíbrio.</p>
        </div>
        <button id="btn-novo-custo" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow">
          <i class="fa-solid fa-plus mr-1.5"></i> Novo Custo
        </button>
      </div>

      <div id="custos-resumo" class="grid grid-cols-2 lg:grid-cols-5 gap-4"></div>

      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input id="filtro-busca" class="border border-gray-200 p-2.5 rounded-lg text-sm md:col-span-2" placeholder="Buscar descrição ou fornecedor...">
          <select id="filtro-tipo" class="border border-gray-200 p-2.5 rounded-lg text-sm">
            <option value="">Todos os tipos</option>
            <option value="fixo">Custo fixo</option>
            <option value="variavel">Custo variável</option>
          </select>
          <select id="filtro-status" class="border border-gray-200 p-2.5 rounded-lg text-sm">
            <option value="">Todos os status</option>
            <option value="pago">Pago</option>
            <option value="previsto">Previsto</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria/Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Equipe</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody id="custos-tbody" class="bg-white divide-y divide-gray-100"></tbody>
        </table>
      </div>
    </div>
    <div id="modal-container"></div>
  `;

  bindEvents();
  await loadData();
}

async function loadData() {
  try {
    const [custosResp, equipesResp, projetosResp, categoriasResp] = await Promise.all([
      db.from('custos').select('*'),
      db.from('equipes').select('*'),
      db.from('projetos').select('*'),
      db.from('categorias_custo').select('*')
    ]);
    state.custos = custosResp.data || [];
    state.equipes = equipesResp.data || [];
    state.projetos = projetosResp.data || [];
    state.categorias = categoriasResp.data || [];
    renderResumo();
    renderCustos();
  } catch (err) {
    console.error('Erro ao carregar custos', err);
    showToast('Erro ao carregar custos', 'error');
  }
}

function custoTotal(c) {
  return Number(c.total) || ((Number(c.valor) || 0) * (Number(c.quantidade) || 1));
}

function statusCusto(c) {
  return c.situacao || c.status || 'previsto';
}

function filteredCustos() {
  const busca = (document.getElementById('filtro-busca')?.value || '').toLowerCase();
  const tipo = document.getElementById('filtro-tipo')?.value || '';
  const status = document.getElementById('filtro-status')?.value || '';

  return state.custos.filter(c => {
    if (tipo && c.tipo_custo !== tipo) return false;
    if (status && statusCusto(c) !== status) return false;
    if (busca) {
      const txt = `${c.descricao || ''} ${c.fornecedor || ''} ${c.categoria || ''}`.toLowerCase();
      if (!txt.includes(busca)) return false;
    }
    return true;
  });
}

function renderResumo() {
  const container = document.getElementById('custos-resumo');
  const pagos = state.custos.filter(c => statusCusto(c) === 'pago');
  const previstos = state.custos.filter(c => statusCusto(c) !== 'pago');
  const realizado = pagos.reduce((sum, c) => sum + custoTotal(c), 0);
  const previsto = previstos.reduce((sum, c) => sum + custoTotal(c), 0);
  const fixos = state.custos.filter(c => c.tipo_custo === 'fixo').reduce((sum, c) => sum + custoTotal(c), 0);
  const variaveis = state.custos.filter(c => c.tipo_custo !== 'fixo').reduce((sum, c) => sum + custoTotal(c), 0);

  // Ponto de equilíbrio didático: usando uma margem média-padrão de 40% se não houver DRE completa.
  const margemMediaEstimativa = 0.40;
  const pontoEquilibrio = margemMediaEstimativa ? fixos / margemMediaEstimativa : 0;

  container.innerHTML = `
    ${kpi('Previsto / A Pagar', formatCurrency(previsto), 'fa-calendar-check', 'amber')}
    ${kpi('Realizado (Pago)', formatCurrency(realizado), 'fa-circle-check', 'emerald')}
    ${kpi('Custos Fixos', formatCurrency(fixos), 'fa-building-columns', 'purple')}
    ${kpi('Custos Variáveis', formatCurrency(variaveis), 'fa-boxes-stacked', 'blue')}
    ${kpi('Ponto de Equilíbrio*', formatCurrency(pontoEquilibrio), 'fa-scale-balanced', 'slate')}
  `;
}

function kpi(label, value, icon, color) {
  const map = {
    amber: 'border-amber-300 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    purple: 'border-purple-300 bg-purple-50 text-purple-700',
    blue: 'border-blue-300 bg-blue-50 text-blue-700',
    slate: 'border-slate-300 bg-slate-50 text-slate-700'
  };
  return `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div class="w-9 h-9 rounded-lg ${map[color]} border flex items-center justify-center mb-2"><i class="fa-solid ${icon}"></i></div>
      <h3 class="text-gray-500 text-xs uppercase font-bold tracking-wide">${label}</h3>
      <p class="text-lg font-extrabold text-gray-900 mt-1">${value}</p>
    </div>
  `;
}

function renderCustos() {
  const tbody = document.getElementById('custos-tbody');
  const lista = filteredCustos();
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-400">
          <i class="fa-solid fa-file-invoice-dollar text-3xl mb-2 text-gray-300 block"></i>
          <p class="font-medium text-sm">Nenhum custo encontrado.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map(c => {
    const equipe = state.equipes.find(e => e.id === c.equipe_id)?.nome || 'Geral';
    const status = statusCusto(c);
    const statusStyle = status === 'pago'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-sm">
          <div class="font-bold text-gray-900">${c.descricao}</div>
          <div class="text-xs text-gray-500">Fornecedor: ${c.fornecedor || '—'}</div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">
          ${c.categoria || 'Geral'}<br>
          <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">${c.tipo_custo === 'fixo' ? 'Fixo' : 'Variável'}</span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${equipe}</td>
        <td class="px-6 py-4 text-sm text-gray-600">
          Venc.: ${formatDate(c.data_vencimento || c.data)}<br>
          <span class="text-xs text-gray-400">Pag.: ${c.data_pagamento ? formatDate(c.data_pagamento) : '—'}</span>
        </td>
        <td class="px-6 py-4 text-sm font-extrabold text-gray-900">
          ${formatCurrency(custoTotal(c))}<br>
          <span class="text-xs text-gray-400 font-normal">${Number(c.quantidade) || 1} × ${formatCurrency(Number(c.valor) || 0)}</span>
        </td>
        <td class="px-6 py-4 text-sm">
          <span class="px-2 py-0.5 rounded-full text-xs font-bold border ${statusStyle}">${status === 'pago' ? 'Pago' : 'Previsto'}</span>
        </td>
        <td class="px-6 py-4 text-center text-sm">
          <button class="text-blue-600 hover:bg-blue-50 p-2 rounded" onclick="editarCusto('${c.id}')" title="Editar"><i class="fa-solid fa-pencil"></i></button>
          ${status !== 'pago' ? `<button class="text-emerald-600 hover:bg-emerald-50 p-2 rounded" onclick="marcarCustoPago('${c.id}')" title="Marcar como pago"><i class="fa-solid fa-check"></i></button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function bindEvents() {
  document.getElementById('btn-novo-custo')?.addEventListener('click', () => openCustoModal());
  ['filtro-busca', 'filtro-tipo', 'filtro-status'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderCustos);
    document.getElementById(id)?.addEventListener('change', renderCustos);
  });
}

function openCustoModal(id = null) {
  const c = id ? state.custos.find(item => item.id === id) : null;
  const isEditing = !!c;
  const modal = document.getElementById('modal-container');
  const categorias = [...new Set([...state.categorias.map(cat => cat.nome), ...state.custos.map(x => x.categoria).filter(Boolean)])];

  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 class="text-xl font-extrabold text-gray-900">${isEditing ? 'Editar Custo' : 'Novo Custo'}</h2>
            <p class="text-xs text-gray-500">Registre matéria-prima, embalagem, marketing, transporte e custos fixos.</p>
          </div>
          <button id="close-custo-modal" class="text-gray-400 hover:text-gray-700 text-2xl">×</button>
        </div>
        <form id="custo-form" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Descrição *</label>
              <input id="c-descricao" required value="${c?.descricao || ''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Ex: Tecido algodão cru, embalagens, anúncio impresso...">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
              <input id="c-categoria" list="categorias-custo-list" value="${c?.categoria || ''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Matéria-prima & Insumos">
              <datalist id="categorias-custo-list">${categorias.map(cat => `<option value="${cat}"></option>`).join('')}</datalist>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo</label>
              <select id="c-tipo" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="variavel" ${c?.tipo_custo !== 'fixo' ? 'selected' : ''}>Variável — aumenta conforme vende/produz</option>
                <option value="fixo" ${c?.tipo_custo === 'fixo' ? 'selected' : ''}>Fixo — existe mesmo sem vender</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Valor Unitário (R$)</label>
              <input type="number" step="0.01" min="0" id="c-valor" value="${c?.valor ?? ''}" class="w-full border rounded-lg p-2.5 text-sm calc-custo">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Quantidade</label>
              <input type="number" step="0.01" min="0" id="c-qtd" value="${c?.quantidade ?? 1}" class="w-full border rounded-lg p-2.5 text-sm calc-custo">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Equipe</label>
              <select id="c-equipe" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="">Geral</option>
                ${state.equipes.map(e => `<option value="${e.id}" ${c?.equipe_id === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Projeto</label>
              <select id="c-projeto" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="">Geral</option>
                ${state.projetos.map(p => `<option value="${p.id}" ${c?.projeto_id === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data de Vencimento</label>
              <input type="date" id="c-vencimento" value="${c?.data_vencimento || c?.data || new Date().toISOString().split('T')[0]}" class="w-full border rounded-lg p-2.5 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Situação</label>
              <select id="c-situacao" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="previsto" ${statusCusto(c || {}) !== 'pago' ? 'selected' : ''}>Previsto / Pendente</option>
                <option value="pago" ${statusCusto(c || {}) === 'pago' ? 'selected' : ''}>Pago</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data de Pagamento</label>
              <input type="date" id="c-pagamento" value="${c?.data_pagamento || ''}" class="w-full border rounded-lg p-2.5 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Fornecedor</label>
              <input id="c-fornecedor" value="${c?.fornecedor || ''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Ex: Distribuidora Doce Sabor">
            </div>
            <div class="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p class="text-xs text-gray-500 uppercase font-bold">Total do Custo</p>
              <p id="c-total-preview" class="text-2xl font-extrabold text-red-600">R$ 0,00</p>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" id="cancel-custo-modal" class="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Salvar Custo</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => modal.innerHTML = '';
  document.getElementById('close-custo-modal')?.addEventListener('click', close);
  document.getElementById('cancel-custo-modal')?.addEventListener('click', close);

  const updateTotal = () => {
    const total = (Number(document.getElementById('c-valor').value) || 0) * (Number(document.getElementById('c-qtd').value) || 1);
    document.getElementById('c-total-preview').textContent = formatCurrency(total);
  };
  document.querySelectorAll('.calc-custo').forEach(el => el.addEventListener('input', updateTotal));
  updateTotal();

  document.getElementById('c-situacao')?.addEventListener('change', e => {
    const pagamento = document.getElementById('c-pagamento');
    if (e.target.value === 'pago' && !pagamento.value) pagamento.value = new Date().toISOString().split('T')[0];
  });

  document.getElementById('custo-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const valor = Number(document.getElementById('c-valor').value) || 0;
    const quantidade = Number(document.getElementById('c-qtd').value) || 1;
    const situacao = document.getElementById('c-situacao').value;
    const payload = {
      descricao: document.getElementById('c-descricao').value.trim(),
      categoria: document.getElementById('c-categoria').value.trim(),
      tipo_custo: document.getElementById('c-tipo').value,
      valor,
      quantidade,
      total: valor * quantidade,
      equipe_id: document.getElementById('c-equipe').value || null,
      projeto_id: document.getElementById('c-projeto').value || null,
      data_vencimento: document.getElementById('c-vencimento').value || null,
      data_pagamento: situacao === 'pago' ? (document.getElementById('c-pagamento').value || new Date().toISOString().split('T')[0]) : null,
      situacao,
      status: situacao,
      fornecedor: document.getElementById('c-fornecedor').value.trim()
    };

    const { error } = isEditing
      ? await db.from('custos').update(payload).eq('id', id)
      : await db.from('custos').insert(payload);

    if (error) {
      showToast('Erro ao salvar custo: ' + error.message, 'error');
      return;
    }

    showToast(isEditing ? 'Custo atualizado!' : 'Custo registrado!', 'success');
    close();
    await loadData();
  });
}

async function marcarPago(id) {
  const hoje = new Date().toISOString().split('T')[0];
  const { error } = await db.from('custos').update({ situacao: 'pago', status: 'pago', data_pagamento: hoje }).eq('id', id);
  if (error) {
    showToast('Erro ao marcar como pago: ' + error.message, 'error');
    return;
  }
  showToast('Custo marcado como pago!', 'success');
  await loadData();
}

window.editarCusto = id => openCustoModal(id);
window.marcarCustoPago = id => marcarPago(id);

export function cleanup() {
  delete window.editarCusto;
  delete window.marcarCustoPago;
}
