// Plantillas Ejecutivas - Main Logic
let frameworks = [];
let selectedFramework = null;
let formValues = {}; // Store user input values

// Resolve a multilingual string value based on current language.
// Accepts either a plain string (legacy) or { es, ca, en } object.
function getText(value, lang) {
  if (!value && value !== 0) return '';
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value[lang] || value['es'] || '';
  }
  return String(value);
}

// Load frameworks from JSON with security validation
async function loadFrameworks() {
  try {
    frameworks = await secureFetch('executive_frameworks.json');
    renderFrameworkTabs();
    // Auto-select first framework
    if (frameworks.length > 0) {
      selectFramework(frameworks[0].id);
    }
    // Trigger tour after content is ready
    if (typeof window._fwTourCheckAndShow === 'function') {
      window._fwTourCheckAndShow();
    }
  } catch (error) {
    console.error('Error loading frameworks:', error);
    document.getElementById('frameworkTabs').innerHTML = '<div class="error">Error al cargar plantillas: ' + escapeHtml(error.message) + '</div>';
  }
}

// Render the list of framework tabs (safe from XSS)
function renderFrameworkTabs() {
  const lang = getLang();
  console.log('[framework] renderFrameworkTabs | lang:', lang, '| frameworks loaded:', frameworks.length);
  const tabsContainer = document.getElementById('frameworkTabs');
  tabsContainer.innerHTML = ''; // Clear
  
  frameworks.forEach(fw => {
    const isDisabled = fw.status === 'proximamente';
    const button = document.createElement('button');
    button.className = isDisabled ? 'frameworkTab frameworkTab--disabled' : 'frameworkTab';
    button.setAttribute('data-id', fw.id);
    button.disabled = isDisabled;
    
    if (!isDisabled) {
      button.addEventListener('click', () => selectFramework(fw.id));
    }
    
    // Title span
    const titleSpan = document.createElement('span');
    titleSpan.className = 'frameworkTab__title';
    titleSpan.textContent = getText(fw.title, getLang());
    button.appendChild(titleSpan);
    
    // Status badge
    if (fw.status) {
      const badge = document.createElement('span');
      badge.className = `statusBadge statusBadge--${fw.status}`;
      badge.textContent = fw.status === 'nuevo' ? t('status.nuevo') : t('status.proximamente');
      button.appendChild(badge);
    }
    
    tabsContainer.appendChild(button);
  });
}

// Select and display a framework
function selectFramework(id) {
  selectedFramework = frameworks.find(fw => fw.id === id);
  if (!selectedFramework) return;

  // Reset form values for the new framework
  formValues = {};
  selectedFramework.fields.forEach(field => {
    formValues[field.name] = field.default || '';
  });

  // Update active tab
  document.querySelectorAll('.frameworkTab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.id === id);
  });

  renderFrameworkDetail();
  updatePlantillaBadge();
}

// Update the plantilla badge in hero section
function updatePlantillaBadge() {
  const badgeContainer = document.getElementById('currentPlantillaBadge');
  if (badgeContainer && selectedFramework) {
    badgeContainer.innerHTML = `<span class="badge">${escapeHtml(t('builder.badge.current'))} ${escapeHtml(getText(selectedFramework.title, getLang()))}</span>`;
  }
}

