# 🎓 CRM Escolar — Sistema de Gestão e Empreendedorismo Pedagógico

O **CRM Escolar** é uma plataforma Single Page Application (SPA) moderna, intuitiva e completa, projetada para gerenciar projetos pedagógicos, equipes empreendedoras de estudantes, clientes, vendas, produtos, custos e finanças no ambiente educacional.

O sistema integra conceitos práticos de administração e finanças ao processo pedagógico, permitindo que estudantes vivenciem a gestão de miniempresas enquanto professores e gestores acompanham o desempenho e evolução de cada projeto.

---

## 🚀 Como Executar

O CRM Escolar foi construído com tecnologias web nativas e sem necessidade de etapas de compilação ou instalação de dependências (Zero Build).

### Opção 1: Diretamente no Navegador
Basta abrir o arquivo [`index.html`](file:///Users/tamirisoul/.gemini/antigravity/scratch/crm-escolar/index.html) com dois cliques no seu navegador favorito (Google Chrome, Edge, Safari, Firefox).

### Opção 2: Servidor Local (Recomendado)
Para melhor suporte ao carregamento de ES Modules em alguns navegadores:
```bash
# Com Python 3
cd /Users/tamirisoul/.gemini/antigravity/scratch/crm-escolar
python3 -m http.server 8000

# Ou com Node.js (npx)
npx serve .
```
Acesse `http://localhost:8000` no seu navegador.

---

## 🔐 Autenticação com Google & Acesso Universal de Administrador

O CRM Escolar suporta **Login com o Google** com perfil de **Administrador para todos os usuários**.

- **Entrar com o Google**: Clique em *"Continuar com o Google"* na tela de login para se autenticar instantaneamente com sua conta Google (ou escolher uma das contas disponíveis).
- **Acesso Total (ADM)**: Qualquer usuário logado recebe automaticamente privilégios de **Administrador**, tendo acesso irrestrito a todos os módulos, equipes, projetos, relatórios, gestão de usuários e configurações.

Você também pode acessar utilizando qualquer e-mail/senha ou as credenciais pré-configuradas:

| Perfil / Conta | E-mail | Senha | Acesso |
| :--- | :--- | :--- | :--- |
| **🌐 Login com Google** | `seu.nome@gmail.com` | *(1 clique)* | **👑 Administrador (Acesso Total)** |
| **👑 Ana Administradora** | `admin@escola.edu` | `admin123` | **👑 Administrador (Acesso Total)** |
| **👨‍🏫 Prof. Carlos Mendes** | `prof@escola.edu` | `prof123` | **👑 Administrador (Acesso Total)** |
| **🎒 Beatriz (Eco Bags)** | `ecos@escola.edu` | `est123` | **👑 Administrador (Acesso Total)** |
| **🌱 Diego (Horta)** | `horta@escola.edu` | `est123` | **👑 Administrador (Acesso Total)** |

---

## 📦 Módulos do Sistema

| Módulo | Ícone | Descrição |
| :--- | :---: | :--- |
| **Dashboard Geral** | 📊 | Visão executiva com **8 indicadores-chave (KPIs)** e **5 gráficos interativos** (Vendas por Equipe, Fluxo Mensal, Funil de Conversão, Top Produtos e Composição de Custos). |
| **CRM de Clientes** | 👥 | Cadastro completo de clientes com visão em **Tabela** e visualização em **Kanban de Funil de Vendas** (Lead, Contato, Proposta, Negociação, Fechado). |
| **Vendas** | 🛒 | Registro e CRUD completo de pedidos com múltiplos itens, cálculo automático de totais, status de pagamento e emissão de comprovantes. |
| **Produtos e Serviços** | 📦 | Catálogo com controle de estoque mínimo/atual, margem de contribuição e categorização por equipe. |
| **Custos e Despesas** | 💸 | Lançamento e controle de custos fixos e variáveis, centros de custo e vinculação com projetos pedagógicos. |
| **Recebimentos** | 💳 | Controle de contas a receber, status de quitação, prazos e métodos de pagamento. |
| **Fluxo de Caixa** | 📈 | Conciliação diária e mensal de entradas e saídas, projeção de saldo e demonstrativo de resultados. |
| **Relatórios** | 📑 | Exportação e impressão de relatórios financeiros e de vendas em formato **PDF** e planilhas **CSV**. |
| **Equipes** | 🤝 | Gestão de miniempresas e grupos de alunos, com atribuição de líderes e membros. |
| **Projetos** | 🎯 | Linha do tempo, metas, entregas e marcos de evolução dos projetos escolares. |
| **Área Pedagógica** | 🎓 | Ferramentas exclusivas para professores avaliarem competências, rubricas e darem feedback por equipe. |
| **Usuários** | 👤 | Gerenciamento de acessos, criação de novos usuários e atribuição de perfis *(Apenas Administrador)*. |
| **Configurações** | ⚙️ | Parâmetros gerais da escola, ano letivo, categorias e preferências do sistema *(Apenas Administrador)*. |

---

## 🛡️ Perfis de Acesso e Permissões

- **Administrador (`admin`)**:
  - Acesso irrestrito a todos os módulos, dados e relatórios.
  - Criação, edição e exclusão de usuários e permissões.
  - Edição de configurações gerais da aplicação e parâmetros globais.

- **Professor (`professor`)**:
  - Visualização de todas as equipes, projetos, vendas e finanças.
  - Lançamento de notas, feedbacks e avaliações na Área Pedagógica.
  - Emissão de relatórios consolidados para reuniões pedagógicas.

- **Estudante (`estudante`)**:
  - Visão filtrada restrita à sua própria equipe/projeto.
  - Criação e edição de clientes, oportunidades no Kanban, vendas, produtos e despesas da sua equipe.
  - Visualização do dashboard e desempenho da sua miniempresa.

- **Consulta (`consulta`)**:
  - Acesso de leitura (Read-Only) a painéis informativos e relatórios.
  - Ações de criação, edição ou exclusão são desabilitadas.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3**: Estrutura semântica e customizações visuais.
- **JavaScript (ES Modules)**: Arquitetura modular sem bundler (`type="module"`), código assíncrono e limpo.
- **Tailwind CSS (via CDN)**: Estilização moderna, responsiva e com suporte a temas.
- **Font Awesome 6.4**: Conjunto consistente de ícones vetoriais.
- **Chart.js 4.4**: Gráficos interativos e responsivos (Barras, Linhas, Donut, Funil).
- **jsPDF**: Geração de relatórios executivos em formato PDF no lado do cliente.
- **localStorage & Supabase Mock**: Persistência de dados local simulando banco de dados relacional com suporte a switch para Supabase Real.

---

## 💾 Notas sobre Dados de Demonstração

- **Persistência Local**: Todos os dados iniciais vêm pré-carregados pelo `supabase-mock.js` e são persistidos no `localStorage` do navegador.
- **Isolamento e Testes**: Você pode criar novas vendas, alterar status no Kanban e lançar despesas livremente. As alterações ficam salvas no navegador.
- **Restauração**: Para redefinir os dados para o estado original de fábrica, basta limpar os dados do site no navegador (`localStorage.clear()`) ou usar o botão de reset nas Configurações.
- **Pronto para Nuvem**: O arquivo `schema.sql` contém a estrutura completa de tabelas e políticas RLS (Row Level Security) pronta para implantação no PostgreSQL / Supabase real.

---

## 📂 Estrutura de Arquivos

```
crm-escolar/
├── index.html          # Página de login e redirecionamento inicial
├── app.html            # Shell principal da aplicação (Sidebar + Navbar + Container SPA)
├── styles.css          # Estilos customizados e regras de impressão/utilitários
├── router.js           # Roteamento hash-based (#/dashboard, #/vendas, etc.)
├── db.js               # Camada de abstração de dados (Ponte Supabase / Mock)
├── auth.js             # Gerenciamento de autenticação, sessão e controle de acesso
├── utils.js            # Funções utilitárias (formatação de moeda BRL, datas, exportação PDF/CSV)
├── components.js       # Componentes de interface reutilizáveis (modais, cards, tabelas, badges)
├── supabase-mock.js    # Mock do banco de dados em memória/localStorage com dados demo
├── schema.sql          # Schema DDL e RLS para migração para Supabase PostgreSQL
├── manifest.json       # Manifesto para suporte a PWA (Progressive Web App)
└── pages/              # Módulos e visualizações da aplicação
    ├── dashboard.js       # Painel principal com 8 KPIs e 5 gráficos Chart.js
    ├── clientes.js        # Gestão de clientes em formato de tabela interativa
    ├── clientes-kanban.js # Funil de vendas em Kanban drag-and-drop
    ├── vendas.js          # CRUD de vendas e pedidos com itens
    ├── produtos.js        # Catálogo de produtos e controle de estoque
    ├── custos.js          # Gestão de despesas fixas e variáveis
    ├── recebimentos.js    # Controle de contas e títulos a receber
    ├── fluxo-caixa.js     # Fluxo de caixa diário e demonstrativo de resultados
    ├── relatorios.js      # Central de relatórios e exportação PDF/CSV
    ├── equipes.js         # Cadastro e acompanhamento de equipes de alunos
    ├── projetos.js        # Gestão de projetos pedagógicos e prazos
    ├── pedagogico.js      # Avaliação pedagógica e rubricas de competências
    ├── usuarios.js        # Gerenciamento de usuários (restrito ao Admin)
    └── configuracoes.js   # Configurações do sistema e dados (restrito ao Admin)
```

---

<p align="center">
  Desenvolvido com 💚 para transformar a educação empreendedora.
</p>
