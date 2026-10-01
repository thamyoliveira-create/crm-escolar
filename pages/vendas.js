import { db } from '../db.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

let state = {
  vendas: [],
  clientes: [],
  equipes: [],
  produtos: [],
  itens: [],
  filtros: {
    periodo: '',
    equipe: '',
    status: '',
    formaPagamento: '',
    busca: ''
  }
};

export async function render(container) {
  container.innerHTML = `
    <div class="p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Vendas & Pedidos</h1>
          <p class="text-xs text-gray-500 mt-1">Gere orçamentos, pedidos de venda, recibos e baixas automáticas de estoque.</p>
        </div>
        <button id="btn-nova-venda" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow">
          <i class="fa-solid fa-plus mr-1.5"></i> Nova Venda
        </button>
      </div>

      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input type="text" id="filtro-busca" placeholder="Número ou cliente" class="border border-gray-200 p-2.5 rounded-lg text-sm">
          <input type="date" id="filtro-periodo" class="border border-gray-200 p-2.5 rounded-lg text-sm">
          <select id="filtro-equipe" class="border border-gray-200 p-2.5 rounded-lg text-sm"><option value="">Todas as Equipes</option></select>
          <select id="filtro-status" class="border border-gray-200 p-2.5 rounded-lg text-sm">
            <option value="">Todos os status</option>
            <option value="orcamento">Orçamento</option>
            <option value="pendente">Pendente</option>
            <option value="parcialmente_paga">Parcialmente Paga</option>
            <option value="paga">Paga</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select id="filtro-forma" class="border border-gray-200 p-2.5 rounded-lg text-sm">
            <option value="">Forma Pag.</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="cartao_debito">Débito</option>
            <option value="cartao_credito">Crédito</option>
            <option value="transferencia">Transferência</option>
          </select>
          <button id="btn-buscar" class="bg-slate-800 hover:bg-slate-900 text-white py-2 px-4 rounded-lg text-sm font-semibold">Filtrar</button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table class="min-w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Número/Data</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Equipe</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valores</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody id="vendas-tbody" class="bg-white divide-y divide-gray-100"></tbody>
        </table>
      </div>

      <div id="vendas-totais" class="grid grid-cols-2 md:grid-cols-5 gap-4"></div>
    </div>
    <div id="modal-container"></div>
  `;

  bindEvents();
  await loadData();
}

async function loadData() {
  try {
    const [vendasResp, clientesResp, equipesResp, itensResp, produtosResp] = await Promise.all([
      db.from('vendas').select('*'),
      db.from('clientes').select('*'),
      db.from('equipes').select('*'),
      db.from('itens_venda').select('*'),
      db.from('produtos').select('*')
    ]);

    state.clientes = clientesResp.data || [];
    state.equipes = equipesResp.data || [];
    state.itens = itensResp.data || [];
    state.produtos = produtosResp.data || [];

    populateEquipeFilter();

    let lista = (vendasResp.data || []).map(v => vendaCompleta(v));
    lista.sort((a, b) => new Date(b.data || b.criado_em) - new Date(a.data || a.criado_em));
    lista = applyFilters(lista);

    state.vendas = lista;
    renderTable();
    renderTotais();
  } catch (err) {
    console.error('Erro ao carregar vendas', err);
    showToast('Erro ao carregar vendas', 'error');
  }
}

function vendaCompleta(v) {
  const cli = state.clientes.find(c => c.id === v.cliente_id);
  const eq = state.equipes.find(e => e.id === v.equipe_id);
  const vItens = state.itens.filter(i => i.venda_id === v.id).map(i => {
    const prod = state.produtos.find(p => p.id === i.produto_id);
    return {
      ...i,
      produto_nome: prod?.nome || i.produto_nome || 'Item removido',
      custo_unitario: Number(i.custo_unitario ?? prod?.preco_custo ?? 0)
    };
  });
  const subtotal = vItens.length ? vItens.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0) : (Number(v.valor_total) || 0);
  const desconto = Number(v.desconto) || 0;
  const valorLiquido = Number(v.valor_liquido) || Math.max(0, subtotal - desconto);
  const custoTotal = vItens.reduce((acc, i) => acc + (Number(i.custo_unitario) || 0) * (Number(i.quantidade) || 0), 0);

  return {
    ...v,
    itens: vItens,
    cliente_nome: cli?.nome || v.cliente_nome || 'Não informado',
    cliente: cli || null,
    equipe_nome: eq?.nome || 'Geral',
    valor_total: subtotal,
    desconto,
    valor_liquido: valorLiquido,
    custo_total: custoTotal,
    margem_contribuicao: valorLiquido - custoTotal,
    margem_percentual: valorLiquido ? ((valorLiquido - custoTotal) / valorLiquido) * 100 : 0,
    status: v.situacao || v.status || 'pendente'
  };
}