// Render the selected framework detail with form
function renderFrameworkDetail() {
  const currentLang = getLang();
  if (selectedFramework) {
    console.log('[framework] renderFrameworkDetail | lang:', currentLang);
    console.log('[framework] template title raw:', selectedFramework.title);
    console.log('[framework] template title rendered:', getText(selectedFramework.title, currentLang));
  }
  const detailContainer = document.getElementById('frameworkDetail');
  
  if (!selectedFramework) {
    detailContainer.innerHTML = '<div class="emptyState">' + escapeHtml(t('framework.empty')) + '</div>';
    return;
  }

  // Clear and build safely
  detailContainer.innerHTML = '';
  
  // Header
  const header = document.createElement('div');
  header.className = 'frameworkHeader';
  
  const title = document.createElement('h2');
  title.textContent = getText(selectedFramework.title, getLang());
  
  const desc = document.createElement('p');
  desc.className = 'frameworkDescription';
  desc.textContent = getText(selectedFramework.description, getLang());
  
  header.appendChild(title);
  header.appendChild(desc);
  detailContainer.appendChild(header);
  
  // Prompt Builder
  const builder = document.createElement('div');
  builder.className = 'promptBuilder';
  
  const builderTitle = document.createElement('h3');
  builderTitle.innerHTML = '<i data-lucide="pencil" class="sectionIcon" aria-hidden="true"></i> ' + escapeHtml(t('builder.title'));
  builder.appendChild(builderTitle);
  
  const formGrid = document.createElement('div');
  formGrid.className = 'formGrid';
  formGrid.id = 'dynamicForm';
  builder.appendChild(formGrid);
  
  // Form Actions
  const actions = document.createElement('div');
  actions.className = 'formActions';
  
  const resetBtn = document.createElement('button');
  resetBtn.className = 'actionButton secondary';
  resetBtn.innerHTML = '<i data-lucide="rotate-ccw" class="btnIcon" aria-hidden="true"></i> ' + escapeHtml(t('builder.reset'));
  resetBtn.addEventListener('click', resetForm);
  
  const copyTemplateBtn = document.createElement('button');
  copyTemplateBtn.className = 'actionButton primary';
  copyTemplateBtn.innerHTML = '<i data-lucide="clipboard" class="btnIcon" aria-hidden="true"></i> ' + escapeHtml(t('builder.copyTemplate'));
  copyTemplateBtn.addEventListener('click', copyTemplateToClipboard);
  
  const copyFinalBtn = document.createElement('button');
  copyFinalBtn.className = 'actionButton primary';
  copyFinalBtn.id = 'copyFinalBtn';
  copyFinalBtn.innerHTML = '<i data-lucide="clipboard-check" class="btnIcon" aria-hidden="true"></i> ' + escapeHtml(t('builder.copyFinal'));
  copyFinalBtn.disabled = true;
  copyFinalBtn.addEventListener('click', copyFinalPromptToClipboard);
  
  actions.appendChild(resetBtn);
  actions.appendChild(copyTemplateBtn);
  actions.appendChild(copyFinalBtn);
  builder.appendChild(actions);
  detailContainer.appendChild(builder);
  
  // Preview
  const preview = document.createElement('div');
  preview.className = 'promptPreview';
  
  const previewHeader = document.createElement('div');
  previewHeader.className = 'previewHeader';
  const previewLabel = document.createElement('span');
  previewLabel.className = 'previewLabel';
  previewLabel.innerHTML = '<i data-lucide="eye" class="sectionIcon" aria-hidden="true"></i> ' + escapeHtml(t('builder.preview'));
  previewHeader.appendChild(previewLabel);
  preview.appendChild(previewHeader);
  
  const previewText = document.createElement('div');
  previewText.className = 'previewText';
  previewText.id = 'promptPreview';
  preview.appendChild(previewText);
  
  detailContainer.appendChild(preview);
  
  renderDynamicForm();
  
  // Setup event delegation for form inputs (security: avoid inline handlers)
  const formContainer = document.getElementById('dynamicForm');
  if (formContainer) {
    formContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('formInput') || 
          e.target.classList.contains('formTextarea') ||
          e.target.classList.contains('formSelect')) {
        const fieldName = e.target.closest('.formField')?.getAttribute('data-field');
        if (fieldName) {
          handleInputChange(fieldName, e.target.value);
        }
      }
    });

    formContainer.addEventListener('change', (e) => {
      if (e.target.classList.contains('formCheckbox')) {
        const fieldName = e.target.closest('.formField')?.getAttribute('data-field');
        if (fieldName) {
          handleInputChange(fieldName, e.target.checked);
        }
      }
    });
  }
  
  updatePreview();
  if (window.lucide) lucide.createIcons();
}

