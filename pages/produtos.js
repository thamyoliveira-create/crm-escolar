import { db } from '../db.js';
import { formatCurrency, showToast } from '../utils.js';

let state = {
  produtos: [],
  equipes: [],
  categorias: [],
  viewMode: 'cards'
};

export async function render(container) {
  container.innerHTML = `
    <div class="p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Produtos & Serviços</h1>
          <p class="text-xs text-gray-500 mt-1">Catálogo comercial com custo, preço, margem de contribuição, markup e controle de estoque.</p>
        </div>
        <div class="flex gap-2">
          <button id="toggle-view" class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
            <i class="fa-solid fa-list mr-1.5"></i> Alternar Visualização
          </button>
          <button id="btn-novo-produto" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow">
            <i class="fa-solid fa-plus mr-1.5"></i> Novo Produto
          </button>
        </div>
      </div>

      <div id="produtos-kpis" class="grid grid-cols-2 lg:grid-cols-4 gap-4"></div>

      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" id="filtro-busca" placeholder="Buscar por nome, SKU ou descrição..." class="border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 md:col-span-2">
          <select id="filtro-tipo" class="border border-gray-200 p-2.5 rounded-lg text-sm">
            <option value="">Todos os tipos</option>
            <option value="produto">Produto físico</option>
            <option value="servico">Serviço</option>
          </select>
          <select id="filtro-status" class="border border-gray-200 p-2.5 rounded-lg text-sm">
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      <div id="produtos-container"></div>
    </div>
    <div id="modal-container"></div>
  `;

  bindEvents();
  await loadData();
}

async function loadData() {
  try {
    const [produtosResp, equipesResp, categoriasResp] = await Promise.all([
      db.from('produtos').select('*'),
      db.from('equipes').select('*'),
      db.from('categorias_produto').select('*')
    ]);

    state.produtos = produtosResp.data || [];
    state.equipes = equipesResp.data || [];
    state.categorias = categoriasResp.data || [];
    renderKPIs();
    renderProdutos();
  } catch (err) {
    console.error('Erro ao carregar produtos', err);
    showToast('Erro ao carregar produtos', 'error');
  }
}

function estoqueAtual(p) {
  return Number(p.estoque_atual ?? p.estoque_disponivel ?? 0);
}

function margemValor(p) {
  return (Number(p.preco_venda) || 0) - (Number(p.preco_custo) || 0);
}

function margemPercentual(p) {
  const preco = Number(p.preco_venda) || 0;
  if (!preco) return 0;
  return (margemValor(p) / preco) * 100;
}

function markupPercentual(p) {
  const custo = Number(p.preco_custo) || 0;
  if (!custo) return 0;
  return (margemValor(p) / custo) * 100;
}

function filteredProdutos() {
  const busca = (document.getElementById('filtro-busca')?.value || '').toLowerCase();
  const tipo = document.getElementById('filtro-tipo')?.value || '';
  const status = document.getElementById('filtro-status')?.value || 'ativo';

  return state.produtos.filter(p => {
    if (status !== 'todos') {
      const ativo = p.ativo !== false;
      if (status === 'ativo' && !ativo) return false;
      if (status === 'inativo' && ativo) return false;
    }
    if (tipo && p.tipo !== tipo) return false;
    if (busca) {
      const txt = `${p.nome || ''} ${p.codigo_sku || ''} ${p.categoria || ''} ${p.descricao || ''}`.toLowerCase();
      if (!txt.includes(busca)) return false;
    }
    return true;
  });
}

