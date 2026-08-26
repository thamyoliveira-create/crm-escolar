// utils.js

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(d);
}

export function parseDate(str) {
  if (!str) return null;
  const [day, month, year] = str.split('/');
  return new Date(`${year}-${month}-${day}`);
}

export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function sanitizeText(str) {
  if (!str) return '';
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return str.replace(reg, (match)=>(map[match]));
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const re = /^\d{10,11}$/; // Simplificado
  return re.test(phone.replace(/\D/g, ''));
}

export function percentFormat(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function pluralize(n, singular, plural) {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural}`;
}

export function debounce(fn, ms) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function showToast(message, type = 'info') {
  // Simples implementação de toast
  const container = document.getElementById('toast-container') || (function() {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'fixed bottom-4 right-4 flex flex-col gap-2 z-50';
    document.body.appendChild(c);
    return c;
  })();

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };
  
  toast.className = `${colors[type] || colors.info} text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300 opacity-0`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Fade in
  requestAnimationFrame(() => toast.classList.remove('opacity-0'));
  
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function showConfirm(message) {
  return new Promise((resolve) => {
    const result = window.confirm(message);
    resolve(result);
  });
}

export function exportCSV(data, filename, columns) {
  if (!data || !data.length) return;
  
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => {
    return columns.map(c => {
      let val = row[c.field];
      if (val === null || val === undefined) val = '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPDF(title, data, columns) {
  // Requer jsPDF via CDN na página: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  // Requer jsPDF-AutoTable
  if (!window.jspdf) {
    showToast('Biblioteca PDF não carregada', 'error');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  const head = [columns.map(c => c.label)];
  const body = data.map(row => columns.map(c => row[c.field] || ''));
  
  doc.autoTable({
    startY: 30,
    head: head,
    body: body,
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}

export function getStatusBadge(status, type = 'default') {
  const styles = {
    paga: 'bg-green-100 text-green-800',
    pendente: 'bg-yellow-100 text-yellow-800',
    parcialmente_paga: 'bg-blue-100 text-blue-800',
    cancelada: 'bg-red-100 text-red-800',
    ativo: 'bg-green-100 text-green-800',
    inativo: 'bg-gray-100 text-gray-800',
    potencial: 'bg-purple-100 text-purple-800',
    orcamento: 'bg-gray-100 text-gray-800',
    producao: 'bg-blue-100 text-blue-800'
  };
  
  const classes = styles[status] || 'bg-gray-100 text-gray-800';
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  
  return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}">${label}</span>`;
}
