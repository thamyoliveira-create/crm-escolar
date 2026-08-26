import { db } from '../db.js';
import { formatCurrency, formatDate, formatDateTime, generateId, showToast } from '../utils.js';
import { getBadge, createCard, createEmptyState } from '../components.js';

export async function render(container) {
    container.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold">Clientes e Leads</h1>
                <div class="flex gap-2">
                    <button id="btn-export-csv" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow flex items-center">
                        <i class="fas fa-file-csv mr-2"></i> CSV
                    </button>
                    <button id="btn-export-pdf" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded shadow flex items-center">
                        <i class="fas fa-file-pdf mr-2 text-red-500"></i> PDF
                    </button>
                    <button id="btn-new-client" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center">
                        <i class="fas fa-plus mr-2"></i> Novo Cliente
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="bg-white p-4 rounded shadow mb-6 flex flex-wrap gap-4 items-end">
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-sm font-medium mb-1">Busca</label>
                    <input type="text" id="filter-search" placeholder="Nome, telefone ou e-mail" class="w-full border rounded p-2">
                </div>
                <div class="w-48">
                    <label class="block text-sm font-medium mb-1">Tipo</label>
                    <select id="filter-type" class="w-full border rounded p-2">
                        <option value="">Todos</option>
                        <option value="estudante">Estudante</option>
                        <option value="familiar">Familiar</option>
                        <option value="funcionario">Funcionário</option>
                        <option value="comunidade">Comunidade</option>
                        <option value="organizacao">Organização</option>
                    </select>
                </div>
                <div class="w-48">
                    <label class="block text-sm font-medium mb-1">Etapa Comercial</label>
                    <select id="filter-stage" class="w-full border rounded p-2">
                        <option value="">Todas</option>
                        <option value="novo">Novo Contato</option>
                        <option value="interessado">Interessado</option>
                        <option value="proposta">Proposta Apresentada</option>
                        <option value="negociacao">Negociação</option>
                        <option value="venda">Venda Concluída</option>
                        <option value="desistencia">Desistência</option>
                    </select>
                </div>
                <button id="btn-search" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded">Filtrar</button>
            </div>

            <!-- Table -->
            <div class="bg-white rounded shadow overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b">
                            <th class="p-3 font-semibold text-gray-700">Nome</th>
                            <th class="p-3 font-semibold text-gray-700">Tipo</th>
                            <th class="p-3 font-semibold text-gray-700">Telefone</th>
                            <th class="p-3 font-semibold text-gray-700">E-mail</th>
                            <th class="p-3 font-semibold text-gray-700">Etapa</th>
                            <th class="p-3 font-semibold text-gray-700">Responsável</th>
                            <th class="p-3 font-semibold text-gray-700 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="clients-tbody">
                        <!-- Content populated via JS -->
                    </tbody>
                </table>
                <div class="p-4 border-t flex justify-between items-center text-sm text-gray-600">
                    <span>Mostrando 1 a 10 de 50 registros</span>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 border rounded hover:bg-gray-100" disabled>Anterior</button>
                        <button class="px-3 py-1 border rounded hover:bg-gray-100">Próxima</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals will be appended here -->
        <div id="modal-container"></div>
    `;

    document.getElementById('btn-new-client').addEventListener('click', () => openClientModal());
    loadTableData();
}

async function loadTableData() {
    const { data: clientes } = await db.from('clientes');
    const { data: profiles } = await db.from('profiles');
  
    // Filtrar
    let lista = clientes || [];
    const busca = document.getElementById('filter-search')?.value?.toLowerCase();
    const tipo = document.getElementById('filter-type')?.value;
    const etapa = document.getElementById('filter-stage')?.value;
  
    if (busca) lista = lista.filter(c =>
        c.nome?.toLowerCase().includes(busca) ||
        c.telefone?.includes(busca) ||
        c.email?.toLowerCase().includes(busca)
    );
    if (tipo) lista = lista.filter(c => c.tipo === tipo);
    if (etapa) lista = lista.filter(c => c.etapa_comercial === etapa);
  
    // Renderizar
    const tbody = document.getElementById('clients-tbody');
    tbody.innerHTML = '';
  
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">Nenhum cliente encontrado</td></tr>';
        return;
    }
  
    lista.forEach(c => {
        const responsavel = profiles?.find(p => p.id === c.responsavel_id);
        const tipoMap = { estudante:'Estudante', familiar:'Familiar', funcionario:'Funcionário', comunidade:'Comunidade', organizacao:'Organização' };
        const etapaMap = {
            novo_contato: {label:'Novo Contato', color:'bg-gray-100 text-gray-700'},
            interessado: {label:'Interessado', color:'bg-blue-100 text-blue-800'},
            proposta: {label:'Proposta', color:'bg-purple-100 text-purple-800'},
            negociacao: {label:'Negociação', color:'bg-orange-100 text-orange-800'},
            venda_concluida: {label:'Venda Concluída', color:'bg-green-100 text-green-800'},
            desistencia: {label:'Desistência', color:'bg-red-100 text-red-800'},
        };
        const e = etapaMap[c.etapa_comercial] || {label: c.etapa_comercial, color:'bg-gray-100 text-gray-700'};
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 border-b border-gray-100';
        tr.innerHTML = `
            <td class="p-3 font-medium">${c.nome}</td>
            <td class="p-3 text-sm text-gray-600">${tipoMap[c.tipo] || c.tipo}</td>
            <td class="p-3 text-sm">${c.telefone||'—'}</td>
            <td class="p-3 text-sm">${c.email||'—'}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold ${e.color}">${e.label}</span></td>
            <td class="p-3 text-sm">${responsavel?.nome||'—'}</td>
            <td class="p-3 text-center">
                <button onclick="verCliente('${c.id}')" class="text-blue-600 hover:text-blue-800 p-1" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                <button onclick="editarCliente('${c.id}')" class="text-gray-600 hover:text-gray-800 p-1" title="Editar"><i class="fas fa-pencil"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
  
    const paginationInfo = document.querySelector('.pagination-info');
    if (paginationInfo) paginationInfo.textContent = `Mostrando ${lista.length} de ${lista.length} registros`;
}

