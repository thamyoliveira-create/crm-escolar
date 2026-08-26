import { db } from '../db.js';
import { formatCurrency, formatDate, showToast, exportCSV, exportPDF } from '../utils.js';

let currentData = [];

export async function render(container) {
    container.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Recebimentos</h1>
                <div class="space-x-2">
                    <button id="btn-export-csv" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow">Exportar CSV</button>
                    <button id="btn-export-pdf" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow">Exportar PDF</button>
                    <button id="btn-registrar" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">+ Registrar Recebimento</button>
                </div>
            </div>

            <!-- Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Total Recebido no Período</h3>
                    <p id="card-total" class="text-2xl font-bold text-gray-800 mt-2">R$ 0,00</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Total de Recebimentos</h3>
                    <p id="card-count" class="text-2xl font-bold text-gray-800 mt-2">0</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h3 class="text-gray-500 text-sm font-medium">Média por Recebimento</h3>
                    <p id="card-avg" class="text-2xl font-bold text-gray-800 mt-2">R$ 0,00</p>
                </div>
            </div>

            <!-- Filtros -->
            <div class="bg-white p-4 rounded-lg shadow border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Período</label>
                    <div class="flex items-center space-x-2">
                        <input type="date" id="filter-date-start" class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <span class="text-gray-500">até</span>
                        <input type="date" id="filter-date-end" class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                    <select id="filter-payment" class="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Todas</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">PIX</option>
                        <option value="debito">Cartão de Débito</option>
                        <option value="credito">Cartão de Crédito</option>
                        <option value="transferencia">Transferência</option>
                    </select>
                </div>
                <div class="flex-grow">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Busca</label>
                    <input type="text" id="filter-search" placeholder="Buscar por cliente ou Nº venda..." class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                </div>
            </div>

            <!-- Tabela -->
            <div class="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200" id="table-recebimentos">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venda Nº</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma de Pagto</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrado Por</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200" id="tbody-recebimentos">
                            <!-- Linhas serão inseridas aqui -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal Registrar -->
        <div id="modal-registrar" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-900">Registrar Recebimento</h3>
                    <button id="modal-close" class="text-gray-400 hover:text-gray-500">&times;</button>
                </div>
                <form id="form-registrar" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Venda</label>
                        <select id="reg-venda" required class="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"></select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" id="reg-data" required class="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Valor</label>
                        <input type="number" step="0.01" id="reg-valor" required class="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                        <select id="reg-forma" required class="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="dinheiro">Dinheiro</option>
                            <option value="pix">PIX</option>
                            <option value="debito">Cartão de Débito</option>
                            <option value="credito">Cartão de Crédito</option>
                            <option value="transferencia">Transferência</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Observação</label>
                        <textarea id="reg-obs" rows="2" class="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
                    </div>
                    <div class="flex justify-end space-x-2 pt-4">
                        <button type="button" id="modal-cancel" class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadData();
    setupListeners();
}

