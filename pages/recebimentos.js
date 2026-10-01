import { db } from '../db.js';
import { getCurrentUser } from '../auth.js';
import { formatCurrency, formatDate, showToast, exportCSV, exportPDF } from '../utils.js';

let currentData = [];
let allVendas = [];
let allProfiles = [];

export async function render(container) {
  container.innerHTML = `
    <div class="p-4 md:p-6 space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Controle de Recebimentos</h1>
          <p class="text-xs text-gray-500">Gestão de entradas financeiras, conciliação e quitação de vendas das miniempresas.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button id="btn-export-csv" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-file-csv text-emerald-600"></i> Exportar CSV
          </button>
          <button id="btn-export-pdf" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-file-pdf text-red-600"></i> Exportar PDF
          </button>
          <button id="btn-registrar" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow flex items-center gap-1.5 transition-colors">
            <i class="fa-solid fa-plus"></i> Registrar Recebimento
          </button>
        </div>
      </div>

      <!-- Cards de Métricas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-circle-check"></i>
          </div>
          <div>
            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Recebido</h3>
            <p id="card-total" class="text-xl font-extrabold text-gray-900 mt-0.5">R$ 0,00</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-receipt"></i>
          </div>
          <div>
            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-wider">Nº de Recebimentos</h3>
            <p id="card-count" class="text-xl font-extrabold text-gray-900 mt-0.5">0</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid fa-calculator"></i>
          </div>
          <div>
            <h3 class="text-gray-400 text-xs font-bold uppercase tracking-wider">Ticket Médio Recebido</h3>
            <p id="card-avg" class="text-xl font-extrabold text-gray-900 mt-0.5">R$ 0,00</p>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div class="md:col-span-2">
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Buscar</label>
            <input type="text" id="filter-search" placeholder="Buscar por cliente, observação ou nº do pedido..." class="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Forma de Pagamento</label>
            <select id="filter-payment" class="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500">
              <option value="">Todas as formas</option>
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="debito">Cartão de Débito</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data Inicial</label>
            <input type="date" id="filter-date-start" class="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </div>

      <!-- Tabela -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200" id="table-recebimentos">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pedido / Venda</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor Recebido</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Forma</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Responsável</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Obs</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100" id="tbody-recebimentos"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Registrar Recebimento -->
    <div id="modal-registrar" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 my-6 animate-fadeIn">
        <div class="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Registrar Recebimento</h3>
            <p class="text-xs text-gray-500">Dê baixa financeira no pedido ou registre uma entrada avulsa.</p>
          </div>
          <button id="modal-close" class="text-gray-400 hover:text-gray-600 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="form-registrar" class="space-y-3.5">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Venda Vinculada *</label>
            <select id="reg-venda" required class="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500"></select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data do Recebimento *</label>
              <input type="date" id="reg-data" required class="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Valor Recebido (R$) *</label>
              <input type="number" step="0.01" min="0.01" id="reg-valor" required class="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Forma de Pagamento *</label>
            <select id="reg-forma" required class="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500">
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="debito">Cartão de Débito</option>
              <option value="credito">Cartão de Crédito</option>
              <option value="transferencia">Transferência Bancária</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Observações / Comprovante</label>
            <textarea id="reg-obs" rows="2" class="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500" placeholder="Ex: Chave PIX comprovante #99482, pago na entrega..."></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" id="modal-cancel" class="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-colors">Confirmar Recebimento</button>
          </div>
        </form>
      </div>
    </div>
  `;

  await loadData();
  setupListeners();
}

async function loadData() {
  try {
    const [recResp, venResp, profResp] = await Promise.all([
      db.from('recebimentos').select('*'),
      db.from('vendas').select('*'),
      db.from('profiles').select('*')
    ]);

    currentData = recResp.data || recResp || [];
    allVendas = venResp.data || venResp || [];
    allProfiles = profResp.data || profResp || [];

    renderTable();
  } catch (error) {
    console.error('Erro ao carregar recebimentos', error);
    showToast('Erro ao carregar dados', 'error');
  }
}

