import { db } from '../db.js';
import { formatCurrency, formatDate, showToast, exportCSV, exportPDF } from '../utils.js';

let state = {
  vendas: [],
  clientes: [],
  produtos: [],
  custos: [],
  equipes: [],
  projetos: []
};

export async function render(container) {
  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Relatórios Gerenciais & DRE</h1>
          <p class="text-xs text-gray-500">Demonstrativos executivos, análise de margens, extrato de estoque e vendas.</p>
        </div>
        <div class="flex gap-2">
          <button id="btn-global-csv" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-file-csv text-emerald-600"></i> Exportar Tabela Atual (CSV)
          </button>
          <button id="btn-global-pdf" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-file-pdf text-red-600"></i> Exportar PDF
          </button>
        </div>
      </div>

      <!-- Navegação de Abas -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <nav class="flex flex-wrap gap-2" id="tabs-relatorios">
          <button class="tab-btn px-4 py-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-sm" data-target="tab-dre">
            <i class="fa-solid fa-scale-balanced mr-1.5"></i> DRE Gerencial
          </button>
          <button class="tab-btn px-4 py-2 text-xs font-bold rounded-lg transition-all text-gray-600 hover:bg-gray-100" data-target="tab-vendas">
            <i class="fa-solid fa-cart-shopping mr-1.5"></i> Vendas & Pedidos
          </button>
          <button class="tab-btn px-4 py-2 text-xs font-bold rounded-lg transition-all text-gray-600 hover:bg-gray-100" data-target="tab-clientes">
            <i class="fa-solid fa-address-book mr-1.5"></i> Clientes & Pipeline
          </button>
          <button class="tab-btn px-4 py-2 text-xs font-bold rounded-lg transition-all text-gray-600 hover:bg-gray-100" data-target="tab-produtos">
            <i class="fa-solid fa-box mr-1.5"></i> Estoque & Markup
          </button>
          <button class="tab-btn px-4 py-2 text-xs font-bold rounded-lg transition-all text-gray-600 hover:bg-gray-100" data-target="tab-custos">
            <i class="fa-solid fa-file-invoice-dollar mr-1.5"></i> Custos & Despesas
          </button>
        </nav>
      </div>

      <!-- CONTEÚDO DAS ABAS -->

      <!-- 1. DRE Gerencial -->
      <div id="tab-dre" class="tab-content space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div class="border-b border-gray-100 pb-4 mb-4 flex justify-between items-center">
            <div>
              <h2 class="text-lg font-black text-gray-900">Demonstrativo do Resultado do Exercício (DRE)</h2>
              <p class="text-xs text-gray-500">Visão didática estruturada conforme padrões contábeis e financeiros corporativos.</p>
            </div>
            <span class="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">Ano Letivo 2026</span>
          </div>

          <div class="overflow-hidden border border-gray-200 rounded-xl" id="table-dre-container">
            <table class="min-w-full divide-y divide-gray-200 text-xs" id="table-rel-dre">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left font-bold text-gray-600 uppercase">Linha da Estrutura DRE</th>
                  <th class="px-6 py-3 text-right font-bold text-gray-600 uppercase">Valor Nominal</th>
                  <th class="px-6 py-3 text-right font-bold text-gray-600 uppercase">% sobre Rec. Líquida</th>
                </tr>
              </thead>
              <tbody id="tbody-dre" class="divide-y divide-gray-100 font-medium"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 2. Vendas -->
      <div id="tab-vendas" class="tab-content hidden space-y-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-xs" id="table-rel-vendas">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Pedido #</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Data</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Cliente</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Equipe</th>
                <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase">Total Bruto</th>
                <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase">Desconto</th>
                <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase">Total Líquido</th>
                <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase">Margem (R$)</th>
                <th class="px-4 py-3 text-center font-bold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody id="tbody-rel-vendas" class="divide-y divide-gray-100"></tbody>
          </table>
        </div>
      </div>

      <!-- 3. Clientes -->
      <div id="tab-clientes" class="tab-content hidden space-y-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-xs" id="table-rel-clientes">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Nome / Lead</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Tipo</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Interesse / Produto</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Etapa Comercial</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Telefone</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">E-mail</th>
              </tr>
            </thead>
            <tbody id="tbody-rel-clientes" class="divide-y divide-gray-100"></tbody>
          </table>
        </div>
      </div>

      <!-- 4. Produtos -->
      <div id="tab-produtos" class="tab-content hidden space-y-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-xs" id="table-rel-produtos">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">SKU / Código</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Produto / Serviço</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Categoria</th>
                <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase">Preço Custo</th>
                <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase">Preço Venda</th>
                <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase">Margem Contribuição</th>
                <th class="px-4 py-3 text-center font-bold text-gray-500 uppercase">Estoque Atual</th>
                <th class="px-4 py-3 text-center font-bold text-gray-500 uppercase">Estoque Mínimo</th>
              </tr>
            </thead>
            <tbody id="tbody-rel-produtos" class="divide-y divide-gray-100"></tbody>
          </table>
        </div>
      </div>

      <!-- 5. Custos -->
      <div id="tab-custos" class="tab-content hidden space-y-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 text-xs" id="table-rel-custos">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Descrição</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Categoria</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Tipo</th>
                <th class="px-4 py-3 text-left font-bold text-gray-500 uppercase">Fornecedor</th>
                <th class="px-4 py-3 text-right font-bold text-gray-500 uppercase">Valor Total</th>
                <th class="px-4 py-3 text-center font-bold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody id="tbody-rel-custos" class="divide-y divide-gray-100"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  setupTabs();
  setupExports();
  await loadData();
}

