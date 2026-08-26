// supabase-mock.js — Camada de persistência local para o CRM Escolar
// Armazena dados reais inseridos pelo usuário no localStorage.

const INITIAL_DATA = {
  profiles: [],
  projetos: [],
  projeto_professores: [],
  projeto_disciplinas: [],
  equipes: [],
  equipe_membros: [],
  clientes: [],
  historico_contatos: [],
  categorias_produto: [
    { id: 'ctp-0001', nome: 'Produtos Gerais', descricao: 'Itens produzidos ou comercializados' },
    { id: 'ctp-0002', nome: 'Serviços', descricao: 'Serviços prestados' },
  ],
  produtos: [],
  movimentacoes_estoque: [],
  categorias_custo: [
    { id: 'ctc-0001', nome: 'Matéria-prima' },
    { id: 'ctc-0002', nome: 'Embalagem' },
    { id: 'ctc-0003', nome: 'Divulgação / Marketing' },
    { id: 'ctc-0004', nome: 'Transporte / Logística' },
    { id: 'ctc-0005', nome: 'Equipamentos e Ferramentas' },
    { id: 'ctc-0006', nome: 'Taxas e Impostos' },
    { id: 'ctc-0007', nome: 'Outros Custos' },
  ],
  custos: [],
  vendas: [],
  itens_venda: [],
  recebimentos: [],
  registros_pedagogicos: [],
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
