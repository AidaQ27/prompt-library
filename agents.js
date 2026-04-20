function createSafeElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = String(text);
  return el;
}

const agentsData = [
  {
    id: "convenio",
    title: "Agente IA – Convenio Colectivo",
    team: "Chapter Leads",
    type: "Agente",
    dpcLevel: "DPC 0",
    before: "Búsqueda manual en PDF del convenio + consulta a HR + interpretación normativa",
    timeBefore: "20 min por consulta",
    timeNow: "2-3 min",
    timeSavings: "-17 min por consulta",
    impact: "Mejora la fiabilidad de las respuestas al basarse directamente en el documento oficial del convenio y reduce la necesidad de consultas recurrentes a HR.",
    notes: "El knowledge del agente se basa en el documento oficial del convenio"
  },
  {
    id: "formacion-planes",
    title: "Creación de planes de formación",
    team: "Area leads / BO",
    type: "Proyecto",
    dpcLevel: "DPC 1",
    before: "Era necesario recopilar información de programas similares y analizar qué nuevos contenidos o enfoques se podían proponer.",
    timeBefore: "4h (mínimo)",
    timeNow: "1h",
    timeSavings: "3h (mínimo)",
    impact: "Acelera la definición de nuevos programas formativos y aporta consistencia en la estructura y contenidos entre equipos",
    notes: "Nos pidieron una propuesta y se crearon 2."
  },
  {
    id: "local-apps",
    title: "Generador de apps locales para uso personal",
    team: "Chapter Leads",
    type: "Agente",
    dpcLevel: "DPC 0",
    before: "Era necesario crear un excel o un script",
    timeBefore: "1h - 4h",
    timeNow: "5 minutos",
    timeSavings: "1 - 4h",
    impact: "Permite crear pequeñas aplicaciones internas para estructurar información o prototipar soluciones sin necesidad de desarrollo formal.",
  },
  {
    id: "email-drafter",
    title: "Corporate Email Drafter",
    team: "Area leads / BO",
    type: "Agente",
    dpcLevel: "DPC 0",
    before: "Se redacta correo a mano",
    timeBefore: "5 min - 20min",
    timeNow: "2 minutos",
    timeSavings: "3 - 17 min por correo",
    impact: "El agente es capaz de generar un mail a partir de unas pocas palabras y generar un archivo .eml listo para ser descargado, abierto y enviado"
    },
  {
    id: "prompt-refiner",
    title: "Refinado de prompt",
    team: "Chapter Leads",
    type: "Agente",
    dpcLevel: "DPC 0",
    before: "Este agente permite refinar prompts para evitar tener que hacerlo a mano, el refinamiento tiene en cuenta que el usuario tiene un rol específico dentro de la compañía",
    timeBefore: "7 min",
    timeNow: "2 min",
    timeSavings: "5 min",
    impact: "La realización de un buen prompt puede ahorrar mucho tiempo y mejorar la eficiencia de una tarea. Hacer un prompt premium a mano es susceptible a errores y descuidos"
  }
];

const elements = {
  searchInput: document.getElementById("searchInput"),
  teamFilter: document.getElementById("teamFilter"),
  dpcFilter: document.getElementById("dpcFilter"),
  resetButton: document.getElementById("resetFilters"),
  resultsCount: document.getElementById("resultsCount"),
  agentsList: document.getElementById("agentsList"),
  emptyState: document.getElementById("emptyState")
};



function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (text !== undefined) {
    el.textContent = text;
  }
  return el;
}

function renderAgents(list) {
  elements.agentsList.innerHTML = "";

  list.forEach((agent) => {
    const card = createElement("article", "agentCard");

    // Header: Title + DPC badge
    const header = createElement("div", "agentCardHeader");
    const titleRow = createElement("div", "agentHeader");
    titleRow.appendChild(createElement("h2", "agentTitle", agent.title));
    titleRow.appendChild(createElement("span", "dpcBadge", agent.dpcLevel));
    header.appendChild(titleRow);

    // Meta: Team + Type
    const meta = createElement("div", "agentMeta");
    meta.appendChild(createElement("span", "agentMeta-item", `${t('agents.row.team')} ${agent.team}`));
    meta.appendChild(createElement("span", "agentMeta-item", `${t('agents.row.type')} ${agent.type}`));
    header.appendChild(meta);
    card.appendChild(header);

    // Body: Columns from Excel
    const body = createElement("div", "agentCardBody");
    
    body.appendChild(buildRow(t('agents.row.before'), agent.before));
    
    // Merge time rows
    body.appendChild(buildTimeRow(agent.timeBefore, agent.timeNow));
    
    // Ahorro estimado - highlighted
    body.appendChild(buildRow(t('agents.row.savings'), agent.timeSavings, true));
    
    // Impacto - expandable
    body.appendChild(buildExpandableRow(t('agents.row.impact'), agent.impact));
    
    // Notas - expandable if exists
    if (agent.notes) {
      body.appendChild(buildExpandableRow(t('agents.row.notes'), agent.notes));
    }

    card.appendChild(body);
    elements.agentsList.appendChild(card);
  });
}

