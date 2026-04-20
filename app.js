fetch("prompts.json")
  .then((res) => {
    // Validate JSON response
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type');
    if (!ct || !ct.includes('application/json')) {
      throw new Error('Invalid content type: expected application/json');
    }
    return res.json();
  })
  .then((data) => {
    // Fallback escape function if sanitize.js not loaded
    const esc = (str) => {
      if (!str) return '';
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return String(str).replace(/[&<>"']/g, (m) => map[m]);
    };
    const teamSelect = document.getElementById("teamSelect");
    const cards = document.getElementById("cards");
    const searchInput = document.getElementById("searchInput");

    let currentTeam = "";
    let currentQuery = "";

    // Helper: detecta la clave real aunque tenga acentos raros
    function findKey(sample, includesList) {
      const keys = Object.keys(sample || {});
      return keys.find((k) =>
        includesList.some((x) => k.toLowerCase().includes(x))
      );
    }

    const sample = Array.isArray(data) && data.length ? data[0] : {};
    const situationKey = findKey(sample, ["situaci", "problem"]);
    const useCaseKey = findKey(sample, ["use case", "usecase"]);
    const teamKey = findKey(sample, ["equipo", "team"]);
    const valueKey = findKey(sample, ["valor", "beneficio", "value"]);
    const dpcKey = findKey(sample, ["dpc", "nivel de datos"]);
    const saveUpKey = findKey(sample, ["save up", "saveup", "eficiencia"]);

    const promptKey = Object.keys(sample).find(k => k.toLowerCase() === 'prompt') || null;

    // 1) Rellenar selector
    const teams = [
      ...new Set(data.map((r) => (teamKey ? r[teamKey] : "")).filter(Boolean)),
    ];

    teams.forEach((team) => {
      const opt = document.createElement("option");
      opt.value = team;
      opt.textContent = team;
      teamSelect.appendChild(opt);
    });

    // 2) Render
    function render() {
      cards.innerHTML = "";

      const q = (currentQuery || "").toLowerCase().trim();

      data
        .filter((r) => !currentTeam || (teamKey ? r[teamKey] : "") === currentTeam)
        .filter((r) => {
          if (!q) return true;

          const hay = `${(useCaseKey ? r[useCaseKey] : "") || ""} ${
            (situationKey ? r[situationKey] : "") || ""
          } ${(valueKey ? r[valueKey] : "") || ""} ${
            (teamKey ? r[teamKey] : "") || ""
          }`.toLowerCase();

          return hay.includes(q);
        })
        .forEach((r) => {
          const useCase = (useCaseKey ? r[useCaseKey] : "") || "";
          const situation = (situationKey ? r[situationKey] : "") || "";
          const value = (valueKey ? r[valueKey] : "") || "";
          const dpc = (dpcKey ? r[dpcKey] : "") || "";
          const saveUp = (saveUpKey ? r[saveUpKey] : "") || "";
          const team = (teamKey ? r[teamKey] : "") || "";

          const prompt = (promptKey ? r[promptKey] : "") || "";

          const card = document.createElement("div");
          card.className = "card";

          // Escape all user data to prevent XSS
          card.innerHTML = `
            <div class="cardTop">
              <div class="badge">${esc(team)}</div>
              <div class="dpc">${esc(dpc)}</div>
            </div>

            <h3>${esc(useCase)}</h3>

            <p class="desc">
              <b>Situación / problema:</b>
              <span class="descText collapsed">${esc(String(situation))}</span>
              <button class="moreBtn" type="button">Ver más</button>
            </p>

            <div class="valueBox">
              <div class="label">Beneficio</div>
              <div class="text">${esc(String(value))}</div>
            </div>

            <div class="valueBox saveUpBox">
              <div class="label">⏱️ Save up</div>
              <div class="text">${esc(String(saveUp))}</div>
            </div>

            <div class="pills">
              <button class="pillBtn gold pUnified">💡 Prompt</button>
            </div>

            <div class="promptBox">
              <div class="copyRow">
                <button class="copyBtn">Copy</button>
              </div>
            </div>
          `;

          // --- Ver más / Ver menos (JS FUERA del HTML) ---
          const descSpan = card.querySelector(".descText");
          const moreBtn = card.querySelector(".moreBtn");

          const situationText = String(situation || "").trim();
          if (situationText.length < 140) {
            moreBtn.style.display = "none";
            descSpan.classList.remove("collapsed"); // si es corto, lo mostramos entero
          } else {
            moreBtn.onclick = () => {
              const collapsed = descSpan.classList.toggle("collapsed");
              moreBtn.textContent = collapsed ? "Ver más" : "Ver menos";
            };
          }

          // Prompts
          const box = card.querySelector(".promptBox");
          const copyRow = card.querySelector(".copyRow");
          const copyBtn = card.querySelector(".copyBtn");

          function show(text) {
            box.style.display = "block";
            copyRow.style.display = "flex";
            // Set prompt text as a text node before the copyRow
            let textNode = box.querySelector(".promptText");
            if (!textNode) {
              textNode = document.createElement("pre");
              textNode.className = "promptText";
              textNode.style.cssText = "margin:0 0 10px 0;white-space:pre-wrap;font-size:13px;line-height:1.45;";
              box.insertBefore(textNode, copyRow);
            }
            textNode.textContent = text || "(vacío)";
            copyBtn.onclick = () => navigator.clipboard.writeText(text || "");
          }

          card.querySelector(".pUnified").onclick = () => show(prompt);

          cards.appendChild(card);
        });
    }

    // 3) Listeners
    teamSelect.addEventListener("change", () => {
      currentTeam = teamSelect.value;
      render();
    });

    searchInput.addEventListener("input", () => {
      currentQuery = searchInput.value;
      render();
    });

    // 4) Primera renderización
    render();
  })
  .catch((e) => console.error("Error:", e));

