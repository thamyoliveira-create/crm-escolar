import { db } from '../db.js';
import { formatCurrency, formatDate, formatDateTime, generateId, showToast } from '../utils.js';
import { getBadge, createCard, createEmptyState } from '../components.js';

let state = {
    produtos: [],
    viewMode: 'cards' // cards or table
};

export async function render(container) {
    container.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Produtos e Serviços</h1>
                <div>
                    <button id="toggle-view" class="mr-2 text-gray-600"><i class="fa fa-list"></i> Tabela</button>
                    <button id="btn-novo-produto" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Novo Produto</button>
                </div>
            </div>
            
            <div class="bg-white p-4 rounded-lg shadow mb-6">
                <div class="flex gap-4">
                    <input type="text" id="filtro-busca" placeholder="Buscar..." class="border p-2 rounded flex-1">
                    <select id="filtro-tipo" class="border p-2 rounded"><option value="">Tipo</option><option value="produto">Produto</option><option value="servico">Serviço</option></select>
                    <select id="filtro-categoria" class="border p-2 rounded"><option value="">Categoria</option></select>
                    <select id="filtro-status" class="border p-2 rounded"><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select>
                </div>
            </div>

            <div id="produtos-container">
                <!-- Cards or Table rendered here -->
            </div>
        </div>
        <div id="modal-container"></div>
    `;

    bindEvents();
    await loadData();
}

async function loadData() {
    try {
        const { data } = await db.from('produtos');
        state.produtos = data || [];
        renderProdutos();
    } catch(err) {
        console.error('Erro', err);
        showToast('Erro ao carregar produtos', 'error');
    }
}

function renderProdutos() {
    const container = document.getElementById('produtos-container');
    if (!state.produtos || state.produtos.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i class="fa-solid fa-box-open"></i>
                </div>
                <h3 class="text-base font-bold text-gray-800 mb-1">Nenhum produto ou serviço cadastrado</h3>
                <p class="text-xs text-gray-500 max-w-sm mx-auto mb-5">Cadastre o catálogo de itens que as equipes irão produzir ou comercializar durante o projeto escolar.</p>
                <button id="btn-empty-novo-produto" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm inline-flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> Cadastrar Primeiro Produto
                </button>
            </div>
        `;
        document.getElementById('btn-empty-novo-produto')?.addEventListener('click', () => {
            document.getElementById('btn-novo-produto')?.click();
        });
        return;
    }

    if (state.viewMode === 'cards') {
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        state.produtos.forEach(p => {
            const baixoEstoque = p.tipo === 'produto' && p.estoque_disponivel <= p.estoque_minimo;
            html += `
                <div class="bg-white rounded-lg shadow border p-4 cursor-pointer hover:shadow-lg transition" onclick="viewProduto('${p.id}')">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs text-gray-500 uppercase">${p.tipo} - ${p.categoria || 'Geral'}</span>
                        ${baixoEstoque ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Estoque Baixo</span>' : ''}
                    </div>
                    <h3 class="font-bold text-lg mb-2">${p.nome}</h3>
                    <p class="text-xl font-bold text-blue-600 mb-2">${formatCurrency(p.preco_venda)}</p>
                    ${p.tipo === 'produto' ? `<p class="text-sm text-gray-600">Estoque: ${p.estoque_disponivel}</p>` : ''}
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } else {
        container.innerHTML = `<div class="bg-white shadow rounded p-4 text-center">Visualização em tabela (em breve)</div>`;
    }
}

function bindEvents() {
    document.getElementById('toggle-view').addEventListener('click', () => {
        state.viewMode = state.viewMode === 'cards' ? 'table' : 'cards';
        renderProdutos();
    });
    
    document.getElementById('btn-novo-produto').addEventListener('click', () => {
        showToast('Em breve', 'Modal de novo produto em construção', 'info');
    });
}

window.viewProduto = function(id) {
    showToast('Em breve', 'Modal de detalhes de produto em construção', 'info');
}

export function cleanup() {
    delete window.viewProduto;
}
