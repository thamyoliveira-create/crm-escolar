import { db } from '../db.js';
import { formatCurrency, showToast } from '../utils.js';

let containerElement;

export async function render(container) {
    containerElement = container;
    container.innerHTML = `
        <div class="p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Equipes</h1>
                <button id="btn-nova-equipe" class="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">Nova Equipe</button>
            </div>
            <div id="equipes-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <p class="text-gray-500">Carregando equipes...</p>
            </div>
        </div>

        <!-- Modal -->
        <div id="equipe-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden my-8">
                <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 class="text-xl font-semibold text-gray-800" id="modal-title">Nova Equipe</h2>
                    <button id="btn-close-modal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>
                <div class="p-6">
                    <form id="equipe-form" class="space-y-4">
                        <input type="hidden" id="equipe-id">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Nome da Equipe</label>
                                <input type="text" id="equipe-nome" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Produto / Serviço Principal</label>
                                <input type="text" id="equipe-produto" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Projeto Vinculado</label>
                                <select id="equipe-projeto" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                                    <option value="">Selecione um projeto...</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="pt-4 border-t mt-4">
                            <div class="flex justify-between items-center mb-2">
                                <h3 class="text-md font-semibold text-gray-700">Membros da Equipe</h3>
                                <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Em breve: gestão de membros</span>
                            </div>
                            <p class="text-sm text-gray-500">A gestão detalhada de membros (Marketing, Finanças, Produção) estará disponível na próxima atualização.</p>
                        </div>

                        <div class="flex justify-end space-x-3 pt-4 border-t mt-6">
                            <button type="button" id="btn-cancel-modal" class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">Cancelar</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm">Salvar Equipe</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-nova-equipe').addEventListener('click', () => openModal());
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
    document.getElementById('equipe-form').addEventListener('submit', saveEquipe);

    await Promise.all([loadProjetosSelect(), loadEquipes()]);
}

async function loadProjetosSelect() {
    try {
        const { data, error } = await db.from('projetos').select('id, nome');
        if (error) throw error;
        const select = document.getElementById('equipe-projeto');
        data.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nome;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Erro ao carregar projetos:", e);
    }
}

async function loadEquipes() {
    try {
        // Mocking some relation data as we are keeping it simple
        const { data: equipes, error } = await db.from('equipes').select('*, projetos(nome)').order('created_at', { ascending: false });
        if (error) throw error;
        
        const grid = document.getElementById('equipes-grid');
        grid.innerHTML = '';
        
        if (!equipes || equipes.length === 0) {
            grid.innerHTML = '<div class="col-span-full p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">Nenhuma equipe cadastrada.</div>';
            return;
        }

        equipes.forEach(equipe => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col h-full';
            
            // Mock KPIs for now
            const faturamento = 0;
            const custos = 0;
            const lucro = 0;
            const margem = 0;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 leading-tight">${equipe.nome}</h3>
                        <p class="text-sm text-gray-500 mt-1 line-clamp-1">${equipe.produto_servico || 'Produto não definido'}</p>
                    </div>
                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                        ${equipe.nome.substring(0, 2).toUpperCase()}
                    </div>
                </div>
                
                <div class="mb-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        Projeto: ${equipe.projetos?.nome || 'Sem projeto'}
                    </span>
                </div>
                
                <div class="grid grid-cols-2 gap-3 mb-5 flex-grow">
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p class="text-xs text-gray-500 mb-1">Faturamento Liq.</p>
                        <p class="text-sm font-semibold text-gray-900">${formatCurrency(faturamento)}</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p class="text-xs text-gray-500 mb-1">Custos Pagos</p>
                        <p class="text-sm font-semibold text-red-600">${formatCurrency(custos)}</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p class="text-xs text-gray-500 mb-1">Resultado (Lucro)</p>
                        <p class="text-sm font-semibold text-green-600">${formatCurrency(lucro)}</p>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p class="text-xs text-gray-500 mb-1">Margem %</p>
                        <p class="text-sm font-semibold text-blue-600">${margem}%</p>
                    </div>
                </div>
                
                <div class="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div class="flex -space-x-2 overflow-hidden">
                        <!-- Mock Avatars -->
                        <div class="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-300"></div>
                        <div class="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-400"></div>
                        <div class="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-500 flex items-center justify-center text-[10px] text-white">+2</div>
                    </div>
                    <button class="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md font-medium text-sm transition edit-btn flex items-center">
                        Editar
                    </button>
                </div>
            `;
            
            card.querySelector('.edit-btn').addEventListener('click', () => openModal(equipe));
            grid.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        showToast('Erro ao carregar equipes.', 'error');
    }
}

function openModal(equipe = null) {
    const modal = document.getElementById('equipe-modal');
    const form = document.getElementById('equipe-form');
    document.getElementById('modal-title').textContent = equipe ? 'Editar Equipe' : 'Nova Equipe';
    
    if (equipe) {
        document.getElementById('equipe-id').value = equipe.id;
        document.getElementById('equipe-nome').value = equipe.nome;
        document.getElementById('equipe-produto').value = equipe.produto_servico || '';
        document.getElementById('equipe-projeto').value = equipe.projeto_id || '';
    } else {
        form.reset();
        document.getElementById('equipe-id').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('equipe-modal').classList.add('hidden');
}

async function saveEquipe(e) {
    e.preventDefault();
    
    const id = document.getElementById('equipe-id').value;
    const data = {
        nome: document.getElementById('equipe-nome').value,
        produto_servico: document.getElementById('equipe-produto').value,
        projeto_id: document.getElementById('equipe-projeto').value
    };

    try {
        if (id) {
            const { error } = await db.from('equipes').update(data).eq('id', id);
            if (error) throw error;
            showToast('Equipe atualizada com sucesso!', 'success');
        } else {
            const { error } = await db.from('equipes').insert([data]);
            if (error) throw error;
            showToast('Equipe criada com sucesso!', 'success');
        }
        
        closeModal();
        loadEquipes();
    } catch (error) {
        console.error(error);
        showToast('Erro ao salvar equipe.', 'error');
    }
}

export function cleanup() {
    containerElement = null;
}