function buildRow(label, text, highlight = false) {
  const row = createElement("div", highlight ? "agentRow highlight" : "agentRow");
  const labelEl = createElement("div", "agentRowLabel", label);
  const textEl = createElement("div", "agentRowText", text);
  row.appendChild(labelEl);
  row.appendChild(textEl);
  return row;
}

function buildTimeRow(timeBefore, timeNow) {
  const row = createElement("div", "agentRow");
  const labelEl = createElement("div", "agentRowLabel", t('agents.row.time'));
  const textEl = createElement("div", "agentRowText");

  const beforeItalic = document.createElement("em");
  beforeItalic.textContent = t('agents.row.timeBefore');
  textEl.appendChild(beforeItalic);
  textEl.appendChild(document.createTextNode(` ${timeBefore}  ·  `));

  const nowItalic = document.createElement("em");
  nowItalic.textContent = t('agents.row.timeNow');
  textEl.appendChild(nowItalic);
  textEl.appendChild(document.createTextNode(` ${timeNow}`));

  row.appendChild(labelEl);
  row.appendChild(textEl);
  return row;
}

function buildExpandableRow(label, text) {
  const MAX_CHARS = 120;
  const isLong = text.length > MAX_CHARS;
  const displayText = isLong ? text.substring(0, MAX_CHARS) + "..." : text;

  const row = createElement("div", "agentRow expandable");
  const labelEl = createElement("div", "agentRowLabel", label);
  row.appendChild(labelEl);

  const textContainer = createElement("div", "agentRowExpandContainer");
  const textEl = createElement("div", "agentRowText", displayText);
  textEl.dataset.fullText = text;
  textEl.dataset.displayText = displayText;
  textEl.classList.add("expandable-text");
  textContainer.appendChild(textEl);

  if (isLong) {
    const toggleBtn = createElement("button", "expandToggleBtn", t('agents.row.seeMore'));
    toggleBtn.type = "button";
    toggleBtn.dataset.expanded = "false";
    toggleBtn.addEventListener("click", () => {
      const isExpanded = toggleBtn.dataset.expanded === "true";
      if (isExpanded) {
        textEl.textContent = textEl.dataset.displayText;
        toggleBtn.textContent = t('agents.row.seeMore');
        toggleBtn.dataset.expanded = "false";
      } else {
        textEl.textContent = textEl.dataset.fullText;
        toggleBtn.textContent = t('agents.row.seeLess');
        toggleBtn.dataset.expanded = "true";
      }
    });
    textContainer.appendChild(toggleBtn);
  }

  row.appendChild(textContainer);
  return row;
}

function toggleCardExpand(card, ...blocks) {
  // Placeholder for future functionality
}

function buildBlock(label, text) {
  const block = createElement("div", "agentBlock");
  block.appendChild(createElement("div", "agentLabel", label));
  const p = createElement("p", "agentText", text);
  block.appendChild(p);
  return block;
}

function buildPromptBlock(prompt) {
  const block = createElement("div", "agentBlock");
  block.appendChild(createElement("div", "agentLabel", "Ejemplo de prompt"));
  const box = createElement("div", "promptBox");
  box.classList.add("visible");
  box.appendChild(createElement("pre", "promptText", prompt));
  block.appendChild(box);
  return block;
}

function buildImpactBlock(impact, metric) {
  const block = createElement("div", "agentBlock");
  block.appendChild(createElement("div", "agentLabel", "Impacto"));
  const list = createElement("ul", "impactList");
  (impact || []).forEach((item) => {
    list.appendChild(createElement("li", "", item));
  });
  if (metric) {
    const metricItem = createElement("li");
    metricItem.appendChild(createElement("span", "impactMetric", metric));
    list.appendChild(metricItem);
  }
  block.appendChild(list);
  return block;
}

function renderTeamOptions() {
  const teams = Array.from(new Set(agentsData.map((agent) => agent.team))).sort();
  teams.forEach((team) => {
    const option = createElement("option", "", team);
    option.value = team;
    elements.teamFilter.appendChild(option);
  });
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const team = elements.teamFilter.value;
  const dpc = elements.dpcFilter.value;

  const filtered = agentsData.filter((agent) => {
    if (team && agent.team !== team) {
      return false;
    }
    if (dpc && agent.dpcLevel !== dpc) {
      return false;
    }
    if (query) {
      const haystack = [
        agent.title,
        agent.before,
        agent.impact,
        agent.team
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  elements.resultsCount.textContent = t('agents.results', { shown: filtered.length, total: agentsData.length });
  elements.emptyState.style.display = filtered.length ? "none" : "block";
  renderAgents(filtered);
}

function resetFilters() {
  elements.searchInput.value = "";
  elements.teamFilter.value = "";
  elements.dpcFilter.value = "";
  applyFilters();
}

function setupReadMore() {
  // Placeholder for future functionality
}

function handlePromptAction(event) {
  // Placeholder for future functionality
}

renderTeamOptions();
applyFilters();

elements.searchInput.addEventListener("input", applyFilters);
elements.teamFilter.addEventListener("change", applyFilters);
elements.dpcFilter.addEventListener("change", applyFilters);
elements.resetButton.addEventListener("click", resetFilters);

// Re-render on language change
window.addEventListener('languageChanged', applyFilters);
