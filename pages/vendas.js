import { db } from '../db.js';
import { formatCurrency, formatDate, formatDateTime, generateId, showToast } from '../utils.js';
import { getBadge, createCard, createEmptyState } from '../components.js';

let state = {
    vendas: [],
    filtros: {
        periodo: '',
        equipe: '',
        status: '',
        formaPagamento: '',
        cliente: '',
        busca: ''
    }
};

export async function render(container) {
    container.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Vendas</h1>
                <button id="btn-nova-venda" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Nova Venda</button>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow mb-6">
                <h2 class="font-semibold mb-2">Filtros</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <input type="text" id="filtro-busca" placeholder="Busca por número ou cliente" class="border p-2 rounded">
                    <input type="date" id="filtro-periodo" class="border p-2 rounded">
                    <select id="filtro-equipe" class="border p-2 rounded"><option value="">Todas as Equipes</option></select>
                    <select id="filtro-status" class="border p-2 rounded">
                        <option value="">Status</option>
                        <option value="orcamento">Orçamento</option>
                        <option value="pendente">Pendente</option>
                        <option value="parcialmente_paga">Parcialmente Paga</option>
                        <option value="paga">Paga</option>
                        <option value="cancelada">Cancelada</option>
                    </select>
                    <select id="filtro-forma" class="border p-2 rounded">
                        <option value="">Forma Pag.</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="pix">Pix</option>
                        <option value="cartao_debito">Débito</option>
                        <option value="cartao_credito">Crédito</option>
                        <option value="transferencia">Transferência</option>
                    </select>
                    <button id="btn-buscar" class="bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded">Filtrar</button>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número/Data</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipe</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valores</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="vendas-tbody" class="bg-white divide-y divide-gray-200">
                        <!-- Linhas de vendas -->
                    </tbody>
                </table>
            </div>
            
            <div id="vendas-totais" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <!-- Totais renderizados aqui -->
            </div>
        </div>

        <div id="modal-container"></div>
    `;

    bindEvents();
    await loadData();
}

async function loadData() {
    try {
        const { data: vendas } = await db.from('vendas');
        const { data: clientes } = await db.from('clientes');
        const { data: equipes } = await db.from('equipes');
        const { data: itens } = await db.from('itens_venda');

        let lista = (vendas || []).map(v => {
            const cli = (clientes || []).find(c => c.id === v.cliente_id);
            const eq = (equipes || []).find(e => e.id === v.equipe_id);
            const vItens = (itens || []).filter(i => i.venda_id === v.id);
            const subtotal = vItens.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
            const desc = Number(v.desconto) || 0;
            return {
                ...v,
                cliente_nome: cli ? cli.nome : 'Não informado',
                equipe_nome: eq ? eq.nome : 'Geral',
                valor_total: subtotal,
                desconto: desc,
                valor_liquido: Math.max(0, subtotal - desc),
                status: v.situacao || 'pendente'
            };
        });

        if (state.filtros.busca) {
            const b = state.filtros.busca.toLowerCase();
            lista = lista.filter(v => v.numero?.toLowerCase().includes(b) || v.cliente_nome?.toLowerCase().includes(b));
        }
        if (state.filtros.equipe) {
            lista = lista.filter(v => v.equipe_id === state.filtros.equipe);
        }
        if (state.filtros.status) {
            lista = lista.filter(v => v.status === state.filtros.status);
        }
        if (state.filtros.formaPagamento) {
            lista = lista.filter(v => v.forma_pagamento === state.filtros.formaPagamento);
        }
        if (state.filtros.periodo) {
            lista = lista.filter(v => v.data === state.filtros.periodo);
        }

        state.vendas = lista;
        renderTable();
        renderTotais();
    } catch (err) {
        console.error('Erro ao carregar vendas', err);
        showToast('Erro ao carregar vendas', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('vendas-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (!state.vendas || state.vendas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-400">
                    <i class="fa-solid fa-receipt text-3xl mb-2 text-gray-300"></i>
                    <p class="font-medium text-sm">Nenhuma venda registrada até o momento</p>
                </td>
            </tr>
        `;
        return;
    }
    
    state.vendas.forEach(venda => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${venda.numero}<br><span class="text-xs text-gray-500 font-normal">${formatDate(venda.data)}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${venda.cliente_nome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${venda.equipe_nome}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Total: ${formatCurrency(venda.valor_total)}<br>
                Desc: ${formatCurrency(venda.desconto)}<br>
                Líq: <span class="font-bold text-emerald-600">${formatCurrency(venda.valor_liquido)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    ${venda.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-2 text-xs font-semibold" onclick="viewVenda('${venda.id}')">Ver Detalhes</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTotais() {
    const container = document.getElementById('vendas-totais');
    const validas = state.vendas.filter(v => v.status !== 'cancelada' && v.status !== 'orcamento');
    const qtde = validas.length;
    const bruto = validas.reduce((acc, v) => acc + (v.valor_total || 0), 0);
    const descontos = validas.reduce((acc, v) => acc + (v.desconto || 0), 0);
    const liquido = validas.reduce((acc, v) => acc + (v.valor_liquido || 0), 0);

    container.innerHTML = `
        <div class="bg-white p-4 rounded shadow text-center">
            <h3 class="text-gray-500 text-sm">Quantidade (Faturadas)</h3>
            <p class="text-xl font-bold">${qtde}</p>
        </div>
        <div class="bg-white p-4 rounded shadow text-center">
            <h3 class="text-gray-500 text-sm">Faturamento Bruto</h3>
            <p class="text-xl font-bold text-blue-600">${formatCurrency(bruto)}</p>
        </div>
        <div class="bg-white p-4 rounded shadow text-center">
            <h3 class="text-gray-500 text-sm">Descontos</h3>
            <p class="text-xl font-bold text-red-500">${formatCurrency(descontos)}</p>
        </div>
        <div class="bg-white p-4 rounded shadow text-center">
            <h3 class="text-gray-500 text-sm">Líquido</h3>
            <p class="text-xl font-bold text-green-600">${formatCurrency(liquido)}</p>
        </div>
    `;
}

function bindEvents() {
    document.getElementById('btn-nova-venda').addEventListener('click', () => openModalNovaVenda());
    document.getElementById('btn-buscar').addEventListener('click', () => {
        state.filtros.busca = document.getElementById('filtro-busca').value;
        state.filtros.periodo = document.getElementById('filtro-periodo').value;
        state.filtros.equipe = document.getElementById('filtro-equipe').value;
        state.filtros.status = document.getElementById('filtro-status').value;
        state.filtros.formaPagamento = document.getElementById('filtro-forma').value;
        loadData();
    });
}

async function openModalNovaVenda() {
    const modalContainer = document.getElementById('modal-container');
    // Simplified version of the modal for Nova Venda
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">Nova Venda</h2>
                    <button id="close-modal" class="text-gray-500 hover:text-gray-700">&times;</button>
                </div>
                <form id="form-nova-venda">
                    <!-- Head: Cliente, Data, etc -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium">Cliente</label>
                            <select id="venda-cliente" class="mt-1 block w-full border rounded-md p-2" required></select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Data</label>
                            <input type="date" id="venda-data" class="mt-1 block w-full border rounded-md p-2" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Equipe</label>
                            <select id="venda-equipe" class="mt-1 block w-full border rounded-md p-2" required></select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium">Status Inicial</label>
                            <select id="venda-status" class="mt-1 block w-full border rounded-md p-2">
                                <option value="orcamento">Orçamento</option>
                                <option value="pendente">Pendente</option>
                            </select>
                        </div>
                    </div>
                    <!-- Items -->
                    <h3 class="font-bold mb-2">Itens</h3>
                    <div id="venda-itens" class="mb-4">
                        <button type="button" id="btn-add-item" class="bg-gray-200 p-2 rounded text-sm mb-2">+ Adicionar Item</button>
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b">
                                    <th class="p-2">Produto/Serviço</th>
                                    <th class="p-2 w-24">Qtd</th>
                                    <th class="p-2 w-32">Preço Un.</th>
                                    <th class="p-2 w-32">Desc.</th>
                                    <th class="p-2 w-32">Subtotal</th>
                                    <th class="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody id="tbody-itens"></tbody>
                        </table>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" class="px-4 py-2 bg-gray-300 rounded" onclick="document.getElementById('modal-container').innerHTML=''">Cancelar</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Salvar Venda</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('close-modal').addEventListener('click', () => modalContainer.innerHTML = '');
    document.getElementById('venda-data').valueAsDate = new Date();
    
    // In a real scenario, we'd populate selects from db here
    // And handle adding rows to tbody-itens, calculating subtotals, etc.
}

window.viewVenda = async function(id) {
    // Open details modal
    utils.showMessage('Em breve', 'Modal de detalhes de venda em construção', 'info');
}

function getStatusColor(status) {
    const map = { orcamento: 'gray', pendente: 'yellow', parcialmente_paga: 'blue', paga: 'green', cancelada: 'red' };
    return map[status] || 'gray';
}

export function cleanup() {
    delete window.viewVenda;
}
