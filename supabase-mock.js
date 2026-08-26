// supabase-mock.js — Mock completo do Supabase para o CRM Escolar
// Persiste dados no localStorage. Inicializa com dados de demonstração.

// ─── IDs fixos para os dados de demo ────────────────────────────────────────────
const ID = {
  ADMIN: 'usr-adm-0001',
  PROF:  'usr-prf-0001',
  EST1:  'usr-est-0001',
  EST2:  'usr-est-0002',
  CONS:  'usr-con-0001',
  PROJ: 'prj-0001',
  EQ1: 'eqp-0001',
  EQ2: 'eqp-0002',
  CL: (n) => `cli-${String(n).padStart(4,'0')}`,
  P1: 'prd-0001', P2: 'prd-0002', P3: 'prd-0003', P4: 'prd-0004',
  CAT_P1: 'ctp-0001', CAT_P2: 'ctp-0002',
  CAT_C1: 'ctc-0001', CAT_C2: 'ctc-0002', CAT_C3: 'ctc-0003',
  CAT_C4: 'ctc-0004', CAT_C5: 'ctc-0005', CAT_C6: 'ctc-0006', CAT_C7: 'ctc-0007',
  V: (n) => `vnd-${String(n).padStart(4,'0')}`,
};

const USERS = {
  'admin@escola.edu':    { password: 'admin123', profile_id: 'usr-adm-0001' },
  'prof@escola.edu':     { password: 'prof123',  profile_id: 'usr-prf-0001' },
  'ecos@escola.edu':     { password: 'est123',   profile_id: 'usr-est-0001' },
  'horta@escola.edu':    { password: 'est123',   profile_id: 'usr-est-0002' },
  'consulta@escola.edu': { password: 'cons123',  profile_id: 'usr-con-0001' },
};

