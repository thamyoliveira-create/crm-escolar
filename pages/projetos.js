import { db } from '../db.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

let containerElement;

export async function render(container) {
  containerElement = container;
  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Projetos Multidisciplinares</h1>
          <p class="text-xs text-gray-500">Criação, acompanhamento e metas globais das Feiras e Miniempresas Escolares.</p>
        </div>
        <button id="btn-novo-projeto" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2">
          <i class="fa-solid fa-plus"></i> Novo Projeto
        </button>
      </div>

      <div id="projetos-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <p class="text-gray-500 text-xs">Carregando projetos...</p>
      </div>
    </div>

    <!-- Modal Projeto -->
    <div id="projeto-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6 animate-fadeIn">
        <div class="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 class="text-lg font-bold text-gray-800" id="modal-title">Novo Projeto</h2>
          <button id="btn-close-modal" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-6">
          <form id="projeto-form" class="space-y-4">
            <input type="hidden" id="projeto-id">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Projeto *</label>
                <input type="text" id="projeto-nome" required placeholder="Ex: Feira de Miniempresas Escolares 2026" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Turma / Série *</label>
                <input type="text" id="projeto-turma" required placeholder="Ex: 3º Ano do Ensino Médio" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Ano Letivo *</label>
                <input type="text" id="projeto-ano" required value="2026" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data Início *</label>
                <input type="date" id="projeto-inicio" required class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data Fim *</label>
                <input type="date" id="projeto-fim" required class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Situação / Etapa</label>
                <select id="projeto-situacao" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
                  <option value="planejamento">Planejamento</option>
                  <option value="producao">Produção</option>
                  <option value="comercializacao" selected>Comercialização / Vendas</option>
                  <option value="concluido">Concluído</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Meta Faturamento Global (R$)</label>
                <input type="number" step="0.01" id="projeto-meta-faturamento" placeholder="7500.00" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Descrição do Projeto</label>
              <textarea id="projeto-descricao" rows="2" class="w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:ring-2 focus:ring-blue-500" placeholder="Objetivos de aprendizagem e proposta pedagógica..."></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" id="btn-cancel-modal" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200">Cancelar</button>
              <button type="submit" class="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow">Salvar Projeto</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-novo-projeto')?.addEventListener('click', () => openModal());
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
  document.getElementById('projeto-form')?.addEventListener('submit', saveProjeto);

  await loadProjetos();
}

let allProjetos = [];
let allVendas = [];
let allEquipes = [];