function openClientModal(client = null) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div class="p-4 border-b flex justify-between items-center">
                    <h2 class="text-xl font-bold">${client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                    <button id="close-modal" class="text-gray-500 hover:text-gray-800"><i class="fas fa-times text-xl"></i></button>
                </div>
                <div class="p-6">
                    <form id="client-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col-span-2">
                                <label class="block text-sm font-medium mb-1">Nome Completo *</label>
                                <input type="text" required class="w-full border rounded p-2" value="${client ? client.nome : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Telefone</label>
                                <input type="text" placeholder="(XX) XXXXX-XXXX" class="w-full border rounded p-2" value="${client ? client.tel : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">E-mail</label>
                                <input type="email" class="w-full border rounded p-2" value="${client ? client.email : ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Tipo</label>
                                <select class="w-full border rounded p-2">
                                    <option value="estudante">Estudante</option>
                                    <option value="familiar">Familiar</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Etapa Comercial</label>
                                <select class="w-full border rounded p-2">
                                    <option value="novo">Novo Contato</option>
                                    <option value="interessado">Interessado</option>
                                </select>
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium mb-1">Observações</label>
                                <textarea class="w-full border rounded p-2 h-24"></textarea>
                            </div>
                        </div>
                        <div class="mt-6 flex justify-end gap-2">
                            <button type="button" id="cancel-modal" class="px-4 py-2 border rounded hover:bg-gray-100">Cancelar</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('close-modal').addEventListener('click', () => container.innerHTML = '');
    document.getElementById('cancel-modal').addEventListener('click', () => container.innerHTML = '');
    document.getElementById('client-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Cliente salvo com sucesso (mock)');
        container.innerHTML = '';
        loadTableData();
    });
}