let activeTableId = 'table-rel-dre';

function setupTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => {
        b.className = 'tab-btn px-4 py-2 text-xs font-bold rounded-lg transition-all text-gray-600 hover:bg-gray-100';
      });
      btn.className = 'tab-btn px-4 py-2 text-xs font-bold rounded-lg transition-all bg-blue-600 text-white shadow-sm';

      contents.forEach(c => c.classList.add('hidden'));
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.remove('hidden');

      const map = {
        'tab-dre': 'table-rel-dre',
        'tab-vendas': 'table-rel-vendas',
        'tab-clientes': 'table-rel-clientes',
        'tab-produtos': 'table-rel-produtos',
        'tab-custos': 'table-rel-custos'
      };
      activeTableId = map[btn.dataset.target] || 'table-rel-dre';
    });
  });
}

function setupExports() {
  document.getElementById('btn-global-csv')?.addEventListener('click', () => {
    exportCSV(activeTableId, `${activeTableId}.csv`);
  });
  document.getElementById('btn-global-pdf')?.addEventListener('click', () => {
    exportPDF(activeTableId, 'Relatório Gerencial CRM Escolar', `${activeTableId}.pdf`);
  });
}

async function loadData() {
  try {
    const [vResp, cResp, pResp, custResp, eqResp, prjResp] = await Promise.all([
      db.from('vendas').select('*'),
      db.from('clientes').select('*'),
      db.from('produtos').select('*'),
      db.from('custos').select('*'),
      db.from('equipes').select('*'),
      db.from('projetos').select('*')
    ]);

    state.vendas = vResp.data || [];
    state.clientes = cResp.data || [];
    state.produtos = pResp.data || [];
    state.custos = custResp.data || [];
    state.equipes = eqResp.data || [];
    state.projetos = prjResp.data || [];

    renderDRE();
    renderVendas();
    renderClientes();
    renderProdutos();
    renderCustos();
  } catch (e) {
    console.error('Erro ao carregar relatórios:', e);
    showToast('Erro ao carregar dados dos relatórios.', 'error');
  }
}

