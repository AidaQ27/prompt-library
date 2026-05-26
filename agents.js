// ─── Helpers ────────────────────────────────────────────────────────────────

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/**
 * Resolve a multilingual field { es, ca, en } or a plain string.
 * Falls back to 'es' when the requested lang is missing.
 */
function getText(field, lang) {
  if (!field) return '';
  if (typeof field === 'object') return field[lang] || field.es || '';
  return String(field);
}

/**
 * Return all language values of a field concatenated (used for search).
 */
function allLangText(field) {
  if (!field) return '';
  if (typeof field === 'object') return Object.values(field).join(' ');
  return String(field);
}

// ─── DOM References ──────────────────────────────────────────────────────────

const elements = {
  searchInput:  document.getElementById('searchInput'),
  teamFilter:   document.getElementById('teamFilter'),
  dpcFilter:    document.getElementById('dpcFilter'),
  resetButton:  document.getElementById('resetFilters'),
  resultsCount: document.getElementById('resultsCount'),
  agentsList:   document.getElementById('agentsList'),
  emptyState:   document.getElementById('emptyState')
};

// ─── Data ────────────────────────────────────────────────────────────────────

let agentsData = [];

// ─── Rendering ───────────────────────────────────────────────────────────────

function renderAgents(list) {
  const lang = (typeof getLang === 'function') ? getLang() : 'es';
  elements.agentsList.innerHTML = '';

  list.forEach((agent) => {
    const card = createElement('article', 'agentCard');

    // Header: Title + DPC badge
    const header = createElement('div', 'agentCardHeader');
    const titleRow = createElement('div', 'agentHeader');
    titleRow.appendChild(createElement('h2', 'agentTitle', getText(agent.title, lang)));
    titleRow.appendChild(createElement('span', 'dpcBadge', agent.dpcLevel));
    header.appendChild(titleRow);

    // Meta: Team + Type
    const meta = createElement('div', 'agentMeta');
    meta.appendChild(createElement('span', 'agentMeta-item',
      `${t('agents.row.team')} ${getText(agent.team, lang)}`));
    meta.appendChild(createElement('span', 'agentMeta-item',
      `${t('agents.row.type')} ${getText(agent.type, lang)}`));
    header.appendChild(meta);
    card.appendChild(header);

    // Body rows
    const body = createElement('div', 'agentCardBody');

    body.appendChild(buildRow(t('agents.row.before'), getText(agent.before, lang)));
    body.appendChild(buildTimeRow(getText(agent.timeBefore, lang), getText(agent.timeNow, lang)));
    body.appendChild(buildRow(t('agents.row.savings'), getText(agent.timeSavings, lang), true));
    body.appendChild(buildExpandableRow(t('agents.row.impact'), getText(agent.impact, lang)));

    if (agent.notes) {
      body.appendChild(buildExpandableRow(t('agents.row.notes'), getText(agent.notes, lang)));
    }

    card.appendChild(body);
    elements.agentsList.appendChild(card);
  });
}

function buildRow(label, text, highlight = false) {
  const row = createElement('div', highlight ? 'agentRow highlight' : 'agentRow');
  row.appendChild(createElement('div', 'agentRowLabel', label));
  row.appendChild(createElement('div', 'agentRowText', text));
  return row;
}

function buildTimeRow(timeBefore, timeNow) {
  const row = createElement('div', 'agentRow');
  row.appendChild(createElement('div', 'agentRowLabel', t('agents.row.time')));

  const textEl = createElement('div', 'agentRowText');
  const beforeEm = document.createElement('em');
  beforeEm.textContent = t('agents.row.timeBefore');
  textEl.appendChild(beforeEm);
  textEl.appendChild(document.createTextNode(` ${timeBefore}  ·  `));
  const nowEm = document.createElement('em');
  nowEm.textContent = t('agents.row.timeNow');
  textEl.appendChild(nowEm);
  textEl.appendChild(document.createTextNode(` ${timeNow}`));

  row.appendChild(textEl);
  return row;
}

