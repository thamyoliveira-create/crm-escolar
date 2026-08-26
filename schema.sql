-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis (estende auth.users do Supabase)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE, -- TODO: REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('administrador', 'professor', 'estudante', 'consulta')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de projetos
CREATE TABLE projetos (
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
  criado_por UUID REFERENCES profiles(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projeto_professores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(projeto_id, professor_id)
);

CREATE TABLE projeto_disciplinas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  nome_disciplina VARCHAR(100) NOT NULL
);

-- Tabela de equipes
CREATE TABLE equipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  meta_vendas INTEGER DEFAULT 0,
  meta_faturamento DECIMAL(12,2) DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipe_membros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID REFERENCES equipes(id) ON DELETE CASCADE,
  estudante_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  funcao VARCHAR(100),
  UNIQUE(equipe_id, estudante_id)
);

-- Clientes
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL, -- Opcional: cliente pode ser geral do projeto ou prospectado por uma equipe
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'fisica' CHECK (tipo IN ('fisica', 'juridica')),
  cpf_cnpj VARCHAR(20),
  email VARCHAR(200),
  telefone VARCHAR(20),
  endereco TEXT,
  perfil VARCHAR(50) DEFAULT 'potencial' CHECK (perfil IN ('potencial', 'ativo', 'inativo')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_clientes_projeto ON clientes(projeto_id);
CREATE INDEX idx_clientes_nome ON clientes(nome);

CREATE TABLE historico_contatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  responsavel_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  data_contato TIMESTAMPTZ DEFAULT NOW(),
  tipo VARCHAR(50) CHECK (tipo IN ('email', 'telefone', 'whatsapp', 'reuniao', 'presencial')),
  descricao TEXT NOT NULL,
  proximo_passo TEXT,
  data_proximo_passo DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_historico_cliente ON historico_contatos(cliente_id);

-- Produtos
CREATE TABLE categorias_produto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT
);

CREATE TABLE produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID REFERENCES equipes(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_produto(id) ON DELETE SET NULL,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) DEFAULT 'produto' CHECK (tipo IN ('produto', 'servico')),
  preco_venda DECIMAL(12,2) NOT NULL,
  custo_estimado DECIMAL(12,2) DEFAULT 0,
  estoque_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  controlar_estoque BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_produtos_equipe ON produtos(equipe_id);

CREATE TABLE movimentacoes_estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  responsavel_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'venda', 'devolucao')),
  quantidade INTEGER NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Custos
CREATE TABLE categorias_custo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL
);

CREATE TABLE custos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID REFERENCES equipes(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_custo(id) ON DELETE SET NULL,
  descricao VARCHAR(200) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_ocorrencia DATE NOT NULL,
  tipo VARCHAR(20) DEFAULT 'variavel' CHECK (tipo IN ('fixo', 'variavel')),
  comprovante_url TEXT,
  criado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_custos_equipe ON custos(equipe_id);
CREATE INDEX idx_custos_data ON custos(data_ocorrencia);

-- Vendas
CREATE TABLE vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipe_id UUID REFERENCES equipes(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  numero_venda VARCHAR(20), -- Ex: VND-001
  data_venda TIMESTAMPTZ DEFAULT NOW(),
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(12,2) DEFAULT 0,
  acrescimo DECIMAL(12,2) DEFAULT 0,
  valor_final DECIMAL(12,2) NOT NULL DEFAULT 0,
  situacao VARCHAR(30) DEFAULT 'orcamento' CHECK (situacao IN ('orcamento', 'pendente', 'parcialmente_paga', 'paga', 'cancelada')),
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_vendas_equipe ON vendas(equipe_id);
CREATE INDEX idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX idx_vendas_situacao ON vendas(situacao);

CREATE TABLE itens_venda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);

CREATE TABLE recebimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venda_id UUID REFERENCES vendas(id) ON DELETE CASCADE,
  valor DECIMAL(12,2) NOT NULL,
  data_pagamento DATE NOT NULL,
  forma_pagamento VARCHAR(50) CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'outro')),
  situacao VARCHAR(20) DEFAULT 'pendente' CHECK (situacao IN ('pendente', 'recebido', 'cancelado')),
  comprovante_url TEXT,
  registrado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Registros Pedagógicos
