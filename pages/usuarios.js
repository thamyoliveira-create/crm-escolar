import { db } from '../db.js';
import { showToast } from '../utils.js';

let containerElement;

export async function render(container) {
    containerElement = container;
    container.innerHTML = `
        <div class="p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 class="text-2xl font-bold text-gray-800">Usuários</h1>
                <button id="btn-novo-usuario" class="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">Novo Usuário</button>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 bg-gray-50">
                    <input type="text" id="filtro-busca" placeholder="Buscar por nome ou e-mail..." class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                    <select id="filtro-perfil" class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border bg-white">
                        <option value="">Todos os Perfis</option>
                        <option value="admin">Administrador</option>
                        <option value="professor">Professor</option>
                        <option value="estudante">Estudante</option>
                    </select>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome / E-mail</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="usuarios-tbody" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="4" class="px-6 py-4 text-center text-gray-500">Carregando...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div id="usuario-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 class="text-xl font-semibold text-gray-800" id="modal-title">Novo Usuário</h2>
                    <button id="btn-close-modal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>
                <div class="p-6">
                    <form id="usuario-form" class="space-y-4">
                        <input type="hidden" id="usuario-id">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <input type="text" id="usuario-nome" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <input type="email" id="usuario-email" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                            <select id="usuario-perfil" required class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                                <option value="estudante">Estudante</option>
                                <option value="professor">Professor</option>
                                <option value="admin">Administrador</option>
                                <option value="consulta">Consulta</option>
                            </select>
                        </div>
                        <div class="flex justify-end space-x-3 pt-4 border-t mt-6">
                            <button type="button" id="btn-cancel-modal" class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">Cancelar</button>
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-novo-usuario').addEventListener('click', () => openModal());
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
    document.getElementById('usuario-form').addEventListener('submit', saveUsuario);

    // Mock initial data load as we can't easily mock auth users via client side in typical Supabase without auth admin
    await loadUsuarios();
}

async function loadUsuarios() {
    try {
        const { data: usuarios, error } = await db.from('profiles').select('*').order('nome');
        if (error) throw error;

        const tbody = document.getElementById('usuarios-tbody');
        tbody.innerHTML = '';

        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Nenhum perfil encontrado.</td></tr>';
            return;
        }

        usuarios.forEach(u => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'bg-gray-100 text-gray-800';
            if (u.role === 'admin') badgeClass = 'bg-purple-100 text-purple-800';
            else if (u.role === 'professor') badgeClass = 'bg-blue-100 text-blue-800';
            else if (u.role === 'estudante') badgeClass = 'bg-green-100 text-green-800';

            const statusClass = 'bg-green-100 text-green-800'; // mocked active status

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0">
                            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                ${(u.nome || u.email || 'U').substring(0, 1).toUpperCase()}
                            </div>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${u.nome || 'Sem Nome'}</div>
                            <div class="text-sm text-gray-500">${u.email || ''}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}">
                        ${(u.role || 'Sem Perfil').toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        Ativo
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 edit-btn">Editar</button>
                </td>
            `;
            
            tr.querySelector('.edit-btn').addEventListener('click', () => openModal(u));
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        const tbody = document.getElementById('usuarios-tbody');
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Erro ao carregar usuários.</td></tr>';
    }
}

function openModal(usuario = null) {
    const modal = document.getElementById('usuario-modal');
    const form = document.getElementById('usuario-form');
    document.getElementById('modal-title').textContent = usuario ? 'Editar Usuário' : 'Novo Usuário';
    
    if (usuario) {
        document.getElementById('usuario-id').value = usuario.id;
        document.getElementById('usuario-nome').value = usuario.nome || '';
        document.getElementById('usuario-email').value = usuario.email || '';
        document.getElementById('usuario-perfil').value = usuario.role || 'estudante';
        // email is usually read-only if they are authenticated, but we leave it simple
    } else {
        form.reset();
        document.getElementById('usuario-id').value = '';
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('usuario-modal').classList.add('hidden');
}

async function saveUsuario(e) {
    e.preventDefault();
    
    const id = document.getElementById('usuario-id').value;
    const data = {
        nome: document.getElementById('usuario-nome').value,
        role: document.getElementById('usuario-perfil').value
        // we can't easily insert raw emails into auth.users without admin rights, so this is just updating profiles
    };

    try {
        if (id) {
            const { error } = await db.from('profiles').update(data).eq('id', id);
            if (error) throw error;
            showToast('Perfil atualizado com sucesso!', 'success');
        } else {
            showToast('A criação de novos usuários deve ser feita através do registro na tela de login.', 'warning');
            // Mock alert for now
        }
        
        closeModal();
        loadUsuarios();
    } catch (error) {
        console.error(error);
        showToast('Erro ao salvar usuário.', 'error');
    }
}

export function cleanup() {
    containerElement = null;
}
