import { db } from '../db.js';
import { showToast } from '../utils.js';

export async function render(container) {
    container.innerHTML = `
        <div class="p-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-6">Configurações</h1>

            <div class="mb-6">
                <nav class="flex space-x-4 border-b border-gray-200" id="tabs-config">
                    <button class="tab-btn px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600" data-target="tab-geral">Geral</button>
                    <button class="tab-btn px-4 py-2 font-medium text-gray-500 hover:text-gray-700" data-target="tab-cat-produtos">Categorias (Produtos)</button>
                    <button class="tab-btn px-4 py-2 font-medium text-gray-500 hover:text-gray-700" data-target="tab-cat-custos">Categorias (Custos)</button>
                    <button class="tab-btn px-4 py-2 font-medium text-gray-500 hover:text-gray-700" data-target="tab-dados">Dados & Demo</button>
                </nav>
            </div>

            <!-- Geral -->
            <div id="tab-geral" class="tab-content block bg-white p-6 rounded shadow">
                <h2 class="text-lg font-bold mb-4">Configurações Gerais</h2>
                <form class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nome da Instituição</label>
                        <input type="text" class="mt-1 block w-full border border-gray-300 rounded px-3 py-2" value="CRM Escolar">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Ano Letivo</label>
                        <input type="text" class="mt-1 block w-full border border-gray-300 rounded px-3 py-2" value="2024">
                    </div>
                    <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
                </form>
            </div>

            <!-- Cat Produtos -->
            <div id="tab-cat-produtos" class="tab-content hidden bg-white p-6 rounded shadow">
                <h2 class="text-lg font-bold mb-4">Categorias de Produtos</h2>
                <div class="flex gap-2 mb-4">
                    <input type="text" id="nova-cat-produto" class="border border-gray-300 rounded px-3 py-2 flex-grow" placeholder="Nova Categoria">
                    <button id="btn-add-cat-prod" class="bg-blue-600 text-white px-4 py-2 rounded">Adicionar</button>
                </div>
                <ul id="list-cat-produtos" class="divide-y divide-gray-200"></ul>
            </div>

            <!-- Cat Custos -->
            <div id="tab-cat-custos" class="tab-content hidden bg-white p-6 rounded shadow">
                <h2 class="text-lg font-bold mb-4">Categorias de Custos</h2>
                <div class="flex gap-2 mb-4">
                    <input type="text" id="nova-cat-custo" class="border border-gray-300 rounded px-3 py-2 flex-grow" placeholder="Nova Categoria">
                    <button id="btn-add-cat-custo" class="bg-blue-600 text-white px-4 py-2 rounded">Adicionar</button>
                </div>
                <ul id="list-cat-custos" class="divide-y divide-gray-200"></ul>
            </div>

            <!-- Dados -->
            <div id="tab-dados" class="tab-content hidden bg-white p-6 rounded shadow">
                <h2 class="text-lg font-bold mb-4">Dados do Sistema & Demonstração</h2>
                <div class="bg-blue-50 text-blue-800 p-4 rounded mb-4">
                    <p>O sistema armazena os dados localmente (localStorage) para fins de demonstração.</p>
                </div>
                <button id="btn-reset" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold">Resetar Dados de Demonstração</button>
            </div>

        </div>
    `;

    setupTabs();
    setupListeners();
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

function setupListeners() {
    document.getElementById('btn-reset')?.addEventListener('click', () => {
        if(confirm('Tem certeza que deseja resetar todos os dados? Isso recarregará os dados de demonstração iniciais.')) {
            if (db.resetDemoData) {
                db.resetDemoData();
                showToast('Dados resetados com sucesso!', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                localStorage.clear();
                showToast('LocalStorage limpo.', 'success');
                setTimeout(() => window.location.reload(), 1500);
            }
        }
    });

    document.getElementById('btn-add-cat-prod')?.addEventListener('click', () => {
        const input = document.getElementById('nova-cat-produto');
        if (input.value.trim()) {
            const ul = document.getElementById('list-cat-produtos');
            ul.innerHTML += \`<li class="py-2">\${input.value}</li>\`;
            input.value = '';
            showToast('Categoria adicionada', 'success');
        }
    });

    document.getElementById('btn-add-cat-custo')?.addEventListener('click', () => {
        const input = document.getElementById('nova-cat-custo');
        if (input.value.trim()) {
            const ul = document.getElementById('list-cat-custos');
            ul.innerHTML += \`<li class="py-2">\${input.value}</li>\`;
            input.value = '';
            showToast('Categoria adicionada', 'success');
        }
    });
}

export function cleanup() {}