function renderDRE() {
  const tbody = document.getElementById('tbody-dre');
  if (!tbody) return;

  const vendasRealizadas = state.vendas.filter(v => v.status !== 'cancelada');
  const receitaBruta = vendasRealizadas.reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0);
  const descontos = vendasRealizadas.reduce((acc, v) => acc + (Number(v.desconto) || 0), 0);
  const receitaLiquida = receitaBruta - descontos;

  const custosPagos = state.custos.filter(c => (c.situacao || c.status) === 'pago');
  const custosVariaveis = custosPagos.filter(c => c.tipo_custo !== 'fixo').reduce((acc, c) => acc + (Number(c.total) || (Number(c.valor) * Number(c.quantidade || 1)) || 0), 0);
  const margemContribuicao = receitaLiquida - custosVariaveis;

  const custosFixos = custosPagos.filter(c => c.tipo_custo === 'fixo').reduce((acc, c) => acc + (Number(c.total) || (Number(c.valor) * Number(c.quantidade || 1)) || 0), 0);
  const lucroLiquido = margemContribuicao - custosFixos;

  const pct = (val) => receitaLiquida > 0 ? ((val / receitaLiquida) * 100).toFixed(1) + '%' : '0.0%';

  tbody.innerHTML = `
    <tr class="bg-slate-50 font-bold">
      <td class="px-6 py-3 text-gray-900">(+) RECEITA BRUTA DE VENDAS</td>
      <td class="px-6 py-3 text-right text-gray-900">${formatCurrency(receitaBruta)}</td>
      <td class="px-6 py-3 text-right text-gray-500">${pct(receitaBruta)}</td>
    </tr>
    <tr class="text-red-700">
      <td class="px-6 py-2.5 pl-10">(-) Descontos Concedidos & Abatimentos</td>
      <td class="px-6 py-2.5 text-right">- ${formatCurrency(descontos)}</td>
      <td class="px-6 py-2.5 text-right">${pct(descontos)}</td>
    </tr>
    <tr class="bg-blue-50/70 font-extrabold text-blue-950 border-t border-b border-blue-200">
      <td class="px-6 py-3.5">(=) RECEITA OPERACIONAL LÍQUIDA</td>
      <td class="px-6 py-3.5 text-right">${formatCurrency(receitaLiquida)}</td>
      <td class="px-6 py-3.5 text-right">100.0%</td>
    </tr>
    <tr class="text-red-700">
      <td class="px-6 py-2.5 pl-10">(-) Custos Variáveis (Matéria-prima, Insumos, Embalagens)</td>
      <td class="px-6 py-2.5 text-right">- ${formatCurrency(custosVariaveis)}</td>
      <td class="px-6 py-2.5 text-right">${pct(custosVariaveis)}</td>
    </tr>
    <tr class="bg-purple-50/70 font-extrabold text-purple-950 border-t border-b border-purple-200">
      <td class="px-6 py-3.5">(=) MARGEM DE CONTRIBUIÇÃO TOTAL</td>
      <td class="px-6 py-3.5 text-right">${formatCurrency(margemContribuicao)}</td>
      <td class="px-6 py-3.5 text-right">${pct(margemContribuicao)}</td>
    </tr>
    <tr class="text-red-700">
      <td class="px-6 py-2.5 pl-10">(-) Custos Fixos & Despesas Operacionais</td>
      <td class="px-6 py-2.5 text-right">- ${formatCurrency(custosFixos)}</td>
      <td class="px-6 py-2.5 text-right">${pct(custosFixos)}</td>
    </tr>
    <tr class="${lucroLiquido >= 0 ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-red-100 text-red-950 border-red-300'} font-black text-sm border-t-2 border-b-2">
      <td class="px-6 py-4">(=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO/PREJUÍZO)</td>
      <td class="px-6 py-4 text-right">${formatCurrency(lucroLiquido)}</td>
      <td class="px-6 py-4 text-right">${pct(lucroLiquido)}</td>
    </tr>
  `;
}