CREATE TABLE registros_pedagogicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  equipe_id UUID REFERENCES equipes(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data_registro DATE NOT NULL,
  tipo_avaliacao VARCHAR(50) CHECK (tipo_avaliacao IN ('formativa', 'somativa', 'observacao', 'feedback')),
  conteudo TEXT NOT NULL,
  nota DECIMAL(4,2),
  visivel_estudantes BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tabela VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  acao VARCHAR(20) NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
  usuario_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers e Funções

-- 1. Trigger update_atualizado_em
CREATE OR REPLACE FUNCTION update_atualizado_em_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.atualizado_em = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar o trigger a todas as tabelas com atualizado_em
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();
CREATE TRIGGER update_projetos_modtime BEFORE UPDATE ON projetos FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();
CREATE TRIGGER update_equipes_modtime BEFORE UPDATE ON equipes FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();
CREATE TRIGGER update_clientes_modtime BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();
CREATE TRIGGER update_produtos_modtime BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();
CREATE TRIGGER update_custos_modtime BEFORE UPDATE ON custos FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();
CREATE TRIGGER update_vendas_modtime BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();
CREATE TRIGGER update_recebimentos_modtime BEFORE UPDATE ON recebimentos FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();
CREATE TRIGGER update_registros_modtime BEFORE UPDATE ON registros_pedagogicos FOR EACH ROW EXECUTE PROCEDURE update_atualizado_em_column();

-- 2. Trigger de auditoria (simplificado)
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log(tabela, registro_id, acao, dados_anteriores)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log(tabela, registro_id, acao, dados_anteriores, dados_novos)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log(tabela, registro_id, acao, dados_novos)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_projetos AFTER INSERT OR UPDATE OR DELETE ON projetos FOR EACH ROW EXECUTE PROCEDURE log_audit_event();
CREATE TRIGGER audit_vendas AFTER INSERT OR UPDATE OR DELETE ON vendas FOR EACH ROW EXECUTE PROCEDURE log_audit_event();

-- 3. Trigger de estoque
CREATE OR REPLACE FUNCTION atualizar_estoque_venda()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_controlar_estoque BOOLEAN;
BEGIN
    -- Se a situação mudou para paga ou parcialmente_paga
    IF (NEW.situacao IN ('paga', 'parcialmente_paga') AND OLD.situacao NOT IN ('paga', 'parcialmente_paga')) THEN
        FOR item IN SELECT * FROM itens_venda WHERE venda_id = NEW.id LOOP
            SELECT controlar_estoque INTO v_controlar_estoque FROM produtos WHERE id = item.produto_id;
            IF v_controlar_estoque THEN
                UPDATE produtos SET estoque_atual = estoque_atual - item.quantidade WHERE id = item.produto_id;
                INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, observacao)
                VALUES (item.produto_id, 'venda', -item.quantidade, 'Venda ' || NEW.numero_venda);
            END IF;
        END LOOP;
    -- Se a situação mudou de paga/parcialmente_paga para cancelada/orcamento/pendente
    ELSIF (OLD.situacao IN ('paga', 'parcialmente_paga') AND NEW.situacao IN ('cancelada', 'orcamento', 'pendente')) THEN
        FOR item IN SELECT * FROM itens_venda WHERE venda_id = NEW.id LOOP
            SELECT controlar_estoque INTO v_controlar_estoque FROM produtos WHERE id = item.produto_id;
            IF v_controlar_estoque THEN
                UPDATE produtos SET estoque_atual = estoque_atual + item.quantidade WHERE id = item.produto_id;
                INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, observacao)
                VALUES (item.produto_id, 'devolucao', item.quantidade, 'Estorno venda ' || NEW.numero_venda);
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_estoque AFTER UPDATE ON vendas FOR EACH ROW EXECUTE PROCEDURE atualizar_estoque_venda();

-- 4. Função calcular_numero_venda
CREATE OR REPLACE FUNCTION calcular_numero_venda()
RETURNS TRIGGER AS $$
DECLARE
    num INTEGER;