function renderTable() {
  const tbody = document.getElementById('tbody-recebimentos');
  if (!tbody) return;

  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const payment = document.getElementById('filter-payment')?.value || '';
  const dateStart = document.getElementById('filter-date-start')?.value || '';

  let filtered = currentData.filter(r => {
    const venda = allVendas.find(v => v.id === r.venda_id);
    if (search) {
      const term = search.toLowerCase();
      const cli = (venda?.cliente_nome || r.cliente_nome || '').toLowerCase();
      const num = (venda?.numero || '').toString();
      const obs = (r.observacao || '').toLowerCase();
      if (!cli.includes(term) && !num.includes(term) && !obs.includes(term)) return false;
    }
    if (payment && r.forma_pagamento !== payment) return false;
    if (dateStart && r.data < dateStart) return false;
    return true;
  });

  filtered.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  tbody.innerHTML = '';
  let total = 0;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-400">
          <i class="fa-solid fa-receipt text-3xl mb-2 text-gray-300 block"></i>
          <p class="text-sm font-medium">Nenhum recebimento registrado no filtro atual.</p>
        </td>
      </tr>
    `;
  } else {
    filtered.forEach(r => {
      const valor = Number(r.valor) || 0;
      total += valor;
      const venda = allVendas.find(v => v.id === r.venda_id);
      const resp = allProfiles.find(p => p.id === r.registrado_por)?.nome || 'Sistema';

      const formaFormatada = {
        pix: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">PIX</span>',
        dinheiro: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Dinheiro</span>',
        debito: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Débito</span>',
        credito: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Crédito</span>',
        transferencia: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Transf.</span>'
      }[r.forma_pagamento] || `<span class="capitalize text-xs">${r.forma_pagamento || '—'}</span>`;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50';
      tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">${formatDate(r.data)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900">
          ${venda ? `Pedido #${venda.numero}` : (r.venda_id ? `Venda #${r.venda_id.substring(0,6)}` : 'Avulso')}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-700">${venda?.cliente_nome || r.cliente_nome || 'Consumidor'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-xs text-emerald-600 font-extrabold">${formatCurrency(valor)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-xs">${formaFormatada}</td>
        <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500">${resp}</td>
        <td class="px-6 py-4 text-xs text-gray-400 max-w-xs truncate">${r.observacao || '—'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('card-total').textContent = formatCurrency(total);
  document.getElementById('card-count').textContent = filtered.length;
  document.getElementById('card-avg').textContent = filtered.length > 0 ? formatCurrency(total / filtered.length) : 'R$ 0,00';
}

function setupListeners() {
  document.getElementById('filter-search')?.addEventListener('input', renderTable);
  document.getElementById('filter-payment')?.addEventListener('change', renderTable);
  document.getElementById('filter-date-start')?.addEventListener('change', renderTable);

  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    exportCSV('table-recebimentos', 'recebimentos.csv');
  });
  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    exportPDF('table-recebimentos', 'Relatório de Recebimentos', 'recebimentos.pdf');
  });

  const modal = document.getElementById('modal-registrar');
  document.getElementById('btn-registrar')?.addEventListener('click', async () => {
    try {
      const select = document.getElementById('reg-venda');
      select.innerHTML = '<option value="">Selecione uma venda / pedido...</option>';
      allVendas.forEach(v => {
        const valTotal = Number(v.valor_liquido || v.valor_total) || 0;
        select.innerHTML += `<option value="${v.id}" data-valor="${valTotal}">Pedido #${v.numero} — ${v.cliente_nome} (${formatCurrency(valTotal)}) [${v.status || 'aberto'}]</option>`;
      });

      document.getElementById('reg-data').value = new Date().toISOString().split('T')[0];
      modal.classList.remove('hidden');
    } catch (error) {
      console.error(error);
      showToast('Erro ao carregar vendas', 'error');
    }
  });

  document.getElementById('reg-venda')?.addEventListener('change', e => {
    const selected = e.target.options[e.target.selectedIndex];
    if (selected && selected.dataset.valor) {
      document.getElementById('reg-valor').value = selected.dataset.valor;
    }
  });

  document.getElementById('modal-close')?.addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('modal-cancel')?.addEventListener('click', () => modal.classList.add('hidden'));

  document.getElementById('form-registrar')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const vendaId = document.getElementById('reg-venda').value;
    const data = document.getElementById('reg-data').value;
    const valor = parseFloat(document.getElementById('reg-valor').value);
    const forma = document.getElementById('reg-forma').value;
    const obs = document.getElementById('reg-obs').value.trim();

    if (!data || isNaN(valor) || valor <= 0) {
      showToast('Preencha um valor válido.', 'warning');
      return;
    }

    const currentUser = getCurrentUser();

    try {
      await db.from('recebimentos').insert([{
        venda_id: vendaId || null,
        data,
        valor,
        forma_pagamento: forma,
        observacao: obs,
        registrado_por: currentUser?.id || 'usr-admin-01'
      }]);

      if (vendaId) {
        const { data: recsVenda } = await db.from('recebimentos').select('*').eq('venda_id', vendaId);
        const totalRecebido = (recsVenda || []).reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) + valor;

        const venda = allVendas.find(v => v.id === vendaId);
        const valorTotalVenda = Number(venda?.valor_liquido || venda?.valor_total) || 0;

        const novoStatus = totalRecebido >= valorTotalVenda ? 'paga' : 'parcialmente_paga';
        await db.from('vendas').update({ status: novoStatus, situacao: novoStatus }).eq('id', vendaId);
      }

      showToast('Recebimento registrado com sucesso!', 'success');
      modal.classList.add('hidden');
      document.getElementById('form-registrar').reset();
      await loadData();
    } catch (error) {
      console.error(error);
      showToast('Erro ao registrar recebimento: ' + error.message, 'error');
    }
  });
}

export function cleanup() {
  currentData = [];
  allVendas = [];
  allProfiles = [];
}
