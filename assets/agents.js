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
    tags: ["HR", "Policy", "Knowledge"],
    problem: "Interpretar articulos y clausulas del convenio para responder consultas internas de forma consistente.",
    whenToUse: "Cuando hay dudas sobre condiciones laborales o cambios normativos.",
    description: "Responde preguntas, cita secciones clave y resume implicaciones para managers y RRHH.",
    examplePrompt: "Resume el articulo sobre jornada y dame un checklist para managers.",
    impactBullets: [
      "Respuestas alineadas y trazables.",
      "Menos consultas ad hoc a RRHH."
    ],
    timeSavingsText: "⏱ -17 min/consulta",
    dpcLevel: "DPC 0"
  },
  {
    id: "email-drafter",
    title: "Corporate Email Drafter",
    team: "Comunicacion Corporativa",
    type: "Prompt estructurado",
    tags: ["Comunicacion", "Clientes", "Marca"],
    problem: "Redactar correos ejecutivos claros y alineados al tono corporativo consume tiempo.",
    whenToUse: "Al comunicar cambios, anuncios o recordatorios a clientes internos o externos.",
    description: "Genera borradores con estructura, call to action y tono profesional consistente.",
    examplePrompt: "Redacta un email a clientes anunciando cambio de horario de soporte.",
    impactBullets: [
      "Mayor velocidad de redaccion.",
      "Mensajes consistentes en estilo y tono."
    ],
    timeSavingsText: "⏱ -12 min/email",
    dpcLevel: "DPC 1"
  },
  {
    id: "local-apps",
    title: "Generador de Apps Locales",
    team: "IT Enablement",
    type: "Proyecto",
    tags: ["Prototipos", "Productividad", "Operaciones"],
    problem: "Crear prototipos internos suele depender de ciclos largos de desarrollo.",
    whenToUse: "Para validar rapidamente un flujo antes de invertir en desarrollo completo.",
    description: "Convierte requerimientos en una app local con UI basica, datos mock y flujo completo.",
    examplePrompt: "Crea una app local para registrar incidencias con formulario y tabla.",
    impactBullets: [
      "Prototipado mas rapido.",
      "Validacion temprana con usuarios."
    ],
    timeSavingsText: "⏱ -3 dias por iteracion",
    dpcLevel: "DPC 2"
  },
  {
    id: "prompt-refiner",
    title: "Refinador de Prompts",
    team: "Enablement IA",
    type: "Prompt puntual",
    tags: ["Calidad", "Prompts", "Formacion"],
    problem: "Prompts inconsistentes generan respuestas poco utiles y mas iteraciones.",
    whenToUse: "Antes de ejecutar un prompt critico o reutilizable en equipos.",
    description: "Analiza el prompt base, detecta huecos y devuelve una version optimizada.",
    examplePrompt: "Mejora este prompt para obtener un resumen ejecutivo con KPIs.",
    impactBullets: [
      "Mejora la calidad de respuestas.",
      "Reduce iteraciones de ajuste."
    ],
    timeSavingsText: "⏱ -8 min/iteracion",
    dpcLevel: "DPC 0"
  },
  {
    id: "training-plans",
    title: "Planes de formacion personalizados",
    team: "Talent & Learning",
    type: "Proyecto",
    tags: ["Formacion", "Upskilling", "Roadmaps"],
    problem: "Definir planes de formacion consistentes para perfiles diversos consume tiempo y esfuerzo.",
    whenToUse: "Cuando se necesita un plan de aprendizaje por rol o nivel de seniority.",
    description: "Genera planes de formacion con objetivos, contenidos y calendario sugerido.",
    examplePrompt: "Crea un plan de formacion de 8 semanas para un analyst de datos junior.",
    impactBullets: [
      "Acelera la planificacion.",
      "Mejora la consistencia entre equipos."
    ],
    dpcLevel: "DPC 1"
  }
];

const elements = {
  searchInput: document.getElementById("searchInput"),
  typeFilter: document.getElementById("typeFilter"),
  teamFilter: document.getElementById("teamFilter"),
  dpcFilter: document.getElementById("dpcFilter"),
  resetButton: document.getElementById("resetFilters"),
  tagsContainer: document.getElementById("popularTags"),
  resultsCount: document.getElementById("resultsCount"),
  agentsList: document.getElementById("agentsList"),
  emptyState: document.getElementById("emptyState"),
  toast: document.getElementById("agentsToast")
};

let selectedTag = "";

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

    const header = createElement("div", "agentHeader");
    const headerLeft = createElement("div");
    headerLeft.appendChild(createElement("h2", "agentTitle", agent.title));
    headerLeft.appendChild(createElement("div", "agentTeam", `Equipo: ${agent.team}`));
    header.appendChild(headerLeft);
    header.appendChild(createElement("span", "dpcBadge", agent.dpcLevel));
    card.appendChild(header);

    const tagRow = createElement("div", "tagRow");
    agent.tags.forEach((tag) => {
      tagRow.appendChild(createElement("span", "tagChip", tag));
    });
    card.appendChild(tagRow);

    card.appendChild(buildBlock("Problema", agent.problem));
    card.appendChild(buildBlock("Cuando usarlo", agent.whenToUse));
    card.appendChild(buildBlock("Descripcion", agent.description));
    card.appendChild(buildPromptBlock(agent.examplePrompt));
    card.appendChild(buildImpactBlock(agent.impactBullets, agent.timeSavingsText));

    elements.agentsList.appendChild(card);
  });

  setupReadMore();
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
  box.appendChild(createElement("pre", "promptText", prompt));

  const actions = createElement("div", "promptActions");
  const copyBtn = createElement("button", "copyPromptBtn", "Copiar prompt");
  copyBtn.setAttribute("data-copy", prompt);
  const openBtn = createElement("button", "openChatBtn", "Abrir en ChatGPT");
  openBtn.setAttribute("data-copy", prompt);
  actions.appendChild(copyBtn);
  actions.appendChild(openBtn);

  box.appendChild(actions);
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

