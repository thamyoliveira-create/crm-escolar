import { db } from '../db.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

let containerElement;

export async function render(container) {
    containerElement = container;
    container.innerHTML = `
        <div class="p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Projetos</h1>
                <button id="btn-novo-projeto" class="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">Novo Projeto</button>
            </div>
            <div id="projetos-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <p class="text-gray-500">Carregando projetos...</p>
            </div>
        </div>

        <!-- Modal -->
        <div id="projeto-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden my-8">
                <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 class="text-xl font-semibold text-gray-800" id="modal-title">Novo Projeto</h2>
                    <button id="btn-close-modal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>
                <div class="p-6">
                    <form id="projeto-form" class="space-y-4">
                        <input type="hidden" id="projeto-id">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                                <input type="text" id="projeto-nome" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                                <input type="text" id="projeto-turma" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Ano Letivo</label>
                                <input type="number" id="projeto-ano" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                                <input type="date" id="projeto-inicio" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                                <input type="date" id="projeto-fim" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Situação</label>
                                <select id="projeto-situacao" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                                    <option value="planejamento">Planejamento</option>
                                    <option value="producao">Produção</option>
                                    <option value="comercializacao">Comercialização</option>
                                    <option value="concluido">Concluído</option>
                                    <option value="arquivado">Arquivado</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Disciplinas Integradas <span class="text-xs text-gray-400">(separadas por vírgula)</span></label>
                                <input type="text" id="projeto-disciplinas" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="Ex: Matemática, Empreendedorismo">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Meta de Vendas (Qtd)</label>
                                <input type="number" id="projeto-meta-vendas" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Meta de Faturamento (R$)</label>
                                <input type="number" id="projeto-meta-faturamento" step="0.01" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                            <textarea id="projeto-descricao" rows="3" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"></textarea>
                        </div>
                        <div class="flex justify-end space-x-3 pt-4 border-t mt-6">
                            <button type="button" id="btn-cancel-modal" class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">Cancelar</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm">Salvar Projeto</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-novo-projeto').addEventListener('click', () => openModal());
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
    document.getElementById('projeto-form').addEventListener('submit', saveProjeto);

    await loadProjetos();
}

async function loadProjetos() {
    try {
        const { data: projetos, error } = await db.from('projetos').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        const grid = document.getElementById('projetos-grid');
        grid.innerHTML = '';
        
        if (!projetos || projetos.length === 0) {
            grid.innerHTML = '<div class="col-span-full p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">Nenhum projeto cadastrado. Clique em "Novo Projeto" para começar.</div>';
            return;
        }

        projetos.forEach(projeto => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col h-full';
            
            const badgeColors = {
                'planejamento': 'bg-purple-100 text-purple-800 border-purple-200',
                'producao': 'bg-blue-100 text-blue-800 border-blue-200',
                'comercializacao': 'bg-green-100 text-green-800 border-green-200',
                'concluido': 'bg-gray-100 text-gray-800 border-gray-200',
                'arquivado': 'bg-red-100 text-red-800 border-red-200'
            };
            const badgeClass = badgeColors[projeto.situacao] || 'bg-gray-100 text-gray-800 border-gray-200';
            const situacaoLabel = projeto.situacao ? projeto.situacao.charAt(0).toUpperCase() + projeto.situacao.slice(1) : 'Não definida';

            // Placeholder progress (could be calculated from real sales data later)
            const percVendas = Math.min(100, ((0 / (projeto.meta_vendas || 1)) * 100).toFixed(1));
            const percFat = Math.min(100, ((0 / (projeto.meta_faturamento || 1)) * 100).toFixed(1));

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4 gap-2">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 leading-tight">${projeto.nome}</h3>
                        <p class="text-sm text-gray-500 mt-1">${projeto.turma} • ${projeto.ano_letivo}</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass} whitespace-nowrap">
                        ${situacaoLabel}
                    </span>
                </div>
                
                <div class="text-sm text-gray-600 mb-5 flex-grow space-y-4">
                    <div class="flex items-center text-gray-500">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span>${formatDate(projeto.data_inicio)} a ${formatDate(projeto.data_fim)}</span>
                    </div>
                    
                    <div class="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div>
                            <div class="flex justify-between text-xs mb-1 font-medium">
                                <span class="text-gray-700">Meta de Vendas</span>
                                <span class="text-gray-900">0 / ${projeto.meta_vendas || 0} unid.</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-1.5">
                                <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${percVendas}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs mb-1 font-medium">
                                <span class="text-gray-700">Meta Faturamento</span>
                                <span class="text-gray-900">${formatCurrency(0)} / ${formatCurrency(projeto.meta_faturamento || 0)}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-1.5">
                                <div class="bg-green-500 h-1.5 rounded-full" style="width: ${percFat}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    ${projeto.descricao ? `<p class="text-xs text-gray-500 line-clamp-2 mt-2" title="${projeto.descricao}">${projeto.descricao}</p>` : ''}
                </div>
                
                <div class="pt-4 border-t border-gray-100 flex justify-end">
                    <button class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md font-medium text-sm transition edit-btn flex items-center">
                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Editar
                    </button>
                </div>
            `;
            
            card.querySelector('.edit-btn').addEventListener('click', () => openModal(projeto));
            grid.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        showToast('Erro ao carregar projetos.', 'error');
    }
}

