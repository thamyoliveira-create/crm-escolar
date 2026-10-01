// clientes.js — CRM de Clientes e Leads (Modo Empresa Real)
import { db } from '../db.js';
import { formatCurrency, formatDate, showToast, exportCSV, exportPDF } from '../utils.js';

let _clientes = [], _profiles = [], _equipes = [], _projetos = [];

export async function render(container) {
  container.innerHTML = `
    <div class="space-y-5 p-1">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">CRM — Clientes & Leads</h1>
          <p class="text-xs text-gray-500 mt-0.5">Gerencie o funil comercial da sua miniempresa como um time de vendas profissional.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button id="btn-export-csv" class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-file-csv text-green-600"></i> CSV
          </button>
          <button id="btn-export-pdf" class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm">
            <i class="fas fa-file-pdf text-red-500"></i> PDF
          </button>
          <button id="btn-new-client" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow">
            <i class="fas fa-plus"></i> Novo Cliente / Lead
          </button>
        </div>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" id="crm-kpis"></div>

      <!-- Filtros -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-[180px]">
          <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Busca</label>
          <input type="text" id="filter-search" placeholder="Nome, empresa, telefone ou e-mail…" class="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
        </div>
        <div class="w-36">
          <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Tipo</label>
          <select id="filter-type" class="w-full border border-gray-200 rounded-lg p-2 text-sm">
            <option value="">Todos</option>
            <option value="estudante">Estudante</option>
            <option value="familiar">Familiar</option>
            <option value="funcionario">Funcionário</option>
            <option value="comunidade">Comunidade</option>
            <option value="organizacao">Organização</option>
          </select>
        </div>
        <div class="w-44">
          <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Etapa Comercial</label>
          <select id="filter-stage" class="w-full border border-gray-200 rounded-lg p-2 text-sm">
            <option value="">Todas</option>
            <option value="novo_contato">Novo Contato</option>
            <option value="interessado">Interessado</option>
            <option value="proposta">Proposta</option>
            <option value="negociacao">Negociação</option>
            <option value="venda_concluida">Venda Concluída</option>
            <option value="desistencia">Desistência</option>
          </select>
        </div>
        <div class="w-36">
          <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Equipe</label>
          <select id="filter-equipe" class="w-full border border-gray-200 rounded-lg p-2 text-sm">
            <option value="">Todas</option>
          </select>
        </div>
        <button id="btn-search" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
          <i class="fas fa-search"></i> Filtrar
        </button>
      </div>

      <!-- Tabela -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Cliente / Empresa</th>
              <th class="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Contato</th>
              <th class="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Interesse</th>
              <th class="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Etapa</th>
              <th class="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Responsável</th>
              <th class="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Ações</th>
            </tr>
          </thead>
          <tbody id="clients-tbody" class="divide-y divide-gray-100"></tbody>
        </table>
        <div class="p-3 border-t flex justify-between items-center text-xs text-gray-500">
          <span id="pagination-info">—</span>
        </div>
      </div>
    </div>
    <div id="modal-container"></div>
  `;

  await _load();
  _bindEvents();
}

async function _load() {
  const [r1, r2, r3, r4] = await Promise.all([
    db.from('clientes'),
    db.from('profiles'),
    db.from('equipes'),
    db.from('projetos'),
  ]);
  _clientes  = r1.data || [];
  _profiles  = r2.data || [];
  _equipes   = r3.data || [];
  _projetos  = r4.data || [];

  // Populate equipe filter
  const sel = document.getElementById('filter-equipe');
  if (sel) {
    _equipes.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id; opt.textContent = e.nome;
      sel.appendChild(opt);
    });
  }

  _renderKPIs();
  _renderTable();
}