// Render dynamic form inputs based on field definitions with sections
function renderDynamicForm() {
  const formContainer = document.getElementById('dynamicForm');
  if (!formContainer) return;

  // Group fields by section
  const basicFields = selectedFramework.fields.filter(f => f.section === 'basic');
  const contextoFields = selectedFramework.fields.filter(f => f.section === 'contexto_operativo');
  const capitulFields = selectedFramework.fields.filter(f => f.section === 'contexto_capitulo');
  const okrsFields = selectedFramework.fields.filter(f => f.section === 'okrs');
  const governanceFields = selectedFramework.fields.filter(f => f.section === 'governance');
  const tecnicoFields = selectedFramework.fields.filter(f => f.section === 'contexto_tecnico');

  let html = '';

  // Basic section (always visible)
  html += `<div class="formSection formSectionBasic">`;
  html += basicFields.map(field => renderField(field)).join('');
  html += `</div>`;

  // Advanced sections (collapsible)
  if (contextoFields.length > 0 || capitulFields.length > 0 || okrsFields.length > 0 || governanceFields.length > 0 || tecnicoFields.length > 0) {
    html += `
      <div class="advancedSectionCard">
        <div class="advancedSectionToggle" data-toggle="advanced">
          <span class="toggleIcon" id="advancedToggleIcon">▶</span>
          <span class="toggleLabel">${t('builder.advanced')}</span>
        </div>
        <div class="advancedSection" id="advancedSection">`;
    
    // Setup toggle delegation after rendering
    setTimeout(() => {
      const toggle = document.querySelector('[data-toggle="advanced"]');
      if (toggle && !toggle.hasEventListener) {
        toggle.hasEventListener = true;
        toggle.addEventListener('click', toggleAdvancedSection);
      }
    }, 0);

    // Contexto del Chapter
    if (capitulFields.length > 0) {
      html += `
        <div class="formSectionHeader">
          <h4><i data-lucide="users" class="sectionIcon" aria-hidden="true"></i> ${escapeHtml(t('section.contexto_capitulo'))}</h4>
        </div>
        <div class="formSection">
          ${capitulFields.map(field => renderField(field)).join('')}
        </div>
      `;
    }

    // Contexto Operativo
    if (contextoFields.length > 0) {
      html += `
        <div class="formSectionHeader">
          <h4><i data-lucide="bar-chart-2" class="sectionIcon" aria-hidden="true"></i> ${escapeHtml(t('section.contexto_operativo'))}</h4>
        </div>
        <div class="formSection">
          ${contextoFields.map(field => renderField(field)).join('')}
        </div>
      `;
    }

    // OKRs
    if (okrsFields.length > 0) {
      html += `
        <div class="formSectionHeader">
          <h4><i data-lucide="target" class="sectionIcon" aria-hidden="true"></i> ${escapeHtml(t('section.okrs'))}</h4>
        </div>
        <div class="formSection">
          ${okrsFields.map(field => renderField(field)).join('')}
        </div>
      `;
    }

    // Stack Técnico
    if (tecnicoFields.length > 0) {
      html += `
        <div class="formSectionHeader">
          <h4><i data-lucide="wrench" class="sectionIcon" aria-hidden="true"></i> ${escapeHtml(t('section.contexto_tecnico'))}</h4>
        </div>
        <div class="formSection">
          ${tecnicoFields.map(field => renderField(field)).join('')}
        </div>
      `;
    }

    // Governance Toggles
    if (governanceFields.length > 0) {
      html += `
        <div class="formSectionHeader">
          <h4><i data-lucide="settings" class="sectionIcon" aria-hidden="true"></i> ${escapeHtml(t('section.governance'))}</h4>
        </div>
        <div class="formSection formSectionGovernance">
          ${governanceFields.map(field => renderField(field)).join('')}
        </div>
      `;
    }

    html += `</div></div>`; // Close advancedSection and advancedSectionCard
  }

  formContainer.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

// Render individual field (safe from inline XSS via data attributes)
function renderField(field) {
  const lang = getLang();
  const fieldId = `field_${field.name}`;
  const isRequired = field.required ? '<span class="required">*</span>' : '';
  // Use multilingual label if provided, otherwise derive from field name
  const labelText = escapeHtml(getText(field.label || field.name.replace(/_/g, ' '), lang));
  const hintText = escapeHtml(getText(field.hint, lang));
  console.log('[framework] renderField', field.name, '| lang:', lang, '| label:', labelText);

  let inputHTML = '';
  
  switch (field.type) {
    case 'textarea':
      inputHTML = `<textarea 
        id="${fieldId}" 
        class="formTextarea" 
        placeholder="${escapeHtml(t('field.placeholder.textarea'))}"
      >${escapeHtml(formValues[field.name] || '')}</textarea>`;
      break;
      
    case 'select': {
      const options = field.options || [];
      inputHTML = `<select 
        id="${fieldId}" 
        class="formSelect"
      >
        <option value="">${escapeHtml(t('field.select.default'))}</option>
        ${options.map(opt => {
          const optValue = typeof opt === 'object' ? opt.value : opt;
          const optLabel = escapeHtml(typeof opt === 'object' ? getText(opt.label, lang) : opt);
          return `<option value="${escapeHtml(optValue)}" ${formValues[field.name] === optValue ? 'selected' : ''}>${optLabel}</option>`;
        }).join('')}
      </select>`;
      break;
    }
      
    case 'checkbox': {
      const checked = formValues[field.name] === true ? 'checked' : '';
      inputHTML = `
        <div class="checkboxWrapper">
          <input 
            type="checkbox" 
            id="${fieldId}" 
            class="formCheckbox"
            ${checked}
          />
          <label class="checkboxLabel" for="${fieldId}">${hintText}</label>
        </div>
      `;
      break;
    }
      
    case 'text':
    default:
      inputHTML = `<input 
        type="text" 
        id="${fieldId}" 
        class="formInput" 
        placeholder="${escapeHtml(t('field.placeholder.text'))}"
        value="${escapeHtml(formValues[field.name] || '')}"
      />`;
      break;
  }
  
  // For checkbox, different layout
  if (field.type === 'checkbox') {
    return `
      <div class="formField formFieldCheckbox" data-field="${field.name}">
        ${inputHTML}
      </div>
    `;
  }
  
  return `
    <div class="formField ${field.required ? 'required-field' : ''}" data-field="${field.name}">
      <label class="formLabel" for="${fieldId}">
        ${labelText} ${isRequired}
      </label>
      ${inputHTML}
      <span class="fieldHelper">${hintText}</span>
    </div>
  `;
}

// Toggle advanced section with smooth animation
function toggleAdvancedSection() {
  const card = document.querySelector('.advancedSectionCard');
  const section = document.getElementById('advancedSection');
  const icon = document.getElementById('advancedToggleIcon');
  
  if (section.classList.contains('expanded')) {
    section.classList.remove('expanded');
    card.classList.remove('is-open');
    icon.textContent = '▶';
  } else {
    section.classList.add('expanded');
    card.classList.add('is-open');
    icon.textContent = '▼';
  }
}

// Handle input changes
function handleInputChange(fieldName, value) {
  formValues[fieldName] = value;
  updatePreview();
  validateForm();
}

// Update the preview with current values
function updatePreview() {
  const previewContainer = document.getElementById('promptPreview');
  if (!previewContainer) return;

  let previewText = selectedFramework.prompt;
  
  // Process injectables first (conditional sections)
  previewText = processInjectables(previewText);
  
  // Replace placeholders with actual values or keep placeholders if empty
  selectedFramework.fields.forEach(field => {
    // Skip checkbox fields - they're already processed in injectables
    if (field.type === 'checkbox') return;
    
    const value = formValues[field.name] || '';
    const placeholder = `[${field.name}]`;
    
    if (value.trim() !== '') {
      // Replace with actual value wrapped in a span for highlighting
      previewText = previewText.replace(
        new RegExp(escapeRegExp(placeholder), 'g'),
        `<span class="filledValue">${escapeHtml(value)}</span>`
      );
    } else {
      // Keep placeholder but make it stand out as unfilled
      previewText = previewText.replace(
        new RegExp(escapeRegExp(placeholder), 'g'),
        `<span class="unfilledPlaceholder">${placeholder}</span>`
      );
    }
  });

  // Clean up any remaining empty sections
  previewText = previewText.replace(/\[CONTEXTO_CAPITULO\]/g, '');
  previewText = previewText.replace(/\[CONTEXTO_OPERATIVO\]/g, '');
  previewText = previewText.replace(/\[OKRS\]/g, '');
  previewText = previewText.replace(/\[DECISION_FRAMEWORK\]/g, '');
  previewText = previewText.replace(/\[EXECUTIVE_OUTPUT\]/g, '');
  previewText = previewText.replace(/\[GOVERNANCE_CADENCE\]/g, '');
  previewText = previewText.replace(/\[ANALYSIS_OPTIONS\]/g, '');
  previewText = previewText.replace(/\[RISKS_MITIGATION\]/g, '');
  previewText = previewText.replace(/\[INCLUDE_KPIS\]/g, '');
  previewText = previewText.replace(/\[INCLUDE_RISKS\]/g, '');
  previewText = previewText.replace(/\[INCLUDE_ACTION_PLAN\]/g, '');
  previewText = previewText.replace(/\[CONTEXTO_TECNICO\]/g, '');
  previewText = previewText.replace(/\[CRITERIOS_JAVA\]/g, '');
  previewText = previewText.replace(/\[RESTRICCIONES_JAVA\]/g, '');
  
  // Clean up multiple consecutive line breaks
  previewText = previewText.replace(/\n{3,}/g, '\n\n');

  // Preserve line breaks
  previewText = previewText.replace(/\n/g, '<br>');
  previewContainer.innerHTML = previewText;
}

// Process injectable sections based on toggles and field values
function processInjectables(promptText) {
  if (!selectedFramework.injectables) return promptText;
  
  // Check if we should inject CONTEXTO_CAPITULO (Chapter Lead context)
  const hasCapitul = selectedFramework.fields
    .filter(f => f.section === 'contexto_capitulo')
    .some(f => formValues[f.name] && formValues[f.name].trim() !== '');

  if (hasCapitul && selectedFramework.injectables.CONTEXTO_CAPITULO) {
    let capitulText = selectedFramework.injectables.CONTEXTO_CAPITULO;
    selectedFramework.fields.filter(f => f.section === 'contexto_capitulo').forEach(field => {
      const value = formValues[field.name] || '';
      capitulText = capitulText.replace(new RegExp(`\\[${field.name}\\]`, 'g'), value);
    });
    promptText = promptText.replace('[CONTEXTO_CAPITULO]', capitulText);
  } else {
    promptText = promptText.replace('[CONTEXTO_CAPITULO]', '');
  }

  // Check if we should inject CONTEXTO_OPERATIVO
  const hasContexto = selectedFramework.fields
    .filter(f => f.section === 'contexto_operativo')
    .some(f => formValues[f.name] && formValues[f.name].trim() !== '');
  
  if (hasContexto) {
    let contextoText = selectedFramework.injectables.CONTEXTO_OPERATIVO;
    // Replace placeholders in injectable
    selectedFramework.fields.filter(f => f.section === 'contexto_operativo').forEach(field => {
      const value = formValues[field.name] || '';
      contextoText = contextoText.replace(new RegExp(`\\[${field.name}\\]`, 'g'), value);
    });
    promptText = promptText.replace('[CONTEXTO_OPERATIVO]', contextoText);
  } else {
    promptText = promptText.replace('[CONTEXTO_OPERATIVO]', '');
  }
  
  // Check if we should inject OKRS
  const hasOKRs = selectedFramework.fields
    .filter(f => f.section === 'okrs')
    .some(f => formValues[f.name] && formValues[f.name].trim() !== '');
  
  if (hasOKRs) {
    let okrsText = selectedFramework.injectables.OKRS;
    selectedFramework.fields.filter(f => f.section === 'okrs').forEach(field => {
      const value = formValues[field.name] || '';
      okrsText = okrsText.replace(new RegExp(`\\[${field.name}\\]`, 'g'), value);
    });
    promptText = promptText.replace('[OKRS]', okrsText);
  } else {
    promptText = promptText.replace('[OKRS]', '');
  }
  
  // Process governance toggles
  if (formValues['TOGGLE_DECISION_FRAMEWORK'] === true) {
    promptText = promptText.replace('[DECISION_FRAMEWORK]', selectedFramework.injectables.DECISION_FRAMEWORK);
  } else {
    promptText = promptText.replace('[DECISION_FRAMEWORK]', '');
  }
  
  if (formValues['TOGGLE_EXECUTIVE_OUTPUT'] === true) {
    promptText = promptText.replace('[EXECUTIVE_OUTPUT]', selectedFramework.injectables.EXECUTIVE_OUTPUT);
  } else {
    promptText = promptText.replace('[EXECUTIVE_OUTPUT]', '');
  }
  
  if (formValues['TOGGLE_GOVERNANCE_CADENCE'] === true) {
    promptText = promptText.replace('[GOVERNANCE_CADENCE]', selectedFramework.injectables.GOVERNANCE_CADENCE);
  } else {
    promptText = promptText.replace('[GOVERNANCE_CADENCE]', '');
  }
  
  // Process lite framework toggles (if applicable)
  if (formValues['TOGGLE_ANALYSIS_OPTIONS'] === true && selectedFramework.injectables && selectedFramework.injectables.ANALYSIS_OPTIONS) {
    promptText = promptText.replace('[ANALYSIS_OPTIONS]', selectedFramework.injectables.ANALYSIS_OPTIONS);
  } else {
    promptText = promptText.replace('[ANALYSIS_OPTIONS]', '');
  }
  
  if (formValues['TOGGLE_RISKS_MITIGATION'] === true && selectedFramework.injectables && selectedFramework.injectables.RISKS_MITIGATION) {
    promptText = promptText.replace('[RISKS_MITIGATION]', selectedFramework.injectables.RISKS_MITIGATION);
  } else {
    promptText = promptText.replace('[RISKS_MITIGATION]', '');
  }

  // Process Chapter Lead toggles
  if (formValues['TOGGLE_INCLUDE_KPIS'] === true && selectedFramework.injectables && selectedFramework.injectables.INCLUDE_KPIS) {
    promptText = promptText.replace('[INCLUDE_KPIS]', selectedFramework.injectables.INCLUDE_KPIS);
  } else {
    promptText = promptText.replace('[INCLUDE_KPIS]', '');
  }

  if (formValues['TOGGLE_INCLUDE_RISKS'] === true && selectedFramework.injectables && selectedFramework.injectables.INCLUDE_RISKS) {
    promptText = promptText.replace('[INCLUDE_RISKS]', selectedFramework.injectables.INCLUDE_RISKS);
  } else {
    promptText = promptText.replace('[INCLUDE_RISKS]', '');
  }

  if (formValues['TOGGLE_INCLUDE_ACTION_PLAN'] === true && selectedFramework.injectables && selectedFramework.injectables.INCLUDE_ACTION_PLAN) {
    promptText = promptText.replace('[INCLUDE_ACTION_PLAN]', selectedFramework.injectables.INCLUDE_ACTION_PLAN);
  } else {
    promptText = promptText.replace('[INCLUDE_ACTION_PLAN]', '');
  }

  // Check if we should inject CONTEXTO_TECNICO (Java Engineer stack)
  const hasTecnico = selectedFramework.fields
    .filter(f => f.section === 'contexto_tecnico')
    .some(f => formValues[f.name] && formValues[f.name].trim() !== '');

  if (hasTecnico && selectedFramework.injectables && selectedFramework.injectables.CONTEXTO_TECNICO) {
    let tecnicoText = selectedFramework.injectables.CONTEXTO_TECNICO;
    selectedFramework.fields.filter(f => f.section === 'contexto_tecnico').forEach(field => {
      const value = formValues[field.name] || '';
      tecnicoText = tecnicoText.replace(new RegExp(`\\[${field.name}\\]`, 'g'), value);
    });
    promptText = promptText.replace('[CONTEXTO_TECNICO]', tecnicoText);
  } else {
    promptText = promptText.replace('[CONTEXTO_TECNICO]', '');
  }

  return promptText;
}

// Process injectables for final copy (plain text, no HTML)
function processInjectablesForCopy(promptText) {
  if (!selectedFramework.injectables) return promptText;
  
  // Check if we should inject CONTEXTO_CAPITULO (Chapter Lead context)
  const hasCapitul = selectedFramework.fields
    .filter(f => f.section === 'contexto_capitulo')
    .some(f => formValues[f.name] && formValues[f.name].trim() !== '');

  if (hasCapitul && selectedFramework.injectables.CONTEXTO_CAPITULO) {
    let capitulText = selectedFramework.injectables.CONTEXTO_CAPITULO;
    selectedFramework.fields.filter(f => f.section === 'contexto_capitulo').forEach(field => {
      const value = formValues[field.name] || '';
      capitulText = capitulText.replace(new RegExp(`\\[${field.name}\\]`, 'g'), value);
    });
    promptText = promptText.replace('[CONTEXTO_CAPITULO]', capitulText);
  } else {
    promptText = promptText.replace('[CONTEXTO_CAPITULO]', '');
  }

  // Check if we should inject CONTEXTO_OPERATIVO
  const hasContexto = selectedFramework.fields
    .filter(f => f.section === 'contexto_operativo')
    .some(f => formValues[f.name] && formValues[f.name].trim() !== '');
  
  if (hasContexto) {
    let contextoText = selectedFramework.injectables.CONTEXTO_OPERATIVO;
    selectedFramework.fields.filter(f => f.section === 'contexto_operativo').forEach(field => {
      const value = formValues[field.name] || '';
      contextoText = contextoText.replace(new RegExp(`\\[${field.name}\\]`, 'g'), value);
    });
    promptText = promptText.replace('[CONTEXTO_OPERATIVO]', contextoText);
  } else {
    promptText = promptText.replace('[CONTEXTO_OPERATIVO]', '');
  }
  
  // Check if we should inject OKRS
  const hasOKRs = selectedFramework.fields
    .filter(f => f.section === 'okrs')
    .some(f => formValues[f.name] && formValues[f.name].trim() !== '');
  
  if (hasOKRs) {
    let okrsText = selectedFramework.injectables.OKRS;
    selectedFramework.fields.filter(f => f.section === 'okrs').forEach(field => {
      const value = formValues[field.name] || '';
      okrsText = okrsText.replace(new RegExp(`\\[${field.name}\\]`, 'g'), value);
    });
    promptText = promptText.replace('[OKRS]', okrsText);
  } else {
    promptText = promptText.replace('[OKRS]', '');
  }
  
  // Process governance toggles
  if (formValues['TOGGLE_DECISION_FRAMEWORK'] === true) {
    promptText = promptText.replace('[DECISION_FRAMEWORK]', selectedFramework.injectables.DECISION_FRAMEWORK);
  } else {
    promptText = promptText.replace('[DECISION_FRAMEWORK]', '');
  }
  
  if (formValues['TOGGLE_EXECUTIVE_OUTPUT'] === true) {
    promptText = promptText.replace('[EXECUTIVE_OUTPUT]', selectedFramework.injectables.EXECUTIVE_OUTPUT);
  } else {
    promptText = promptText.replace('[EXECUTIVE_OUTPUT]', '');
  }
  
  if (formValues['TOGGLE_GOVERNANCE_CADENCE'] === true) {
    promptText = promptText.replace('[GOVERNANCE_CADENCE]', selectedFramework.injectables.GOVERNANCE_CADENCE);
  } else {
    promptText = promptText.replace('[GOVERNANCE_CADENCE]', '');
  }
  
  // Process lite framework toggles (if applicable)
  if (formValues['TOGGLE_ANALYSIS_OPTIONS'] === true && selectedFramework.injectables && selectedFramework.injectables.ANALYSIS_OPTIONS) {
    promptText = promptText.replace('[ANALYSIS_OPTIONS]', selectedFramework.injectables.ANALYSIS_OPTIONS);
  } else {
    promptText = promptText.replace('[ANALYSIS_OPTIONS]', '');
  }
  
  if (formValues['TOGGLE_RISKS_MITIGATION'] === true && selectedFramework.injectables && selectedFramework.injectables.RISKS_MITIGATION) {
    promptText = promptText.replace('[RISKS_MITIGATION]', selectedFramework.injectables.RISKS_MITIGATION);
  } else {
    promptText = promptText.replace('[RISKS_MITIGATION]', '');
  }

  // Process Chapter Lead toggles
  if (formValues['TOGGLE_INCLUDE_KPIS'] === true && selectedFramework.injectables && selectedFramework.injectables.INCLUDE_KPIS) {
    promptText = promptText.replace('[INCLUDE_KPIS]', selectedFramework.injectables.INCLUDE_KPIS);
  } else {
    promptText = promptText.replace('[INCLUDE_KPIS]', '');
  }

  if (formValues['TOGGLE_INCLUDE_RISKS'] === true && selectedFramework.injectables && selectedFramework.injectables.INCLUDE_RISKS) {
    promptText = promptText.replace('[INCLUDE_RISKS]', selectedFramework.injectables.INCLUDE_RISKS);
  } else {
    promptText = promptText.replace('[INCLUDE_RISKS]', '');
  }

  if (formValues['TOGGLE_INCLUDE_ACTION_PLAN'] === true && selectedFramework.injectables && selectedFramework.injectables.INCLUDE_ACTION_PLAN) {
    promptText = promptText.replace('[INCLUDE_ACTION_PLAN]', selectedFramework.injectables.INCLUDE_ACTION_PLAN);
  } else {
    promptText = promptText.replace('[INCLUDE_ACTION_PLAN]', '');
  }

  // Check if we should inject CONTEXTO_TECNICO (Java Engineer stack)
  const hasTecnicoCopy = selectedFramework.fields
    .filter(f => f.section === 'contexto_tecnico')
    .some(f => formValues[f.name] && formValues[f.name].trim() !== '');

  if (hasTecnicoCopy && selectedFramework.injectables && selectedFramework.injectables.CONTEXTO_TECNICO) {
    let tecnicoText = selectedFramework.injectables.CONTEXTO_TECNICO;
    selectedFramework.fields.filter(f => f.section === 'contexto_tecnico').forEach(field => {
      const value = formValues[field.name] || '';
      tecnicoText = tecnicoText.replace(new RegExp(`\\[${field.name}\\]`, 'g'), value);
    });
    promptText = promptText.replace('[CONTEXTO_TECNICO]', tecnicoText);
  } else {
    promptText = promptText.replace('[CONTEXTO_TECNICO]', '');
  }

  return promptText;
}

// Validate form and enable/disable copy button
function validateForm() {
  const requiredFields = selectedFramework.fields.filter(f => f.required);
  let allValid = true;

  requiredFields.forEach(field => {
    const value = formValues[field.name] || '';
    const fieldElement = document.querySelector(`.formField[data-field="${field.name}"]`);
    
    if (value.trim() === '') {
      allValid = false;
      if (fieldElement) {
        fieldElement.classList.add('invalid');
      }
    } else {
      if (fieldElement) {
        fieldElement.classList.remove('invalid');
      }
    }
  });

  // Enable/disable final copy button
  const copyFinalBtn = document.getElementById('copyFinalBtn');
  if (copyFinalBtn) {
    copyFinalBtn.disabled = !allValid;
  }
}

// Reset form to default values
function resetForm() {
  selectedFramework.fields.forEach(field => {
    formValues[field.name] = field.default || '';
  });
  renderDynamicForm();
  updatePreview();
  validateForm();
}

// Copy the original template to clipboard
async function copyTemplateToClipboard() {
  if (!selectedFramework) return;

  const originalPrompt = selectedFramework.prompt;
  
  try {
    await navigator.clipboard.writeText(originalPrompt);
    showCopyFeedback(t('copy.template'));
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert(t('copy.error'));
  }
}

// Copy the final prompt with filled values to clipboard
async function copyFinalPromptToClipboard() {
  if (!selectedFramework) return;

  let finalPrompt = selectedFramework.prompt;
  
  // Process injectables first
  finalPrompt = processInjectablesForCopy(finalPrompt);
  
  // Replace all placeholders with actual values
  selectedFramework.fields.forEach(field => {
    // Skip checkbox fields
    if (field.type === 'checkbox') return;
    
    const value = formValues[field.name] || '';
    const placeholder = `[${field.name}]`;
    finalPrompt = finalPrompt.replace(new RegExp(escapeRegExp(placeholder), 'g'), value);
  });
  
  // Clean up any remaining placeholders and multiple line breaks
  finalPrompt = finalPrompt.replace(/\[CONTEXTO_OPERATIVO\]/g, '');
  finalPrompt = finalPrompt.replace(/\[OKRS\]/g, '');
  finalPrompt = finalPrompt.replace(/\[DECISION_FRAMEWORK\]/g, '');
  finalPrompt = finalPrompt.replace(/\[EXECUTIVE_OUTPUT\]/g, '');
  finalPrompt = finalPrompt.replace(/\[GOVERNANCE_CADENCE\]/g, '');
  finalPrompt = finalPrompt.replace(/\[ANALYSIS_OPTIONS\]/g, '');
  finalPrompt = finalPrompt.replace(/\[RISKS_MITIGATION\]/g, '');
  finalPrompt = finalPrompt.replace(/\[CONTEXTO_TECNICO\]/g, '');
  finalPrompt = finalPrompt.replace(/\[CRITERIOS_JAVA\]/g, '');
  finalPrompt = finalPrompt.replace(/\[RESTRICCIONES_JAVA\]/g, '');
  finalPrompt = finalPrompt.replace(/\n{3,}/g, '\n\n');
  finalPrompt = finalPrompt.trim();
  
  try {
    await navigator.clipboard.writeText(finalPrompt);
    showCopyFeedback(t('copy.final'));
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert(t('copy.error'));
  }
}

// Show visual feedback when copying
function showCopyFeedback(message) {
  // Create temporary feedback element
  const feedback = document.createElement('div');
  feedback.className = 'copyFeedback';
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    feedback.classList.remove('show');
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Utility: Escape RegExp special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadFrameworks();
});