function renderVendas() {
  const tbody = document.getElementById('tbody-rel-vendas');
  if (!tbody) return;

  if (state.vendas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-400">Nenhuma venda cadastrada.</td></tr>';
    return;
  }

  tbody.innerHTML = state.vendas.map(v => {
    const eq = state.equipes.find(e => e.id === v.equipe_id)?.nome || 'Geral';
    const bruto = Number(v.valor_total) || 0;
    const desc = Number(v.desconto) || 0;
    const liq = Number(v.valor_liquido) || (bruto - desc);
    const margem = Number(v.margem_contribuicao) || 0;

    return `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-2.5 font-bold text-gray-900">#${v.numero}</td>
        <td class="px-4 py-2.5 text-gray-600">${formatDate(v.data)}</td>
        <td class="px-4 py-2.5 text-gray-800 font-medium">${v.cliente_nome}</td>
        <td class="px-4 py-2.5 text-gray-500">${eq}</td>
        <td class="px-4 py-2.5 text-right text-gray-600">${formatCurrency(bruto)}</td>
        <td class="px-4 py-2.5 text-right text-red-600">${desc > 0 ? '-' + formatCurrency(desc) : '—'}</td>
        <td class="px-4 py-2.5 text-right font-bold text-emerald-600">${formatCurrency(liq)}</td>
        <td class="px-4 py-2.5 text-right font-medium text-purple-600">${formatCurrency(margem)}</td>
        <td class="px-4 py-2.5 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${v.status === 'paga' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${v.status || 'aberta'}</span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderClientes() {
  const tbody = document.getElementById('tbody-rel-clientes');
  if (!tbody) return;

  if (state.clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Nenhum cliente cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = state.clientes.map(c => `
    <tr class="hover:bg-slate-50">
      <td class="px-4 py-2.5 font-bold text-gray-900">${c.nome}</td>
      <td class="px-4 py-2.5 text-gray-600 capitalize">${c.tipo || 'Pessoa Física'}</td>
      <td class="px-4 py-2.5 text-blue-600">${c.interesse || 'Geral'}</td>
      <td class="px-4 py-2.5">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">${c.etapa_comercial || c.etapa_funil || 'novo_contato'}</span>
      </td>
      <td class="px-4 py-2.5 text-gray-600">${c.telefone || '—'}</td>
      <td class="px-4 py-2.5 text-gray-600">${c.email || '—'}</td>
    </tr>
  `).join('');
}

function renderProdutos() {
  const tbody = document.getElementById('tbody-rel-produtos');
  if (!tbody) return;

  if (state.produtos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">Nenhum produto cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = state.produtos.map(p => {
    const custo = Number(p.preco_custo) || 0;
    const venda = Number(p.preco_venda) || 0;
    const margemUnit = venda - custo;
    const margemPct = venda > 0 ? ((margemUnit / venda) * 100).toFixed(1) : 0;
    const estAtual = Number(p.estoque_atual ?? p.estoque ?? 0);
    const estMin = Number(p.estoque_minimo ?? 0);
    const isBaixo = estAtual <= estMin;

    return `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-2.5 font-mono font-bold text-slate-500">${p.codigo_sku || p.sku || 'PROD-' + p.id.substring(0,4)}</td>
        <td class="px-4 py-2.5 font-bold text-gray-900">${p.nome}</td>
        <td class="px-4 py-2.5 text-gray-500">${p.categoria || 'Geral'}</td>
        <td class="px-4 py-2.5 text-right text-gray-600">${formatCurrency(custo)}</td>
        <td class="px-4 py-2.5 text-right font-bold text-blue-600">${formatCurrency(venda)}</td>
        <td class="px-4 py-2.5 text-right text-emerald-600 font-bold">${formatCurrency(margemUnit)} (${margemPct}%)</td>
        <td class="px-4 py-2.5 text-center font-bold ${isBaixo ? 'text-red-600 bg-red-50' : 'text-gray-900'}">${estAtual}</td>
        <td class="px-4 py-2.5 text-center text-gray-500">${estMin}</td>
      </tr>
    `;
  }).join('');
}

function renderCustos() {
  const tbody = document.getElementById('tbody-rel-custos');
  if (!tbody) return;

  if (state.custos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Nenhum custo cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = state.custos.map(c => {
    const total = Number(c.total) || (Number(c.valor) * Number(c.quantidade || 1)) || 0;
    const status = c.situacao || c.status || 'previsto';

    return `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-2.5 font-bold text-gray-900">${c.descricao}</td>
        <td class="px-4 py-2.5 text-gray-600">${c.categoria || 'Geral'}</td>
        <td class="px-4 py-2.5">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${c.tipo_custo === 'fixo' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">${c.tipo_custo === 'fixo' ? 'Fixo' : 'Variável'}</span>
        </td>
        <td class="px-4 py-2.5 text-gray-500">${c.fornecedor || '—'}</td>
        <td class="px-4 py-2.5 text-right font-bold text-gray-900">${formatCurrency(total)}</td>
        <td class="px-4 py-2.5 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${status === 'pago' ? 'Pago' : 'Previsto'}</span>
        </td>
      </tr>
    `;
  }).join('');
}

export function cleanup() {
  state = { vendas: [], clientes: [], produtos: [], custos: [], equipes: [], projetos: [] };
}
