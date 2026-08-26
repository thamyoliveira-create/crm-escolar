import { db } from '../db.js';
import { formatCurrency, formatDate } from '../utils.js';

let chartInstances = {};

export async function render(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Dashboard Gerencial</h1>
          <p class="text-xs text-gray-500">Visão consolidada de indicadores financeiros e comerciais.</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtros de Período & Escopo</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Projeto</label>
            <select id="filter-projeto" class="w-full border rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Todos os Projetos</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Equipe</label>
            <select id="filter-equipe" class="w-full border rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
              <option value="">Todas as Equipes</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Data Inicial</label>
            <input type="date" id="filter-data-inicio" class="w-full border rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Data Final</label>
            <input type="date" id="filter-data-fim" class="w-full border rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        <div class="flex justify-end pt-1">
          <button id="btn-aplicar-filtros" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm flex items-center gap-1.5">
            <i class="fa-solid fa-filter"></i> Aplicar Filtros
          </button>
        </div>
      </div>

      <!-- Indicadores Linha 1 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-money-bill-trend-up"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Faturamento Líquido</p>
            <h3 class="text-lg font-extrabold text-gray-900 truncate" id="card-fat-liquido">R$ 0,00</h3>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-hand-holding-dollar"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Total Recebido</p>
            <h3 class="text-lg font-extrabold text-gray-900 truncate" id="card-recebido">R$ 0,00</h3>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Total a Receber</p>
            <h3 class="text-lg font-extrabold text-gray-900 truncate" id="card-a-receber">R$ 0,00</h3>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Custos Realizados</p>
            <h3 class="text-lg font-extrabold text-gray-900 truncate" id="card-custos">R$ 0,00</h3>
          </div>
        </div>
      </div>

      <!-- Indicadores Linha 2 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div id="icon-resultado-bg" class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
            <i id="icon-resultado" class="fa-solid fa-scale-balanced"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Resultado / Lucro</p>
            <h3 class="text-lg font-extrabold text-gray-900 truncate" id="card-resultado">R$ 0,00</h3>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-percent"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Margem %</p>
            <h3 class="text-lg font-extrabold text-gray-900 truncate" id="card-margem">0%</h3>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-cart-shopping"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Nº de Vendas</p>
            <h3 class="text-lg font-extrabold text-gray-900 truncate" id="card-num-vendas">0</h3>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-receipt"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400">Ticket Médio</p>
            <h3 class="text-lg font-extrabold text-gray-900 truncate" id="card-ticket-medio">R$ 0,00</h3>
          </div>
        </div>
      </div>

      <!-- Alertas e Progresso de Meta -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Alertas de Estoque -->
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-500"></i> Alertas de Estoque Crítico
          </h3>
          <ul id="lista-alertas-estoque" class="text-xs text-gray-600 space-y-1.5">
            <li>Nenhum produto cadastrado com estoque baixo.</li>
          </ul>
        </div>

        <!-- Meta de Faturamento -->
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <i class="fa-solid fa-bullseye text-blue-500"></i> Meta de Faturamento
            </h3>
            <span id="meta-progresso-percent" class="text-xs font-bold text-blue-600">0%</span>
          </div>
          <div class="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
            <div id="meta-progresso-bar" class="bg-blue-600 h-3 rounded-full transition-all" style="width: 0%"></div>
          </div>
          <p id="meta-progresso-text" class="text-xs text-gray-500 text-right">R$ 0,00 de R$ 0,00</p>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-4">Faturamento vs. Custos Realizados</h3>
          <div class="h-64">
            <canvas id="chart-fat-custos"></canvas>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-4">Vendas por Produto / Serviço</h3>
          <div class="h-64 flex items-center justify-center">
            <canvas id="chart-vendas-produto"></canvas>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-4">Custos por Categoria</h3>
          <div class="h-64">
            <canvas id="chart-custos-categoria"></canvas>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="text-sm font-bold text-gray-800 mb-4">Formas de Pagamento Utilizadas</h3>
          <div class="h-64 flex items-center justify-center">
            <canvas id="chart-formas-pagamento"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  await initDashboard();
}