const DEMO_DATA = {
  profiles: [
    { id: 'usr-adm-0001', nome: 'Ana Administradora',   email: 'admin@escola.edu',    perfil: 'administrador', ativo: true, criado_em: '2025-01-10T08:00:00Z' },
    { id: 'usr-prf-0001', nome: 'Prof. Carlos Mendes',  email: 'prof@escola.edu',     perfil: 'professor',     ativo: true, criado_em: '2025-01-12T08:00:00Z' },
    { id: 'usr-est-0001', nome: 'Beatriz Oliveira',     email: 'ecos@escola.edu',     perfil: 'estudante',     ativo: true, criado_em: '2025-02-01T08:00:00Z' },
    { id: 'usr-est-0002', nome: 'Diego Ferreira',       email: 'horta@escola.edu',    perfil: 'estudante',     ativo: true, criado_em: '2025-02-01T08:00:00Z' },
    { id: 'usr-con-0001', nome: 'Fernanda Consulta',    email: 'consulta@escola.edu', perfil: 'consulta',      ativo: true, criado_em: '2025-02-05T08:00:00Z' },
  ],

  projetos: [
    { id: 'prj-0001', nome: 'Feira de Negócios 2025 — 3º Ano B', descricao: 'Projeto anual de empreendedorismo onde as equipes criam, produzem e comercializam produtos e serviços.', turma: '3º Ano B', ano_letivo: '2025', periodo_inicio: '2025-02-01', periodo_fim: '2025-11-30', meta_vendas: 100, meta_faturamento: 5000.00, situacao: 'comercializacao', criado_por: 'usr-adm-0001', criado_em: '2025-01-20T08:00:00Z', atualizado_em: '2025-02-01T08:00:00Z', is_demo: true }
  ],

  projeto_professores: [
    { id: 'pp-0001', projeto_id: 'prj-0001', professor_id: 'usr-prf-0001' }
  ],

  projeto_disciplinas: [
    { id: 'pd-0001', projeto_id: 'prj-0001', nome_disciplina: 'Matemática Financeira' },
    { id: 'pd-0002', projeto_id: 'prj-0001', nome_disciplina: 'Língua Portuguesa' },
    { id: 'pd-0003', projeto_id: 'prj-0001', nome_disciplina: 'Educação Empreendedora' },
    { id: 'pd-0004', projeto_id: 'prj-0001', nome_disciplina: 'Gestão e Negócios' },
  ],

  equipes: [
    { id: 'eqp-0001', projeto_id: 'prj-0001', nome: 'Eco Bags', descricao: 'Produção e venda de bolsas reutilizáveis sustentáveis.', produto_servico: 'Bolsas ecológicas artesanais', orientador_id: 'usr-prf-0001', ativa: true, criado_em: '2025-02-05T08:00:00Z', is_demo: true },
    { id: 'eqp-0002', projeto_id: 'prj-0001', nome: 'Sabor da Horta', descricao: 'Alimentos naturais e orgânicos produzidos na horta escolar.', produto_servico: 'Geleias e bolos artesanais', orientador_id: 'usr-prf-0001', ativa: true, criado_em: '2025-02-05T08:00:00Z', is_demo: true },
  ],

  equipe_membros: [
    { id: 'em-0001', equipe_id: 'eqp-0001', estudante_id: 'usr-est-0001', funcao: 'Gerente de Vendas' },
    { id: 'em-0002', equipe_id: 'eqp-0002', estudante_id: 'usr-est-0002', funcao: 'Marketing e Comunicação' },
  ],

  clientes: [
    { id: 'cli-0001', projeto_id: 'prj-0001', equipe_id: 'eqp-0001', nome: 'João Carlos Silva',     email: 'joao.silva@email.com',    telefone: '(11) 98765-4321', tipo: 'familiar',    origem_contato: 'Indicação',            interesse: 'Eco Bags para presentes',        etapa_comercial: 'venda_concluida', responsavel_id: 'usr-est-0001', observacoes: 'Comprou 3 bags para a família.', ativo: true, criado_em: '2025-03-10T09:00:00Z', is_demo: true },
    { id: 'cli-0002', projeto_id: 'prj-0001', equipe_id: 'eqp-0001', nome: 'Maria Aparecida Santos', email: 'maria.santos@email.com',  telefone: '(11) 97654-3210', tipo: 'funcionario', origem_contato: 'Abordagem na escola',   interesse: 'Eco Bag estampada',              etapa_comercial: 'interessado',    responsavel_id: 'usr-est-0001', observacoes: 'Professora de história. Quer bag personalizada.', ativo: true, criado_em: '2025-03-12T10:00:00Z', is_demo: true },
    { id: 'cli-0003', projeto_id: 'prj-0001', equipe_id: 'eqp-0001', nome: 'Pedro Alves Rodrigues',  email: '',                        telefone: '(11) 96543-2109', tipo: 'estudante',   origem_contato: 'Redes Sociais',          interesse: 'Compra para revender',           etapa_comercial: 'negociacao',     responsavel_id: 'usr-est-0001', observacoes: 'Colega de outra turma. Quer comprar 10 unidades.', ativo: true, criado_em: '2025-03-15T11:00:00Z', is_demo: true },
    { id: 'cli-0004', projeto_id: 'prj-0001', equipe_id: 'eqp-0001', nome: 'Lúcia Helena Moreira',   email: 'lucia.moreira@email.com', telefone: '(11) 95432-1098', tipo: 'comunidade',  origem_contato: 'Feira do bairro',        interesse: 'Eco Bags a granel',             etapa_comercial: 'proposta',       responsavel_id: 'usr-est-0001', observacoes: 'Representa associação de moradores.', ativo: true, criado_em: '2025-04-01T09:00:00Z', is_demo: true },
    { id: 'cli-0005', projeto_id: 'prj-0001', equipe_id: 'eqp-0001', nome: 'Roberto Costa Neves',    email: 'roberto.neves@email.com', telefone: '(11) 94321-0987', tipo: 'organizacao', origem_contato: 'Contato direto',         interesse: 'Parceria comercial',             etapa_comercial: 'desistencia',    responsavel_id: 'usr-est-0001', observacoes: 'Orçamento acima do esperado.', ativo: true, criado_em: '2025-04-05T10:00:00Z', is_demo: true },
    { id: 'cli-0006', projeto_id: 'prj-0001', equipe_id: 'eqp-0002', nome: 'Camila Ferreira Lima',   email: 'camila.lima@email.com',   telefone: '(11) 93210-9876', tipo: 'familiar',    origem_contato: 'WhatsApp',               interesse: 'Geleia de morango',              etapa_comercial: 'venda_concluida', responsavel_id: 'usr-est-0002', observacoes: 'Compra regularmente.', ativo: true, criado_em: '2025-03-20T09:00:00Z', is_demo: true },
    { id: 'cli-0007', projeto_id: 'prj-0001', equipe_id: 'eqp-0002', nome: 'André Luiz Pereira',    email: 'andre.pereira@email.com', telefone: '(11) 92109-8765', tipo: 'funcionario', origem_contato: 'Cantina da escola',      interesse: 'Bolos para revenda',             etapa_comercial: 'interessado',    responsavel_id: 'usr-est-0002', observacoes: 'Cantineiro. Pode ser parceiro.', ativo: true, criado_em: '2025-04-02T10:00:00Z', is_demo: true },
    { id: 'cli-0008', projeto_id: 'prj-0001', equipe_id: 'eqp-0002', nome: 'Juliana Martins Souza',  email: 'juliana.souza@email.com', telefone: '(11) 91098-7654', tipo: 'estudante',   origem_contato: 'Evento escolar',         interesse: 'Bolo integral para lanche',      etapa_comercial: 'proposta',       responsavel_id: 'usr-est-0002', observacoes: 'Atleta da escola, foco em alimentação saudável.', ativo: true, criado_em: '2025-04-10T11:00:00Z', is_demo: true },
    { id: 'cli-0009', projeto_id: 'prj-0001', equipe_id: 'eqp-0002', nome: 'Felipe Nascimento Cruz', email: 'felipe.cruz@email.com',   telefone: '(11) 90987-6543', tipo: 'comunidade',  origem_contato: 'Boca a boca',            interesse: 'Geleias para presente',          etapa_comercial: 'negociacao',     responsavel_id: 'usr-est-0002', observacoes: 'Quer uma cesta com 6 potes.', ativo: true, criado_em: '2025-04-15T09:00:00Z', is_demo: true },
    { id: 'cli-0010', projeto_id: 'prj-0001', equipe_id: 'eqp-0002', nome: 'Tatiana Albuquerque',   email: 'tatiana.alb@email.com',   telefone: '(11) 89876-5432', tipo: 'organizacao', origem_contato: 'Instagram',              interesse: 'Geleia para cesta de natal',     etapa_comercial: 'novo_contato',   responsavel_id: 'usr-est-0002', observacoes: 'Empresa de cestas personalizadas.', ativo: true, criado_em: '2025-05-01T10:00:00Z', is_demo: true },
  ],

  historico_contatos: [
    { id: 'hc-0001', cliente_id: 'cli-0001', data: '2025-03-10', descricao: 'Primeiro contato via WhatsApp. Cliente demonstrou interesse em 3 bags simples.', responsavel_id: 'usr-est-0001', criado_em: '2025-03-10T09:30:00Z' },
    { id: 'hc-0002', cliente_id: 'cli-0001', data: '2025-03-15', descricao: 'Venda confirmada. Pagamento feito em dinheiro.', responsavel_id: 'usr-est-0001', criado_em: '2025-03-15T14:00:00Z' },
    { id: 'hc-0003', cliente_id: 'cli-0002', data: '2025-03-12', descricao: 'Abordagem no corredor da escola. Professora pediu orçamento de bag personalizada.', responsavel_id: 'usr-est-0001', criado_em: '2025-03-12T10:15:00Z' },
    { id: 'hc-0004', cliente_id: 'cli-0006', data: '2025-03-20', descricao: 'Pedido via WhatsApp. Cliente quer 2 potes de geleia de morango.', responsavel_id: 'usr-est-0002', criado_em: '2025-03-20T09:00:00Z' },
    { id: 'hc-0005', cliente_id: 'cli-0007', data: '2025-04-02', descricao: 'Conversa na cantina. André está interessado em revender nossos bolos.', responsavel_id: 'usr-est-0002', criado_em: '2025-04-02T11:00:00Z' },
  ],

  categorias_produto: [
    { id: 'ctp-0001', projeto_id: 'prj-0001', nome: 'Acessórios Sustentáveis', descricao: 'Bolsas e acessórios ecológicos', criado_em: '2025-02-01T08:00:00Z' },
    { id: 'ctp-0002', projeto_id: 'prj-0001', nome: 'Alimentos Naturais',       descricao: 'Alimentos artesanais e orgânicos', criado_em: '2025-02-01T08:00:00Z' },
  ],

  produtos: [
    { id: 'prd-0001', equipe_id: 'eqp-0001', categoria_id: 'ctp-0001', nome: 'Eco Bag Simples',          descricao: 'Bolsa de algodão cru reutilizável, resistente e durável.',             tipo: 'produto', custo_estimado: 5.00,  preco_venda: 15.00, quantidade_produzida: 30, estoque_disponivel: 18, estoque_minimo: 5,  ativo: true, imagem_url: null, criado_em: '2025-02-20T08:00:00Z', is_demo: true },
    { id: 'prd-0002', equipe_id: 'eqp-0001', categoria_id: 'ctp-0001', nome: 'Eco Bag Estampada',         descricao: 'Bolsa de algodão com estampas exclusivas feitas à mão.',               tipo: 'produto', custo_estimado: 8.00,  preco_venda: 25.00, quantidade_produzida: 20, estoque_disponivel: 12, estoque_minimo: 3,  ativo: true, imagem_url: null, criado_em: '2025-02-20T08:00:00Z', is_demo: true },
    { id: 'prd-0003', equipe_id: 'eqp-0002', categoria_id: 'ctp-0002', nome: 'Geleia de Morango (220g)', descricao: 'Geleia artesanal de morango orgânico, sem conservantes.',             tipo: 'produto', custo_estimado: 4.50,  preco_venda: 12.00, quantidade_produzida: 40, estoque_disponivel: 28, estoque_minimo: 10, ativo: true, imagem_url: null, criado_em: '2025-02-22T08:00:00Z', is_demo: true },
    { id: 'prd-0004', equipe_id: 'eqp-0002', categoria_id: 'ctp-0002', nome: 'Bolo Integral de Cenoura', descricao: 'Bolo saudável com farinha integral e cenoura orgânica. Sem açúcar.',tipo: 'produto', custo_estimado: 6.00,  preco_venda: 18.00, quantidade_produzida: 15, estoque_disponivel: 2,  estoque_minimo: 5,  ativo: true, imagem_url: null, criado_em: '2025-02-22T08:00:00Z', is_demo: true },
  ],

  movimentacoes_estoque: [
    { id: 'me-0001', produto_id: 'prd-0001', tipo: 'saida', quantidade: 6,  motivo: 'Venda VND-0001', venda_id: 'vnd-0001', usuario_id: 'usr-est-0001', criado_em: '2025-04-10T10:00:00Z' },
    { id: 'me-0002', produto_id: 'prd-0002', tipo: 'saida', quantidade: 2,  motivo: 'Venda VND-0002', venda_id: 'vnd-0002', usuario_id: 'usr-est-0001', criado_em: '2025-04-15T11:00:00Z' },
    { id: 'me-0003', produto_id: 'prd-0003', tipo: 'saida', quantidade: 4,  motivo: 'Venda VND-0003', venda_id: 'vnd-0003', usuario_id: 'usr-est-0002', criado_em: '2025-04-18T14:00:00Z' },
    { id: 'me-0004', produto_id: 'prd-0004', tipo: 'saida', quantidade: 3,  motivo: 'Venda VND-0004', venda_id: 'vnd-0004', usuario_id: 'usr-est-0002', criado_em: '2025-04-20T15:00:00Z' },
    { id: 'me-0005', produto_id: 'prd-0001', tipo: 'saida', quantidade: 6,  motivo: 'Venda VND-0005', venda_id: 'vnd-0005', usuario_id: 'usr-est-0001', criado_em: '2025-05-02T10:00:00Z' },
    { id: 'me-0006', produto_id: 'prd-0003', tipo: 'saida', quantidade: 8,  motivo: 'Venda VND-0006', venda_id: 'vnd-0006', usuario_id: 'usr-est-0002', criado_em: '2025-05-10T11:00:00Z' },
  ],

  categorias_custo: [
    { id: 'ctc-0001', nome: 'Matéria-prima', projeto_id: 'prj-0001', criado_em: '2025-02-01T08:00:00Z' },
    { id: 'ctc-0002', nome: 'Embalagem',     projeto_id: 'prj-0001', criado_em: '2025-02-01T08:00:00Z' },
    { id: 'ctc-0003', nome: 'Divulgação',   projeto_id: 'prj-0001', criado_em: '2025-02-01T08:00:00Z' },
    { id: 'ctc-0004', nome: 'Transporte',    projeto_id: 'prj-0001', criado_em: '2025-02-01T08:00:00Z' },
    { id: 'ctc-0005', nome: 'Equipamentos',  projeto_id: 'prj-0001', criado_em: '2025-02-01T08:00:00Z' },
    { id: 'ctc-0006', nome: 'Taxas',         projeto_id: 'prj-0001', criado_em: '2025-02-01T08:00:00Z' },
    { id: 'ctc-0007', nome: 'Outros',        projeto_id: 'prj-0001', criado_em: '2025-02-01T08:00:00Z' },
  ],

  custos: [
    { id: 'cst-0001', descricao: 'Tecido de algodão cru para Eco Bags',           categoria_id: 'ctc-0001', tipo_custo: 'variavel', valor: 12.00, quantidade: 20, data: '2025-02-15', fornecedor: 'Tecidão Distribuidora',     equipe_id: 'eqp-0001', projeto_id: 'prj-0001', forma_pagamento: 'pix',            situacao: 'pago',     comprovante_url: null, criado_por: 'usr-est-0001', criado_em: '2025-02-15T10:00:00Z', atualizado_em: '2025-02-16T09:00:00Z', is_demo: true },
    { id: 'cst-0002', descricao: 'Embalagem kraft e tags',                         categoria_id: 'ctc-0002', tipo_custo: 'variavel', valor: 0.50,  quantidade: 100, data: '2025-02-18', fornecedor: 'Embalagens Criativas', equipe_id: 'eqp-0001', projeto_id: 'prj-0001', forma_pagamento: 'dinheiro',       situacao: 'pago',     comprovante_url: null, criado_por: 'usr-est-0001', criado_em: '2025-02-18T10:00:00Z', atualizado_em: '2025-02-18T10:00:00Z', is_demo: true },
    { id: 'cst-0003', descricao: 'Impulsionamento Instagram — Eco Bags',           categoria_id: 'ctc-0003', tipo_custo: 'fixo',    valor: 80.00, quantidade: 1,  data: '2025-03-05', fornecedor: 'Meta Ads',             equipe_id: 'eqp-0001', projeto_id: 'prj-0001', forma_pagamento: 'cartao_credito', situacao: 'pago',     comprovante_url: null, criado_por: 'usr-est-0001', criado_em: '2025-03-05T10:00:00Z', atualizado_em: '2025-03-05T10:00:00Z', is_demo: true },
    { id: 'cst-0004', descricao: 'Ingredientes para geleias (morango, açúcar)',   categoria_id: 'ctc-0001', tipo_custo: 'variavel', valor: 85.00, quantidade: 1,  data: '2025-02-20', fornecedor: 'Mercado Orgânico',     equipe_id: 'eqp-0002', projeto_id: 'prj-0001', forma_pagamento: 'dinheiro',       situacao: 'pago',     comprovante_url: null, criado_por: 'usr-est-0002', criado_em: '2025-02-20T10:00:00Z', atualizado_em: '2025-02-20T10:00:00Z', is_demo: true },
    { id: 'cst-0005', descricao: 'Potes de vidro e tampas (cx c/50)',               categoria_id: 'ctc-0002', tipo_custo: 'variavel', valor: 45.00, quantidade: 1,  data: '2025-02-22', fornecedor: 'Vidropotes Ltda',      equipe_id: 'eqp-0002', projeto_id: 'prj-0001', forma_pagamento: 'pix',            situacao: 'pago',     comprovante_url: null, criado_por: 'usr-est-0002', criado_em: '2025-02-22T10:00:00Z', atualizado_em: '2025-02-22T10:00:00Z', is_demo: true },
    { id: 'cst-0006', descricao: 'Aluguel de barraca para a Feira',                 categoria_id: 'ctc-0004', tipo_custo: 'fixo',    valor: 50.00, quantidade: 1,  data: '2025-05-20', fornecedor: 'Organização da Feira', equipe_id: null,       projeto_id: 'prj-0001', forma_pagamento: 'pix',            situacao: 'previsto', comprovante_url: null, criado_por: 'usr-prf-0001', criado_em: '2025-05-01T10:00:00Z', atualizado_em: '2025-05-01T10:00:00Z', is_demo: true },
    { id: 'cst-0007', descricao: 'Impressão de banner 2x1m',                       categoria_id: 'ctc-0003', tipo_custo: 'fixo',    valor: 35.00, quantidade: 1,  data: '2025-05-15', fornecedor: 'Gráfica Rápida',       equipe_id: null,       projeto_id: 'prj-0001', forma_pagamento: 'dinheiro',       situacao: 'previsto', comprovante_url: null, criado_por: 'usr-prf-0001', criado_em: '2025-05-01T10:00:00Z', atualizado_em: '2025-05-01T10:00:00Z', is_demo: true },
    { id: 'cst-0008', descricao: 'Ingredientes para bolos (farinha, ovos, cenoura)',categoria_id: 'ctc-0001', tipo_custo: 'variavel', valor: 60.00, quantidade: 1,  data: '2025-03-01', fornecedor: 'Supermercado Bom Preço', equipe_id: 'eqp-0002', projeto_id: 'prj-0001', forma_pagamento: 'dinheiro',       situacao: 'pago',     comprovante_url: null, criado_por: 'usr-est-0002', criado_em: '2025-03-01T10:00:00Z', atualizado_em: '2025-03-01T10:00:00Z', is_demo: true },
  ],

  vendas: [
    { id: 'vnd-0001', numero: 'VND-0001', data: '2025-04-10', cliente_id: 'cli-0001', equipe_id: 'eqp-0001', vendedor_id: 'usr-est-0001', desconto: 0,  forma_pagamento: 'dinheiro',      situacao: 'paga',              observacoes: 'Cliente da família. Compra recorrente.',             criado_por: 'usr-est-0001', criado_em: '2025-04-10T10:00:00Z', atualizado_em: '2025-04-10T10:30:00Z', is_demo: true },
    { id: 'vnd-0002', numero: 'VND-0002', data: '2025-04-15', cliente_id: 'cli-0002', equipe_id: 'eqp-0001', vendedor_id: 'usr-est-0001', desconto: 5,  forma_pagamento: 'pix',           situacao: 'paga',              observacoes: 'Desconto concedido por ser professora.',              criado_por: 'usr-est-0001', criado_em: '2025-04-15T11:00:00Z', atualizado_em: '2025-04-15T12:00:00Z', is_demo: true },
    { id: 'vnd-0003', numero: 'VND-0003', data: '2025-04-18', cliente_id: 'cli-0006', equipe_id: 'eqp-0002', vendedor_id: 'usr-est-0002', desconto: 0,  forma_pagamento: 'pix',           situacao: 'paga',              observacoes: '',                                                    criado_por: 'usr-est-0002', criado_em: '2025-04-18T14:00:00Z', atualizado_em: '2025-04-18T14:30:00Z', is_demo: true },
    { id: 'vnd-0004', numero: 'VND-0004', data: '2025-04-20', cliente_id: 'cli-0007', equipe_id: 'eqp-0002', vendedor_id: 'usr-est-0002', desconto: 0,  forma_pagamento: 'dinheiro',      situacao: 'parcialmente_paga', observacoes: 'Pagamento parcelado em 2x.',                           criado_por: 'usr-est-0002', criado_em: '2025-04-20T15:00:00Z', atualizado_em: '2025-04-20T15:30:00Z', is_demo: true },
    { id: 'vnd-0005', numero: 'VND-0005', data: '2025-05-02', cliente_id: 'cli-0003', equipe_id: 'eqp-0001', vendedor_id: 'usr-est-0001', desconto: 15, forma_pagamento: 'cartao_debito', situacao: 'parcialmente_paga', observacoes: 'Compra em quantidade. Desconto negociado.',            criado_por: 'usr-est-0001', criado_em: '2025-05-02T10:00:00Z', atualizado_em: '2025-05-02T10:30:00Z', is_demo: true },
    { id: 'vnd-0006', numero: 'VND-0006', data: '2025-05-10', cliente_id: 'cli-0009', equipe_id: 'eqp-0002', vendedor_id: 'usr-est-0002', desconto: 0,  forma_pagamento: 'pix',           situacao: 'pendente',          observacoes: 'Aguardando confirmação do cliente.',                  criado_por: 'usr-est-0002', criado_em: '2025-05-10T11:00:00Z', atualizado_em: '2025-05-10T11:00:00Z', is_demo: true },
    { id: 'vnd-0007', numero: 'VND-0007', data: '2025-05-15', cliente_id: 'cli-0004', equipe_id: 'eqp-0001', vendedor_id: 'usr-est-0001', desconto: 0,  forma_pagamento: 'pix',           situacao: 'orcamento',         observacoes: 'Orçamento para associação de moradores.',               criado_por: 'usr-est-0001', criado_em: '2025-05-15T09:00:00Z', atualizado_em: '2025-05-15T09:00:00Z', is_demo: true },
    { id: 'vnd-0008', numero: 'VND-0008', data: '2025-05-18', cliente_id: 'cli-0005', equipe_id: 'eqp-0001', vendedor_id: 'usr-est-0001', desconto: 0,  forma_pagamento: 'pix',           situacao: 'cancelada',         observacoes: 'Cliente desistiu após negociação.',                   criado_por: 'usr-est-0001', criado_em: '2025-05-18T10:00:00Z', atualizado_em: '2025-05-18T14:00:00Z', is_demo: true },
  ],

  itens_venda: [
    { id: 'iv-0001', venda_id: 'vnd-0001', produto_id: 'prd-0001', quantidade: 6,  preco_unitario: 15.00, desconto_item: 0, subtotal: 90.00 },
    { id: 'iv-0002', venda_id: 'vnd-0002', produto_id: 'prd-0002', quantidade: 2,  preco_unitario: 25.00, desconto_item: 0, subtotal: 50.00 },
    { id: 'iv-0003', venda_id: 'vnd-0003', produto_id: 'prd-0003', quantidade: 4,  preco_unitario: 12.00, desconto_item: 0, subtotal: 48.00 },
    { id: 'iv-0004', venda_id: 'vnd-0004', produto_id: 'prd-0004', quantidade: 3,  preco_unitario: 18.00, desconto_item: 0, subtotal: 54.00 },
    { id: 'iv-0005', venda_id: 'vnd-0005', produto_id: 'prd-0001', quantidade: 6,  preco_unitario: 15.00, desconto_item: 0, subtotal: 90.00 },
    { id: 'iv-0006', venda_id: 'vnd-0006', produto_id: 'prd-0003', quantidade: 8,  preco_unitario: 12.00, desconto_item: 0, subtotal: 96.00 },
    { id: 'iv-0007', venda_id: 'vnd-0007', produto_id: 'prd-0001', quantidade: 15, preco_unitario: 15.00, desconto_item: 0, subtotal: 225.00 },
    { id: 'iv-0008', venda_id: 'vnd-0008', produto_id: 'prd-0002', quantidade: 5,  preco_unitario: 25.00, desconto_item: 0, subtotal: 125.00 },
  ],

  recebimentos: [
    { id: 'rec-0001', venda_id: 'vnd-0001', data: '2025-04-10', valor: 90.00, forma_pagamento: 'dinheiro',      observacao: 'Pagamento integral em dinheiro.',    registrado_por: 'usr-est-0001', criado_em: '2025-04-10T10:30:00Z' },
    { id: 'rec-0002', venda_id: 'vnd-0002', data: '2025-04-15', valor: 45.00, forma_pagamento: 'pix',           observacao: 'Pago via Pix (com desconto de R$5).', registrado_por: 'usr-est-0001', criado_em: '2025-04-15T12:00:00Z' },
    { id: 'rec-0003', venda_id: 'vnd-0003', data: '2025-04-18', valor: 48.00, forma_pagamento: 'pix',           observacao: 'Pagamento total via Pix.',            registrado_por: 'usr-est-0002', criado_em: '2025-04-18T14:30:00Z' },
    { id: 'rec-0004', venda_id: 'vnd-0004', data: '2025-04-20', valor: 27.00, forma_pagamento: 'dinheiro',      observacao: 'Primeira parcela.',                  registrado_por: 'usr-est-0002', criado_em: '2025-04-20T15:30:00Z' },
    { id: 'rec-0005', venda_id: 'vnd-0005', data: '2025-05-02', valor: 40.00, forma_pagamento: 'cartao_debito', observacao: 'Primeira entrada. Restam R$35.',     registrado_por: 'usr-est-0001', criado_em: '2025-05-02T10:30:00Z' },
  ],

  registros_pedagogicos: [
    { id: 'rp-0001', projeto_id: 'prj-0001', equipe_id: null,       tipo: 'objetivo',   titulo: 'Objetivos de Aprendizagem',       descricao: 'Ao final do projeto, os estudantes deverão: (1) Compreender conceitos básicos de empreendedorismo; (2) Calcular custos, preços e margem de lucro; (3) Desenvolver habilidades de comunicação e negociação; (4) Trabalhar em equipe com responsabilidade e autonomia.', arquivo_url: null, criado_por: 'usr-prf-0001', criado_em: '2025-02-05T10:00:00Z' },
    { id: 'rp-0002', projeto_id: 'prj-0001', equipe_id: 'eqp-0001', tipo: 'atividade',  titulo: 'Workshop de Identidade Visual',   descricao: 'As estudantes participaram de uma oficina para criar a identidade visual da equipe Eco Bags, incluindo logotipo, paleta de cores e slogan.', arquivo_url: null, criado_por: 'usr-prf-0001', criado_em: '2025-02-28T14:00:00Z' },
  ],
};

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
  signInWithPassword: async ({ email, password }) => {
    const u = USERS[email];
    if (!u || u.password !== password) return { data:null, error:{message:'E-mail ou senha incorretos.'} };
    const db = getDb();
    const profile = (db.profiles||[]).find(p=>p.id===u.profile_id);
    if (!profile||!profile.ativo) return { data:null, error:{message:'Usuário inativo ou não encontrado.'} };
    const session = { user:{id:u.profile_id,email}, profile, expires_at:Date.now()+86400000 };
    localStorage.setItem('crm_session', JSON.stringify(session));
    localStorage.setItem('user_profile', JSON.stringify(profile));
    return { data:{ session, user:session.user }, error:null };
  },
  signOut: async () => {
    localStorage.removeItem('crm_session');
    localStorage.removeItem('user_profile');
    _dbData = null;
    return { error:null };
  },
  getSession: () => {
    try {
      const s = localStorage.getItem('crm_session');
      if (!s) return { data:{session:null}, error:null };
      const session = JSON.parse(s);
      if (session.expires_at < Date.now()) { localStorage.removeItem('crm_session'); return { data:{session:null}, error:null }; }
      return { data:{session}, error:null };
    } catch(e) { return { data:{session:null}, error:null }; }
  },
  getUser: () => {
    try {
      const p = localStorage.getItem('user_profile');
      return p ? { data:{user:JSON.parse(p)}, error:null } : { data:{user:null}, error:null };
    } catch(e) { return { data:{user:null}, error:null }; }
  }
};

export { DEMO_DATA, USERS };
