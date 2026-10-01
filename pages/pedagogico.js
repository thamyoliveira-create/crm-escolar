import { db } from '../db.js';
import { getCurrentUser } from '../auth.js';
import { formatDate, showToast } from '../utils.js';

let containerElement;
let allProjetos = [];
let allEquipes = [];
let allAvaliacoes = [];
let allProfiles = [];

const COMPETENCIAS_PADRAO = [
  'Comunicação & Atendimento ao Cliente',
  'Matemática Financeira & Precificação',
  'Gestão de Custos & Ponto de Equilíbrio',
  'Controle de Estoque & Organização',
  'Trabalho em Equipe & Liderança'
];

export async function render(container) {
  containerElement = container;
  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-6">
      <!-- Banner Pedagógico -->
      <div class="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-2xl shadow-lg p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h1 class="text-2xl font-black tracking-tight">Área Pedagógica & Competências</h1>
            <p class="text-xs text-purple-200 mt-1">Acompanhamento interdisciplinar, rubricas avaliativas e mentorias das miniempresas.</p>
          </div>
        </div>
        <button id="btn-nova-avaliacao" class="bg-white text-purple-800 hover:bg-purple-50 text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-2 flex-shrink-0">
          <i class="fa-solid fa-plus text-purple-600"></i> Nova Avaliação de Equipe
        </button>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Filtrar por Projeto</label>
          <select id="filtro-projeto" class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 p-2 text-xs border">
            <option value="">Todos os Projetos</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Filtrar por Equipe</label>
          <select id="filtro-equipe" class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 p-2 text-xs border">
            <option value="">Todas as Equipes</option>
          </select>
        </div>
      </div>

      <!-- Resumo Pedagógico -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-clipboard-check"></i>
          </div>
          <div>
            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-wider">Avaliações Realizadas</h3>
            <p id="card-total-aval" class="text-xl font-extrabold text-gray-900 mt-0.5">0</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-star"></i>
          </div>
          <div>
            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-wider">Média Geral de Desempenho</h3>
            <p id="card-media-geral" class="text-xl font-extrabold text-amber-600 mt-0.5">0.0 / 5.0</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-people-group"></i>
          </div>
          <div>
            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-wider">Miniempresas Ativas</h3>
            <p id="card-total-equipes" class="text-xl font-extrabold text-gray-900 mt-0.5">0</p>
          </div>
        </div>
      </div>

      <!-- Lista de Avaliações Pedagógicas & Feedbacks -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h3 class="text-base font-bold text-gray-900">Histórico de Feedbacks & Rubricas por Competência</h3>
            <p class="text-xs text-gray-500">Notas de 1 a 5 atribuídas aos estudantes em situações reais de mercado.</p>
          </div>
        </div>

        <div id="lista-avaliacoes" class="space-y-4">
          <!-- Injetado dinamicamente -->
        </div>
      </div>
    </div>

    <!-- Modal Nova Avaliação -->
    <div id="modal-avaliacao" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 my-6 animate-fadeIn">
        <div class="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Nova Avaliação Pedagógica</h3>
            <p class="text-xs text-gray-500">Atribua notas às competências e deixe orientações práticas.</p>
          </div>
          <button id="close-modal-aval" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="form-avaliacao" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Equipe *</label>
              <select id="aval-equipe" required class="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500"></select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data *</label>
              <input type="date" id="aval-data" required class="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-purple-500">
            </div>
          </div>

          <div class="space-y-2 border-t border-b border-gray-100 py-3">
            <h4 class="text-xs font-bold text-gray-700 uppercase">Rubricas de Competências (1 a 5)</h4>
            ${COMPETENCIAS_PADRAO.map((comp, idx) => `
              <div class="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50">
                <span class="text-xs font-medium text-gray-800">${comp}</span>
                <select id="comp-score-${idx}" class="border rounded-md p-1 text-xs font-bold bg-white text-purple-700">
                  <option value="5">⭐⭐⭐⭐⭐ (5 - Excelente)</option>
                  <option value="4" selected>⭐⭐⭐⭐ (4 - Bom)</option>
                  <option value="3">⭐⭐⭐ (3 - Regular)</option>
                  <option value="2">⭐⭐ (2 - Em desenvolvimento)</option>
                  <option value="1">⭐ (1 - Insuficiente)</option>
                </select>
              </div>
            `).join('')}
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Parecer & Devolutiva Pedagógica *</label>
            <textarea id="aval-feedback" rows="3" required class="w-full border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-purple-500" placeholder="Ex: Excelente desenvoltura no atendimento ao cliente. Recomendamos maior atenção ao controle diário de custos fixos..."></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button type="button" id="cancel-modal-aval" class="px-4 py-2 border rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow">Registrar Avaliação</button>
          </div>
        </form>
      </div>
    </div>
  `;

  await loadData();
  setupEvents();
}

async function loadData() {
  try {
    const [projResp, eqResp, avalResp, profResp] = await Promise.all([
      db.from('projetos').select('*'),
      db.from('equipes').select('*'),
      db.from('avaliacoes_pedagogicas').select('*'),
      db.from('profiles').select('*')
    ]);

    allProjetos = projResp.data || [];
    allEquipes = eqResp.data || [];
    allAvaliacoes = avalResp.data || [];
    allProfiles = profResp.data || [];

    // Preencher selects
    const selProj = document.getElementById('filtro-projeto');
    const selEq = document.getElementById('filtro-equipe');
    const modalEq = document.getElementById('aval-equipe');

    if (selProj) {
      selProj.innerHTML = '<option value="">Todos os Projetos</option>';
      allProjetos.forEach(p => {
        selProj.innerHTML += `<option value="${p.id}">${p.nome}</option>`;
      });
    }

    if (selEq) {
      selEq.innerHTML = '<option value="">Todas as Equipes</option>';
      allEquipes.forEach(e => {
        selEq.innerHTML += `<option value="${e.id}">${e.nome}</option>`;
      });
    }

    if (modalEq) {
      modalEq.innerHTML = '';
      allEquipes.forEach(e => {
        modalEq.innerHTML += `<option value="${e.id}">${e.nome}</option>`;
      });
    }

    renderAvaliacoes();
  } catch (e) {
    console.error('Erro ao carregar pedagogico:', e);
  }
}

function renderAvaliacoes() {
  const projFiltro = document.getElementById('filtro-projeto')?.value;
  const eqFiltro = document.getElementById('filtro-equipe')?.value;

  let filtradas = allAvaliacoes;
  if (eqFiltro) {
    filtradas = filtradas.filter(a => a.equipe_id === eqFiltro);
  }

  const container = document.getElementById('lista-avaliacoes');
  if (!container) return;

  // Atualizar cards
  const total = filtradas.length;
  const media = total > 0 ? (filtradas.reduce((acc, a) => acc + (Number(a.nota_media) || 0), 0) / total).toFixed(1) : '0.0';

  document.getElementById('card-total-aval').textContent = total;
  document.getElementById('card-media-geral').textContent = `${media} / 5.0`;
  document.getElementById('card-total-equipes').textContent = allEquipes.length;

  if (total === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200">
        <i class="fa-solid fa-graduation-cap text-3xl mb-2 text-gray-300 block"></i>
        <p class="text-sm font-medium">Nenhuma avaliação encontrada para os filtros selecionados.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtradas.map(a => {
    const equipe = allEquipes.find(e => e.id === a.equipe_id)?.nome || 'Equipe Geral';
    const prof = allProfiles.find(p => p.id === a.professor_id)?.nome || 'Professora Tamiris';
    const notas = a.notas_competencias || {};

    return `
      <div class="p-4 rounded-xl border border-gray-200 bg-white hover:border-purple-300 transition-all shadow-sm space-y-3">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-2">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
              <i class="fa-solid fa-users"></i>
            </span>
            <div>
              <h4 class="font-bold text-gray-900 text-sm">${equipe}</h4>
              <p class="text-[11px] text-gray-500">Orientador(a): ${prof} · ${formatDate(a.data)}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-800">
            <i class="fa-solid fa-star text-amber-500 text-[11px]"></i>
            <span>Média: ${Number(a.nota_media || 0).toFixed(1)} / 5.0</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          ${Object.entries(notas).map(([comp, nota]) => `
            <div class="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
              <span class="text-gray-600 truncate pr-2">${comp}</span>
              <span class="font-bold text-purple-700 flex-shrink-0">${'⭐'.repeat(nota)}</span>
            </div>
          `).join('')}
        </div>

        <div class="bg-purple-50/60 p-3 rounded-xl border border-purple-100 text-xs text-purple-950 leading-relaxed">
          <p class="font-bold text-purple-900 mb-0.5"><i class="fa-solid fa-comment-dots mr-1"></i> Parecer Pedagógico:</p>
          <p class="italic">${a.feedback || 'Sem observações adicionais.'}</p>
        </div>
      </div>
    `;
  }).join('');
}

function setupEvents() {
  document.getElementById('filtro-projeto')?.addEventListener('change', renderAvaliacoes);
  document.getElementById('filtro-equipe')?.addEventListener('change', renderAvaliacoes);

  const modal = document.getElementById('modal-avaliacao');
  const btnNovo = document.getElementById('btn-nova-avaliacao');
  const closeBtn = document.getElementById('close-modal-aval');
  const cancelBtn = document.getElementById('cancel-modal-aval');

  btnNovo?.addEventListener('click', () => {
    document.getElementById('aval-data').value = new Date().toISOString().split('T')[0];
    modal?.classList.remove('hidden');
  });

  const close = () => modal?.classList.add('hidden');
  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  document.getElementById('form-avaliacao')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const equipeId = document.getElementById('aval-equipe').value;
    const data = document.getElementById('aval-data').value;
    const feedback = document.getElementById('aval-feedback').value.trim();

    const notas = {};
    let somaNotas = 0;
    COMPETENCIAS_PADRAO.forEach((comp, idx) => {
      const val = Number(document.getElementById(`comp-score-${idx}`).value) || 4;
      notas[comp] = val;
      somaNotas += val;
    });

    const notaMedia = (somaNotas / COMPETENCIAS_PADRAO.length).toFixed(2);
    const currentUser = getCurrentUser();

    const novaAvaliacao = {
      equipe_id: equipeId,
      professor_id: currentUser?.id || 'usr-admin-01',
      notas_competencias: notas,
      nota_media: Number(notaMedia),
      feedback,
      data
    };

    const { error } = await db.from('avaliacoes_pedagogicas').insert([novaAvaliacao]);
    if (!error) {
      showToast('Avaliação pedagógica salva com sucesso!', 'success');
      close();
      document.getElementById('form-avaliacao').reset();
      await loadData();
    } else {
      showToast('Erro ao salvar avaliação: ' + error.message, 'error');
    }
  });
}

export function cleanup() {
  containerElement = null;
  allProjetos = [];
  allEquipes = [];
  allAvaliacoes = [];
  allProfiles = [];
}
