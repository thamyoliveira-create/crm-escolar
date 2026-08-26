// router.js — Sistema de roteamento client-side do CRM Escolar

export const routes = {
  '/dashboard':       { title: 'Dashboard',          page: 'pages/dashboard.js',       icon: 'fa-chart-pie',          group: 'GERAL',       roles: ['all'] },
  '/projetos':        { title: 'Projetos',            page: 'pages/projetos.js',         icon: 'fa-diagram-project',    group: 'PROJETO',     roles: ['administrador', 'professor'] },
  '/equipes':         { title: 'Equipes',             page: 'pages/equipes.js',          icon: 'fa-users',              group: 'PROJETO',     roles: ['all'] },
  '/clientes':        { title: 'Clientes',            page: 'pages/clientes.js',         icon: 'fa-address-book',       group: 'CRM',         roles: ['all'] },
  '/clientes/kanban': { title: 'Kanban de Clientes',  page: 'pages/clientes-kanban.js',  icon: 'fa-table-columns',      group: 'CRM',         roles: ['all'] },
  '/produtos':        { title: 'Produtos/Serviços',   page: 'pages/produtos.js',         icon: 'fa-box',                group: 'COMERCIAL',   roles: ['all'] },
  '/vendas':          { title: 'Vendas',              page: 'pages/vendas.js',           icon: 'fa-hand-holding-dollar',group: 'COMERCIAL',   roles: ['all'] },
  '/custos':          { title: 'Custos',              page: 'pages/custos.js',           icon: 'fa-file-invoice-dollar',group: 'COMERCIAL',   roles: ['all'] },
  '/recebimentos':    { title: 'Recebimentos',        page: 'pages/recebimentos.js',     icon: 'fa-money-check-dollar', group: 'FINANCEIRO',  roles: ['all'] },
  '/fluxo-de-caixa':  { title: 'Fluxo de Caixa',     page: 'pages/fluxo-caixa.js',      icon: 'fa-chart-line',         group: 'FINANCEIRO',  roles: ['all'] },
  '/relatorios':      { title: 'Relatórios',          page: 'pages/relatorios.js',       icon: 'fa-file-lines',         group: 'ANÁLISE',     roles: ['all'] },
  '/pedagogico':      { title: 'Área Pedagógica',    page: 'pages/pedagogico.js',       icon: 'fa-chalkboard-user',    group: 'PEDAGÓGICO', roles: ['administrador', 'professor'] },
  '/usuarios':        { title: 'Usuários',            page: 'pages/usuarios.js',         icon: 'fa-user-gear',          group: 'ADMIN',       roles: ['administrador'] },
  '/configuracoes':   { title: 'Configurações',       page: 'pages/configuracoes.js',    icon: 'fa-gear',               group: 'ADMIN',       roles: ['administrador'] },
};

let currentRole = 'administrador';
let currentCleanup = null;

function canAccess(routePath, role) {
  const route = routes[routePath];
  if (!route) return false;
  if (route.roles.includes('all')) return true;
  return route.roles.includes(role);
}

function buildMenu(role) {
  const nav = document.getElementById('nav-menu');
  if (!nav) return;
  nav.innerHTML = '';

  // Agrupar rotas
  const groups = {};
  for (const [path, route] of Object.entries(routes)) {
    if (!canAccess(path, role)) continue;
    if (!groups[route.group]) groups[route.group] = [];
    groups[route.group].push({ path, ...route });
  }

  // Renderizar grupos
  for (const [groupName, items] of Object.entries(groups)) {
    const label = document.createElement('div');
    label.className = 'nav-group-title';
    label.textContent = groupName;
    nav.appendChild(label);

    for (const item of items) {
      const a = document.createElement('a');
      a.href = `#${item.path}`;
      a.className = 'nav-link';
      a.setAttribute('data-path', item.path);
      a.setAttribute('aria-label', item.title);
      a.innerHTML = `<i class="fa-solid ${item.icon} w-5 text-center"></i><span>${item.title}</span>`;
      nav.appendChild(a);
    }
  }
}

function updateActiveLink(path) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const isActive = link.getAttribute('data-path') === path;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

export function getCurrentRoute() {
  const hash = window.location.hash.slice(1);
  return hash || '/dashboard';
}

export async function navigate(path) {
  if (!path) path = getCurrentRoute();
  const routePath = path.split('?')[0] || '/dashboard';
  const resolvedPath = routes[routePath] ? routePath : '/dashboard';

  const contentArea = document.getElementById('page-content');
  const loader = document.getElementById('global-loader');
  if (!contentArea) return;

  // Verificar acesso
  if (!canAccess(resolvedPath, currentRole)) {
    contentArea.innerHTML = `
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <i class="fa-solid fa-lock text-4xl text-red-300"></i>
        </div>
        <h2 class="text-xl font-bold text-gray-700">Acesso negado</h2>
        <p class="text-gray-500 mt-2 max-w-sm">Você não tem permissão para acessar esta página com o perfil atual.</p>
        <a href="#/dashboard" class="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white" style="background:#1e3a5f">
          <i class="fa-solid fa-house mr-1"></i> Ir ao Dashboard
        </a>
      </div>`;
    if (loader) loader.style.display = 'none';
    return;
  }

  const route = routes[resolvedPath];
  if (loader) loader.style.display = 'flex';

  // Limpar página anterior
  if (currentCleanup) {
    try { currentCleanup(); } catch(e) {}
    currentCleanup = null;
  }

  // Atualizar títulos e menu
  const desktopTitle = document.getElementById('desktop-page-title');
  const mobileTitle  = document.getElementById('mobile-page-title');
  if (desktopTitle) desktopTitle.textContent = route.title;
  if (mobileTitle)  mobileTitle.textContent  = route.title;
  document.title = `${route.title} — CRM Escolar`;
  updateActiveLink(resolvedPath);

  contentArea.innerHTML = '';

  // Cache bust via timestamp param
  const cacheBust = Math.floor(Date.now() / 60000); // atualiza a cada minuto

  try {
    const module = await import(`./${route.page}?v=${cacheBust}`);
    if (module.render) {
      await module.render(contentArea);
      if (module.cleanup) currentCleanup = module.cleanup;
    } else {
      throw new Error('Módulo sem função render');
    }
  } catch(err) {
    console.error(`Erro ao carregar ${route.page}:`, err);
    contentArea.innerHTML = `
      <div class="flex flex-col items-center justify-center py-24 text-center">
        <div class="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mb-4">
          <i class="fa-solid fa-triangle-exclamation text-4xl text-yellow-400"></i>
        </div>
        <h2 class="text-xl font-bold text-gray-700">${route.title}</h2>
        <p class="text-gray-500 mt-2">Esta página está em desenvolvimento.</p>
        <span class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
          <i class="fa-solid fa-clock"></i> Em Breve
        </span>
        <details class="mt-4 text-left max-w-md">
          <summary class="text-xs text-gray-400 cursor-pointer">Detalhes técnicos</summary>
          <pre class="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded overflow-auto">${err.message}</pre>
        </details>
      </div>`;
  } finally {
    if (loader) setTimeout(() => loader.style.display = 'none', 200);
  }
}

export function initRouter(role) {
  currentRole = role || 'consulta';
  buildMenu(currentRole);

  window.addEventListener('hashchange', () => {
    navigate(window.location.hash.slice(1));
  });

  // Navegar para a rota inicial
  navigate();
}