BEGIN
    IF NEW.numero_venda IS NULL THEN
        SELECT COUNT(*) + 1 INTO num FROM vendas WHERE equipe_id = NEW.equipe_id;
        NEW.numero_venda := 'VND-' || LPAD(num::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gerar_num_venda BEFORE INSERT ON vendas FOR EACH ROW EXECUTE PROCEDURE calcular_numero_venda();

-- POLÍTICAS RLS (Atualmente comentadas para MVP inicial, apenas documentadas)
/*
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários veem todos os profiles ativos" ON profiles FOR SELECT USING (ativo = true);
CREATE POLICY "Admins gerenciam profiles" ON profiles FOR ALL USING (auth.uid() IN (SELECT user_id FROM profiles WHERE perfil = 'administrador'));

ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos leem projetos" ON projetos FOR SELECT USING (true);
CREATE POLICY "Admins e professores gerenciam projetos" ON projetos FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM profiles WHERE perfil IN ('administrador', 'professor'))
);

-- Mais políticas para as outras tabelas baseadas nos papéis...
*/

-- DEMO DATA
-- Usuários (IDs fixos para facilitar referências)
INSERT INTO profiles (id, user_id, nome, email, perfil) VALUES
('11111111-1111-1111-1111-111111111111', NULL, 'Administrador Demo', 'admin@escola.edu', 'administrador'),
('22222222-2222-2222-2222-222222222222', NULL, 'Professor Demo', 'prof@escola.edu', 'professor'),
('33333333-3333-3333-3333-333333333333', NULL, 'Estudante 1 Demo', 'estudante1@escola.edu', 'estudante'),
('44444444-4444-4444-4444-444444444444', NULL, 'Estudante 2 Demo', 'estudante2@escola.edu', 'estudante'),
('55555555-5555-5555-5555-555555555555', NULL, 'Consulta Demo', 'consulta@escola.edu', 'consulta');

-- Projeto
INSERT INTO projetos (id, nome, descricao, turma, ano_letivo, periodo_inicio, periodo_fim, situacao) VALUES
('10000000-0000-0000-0000-000000000000', 'Feira de Negócios 2025 — 3º Ano B', 'Projeto anual de empreendedorismo.', '3º Ano B', '2025', '2025-02-01', '2025-11-30', 'producao');

INSERT INTO projeto_professores (projeto_id, professor_id) VALUES
('10000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222');

-- Equipes
INSERT INTO equipes (id, projeto_id, nome, descricao, meta_vendas) VALUES
('e1111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000000', 'Eco Bags', 'Produção de bolsas retornáveis sustentáveis.', 50),
('e2222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000000', 'Sabor da Horta', 'Alimentos naturais e orgânicos.', 100);

-- Membros das equipes
INSERT INTO equipe_membros (equipe_id, estudante_id, funcao) VALUES
('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Gerente Vendas'),
('e2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Marketing');

-- Categorias Produto
INSERT INTO categorias_produto (id, projeto_id, nome) VALUES
('c1111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000000', 'Acessórios'),
('c2222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000000', 'Alimentos');

-- Produtos
INSERT INTO produtos (id, equipe_id, categoria_id, nome, preco_venda, estoque_atual, controlar_estoque) VALUES
('p1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Eco Bag Simples', 15.00, 20, true),
('p2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Eco Bag Estampada', 25.00, 15, true),
('p3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Geleia de Morango', 12.00, 30, true),
('p4444444-4444-4444-4444-444444444444', 'e2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Bolo de Cenoura', 8.00, 10, true);

-- Clientes
INSERT INTO clientes (id, projeto_id, nome, email, telefone) VALUES
('cl111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000000', 'João Silva', 'joao@email.com', '11999999999'),
('cl222222-2222-2222-2222-222222222222', '10000000-0000-0000-0000-000000000000', 'Maria Oliveira', 'maria@email.com', '11888888888');

-- Vendas
INSERT INTO vendas (id, equipe_id, cliente_id, numero_venda, valor_total, valor_final, situacao) VALUES
('v1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cl111111-1111-1111-1111-111111111111', 'VND-0001', 30.00, 30.00, 'paga'),
('v2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'cl222222-2222-2222-2222-222222222222', 'VND-0002', 20.00, 20.00, 'pendente');

-- Itens Venda
INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES
('v1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 2, 15.00, 30.00),
('v2222222-2222-2222-2222-222222222222', 'p3333333-3333-3333-3333-333333333333', 1, 12.00, 12.00),
('v2222222-2222-2222-2222-222222222222', 'p4444444-4444-4444-4444-444444444444', 1, 8.00, 8.00);

-- Recebimentos
INSERT INTO recebimentos (venda_id, valor, data_pagamento, forma_pagamento, situacao) VALUES
('v1111111-1111-1111-1111-111111111111', 30.00, '2025-05-10', 'pix', 'recebido');

-- Custos
INSERT INTO categorias_custo (id, projeto_id, nome) VALUES
('cc111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000000', 'Material de Consumo');

INSERT INTO custos (equipe_id, categoria_id, descricao, valor, data_ocorrencia) VALUES
('e1111111-1111-1111-1111-111111111111', 'cc111111-1111-1111-1111-111111111111', 'Tecido para Eco Bags', 100.00, '2025-03-01');