function renderTagChips() {
  const tagCounts = new Map();
  agentsData.forEach((agent) => {
    agent.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const tags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  elements.tagsContainer.innerHTML = "";
  tags.forEach((tag) => {
    const chip = createElement("span", "tagChip filterChip", tag);
    chip.dataset.tag = tag;
    elements.tagsContainer.appendChild(chip);
  });
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const type = elements.typeFilter.value;
  const team = elements.teamFilter.value;
  const dpc = elements.dpcFilter.value;

  const filtered = agentsData.filter((agent) => {
    if (type && agent.type !== type) {
      return false;
    }
    if (team && agent.team !== team) {
      return false;
    }
    if (dpc && agent.dpcLevel !== dpc) {
      return false;
    }
    if (selectedTag && !agent.tags.includes(selectedTag)) {
      return false;
    }
    if (query) {
      const haystack = [
        agent.title,
        agent.problem,
        agent.description,
        agent.whenToUse,
        agent.tags.join(" ")
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });

  elements.resultsCount.textContent = `Mostrando ${filtered.length} de ${agentsData.length}`;
  elements.emptyState.style.display = filtered.length ? "none" : "block";
  renderAgents(filtered);
}

function clearTagSelection() {
  selectedTag = "";
  elements.tagsContainer.querySelectorAll(".filterChip").forEach((chip) => {
    chip.classList.remove("isActive");
  });
}

function handleTagClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const chip = target.closest(".filterChip");
  if (!chip) {
    return;
  }

  const tag = chip.dataset.tag || "";
  if (selectedTag === tag) {
    clearTagSelection();
  } else {
    clearTagSelection();
    selectedTag = tag;
    chip.classList.add("isActive");
  }
  applyFilters();
}

function resetFilters() {
  elements.searchInput.value = "";
  elements.typeFilter.value = "";
  elements.teamFilter.value = "";
  elements.dpcFilter.value = "";
  clearTagSelection();
  applyFilters();
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        resolve();
      } else {
        reject(new Error("copy-failed"));
      }
    } catch (error) {
      document.body.removeChild(textarea);
      reject(error);
    }
  });
}

function showCopyFeedback(button, message, fallbackLabel) {
  const original = button.textContent;
  button.textContent = message;
  button.setAttribute("aria-live", "polite");
  setTimeout(() => {
    button.textContent = original || fallbackLabel;
  }, 1500);
}

let toastTimeout;
function showToast(message) {
  if (!elements.toast) {
    return;
  }
  elements.toast.textContent = message;
  elements.toast.classList.add("isVisible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    elements.toast.classList.remove("isVisible");
  }, 1500);
}

function setupReadMore() {
  const textBlocks = elements.agentsList.querySelectorAll(".agentText");
  textBlocks.forEach((textBlock) => {
    const computed = window.getComputedStyle(textBlock);
    const lineHeight = parseFloat(computed.lineHeight) || 18;
    const maxHeight = lineHeight * 2.05;
    if (textBlock.scrollHeight <= maxHeight) {
      return;
    }

    textBlock.classList.add("isCollapsed");
    const button = createElement("button", "readMoreBtn", "Leer mas");
    button.setAttribute("type", "button");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const isCollapsed = textBlock.classList.toggle("isCollapsed");
      button.textContent = isCollapsed ? "Leer mas" : "Leer menos";
      button.setAttribute("aria-expanded", (!isCollapsed).toString());
    });

    textBlock.parentElement.appendChild(button);
  });
}

function handlePromptAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const copyButton = target.closest(".copyPromptBtn");
  const openButton = target.closest(".openChatBtn");
  const button = copyButton || openButton;
  if (!button) {
    return;
  }

  const text = button.getAttribute("data-copy");
  if (!text) {
    return;
  }

  const defaultLabel = copyButton ? "Copiar prompt" : "Abrir en ChatGPT";

  copyTextToClipboard(text)
    .then(() => {
      if (copyButton) {
        showCopyFeedback(button, "✅ Copiado", defaultLabel);
        showToast("Prompt copiado al portapapeles");
      } else {
        showCopyFeedback(button, "✅ Prompt copiado, abre ChatGPT", defaultLabel);
        showToast("Prompt copiado, abriendo ChatGPT");
        window.open("https://chatgpt.com/", "_blank", "noopener");
      }
    })
    .catch(() => {
      if (copyButton) {
        showCopyFeedback(button, "No disponible", defaultLabel);
        showToast("No se pudo copiar el prompt");
      } else {
        showCopyFeedback(button, "⚠️ No se pudo copiar", defaultLabel);
        showToast("No se pudo copiar, abriendo ChatGPT");
        window.open("https://chatgpt.com/", "_blank", "noopener");
      }
    });
}

renderTeamOptions();
renderTagChips();
applyFilters();

elements.searchInput.addEventListener("input", applyFilters);
elements.typeFilter.addEventListener("change", applyFilters);
elements.teamFilter.addEventListener("change", applyFilters);
elements.dpcFilter.addEventListener("change", applyFilters);
elements.resetButton.addEventListener("click", resetFilters);
elements.tagsContainer.addEventListener("click", handleTagClick);
document.addEventListener("click", handlePromptAction);