function applyFilters(lista) {
  if (state.filtros.busca) {
    const b = state.filtros.busca.toLowerCase();
    lista = lista.filter(v => `${v.numero || ''} ${v.cliente_nome || ''}`.toLowerCase().includes(b));
  }
  if (state.filtros.equipe) lista = lista.filter(v => v.equipe_id === state.filtros.equipe);
  if (state.filtros.status) lista = lista.filter(v => v.status === state.filtros.status);
  if (state.filtros.formaPagamento) lista = lista.filter(v => v.forma_pagamento === state.filtros.formaPagamento);
  if (state.filtros.periodo) lista = lista.filter(v => v.data === state.filtros.periodo);
  return lista;
}

function populateEquipeFilter() {
  const select = document.getElementById('filtro-equipe');
  if (!select || select.options.length > 1) return;
  state.equipes.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = e.nome;
    select.appendChild(opt);
  });
}

function renderTable() {
  const tbody = document.getElementById('vendas-tbody');
  if (!tbody) return;

  if (!state.vendas.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center text-gray-400">
          <i class="fa-solid fa-receipt text-3xl mb-2 text-gray-300 block"></i>
          <p class="font-medium text-sm">Nenhuma venda encontrada.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.vendas.map(venda => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
        ${venda.numero || '—'}<br><span class="text-xs text-gray-500 font-normal">${formatDate(venda.data)}</span>
      </td>
      <td class="px-6 py-4 text-sm text-gray-900">
        <div class="font-semibold">${venda.cliente_nome}</div>
        <div class="text-xs text-gray-500">${venda.forma_pagamento ? formaLabel(venda.forma_pagamento) : 'Forma não informada'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${venda.equipe_nome}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
        Total: ${formatCurrency(venda.valor_total)}<br>
        Desc: ${formatCurrency(venda.desconto)}<br>
        Líq: <span class="font-bold text-emerald-600">${formatCurrency(venda.valor_liquido)}</span><br>
        <span class="text-xs text-purple-700 font-semibold">Margem: ${formatCurrency(venda.margem_contribuicao)} (${venda.margem_percentual.toFixed(1)}%)</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">${statusBadge(venda.status)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <button class="text-blue-600 hover:bg-blue-50 p-2 rounded" onclick="viewVenda('${venda.id}')" title="Ver detalhes"><i class="fa-solid fa-eye"></i></button>
        <button class="text-slate-600 hover:bg-slate-50 p-2 rounded" onclick="imprimirVenda('${venda.id}')" title="Imprimir recibo"><i class="fa-solid fa-print"></i></button>
        ${venda.status !== 'paga' && venda.status !== 'cancelada' ? `<button class="text-emerald-600 hover:bg-emerald-50 p-2 rounded" onclick="marcarVendaPaga('${venda.id}')" title="Marcar como paga"><i class="fa-solid fa-check"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function statusBadge(status) {
  const map = {
    orcamento: 'bg-gray-50 text-gray-700 border-gray-200|Orçamento',
    pendente: 'bg-amber-50 text-amber-700 border-amber-200|Pendente',
    parcialmente_paga: 'bg-blue-50 text-blue-700 border-blue-200|Parcial',
    paga: 'bg-emerald-50 text-emerald-700 border-emerald-200|Paga',
    cancelada: 'bg-red-50 text-red-700 border-red-200|Cancelada'
  };
  const [cls, label] = (map[status] || map.pendente).split('|');
  return `<span class="px-2.5 py-1 inline-flex text-xs font-bold rounded-full border ${cls}">${label}</span>`;
}

function formaLabel(forma) {
  const map = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    cartao_debito: 'Cartão Débito',
    cartao_credito: 'Cartão Crédito',
    transferencia: 'Transferência'
  };
  return map[forma] || forma || '—';
}

function renderTotais() {
  const container = document.getElementById('vendas-totais');
  const validas = state.vendas.filter(v => v.status !== 'cancelada' && v.status !== 'orcamento');
  const orcamentos = state.vendas.filter(v => v.status === 'orcamento');
  const qtde = validas.length;
  const bruto = validas.reduce((acc, v) => acc + (v.valor_total || 0), 0);
  const descontos = validas.reduce((acc, v) => acc + (v.desconto || 0), 0);
  const liquido = validas.reduce((acc, v) => acc + (v.valor_liquido || 0), 0);
  const margem = validas.reduce((acc, v) => acc + (v.margem_contribuicao || 0), 0);

  container.innerHTML = `
    ${totalCard('Vendas Faturadas', qtde, 'fa-cart-shopping', 'blue')}
    ${totalCard('Orçamentos', orcamentos.length, 'fa-file-signature', 'slate')}
    ${totalCard('Faturamento Bruto', formatCurrency(bruto), 'fa-sack-dollar', 'purple')}
    ${totalCard('Líquido', formatCurrency(liquido - descontos + descontos), 'fa-circle-dollar-to-slot', 'emerald')}
    ${totalCard('Margem Contribuição', formatCurrency(margem), 'fa-chart-line', 'amber')}
  `;
}

function totalCard(label, value, icon, color) {
  const map = {
    blue: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-50 text-slate-700',
    purple: 'bg-purple-50 text-purple-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700'
  };
  return `
    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div class="w-9 h-9 rounded-lg ${map[color]} flex items-center justify-center mb-2"><i class="fa-solid ${icon}"></i></div>
      <h3 class="text-gray-500 text-xs uppercase font-bold tracking-wide">${label}</h3>
      <p class="text-lg font-extrabold text-gray-900 mt-1">${value}</p>
    </div>
  `;
}

function bindEvents() {
  document.getElementById('btn-nova-venda')?.addEventListener('click', () => openVendaModal());
  document.getElementById('btn-buscar')?.addEventListener('click', () => {
    state.filtros.busca = document.getElementById('filtro-busca').value;
    state.filtros.periodo = document.getElementById('filtro-periodo').value;
    state.filtros.equipe = document.getElementById('filtro-equipe').value;
    state.filtros.status = document.getElementById('filtro-status').value;
    state.filtros.formaPagamento = document.getElementById('filtro-forma').value;
    loadData();
  });
}

function nextNumeroVenda() {
  const ano = new Date().getFullYear();
  const nums = state.vendas
    .map(v => String(v.numero || '').match(/(\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `PED-${ano}-${String(next).padStart(3, '0')}`;
}

function openVendaModal() {
  const modal = document.getElementById('modal-container');
  const hoje = new Date().toISOString().split('T')[0];
  const numero = nextNumeroVenda();

  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-4">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 class="text-xl font-extrabold text-gray-900">Nova Venda / Orçamento</h2>
            <p class="text-xs text-gray-500">Pedido ${numero} — selecione itens, calcule margem e gere recibo.</p>
          </div>
          <button id="close-venda-modal" class="text-gray-400 hover:text-gray-700 text-2xl">×</button>
        </div>
        <form id="form-venda" class="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Número</label>
              <input id="v-numero" value="${numero}" class="w-full border rounded-lg p-2.5 text-sm bg-gray-50" readonly>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data</label>
              <input type="date" id="v-data" value="${hoje}" class="w-full border rounded-lg p-2.5 text-sm" required>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Cliente</label>
              <select id="v-cliente" class="w-full border rounded-lg p-2.5 text-sm" required>
                <option value="">Selecione</option>
                ${state.clientes.filter(c => c.ativo !== false).map(c => `<option value="${c.id}">${c.nome}${c.empresa ? ' · ' + c.empresa : ''}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Equipe</label>
              <select id="v-equipe" class="w-full border rounded-lg p-2.5 text-sm" required>
                <option value="">Selecione</option>
                ${state.equipes.map(e => `<option value="${e.id}">${e.nome}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
              <select id="v-status" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="orcamento">Orçamento</option>
                <option value="pendente">Pedido Pendente</option>
                <option value="paga">Venda Paga</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Forma de Pagamento</label>
              <select id="v-forma" class="w-full border rounded-lg p-2.5 text-sm">
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão Débito</option>
                <option value="cartao_credito">Cartão Crédito</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Desconto Geral (R$)</label>
              <input type="number" step="0.01" min="0" id="v-desconto" value="0" class="w-full border rounded-lg p-2.5 text-sm venda-calc">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Recebido Agora (R$)</label>
              <input type="number" step="0.01" min="0" id="v-recebido" value="0" class="w-full border rounded-lg p-2.5 text-sm">
            </div>
          </div>

          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="bg-gray-50 px-4 py-3 flex justify-between items-center border-b">
              <h3 class="font-bold text-gray-800 text-sm">Itens do Pedido</h3>
              <button type="button" id="btn-add-item" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><i class="fa-solid fa-plus mr-1"></i>Adicionar Item</button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-white border-b">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs uppercase text-gray-500">Produto/Serviço</th>
                    <th class="px-3 py-2 text-left text-xs uppercase text-gray-500 w-24">Qtd</th>
                    <th class="px-3 py-2 text-left text-xs uppercase text-gray-500 w-32">Preço Un.</th>
                    <th class="px-3 py-2 text-left text-xs uppercase text-gray-500 w-32">Desc. Item</th>
                    <th class="px-3 py-2 text-left text-xs uppercase text-gray-500 w-32">Subtotal</th>
                    <th class="px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody id="tbody-itens"></tbody>
              </table>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div><p class="text-xs text-gray-500 uppercase font-bold">Subtotal</p><p id="calc-subtotal" class="text-lg font-extrabold">R$ 0,00</p></div>
            <div><p class="text-xs text-gray-500 uppercase font-bold">Descontos</p><p id="calc-desconto" class="text-lg font-extrabold text-red-600">R$ 0,00</p></div>
            <div><p class="text-xs text-gray-500 uppercase font-bold">Líquido</p><p id="calc-liquido" class="text-lg font-extrabold text-emerald-700">R$ 0,00</p></div>
            <div><p class="text-xs text-gray-500 uppercase font-bold">Custo</p><p id="calc-custo" class="text-lg font-extrabold text-gray-700">R$ 0,00</p></div>
            <div><p class="text-xs text-gray-500 uppercase font-bold">Margem</p><p id="calc-margem" class="text-lg font-extrabold text-purple-700">R$ 0,00</p></div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Observações</label>
            <textarea id="v-obs" rows="2" class="w-full border rounded-lg p-2.5 text-sm" placeholder="Prazos de entrega, condições combinadas, dados para personalização..."></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" id="cancel-venda-modal" class="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Salvar Pedido</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => modal.innerHTML = '';
  document.getElementById('close-venda-modal')?.addEventListener('click', close);
  document.getElementById('cancel-venda-modal')?.addEventListener('click', close);
  document.getElementById('btn-add-item')?.addEventListener('click', () => addItemRow());
  document.getElementById('v-desconto')?.addEventListener('input', updateVendaTotals);
  document.getElementById('tbody-itens')?.addEventListener('input', e => {
    if (e.target.classList.contains('item-calc')) updateVendaTotals();
  });
  document.getElementById('tbody-itens')?.addEventListener('change', e => {
    if (e.target.classList.contains('item-produto')) {
      const row = e.target.closest('tr');
      const prod = state.produtos.find(p => p.id === e.target.value);
      if (prod) {
        row.querySelector('.item-preco').value = Number(prod.preco_venda) || 0;
        row.querySelector('.item-custo').value = Number(prod.preco_custo) || 0;
      }
      updateVendaTotals();
    }
  });
  document.getElementById('tbody-itens')?.addEventListener('click', e => {
    const btn = e.target.closest('.btn-remove-item');
    if (btn) {
      btn.closest('tr')?.remove();
      updateVendaTotals();
    }
  });

  addItemRow();

  document.getElementById('form-venda')?.addEventListener('submit', saveVenda);
}

function productOptions() {
  return state.produtos.filter(p => p.ativo !== false).map(p => {
    const estoque = p.tipo === 'produto' ? ` · Estoque: ${Number(p.estoque_atual ?? 0)}` : '';
    return `<option value="${p.id}">${p.nome} — ${formatCurrency(Number(p.preco_venda) || 0)}${estoque}</option>`;
  }).join('');
}

function addItemRow() {
  const tbody = document.getElementById('tbody-itens');
  const tr = document.createElement('tr');
  tr.className = 'border-b last:border-b-0 item-row';
  tr.innerHTML = `
    <td class="px-3 py-2">
      <select class="item-produto w-full border rounded-lg p-2 text-sm" required>
        <option value="">Selecione</option>
        ${productOptions()}
      </select>
      <input type="hidden" class="item-custo" value="0">
    </td>
    <td class="px-3 py-2"><input type="number" min="1" step="1" value="1" class="item-qtd item-calc w-full border rounded-lg p-2 text-sm"></td>
    <td class="px-3 py-2"><input type="number" min="0" step="0.01" value="0" class="item-preco item-calc w-full border rounded-lg p-2 text-sm"></td>
    <td class="px-3 py-2"><input type="number" min="0" step="0.01" value="0" class="item-desc item-calc w-full border rounded-lg p-2 text-sm"></td>
    <td class="px-3 py-2 font-bold text-gray-900 item-subtotal">R$ 0,00</td>
    <td class="px-3 py-2 text-center"><button type="button" class="btn-remove-item text-red-500 hover:bg-red-50 rounded p-2"><i class="fa-solid fa-trash"></i></button></td>
  `;
  tbody.appendChild(tr);
}

function collectItemRows() {
  return [...document.querySelectorAll('#tbody-itens .item-row')].map(row => {
    const produtoId = row.querySelector('.item-produto').value;
    const prod = state.produtos.find(p => p.id === produtoId);
    const quantidade = Number(row.querySelector('.item-qtd').value) || 0;
    const preco = Number(row.querySelector('.item-preco').value) || 0;
    const desconto = Number(row.querySelector('.item-desc').value) || 0;
    const custo = Number(row.querySelector('.item-custo').value) || Number(prod?.preco_custo) || 0;
    const subtotal = Math.max(0, quantidade * preco - desconto);
    return { row, prod, produtoId, quantidade, preco, desconto, custo, subtotal };
  }).filter(i => i.produtoId && i.quantidade > 0);
}

function updateVendaTotals() {
  const itens = collectItemRows();
  let subtotal = 0;
  let descItens = 0;
  let custo = 0;
  itens.forEach(i => {
    subtotal += i.quantidade * i.preco;
    descItens += i.desconto;
    custo += i.quantidade * i.custo;
    i.row.querySelector('.item-subtotal').textContent = formatCurrency(i.subtotal);
  });
  const descGeral = Number(document.getElementById('v-desconto')?.value) || 0;
  const liquido = Math.max(0, subtotal - descItens - descGeral);
  const margem = liquido - custo;
  const margemPct = liquido ? (margem / liquido) * 100 : 0;
  document.getElementById('calc-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('calc-desconto').textContent = formatCurrency(descItens + descGeral);
  document.getElementById('calc-liquido').textContent = formatCurrency(liquido);
  document.getElementById('calc-custo').textContent = formatCurrency(custo);
  document.getElementById('calc-margem').textContent = `${formatCurrency(margem)} (${margemPct.toFixed(1)}%)`;
  return { subtotal, descItens, descGeral, liquido, custo, margem };
}

async function saveVenda(e) {
  e.preventDefault();
  const itens = collectItemRows();
  if (!itens.length) {
    showToast('Adicione pelo menos um item ao pedido.', 'warning');
    return;
  }

  const totals = updateVendaTotals();
  const status = document.getElementById('v-status').value;
  const recebido = Number(document.getElementById('v-recebido').value) || 0;
  const clienteId = document.getElementById('v-cliente').value;
  const cliente = state.clientes.find(c => c.id === clienteId);
  const numero = document.getElementById('v-numero').value;

  const vendaPayload = {
    numero,
    projeto_id: cliente?.projeto_id || null,
    equipe_id: document.getElementById('v-equipe').value || null,
    cliente_id: clienteId,
    cliente_nome: cliente?.nome || '',
    data: document.getElementById('v-data').value,
    situacao: status,
    status,
    forma_pagamento: document.getElementById('v-forma').value,
    desconto: totals.descGeral,
    valor_total: totals.subtotal - totals.descItens,
    valor_liquido: totals.liquido,
    custo_total: totals.custo,
    margem_contribuicao: totals.margem,
    observacoes: document.getElementById('v-obs').value.trim()
  };

  const vendaResp = await db.from('vendas').insert(vendaPayload);
  if (vendaResp.error) {
    showToast('Erro ao salvar venda: ' + vendaResp.error.message, 'error');
    return;
  }
  const venda = vendaResp.data;

  for (const i of itens) {
    await db.from('itens_venda').insert({
      venda_id: venda.id,
      produto_id: i.produtoId,
      produto_nome: i.prod?.nome || '',
      quantidade: i.quantidade,
      preco_unitario: i.preco,
      custo_unitario: i.custo,
      desconto: i.desconto,
      subtotal: i.subtotal
    });

    if (status !== 'orcamento' && i.prod?.tipo !== 'servico') {
      const atual = Number(i.prod?.estoque_atual ?? i.prod?.estoque_disponivel ?? 0);
      await db.from('produtos').update({ estoque_atual: Math.max(0, atual - i.quantidade) }).eq('id', i.produtoId);
      await db.from('movimentacoes_estoque').insert({
        produto_id: i.produtoId,
        tipo: 'saida',
        quantidade: i.quantidade,
        motivo: `Venda ${numero}`,
        data: vendaPayload.data
      });
    }
  }

  if (status === 'paga' || recebido > 0) {
    await db.from('recebimentos').insert({
      venda_id: venda.id,
      cliente_nome: cliente?.nome || '',
      data: vendaPayload.data,
      valor: status === 'paga' ? totals.liquido : Math.min(recebido, totals.liquido),
      forma_pagamento: vendaPayload.forma_pagamento,
      usuario_nome: JSON.parse(localStorage.getItem('user_profile') || '{}').nome || 'Usuário'
    });
  }

  if (clienteId && status !== 'orcamento') {
    await db.from('clientes').update({ etapa_comercial: status === 'paga' ? 'venda_concluida' : 'negociacao' }).eq('id', clienteId);
  }

  showToast('Pedido salvo com sucesso!', 'success');
  document.getElementById('modal-container').innerHTML = '';
  await loadData();
}

function findVenda(id) {
  return state.vendas.find(v => v.id === id) || vendaCompleta({ ...(state.vendas.find(v => v.id === id) || {}) });
}

window.viewVenda = function(id) {
  const v = findVenda(id);
  if (!v?.id) return;
  const modal = document.getElementById('modal-container');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
        <div class="px-6 py-4 border-b flex justify-between items-start">
          <div>
            <h2 class="text-xl font-extrabold text-gray-900">Pedido ${v.numero}</h2>
            <p class="text-xs text-gray-500">${formatDate(v.data)} · ${v.cliente_nome} · ${v.equipe_nome}</p>
          </div>
          <button id="close-view-venda" class="text-gray-400 hover:text-gray-700 text-2xl">×</button>
        </div>
        <div class="p-6 space-y-5">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-blue-50 p-3 rounded-lg"><p class="text-xs text-blue-700 font-bold uppercase">Subtotal</p><p class="font-extrabold">${formatCurrency(v.valor_total)}</p></div>
            <div class="bg-red-50 p-3 rounded-lg"><p class="text-xs text-red-700 font-bold uppercase">Desconto</p><p class="font-extrabold">${formatCurrency(v.desconto)}</p></div>
            <div class="bg-emerald-50 p-3 rounded-lg"><p class="text-xs text-emerald-700 font-bold uppercase">Líquido</p><p class="font-extrabold">${formatCurrency(v.valor_liquido)}</p></div>
            <div class="bg-purple-50 p-3 rounded-lg"><p class="text-xs text-purple-700 font-bold uppercase">Margem</p><p class="font-extrabold">${v.margem_percentual.toFixed(1)}%</p></div>
          </div>
          <div class="border rounded-xl overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left">Item</th><th class="px-4 py-2 text-right">Qtd</th><th class="px-4 py-2 text-right">Preço</th><th class="px-4 py-2 text-right">Subtotal</th></tr></thead>
              <tbody class="divide-y">${v.itens.map(i => `<tr><td class="px-4 py-2">${i.produto_nome}</td><td class="px-4 py-2 text-right">${i.quantidade}</td><td class="px-4 py-2 text-right">${formatCurrency(i.preco_unitario)}</td><td class="px-4 py-2 text-right font-bold">${formatCurrency(i.subtotal)}</td></tr>`).join('')}</tbody>
            </table>
          </div>
          <div><p class="text-xs text-gray-500 uppercase font-bold">Observações</p><p class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">${v.observacoes || 'Nenhuma observação.'}</p></div>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <button onclick="imprimirVenda('${v.id}')" class="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold"><i class="fa-solid fa-print mr-1.5"></i>Imprimir</button>
          <button id="close-view-venda-2" class="px-4 py-2 border rounded-lg text-sm text-gray-600">Fechar</button>
        </div>
      </div>
    </div>
  `;
  const close = () => modal.innerHTML = '';
  document.getElementById('close-view-venda')?.addEventListener('click', close);
  document.getElementById('close-view-venda-2')?.addEventListener('click', close);
};

window.imprimirVenda = function(id) {
  const v = findVenda(id);
  if (!v?.id) return;
  const html = `
    <html><head><title>${v.numero}</title><style>
      body{font-family:Arial,sans-serif;padding:32px;color:#111827} h1{margin:0 0 4px}.muted{color:#6b7280;font-size:12px}.box{border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border-bottom:1px solid #e5e7eb;padding:10px;text-align:left}th{background:#f9fafb;font-size:12px;text-transform:uppercase}.right{text-align:right}.total{font-size:20px;font-weight:bold;color:#047857}@media print{button{display:none}}
    </style></head><body>
      <h1>${v.status === 'orcamento' ? 'ORÇAMENTO COMERCIAL' : 'RECIBO / PEDIDO DE VENDA'}</h1>
      <p class="muted">CRM Escolar · Miniempresa Educacional</p>
      <div class="box"><b>Pedido:</b> ${v.numero}<br><b>Data:</b> ${formatDate(v.data)}<br><b>Cliente:</b> ${v.cliente_nome}<br><b>Equipe:</b> ${v.equipe_nome}<br><b>Status:</b> ${v.status}</div>
      <table><thead><tr><th>Item</th><th class="right">Qtd</th><th class="right">Preço</th><th class="right">Subtotal</th></tr></thead><tbody>
        ${v.itens.map(i => `<tr><td>${i.produto_nome}</td><td class="right">${i.quantidade}</td><td class="right">${formatCurrency(i.preco_unitario)}</td><td class="right">${formatCurrency(i.subtotal)}</td></tr>`).join('')}
      </tbody></table>
      <div class="box right"><p>Subtotal: ${formatCurrency(v.valor_total)}</p><p>Desconto: ${formatCurrency(v.desconto)}</p><p class="total">Total: ${formatCurrency(v.valor_liquido)}</p><p>Forma de pagamento: ${formaLabel(v.forma_pagamento)}</p></div>
      <p class="muted">Observações: ${v.observacoes || '—'}</p>
      <button onclick="window.print()">Imprimir</button>
    </body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
};

window.marcarVendaPaga = async function(id) {
  const v = findVenda(id);
  if (!v?.id) return;
  const { error } = await db.from('vendas').update({ situacao: 'paga', status: 'paga' }).eq('id', id);
  if (error) {
    showToast('Erro ao atualizar venda: ' + error.message, 'error');
    return;
  }
  await db.from('recebimentos').insert({
    venda_id: id,
    cliente_nome: v.cliente_nome,
    data: new Date().toISOString().split('T')[0],
    valor: v.valor_liquido,
    forma_pagamento: v.forma_pagamento || 'pix',
    usuario_nome: JSON.parse(localStorage.getItem('user_profile') || '{}').nome || 'Usuário'
  });
  if (v.cliente_id) await db.from('clientes').update({ etapa_comercial: 'venda_concluida' }).eq('id', v.cliente_id);
  showToast('Venda marcada como paga!', 'success');
  await loadData();
};

export function cleanup() {
  delete window.viewVenda;
  delete window.imprimirVenda;
  delete window.marcarVendaPaga;
}