function buildExpandableRow(label, text) {
  const MAX_CHARS = 120;
  const isLong = text.length > MAX_CHARS;
  const displayText = isLong ? text.substring(0, MAX_CHARS) + '…' : text;

  const row = createElement('div', 'agentRow expandable');
  row.appendChild(createElement('div', 'agentRowLabel', label));

  const container = createElement('div', 'agentRowExpandContainer');
  const textEl = createElement('div', 'agentRowText', displayText);
  textEl.dataset.fullText = text;
  textEl.dataset.displayText = displayText;
  textEl.classList.add('expandable-text');
  container.appendChild(textEl);

  if (isLong) {
    const btn = createElement('button', 'expandToggleBtn', t('agents.row.seeMore'));
    btn.type = 'button';
    btn.dataset.expanded = 'false';
    btn.addEventListener('click', () => {
      const expanded = btn.dataset.expanded === 'true';
      textEl.textContent = expanded ? textEl.dataset.displayText : textEl.dataset.fullText;
      btn.textContent = expanded ? t('agents.row.seeMore') : t('agents.row.seeLess');
      btn.dataset.expanded = expanded ? 'false' : 'true';
    });
    container.appendChild(btn);
  }

  row.appendChild(container);
  return row;
}

// ─── Team Filter ─────────────────────────────────────────────────────────────

/**
 * Rebuild the team dropdown. Uses the Spanish team name as the stable option
 * value (same pattern as app.js populateTeamSelect), and displays the
 * localised name as the visible label.
 */
function buildTeamFilter() {
  const lang = (typeof getLang === 'function') ? getLang() : 'es';
  const current = elements.teamFilter.value;

  // Remove all options except the default "all" option (value="")
  while (elements.teamFilter.options.length > 1) elements.teamFilter.remove(1);

  // Build a map: esKey → raw field (object or string)
  const teamMap = new Map();
  agentsData.forEach((agent) => {
    const raw = agent.team;
    const key = (raw && typeof raw === 'object') ? (raw.es || '') : String(raw || '');
    if (key && !teamMap.has(key)) teamMap.set(key, raw);
  });

  teamMap.forEach((raw, key) => {
    const opt = createElement('option', '', '');
    opt.value = key; // stable es key
    opt.textContent = (raw && typeof raw === 'object')
      ? (raw[lang] || raw.es || key)
      : key;
    elements.teamFilter.appendChild(opt);
  });

  // Restore previous selection if still valid
  if (current) elements.teamFilter.value = current;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const team  = elements.teamFilter.value;  // always the es key
  const dpc   = elements.dpcFilter.value;

  const filtered = agentsData.filter((agent) => {
    // Team filter: compare against the es key
    if (team) {
      const teamKey = (agent.team && typeof agent.team === 'object')
        ? (agent.team.es || '')
        : String(agent.team || '');
      if (teamKey !== team) return false;
    }

    if (dpc && agent.dpcLevel !== dpc) return false;

    if (query) {
      const haystack = [
        allLangText(agent.title),
        allLangText(agent.before),
        allLangText(agent.impact),
        allLangText(agent.team),
        allLangText(agent.type),
        allLangText(agent.notes || '')
      ].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  elements.resultsCount.textContent = t('agents.results', {
    shown: filtered.length,
    total: agentsData.length
  });
  elements.emptyState.style.display = filtered.length ? 'none' : 'block';
  renderAgents(filtered);
}

function resetFilters() {
  elements.searchInput.value = '';
  elements.teamFilter.value  = '';
  elements.dpcFilter.value   = '';
  applyFilters();
}

// ─── Initialisation ──────────────────────────────────────────────────────────

function initAgents() {
  buildTeamFilter();
  applyFilters();

  elements.searchInput.addEventListener('input',  applyFilters);
  elements.teamFilter.addEventListener('change',  applyFilters);
  elements.dpcFilter.addEventListener('change',   applyFilters);
  elements.resetButton.addEventListener('click',  resetFilters);

  window.addEventListener('languageChanged', () => {
    buildTeamFilter();
    applyFilters();
  });
}

fetch('agents.multilang.json')
  .then((r) => {
    if (!r.ok) throw new Error('agents.multilang.json not found');
    return r.json();
  })
  .then((data) => {
    agentsData = data;
    initAgents();
  })
  .catch((err) => {
    console.error('[agents] Failed to load data:', err);
    elements.emptyState.style.display = 'block';
  });