function _renderKPIs() {
  const ativos = _clientes.filter(c => c.ativo !== false);
  const pipeline = ativos.filter(c => !['venda_concluida','desistencia'].includes(c.etapa_comercial));
  const ganhos   = ativos.filter(c => c.etapa_comercial === 'venda_concluida');
  const valorPipeline = pipeline.reduce((s, c) => s + (Number(c.valor_estimado) || 0), 0);

  const kpis = [
    { label: 'Total de Leads', value: ativos.length, color: 'blue', icon: 'fa-users' },
    { label: 'Em Negociação', value: pipeline.length, color: 'amber', icon: 'fa-arrows-spin' },
    { label: 'Vendas Fechadas', value: ganhos.length, color: 'emerald', icon: 'fa-handshake' },
    { label: 'Valor Estimado Pipeline', value: formatCurrency(valorPipeline), color: 'purple', icon: 'fa-sack-dollar' },
  ];

  const colors = { blue:'bg-blue-50 text-blue-600', amber:'bg-amber-50 text-amber-600', emerald:'bg-emerald-50 text-emerald-600', purple:'bg-purple-50 text-purple-600' };
  document.getElementById('crm-kpis').innerHTML = kpis.map(k => `
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl ${colors[k.color]} flex items-center justify-center flex-shrink-0">
        <i class="fa-solid ${k.icon}"></i>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${k.label}</p>
        <p class="text-lg font-extrabold text-gray-900">${k.value}</p>
      </div>
    </div>
  `).join('');
}

