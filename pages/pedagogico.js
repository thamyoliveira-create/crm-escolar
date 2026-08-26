import { db } from '../db.js';
import { formatDate, showToast } from '../utils.js';

let containerElement;

export async function render(container) {
    containerElement = container;
    container.innerHTML = `
        <div class="p-6">
            <div class="bg-indigo-600 rounded-lg shadow-md p-6 mb-6 text-white flex items-center gap-4">
                <div class="bg-white/20 p-3 rounded-full">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <div>
                    <h1 class="text-2xl font-bold">Área Pedagógica</h1>
                    <p class="text-indigo-100 mt-1">Acompanhamento interdisciplinar, competências socioemocionais e objetivos de aprendizagem.</p>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Selecione o Projeto</label>
                    <select id="filtro-projeto" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border">
                        <option value="">Carregando...</option>
                    </select>
                </div>
                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Selecione a Equipe</label>
                    <select id="filtro-equipe" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border">
                        <option value="">Todas as equipes</option>
                    </select>
                </div>
            </div>

            <!-- Abas -->
            <div class="mb-4 border-b border-gray-200">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center" id="pedagogico-tabs" data-tabs-toggle="#pedagogico-tab-content" role="tablist">
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 text-indigo-600 border-indigo-600 tab-btn" data-target="aba-objetivos" type="button" role="tab" aria-selected="true">Objetivos de Aprendizagem</button>
                    </li>
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 tab-btn" data-target="aba-diario" type="button" role="tab" aria-selected="false">Diário de Bordo</button>
                    </li>
                    <li class="mr-2" role="presentation">
                        <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 tab-btn" data-target="aba-autoavaliacao" type="button" role="tab" aria-selected="false">Autoavaliação</button>
                    </li>
                    <li role="presentation">
                        <button class="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 tab-btn" data-target="aba-feedbacks" type="button" role="tab" aria-selected="false">Devolutivas e Feedbacks</button>
                    </li>
                </ul>
            </div>

            <div id="pedagogico-tab-content">
                <!-- Aba 1 -->
                <div class="p-4 rounded-lg bg-gray-50 tab-content" id="aba-objetivos" role="tabpanel">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Disciplinas e Objetivos</h3>
                        <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Em construção</span>
                    </div>
                    <p class="text-gray-500">Mapeamento das disciplinas conectadas (Matemática, Português, etc) e os objetivos específicos trabalhados em cada projeto.</p>
                </div>
                
                <!-- Aba 2 -->
                <div class="hidden p-4 rounded-lg bg-gray-50 tab-content" id="aba-diario" role="tabpanel">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Timeline de Atividades</h3>
                        <button class="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">Novo Registro</button>
                    </div>
                    <div class="space-y-4">
                        <p class="text-gray-500">Nenhum registro no diário de bordo ainda.</p>
                    </div>
                </div>

                <!-- Aba 3 -->
                <div class="hidden p-4 rounded-lg bg-gray-50 tab-content" id="aba-autoavaliacao" role="tabpanel">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Questionário de Autoavaliação</h3>
                    <p class="text-gray-500">Formulários de autoavaliação da equipe estarão disponíveis aqui.</p>
                </div>

                <!-- Aba 4 -->
                <div class="hidden p-4 rounded-lg bg-gray-50 tab-content" id="aba-feedbacks" role="tabpanel">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Orientações Pedagógicas</h3>
                        <button class="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">Novo Feedback</button>
                    </div>
                    <p class="text-gray-500">Nenhum feedback registrado.</p>
                </div>
            </div>
        </div>
    `;

    setupTabs();
    await loadSelects();
}

function setupTabs() {
    const tabBtns = containerElement.querySelectorAll('.tab-btn');
    const tabContents = containerElement.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            tabBtns.forEach(b => {
                b.classList.remove('text-indigo-600', 'border-indigo-600');
                b.classList.add('border-transparent');
                b.setAttribute('aria-selected', 'false');
            });
            // Hide all contents
            tabContents.forEach(c => c.classList.add('hidden'));

            // Activate clicked
            btn.classList.remove('border-transparent');
            btn.classList.add('text-indigo-600', 'border-indigo-600');
            btn.setAttribute('aria-selected', 'true');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });
}

async function loadSelects() {
    try {
        const [{ data: projetos }, { data: equipes }] = await Promise.all([
            db.from('projetos').select('id, nome').order('created_at', { ascending: false }),
            db.from('equipes').select('id, nome, projeto_id').order('nome')
        ]);

        const selProj = document.getElementById('filtro-projeto');
        const selEq = document.getElementById('filtro-equipe');

        selProj.innerHTML = '<option value="">Todos os Projetos</option>';
        if (projetos) {
            projetos.forEach(p => {
                selProj.innerHTML += \`<option value="\${p.id}">\${p.nome}</option>\`;
            });
        }

        selEq.innerHTML = '<option value="">Todas as Equipes</option>';
        if (equipes) {
            equipes.forEach(e => {
                selEq.innerHTML += \`<option value="\${e.id}" data-projeto="\${e.projeto_id || ''}">\${e.nome}</option>\`;
            });
        }

        selProj.addEventListener('change', () => {
            const projId = selProj.value;
            Array.from(selEq.options).forEach(opt => {
                if (opt.value === '') return;
                const eqProj = opt.getAttribute('data-projeto');
                if (!projId || eqProj === projId) {
                    opt.style.display = '';
                } else {
                    opt.style.display = 'none';
                }
            });
            selEq.value = '';
        });

    } catch (e) {
        console.error(e);
    }
}

export function cleanup() {
    containerElement = null;
}
