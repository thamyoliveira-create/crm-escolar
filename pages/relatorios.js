import { db } from '../db.js';
import { formatCurrency, formatDate, showToast, exportCSV, exportPDF } from '../utils.js';

export async function render(container) {
    container.innerHTML = `
        <div class="p-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-6">Relatórios</h1>

            <div class="mb-6">
                <nav class="flex space-x-4 border-b border-gray-200" id="tabs-relatorios">
                    <button class="tab-btn px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600" data-target="tab-vendas">Vendas</button>
                    <button class="tab-btn px-4 py-2 font-medium text-gray-500 hover:text-gray-700" data-target="tab-clientes">Clientes</button>
                    <button class="tab-btn px-4 py-2 font-medium text-gray-500 hover:text-gray-700" data-target="tab-produtos">Produtos</button>
                    <button class="tab-btn px-4 py-2 font-medium text-gray-500 hover:text-gray-700" data-target="tab-custos">Custos</button>
                    <button class="tab-btn px-4 py-2 font-medium text-gray-500 hover:text-gray-700" data-target="tab-resultados">Resultados</button>
                </nav>
            </div>

            <!-- Vendas -->
            <div id="tab-vendas" class="tab-content block">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold">Relatório de Vendas</h2>
                    <div class="space-x-2">
                        <button class="btn-export-csv bg-gray-100 px-3 py-1 rounded" data-table="table-rel-vendas">CSV</button>
                        <button class="btn-export-pdf bg-gray-100 px-3 py-1 rounded" data-table="table-rel-vendas">PDF</button>
                    </div>
                </div>
                <div class="bg-white rounded shadow p-4 mb-4" id="vendas-summary"></div>
                <div class="bg-white rounded shadow overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200" id="table-rel-vendas">
                        <thead class="bg-gray-50">
                            <tr><th class="px-4 py-2">ID</th><th class="px-4 py-2">Cliente</th><th class="px-4 py-2">Valor</th><th class="px-4 py-2">Status</th></tr>
                        </thead>
                        <tbody id="tbody-rel-vendas"></tbody>
                    </table>
                </div>
            </div>

            <!-- Clientes -->
            <div id="tab-clientes" class="tab-content hidden">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold">Relatório de Clientes</h2>
                    <div class="space-x-2">
                        <button class="btn-export-csv bg-gray-100 px-3 py-1 rounded" data-table="table-rel-clientes">CSV</button>
                        <button class="btn-export-pdf bg-gray-100 px-3 py-1 rounded" data-table="table-rel-clientes">PDF</button>
                    </div>
                </div>
                <div class="bg-white rounded shadow p-4 mb-4" id="clientes-summary"></div>
                <div class="bg-white rounded shadow overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200" id="table-rel-clientes">
                        <thead class="bg-gray-50">
                            <tr><th class="px-4 py-2">Nome</th><th class="px-4 py-2">Tipo</th><th class="px-4 py-2">Etapa</th></tr>
                        </thead>
                        <tbody id="tbody-rel-clientes"></tbody>
                    </table>
                </div>
            </div>

            <!-- Produtos -->
            <div id="tab-produtos" class="tab-content hidden">
                 <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold">Estoque & Produtos</h2>
                    <div class="space-x-2">
                        <button class="btn-export-csv bg-gray-100 px-3 py-1 rounded" data-table="table-rel-produtos">CSV</button>
                        <button class="btn-export-pdf bg-gray-100 px-3 py-1 rounded" data-table="table-rel-produtos">PDF</button>
                    </div>
                </div>
                <div class="bg-white rounded shadow p-4 mb-4" id="produtos-summary"></div>
                <div class="bg-white rounded shadow overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200" id="table-rel-produtos">
                        <thead class="bg-gray-50">
                            <tr><th class="px-4 py-2">Nome</th><th class="px-4 py-2">Estoque</th><th class="px-4 py-2">Mínimo</th><th class="px-4 py-2">Status</th></tr>
                        </thead>
                        <tbody id="tbody-rel-produtos"></tbody>
                    </table>
                </div>
            </div>

            <!-- Custos -->
            <div id="tab-custos" class="tab-content hidden">
                 <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold">Custos</h2>
                </div>
                <div class="bg-white rounded shadow overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200" id="table-rel-custos">
                        <thead class="bg-gray-50">
                            <tr><th class="px-4 py-2">Descrição</th><th class="px-4 py-2">Categoria</th><th class="px-4 py-2">Valor</th></tr>
                        </thead>
                        <tbody id="tbody-rel-custos"></tbody>
                    </table>
                </div>
            </div>

            <!-- Resultados -->
            <div id="tab-resultados" class="tab-content hidden">
                 <div class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-bold">Resultados</h2>
                </div>
                <div class="bg-white rounded shadow p-4 mb-4" id="resultados-summary"></div>
            </div>

        </div>
    `;

    setupTabs();
    setupExports();
    await loadData();
}

function setupTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => {
                b.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                b.classList.add('text-gray-500');
            });
            btn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            btn.classList.remove('text-gray-500');

            contents.forEach(c => c.classList.add('hidden'));
            document.getElementById(btn.dataset.target).classList.remove('hidden');
        });
    });
}

function setupExports() {
    document.querySelectorAll('.btn-export-csv').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tableId = e.target.dataset.table;
            exportCSV(tableId, 'relatorio.csv');
        });
    });
    document.querySelectorAll('.btn-export-pdf').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tableId = e.target.dataset.table;
            exportPDF(tableId, 'Relatório', 'relatorio.pdf');
        });
    });
}

async function loadData() {
    try {
        // Vendas
        const vendas = await db.from('vendas').select('*') || [];
        let htmlVendas = '';
        let totalVendas = 0;
        vendas.forEach(v => {
            totalVendas += v.valor_total;
            htmlVendas += \`<tr><td class="px-4 py-2">#\${v.numero}</td><td class="px-4 py-2">\${v.cliente_nome}</td><td class="px-4 py-2">\${formatCurrency(v.valor_total)}</td><td class="px-4 py-2">\${v.status}</td></tr>\`;
        });
        document.getElementById('tbody-rel-vendas').innerHTML = htmlVendas;
        document.getElementById('vendas-summary').innerHTML = \`<p>Total Bruto: <strong>\${formatCurrency(totalVendas)}</strong></p>\`;

        // Clientes
        const clientes = await db.from('clientes').select('*') || [];
        let htmlClientes = '';
        clientes.forEach(c => {
            htmlClientes += \`<tr><td class="px-4 py-2">\${c.nome}</td><td class="px-4 py-2">\${c.tipo}</td><td class="px-4 py-2">\${c.etapa_funil}</td></tr>\`;
        });
        document.getElementById('tbody-rel-clientes').innerHTML = htmlClientes;
        document.getElementById('clientes-summary').innerHTML = \`<p>Total de Clientes: <strong>\${clientes.length}</strong></p>\`;

        // Produtos
        const produtos = await db.from('produtos').select('*') || [];
        let htmlProdutos = '';
        produtos.forEach(p => {
            const isLow = p.estoque <= p.estoque_minimo;
            const statusClass = isLow ? 'text-red-600 font-bold' : 'text-green-600';
            const statusText = isLow ? 'Baixo' : 'OK';
            htmlProdutos += \`<tr><td class="px-4 py-2">\${p.nome}</td><td class="px-4 py-2 \${statusClass}">\${p.estoque}</td><td class="px-4 py-2">\${p.estoque_minimo}</td><td class="px-4 py-2 \${statusClass}">\${statusText}</td></tr>\`;
        });
        document.getElementById('tbody-rel-produtos').innerHTML = htmlProdutos;

        // Custos
        const custos = await db.from('custos').select('*') || [];
        let htmlCustos = '';
        let totalCustos = 0;
        custos.forEach(c => {
            totalCustos += c.valor;
            htmlCustos += \`<tr><td class="px-4 py-2">\${c.descricao}</td><td class="px-4 py-2">\${c.categoria}</td><td class="px-4 py-2">\${formatCurrency(c.valor)}</td></tr>\`;
        });
        document.getElementById('tbody-rel-custos').innerHTML = htmlCustos;

        // Resultados
        const lucro = totalVendas - totalCustos;
        document.getElementById('resultados-summary').innerHTML = \`
            <p>Faturamento: <span class="text-green-600 font-bold">\${formatCurrency(totalVendas)}</span></p>
            <p>Custos: <span class="text-red-600 font-bold">\${formatCurrency(totalCustos)}</span></p>
            <p>Lucro Líquido: <span class="font-bold \${lucro >= 0 ? 'text-blue-600' : 'text-red-600'}">\${formatCurrency(lucro)}</span></p>
        \`;

    } catch (e) {
        console.error(e);
        showToast('Erro ao carregar relatórios', 'error');
    }
}

export function cleanup() {
}
