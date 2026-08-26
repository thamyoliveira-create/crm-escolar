import { db } from '../db.js';
import { formatCurrency, formatDate, formatDateTime, generateId, showToast } from '../utils.js';

let state = {
    custos: []
};

export async function render(container) {
    container.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Custos</h1>
                <button id="btn-novo-custo" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Novo Custo</button>
            </div>
            
            <div id="custos-resumo" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <!-- Resumo cards -->
            </div>

            <div class="bg-white p-4 rounded-lg shadow mb-6">
                <!-- Filtros -->
                <div class="flex gap-4">
                     <select class="border p-2 rounded"><option>Categoria</option></select>
                     <select class="border p-2 rounded"><option>Tipo (Fixo/Var)</option></select>
                     <select class="border p-2 rounded"><option>Status</option></select>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria/Tipo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="custos-tbody" class="bg-white divide-y divide-gray-200">
                    </tbody>
                </table>
            </div>
        </div>
        <div id="modal-container"></div>
    `;

    bindEvents();
    await loadData();
}

async function loadData() {
    try {
        const { data } = await db.from('custos');
        state.custos = data || [];
        renderCustos();
        renderResumo();
    } catch(err) {
        console.error('Erro', err);
        showToast('Erro ao carregar custos', 'error');
    }
}

function renderCustos() {
    const tbody = document.getElementById('custos-tbody');
    tbody.innerHTML = '';
    state.custos.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${c.descricao}</td>
            <td class="px-6 py-4 whitespace-nowrap">${c.categoria} <br><span class="text-xs">${c.tipo}</span></td>
            <td class="px-6 py-4 whitespace-nowrap">${formatDate(c.data)}</td>
            <td class="px-6 py-4 whitespace-nowrap font-medium">${formatCurrency(c.total)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${c.status}</td>
            <td class="px-6 py-4 whitespace-nowrap"><button class="text-blue-600" onclick="editarCusto('${c.id}')">Editar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderResumo() {
    const container = document.getElementById('custos-resumo');
    const previsto = state.custos.filter(c => c.status === 'previsto').reduce((sum, c) => sum + c.total, 0);
    const realizado = state.custos.filter(c => c.status === 'pago').reduce((sum, c) => sum + c.total, 0);
    
    container.innerHTML = `
        <div class="bg-white p-4 rounded shadow border-l-4 border-yellow-400">
            <h3 class="text-gray-500 text-sm">Previsto</h3>
            <p class="text-xl font-bold">${formatCurrency(previsto)}</p>
        </div>
        <div class="bg-white p-4 rounded shadow border-l-4 border-green-500">
            <h3 class="text-gray-500 text-sm">Realizado (Pago)</h3>
            <p class="text-xl font-bold">${formatCurrency(realizado)}</p>
        </div>
        <!-- Outros cards (Categorias, Equipe) -->
    `;
}

function bindEvents() {
    document.getElementById('btn-novo-custo').addEventListener('click', () => {
        showToast('Em breve', 'Modal de novo custo em construção', 'info');
    });
}

window.editarCusto = function(id) {
    showToast('Em breve', 'Modal de edição em construção', 'info');
}

export function cleanup() {
    delete window.editarCusto;
}
