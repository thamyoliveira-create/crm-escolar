import { db } from '../db.js';
import { formatCurrency, showToast } from '../utils.js';

let containerElement;

export async function render(container) {
  containerElement = container;
  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Equipes & Miniempresas</h1>
          <p class="text-xs text-gray-500">Gestão dos grupos de estudantes, produtos comercializados e desempenho em tempo real.</p>
        </div>
        <button id="btn-nova-equipe" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2">
          <i class="fa-solid fa-plus"></i> Nova Equipe
        </button>
      </div>

      <div id="equipes-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <p class="text-gray-500 text-xs">Carregando equipes...</p>
      </div>
    </div>

    <!-- Modal Equipe -->
    <div id="equipe-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-6 animate-fadeIn">
        <div class="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 class="text-lg font-bold text-gray-800" id="modal-title">Nova Equipe</h2>
          <button id="btn-close-modal" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-6">
          <form id="equipe-form" class="space-y-4">
            <input type="hidden" id="equipe-id">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome da Equipe / Miniempresa *</label>
              <input type="text" id="equipe-nome" required placeholder="Ex: EcoBag Sustentável" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Produto / Serviço Comercializado *</label>
              <input type="text" id="equipe-produto" required placeholder="Ex: Ecobags personalizadas com tecido reciclado" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Projeto Vinculado *</label>
                <select id="equipe-projeto" required class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione um projeto...</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Meta de Faturamento (R$)</label>
                <input type="number" step="0.01" id="equipe-meta" placeholder="3800.00" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Descrição do Negócio</label>
              <textarea id="equipe-descricao" rows="2" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500" placeholder="Proposta de valor e diferenciais da miniempresa..."></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" id="btn-cancel-modal" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200">Cancelar</button>
              <button type="submit" class="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow">Salvar Equipe</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-nova-equipe')?.addEventListener('click', () => openModal());
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
  document.getElementById('equipe-form')?.addEventListener('submit', saveEquipe);

  await loadEquipesData();
}

let allProjetos = [];
let allEquipes = [];
let allVendas = [];
let allCustos = [];

async function loadEquipesData() {
  try {
    const [prjResp, eqResp, venResp, custResp] = await Promise.all([
      db.from('projetos').select('*'),
      db.from('equipes').select('*'),
      db.from('vendas').select('*'),
      db.from('custos').select('*')
    ]);

    allProjetos = prjResp.data || [];
    allEquipes = eqResp.data || [];
    allVendas = venResp.data || [];
    allCustos = custResp.data || [];

    const select = document.getElementById('equipe-projeto');
    if (select) {
      select.innerHTML = '<option value="">Selecione um projeto...</option>';
      allProjetos.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
      });
    }

    renderGrid();
  } catch (e) {
    console.error('Erro ao carregar dados das equipes:', e);
  }
}