async function loadData() {
    try {
        const recebimentos = await db.from('recebimentos').select('*, vendas(id, numero, cliente_nome, valor_total), usuarios(nome)');
        currentData = recebimentos || [];
        renderTable();
    } catch (error) {
        console.error('Erro ao carregar recebimentos', error);
        showToast('Erro ao carregar dados', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('tbody-recebimentos');
    if (!tbody) return;

    const search = document.getElementById('filter-search').value.toLowerCase();
    const payment = document.getElementById('filter-payment').value;
    const dateStart = document.getElementById('filter-date-start').value;
    const dateEnd = document.getElementById('filter-date-end').value;

    let filtered = currentData.filter(r => {
        let match = true;
        if (search) {
            const term = search.toLowerCase();
            const cliente = r.vendas?.cliente_nome?.toLowerCase() || '';
            const numero = r.vendas?.numero?.toString() || '';
            if (!cliente.includes(term) && !numero.includes(term)) match = false;
        }
        if (payment && r.forma_pagamento !== payment) match = false;
        if (dateStart && r.data < dateStart) match = false;
        if (dateEnd && r.data > dateEnd) match = false;
        return match;
    });

    filtered.sort((a, b) => new Date(b.data) - new Date(a.data));

    tbody.innerHTML = '';
    let total = 0;
    
    filtered.forEach(r => {
        total += r.valor || 0;
        const tr = document.createElement('tr');
        tr.innerHTML = \`
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${formatDate(r.data)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">#\${r.vendas?.numero || r.venda_id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${r.vendas?.cliente_nome || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">\${formatCurrency(r.valor)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">\${r.forma_pagamento}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${r.usuarios?.nome || 'N/A'}</td>
        \`;
        tbody.appendChild(tr);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Nenhum recebimento encontrado.</td></tr>';
    }

    document.getElementById('card-total').textContent = formatCurrency(total);
    document.getElementById('card-count').textContent = filtered.length;
    document.getElementById('card-avg').textContent = filtered.length > 0 ? formatCurrency(total / filtered.length) : 'R$ 0,00';
}

function setupListeners() {
    document.getElementById('filter-search')?.addEventListener('input', renderTable);
    document.getElementById('filter-payment')?.addEventListener('change', renderTable);
    document.getElementById('filter-date-start')?.addEventListener('change', renderTable);
    document.getElementById('filter-date-end')?.addEventListener('change', renderTable);

    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        exportCSV('table-recebimentos', 'recebimentos.csv');
    });
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
        exportPDF('table-recebimentos', 'Relatório de Recebimentos', 'recebimentos.pdf');
    });

    const modal = document.getElementById('modal-registrar');
    document.getElementById('btn-registrar')?.addEventListener('click', async () => {
        try {
            const vendas = await db.from('vendas').select('*').in('status', ['pendente', 'parcialmente_paga']);
            const select = document.getElementById('reg-venda');
            select.innerHTML = '<option value="">Selecione uma venda...</option>';
            (vendas || []).forEach(v => {
                select.innerHTML += \`<option value="\${v.id}" data-valor="\${v.valor_total}">#\${v.numero} - \${v.cliente_nome} (\${formatCurrency(v.valor_total)})</option>\`;
            });
            document.getElementById('reg-data').value = new Date().toISOString().split('T')[0];
            modal.classList.remove('hidden');
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar vendas', 'error');
        }
    });

    document.getElementById('modal-close')?.addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('modal-cancel')?.addEventListener('click', () => modal.classList.add('hidden'));

    document.getElementById('form-registrar')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const vendaId = document.getElementById('reg-venda').value;
        const data = document.getElementById('reg-data').value;
        const valor = parseFloat(document.getElementById('reg-valor').value);
        const forma = document.getElementById('reg-forma').value;
        const obs = document.getElementById('reg-obs').value;

        if (!vendaId || !data || isNaN(valor)) {
            showToast('Preencha os campos obrigatórios', 'warning');
            return;
        }

        try {
            await db.from('recebimentos').insert([{
                venda_id: vendaId,
                data,
                valor,
                forma_pagamento: forma,
                observacao: obs,
                registrado_por: db.currentUser?.id
            }]);

            const recebimentosVenda = await db.from('recebimentos').select('valor').eq('venda_id', vendaId);
            const totalRecebido = (recebimentosVenda || []).reduce((acc, curr) => acc + curr.valor, 0);
            
            const vendaOpt = document.querySelector(\`#reg-venda option[value="\${vendaId}"]\`);
            const valorTotalVenda = parseFloat(vendaOpt.dataset.valor);

            const novoStatus = totalRecebido >= valorTotalVenda ? 'paga' : 'parcialmente_paga';
            await db.from('vendas').update(vendaId, { status: novoStatus });

            showToast('Recebimento registrado com sucesso!', 'success');
            modal.classList.add('hidden');
            document.getElementById('form-registrar').reset();
            await loadData();
        } catch (error) {
            console.error(error);
            showToast('Erro ao registrar', 'error');
        }
    });
}

export function cleanup() {}
