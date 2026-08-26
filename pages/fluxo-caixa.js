import { db } from '../db.js';
import { formatCurrency, formatDate, showToast, exportCSV, exportPDF } from '../utils.js';

let chartInstance = null;
let currentMovimentacoes = [];

export async function render(container) {
    container.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Fluxo de Caixa</h1>
                <div class="space-x-2">
                    <button id="btn-export-csv" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow">Exportar CSV</button>
                    <button id="btn-export-pdf" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow">Exportar PDF</button>
                </div>
            </div>

            <!-- Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Total Entradas</h3>
                    <p id="card-entradas" class="text-xl font-bold text-green-600 mt-2">R$ 0,00</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Total Saídas</h3>
                    <p id="card-saidas" class="text-xl font-bold text-red-600 mt-2">R$ 0,00</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Saldo do Período</h3>
                    <p id="card-saldo-periodo" class="text-xl font-bold mt-2">R$ 0,00</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Saldo Acumulado</h3>
                    <p id="card-saldo-acumulado" class="text-xl font-bold mt-2">R$ 0,00</p>
                </div>
            </div>

            <!-- Filtros -->
            <div class="bg-white p-4 rounded-lg shadow border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Período</label>
                    <div class="flex items-center space-x-2">
                        <input type="date" id="filter-data-inicio" class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <span class="text-gray-500">até</span>
                        <input type="date" id="filter-data-fim" class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select id="filter-tipo" class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="todos">Todos</option>
                        <option value="entrada">Entradas</option>
                        <option value="saida">Saídas</option>
                    </select>
                </div>
            </div>

            <!-- Gráfico -->
            <div class="bg-white p-4 rounded-lg shadow border border-gray-100 mb-6">
                <canvas id="chart-fluxo" height="100"></canvas>
            </div>

            <!-- Tabela -->
            <div class="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200" id="table-fluxo">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Acumulado</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200" id="tbody-fluxo">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    await loadData();
    setupListeners();
}

async function loadData() {
    try {
        const recebimentos = (await db.from('recebimentos').select('*, vendas(numero, cliente_nome)')) || [];
        const custos = (await db.from('custos').select('*').eq('status', 'pago')) || [];

        let movimentacoes = [];

        recebimentos.forEach(r => {
            movimentacoes.push({
                data: r.data,
                descricao: \`Recebimento - Venda #\${r.vendas?.numero || r.venda_id} (\${r.vendas?.cliente_nome || ''})\`,
                categoria: 'Vendas',
                tipo: 'entrada',
                valor: r.valor
            });
        });

        custos.forEach(c => {
            movimentacoes.push({
                data: c.data_pagamento || c.data_vencimento,
                descricao: c.descricao,
                categoria: c.categoria || 'Geral',
                tipo: 'saida',
                valor: c.valor
            });
        });

        // Ordenar cronologicamente
        movimentacoes.sort((a, b) => new Date(a.data) - new Date(b.data));
        
        // Calcular saldo acumulado
        let saldoAcumulado = 0;
        movimentacoes.forEach(m => {
            if (m.tipo === 'entrada') saldoAcumulado += m.valor;
            else saldoAcumulado -= m.valor;
            m.saldoAcumulado = saldoAcumulado;
        });

        currentMovimentacoes = movimentacoes;
        renderContent();
    } catch (error) {
        console.error('Erro ao carregar fluxo de caixa', error);
        showToast('Erro ao carregar dados', 'error');
    }
}

function renderContent() {
    const dataInicio = document.getElementById('filter-data-inicio').value;
    const dataFim = document.getElementById('filter-data-fim').value;
    const tipoFilter = document.getElementById('filter-tipo').value;

    let filtered = currentMovimentacoes.filter(m => {
        if (dataInicio && m.data < dataInicio) return false;
        if (dataFim && m.data > dataFim) return false;
        if (tipoFilter !== 'todos' && m.tipo !== tipoFilter) return false;
        return true;
    });

    let totalEntradas = 0;
    let totalSaidas = 0;

    const tbody = document.getElementById('tbody-fluxo');
    tbody.innerHTML = '';

    filtered.forEach(m => {
        if (m.tipo === 'entrada') totalEntradas += m.valor;
        else totalSaidas += m.valor;

        const bgClass = m.tipo === 'entrada' ? 'bg-green-50' : 'bg-red-50';
        const colorClass = m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
        
        const tr = document.createElement('tr');
        tr.className = bgClass;
        tr.innerHTML = \`
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${formatDate(m.data)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${m.descricao}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${m.categoria}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium \${colorClass} capitalize">\${m.tipo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium \${colorClass}">\${formatCurrency(m.valor)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">\${formatCurrency(m.saldoAcumulado)}</td>
        \`;
        tbody.appendChild(tr);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Nenhuma movimentação encontrada no período.</td></tr>';
    }

    const saldoPeriodo = totalEntradas - totalSaidas;
    const saldoAcumulado = currentMovimentacoes.length > 0 ? currentMovimentacoes[currentMovimentacoes.length - 1].saldoAcumulado : 0;

    document.getElementById('card-entradas').textContent = formatCurrency(totalEntradas);
    document.getElementById('card-saidas').textContent = formatCurrency(totalSaidas);
    
    const elSaldoPeriodo = document.getElementById('card-saldo-periodo');
    elSaldoPeriodo.textContent = formatCurrency(saldoPeriodo);
    elSaldoPeriodo.className = \`text-xl font-bold mt-2 \${saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}\`;

    const elSaldoAcumulado = document.getElementById('card-saldo-acumulado');
    elSaldoAcumulado.textContent = formatCurrency(saldoAcumulado);
    elSaldoAcumulado.className = \`text-xl font-bold mt-2 \${saldoAcumulado >= 0 ? 'text-blue-600' : 'text-red-600'}\`;

    renderChart(filtered);
}

function renderChart(data) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (typeof Chart === 'undefined') return;

    // Agrupar por data
    const grouped = {};
    data.forEach(m => {
        if (!grouped[m.data]) grouped[m.data] = { entrada: 0, saida: 0, saldo: 0 };
        if (m.tipo === 'entrada') grouped[m.data].entrada += m.valor;
        else grouped[m.data].saida += m.valor;
        grouped[m.data].saldo = m.saldoAcumulado;
    });

    const labels = Object.keys(grouped).sort();
    const entradas = labels.map(l => grouped[l].entrada);
    const saidas = labels.map(l => grouped[l].saida);
    const saldos = labels.map(l => grouped[l].saldo);

    const ctx = document.getElementById('chart-fluxo').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => formatDate(l)),
            datasets: [
                {
                    label: 'Entradas',
                    data: entradas,
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    order: 2
                },
                {
                    label: 'Saídas',
                    data: saidas,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    order: 3
                },
                {
                    label: 'Saldo Acumulado',
                    data: saldos,
                    type: 'line',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function setupListeners() {
    document.getElementById('filter-data-inicio')?.addEventListener('change', renderContent);
    document.getElementById('filter-data-fim')?.addEventListener('change', renderContent);
    document.getElementById('filter-tipo')?.addEventListener('change', renderContent);

    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        exportCSV('table-fluxo', 'fluxo_caixa.csv');
    });
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
        exportPDF('table-fluxo', 'Fluxo de Caixa', 'fluxo_caixa.pdf');
    });
}

export function cleanup() {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}
