// supabase-mock.js — Camada de persistência local para o CRM Escolar
// Armazena dados reais inseridos pelo usuário no localStorage.

const INITIAL_DATA = {
  profiles: [
    { id: 'usr-admin-01', nome: 'Professora Tamiris', email: 'tamiris@escola.edu', perfil: 'administrador', role: 'admin', ativo: true, criado_em: '2026-02-01T08:00:00Z' },
    { id: 'usr-aluno-01', nome: 'Lucas Mendes (Líder Vendas)', email: 'lucas.mendes@escola.edu', perfil: 'estudante', role: 'estudante', ativo: true, criado_em: '2026-02-05T09:00:00Z' },
    { id: 'usr-aluno-02', nome: 'Beatriz Lima (Gestão Financeira)', email: 'beatriz.lima@escola.edu', perfil: 'estudante', role: 'estudante', ativo: true, criado_em: '2026-02-05T09:10:00Z' },
    { id: 'usr-aluno-03', nome: 'Gabriel Rocha (Comercial)', email: 'gabriel.rocha@escola.edu', perfil: 'estudante', role: 'estudante', ativo: true, criado_em: '2026-02-05T09:20:00Z' },
    { id: 'usr-prof-02', nome: 'Prof. Carlos Eduardo (Mentor)', email: 'carlos.eduardo@escola.edu', perfil: 'professor', role: 'professor', ativo: true, criado_em: '2026-02-01T08:30:00Z' }
  ],
  projetos: [
    {
      id: 'prj-2026-01',
      nome: 'Feira de Miniempresas Escolares 2026',
      descricao: 'Projeto interdisciplinar de empreendedorismo pedagógico conectando Matemática Financeira, Comunicação Comercial, CRM e Gestão de Negócios.',
      turma: '3º Ano do Ensino Médio',
      ano_letivo: '2026',
      data_inicio: '2026-02-15',
      data_fim: '2026-11-30',
      meta_vendas: 300,
      meta_faturamento: 7500.00,
      situacao: 'comercializacao',
      criado_em: '2026-02-15T10:00:00Z'
    }
  ],
  projeto_professores: [],
  projeto_disciplinas: [],
  equipes: [
    {
      id: 'eq-001',
      projeto_id: 'prj-2026-01',
      nome: 'EcoBag Sustentável',
      descricao: 'Miniempresa focada em ecobags ecológicas personalizadas feitas com tecido reciclado.',
      produto_servico: 'Ecobags Personalizadas & Estojos Ecológicos',
      meta_vendas: 150,
      meta_faturamento: 3800.00,
      orientador_id: 'usr-admin-01',
      ativa: true,
      criado_em: '2026-02-20T10:00:00Z'
    },
    {
      id: 'eq-002',
      projeto_id: 'prj-2026-01',
      nome: 'Doces do Futuro Gourmet',
      descricao: 'Miniempresa de confeitaria artesanal com embalagens biodegradáveis e vendas por encomenda.',
      produto_servico: 'Trufas Gourmet e Copos da Felicidade',
      meta_vendas: 180,
      meta_faturamento: 4200.00,
      orientador_id: 'usr-prof-02',
      ativa: true,
      criado_em: '2026-02-20T11:00:00Z'
    }
  ],
  equipe_membros: [
    { id: 'eqm-01', equipe_id: 'eq-001', estudante_id: 'usr-aluno-01', funcao: 'Diretor Comercial / Vendas' },
    { id: 'eqm-02', equipe_id: 'eq-001', estudante_id: 'usr-aluno-02', funcao: 'Diretora Financeira' },
    { id: 'eqm-03', equipe_id: 'eq-002', estudante_id: 'usr-aluno-03', funcao: 'Líder de Vendas e CRM' }
  ],
  clientes: [
    {
      id: 'cli-001',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-001',
      responsavel_id: 'usr-aluno-01',
      nome: 'Dra. Mariana Vasconcelos',
      empresa: 'Clínica OdontoVida',
      cargo: 'Diretora Clínica',
      tipo: 'organizacao',
      telefone: '(11) 98765-4321',
      email: 'mariana.odonto@gmail.com',
      instagram: '@odontovida',
      interesse: 'Lote de 30 Ecobags com logotipo da clínica para brindes de fim de ano',
      etapa_comercial: 'negociacao',
      temperatura: 'quente',
      valor_estimado: 750.00,
      probabilidade: 85,
      observacoes: 'Cliente muito receptiva. Pediu amostra do tecido e orçamento com 10% de desconto.',
      ativo: true,
      criado_em: '2026-03-01T14:30:00Z'
    },
    {
      id: 'cli-002',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-001',
      responsavel_id: 'usr-aluno-01',
      nome: 'Prof. Roberto Andrade',
      empresa: 'Colégio Estadual',
      cargo: 'Coordenador Pedagógico',
      tipo: 'funcionario',
      telefone: '(11) 97654-3210',
      email: 'roberto.coordenacao@escola.edu',
      instagram: '@roberto_andrade',
      interesse: 'Ecobag Média para material de aula',
      etapa_comercial: 'proposta',
      temperatura: 'morno',
      valor_estimado: 35.00,
      probabilidade: 60,
      observacoes: 'Apresentada proposta com estampa temática de ciências.',
      ativo: true,
      criado_em: '2026-03-05T11:00:00Z'
    },
    {
      id: 'cli-003',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-001',
      responsavel_id: 'usr-aluno-01',
      nome: 'Fernanda Nogueira (Mãe de Aluno)',
      empresa: 'Autônoma',
      cargo: 'Arquiteta',
      tipo: 'familiar',
      telefone: '(11) 96543-2109',
      email: 'fernanda.nogueira@outlook.com',
      instagram: '@fe.nogueira.arq',
      interesse: 'Kit 2 Ecobags Personalizadas Família',
      etapa_comercial: 'venda_concluida',
      temperatura: 'quente',
      valor_estimado: 60.00,
      probabilidade: 100,
      observacoes: 'Venda finalizada com pagamento via PIX.',
      ativo: true,
      criado_em: '2026-03-08T16:00:00Z'
    },
    {
      id: 'cli-004',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-002',
      responsavel_id: 'usr-aluno-03',
      nome: 'Academia Corpo & Movimento',
      empresa: 'Corpo & Movimento Fitness',
      cargo: 'Gerente de Recepção',
      tipo: 'organizacao',
      telefone: '(11) 95432-1098',
      email: 'contato@corpomovimento.com.br',
      instagram: '@corpomovimento_fit',
      interesse: 'Trufas Proteicas e Doces Fitness para evento de inauguração',
      etapa_comercial: 'interessado',
      temperatura: 'morno',
      valor_estimado: 450.00,
      probabilidade: 50,
      observacoes: 'Primeiro contato realizado via WhatsApp.',
      ativo: true,
      criado_em: '2026-03-10T10:00:00Z'
    },
    {
      id: 'cli-005',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-002',
      responsavel_id: 'usr-aluno-03',
      nome: 'Pedro Henrique (Grêmio Estudantil)',
      empresa: 'Grêmio Estudantil',
      cargo: 'Presidente',
      tipo: 'estudante',
      telefone: '(11) 94321-0987',
      email: 'pedro.gremio@escola.edu',
      instagram: '@pedro_h_gremio',
      interesse: 'Combo com 50 Trufas Gourmet para o Intervalo Cultural',
      etapa_comercial: 'novo_contato',
      temperatura: 'quente',
      valor_estimado: 250.00,
      probabilidade: 75,
      observacoes: 'Lead quente! Agendada reunião de degustação para o intervalo de sexta.',
      ativo: true,
      criado_em: '2026-03-12T09:30:00Z'
    }
  ],
  historico_contatos: [
    {
      id: 'hc-001',
      cliente_id: 'cli-001',
      responsavel_id: 'usr-aluno-01',
      usuario_nome: 'Lucas Mendes',
      tipo: 'reuniao',
      assunto: 'Apresentação do Catálogo Corporativo de Ecobags',
      descricao: 'Reunião presencial de 20 minutos com a Dra. Mariana. Demonstramos o protótipo com costura reforçada. Ela adorou a sustentabilidade e pediu orçamento para 30 unidades.',
      data: '2026-03-02T15:00:00Z',
      proximo_passo: 'Enviar proposta comercial com tabela de descontos em lote.',
      proximo_passo_data: '2026-03-04'
    },
    {
      id: 'hc-002',
      cliente_id: 'cli-001',
      responsavel_id: 'usr-aluno-01',
      usuario_nome: 'Lucas Mendes',
      tipo: 'whatsapp',
      assunto: 'Envio de Proposta Comercial em PDF',
      descricao: 'Enviada proposta #PROP-001 no valor de R$ 750,00 com prazo de entrega de 10 dias.',
      data: '2026-03-04T11:00:00Z',
      proximo_passo: 'Acompanhar decisão até sexta-feira.',
      proximo_passo_data: '2026-03-07'
    },
    {
      id: 'hc-003',
      cliente_id: 'cli-003',
      responsavel_id: 'usr-aluno-01',
      usuario_nome: 'Lucas Mendes',
      tipo: 'ligacao',
      assunto: 'Confirmação de Pedido & Envio de Chave PIX',
      descricao: 'Ligação confirmando a estampa personalizada escolhida. Pagamento realizado via PIX e pedido enviado para produção.',
      data: '2026-03-08T15:30:00Z',
      proximo_passo: 'Entregar o kit no portão da escola na quinta-feira.',
      proximo_passo_data: '2026-03-12'
    }
  ],
  categorias_produto: [
    { id: 'ctp-0001', nome: 'Produtos Ecológicos', descricao: 'Bolsas, ecobags e estojos reutilizáveis' },
    { id: 'ctp-0002', nome: 'Alimentação & Confeitaria', descricao: 'Doces artesanais e sobremesas gourmet' },
    { id: 'ctp-0003', nome: 'Serviços & Personalização', descricao: 'Serviços de customização e design' },
  ],
  produtos: [
    {
      id: 'prod-001',
      equipe_id: 'eq-001',
      codigo_sku: 'ECO-BAG-01',
      nome: 'Ecobag Algodão Cru Personalizada',
      tipo: 'produto',
      categoria: 'Produtos Ecológicos',
      unidade_medida: 'un',
      preco_custo: 12.00,
      preco_venda: 28.00,
      estoque_atual: 45,
      estoque_minimo: 10,
      descricao: 'Ecobag 40x40cm em algodão cru resistente, com estampa silk artesanal e alça reforçada.',
      ativo: true,
      criado_em: '2026-02-25T10:00:00Z'
    },
    {
      id: 'prod-002',
      equipe_id: 'eq-001',
      codigo_sku: 'ECO-EST-02',
      nome: 'Estojo Escolar Sustentável',
      tipo: 'produto',
      categoria: 'Produtos Ecológicos',
      unidade_medida: 'un',
      preco_custo: 6.50,
      preco_venda: 18.00,
      estoque_atual: 30,
      estoque_minimo: 8,
      descricao: 'Estojo com zíper resistente feito com sobras de tecido e forro impermeável.',
      ativo: true,
      criado_em: '2026-02-25T11:00:00Z'
    },
    {
      id: 'prod-003',
      equipe_id: 'eq-002',
      codigo_sku: 'DOC-TRU-01',
      nome: 'Trufa Artesanal Belga (Unidade)',
      tipo: 'produto',
      categoria: 'Alimentação & Confeitaria',
      unidade_medida: 'un',
      preco_custo: 2.20,
      preco_venda: 5.50,
      estoque_atual: 60,
      estoque_minimo: 15,
      descricao: 'Trufa artesanal de chocolate belga nos sabores Brigadeiro, Ninho com Nutella e Maracujá.',
      ativo: true,
      criado_em: '2026-02-25T14:00:00Z'
    },
    {
      id: 'prod-004',
      equipe_id: 'eq-002',
      codigo_sku: 'DOC-COP-02',
      nome: 'Copo da Felicidade Especial',
      tipo: 'produto',
      categoria: 'Alimentação & Confeitaria',
      unidade_medida: 'un',
      preco_custo: 5.80,
      preco_venda: 14.00,
      estoque_atual: 25,
      estoque_minimo: 5,
      descricao: 'Copo de 250ml com camadas de bolo fofinho, brigadeiro de colher, morangos frescos e raspas de chocolate.',
      ativo: true,
      criado_em: '2026-02-25T14:30:00Z'
    }
  ],
  movimentacoes_estoque: [
    { id: 'mov-001', produto_id: 'prod-001', tipo: 'entrada', quantidade: 50, motivo: 'Lote inicial de produção', data: '2026-02-28' },
    { id: 'mov-002', produto_id: 'prod-001', tipo: 'saida', quantidade: 5, motivo: 'Venda balcão / pedidos', data: '2026-03-08' },
    { id: 'mov-003', produto_id: 'prod-003', tipo: 'entrada', quantidade: 80, motivo: 'Produção semanal', data: '2026-03-01' }
  ],
  categorias_custo: [
    { id: 'ctc-0001', nome: 'Matéria-prima & Insumos' },
    { id: 'ctc-0002', nome: 'Embalagem & Etiquetas' },
    { id: 'ctc-0003', nome: 'Divulgação / Marketing' },
    { id: 'ctc-0004', nome: 'Transporte / Logística' },
    { id: 'ctc-0005', nome: 'Equipamentos e Ferramentas' },
    { id: 'ctc-0006', nome: 'Taxas e Impostos' },
    { id: 'ctc-0007', nome: 'Outros Custos' },
  ],
  custos: [
    {
      id: 'cst-001',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-001',
      descricao: 'Tecido Algodão Cru (Rolo de 20 metros)',
      categoria: 'Matéria-prima & Insumos',
      tipo_custo: 'variavel',
      valor: 180.00,
      quantidade: 1,
      total: 180.00,
      data_vencimento: '2026-02-22',
      data_pagamento: '2026-02-22',
      situacao: 'pago',
      fornecedor: 'Tecidos & Cia Brás',
      criado_em: '2026-02-22T10:00:00Z'
    },
    {
      id: 'cst-002',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-001',
      descricao: 'Tintas de Silk Screen & Telas de Impressão',
      categoria: 'Equipamentos e Ferramentas',
      tipo_custo: 'fixo',
      valor: 85.00,
      quantidade: 1,
      total: 85.00,
      data_vencimento: '2026-02-24',
      data_pagamento: '2026-02-24',
      situacao: 'pago',
      fornecedor: 'Serigrafia Central',
      criado_em: '2026-02-24T14:00:00Z'
    },
    {
      id: 'cst-003',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-002',
      descricao: 'Barra de Chocolate Belga 1kg + Leite Condensado',
      categoria: 'Matéria-prima & Insumos',
      tipo_custo: 'variavel',
      valor: 110.00,
      quantidade: 2,
      total: 220.00,
      data_vencimento: '2026-03-01',
      data_pagamento: '2026-03-01',
      situacao: 'pago',
      fornecedor: 'Distribuidora Doce Sabor',
      criado_em: '2026-03-01T09:00:00Z'
    }
  ],
  vendas: [
    {
      id: 'vnd-001',
      numero: 'PED-2026-001',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-001',
      cliente_id: 'cli-003',
      data: '2026-03-08',
      situacao: 'paga',
      forma_pagamento: 'pix',
      desconto: 0.00,
      valor_total: 56.00,
      valor_liquido: 56.00,
      observacoes: '2 Ecobags de Algodão Cru entregues e pagas via PIX.',
      criado_em: '2026-03-08T16:10:00Z'
    },
    {
      id: 'vnd-002',
      numero: 'PED-2026-002',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-002',
      cliente_id: 'cli-004',
      data: '2026-03-11',
      situacao: 'pendente',
      forma_pagamento: 'cartao_credito',
      desconto: 10.00,
      valor_total: 130.00,
      valor_liquido: 120.00,
      observacoes: 'Encomenda de 20 Trufas + 2 Copos da Felicidade para entrega na sexta.',
      criado_em: '2026-03-11T11:00:00Z'
    }
  ],
  itens_venda: [
    { id: 'itv-001', venda_id: 'vnd-001', produto_id: 'prod-001', quantidade: 2, preco_unitario: 28.00, desconto: 0, subtotal: 56.00 },
    { id: 'itv-002', venda_id: 'vnd-002', produto_id: 'prod-003', quantidade: 20, preco_unitario: 5.50, desconto: 0, subtotal: 110.00 },
    { id: 'itv-003', venda_id: 'vnd-002', produto_id: 'prod-004', quantidade: 2, preco_unitario: 14.00, desconto: 10.00, subtotal: 18.00 }
  ],
  recebimentos: [
    {
      id: 'rec-001',
      venda_id: 'vnd-001',
      cliente_nome: 'Fernanda Nogueira (Mãe de Aluno)',
      data: '2026-03-08',
      valor: 56.00,
      forma_pagamento: 'pix',
      usuario_nome: 'Lucas Mendes',
      criado_em: '2026-03-08T16:15:00Z'
    }
  ],
  registros_pedagogicos: [
    {
      id: 'reg-ped-001',
      projeto_id: 'prj-2026-01',
      equipe_id: 'eq-001',
      autor_nome: 'Professora Tamiris',
      tipo: 'avaliacao_competencia',
      titulo: 'Avaliação de Pitch Comercial & Abordagem B2B',
      competencias: {
        'Comunicação & Abordagem Comercial': 5,
        'Organização do Pipeline & CRM': 5,
        'Gestão Financeira & Precificação': 4,
        'Trabalho em Equipe & Proatividade': 5
      },
      nota_media: 4.75,
      feedback: 'A equipe demonstrou excelente desenvoltura comercial na reunião com a Dra. Mariana. O cálculo da margem de contribuição foi bem estruturado. Próximo desafio: agilizar o envio das propostas.',
      data: '2026-03-06'
    }
  ]
};

