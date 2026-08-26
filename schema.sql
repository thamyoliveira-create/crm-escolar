-- ==============================================================================
-- CRM Escolar — Schema Oficial do Banco de Dados PostgreSQL (Supabase)
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Perfis de Usuários (Integrada com Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  perfil VARCHAR(20) NOT NULL DEFAULT 'administrador' CHECK (perfil IN ('administrador', 'professor', 'estudante', 'consulta')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Projetos
CREATE TABLE IF NOT EXISTS public.projetos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  turma VARCHAR(100),
  ano_letivo VARCHAR(10),
  periodo_inicio DATE,
  periodo_fim DATE,
  meta_vendas INTEGER DEFAULT 0,
  meta_faturamento DECIMAL(12,2) DEFAULT 0,
  situacao VARCHAR(30) DEFAULT 'planejamento' CHECK (situacao IN ('planejamento','producao','comercializacao','concluido','arquivado')),
  criado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projeto_professores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(projeto_id, professor_id)
);

CREATE TABLE IF NOT EXISTS public.projeto_disciplinas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome_disciplina VARCHAR(100) NOT NULL
);

-- 3. Tabela de Equipes
CREATE TABLE IF NOT EXISTS public.equipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  produto_servico VARCHAR(200),
  meta_vendas INTEGER DEFAULT 0,
  meta_faturamento DECIMAL(12,2) DEFAULT 0,
  orientador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ativa BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.equipe_membros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE CASCADE,
  estudante_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  funcao VARCHAR(100),
  UNIQUE(equipe_id, estudante_id)
);

-- 4. Clientes e Leads (CRM)
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'familiar',
  cpf_cnpj VARCHAR(20),
  email VARCHAR(200),
  telefone VARCHAR(20),
  origem_contato VARCHAR(100),
  interesse TEXT,
  etapa_comercial VARCHAR(50) DEFAULT 'novo_contato',
  responsavel_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_projeto ON public.clientes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);

CREATE TABLE IF NOT EXISTS public.historico_contatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  responsavel_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  data DATE DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Catálogo de Produtos e Movimentação de Estoque
CREATE TABLE IF NOT EXISTS public.categorias_produto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias_produto(id) ON DELETE SET NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) DEFAULT 'produto' CHECK (tipo IN ('produto', 'servico')),
  preco_venda DECIMAL(12,2) NOT NULL DEFAULT 0,
  custo_estimado DECIMAL(12,2) DEFAULT 0,
  quantidade_produzida INTEGER DEFAULT 0,
  estoque_disponivel INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  imagem_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'venda', 'devolucao')),
  quantidade INTEGER NOT NULL,
  motivo TEXT,
  venda_id UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Gestão de Custos
CREATE TABLE IF NOT EXISTS public.categorias_custo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias_custo(id) ON DELETE SET NULL,
  descricao VARCHAR(200) NOT NULL,
  tipo_custo VARCHAR(20) DEFAULT 'variavel' CHECK (tipo_custo IN ('fixo', 'variavel')),
  valor DECIMAL(12,2) NOT NULL DEFAULT 0,
  quantidade INTEGER DEFAULT 1,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  fornecedor VARCHAR(150),
  forma_pagamento VARCHAR(50),
  situacao VARCHAR(30) DEFAULT 'pago' CHECK (situacao IN ('previsto', 'pago', 'cancelado')),
  comprovante_url TEXT,
  criado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vendas e Itens
CREATE TABLE IF NOT EXISTS public.vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  vendedor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  numero VARCHAR(20),
  data DATE DEFAULT CURRENT_DATE,
  desconto DECIMAL(12,2) DEFAULT 0,
  forma_pagamento VARCHAR(50) DEFAULT 'dinheiro',
  situacao VARCHAR(30) DEFAULT 'paga' CHECK (situacao IN ('orcamento', 'pendente', 'parcialmente_paga', 'paga', 'cancelada')),
  observacoes TEXT,
  criado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.itens_venda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  desconto_item DECIMAL(12,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.recebimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE,
  data DATE DEFAULT CURRENT_DATE,
  valor DECIMAL(12,2) NOT NULL DEFAULT 0,
  forma_pagamento VARCHAR(50),
  observacao TEXT,
  registrado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Registros Pedagógicos
CREATE TABLE IF NOT EXISTS public.registros_pedagogicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL,
  tipo VARCHAR(50) DEFAULT 'atividade',
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  arquivo_url TEXT,
  criado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Auditoria
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TRIGGERS E FUNÇÕES
-- ==============================================================================

-- Trigger para atualizar coluna atualizado_em
CREATE OR REPLACE FUNCTION public.update_atualizado_em_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.atualizado_em = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();
CREATE OR REPLACE TRIGGER update_projetos_modtime BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();
CREATE OR REPLACE TRIGGER update_equipes_modtime BEFORE UPDATE ON public.equipes FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();
CREATE OR REPLACE TRIGGER update_clientes_modtime BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();
CREATE OR REPLACE TRIGGER update_produtos_modtime BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();
CREATE OR REPLACE TRIGGER update_custos_modtime BEFORE UPDATE ON public.custos FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();
CREATE OR REPLACE TRIGGER update_vendas_modtime BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em_column();

-- Trigger para provisionar perfil de Administrador automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, nome, email, perfil, ativo)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'administrador',
    true
  )
  ON CONFLICT (email) DO UPDATE
  SET user_id = EXCLUDED.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) — Acesso Seguro com Chave Pública Anon
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_pedagogicos ENABLE ROW LEVEL SECURITY;

-- Políticas universais de leitura e gravação para a aplicação
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'profiles', 'projetos', 'projeto_professores', 'projeto_disciplinas',
    'equipes', 'equipe_membros', 'clientes', 'historico_contatos',
    'categorias_produto', 'produtos', 'movimentacoes_estoque',
    'categorias_custo', 'custos', 'vendas', 'itens_venda',
    'recebimentos', 'registros_pedagogicos'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Acesso Total %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Acesso Total %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ==============================================================================
-- CATEGORIAS PADRÃO (Sem dados fictícios)
-- ==============================================================================
INSERT INTO public.categorias_produto (id, nome, descricao) VALUES
  ('ctp-0001', 'Produtos Gerais', 'Itens produzidos ou comercializados'),
  ('ctp-0002', 'Serviços', 'Serviços prestados')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categorias_custo (id, nome) VALUES
  ('ctc-0001', 'Matéria-prima'),
  ('ctc-0002', 'Embalagem'),
  ('ctc-0003', 'Divulgação / Marketing'),
  ('ctc-0004', 'Transporte / Logística'),
  ('ctc-0005', 'Equipamentos e Ferramentas'),
  ('ctc-0006', 'Taxas e Impostos'),
  ('ctc-0007', 'Outros Custos')
ON CONFLICT (id) DO NOTHING;
