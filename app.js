fetch("prompts.json")
  .then((res) => res.json())
  .then((data) => {
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

    const prompt1Key = findKey(sample, ["prompt 1", "prompt1"]);
    const prompt2Key = findKey(sample, ["prompt 2", "prompt2"]);
    const prompt3Key = findKey(sample, ["prompt 3", "prompt3"]);

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

          const p1 = (prompt1Key ? r[prompt1Key] : "") || "";
          const p2 = (prompt2Key ? r[prompt2Key] : "") || "";
          const p3 = (prompt3Key ? r[prompt3Key] : "") || "";

          const card = document.createElement("div");
          card.className = "card";

          // HTML SOLO (nada de JS dentro)
          card.innerHTML = `
            <div class="cardTop">
              <div class="badge">${(teamKey ? r[teamKey] : "") || ""}</div>
              <div class="dpc">${dpc}</div>
            </div>

            <h3>${useCase}</h3>

            <p class="desc">
              <b>Situación / problema:</b>
              <span class="descText collapsed">${String(situation)}</span>
              <button class="moreBtn" type="button">Ver más</button>
            </p>

            <div class="valueBox">
              <div class="label">Beneficio</div>
              <div class="text">${String(value)}</div>
            </div>

            <div class="valueBox saveUpBox">
              <div class="label">⏱️ Save up</div>
              <div class="text">${String(saveUp)}</div>
            </div>

            <div class="pills">
              <button class="pillBtn p1">💡 Prompt 1</button>
              <button class="pillBtn p2">💡 Prompt 2</button>
              <button class="pillBtn gold p3">💡 Prompt 3</button>
            </div>

            <pre class="promptBox"></pre>
            <div class="copyRow">
              <button class="copyBtn">Copy</button>
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
            box.textContent = text || "(vacío)";
            copyBtn.onclick = () => navigator.clipboard.writeText(text || "");
          }

          card.querySelector(".p1").onclick = () => show(p1);
          card.querySelector(".p2").onclick = () => show(p2);
          card.querySelector(".p3").onclick = () => show(p3);

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

