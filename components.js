// Utils e Componentes Reutilizáveis

export function getBadge(text, color) {
    const colorClasses = {
        'success': 'bg-green-100 text-green-800',
        'warning': 'bg-yellow-100 text-yellow-800',
        'danger': 'bg-red-100 text-red-800',
        'primary': 'bg-blue-100 text-blue-800',
        'neutral': 'bg-gray-100 text-gray-800'
    };
    const cssClass = colorClasses[color] || colorClasses['neutral'];
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cssClass}">${text}</span>`;
}

export function getVendaStatusBadge(status) {
    const map = {
        'Prospecção': 'neutral',
        'Negociação': 'warning',
        'Ganha': 'success',
        'Perdida': 'danger'
    };
    return getBadge(status, map[status] || 'neutral');
}

export function getClienteEtapaBadge(etapa) {
    const map = {
        'Lead': 'neutral',
        'Contato Feito': 'primary',
        'Proposta Enviada': 'warning',
        'Cliente': 'success'
    };
    return getBadge(etapa, map[etapa] || 'neutral');
}

export function createCard({ title, value, icon, color, trend, subtitle }) {
    const trendHtml = trend ? `
        <div class="mt-2 flex items-center text-sm">
            <span class="${trend.up ? 'text-green-600' : 'text-red-600'} flex items-center font-medium">
                <i class="fa-solid ${trend.up ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1"></i>
                ${trend.value}
            </span>
            <span class="text-gray-500 ml-2">${trend.text}</span>
        </div>
    ` : subtitle ? `<div class="mt-2 text-sm text-gray-500">${subtitle}</div>` : '';

    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 truncate">${title}</p>
                    <p class="mt-1 text-2xl font-semibold text-gray-900">${value}</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center text-${color}-600">
                    <i class="fa-solid ${icon} text-xl"></i>
                </div>
            </div>
            ${trendHtml}
        </div>
    `;
}

export function createEmptyState({ icon, title, description, action }) {
    const actionHtml = action ? `
        <div class="mt-6">
            <button onclick="${action.onClick}" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark">
                <i class="fa-solid ${action.icon} mr-2"></i> ${action.text}
            </button>
        </div>
    ` : '';

    return `
        <div class="text-center py-12 px-4">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                <i class="fa-solid ${icon} text-2xl"></i>
            </div>
            <h3 class="text-lg font-medium text-gray-900">${title}</h3>
            <p class="mt-2 text-sm text-gray-500 max-w-sm mx-auto">${description}</p>
            ${actionHtml}
        </div>
    `;
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const colors = {
        'success': 'bg-green-50 text-green-800 border-green-200',
        'error': 'bg-red-50 text-red-800 border-red-200',
        'warning': 'bg-yellow-50 text-yellow-800 border-yellow-200',
        'info': 'bg-blue-50 text-blue-800 border-blue-200'
    };
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-circle-xmark',
        'warning': 'fa-triangle-exclamation',
        'info': 'fa-circle-info'
    };

    toast.className = `toast flex items-center p-4 mb-2 rounded-lg border shadow-sm ${colors[type]}`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type]} text-lg mr-3"></i>
        <div class="font-medium text-sm">${message}</div>
        <button class="ml-auto text-gray-400 hover:text-gray-600 focus:outline-none" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Outros componentes (Modal, Table, etc) poderiam ser implementados aqui de forma semelhante,
// retornando strings HTML ou manipulando o DOM.
