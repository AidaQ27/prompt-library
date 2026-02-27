// Plantillas Ejecutivas - Main Logic
let frameworks = [];
let selectedFramework = null;
let formValues = {}; // Store user input values

// Load frameworks from JSON with security validation
async function loadFrameworks() {
  try {
    frameworks = await secureFetch('executive_frameworks.json');
    renderFrameworkTabs();
    // Auto-select first framework
    if (frameworks.length > 0) {
      selectFramework(frameworks[0].id);
    }
  } catch (error) {
    console.error('Error loading frameworks:', error);
    document.getElementById('frameworkTabs').innerHTML = '<div class="error">Error al cargar plantillas: ' + escapeHtml(error.message) + '</div>';
  }
}

// Render the list of framework tabs (safe from XSS)
function renderFrameworkTabs() {
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
    titleSpan.textContent = fw.title;
    button.appendChild(titleSpan);
    
    // Status badge
    if (fw.status) {
      const badge = document.createElement('span');
      badge.className = `statusBadge statusBadge--${fw.status}`;
      badge.textContent = fw.status === 'nuevo' ? 'Nuevo' : 'Próximamente';
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
    badgeContainer.innerHTML = `<span class="badge">Plantilla actual: ${selectedFramework.title}</span>`;
  }
}

// Render the selected framework detail with form
function renderFrameworkDetail() {
  const detailContainer = document.getElementById('frameworkDetail');
  
  if (!selectedFramework) {
    detailContainer.innerHTML = '<div class="emptyState">Selecciona una plantilla de la lista</div>';
    return;
  }

  // Clear and build safely
  detailContainer.innerHTML = '';
  
  // Header
  const header = document.createElement('div');
  header.className = 'frameworkHeader';
  
  const title = document.createElement('h2');
  title.textContent = selectedFramework.title;
  
  const desc = document.createElement('p');
  desc.className = 'frameworkDescription';
  desc.textContent = selectedFramework.description;
  
  header.appendChild(title);
  header.appendChild(desc);
  detailContainer.appendChild(header);
  
  // Prompt Builder
  const builder = document.createElement('div');
  builder.className = 'promptBuilder';
  
  const builderTitle = document.createElement('h3');
  builderTitle.textContent = '✏️ Rellena tu prompt';
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
  resetBtn.textContent = '🔄 Reset';
  resetBtn.addEventListener('click', resetForm);
  
  const copyTemplateBtn = document.createElement('button');
  copyTemplateBtn.className = 'actionButton primary';
  copyTemplateBtn.textContent = '📋 Copiar plantilla';
  copyTemplateBtn.addEventListener('click', copyTemplateToClipboard);
  
  const copyFinalBtn = document.createElement('button');
  copyFinalBtn.className = 'actionButton primary';
  copyFinalBtn.id = 'copyFinalBtn';
  copyFinalBtn.textContent = '✅ Copiar prompt final';
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
  previewLabel.textContent = '👁️ Vista previa del prompt final';
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
}

// Render dynamic form inputs based on field definitions with sections
function renderDynamicForm() {
  const formContainer = document.getElementById('dynamicForm');
  if (!formContainer) return;

  // Group fields by section
  const basicFields = selectedFramework.fields.filter(f => f.section === 'basic');
  const contextoFields = selectedFramework.fields.filter(f => f.section === 'contexto_operativo');
  const okrsFields = selectedFramework.fields.filter(f => f.section === 'okrs');
  const governanceFields = selectedFramework.fields.filter(f => f.section === 'governance');

  let html = '';

  // Basic section (always visible)
  html += `<div class="formSection formSectionBasic">`;
  html += basicFields.map(field => renderField(field)).join('');
  html += `</div>`;

  // Advanced sections (collapsible)
  if (contextoFields.length > 0 || okrsFields.length > 0 || governanceFields.length > 0) {
    html += `
      <div class="advancedSectionCard">
        <div class="advancedSectionToggle" data-toggle="advanced">
          <span class="toggleIcon" id="advancedToggleIcon">▶</span>
          <span class="toggleLabel">Opciones Avanzadas (Contexto Operativo, OKRs, Governance)</span>
        </div>
        <div class="advancedSection" id="advancedSection">
    `;
    
    // Setup toggle delegation after rendering
    setTimeout(() => {
      const toggle = document.querySelector('[data-toggle="advanced"]');
      if (toggle && !toggle.hasEventListener) {
        toggle.hasEventListener = true;
        toggle.addEventListener('click', toggleAdvancedSection);
      }
    }, 0);

    // Contexto Operativo
    if (contextoFields.length > 0) {
      html += `
        <div class="formSectionHeader">
          <h4>📊 Contexto Operativo</h4>
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
          <h4>🎯 OKRs</h4>
        </div>
        <div class="formSection">
          ${okrsFields.map(field => renderField(field)).join('')}
        </div>
      `;
    }

    // Governance Toggles
    if (governanceFields.length > 0) {
      html += `
        <div class="formSectionHeader">
          <h4>⚙️ Governance</h4>
        </div>
        <div class="formSection formSectionGovernance">
          ${governanceFields.map(field => renderField(field)).join('')}
        </div>
      `;
    }

    html += `</div></div>`; // Close advancedSection and advancedSectionCard
  }

  formContainer.innerHTML = html;
}

