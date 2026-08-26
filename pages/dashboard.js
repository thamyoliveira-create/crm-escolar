import { db } from '../db.js';
import { formatCurrency, formatDate } from '../utils.js';

let chartInstances = {};

export async function render() {
  return `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      <!-- Filtros -->
      <div class="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 class="text-lg font-semibold text-gray-700">Filtros</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Projeto</label>
            <select id="filter-projeto" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Todos os Projetos</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Equipe</label>
            <select id="filter-equipe" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Todas as Equipes</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Data Inicial</label>
            <input type="date" id="filter-data-inicio" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Data Final</label>
            <input type="date" id="filter-data-fim" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
          </div>
        </div>
        <div class="flex justify-end">
          <button id="btn-aplicar-filtros" class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Aplicar Filtros
          </button>
        </div>
      </div>

      <!-- Cards Linha 1 -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Faturamento Líquido</dt>
                  <dd class="text-lg font-semibold text-gray-900" id="card-fat-liquido">R$ 0,00</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Recebido</dt>
                  <dd class="text-lg font-semibold text-gray-900" id="card-recebido">R$ 0,00</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-orange-100 rounded-md p-3">
                <svg class="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total a Receber</dt>
                  <dd class="text-lg font-semibold text-gray-900" id="card-a-receber">R$ 0,00</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Custos Realizados</dt>
                  <dd class="text-lg font-semibold text-gray-900" id="card-custos">R$ 0,00</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cards Linha 2 -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-gray-100 rounded-md p-3" id="icon-resultado-bg">
                <svg class="h-6 w-6 text-gray-600" id="icon-resultado" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Resultado</dt>
                  <dd class="text-lg font-semibold text-gray-900" id="card-resultado">R$ 0,00</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Margem %</dt>
                  <dd class="text-lg font-semibold text-gray-900" id="card-margem">0%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-teal-100 rounded-md p-3">
                <svg class="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Nº Vendas (Efetivadas)</dt>
                  <dd class="text-lg font-semibold text-gray-900" id="card-num-vendas">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Ticket Médio</dt>
                  <dd class="text-lg font-semibold text-gray-900" id="card-ticket-medio">R$ 0,00</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alertas e Progresso -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Progresso da Meta (Faturamento vs Projetos Selecionados)</h3>
          <div class="relative pt-1">
            <div class="flex mb-2 items-center justify-between">
              <div>
                <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                  Progresso
                </span>
              </div>
              <div class="text-right">
                <span class="text-xs font-semibold inline-block text-indigo-600" id="meta-progresso-percent">
                  0%
                </span>
              </div>
            </div>
            <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div id="meta-progresso-bar" style="width:0%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
            </div>
            <p class="text-sm text-gray-500 mt-2" id="meta-progresso-text">R$ 0,00 de R$ 0,00</p>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium text-red-700 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Alertas de Estoque
          </h3>
          <ul id="lista-alertas-estoque" class="space-y-2 text-sm text-gray-600">
            <li>Carregando alertas...</li>
          </ul>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Faturamento vs Custos</h3>
          <canvas id="chart-fat-custos"></canvas>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Vendas por Produto/Serviço</h3>
          <canvas id="chart-vendas-produto"></canvas>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Custos por Categoria</h3>
          <canvas id="chart-custos-categoria"></canvas>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Resultado por Equipe</h3>
          <canvas id="chart-resultado-equipe"></canvas>
        </div>
        <div class="bg-white p-4 rounded-lg shadow lg:col-span-2">
          <h3 class="text-lg font-medium text-gray-900 mb-4 text-center">Formas de Pagamento (Vendas)</h3>
          <div class="w-full max-w-md mx-auto">
            <canvas id="chart-formas-pagamento"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function init() {
  await loadFiltros();
  
  document.getElementById('btn-aplicar-filtros').addEventListener('click', () => {
    updateDashboard();
  });
  
  document.getElementById('filter-projeto').addEventListener('change', async (e) => {
    const projetoId = e.target.value;
    await updateEquipeOptions(projetoId);
  });

  await updateDashboard();
}

async function loadFiltros() {
  try {
    const { data: projetos } = await db.projetos.list();
    const selectProjeto = document.getElementById('filter-projeto');
    
    if (projetos) {
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
    let equipes = [];
    if (projetoId) {
      const result = await db.equipes.listByProjeto(projetoId);
      equipes = result.data || [];
    } else {
      const result = await db.equipes.list();
      equipes = result.data || [];
    }

    const selectEquipe = document.getElementById('filter-equipe');
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
    const projetoId = document.getElementById('filter-projeto').value;
    const equipeId = document.getElementById('filter-equipe').value;
    const dataInicio = document.getElementById('filter-data-inicio').value;
    const dataFim = document.getElementById('filter-data-fim').value;

    const { data: todasVendas } = await db.vendas.list();
    const { data: todosItens } = await db.itensVenda.list();
    const { data: todosRecebimentos } = await db.recebimentos.list();
    const { data: todosCustos } = await db.custos.list();
    const { data: produtos } = await db.produtos.list();
    const { data: projetos } = await db.projetos.list();
    const { data: categoriasCusto } = await db.categoriasCusto.list();
    const { data: equipes } = await db.equipes.list();

    let vendas = todasVendas || [];
    let custos = todosCustos || [];
    
    // Filtrar vendas
    vendas = vendas.filter(v => {
      if (projetoId && v.projeto_id !== projetoId) return false;
      if (equipeId && v.equipe_id !== equipeId) return false;
      if (dataInicio && new Date(v.data_venda) < new Date(dataInicio)) return false;
      if (dataFim && new Date(v.data_venda) > new Date(dataFim + 'T23:59:59')) return false;
      return true;
    });

    const vendasValidasIds = vendas.filter(v => v.situacao !== 'cancelada').map(v => v.id);
    const vendasEfetivadasIds = vendas.filter(v => v.situacao !== 'cancelada' && v.situacao !== 'orcamento').map(v => v.id);

    // Filtrar custos
    custos = custos.filter(c => {
      if (projetoId && c.projeto_id !== projetoId) return false;
      if (equipeId && c.equipe_id !== equipeId) return false;
      if (dataInicio && new Date(c.data_despesa) < new Date(dataInicio)) return false;
      if (dataFim && new Date(c.data_despesa) > new Date(dataFim + 'T23:59:59')) return false;
      return true;
    });

    // Cálculos Financeiros
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

    const faturamentoLiquido = faturamentoBruto - descontos;

    let recebido = 0;
    if (todosRecebimentos) {
      todosRecebimentos.forEach(r => {
        if (vendasValidasIds.includes(r.venda_id) && r.situacao === 'pago') {
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
    const numVendas = vendasEfetivadasIds.length;
    const ticketMedio = numVendas > 0 ? faturamentoLiquido / numVendas : 0;

    // Atualizar Cards
    document.getElementById('card-fat-liquido').textContent = formatCurrency(faturamentoLiquido);
    document.getElementById('card-recebido').textContent = formatCurrency(recebido);
    document.getElementById('card-a-receber').textContent = formatCurrency(aReceber);
    document.getElementById('card-custos').textContent = formatCurrency(custosRealizados);
    
    const cardResultado = document.getElementById('card-resultado');
    const iconResultadoBg = document.getElementById('icon-resultado-bg');
    const iconResultado = document.getElementById('icon-resultado');
    
    cardResultado.textContent = formatCurrency(resultado);
    if (resultado > 0) {
      cardResultado.classList.replace('text-gray-900', 'text-green-600');
      iconResultadoBg.className = 'flex-shrink-0 bg-green-100 rounded-md p-3';
      iconResultado.className = 'h-6 w-6 text-green-600';
    } else if (resultado < 0) {
      cardResultado.classList.replace('text-gray-900', 'text-red-600');
      iconResultadoBg.className = 'flex-shrink-0 bg-red-100 rounded-md p-3';
      iconResultado.className = 'h-6 w-6 text-red-600';
    } else {
      cardResultado.classList.replace('text-green-600', 'text-gray-900');
      cardResultado.classList.replace('text-red-600', 'text-gray-900');
      iconResultadoBg.className = 'flex-shrink-0 bg-gray-100 rounded-md p-3';
      iconResultado.className = 'h-6 w-6 text-gray-600';
    }

    document.getElementById('card-margem').textContent = margem !== null ? margem.toFixed(2) + '%' : 'Não calculável';
    document.getElementById('card-num-vendas').textContent = numVendas;
    document.getElementById('card-ticket-medio').textContent = formatCurrency(ticketMedio);

    // Alertas de Estoque
    const alertasUl = document.getElementById('lista-alertas-estoque');
    alertasUl.innerHTML = '';
    const produtosBaixoEstoque = (produtos || []).filter(p => p.tipo === 'produto' && p.controlar_estoque && p.estoque_disponivel <= (p.estoque_minimo || 0));
    
    if (produtosBaixoEstoque.length === 0) {
      alertasUl.innerHTML = '<li>Nenhum produto com estoque baixo.</li>';
    } else {
      produtosBaixoEstoque.forEach(p => {
        alertasUl.innerHTML += `<li><strong>${p.nome}</strong>: ${p.estoque_disponivel} (Mín: ${p.estoque_minimo || 0})</li>`;
      });
    }

    // Progresso da Meta
    let metaTotal = 0;
    if (projetoId) {
      const p = projetos.find(x => x.id === projetoId);
      if (p && p.meta_faturamento) metaTotal = Number(p.meta_faturamento);
    } else {
      (projetos || []).forEach(p => {
        if (p.meta_faturamento) metaTotal += Number(p.meta_faturamento);
      });
    }

    const progresso = metaTotal > 0 ? Math.min(100, (faturamentoLiquido / metaTotal) * 100) : 0;
    document.getElementById('meta-progresso-percent').textContent = progresso.toFixed(1) + '%';
    document.getElementById('meta-progresso-bar').style.width = progresso + '%';
    document.getElementById('meta-progresso-text').textContent = \`\${formatCurrency(faturamentoLiquido)} de \${formatCurrency(metaTotal)}\`;

    // Preparar dados para Gráficos
    renderCharts(vendas.filter(v => v.situacao !== 'cancelada'), custos, todosItens, produtos, categoriasCusto, equipes);

  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
  }
}

function renderCharts(vendas, custos, itens, produtos, categorias, equipes) {
  cleanup(); // destroy old charts
  
  // 1. Faturamento vs Custos por mês
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const fatPorMes = Array(12).fill(0);
  const custosPorMes = Array(12).fill(0);

  vendas.forEach(v => {
    const data = new Date(v.data_venda);
    const m = data.getMonth();
    
    let sub = 0;
    if (itens) {
      itens.forEach(i => {
        if (i.venda_id === v.id) sub += Number(i.subtotal) || 0;
      });
    }
    fatPorMes[m] += (sub - (Number(v.desconto) || 0));
  });

  custos.forEach(c => {
    if (c.situacao === 'pago') {
      const data = new Date(c.data_despesa);
      const m = data.getMonth();
      custosPorMes[m] += (Number(c.valor) || 0) * (Number(c.quantidade) || 1);
    }
  });

  chartInstances.fatCustos = new Chart(document.getElementById('chart-fat-custos'), {
    type: 'line',
    data: {
      labels: meses,
      datasets: [
        { label: 'Faturamento', data: fatPorMes, borderColor: 'rgb(75, 192, 192)', tension: 0.1 },
        { label: 'Custos Realizados', data: custosPorMes, borderColor: 'rgb(255, 99, 132)', tension: 0.1 }
      ]
    }
  });

  // 2. Vendas por Produto/Serviço
  const vendasProduto = {};
  if (itens) {
    itens.forEach(i => {
      if (vendas.find(v => v.id === i.venda_id)) {
        const prod = (produtos || []).find(p => p.id === i.produto_id);
        const nome = prod ? prod.nome : 'Desconhecido';
        vendasProduto[nome] = (vendasProduto[nome] || 0) + (Number(i.subtotal) || 0);
      }
    });
  }

  chartInstances.vendasProd = new Chart(document.getElementById('chart-vendas-produto'), {
    type: 'pie',
    data: {
      labels: Object.keys(vendasProduto),
      datasets: [{
        data: Object.values(vendasProduto),
        backgroundColor: ['#4bc0c0', '#ff6384', '#36a2eb', '#ffce56', '#9966ff', '#ff9f40']
      }]
    }
  });

  // 3. Custos por Categoria
  const custosCat = {};
  custos.forEach(c => {
    const cat = (categorias || []).find(x => x.id === c.categoria_id);
    const nome = cat ? cat.nome : 'Sem categoria';
    custosCat[nome] = (custosCat[nome] || 0) + ((Number(c.valor) || 0) * (Number(c.quantidade) || 1));
  });

  chartInstances.custosCat = new Chart(document.getElementById('chart-custos-categoria'), {
    type: 'bar',
    data: {
      labels: Object.keys(custosCat),
      datasets: [{
        label: 'Custos',
        data: Object.values(custosCat),
        backgroundColor: '#ff6384'
      }]
    }
  });

  // 4. Resultado por Equipe
  const resultadoEquipe = {};
  (equipes || []).forEach(eq => {
    resultadoEquipe[eq.nome] = { fat: 0, cust: 0 };
  });

  vendas.forEach(v => {
    const eq = (equipes || []).find(x => x.id === v.equipe_id);
    if (eq) {
      let sub = 0;
      if (itens) {
        itens.forEach(i => {
          if (i.venda_id === v.id) sub += Number(i.subtotal) || 0;
        });
      }
      resultadoEquipe[eq.nome].fat += (sub - (Number(v.desconto) || 0));
    }
  });

  custos.forEach(c => {
    if (c.situacao === 'pago') {
      const eq = (equipes || []).find(x => x.id === c.equipe_id);
      if (eq) {
        resultadoEquipe[eq.nome].cust += ((Number(c.valor) || 0) * (Number(c.quantidade) || 1));
      }
    }
  });

  const nomesEquipes = Object.keys(resultadoEquipe);
  const resultadosArray = nomesEquipes.map(nome => resultadoEquipe[nome].fat - resultadoEquipe[nome].cust);

  chartInstances.resEquipe = new Chart(document.getElementById('chart-resultado-equipe'), {
    type: 'bar',
    options: { indexAxis: 'y' },
    data: {
      labels: nomesEquipes,
      datasets: [{
        label: 'Resultado',
        data: resultadosArray,
        backgroundColor: resultadosArray.map(v => v >= 0 ? '#4bc0c0' : '#ff6384')
      }]
    }
  });

  // 5. Formas de Pagamento
  const formasPag = {};
  vendas.forEach(v => {
    const forma = v.forma_pagamento || 'Não informada';
    formasPag[forma] = (formasPag[forma] || 0) + 1;
  });

  chartInstances.formasPag = new Chart(document.getElementById('chart-formas-pagamento'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(formasPag),
      datasets: [{
        data: Object.values(formasPag),
        backgroundColor: ['#36a2eb', '#ffce56', '#4bc0c0', '#ff6384', '#9966ff']
      }]
    }
  });
}

export function cleanup() {
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.destroy();
  });
  chartInstances = {};
}