async function initDashboard() {
  await loadFiltros();
  
  document.getElementById('btn-aplicar-filtros')?.addEventListener('click', () => {
    updateDashboard();
  });
  
  document.getElementById('filter-projeto')?.addEventListener('change', async (e) => {
    const projetoId = e.target.value;
    await updateEquipeOptions(projetoId);
  });

  await updateDashboard();
}

async function loadFiltros() {
  try {
    const { data: projetos } = await db.from('projetos');
    const selectProjeto = document.getElementById('filter-projeto');
    
    if (selectProjeto && projetos) {
      projetos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.nome;
        selectProjeto.appendChild(option);
      });
    }
    await updateEquipeOptions('');
  } catch (error) {
    console.error('Erro ao carregar filtros:', error);
  }
}

async function updateEquipeOptions(projetoId) {
  try {
    const { data: todasEquipes } = await db.from('equipes');
    let equipes = todasEquipes || [];
    if (projetoId) {
      equipes = equipes.filter(e => e.projeto_id === projetoId);
    }

    const selectEquipe = document.getElementById('filter-equipe');
    if (!selectEquipe) return;
    selectEquipe.innerHTML = '<option value="">Todas as Equipes</option>';
    
    equipes.forEach(eq => {
      const option = document.createElement('option');
      option.value = eq.id;
      option.textContent = eq.nome;
      selectEquipe.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao atualizar equipes:', error);
  }
}

async function updateDashboard() {
  try {
    const projetoId = document.getElementById('filter-projeto')?.value || '';
    const equipeId = document.getElementById('filter-equipe')?.value || '';
    const dataInicio = document.getElementById('filter-data-inicio')?.value || '';
    const dataFim = document.getElementById('filter-data-fim')?.value || '';

    const { data: todasVendas } = await db.from('vendas');
    const { data: todosItens } = await db.from('itens_venda');
    const { data: todosRecebimentos } = await db.from('recebimentos');
    const { data: todosCustos } = await db.from('custos');
    const { data: produtos } = await db.from('produtos');
    const { data: projetos } = await db.from('projetos');
    const { data: categoriasCusto } = await db.from('categorias_custo');
    const { data: equipes } = await db.from('equipes');

    let vendas = todasVendas || [];
    let custos = todosCustos || [];
    
    vendas = vendas.filter(v => {
      if (projetoId && v.projeto_id !== projetoId) return false;
      if (equipeId && v.equipe_id !== equipeId) return false;
      if (dataInicio && v.data && v.data < dataInicio) return false;
      if (dataFim && v.data && v.data > dataFim) return false;
      return true;
    });

    const vendasValidasIds = vendas.filter(v => v.situacao !== 'cancelada').map(v => v.id);
    const vendasEfetivadas = vendas.filter(v => v.situacao !== 'cancelada' && v.situacao !== 'orcamento');

    custos = custos.filter(c => {
      if (projetoId && c.projeto_id !== projetoId) return false;
      if (equipeId && c.equipe_id !== equipeId) return false;
      if (dataInicio && c.data && c.data < dataInicio) return false;
      if (dataFim && c.data && c.data > dataFim) return false;
      return true;
    });

    let faturamentoBruto = 0;
    if (todosItens) {
      todosItens.forEach(item => {
        if (vendasValidasIds.includes(item.venda_id)) {
          faturamentoBruto += Number(item.subtotal) || 0;
        }
      });
    }

    let descontos = 0;
    vendas.forEach(v => {
      if (v.situacao !== 'cancelada') {
        descontos += Number(v.desconto) || 0;
      }
    });

    const faturamentoLiquido = Math.max(0, faturamentoBruto - descontos);

    let recebido = 0;
    if (todosRecebimentos) {
      todosRecebimentos.forEach(r => {
        if (vendasValidasIds.includes(r.venda_id)) {
          recebido += Number(r.valor) || 0;
        }
      });
    }

    const aReceber = Math.max(0, faturamentoLiquido - recebido);

    let custosRealizados = 0;
    custos.forEach(c => {
      if (c.situacao === 'pago') {
        custosRealizados += (Number(c.valor) || 0) * (Number(c.quantidade) || 1);
      }
    });

    const resultado = faturamentoLiquido - custosRealizados;
    const margem = faturamentoLiquido > 0 ? (resultado / faturamentoLiquido) * 100 : null;
    const numVendas = vendasEfetivadas.length;
    const ticketMedio = numVendas > 0 ? faturamentoLiquido / numVendas : 0;

    const elFat = document.getElementById('card-fat-liquido');
    const elRec = document.getElementById('card-recebido');
    const elARec = document.getElementById('card-a-receber');
    const elCust = document.getElementById('card-custos');
    const cardResultado = document.getElementById('card-resultado');
    const iconResultadoBg = document.getElementById('icon-resultado-bg');
    const iconResultado = document.getElementById('icon-resultado');

    if (elFat) elFat.textContent = formatCurrency(faturamentoLiquido);
    if (elRec) elRec.textContent = formatCurrency(recebido);
    if (elARec) elARec.textContent = formatCurrency(aReceber);
    if (elCust) elCust.textContent = formatCurrency(custosRealizados);
    
    if (cardResultado) {
      cardResultado.textContent = formatCurrency(resultado);
      if (resultado > 0) {
        cardResultado.className = 'text-lg font-extrabold text-emerald-600 truncate';
        if (iconResultadoBg) iconResultadoBg.className = 'w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0';
      } else if (resultado < 0) {
        cardResultado.className = 'text-lg font-extrabold text-red-600 truncate';
        if (iconResultadoBg) iconResultadoBg.className = 'w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl flex-shrink-0';
      } else {
        cardResultado.className = 'text-lg font-extrabold text-gray-900 truncate';
        if (iconResultadoBg) iconResultadoBg.className = 'w-12 h-12 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center text-xl flex-shrink-0';
      }
    }

    const elMargem = document.getElementById('card-margem');
    const elNumVendas = document.getElementById('card-num-vendas');
    const elTicketMedio = document.getElementById('card-ticket-medio');

    if (elMargem) elMargem.textContent = margem !== null ? margem.toFixed(1) + '%' : '0%';
    if (elNumVendas) elNumVendas.textContent = numVendas;
    if (elTicketMedio) elTicketMedio.textContent = formatCurrency(ticketMedio);

    const alertasUl = document.getElementById('lista-alertas-estoque');
    if (alertasUl) {
      const produtosBaixoEstoque = (produtos || []).filter(p => p.tipo === 'produto' && p.estoque_disponivel <= (p.estoque_minimo || 0));
      if (produtosBaixoEstoque.length === 0) {
        alertasUl.innerHTML = '<li class="text-gray-400">Nenhum produto cadastrado com estoque crítico.</li>';
      } else {
        alertasUl.innerHTML = '';
        produtosBaixoEstoque.forEach(p => {
          alertasUl.innerHTML += `<li class="text-red-600 font-semibold"><i class="fa-solid fa-box-open mr-1"></i> ${p.nome}: ${p.estoque_disponivel} un. (Mínimo: ${p.estoque_minimo || 0})</li>`;
        });
      }
    }

    let metaTotal = 0;
    if (projetoId) {
      const p = (projetos || []).find(x => x.id === projetoId);
      if (p && p.meta_faturamento) metaTotal = Number(p.meta_faturamento);
    } else {
      (projetos || []).forEach(p => {
        if (p.meta_faturamento) metaTotal += Number(p.meta_faturamento);
      });
    }

    const progresso = metaTotal > 0 ? Math.min(100, (faturamentoLiquido / metaTotal) * 100) : 0;
    const elMetaPercent = document.getElementById('meta-progresso-percent');
    const elMetaBar = document.getElementById('meta-progresso-bar');
    const elMetaText = document.getElementById('meta-progresso-text');

    if (elMetaPercent) elMetaPercent.textContent = progresso.toFixed(1) + '%';
    if (elMetaBar) elMetaBar.style.width = progresso + '%';
    if (elMetaText) elMetaText.textContent = `${formatCurrency(faturamentoLiquido)} de ${formatCurrency(metaTotal)}`;

    renderCharts(vendas.filter(v => v.situacao !== 'cancelada'), custos, todosItens, produtos, categoriasCusto, equipes);

  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
  }
}

function renderCharts(vendas, custos, itens, produtos, categorias, equipes) {
  cleanup();
  
  if (typeof Chart === 'undefined') return;

  const canvasFatCustos = document.getElementById('chart-fat-custos');
  if (canvasFatCustos) {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const fatPorMes = Array(12).fill(0);
    const custosPorMes = Array(12).fill(0);

    vendas.forEach(v => {
      if (v.data) {
        const m = new Date(v.data).getMonth();
        let sub = 0;
        if (itens) {
          itens.forEach(i => {
            if (i.venda_id === v.id) sub += Number(i.subtotal) || 0;
          });
        }
        if (m >= 0 && m < 12) fatPorMes[m] += (sub - (Number(v.desconto) || 0));
      }
    });

    custos.forEach(c => {
      if (c.situacao === 'pago' && c.data) {
        const m = new Date(c.data).getMonth();
        if (m >= 0 && m < 12) custosPorMes[m] += (Number(c.valor) || 0) * (Number(c.quantidade) || 1);
      }
    });

    chartInstances.fatCustos = new Chart(canvasFatCustos, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [
          { label: 'Faturamento', data: fatPorMes, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.3 },
          { label: 'Custos Realizados', data: custosPorMes, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const canvasVendasProd = document.getElementById('chart-vendas-produto');
  if (canvasVendasProd) {
    const vendasProduto = {};
    if (itens) {
      itens.forEach(i => {
        if (vendas.find(v => v.id === i.venda_id)) {
          const prod = (produtos || []).find(p => p.id === i.produto_id);
          const nome = prod ? prod.nome : 'Outros';
          vendasProduto[nome] = (vendasProduto[nome] || 0) + (Number(i.subtotal) || 0);
        }
      });
    }

    const labels = Object.keys(vendasProduto);
    const data = Object.values(vendasProduto);

    chartInstances.vendasProd = new Chart(canvasVendasProd, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Sem vendas registradas'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: data.length > 0 ? ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'] : ['#e2e8f0']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const canvasCustosCat = document.getElementById('chart-custos-categoria');
  if (canvasCustosCat) {
    const custosCat = {};
    custos.forEach(c => {
      const cat = (categorias || []).find(x => x.id === c.categoria_id);
      const nome = cat ? cat.nome : 'Outros Custos';
      custosCat[nome] = (custosCat[nome] || 0) + ((Number(c.valor) || 0) * (Number(c.quantidade) || 1));
    });

    const labels = Object.keys(custosCat);
    const data = Object.values(custosCat);

    chartInstances.custosCat = new Chart(canvasCustosCat, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Nenhum custo registrado'],
        datasets: [{
          label: 'Valor Total (R$)',
          data: data.length > 0 ? data : [0],
          backgroundColor: '#ef4444'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const canvasFormas = document.getElementById('chart-formas-pagamento');
  if (canvasFormas) {
    const formasPag = {};
    vendas.forEach(v => {
      const forma = {
        dinheiro: 'Dinheiro',
        pix: 'Pix',
        cartao_credito: 'Cartão de Crédito',
        cartao_debito: 'Cartão de Débito',
        transferencia: 'Transferência'
      }[v.forma_pagamento] || v.forma_pagamento || 'Outro';
      formasPag[forma] = (formasPag[forma] || 0) + 1;
    });

    const labels = Object.keys(formasPag);
    const data = Object.values(formasPag);

    chartInstances.formasPag = new Chart(canvasFormas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['Nenhuma venda'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: data.length > 0 ? ['#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#64748b'] : ['#e2e8f0']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

export function cleanup() {
  Object.values(chartInstances).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  chartInstances = {};
}