async function loadProjetos() {
  try {
    const [prjResp, venResp, eqResp] = await Promise.all([
      db.from('projetos').select('*').order('criado_em', { ascending: false }),
      db.from('vendas').select('*'),
      db.from('equipes').select('*')
    ]);

    allProjetos = prjResp.data || [];
    allVendas = venResp.data || [];
    allEquipes = eqResp.data || [];

    const grid = document.getElementById('projetos-grid');
    if (!grid) return;

    if (allProjetos.length === 0) {
      grid.innerHTML = '<div class="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-xs">Nenhum projeto cadastrado. Clique em "Novo Projeto" para começar.</div>';
      return;
    }

    grid.innerHTML = allProjetos.map(projeto => {
      const badgeColors = {
        planejamento: 'bg-purple-100 text-purple-800 border-purple-200',
        producao: 'bg-blue-100 text-blue-800 border-blue-200',
        comercializacao: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        concluido: 'bg-gray-100 text-gray-800 border-gray-200',
        arquivado: 'bg-red-100 text-red-800 border-red-200'
      };
      const badgeClass = badgeColors[projeto.situacao] || 'bg-slate-100 text-slate-700 border-slate-200';
      const situacaoLabel = {
        planejamento: 'Planejamento',
        producao: 'Produção',
        comercializacao: 'Comercialização',
        concluido: 'Concluído',
        arquivado: 'Arquivado'
      }[projeto.situacao] || projeto.situacao || 'Ativo';

      // Calcular faturamento real do projeto
      const vendasProj = allVendas.filter(v => v.projeto_id === projeto.id && v.status !== 'cancelada');
      const fatReal = vendasProj.reduce((acc, v) => acc + (Number(v.valor_liquido || v.valor_total) || 0), 0);
      const metaFat = Number(projeto.meta_faturamento) || 1;
      const percFat = Math.min(100, ((fatReal / metaFat) * 100)).toFixed(1);

      const numEquipes = allEquipes.filter(e => e.projeto_id === projeto.id).length;

      return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-3 gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-extrabold text-gray-900 leading-tight truncate">${projeto.nome}</h3>
                <p class="text-xs text-gray-500 mt-0.5">${projeto.turma} • ${projeto.ano_letivo}</p>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass} flex-shrink-0">
                ${situacaoLabel}
              </span>
            </div>

            <div class="text-xs text-gray-600 mb-4 space-y-3">
              <div class="flex items-center gap-1.5 text-gray-500">
                <i class="fa-regular fa-calendar-alt text-gray-400"></i>
                <span>${formatDate(projeto.data_inicio)} até ${formatDate(projeto.data_fim)}</span>
              </div>

              <!-- Barra de Progresso da Meta de Faturamento -->
              <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div class="flex justify-between text-[11px] font-bold">
                  <span class="text-gray-500">Faturamento Realizado</span>
                  <span class="text-emerald-700">${formatCurrency(fatReal)} (${percFat}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div class="bg-emerald-500 h-2 rounded-full transition-all duration-500" style="width: ${percFat}%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-gray-400">
                  <span>Meta: ${formatCurrency(metaFat)}</span>
                  <span>${numEquipes} equipe(s) vinculadas</span>
                </div>
              </div>

              ${projeto.descricao ? `<p class="text-xs text-gray-500 line-clamp-2 mt-1 italic">${projeto.descricao}</p>` : ''}
            </div>
          </div>

          <div class="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
            <span class="text-gray-400 font-medium"><i class="fa-solid fa-cart-shopping mr-1"></i>${vendasProj.length} pedido(s)</span>
            <button class="text-blue-600 hover:text-blue-800 font-bold px-2.5 py-1 rounded hover:bg-blue-50 transition-colors" onclick="window.editarProjeto('${projeto.id}')">
              <i class="fa-solid fa-pencil mr-1"></i> Editar
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error(error);
    showToast('Erro ao carregar projetos.', 'error');
  }
}

function openModal(projeto = null) {
  const modal = document.getElementById('projeto-modal');
  const form = document.getElementById('projeto-form');
  document.getElementById('modal-title').textContent = projeto ? 'Editar Projeto' : 'Novo Projeto';

  if (projeto) {
    document.getElementById('projeto-id').value = projeto.id;
    document.getElementById('projeto-nome').value = projeto.nome || '';
    document.getElementById('projeto-turma').value = projeto.turma || '';
    document.getElementById('projeto-ano').value = projeto.ano_letivo || '2026';
    document.getElementById('projeto-inicio').value = projeto.data_inicio || '';
    document.getElementById('projeto-fim').value = projeto.data_fim || '';
    document.getElementById('projeto-situacao').value = projeto.situacao || 'comercializacao';
    document.getElementById('projeto-meta-faturamento').value = projeto.meta_faturamento || '';
    document.getElementById('projeto-descricao').value = projeto.descricao || '';
  } else {
    form?.reset();
    document.getElementById('projeto-id').value = '';
    document.getElementById('projeto-inicio').value = new Date().toISOString().split('T')[0];
    document.getElementById('projeto-fim').value = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
  }

  modal?.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('projeto-modal')?.classList.add('hidden');
}

async function saveProjeto(e) {
  e.preventDefault();

  const id = document.getElementById('projeto-id').value;
  const payload = {
    nome: document.getElementById('projeto-nome').value.trim(),
    turma: document.getElementById('projeto-turma').value.trim(),
    ano_letivo: document.getElementById('projeto-ano').value.trim(),
    data_inicio: document.getElementById('projeto-inicio').value,
    data_fim: document.getElementById('projeto-fim').value,
    situacao: document.getElementById('projeto-situacao').value,
    meta_faturamento: parseFloat(document.getElementById('projeto-meta-faturamento').value) || 0,
    descricao: document.getElementById('projeto-descricao').value.trim()
  };

  try {
    if (id) {
      const { error } = await db.from('projetos').update(payload).eq('id', id);
      if (error) throw error;
      showToast('Projeto atualizado com sucesso!', 'success');
    } else {
      const { error } = await db.from('projetos').insert([payload]);
      if (error) throw error;
      showToast('Projeto criado com sucesso!', 'success');
    }

    closeModal();
    await loadProjetos();
  } catch (error) {
    console.error(error);
    showToast('Erro ao salvar projeto: ' + error.message, 'error');
  }
}

window.editarProjeto = (id) => {
  const p = allProjetos.find(item => item.id === id);
  if (p) openModal(p);
};

export function cleanup() {
  containerElement = null;
  delete window.editarProjeto;
  allProjetos = [];
  allVendas = [];
  allEquipes = [];
}