const DEMO_DATA = INITIAL_DATA;
const USERS = {};

// ─── Engine de Query ─────────────────────────────────────────────────────────────────────────────
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let _dbData = null;
function getDb() {
  if (!_dbData) {
    try {
      const stored = localStorage.getItem('crm_escolar_db');
      _dbData = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(DEMO_DATA));
    } catch(e) {
      _dbData = JSON.parse(JSON.stringify(DEMO_DATA));
    }
    if (!_dbData) _dbData = JSON.parse(JSON.stringify(DEMO_DATA));
    for (const table of Object.keys(DEMO_DATA)) {
      if (!_dbData[table]) _dbData[table] = [];
    }
  }
  return _dbData;
}

function persist() {
  try { localStorage.setItem('crm_escolar_db', JSON.stringify(getDb())); }
  catch(e) { console.warn('Erro ao persistir:', e); }
}

class MockQuery {
  constructor(tableName) {
    this._table = tableName;
    this._mode = 'select';
    this._filters = [];
    this._orderCol = null;
    this._orderAsc = true;
    this._limitN = null;
    this._isSingle = false;
    this._insertData = null;
    this._updateData = null;
  }

  eq(col, val)          { this._filters.push({ type:'eq',    col, val });             return this; }
  neq(col, val)         { this._filters.push({ type:'neq',   col, val });             return this; }
  in(col, vals)         { this._filters.push({ type:'in',    col, vals });            return this; }
  gte(col, val)         { this._filters.push({ type:'gte',   col, val });             return this; }
  lte(col, val)         { this._filters.push({ type:'lte',   col, val });             return this; }
  gt(col, val)          { this._filters.push({ type:'gt',    col, val });             return this; }
  lt(col, val)          { this._filters.push({ type:'lt',    col, val });             return this; }
  like(col, pat)        { this._filters.push({ type:'like',  col, pattern:pat });     return this; }
  ilike(col, pat)       { this._filters.push({ type:'ilike', col, pattern:pat });     return this; }
  is(col, val)          { this._filters.push({ type:'is',    col, val });             return this; }
  not(col, op, val)     { this._filters.push({ type:'not',   col, val });             return this; }
  contains(col, val)    { this._filters.push({ type:'ilike', col, pattern:`%${val}%` }); return this; }
  select(cols)          { return this; }
  order(col, opts={})   { this._orderCol=col; this._orderAsc=opts.ascending!==false;  return this; }
  limit(n)              { this._limitN=n;                                              return this; }
  single()              { this._isSingle=true;                                        return this; }