function openModal(projeto = null) {
    const modal = document.getElementById('projeto-modal');
    const form = document.getElementById('projeto-form');
    document.getElementById('modal-title').textContent = projeto ? 'Editar Projeto' : 'Novo Projeto';
    
    if (projeto) {
        document.getElementById('projeto-id').value = projeto.id;
        document.getElementById('projeto-nome').value = projeto.nome;
        document.getElementById('projeto-turma').value = projeto.turma;
        document.getElementById('projeto-ano').value = projeto.ano_letivo;
        document.getElementById('projeto-situacao').value = projeto.situacao || 'planejamento';
        document.getElementById('projeto-inicio').value = projeto.data_inicio ? projeto.data_inicio.split('T')[0] : '';
        document.getElementById('projeto-fim').value = projeto.data_fim ? projeto.data_fim.split('T')[0] : '';
        document.getElementById('projeto-meta-vendas').value = projeto.meta_vendas || '';
        document.getElementById('projeto-meta-faturamento').value = projeto.meta_faturamento || '';
        document.getElementById('projeto-descricao').value = projeto.descricao || '';
    } else {
        form.reset();
        document.getElementById('projeto-id').value = '';
        document.getElementById('projeto-situacao').value = 'planejamento';
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('projeto-modal').classList.add('hidden');
}

async function saveProjeto(e) {
    e.preventDefault();
    
    const id = document.getElementById('projeto-id').value;
    const data = {
        nome: document.getElementById('projeto-nome').value,
        turma: document.getElementById('projeto-turma').value,
        ano_letivo: document.getElementById('projeto-ano').value,
        situacao: document.getElementById('projeto-situacao').value,
        data_inicio: document.getElementById('projeto-inicio').value,
        data_fim: document.getElementById('projeto-fim').value,
        meta_vendas: parseFloat(document.getElementById('projeto-meta-vendas').value) || 0,
        meta_faturamento: parseFloat(document.getElementById('projeto-meta-faturamento').value) || 0,
        descricao: document.getElementById('projeto-descricao').value
    };

    try {
        if (id) {
            const { error } = await db.from('projetos').update(data).eq('id', id);
            if (error) throw error;
            showToast('Projeto atualizado com sucesso!', 'success');
        } else {
            const { error } = await db.from('projetos').insert([data]);
            if (error) throw error;
            showToast('Projeto criado com sucesso!', 'success');
        }
        
        closeModal();
        loadProjetos();
    } catch (error) {
        console.error(error);
        showToast('Erro ao salvar projeto.', 'error');
    }
}

export function cleanup() {
    containerElement = null;
}
