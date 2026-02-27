fetch("/agents.json")
  .then((res) => res.json())
  .then((agents) => {
    const agentsList = document.getElementById("agentsList");
    const wizardContainer = document.getElementById("wizardContainer");

    function showListView() {
      agentsList.style.display = "";
      wizardContainer.style.display = "none";
    }

    function showWizardView() {
      agentsList.style.display = "none";
      wizardContainer.style.display = "block";
    }

    // Render agents list (safe - no innerHTML with user data)
    function renderAgentsList() {
      agentsList.innerHTML = "";
      agents.forEach((agent) => {
        const card = document.createElement("div");
        card.className = "agentCard";
        
        // Icon (safe - emojis/symbols only)
        const iconDiv = createSafeElement("div", agent.icon, {}, "agentIcon");
        
        // Title (escaped text)
        const title = createSafeElement("h2", agent.name);
        
        // Description (escaped text)
        const desc = createSafeElement("p", agent.description);
        
        // Button (text is safe literal)
        const btn = createSafeElement("button", "Iniciar Wizard →", {}, "startWizardBtn");
        btn.addEventListener("click", () => {
          startWizard(agent);
        });
        
        card.appendChild(iconDiv);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(btn);
        agentsList.appendChild(card);
      });
    }

    // Start wizard
    function startWizard(agent) {
      showWizardView();
      wizardContainer.innerHTML = "";

      const wizard = new PromptWizard(agent, () => {
        showListView();
      });

      wizard.render(wizardContainer);
    }

    // Wizard logic
    class PromptWizard {
      constructor(agent, onBack) {
        this.agent = agent;
        this.onBack = onBack;
        this.currentStep = 0;
        this.answers = {};
      }

      render(container) {
        if (this.currentStep < this.agent.questions.length) {
          this.renderQuestion(container);
        } else {
          this.renderResult(container);
        }
      }

      renderQuestion(container) {
        const question = this.agent.questions[this.currentStep];
        const progress = ((this.currentStep + 1) / this.agent.questions.length) * 100;
        const backButtonText = this.currentStep === 0 ? "← Volver a Agentes" : "← Atrás";

        // Escape dangerous content
        const agentName = escapeHtml(this.agent.name);
        const questionTitle = escapeHtml(question.title);
        const questionHelp = escapeHtml(question.help);
        const placeholderText = escapeHtml(question.placeholder || "");

        const html = `
          <div class="wizardBox">
            <div class="wizardHeader">
              <h2>${agentName}</h2>
              <div class="wizardProgress">
                <div class="progressBar" style="width:${progress}%"></div>
              </div>
              <div class="stepCounter">Paso ${this.currentStep + 1} de ${this.agent.questions.length}</div>
            </div>

            <div class="wizardContent">
              <div class="questionBox">
                <label class="questionTitle">${questionTitle}</label>
                <p class="questionHelp">${questionHelp}</p>

                ${
                  question.type === "text"
                    ? `<input type="text" id="answer" placeholder="${placeholderText}" class="wizardInput" />`
                    : `<select id="answer" class="wizardSelect">
                        <option value="">Selecciona una opción...</option>
                        ${question.options.map((opt) => `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`).join("")}
                      </select>`
                }
              </div>

              <div class="wizardButtons">
                <button class="backBtn">${backButtonText}</button>
                <button class="nextBtn">Siguiente →</button>
              </div>
            </div>
          </div>
        `;

        container.innerHTML = html;

        const input = container.querySelector("#answer");
        const nextBtn = container.querySelector(".nextBtn");
        const backBtn = container.querySelector(".backBtn");

        input.focus();

        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            this.saveAnswer(input.value);
          }
        });

        nextBtn.onclick = () => {
          this.saveAnswer(input.value);
        };

        backBtn.onclick = () => {
          if (this.currentStep === 0) {
            // On first step, return to Agents menu
            this.onBack();
          } else {
            // On other steps, go back one step
            this.currentStep--;
            this.render(container);
          }
        };
      }

      saveAnswer(value) {
        if (!value.trim()) {
          alert("Por favor completa este campo");
          return;
        }

        const question = this.agent.questions[this.currentStep];
        this.answers[question.id] = value;
        this.currentStep++;
        this.render(document.getElementById("wizardContainer"));
      }

      renderResult(container) {
        const generatedPrompt = this.generatePrompt();
        // Escape the generated prompt for safe display
        const safePrompt = escapeHtml(generatedPrompt);

        const html = `
          <div class="wizardBox">
            <div class="wizardHeader">
              <h2>✨ Tu Prompt Gold</h2>
            </div>

            <div class="wizardContent">
              <div class="resultBox">
                <h3>Prompt Generado:</h3>
                <pre class="generatedPrompt">${safePrompt}</pre>
                
                <div class="resultButtons">
                  <button class="copyResultBtn">📋 Copiar Prompt</button>
                  <button class="editBtn">✏️ Editar y Generar de Nuevo</button>
                  <button class="backToAgentsBtn">← Volver a Agentes</button>
                </div>
              </div>
            </div>
          </div>
        `;

        container.innerHTML = html;

        const copyBtn = container.querySelector(".copyResultBtn");
        const editBtn = container.querySelector(".editBtn");
        const backBtn = container.querySelector(".backToAgentsBtn");

        copyBtn.onclick = () => {
          navigator.clipboard.writeText(generatedPrompt).then(() => {
            copyBtn.textContent = "✅ ¡Copiado!";
            setTimeout(() => {
              copyBtn.textContent = "📋 Copiar Prompt";
            }, 2000);
          });
        };

        editBtn.onclick = () => {
          this.currentStep = 0;
          this.answers = {};
          this.render(container);
        };

        backBtn.onclick = () => {
          this.onBack();
        };
      }

      generatePrompt() {
        const obj = this.answers;

        return `Eres un asistente experto especializado en ${obj.objective ? obj.objective.toLowerCase() : "tu solicitud"}.

Contexto:
- Objetivo Principal: ${obj.objective || "No especificado"}
- Audiencia Objetivo: ${obj.audience || "General"}
- Tono Esperado: ${obj.tone || "Profesional"}
- Formato: ${obj.format || "Estructurado"}
- Restricciones: ${obj.constraints || "Ninguna"}

Tarea:
${obj.objective || "Ayúdame a lograr mi objetivo"}

Requisitos:
1. Adapta tu respuesta a la audiencia ${obj.audience || "objetivo"}
2. Usa un tono ${obj.tone || "profesional"}
3. Estructura tu respuesta como: ${obj.format || "contenido estructurado"}
4. Ten en cuenta lo siguiente: ${obj.constraints || "Sin restricciones específicas"}

Proporciona una respuesta clara, accionable y de alta calidad.`;
      }
    }

    // Initial render
    renderAgentsList();
  })
  .catch((e) => console.error("Error:", e));