  insert(data) { this._mode='insert'; this._insertData=data; return this; }
  update(data) { this._mode='update'; this._updateData=data; return this; }
  delete()     { this._mode='delete';                        return this; }

  then(resolve, reject) {
    return Promise.resolve(this._execute()).then(resolve, reject);
  }

  _applyFilters(rows) {
    return rows.filter(row => this._filters.every(f => {
      const v = row[f.col];
      const s = x => String(x??'').toLowerCase();
      const pat = f.pattern ? f.pattern.replace(/%/g,'') : '';
      switch(f.type) {
        case 'eq':    return v == f.val;
        case 'neq':   return v != f.val;
        case 'in':    return (f.vals||[]).includes(v);
        case 'gte':   return v != null && v >= f.val;
        case 'lte':   return v != null && v <= f.val;
        case 'gt':    return v != null && v > f.val;
        case 'lt':    return v != null && v < f.val;
        case 'like':  return s(v).includes(s(pat));
        case 'ilike': return s(v).includes(s(pat));
        case 'is':    return f.val===null ? v==null : v===f.val;
        case 'not':   return v !== f.val;
        default:      return true;
      }
    }));
  }

  _execute() {
    const db = getDb();
    try {
      if (this._mode==='insert') {
        const arr = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
        db[this._table] = db[this._table] || [];
        const inserted = arr.map(r => {
          const row = { id: generateId(), criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...r };
          db[this._table].push(row);
          return row;
        });
        persist();
        return { data: Array.isArray(this._insertData) ? inserted : inserted[0], error: null };
      }
      if (this._mode==='update') {
        const rows = db[this._table] || [];
        const updated = [];
        for (let i=0; i<rows.length; i++) {
          if (this._applyFilters([rows[i]]).length > 0) {
            rows[i] = { ...rows[i], ...this._updateData, atualizado_em: new Date().toISOString() };
            updated.push(rows[i]);
          }
        }
        persist();
        return { data: updated, error: null };
      }
      if (this._mode==='delete') {
        const rows = db[this._table] || [];
        const del = this._applyFilters(rows);
        db[this._table] = rows.filter(r => !del.includes(r));
        persist();
        return { data: del, error: null };
      }
      // SELECT
      let rows = [...(db[this._table] || [])];
      rows = this._applyFilters(rows);
      if (this._orderCol) {
        rows.sort((a,b) => {
          const av=a[this._orderCol], bv=b[this._orderCol];
          if(av<bv) return this._orderAsc?-1:1;
          if(av>bv) return this._orderAsc?1:-1;
          return 0;
        });
      }
      if (this._limitN) rows = rows.slice(0, this._limitN);
      if (this._isSingle) return { data: rows[0]||null, error: rows.length===0?{message:'Não encontrado'}:null };
      return { data: rows, error: null };
    } catch(e) {
      console.error('MockQuery error:', e);
      return { data: null, error: { message: e.message } };
    }
  }
}

