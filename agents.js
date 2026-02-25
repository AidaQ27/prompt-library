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

    // Render agents list
    function renderAgentsList() {
      agentsList.innerHTML = "";
      agents.forEach((agent) => {
        const card = document.createElement("div");
        card.className = "agentCard";
        card.innerHTML = `
          <div class="agentIcon">${agent.icon}</div>
          <h2>${agent.name}</h2>
          <p>${agent.description}</p>
          <button class="startWizardBtn">Iniciar Wizard →</button>
        `;
        card.querySelector(".startWizardBtn").onclick = () => {
          startWizard(agent);
        };
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

        const html = `
          <div class="wizardBox">
            <div class="wizardHeader">
              <h2>${this.agent.name}</h2>
              <div class="wizardProgress">
                <div class="progressBar" style="width:${progress}%"></div>
              </div>
              <div class="stepCounter">Paso ${this.currentStep + 1} de ${this.agent.questions.length}</div>
            </div>

            <div class="wizardContent">
              <div class="questionBox">
                <label class="questionTitle">${question.title}</label>
                <p class="questionHelp">${question.help}</p>

                ${
                  question.type === "text"
                    ? `<input type="text" id="answer" placeholder="${question.placeholder}" class="wizardInput" />`
                    : `<select id="answer" class="wizardSelect">
                        <option value="">Selecciona una opción...</option>
                        ${question.options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("")}
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

        const html = `
          <div class="wizardBox">
            <div class="wizardHeader">
              <h2>✨ Tu Prompt Gold</h2>
            </div>

            <div class="wizardContent">
              <div class="resultBox">
                <h3>Prompt Generado:</h3>
                <pre class="generatedPrompt">${generatedPrompt}</pre>
                
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