// Re-render on language change
window.addEventListener('languageChanged', () => {
  if (frameworks.length > 0) renderFrameworkTabs();
  if (selectedFramework) renderFrameworkDetail();
  if (typeof window._fwTourUpdateI18n === 'function') window._fwTourUpdateI18n();
});

// ══════════════════════════════════════════════════════════════════════
// FRAMEWORK ONBOARDING TOUR
// Mirrors the tour system in app.js (index.html).
// localStorage key: 'frameworkTourCompleted'
// Steps target stable selectors in the framework page DOM.
// ══════════════════════════════════════════════════════════════════════
(function () {
  const FW_TOUR_KEY = 'frameworkTourCompleted';

  const FW_TOUR_STEPS = [
    { el: '.frameworkSidebar',    textKey: 'fw.tour.step1.text', pos: 'right'  },
    { el: '#dynamicForm',         textKey: 'fw.tour.step2.text', pos: 'top'    },
    { el: '.advancedSectionCard', textKey: 'fw.tour.step3.text', pos: 'top'    },
    { el: '#promptPreview',       textKey: 'fw.tour.step4.text', pos: 'top'    },
    { el: '.formActions',         textKey: 'fw.tour.step5.text', pos: 'top'    },
  ];

  let _active  = false;
  let _stepIdx = 0;

  // DOM refs — resolved after DOMContentLoaded
  let _welcomeEl, _startBtn, _skipWelcomeBtn,
      _backdropEl, _highlightEl, _tooltipEl,
      _tipText, _progressEl, _prevBtn, _nextBtn, _skipBtn, _replayBtn;

  function _refs() {
    _welcomeEl     = document.getElementById('tourWelcome');
    _startBtn      = document.getElementById('tourStartBtn');
    _skipWelcomeBtn= document.getElementById('tourSkipWelcome');
    _backdropEl    = document.getElementById('tourBackdrop');
    _highlightEl   = document.getElementById('tourHighlight');
    _tooltipEl     = document.getElementById('tourTooltip');
    _tipText       = document.getElementById('tourTooltipText');
    _progressEl    = document.getElementById('tourProgress');
    _prevBtn       = document.getElementById('tourPrevBtn');
    _nextBtn       = document.getElementById('tourNextBtn');
    _skipBtn       = document.getElementById('tourSkipBtn');
    _replayBtn     = document.getElementById('tourReplayBtn');
  }

  function _tr(key) {
    return (typeof t === 'function') ? t(key) : key;
  }

  function _populateWelcome() {
    document.getElementById('tourWelcomeTitle').textContent = _tr('fw.tour.welcome.title');
    document.getElementById('tourWelcomeBody').textContent  = _tr('fw.tour.welcome.body');
    _startBtn.textContent       = _tr('tour.welcome.start');
    _skipWelcomeBtn.textContent = _tr('tour.welcome.skip');
  }

  function _checkAndShow() {
    if (!localStorage.getItem(FW_TOUR_KEY)) {
      setTimeout(() => {
        _populateWelcome();
        _welcomeEl.hidden = false;
      }, 800);
    }
  }

  function _startTour() {
    _welcomeEl.hidden = true;
    _active  = true;
    _stepIdx = 0;
    _showStep(0);
  }

  function _dismissWelcome() {
    _welcomeEl.hidden = true;
    localStorage.setItem(FW_TOUR_KEY, 'true');
  }

  function _showStep(idx) {
    const step   = FW_TOUR_STEPS[idx];
    const target = document.querySelector(step.el);

    // If element is absent (e.g. advanced section not yet open), skip it
    if (!target) {
      if (idx < FW_TOUR_STEPS.length - 1) { _stepIdx = idx + 1; _showStep(idx + 1); }
      else _finishTour();
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const PAD  = 6;

      _highlightEl.style.top    = `${rect.top    - PAD}px`;
      _highlightEl.style.left   = `${rect.left   - PAD}px`;
      _highlightEl.style.width  = `${rect.width  + PAD * 2}px`;
      _highlightEl.style.height = `${rect.height + PAD * 2}px`;
      _highlightEl.hidden = false;
      _backdropEl.hidden  = false;

      _tipText.textContent    = _tr(step.textKey);
      _progressEl.textContent = `${idx + 1} / ${FW_TOUR_STEPS.length}`;
      _prevBtn.hidden         = idx === 0;
      _prevBtn.textContent    = _tr('tour.btn.prev');
      _skipBtn.textContent    = _tr('tour.btn.skip');
      const isLast = idx === FW_TOUR_STEPS.length - 1;
      _nextBtn.textContent    = isLast ? _tr('tour.btn.finish') : _tr('tour.btn.next');

      _positionTooltip(rect, step.pos);
      _tooltipEl.hidden = false;
    }, 300);
  }

  function _positionTooltip(rect, pref) {
    const TW  = 300;
    const vW  = window.innerWidth;
    const vH  = window.innerHeight;
    const pad = 14;
    const tH  = _tooltipEl.offsetHeight || 140;

    const clampL = (l) => Math.max(pad, Math.min(l, vW - TW - pad));
    const clampT = (top) => Math.max(pad, Math.min(top, vH - tH - pad));

    const canBottom = rect.bottom + tH + pad < vH;
    const canTop    = rect.top    - tH - pad > 0;
    const canRight  = rect.right  + TW + pad < vW;

    let top, left;
    if      (pref === 'bottom' && canBottom) { top = rect.bottom + pad; left = clampL(rect.left); }
    else if (pref === 'top'    && canTop)    { top = rect.top - tH - pad; left = clampL(rect.left); }
    else if (pref === 'right'  && canRight)  { top = clampT(rect.top); left = rect.right + pad; }
    else if (canBottom)                      { top = rect.bottom + pad; left = clampL(rect.left); }
    else if (canTop)                         { top = rect.top - tH - pad; left = clampL(rect.left); }
    else                                     { top = (vH - tH) / 2; left = (vW - TW) / 2; }

    _tooltipEl.style.top  = `${top}px`;
    _tooltipEl.style.left = `${left}px`;
  }

  function _nextStep() {
    if (_stepIdx < FW_TOUR_STEPS.length - 1) { _stepIdx++; _showStep(_stepIdx); }
    else _finishTour();
  }

  function _prevStep() {
    if (_stepIdx > 0) { _stepIdx--; _showStep(_stepIdx); }
  }

  function _finishTour() {
    _hideTour();
    localStorage.setItem(FW_TOUR_KEY, 'true');
  }

  function _skipTour() {
    _hideTour();
    localStorage.setItem(FW_TOUR_KEY, 'true');
  }

  function _hideTour() {
    _active = false;
    _backdropEl.hidden  = true;
    _highlightEl.hidden = true;
    _tooltipEl.hidden   = true;
  }

  // Called by languageChanged listener above
  window._fwTourUpdateI18n = function () {
    const rSpan = _replayBtn && _replayBtn.querySelector('span');
    if (rSpan) rSpan.textContent = _tr('tour.btn.replay');
    if (_welcomeEl && !_welcomeEl.hidden) _populateWelcome();
    if (_active) _showStep(_stepIdx);
  };

  document.addEventListener('DOMContentLoaded', () => {
    _refs();

    // Wire welcome modal
    _startBtn.addEventListener('click', _startTour);
    _skipWelcomeBtn.addEventListener('click', _dismissWelcome);

    // Wire tooltip controls
    _nextBtn.addEventListener('click', _nextStep);
    _prevBtn.addEventListener('click', _prevStep);
    _skipBtn.addEventListener('click', _skipTour);

    // Replay floating button
    if (_replayBtn) {
      const rSpan = _replayBtn.querySelector('span');
      if (rSpan) rSpan.textContent = _tr('tour.btn.replay');
      _replayBtn.addEventListener('click', () => {
        _active  = true;
        _stepIdx = 0;
        _showStep(0);
      });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (_welcomeEl && !_welcomeEl.hidden) { _dismissWelcome(); return; }
        if (_active) { _skipTour(); }
      }
    });

    // Show welcome after frameworks finish loading (triggered from loadFrameworks)
    window._fwTourCheckAndShow = _checkAndShow;
  });
}());