// Render individual field (safe from inline XSS via data attributes)
function renderField(field) {
  const fieldId = `field_${field.name}`;
  const isRequired = field.required ? '<span class="required">*</span>' : '';
  
  let inputHTML = '';
  
  switch (field.type) {
    case 'textarea':
      inputHTML = `<textarea 
        id="${fieldId}" 
        class="formTextarea" 
        placeholder="Escribe aquí..."
      >${formValues[field.name] || ''}</textarea>`;
      break;
      
    case 'select':
      const options = field.options || [];
      inputHTML = `<select 
        id="${fieldId}" 
        class="formSelect"
      >
        <option value="">Selecciona...</option>
        ${options.map(opt => `
          <option value="${opt}" ${formValues[field.name] === opt ? 'selected' : ''}>
            ${opt}
          </option>
        `).join('')}
      </select>`;
      break;
      
    case 'checkbox':
      const checked = formValues[field.name] === true ? 'checked' : '';
      inputHTML = `
        <div class="checkboxWrapper">
          <input 
            type="checkbox" 
            id="${fieldId}" 
            class="formCheckbox"
            ${checked}
          />
          <label class="checkboxLabel" for="${fieldId}">${field.hint}</label>
        </div>
      `;
      break;
      
    case 'text':
    default:
      inputHTML = `<input 
        type="text" 
        id="${fieldId}" 
        class="formInput" 
        placeholder="Escribe..."
        value="${formValues[field.name] || ''}"
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
        ${field.name.replace(/_/g, ' ')} ${isRequired}
      </label>
      ${inputHTML}
      <span class="fieldHelper">${field.hint}</span>
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
  previewText = previewText.replace(/\[CONTEXTO_OPERATIVO\]/g, '');
  previewText = previewText.replace(/\[OKRS\]/g, '');
  previewText = previewText.replace(/\[DECISION_FRAMEWORK\]/g, '');
  previewText = previewText.replace(/\[EXECUTIVE_OUTPUT\]/g, '');
  previewText = previewText.replace(/\[GOVERNANCE_CADENCE\]/g, '');
  previewText = previewText.replace(/\[ANALYSIS_OPTIONS\]/g, '');
  previewText = previewText.replace(/\[RISKS_MITIGATION\]/g, '');
  
  // Clean up multiple consecutive line breaks
  previewText = previewText.replace(/\n{3,}/g, '\n\n');

  // Preserve line breaks
  previewText = previewText.replace(/\n/g, '<br>');
  previewContainer.innerHTML = previewText;
}

// Process injectable sections based on toggles and field values
function processInjectables(promptText) {
  if (!selectedFramework.injectables) return promptText;
  
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
  
  return promptText;
}

// Process injectables for final copy (plain text, no HTML)
function processInjectablesForCopy(promptText) {
  if (!selectedFramework.injectables) return promptText;
  
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
    showCopyFeedback('Plantilla copiada al portapapeles');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert('No se pudo copiar al portapapeles.');
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
  finalPrompt = finalPrompt.replace(/\n{3,}/g, '\n\n');
  finalPrompt = finalPrompt.trim();
  
  try {
    await navigator.clipboard.writeText(finalPrompt);
    showCopyFeedback('Prompt final copiado al portapapeles');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert('No se pudo copiar al portapapeles.');
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