function renderKPIs() {
  const ativos = state.produtos.filter(p => p.ativo !== false);
  const estoqueBaixo = ativos.filter(p => p.tipo === 'produto' && estoqueAtual(p) <= (Number(p.estoque_minimo) || 0)).length;
  const valorEstoque = ativos.reduce((sum, p) => sum + estoqueAtual(p) * (Number(p.preco_custo) || 0), 0);
  const margemMedia = ativos.length ? ativos.reduce((sum, p) => sum + margemPercentual(p), 0) / ativos.length : 0;

  document.getElementById('produtos-kpis').innerHTML = `
    ${kpiCard('Itens Ativos', ativos.length, 'fa-boxes-stacked', 'blue')}
    ${kpiCard('Estoque Baixo', estoqueBaixo, 'fa-triangle-exclamation', estoqueBaixo ? 'red' : 'emerald')}
    ${kpiCard('Valor em Estoque', formatCurrency(valorEstoque), 'fa-warehouse', 'purple')}
    ${kpiCard('Margem Média', `${margemMedia.toFixed(1)}%`, 'fa-chart-line', 'emerald')}
  `;
}

function kpiCard(label, value, icon, color) {
  const map = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700'
  };
  return `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl ${map[color]} flex items-center justify-center"><i class="fa-solid ${icon}"></i></div>
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500 font-bold">${label}</p>
        <p class="text-xl font-extrabold text-gray-900">${value}</p>
      </div>
    </div>
  `;
}