function renderGrid() {
  const grid = document.getElementById('equipes-grid');
  if (!grid) return;

  if (allEquipes.length === 0) {
    grid.innerHTML = '<div class="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-xs">Nenhuma equipe cadastrada ainda.</div>';
    return;
  }

  grid.innerHTML = allEquipes.map(eq => {
    const proj = allProjetos.find(p => p.id === eq.projeto_id)?.nome || 'Projeto Geral';

    const vendasEq = allVendas.filter(v => v.equipe_id === eq.id && v.status !== 'cancelada');
    const faturamento = vendasEq.reduce((acc, v) => acc + (Number(v.valor_liquido || v.valor_total) || 0), 0);

    const custosEq = allCustos.filter(c => c.equipe_id === eq.id && (c.situacao === 'pago' || c.status === 'pago'));
    const totalCustos = custosEq.reduce((acc, c) => acc + (Number(c.total) || (Number(c.valor) * Number(c.quantidade || 1)) || 0), 0);

    const lucro = faturamento - totalCustos;
    const margem = faturamento > 0 ? ((lucro / faturamento) * 100).toFixed(1) : '0.0';

    const initial = eq.nome.substring(0, 2).toUpperCase();

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1 pr-2">
              <h3 class="text-base font-extrabold text-gray-900 leading-tight">${eq.nome}</h3>
              <p class="text-xs text-blue-600 font-medium mt-0.5 line-clamp-1"><i class="fa-solid fa-tag mr-1 text-[10px]"></i>${eq.produto_servico || 'Produto Geral'}</p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center text-xs flex-shrink-0 border border-blue-100 shadow-sm">
              ${initial}
            </div>
          </div>

          <div class="mb-4">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              <i class="fa-solid fa-diagram-project text-[9px]"></i> ${proj}
            </span>
          </div>

          <!-- Indicadores Financeiros da Miniempresa -->
          <div class="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold uppercase text-gray-400">Faturamento Liq.</p>
              <p class="text-xs font-extrabold text-gray-900 mt-0.5">${formatCurrency(faturamento)}</p>
            </div>
            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold uppercase text-gray-400">Custos Realizados</p>
              <p class="text-xs font-extrabold text-red-600 mt-0.5">${formatCurrency(totalCustos)}</p>
            </div>
            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold uppercase text-gray-400">Lucro Operacional</p>
              <p class="text-xs font-extrabold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-600'} mt-0.5">${formatCurrency(lucro)}</p>
            </div>
            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <p class="text-[10px] font-bold uppercase text-gray-400">Margem Liq.</p>
              <p class="text-xs font-extrabold text-purple-600 mt-0.5">${margem}%</p>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
          <span class="text-gray-400 font-medium"><i class="fa-solid fa-receipt mr-1"></i>${vendasEq.length} venda(s)</span>
          <button class="text-blue-600 hover:text-blue-800 font-bold px-2.5 py-1 rounded hover:bg-blue-50 transition-colors" onclick="window.editarEquipe('${eq.id}')">
            <i class="fa-solid fa-pencil mr-1"></i> Editar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openModal(equipe = null) {
  const modal = document.getElementById('equipe-modal');
  const form = document.getElementById('equipe-form');
  document.getElementById('modal-title').textContent = equipe ? 'Editar Equipe' : 'Nova Equipe';

  if (equipe) {
    document.getElementById('equipe-id').value = equipe.id;
    document.getElementById('equipe-nome').value = equipe.nome || '';
    document.getElementById('equipe-produto').value = equipe.produto_servico || '';
    document.getElementById('equipe-projeto').value = equipe.projeto_id || '';
    document.getElementById('equipe-meta').value = equipe.meta_faturamento || '';
    document.getElementById('equipe-descricao').value = equipe.descricao || '';
  } else {
    form?.reset();
    document.getElementById('equipe-id').value = '';
  }

  modal?.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('equipe-modal')?.classList.add('hidden');
}

async function saveEquipe(e) {
  e.preventDefault();

  const id = document.getElementById('equipe-id').value;
  const payload = {
    nome: document.getElementById('equipe-nome').value.trim(),
    produto_servico: document.getElementById('equipe-produto').value.trim(),
    projeto_id: document.getElementById('equipe-projeto').value || null,
    meta_faturamento: parseFloat(document.getElementById('equipe-meta').value) || 0,
    descricao: document.getElementById('equipe-descricao').value.trim(),
    ativa: true
  };

  try {
    if (id) {
      const { error } = await db.from('equipes').update(payload).eq('id', id);
      if (error) throw error;
      showToast('Equipe atualizada com sucesso!', 'success');
    } else {
      const { error } = await db.from('equipes').insert([payload]);
      if (error) throw error;
      showToast('Equipe cadastrada com sucesso!', 'success');
    }

    closeModal();
    await loadEquipesData();
  } catch (error) {
    console.error(error);
    showToast('Erro ao salvar equipe: ' + error.message, 'error');
  }
}

window.editarEquipe = (id) => {
  const eq = allEquipes.find(e => e.id === id);
  if (eq) openModal(eq);
};

export function cleanup() {
  containerElement = null;
  delete window.editarEquipe;
  allProjetos = [];
  allEquipes = [];
  allVendas = [];
  allCustos = [];
}