export const supabaseMock = {
  from(t) { return new MockQuery(t); },
  resetDemoData() { _dbData = JSON.parse(JSON.stringify(DEMO_DATA)); persist(); },
  getData(t) { return getDb()[t] || []; },
};

export const supabaseAuth = {
  signInWithOAuth: async ({ provider, options = {} }) => {
    const db = getDb();
    const email = options.email || (options.data && options.data.email) || 'usuario.google@escola.edu';
    const nome = options.nome || (options.data && options.data.full_name) || (options.data && options.data.name) || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const avatar_url = options.avatar_url || (options.data && options.data.avatar_url) || null;

    let profile = (db.profiles || []).find(p => p.email.toLowerCase() === email.toLowerCase());

    if (!profile) {
      profile = {
        id: 'usr-goo-' + Date.now().toString(36),
        nome: nome || 'Administrador Google',
        email: email,
        perfil: 'administrador',
        avatar_url: avatar_url,
        ativo: true,
        provider: 'google',
        criado_em: new Date().toISOString()
      };
      db.profiles = db.profiles || [];
      db.profiles.push(profile);
      persist();
    } else {
      // Garantir que todos são administrador
      profile.perfil = 'administrador';
      if (avatar_url) profile.avatar_url = avatar_url;
      profile.provider = 'google';
      persist();
    }

    const session = {
      user: {
        id: profile.id,
        email: profile.email,
        user_metadata: { full_name: profile.nome, avatar_url: profile.avatar_url }
      },
      profile,
      provider: 'google',
      expires_at: Date.now() + 86400000
    };

    localStorage.setItem('crm_session', JSON.stringify(session));
    localStorage.setItem('user_profile', JSON.stringify(profile));
    return { data: { session, user: session.user }, error: null };
  },

  signInWithPassword: async ({ email, password }) => {
    const u = USERS[email];
    const db = getDb();
    let profile = (db.profiles || []).find(p => p.email.toLowerCase() === email.toLowerCase());

    if (!profile && (!u || u.password !== password)) {
      // Se for uma conta não pré-cadastrada no demo, cria automaticamente com privilégios de Administrador
      profile = {
        id: 'usr-' + Date.now().toString(36),
        nome: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        perfil: 'administrador',
        ativo: true,
        criado_em: new Date().toISOString()
      };
      db.profiles = db.profiles || [];
      db.profiles.push(profile);
      persist();
    } else if (!profile && u) {
      profile = (db.profiles || []).find(p => p.id === u.profile_id);
    }

    if (!profile || !profile.ativo) {
      return { data: null, error: { message: 'Usuário inativo ou não encontrado.' } };
    }

    // Todos são Administrador
    profile.perfil = 'administrador';

    const session = {
      user: { id: profile.id, email: profile.email },
      profile,
      expires_at: Date.now() + 86400000
    };

    localStorage.setItem('crm_session', JSON.stringify(session));
    localStorage.setItem('user_profile', JSON.stringify(profile));
    return { data: { session, user: session.user }, error: null };
  },

  signOut: async () => {
    localStorage.removeItem('crm_session');
    localStorage.removeItem('user_profile');
    _dbData = null;
    return { error: null };
  },

  getSession: () => {
    try {
      const s = localStorage.getItem('crm_session');
      if (!s) return { data: { session: null }, error: null };
      const session = JSON.parse(s);
      if (session.expires_at < Date.now()) {
        localStorage.removeItem('crm_session');
        return { data: { session: null }, error: null };
      }
      if (session.profile) {
        session.profile.perfil = 'administrador'; // Enforce admin
      }
      return { data: { session }, error: null };
    } catch(e) {
      return { data: { session: null }, error: null };
    }
  },

  getUser: () => {
    try {
      const p = localStorage.getItem('user_profile');
      if (!p) return { data: { user: null }, error: null };
      const profile = JSON.parse(p);
      profile.perfil = 'administrador'; // Enforce admin
      return { data: { user: profile }, error: null };
    } catch(e) {
      return { data: { user: null }, error: null };
    }
  }
};

export { DEMO_DATA, USERS };