function _renderTable() {
  const busca  = (document.getElementById('filter-search')?.value || '').toLowerCase();
  const tipo   = document.getElementById('filter-type')?.value;
  const etapa  = document.getElementById('filter-stage')?.value;
  const eqId   = document.getElementById('filter-equipe')?.value;

  let lista = _clientes.filter(c => c.ativo !== false);
  if (busca)  lista = lista.filter(c => `${c.nome} ${c.empresa||''} ${c.telefone||''} ${c.email||''}`.toLowerCase().includes(busca));
  if (tipo)   lista = lista.filter(c => c.tipo === tipo);
  if (etapa)  lista = lista.filter(c => c.etapa_comercial === etapa);
  if (eqId)   lista = lista.filter(c => c.equipe_id === eqId);

  document.getElementById('pagination-info').textContent = `${lista.length} cliente${lista.length !== 1 ? 's' : ''} encontrado${lista.length !== 1 ? 's' : ''}`;

  const etapaMap = {
    novo_contato:   { label:'Novo Contato',    cls:'bg-gray-100 text-gray-700' },
    interessado:    { label:'Interessado',      cls:'bg-blue-100 text-blue-800' },
    proposta:       { label:'Proposta',         cls:'bg-purple-100 text-purple-800' },
    negociacao:     { label:'Negociação',       cls:'bg-amber-100 text-amber-800' },
    venda_concluida:{ label:'Venda Concluída',  cls:'bg-emerald-100 text-emerald-800' },
    desistencia:    { label:'Desistência',      cls:'bg-red-100 text-red-800' },
  };
  const tipoMap = { estudante:'Estudante', familiar:'Familiar', funcionario:'Funcionário', comunidade:'Comunidade', organizacao:'Organização' };

  const tbody = document.getElementById('clients-tbody');
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-12 text-gray-400">
      <i class="fa-solid fa-users-slash text-3xl mb-2 block"></i>Nenhum cliente encontrado
    </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(c => {
    const resp = _profiles.find(p => p.id === c.responsavel_id);
    const eq   = _etapaMap(c.etapa_comercial, etapaMap);
    const inicial = (c.nome || '?').charAt(0).toUpperCase();
    return `
      <tr class="hover:bg-gray-50 transition-colors cursor-pointer" ondblclick="editarCliente('${c.id}')">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0">${inicial}</div>
            <div>
              <div class="font-semibold text-gray-900">${c.nome}</div>
              <div class="text-xs text-gray-500">${c.empresa || ''} ${c.cargo ? '· ' + c.cargo : ''}</div>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">${tipoMap[c.tipo] || c.tipo || '—'}</span>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">
          <div>${c.telefone ? `<a href="tel:${c.telefone}" class="hover:text-blue-600"><i class="fas fa-phone text-xs mr-1"></i>${c.telefone}</a>` : '—'}</div>
          <div class="text-xs text-gray-400">${c.email || ''}</div>
        </td>
        <td class="px-4 py-3 text-sm text-gray-700 max-w-[200px]">
          <p class="truncate">${c.interesse || '—'}</p>
          ${c.valor_estimado ? `<span class="text-xs font-semibold text-emerald-700">${formatCurrency(c.valor_estimado)}</span>` : ''}
        </td>
        <td class="px-4 py-3">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${eq.cls}">${eq.label}</span>
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">${resp?.nome || '—'}</td>
        <td class="px-4 py-3 text-center">
          <button onclick="verCliente('${c.id}')" class="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50" title="Ver ficha completa"><i class="fas fa-eye"></i></button>
          <button onclick="editarCliente('${c.id}')" class="text-gray-500 hover:text-gray-800 p-1.5 rounded hover:bg-gray-100" title="Editar"><i class="fas fa-pencil"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

function _etapaMap(etapa, map) {
  return map[etapa] || { label: etapa || '—', cls: 'bg-gray-100 text-gray-700' };
}

function _bindEvents() {
  document.getElementById('btn-new-client').addEventListener('click', () => _openModal());
  document.getElementById('btn-search').addEventListener('click', _renderTable);
  document.getElementById('filter-search').addEventListener('keyup', e => { if (e.key==='Enter') _renderTable(); });

  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    exportCSV(_clientes, 'clientes', [
      { label:'Nome', field:'nome' },
      { label:'Empresa', field:'empresa' },
      { label:'Tipo', field:'tipo' },
      { label:'Telefone', field:'telefone' },
      { label:'E-mail', field:'email' },
      { label:'Etapa', field:'etapa_comercial' },
      { label:'Interesse', field:'interesse' },
    ]);
  });

  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    exportPDF('Relatório de Clientes e Leads', _clientes, [
      { label:'Nome', field:'nome' },
      { label:'Tipo', field:'tipo' },
      { label:'Etapa', field:'etapa_comercial' },
      { label:'Telefone', field:'telefone' },
    ]);
  });
}

// ─── Modal Ficha Completa (visualização) ───────────────────────────────────────
window.verCliente = async function(id) {
  const c = _clientes.find(x => x.id === id);
  if (!c) return;

  const resp   = _profiles.find(p => p.id === c.responsavel_id);
  const equipe = _equipes.find(e => e.id === c.equipe_id);

  const { data: hist } = await db.from('historico_contatos').select('*').eq('cliente_id', id);
  const historico = (hist || []).sort((a,b) => new Date(b.data) - new Date(a.data));

  const tipoIcone = { ligacao:'fa-phone', whatsapp:'fa-whatsapp brands', email:'fa-envelope', reuniao:'fa-handshake', visita:'fa-location-dot' };
  const tipoLabel = { ligacao:'Ligação', whatsapp:'WhatsApp', email:'E-mail', reuniao:'Reunião', visita:'Visita' };

  const etapaMap = { novo_contato:'Novo Contato', interessado:'Interessado', proposta:'Proposta Apresentada', negociacao:'Em Negociação', venda_concluida:'Venda Concluída', desistencia:'Desistência' };
  const etapaCls = { novo_contato:'bg-gray-100 text-gray-700', interessado:'bg-blue-100 text-blue-800', proposta:'bg-purple-100 text-purple-800', negociacao:'bg-amber-100 text-amber-800', venda_concluida:'bg-emerald-100 text-emerald-800', desistencia:'bg-red-100 text-red-800' };

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4 overflow-hidden">

        <!-- Header da ficha -->
        <div style="background:linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)" class="p-6 text-white">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-extrabold">${(c.nome||'?').charAt(0).toUpperCase()}</div>
              <div>
                <h2 class="text-xl font-bold">${c.nome}</h2>
                <p class="text-blue-200 text-sm">${c.empresa || ''}${c.cargo ? ' · '+c.cargo : ''}</p>
                <span class="mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${etapaCls[c.etapa_comercial] || 'bg-gray-100 text-gray-700'}">${etapaMap[c.etapa_comercial] || c.etapa_comercial}</span>
              </div>
            </div>
            <button id="close-ficha" class="text-white/70 hover:text-white text-2xl p-1">×</button>
          </div>
        </div>

        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">

          <!-- Dados de contato -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-1">Dados de Contato</h3>
            ${_infoRow('fa-phone','Telefone', c.telefone ? `<a href="tel:${c.telefone}" class="text-blue-600 hover:underline">${c.telefone}</a>` : '—')}
            ${_infoRow('fa-envelope','E-mail', c.email || '—')}
            ${_infoRow('fa-instagram brands','Instagram', c.instagram || '—')}
            ${_infoRow('fa-building','Empresa', c.empresa || '—')}
          </div>

          <!-- Dados comerciais -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-1">Dados Comerciais</h3>
            ${_infoRow('fa-tag','Interesse / Produto', c.interesse || '—')}
            ${_infoRow('fa-sack-dollar','Valor Estimado', c.valor_estimado ? formatCurrency(c.valor_estimado) : '—')}
            ${_infoRow('fa-percent','Probabilidade', c.probabilidade ? c.probabilidade+'%' : '—')}
            ${_infoRow('fa-user-tie','Responsável', resp?.nome || '—')}
            ${_infoRow('fa-users','Equipe', equipe?.nome || '—')}
          </div>

          <!-- Observações -->
          <div class="md:col-span-2">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-1 mb-2">Observações</h3>
            <p class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">${c.observacoes || 'Nenhuma observação.'}</p>
          </div>

          <!-- Histórico de contatos -->
          <div class="md:col-span-2">
            <div class="flex justify-between items-center border-b pb-1 mb-3">
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Histórico de Contatos</h3>
              <button id="btn-add-contato" data-cliente="${c.id}" class="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-blue-700 font-semibold">+ Registrar</button>
            </div>
            ${historico.length ? historico.map(h => `
              <div class="border border-gray-100 rounded-xl p-3.5 mb-3 bg-gray-50">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-xs">
                    <i class="fa-solid fa-${tipoIcone[h.tipo]||'fa-comment'}"></i>
                  </span>
                  <div>
                    <p class="font-semibold text-sm text-gray-800">${h.assunto}</p>
                    <p class="text-xs text-gray-400">${tipoLabel[h.tipo]||h.tipo} · ${formatDate(h.data)} · ${h.usuario_nome||''}</p>
                  </div>
                </div>
                <p class="text-sm text-gray-600 mb-1.5">${h.descricao||''}</p>
                ${h.proximo_passo ? `<div class="text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-800"><i class="fas fa-arrow-right mr-1"></i><b>Próximo passo:</b> ${h.proximo_passo}${h.proximo_passo_data ? ' (até '+formatDate(h.proximo_passo_data)+')':''}</div>` : ''}
              </div>
            `).join('') : '<p class="text-sm text-gray-400 text-center py-4">Nenhum contato registrado.</p>'}
          </div>

        </div>

        <div class="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button onclick="editarCliente('${c.id}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
            <i class="fas fa-pencil mr-2"></i>Editar Cliente
          </button>
          <button id="close-ficha-2" class="text-gray-500 hover:text-gray-800 text-sm">Fechar</button>
        </div>
      </div>
    </div>
    <div id="contato-modal-root"></div>
  `;

  document.getElementById('close-ficha').addEventListener('click', () => container.innerHTML = '');
  document.getElementById('close-ficha-2').addEventListener('click', () => container.innerHTML = '');
  document.getElementById('btn-add-contato')?.addEventListener('click', () => _openContatoModal(id, c.nome));
};

function _infoRow(icon, label, value) {
  return `
    <div class="flex items-start gap-2">
      <span class="w-5 text-gray-400 pt-0.5 text-center flex-shrink-0"><i class="fa-solid ${icon} text-sm"></i></span>
      <div>
        <p class="text-xs text-gray-400 font-medium">${label}</p>
        <p class="text-sm text-gray-800">${value}</p>
      </div>
    </div>
  `;
}

function _openContatoModal(clienteId, clienteNome) {
  const root = document.getElementById('contato-modal-root') || document.getElementById('modal-container');
  root.innerHTML = `
    <div class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold">Registrar Contato — <span class="text-blue-600">${clienteNome}</span></h3>
          <button id="close-contato-modal" class="text-gray-400 hover:text-gray-700 text-xl">×</button>
        </div>
        <form id="form-contato" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1 uppercase">Tipo de Contato</label>
              <select id="c-tipo" class="w-full border rounded-lg p-2 text-sm">
                <option value="ligacao">📞 Ligação Telefônica</option>
                <option value="whatsapp">💬 WhatsApp / Mensagem</option>
                <option value="email">📧 E-mail</option>
                <option value="reuniao">🤝 Reunião Presencial</option>
                <option value="visita">📍 Visita ao Cliente</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1 uppercase">Data</label>
              <input type="datetime-local" id="c-data" class="w-full border rounded-lg p-2 text-sm" value="${new Date().toISOString().slice(0,16)}">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1 uppercase">Assunto</label>
            <input type="text" id="c-assunto" required placeholder="Ex: Apresentação do catálogo de ecobags" class="w-full border rounded-lg p-2 text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1 uppercase">O que foi discutido?</label>
            <textarea id="c-descricao" rows="3" class="w-full border rounded-lg p-2 text-sm" placeholder="Descreva os pontos principais da conversa…"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1 uppercase">Próximo Passo</label>
              <input type="text" id="c-proximo" placeholder="Ex: Enviar proposta" class="w-full border rounded-lg p-2 text-sm">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1 uppercase">Prazo do Próximo Passo</label>
              <input type="date" id="c-prazo" class="w-full border rounded-lg p-2 text-sm">
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1 uppercase">Mover para Etapa</label>
            <select id="c-etapa" class="w-full border rounded-lg p-2 text-sm">
              <option value="">— Manter etapa atual —</option>
              <option value="interessado">Interessado</option>
              <option value="proposta">Proposta Apresentada</option>
              <option value="negociacao">Em Negociação</option>
              <option value="venda_concluida">✅ Venda Concluída!</option>
              <option value="desistencia">Desistência</option>
            </select>
          </div>
          <div class="flex justify-end gap-2 pt-2 border-t mt-4">
            <button type="button" id="cancel-contato" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Salvar Contato</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => { root.innerHTML = ''; };
  document.getElementById('close-contato-modal')?.addEventListener('click', close);
  document.getElementById('cancel-contato')?.addEventListener('click', close);

  document.getElementById('form-contato')?.addEventListener('submit', async e => {
    e.preventDefault();

    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const novoContato = {
      cliente_id: clienteId,
      responsavel_id: profile.id || null,
      usuario_nome: profile.nome || 'Usuário',
      tipo: document.getElementById('c-tipo').value,
      assunto: document.getElementById('c-assunto').value.trim(),
      descricao: document.getElementById('c-descricao').value.trim(),
      proximo_passo: document.getElementById('c-proximo').value.trim(),
      proximo_passo_data: document.getElementById('c-prazo').value || null,
      data: document.getElementById('c-data').value || new Date().toISOString(),
    };

    const novaEtapa = document.getElementById('c-etapa').value;

    const { error } = await db.from('historico_contatos').insert(novoContato);
    if (error) { showToast('Erro ao salvar contato: ' + error.message, 'error'); return; }

    if (novaEtapa) {
      await db.from('clientes').update({ etapa_comercial: novaEtapa }).eq('id', clienteId);
      const idx = _clientes.findIndex(x => x.id === clienteId);
      if (idx !== -1) _clientes[idx].etapa_comercial = novaEtapa;
    }

    showToast('Contato registrado com sucesso!', 'success');
    close();
    await window.verCliente(clienteId);
    _renderTable();
  });
}

// ─── Modal Editar / Novo cliente ───────────────────────────────────────────────
async function _openModal(id = null) {
  const c = id ? _clientes.find(x => x.id === id) : null;
  const isEditing = !!c;

  const container = document.getElementById('modal-container');

  // Opções de equipe e responsável
  const eqOpts  = _equipes.map(e => `<option value="${e.id}" ${c?.equipe_id===e.id?'selected':''}>${e.nome}</option>`).join('');
  const respOpts = _profiles.map(p => `<option value="${p.id}" ${c?.responsavel_id===p.id?'selected':''}>${p.nome}</option>`).join('');

  container.innerHTML = `
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div class="flex justify-between items-center px-6 py-4 border-b">
          <h2 class="text-xl font-bold text-gray-900">${isEditing ? 'Editar Cliente' : 'Novo Cliente / Lead'}</h2>
          <button id="close-modal-x" class="text-gray-400 hover:text-gray-700 text-2xl">×</button>
        </div>
        <form id="client-form" class="p-6 space-y-4 max-h-[78vh] overflow-y-auto">

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo *</label>
              <input type="text" id="f-nome" required value="${c?.nome||''}" class="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ex: Dra. Ana Paula Costa">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone / WhatsApp</label>
              <input type="text" id="f-telefone" value="${c?.telefone||''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="(11) 99999-9999">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
              <input type="email" id="f-email" value="${c?.email||''}" class="w-full border rounded-lg p-2.5 text-sm">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Empresa / Organização</label>
              <input type="text" id="f-empresa" value="${c?.empresa||''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Ex: Clínica OdontoVida">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Cargo / Função</label>
              <input type="text" id="f-cargo" value="${c?.cargo||''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Ex: Diretora de Marketing">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Cliente</label>
              <select id="f-tipo" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="estudante" ${c?.tipo==='estudante'?'selected':''}>Estudante</option>
                <option value="familiar" ${c?.tipo==='familiar'?'selected':''}>Familiar</option>
                <option value="funcionario" ${c?.tipo==='funcionario'?'selected':''}>Funcionário Escola</option>
                <option value="comunidade" ${c?.tipo==='comunidade'?'selected':''}>Comunidade</option>
                <option value="organizacao" ${c?.tipo==='organizacao'?'selected':''}>Organização / Empresa</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Etapa Comercial</label>
              <select id="f-etapa" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="novo_contato" ${c?.etapa_comercial==='novo_contato'?'selected':''}>Novo Contato</option>
                <option value="interessado" ${c?.etapa_comercial==='interessado'?'selected':''}>Interessado</option>
                <option value="proposta" ${c?.etapa_comercial==='proposta'?'selected':''}>Proposta Apresentada</option>
                <option value="negociacao" ${c?.etapa_comercial==='negociacao'?'selected':''}>Em Negociação</option>
                <option value="venda_concluida" ${c?.etapa_comercial==='venda_concluida'?'selected':''}>Venda Concluída</option>
                <option value="desistencia" ${c?.etapa_comercial==='desistencia'?'selected':''}>Desistência</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Valor Estimado (R$)</label>
              <input type="number" id="f-valor" step="0.01" min="0" value="${c?.valor_estimado||''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="0,00">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Probabilidade (%)</label>
              <input type="number" id="f-prob" min="0" max="100" value="${c?.probabilidade||''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="0 a 100">
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Equipe Responsável</label>
              <select id="f-equipe" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="">— Selecione —</option>
                ${eqOpts}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Vendedor Responsável</label>
              <select id="f-resp" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="">— Selecione —</option>
                ${respOpts}
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Interesse / Produto Desejado</label>
              <input type="text" id="f-interesse" value="${c?.interesse||''}" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Ex: 3 Ecobags personalizadas com logotipo">
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Observações</label>
              <textarea id="f-obs" rows="3" class="w-full border rounded-lg p-2.5 text-sm">${c?.observacoes||''}</textarea>
            </div>

          </div>

          <div class="flex justify-end gap-2 pt-2 border-t">
            <button type="button" id="cancel-modal" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border">Cancelar</button>
            <button type="submit" class="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">
              ${isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeModal = () => container.innerHTML = '';
  document.getElementById('close-modal-x').addEventListener('click', closeModal);
  document.getElementById('cancel-modal').addEventListener('click', closeModal);

  document.getElementById('client-form').addEventListener('submit', async e => {
    e.preventDefault();

    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const payload = {
      nome:              document.getElementById('f-nome').value.trim(),
      telefone:          document.getElementById('f-telefone').value.trim(),
      email:             document.getElementById('f-email').value.trim(),
      empresa:           document.getElementById('f-empresa').value.trim(),
      cargo:             document.getElementById('f-cargo').value.trim(),
      tipo:              document.getElementById('f-tipo').value,
      etapa_comercial:   document.getElementById('f-etapa').value,
      valor_estimado:    parseFloat(document.getElementById('f-valor').value) || 0,
      probabilidade:     parseInt(document.getElementById('f-prob').value) || 0,
      equipe_id:         document.getElementById('f-equipe').value || null,
      responsavel_id:    document.getElementById('f-resp').value || profile.id || null,
      interesse:         document.getElementById('f-interesse').value.trim(),
      observacoes:       document.getElementById('f-obs').value.trim(),
      ativo:             true,
    };

    let error;
    if (isEditing) {
      ({ error } = await db.from('clientes').update(payload).eq('id', id));
    } else {
      ({ error } = await db.from('clientes').insert(payload));
    }

    if (error) { showToast('Erro ao salvar: ' + error.message, 'error'); return; }

    showToast(isEditing ? 'Cliente atualizado!' : 'Cliente cadastrado com sucesso!', 'success');
    closeModal();
    await _load();
  });
}

window.editarCliente = (id) => _openModal(id);

export function cleanup() {
  delete window.verCliente;
  delete window.editarCliente;
}