function renderProdutos() {
  const container = document.getElementById('produtos-container');
  const lista = filteredProdutos();

  if (!lista.length) {
    container.innerHTML = `
      <div class="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <h3 class="text-base font-bold text-gray-800 mb-1">Nenhum produto ou serviço encontrado</h3>
        <p class="text-xs text-gray-500 max-w-sm mx-auto mb-5">Cadastre o catálogo de itens, serviços, preços e custos da miniempresa.</p>
        <button id="btn-empty-novo-produto" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm inline-flex items-center gap-2">
          <i class="fa-solid fa-plus"></i> Cadastrar Produto
        </button>
      </div>
    `;
    document.getElementById('btn-empty-novo-produto')?.addEventListener('click', () => openProdutoModal());
    return;
  }

  if (state.viewMode === 'cards') {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        ${lista.map(p => productCard(p)).join('')}
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Produto</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Preço/Custo</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Margem</th>
              <th class="px-4 py-3 text-left text-xs uppercase text-gray-500">Estoque</th>
              <th class="px-4 py-3 text-center text-xs uppercase text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${lista.map(p => productRow(p)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

function productCard(p) {
  const baixoEstoque = p.tipo === 'produto' && estoqueAtual(p) <= (Number(p.estoque_minimo) || 0);
  const equipe = state.equipes.find(e => e.id === p.equipe_id)?.nome || 'Geral';
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      <div class="flex justify-between items-start mb-3">
        <div>
          <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${p.tipo === 'servico' ? 'Serviço' : 'Produto'} · ${p.categoria || 'Geral'}</span>
          <h3 class="font-extrabold text-gray-900 leading-tight mt-1">${p.nome}</h3>
          <p class="text-xs text-gray-400 mt-0.5">SKU: ${p.codigo_sku || '—'} · ${equipe}</p>
        </div>
        ${baixoEstoque ? '<span class="bg-red-50 text-red-700 border border-red-200 text-[10px] px-2 py-1 rounded-full font-bold">Estoque Baixo</span>' : ''}
      </div>
      <p class="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[40px]">${p.descricao || 'Sem descrição cadastrada.'}</p>
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-blue-50 rounded-lg p-3">
          <p class="text-[10px] text-blue-700 uppercase font-bold">Preço Venda</p>
          <p class="font-extrabold text-blue-900">${formatCurrency(Number(p.preco_venda) || 0)}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <p class="text-[10px] text-gray-500 uppercase font-bold">Custo Unit.</p>
          <p class="font-extrabold text-gray-800">${formatCurrency(Number(p.preco_custo) || 0)}</p>
        </div>
        <div class="bg-emerald-50 rounded-lg p-3">
          <p class="text-[10px] text-emerald-700 uppercase font-bold">Margem</p>
          <p class="font-extrabold text-emerald-900">${margemPercentual(p).toFixed(1)}%</p>
        </div>
        <div class="bg-purple-50 rounded-lg p-3">
          <p class="text-[10px] text-purple-700 uppercase font-bold">Markup</p>
          <p class="font-extrabold text-purple-900">${markupPercentual(p).toFixed(1)}%</p>
        </div>
      </div>
      <div class="flex justify-between items-center pt-3 border-t border-gray-100">
        <span class="text-sm text-gray-600">${p.tipo === 'produto' ? `Estoque: <b>${estoqueAtual(p)}</b> ${p.unidade_medida || 'un'}` : 'Serviço sem estoque'}</span>
        <div class="flex gap-1">
          <button onclick="ajustarEstoque('${p.id}')" class="text-amber-600 hover:bg-amber-50 p-2 rounded" title="Ajustar estoque"><i class="fa-solid fa-boxes-packing"></i></button>
          <button onclick="editarProduto('${p.id}')" class="text-blue-600 hover:bg-blue-50 p-2 rounded" title="Editar"><i class="fa-solid fa-pencil"></i></button>
        </div>
      </div>
    </div>
  `;
}

function productRow(p) {
  const baixoEstoque = p.tipo === 'produto' && estoqueAtual(p) <= (Number(p.estoque_minimo) || 0);
  return `
    <tr class="hover:bg-gray-50">
      <td class="px-4 py-3">
        <div class="font-bold text-gray-900">${p.nome}</div>
        <div class="text-xs text-gray-500">${p.codigo_sku || '—'} · ${p.categoria || 'Geral'}</div>
      </td>
      <td class="px-4 py-3">
        <div class="font-bold text-blue-700">${formatCurrency(Number(p.preco_venda) || 0)}</div>
        <div class="text-xs text-gray-500">Custo: ${formatCurrency(Number(p.preco_custo) || 0)}</div>
      </td>
      <td class="px-4 py-3 text-sm">
        <b>${margemPercentual(p).toFixed(1)}%</b><br><span class="text-xs text-gray-500">${formatCurrency(margemValor(p))} / un</span>
      </td>
      <td class="px-4 py-3 text-sm ${baixoEstoque ? 'text-red-700 font-bold' : 'text-gray-700'}">${p.tipo === 'produto' ? estoqueAtual(p) : '—'}</td>
      <td class="px-4 py-3 text-center">
        <button onclick="ajustarEstoque('${p.id}')" class="text-amber-600 hover:bg-amber-50 p-2 rounded"><i class="fa-solid fa-boxes-packing"></i></button>
        <button onclick="editarProduto('${p.id}')" class="text-blue-600 hover:bg-blue-50 p-2 rounded"><i class="fa-solid fa-pencil"></i></button>
      </td>
    </tr>
  `;
}

function bindEvents() {
  document.getElementById('toggle-view')?.addEventListener('click', () => {
    state.viewMode = state.viewMode === 'cards' ? 'table' : 'cards';
    renderProdutos();
  });
  document.getElementById('btn-novo-produto')?.addEventListener('click', () => openProdutoModal());
  ['filtro-busca', 'filtro-tipo', 'filtro-status'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderProdutos);
    document.getElementById(id)?.addEventListener('change', renderProdutos);
  });
}

function openProdutoModal(id = null) {
  const p = id ? state.produtos.find(item => item.id === id) : null;
  const isEditing = !!p;
  const modal = document.getElementById('modal-container');
  const categorias = [...new Set([...state.categorias.map(c => c.nome), ...state.produtos.map(x => x.categoria).filter(Boolean)])];

  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 class="text-xl font-extrabold text-gray-900">${isEditing ? 'Editar Produto / Serviço' : 'Novo Produto / Serviço'}</h2>
            <p class="text-xs text-gray-500">Use esta tela para ensinar precificação, margem e viabilidade econômica.</p>
          </div>
          <button id="close-produto-modal" class="text-gray-400 hover:text-gray-700 text-2xl">×</button>
        </div>
        <form id="produto-form" class="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome *</label>
              <input id="p-nome" required value="${p?.nome || ''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Ex: Ecobag personalizada com logo">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">SKU / Código</label>
              <input id="p-sku" value="${p?.codigo_sku || ''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="ECO-BAG-01">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo</label>
              <select id="p-tipo" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="produto" ${p?.tipo !== 'servico' ? 'selected' : ''}>Produto físico</option>
                <option value="servico" ${p?.tipo === 'servico' ? 'selected' : ''}>Serviço</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
              <input id="p-categoria" list="categorias-produto-list" value="${p?.categoria || ''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Produtos Ecológicos">
              <datalist id="categorias-produto-list">${categorias.map(c => `<option value="${c}"></option>`).join('')}</datalist>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Equipe</label>
              <select id="p-equipe" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="">Geral</option>
                ${state.equipes.map(e => `<option value="${e.id}" ${p?.equipe_id === e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Custo Unitário (R$)</label>
              <input type="number" step="0.01" min="0" id="p-custo" value="${p?.preco_custo ?? ''}" class="w-full border rounded-lg p-2.5 text-sm calc-field">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Preço de Venda (R$)</label>
              <input type="number" step="0.01" min="0" id="p-preco" value="${p?.preco_venda ?? ''}" class="w-full border rounded-lg p-2.5 text-sm calc-field">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Estoque Atual</label>
              <input type="number" step="1" min="0" id="p-estoque" value="${estoqueAtual(p || {})}" class="w-full border rounded-lg p-2.5 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Estoque Mínimo</label>
              <input type="number" step="1" min="0" id="p-estoque-min" value="${p?.estoque_minimo ?? 0}" class="w-full border rounded-lg p-2.5 text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Unidade de Medida</label>
              <input id="p-unidade" value="${p?.unidade_medida || 'un'}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="un, kg, hora...">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
              <select id="p-ativo" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="true" ${p?.ativo !== false ? 'selected' : ''}>Ativo</option>
                <option value="false" ${p?.ativo === false ? 'selected' : ''}>Inativo</option>
              </select>
            </div>
            <div class="md:col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 class="text-xs font-bold text-slate-600 uppercase mb-2">Calculadora Comercial</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p class="text-xs text-gray-500">Margem Unitária</p><p id="calc-margem-valor" class="font-extrabold text-emerald-700">R$ 0,00</p></div>
                <div><p class="text-xs text-gray-500">Margem %</p><p id="calc-margem-perc" class="font-extrabold text-emerald-700">0%</p></div>
                <div><p class="text-xs text-gray-500">Markup %</p><p id="calc-markup" class="font-extrabold text-purple-700">0%</p></div>
                <div><p class="text-xs text-gray-500">Preço Mín. 40% margem</p><p id="calc-preco-sugerido" class="font-extrabold text-blue-700">R$ 0,00</p></div>
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Descrição</label>
              <textarea id="p-descricao" rows="3" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Características, materiais, diferenciais e observações comerciais...">${p?.descricao || ''}</textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" id="cancel-produto-modal" class="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Salvar Produto</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => modal.innerHTML = '';
  document.getElementById('close-produto-modal')?.addEventListener('click', close);
  document.getElementById('cancel-produto-modal')?.addEventListener('click', close);

  const updateCalc = () => {
    const custo = Number(document.getElementById('p-custo').value) || 0;
    const preco = Number(document.getElementById('p-preco').value) || 0;
    const margem = preco - custo;
    const margemPct = preco ? (margem / preco) * 100 : 0;
    const markup = custo ? (margem / custo) * 100 : 0;
    const sugerido = custo ? custo / 0.6 : 0;
    document.getElementById('calc-margem-valor').textContent = formatCurrency(margem);
    document.getElementById('calc-margem-perc').textContent = `${margemPct.toFixed(1)}%`;
    document.getElementById('calc-markup').textContent = `${markup.toFixed(1)}%`;
    document.getElementById('calc-preco-sugerido').textContent = formatCurrency(sugerido);
  };
  document.querySelectorAll('.calc-field').forEach(el => el.addEventListener('input', updateCalc));
  updateCalc();

  document.getElementById('produto-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      nome: document.getElementById('p-nome').value.trim(),
      codigo_sku: document.getElementById('p-sku').value.trim(),
      tipo: document.getElementById('p-tipo').value,
      categoria: document.getElementById('p-categoria').value.trim(),
      equipe_id: document.getElementById('p-equipe').value || null,
      preco_custo: Number(document.getElementById('p-custo').value) || 0,
      preco_venda: Number(document.getElementById('p-preco').value) || 0,
      estoque_atual: Number(document.getElementById('p-estoque').value) || 0,
      estoque_minimo: Number(document.getElementById('p-estoque-min').value) || 0,
      unidade_medida: document.getElementById('p-unidade').value.trim() || 'un',
      ativo: document.getElementById('p-ativo').value === 'true',
      descricao: document.getElementById('p-descricao').value.trim()
    };

    const { error } = isEditing
      ? await db.from('produtos').update(payload).eq('id', id)
      : await db.from('produtos').insert(payload);

    if (error) {
      showToast('Erro ao salvar produto: ' + error.message, 'error');
      return;
    }

    showToast(isEditing ? 'Produto atualizado!' : 'Produto cadastrado!', 'success');
    close();
    await loadData();
  });
}

function openEstoqueModal(id) {
  const p = state.produtos.find(item => item.id === id);
  if (!p) return;
  if (p.tipo === 'servico') {
    showToast('Serviços não possuem controle de estoque.', 'info');
    return;
  }
  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-lg font-extrabold text-gray-900">Ajustar Estoque</h2>
            <p class="text-xs text-gray-500">${p.nome} · estoque atual: <b>${estoqueAtual(p)}</b></p>
          </div>
          <button id="close-estoque-modal" class="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>
        <form id="estoque-form" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de movimentação</label>
            <select id="e-tipo" class="w-full border rounded-lg p-2.5 text-sm">
              <option value="entrada">Entrada / Produção</option>
              <option value="saida">Saída / Perda / Uso</option>
              <option value="ajuste">Definir estoque final</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Quantidade</label>
            <input id="e-qtd" type="number" step="1" min="0" required class="w-full border rounded-lg p-2.5 text-sm">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Motivo</label>
            <input id="e-motivo" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Ex: Produção semanal, venda avulsa, correção de inventário">
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" id="cancel-estoque-modal" class="px-4 py-2 text-sm border rounded-lg text-gray-600">Cancelar</button>
            <button type="submit" class="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg">Salvar Ajuste</button>
          </div>
        </form>
      </div>
    </div>
  `;
  const close = () => modal.innerHTML = '';
  document.getElementById('close-estoque-modal')?.addEventListener('click', close);
  document.getElementById('cancel-estoque-modal')?.addEventListener('click', close);
  document.getElementById('estoque-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const tipo = document.getElementById('e-tipo').value;
    const qtd = Number(document.getElementById('e-qtd').value) || 0;
    const atual = estoqueAtual(p);
    let novoEstoque = atual;
    if (tipo === 'entrada') novoEstoque = atual + qtd;
    if (tipo === 'saida') novoEstoque = Math.max(0, atual - qtd);
    if (tipo === 'ajuste') novoEstoque = qtd;

    const upd = await db.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', id);
    if (upd.error) {
      showToast('Erro ao ajustar estoque: ' + upd.error.message, 'error');
      return;
    }
    await db.from('movimentacoes_estoque').insert({
      produto_id: id,
      tipo,
      quantidade: qtd,
      motivo: document.getElementById('e-motivo').value.trim() || 'Ajuste manual',
      data: new Date().toISOString().split('T')[0]
    });
    showToast('Estoque atualizado!', 'success');
    close();
    await loadData();
  });
}

window.editarProduto = id => openProdutoModal(id);
window.ajustarEstoque = id => openEstoqueModal(id);

export function cleanup() {
  delete window.editarProduto;
  delete window.ajustarEstoque;
}
