fetch("prompts.multilang.json")
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
    // ── Safety guard: reject data that still contains dry-run placeholders ──
    if (JSON.stringify(data).includes('[DRY-RUN]')) {
      console.error(
        '[prompts] prompts.multilang.json contains [DRY-RUN] values.\n' +
        'Run the migration first:  node migrate-multilang.js\n' +
        'Then reload the page.'
      );
      const cards = document.getElementById('cards');
      if (cards) {
        cards.innerHTML =
          '<p style="color:#c0392b;padding:24px;font-family:sans-serif">' +
          '⚠️ Translation data not ready — run <code>node migrate-multilang.js</code> and reload.' +
          '</p>';
      }
      return; // stop rendering
    }

    // Fallback escape function if sanitize.js not loaded
    const esc = (str) => {
      if (!str) return '';
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return String(str).replace(/[&<>"']/g, (m) => map[m]);
    };
    // Safe i18n fallback — passes optional vars object through to t() for {key} substitution
    const tr = (key, vars) => (typeof t === 'function' ? t(key, vars) : key);

    const teamSelect    = document.getElementById("teamSelect");
    const cards          = document.getElementById("cards");
    const searchInput    = document.getElementById("searchInput");
    const promptCounter  = document.getElementById("promptCounter");
    const searchChips    = document.getElementById("searchChips");
    const quickGuide     = document.getElementById("quickGuide");
    const qgBtn          = document.getElementById("qgBtn");
    const qgDrawer       = document.getElementById("qgDrawer");
    const qgOverlay      = document.getElementById("qgOverlay");

    // Expected total — used for the ⚠️ warning if the JSON was partially generated
    const TOTAL_EXPECTED = 47;

    let currentTeam = "";
    let currentQuery = "";

    // Tracks the currently expanded promptBox DOM node (one at a time)
    let expandedBox = null;

    // ── Quick Guide state ─────────────────────────────────────────────────────
    // Selections stored as option indices so they survive language changes
    let qgOpen           = false;
    let selectedAction   = null;   // index into qg.q1.opts or null
    let selectedContext  = null;   // index into qg.q2.opts or null
    let selectedResult   = null;   // index into qg.q3.opts or null

    function getOptAt(optsKey, idx) {
      if (idx === null) return '';
      return tr(optsKey).split('|').map(s => s.trim())[idx] || '';
    }

    function openDrawer() {
      qgOpen = true;
      if (qgDrawer)  { qgDrawer.classList.add('qgDrawer--open'); qgDrawer.setAttribute('aria-hidden', 'false'); }
      if (qgOverlay) qgOverlay.classList.add('qgOverlay--visible');
      if (qgBtn)     qgBtn.setAttribute('aria-expanded', 'true');
      renderQuickGuide();
    }

    function closeDrawer() {
      qgOpen = false;
      if (qgDrawer)  { qgDrawer.classList.remove('qgDrawer--open'); qgDrawer.setAttribute('aria-hidden', 'true'); }
      if (qgOverlay) qgOverlay.classList.remove('qgOverlay--visible');
      if (qgBtn)     qgBtn.setAttribute('aria-expanded', 'false');
    }

    function renderQuickGuide() {
      if (!quickGuide) return;
      quickGuide.innerHTML = '';

      const questions = [
        { optsKey: 'qg.q1.opts', titleKey: 'qg.q1.title', sel: selectedAction,
          setter: (i) => { selectedAction  = selectedAction  === i ? null : i; } },
        { optsKey: 'qg.q2.opts', titleKey: 'qg.q2.title', sel: selectedContext,
          setter: (i) => { selectedContext = selectedContext === i ? null : i; } },
        { optsKey: 'qg.q3.opts', titleKey: 'qg.q3.title', sel: selectedResult,
          setter: (i) => { selectedResult  = selectedResult  === i ? null : i; } },
      ];

      questions.forEach(({ optsKey, titleKey, sel, setter }) => {
        const section = document.createElement('div');
        section.className = 'qgSection';

        const title = document.createElement('div');
        title.className = 'qgSectionTitle';
        title.textContent = tr(titleKey);
        section.appendChild(title);

        const chipsRow = document.createElement('div');
        chipsRow.className = 'qgChips';

        tr(optsKey).split('|').map(s => s.trim()).filter(Boolean).forEach((opt, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'qgChip' + (sel === idx ? ' qgChip--selected' : '');
          btn.textContent = opt;
          btn.addEventListener('click', () => {
            setter(idx);
            renderQuickGuide();
          });
          chipsRow.appendChild(btn);
        });

        section.appendChild(chipsRow);
        quickGuide.appendChild(section);
      });

      // ── Button row ──────────────────────────────────────────────────────────
      const btnRow = document.createElement('div');
      btnRow.className = 'qgBtnRow';

      const hasSelection = selectedAction !== null || selectedContext !== null || selectedResult !== null;

      const showBtn = document.createElement('button');
      showBtn.type = 'button';
      showBtn.className = 'qgBtnPrimary';
      showBtn.textContent = tr('qg.btn.show');
      showBtn.disabled = !hasSelection;
      showBtn.addEventListener('click', () => {
        const parts = [
          getOptAt('qg.q1.opts', selectedAction),
          getOptAt('qg.q2.opts', selectedContext),
          getOptAt('qg.q3.opts', selectedResult),
        ].filter(Boolean);
        const query = parts.join(' ');
        if (query) {
          closeDrawer();
          searchInput.value = query;
          currentQuery = query;
          render();
          document.getElementById('cards').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'qgBtnSecondary';
      clearBtn.textContent = tr('qg.btn.clear');
      clearBtn.addEventListener('click', () => {
        selectedAction  = null;
        selectedContext = null;
        selectedResult  = null;
        searchInput.value = '';
        currentQuery = '';
        render();
        renderQuickGuide();
      });

      btnRow.appendChild(showBtn);
      btnRow.appendChild(clearBtn);
      quickGuide.appendChild(btnRow);
    }

    function renderChips() {
      if (!searchChips) return;
      const raw = tr('index.search.chips');
      const chips = raw.split('|').map(s => s.trim()).filter(Boolean);
      searchChips.innerHTML = '';
      const label = document.createElement('span');
      label.className = 'searchChipsLabel';
      label.textContent = tr('index.search.examplesLabel');
      searchChips.appendChild(label);
      chips.forEach(chip => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'searchChip';
        btn.textContent = chip;
        btn.addEventListener('click', () => {
          searchInput.value = chip;
          currentQuery = chip;
          render();
        });
        searchChips.appendChild(btn);
      });
    }

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

    const promptKey  = Object.keys(sample).find(k => k.toLowerCase() === 'prompt') || null;
    const notesKey   = findKey(sample, ['notas', 'notes']) || null;
    const intentKey  = findKey(sample, ['intent']) || null;

    // 1) Rellenar selector
    // Build a deduplicated team map: es-string → raw value (supports {es,ca,en} objects)
    const teamMap = new Map();
    data.forEach((r) => {
      const raw = teamKey ? r[teamKey] : "";
      if (!raw) return;
      const esKey = (raw && typeof raw === 'object') ? (raw.es || '') : String(raw);
      if (esKey && !teamMap.has(esKey)) teamMap.set(esKey, raw);
    });

    function populateTeamSelect(currentLang) {
      // Remove all options except the default "all" option (value="")
      while (teamSelect.options.length > 1) teamSelect.remove(1);
      teamMap.forEach((raw, esKey) => {
        const opt = document.createElement("option");
        opt.value = esKey;  // always the es string — stable key for filtering
        opt.textContent = (raw && typeof raw === 'object')
          ? (raw[currentLang] || raw.es || esKey)
          : esKey;
        teamSelect.appendChild(opt);
      });
      if (currentTeam) teamSelect.value = currentTeam;
    }

    populateTeamSelect((typeof getLang === 'function') ? getLang() : 'es');

    // 2) Render
    function render() {
      // Reset expanded state: re-render destroys all card DOM nodes
      expandedBox = null;

      cards.innerHTML = "";

      // Resolve current UI language with fallback to 'es'
      const lang = (typeof getLang === 'function') ? getLang() : 'es';

      // Helper: resolve a field that may be a multilingual object {es, ca, en}
      // or a plain string. Always returns a string in the current language.
      const tField = (val) => {
        if (val && typeof val === 'object') {
          return val[lang] || val.es || '';
        }
        return String(val || '');
      };

      // Helper: get all language values concatenated (used for search)
      const allLangs = (val) => {
        if (val && typeof val === 'object') return Object.values(val).join(' ');
        return String(val || '');
      };

      // ── Normalized intent-aware search ────────────────────────────────────
      // Strips diacritics, lowercases and removes punctuation so that
      // "quiero resumir una reunión" matches "Resúmenes de reuniones técnicas"
      const normalize = (text) =>
        String(text || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s]/g, ' ');

      const q = (currentQuery || '').trim();

      // Team filter — uses stable es-key, independent of current language
      const teamFiltered = data.filter((r) => {
        if (!currentTeam) return true;
        const val   = teamKey ? r[teamKey] : '';
        const esKey = (val && typeof val === 'object') ? (val.es || '') : String(val || '');
        return esKey === currentTeam;
      });

      // Split query into significant tokens — skip stopwords and short words
      const STOPWORDS = new Set([
        // Spanish articles / prepositions / common verbs
        'que','con','los','las','del','por','una','uno','para','como',
        'son','hay','ser','fue','han','has','mis','sus','nos','les',
        'mas','muy','sin','hay','van','ver','dar','sea','eso','esa',
        // English
        'the','and','for','are','not','you','can','has','was','had',
        'with','this','that','from','will',
      ]);
      const queryWords = normalize(q)
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOPWORDS.has(w));

      // ── Relevance scoring and sort ─────────────────────────────────────────
      let filtered;
      if (!q || queryWords.length === 0) {
        // No active search — show all prompts in original order
        filtered = teamFiltered;
      } else {
        filtered = teamFiltered
          .map((r) => {
            const nUseCase   = normalize(tField(useCaseKey   ? r[useCaseKey]   : ''));
            const nSituation = normalize(tField(situationKey ? r[situationKey] : ''));
            const nIntent    = normalize(tField(intentKey    ? r[intentKey]    : ''));
            const nValue     = normalize(tField(valueKey     ? r[valueKey]     : ''));
            const nPrompt    = normalize(tField(promptKey    ? r[promptKey]    : ''));
            const nTeam      = normalize(tField(teamKey      ? r[teamKey]      : ''));
            const nNotes     = normalize(tField(notesKey     ? r[notesKey]     : ''));
            const nTags      = (() => {
              const raw = r['Tags'];
              if (!raw) return '';
              if (Array.isArray(raw)) return normalize(raw.join(' '));
              if (typeof raw === 'object') return normalize(Object.values(raw).flat().join(' '));
              return '';
            })();

            let score = 0;
            for (const word of queryWords) {
              if (nUseCase.includes(word))   score += 5;
              if (nSituation.includes(word)) score += 3;
              if (nIntent.includes(word))    score += 3;
              if (nValue.includes(word))     score += 2;
              if (nPrompt.includes(word))    score += 1;
              if (nTeam.includes(word))      score += 1;
              if (nNotes.includes(word))     score += 1;
              if (nTags.includes(word))      score += 4;
            }
            return { r, score };
          })
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .map(({ r }) => r);
      }

      // ── Console validation ─────────────────────────────────────────────────
      console.log("Total prompts loaded:", data.length);
      console.log("Total prompts visible:", filtered.length);
      if (data.length < TOTAL_EXPECTED) {
        console.warn(`⚠️ Faltan prompts: cargados ${data.length} de ${TOTAL_EXPECTED}`);
      }

      // ── Update counter element ─────────────────────────────────────────────
      if (promptCounter) {
        if (data.length < TOTAL_EXPECTED) {
          promptCounter.textContent = tr('index.results.warning', {
            loaded: data.length, expected: TOTAL_EXPECTED
          });
          promptCounter.className = 'promptCounter promptCounter--warning';
        } else if (currentTeam || q) {
          promptCounter.textContent = tr('index.results', {
            shown: filtered.length, total: data.length
          });
          promptCounter.className = 'promptCounter';
        } else {
          promptCounter.textContent = tr('index.results.all', { total: data.length });
          promptCounter.className = 'promptCounter';
        }
      }

      filtered.forEach((r) => {
          const useCase  = tField(useCaseKey   ? r[useCaseKey]   : "");
          const situation = tField(situationKey ? r[situationKey] : "");
          const value    = tField(valueKey     ? r[valueKey]     : "");
          const dpc      = (dpcKey    ? r[dpcKey]    : "") || "";
          const saveUp   = tField(saveUpKey    ? r[saveUpKey]    : "");
          const team     = tField(teamKey ? r[teamKey] : "");

          const prompt = tField(promptKey ? r[promptKey] : "");

          // Tags — optional multilingual array field (e.g. Tags: { es:[...], ca:[...], en:[...] })
          const tagsArr = (() => {
            const raw = r['Tags'];
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            if (typeof raw === 'object') return raw[lang] || raw.es || [];
            return [];
          })();
          const tagsHtml = tagsArr.length
            ? '<div class="cardTags">' + tagsArr.slice(0, 5).map(function(t){ return '<span class="cardTag">' + esc(t) + '</span>'; }).join('') + '</div>'
            : '';

          const card = document.createElement("div");
          card.className = "card";

          // Escape all user data to prevent XSS
          card.innerHTML = `
            <div class="cardTop">
              <div class="badge">${esc(team)}</div>
              <div class="dpc">${esc(dpc)}</div>
            </div>

            <h3>${esc(useCase)}</h3>
            ${tagsHtml}

            <p class="desc">
              <b>${esc(tr('card.situation'))}</b>
              <span class="descText collapsed">${esc(String(situation))}</span>
              <button class="moreBtn" type="button">${esc(tr('card.seeMore'))}</button>
            </p>

            <div class="valueBox">
              <div class="label">${esc(tr('card.benefit'))}</div>
              <div class="text">${esc(String(value))}</div>
            </div>

            <div class="valueBox saveUpBox">
              <div class="label"><i data-lucide="clock" class="cardIcon" aria-hidden="true"></i> ${esc(tr('card.saveUp'))}</div>
              <div class="text">${esc(String(saveUp))}</div>
            </div>

            <div class="pills">
              <button type="button" class="pillBtn gold pUnified"><i data-lucide="sparkles" class="cardIcon" aria-hidden="true"></i> ${esc(tr('card.prompt'))}</button>
            </div>

            <div class="promptBox">
              <div class="copyRow">
                <button class="copyBtn">${esc(tr('card.copy'))}</button>
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
              moreBtn.textContent = collapsed ? tr('card.seeMore') : tr('card.seeLess');
            };
          }

          // --- Prompt toggle (open/close inside this card only) ---
          const box     = card.querySelector(".promptBox");
          const copyRow = card.querySelector(".copyRow");
          const copyBtn = card.querySelector(".copyBtn");
          const pBtn    = card.querySelector(".pUnified");

          // Populate the promptBox content once (lazy, on first open)
          function populateBox() {
            let textNode = box.querySelector(".promptText");
            if (!textNode) {
              textNode = document.createElement("pre");
              textNode.className = "promptText";
              textNode.style.cssText = "margin:0 0 10px 0;white-space:pre-wrap;font-size:13px;line-height:1.45;";
              box.insertBefore(textNode, copyRow);
            }
            textNode.textContent = prompt || tr('card.empty');
            copyBtn.onclick = () => navigator.clipboard.writeText(prompt || "");
          }

          // Collapse a given promptBox and reset its button label
          function collapseBox(targetBox) {
            targetBox.style.display = "none";
            const targetCard = targetBox.closest('.card');
            if (targetCard) {
              const targetBtn = targetCard.querySelector('.pUnified');
              if (targetBtn) {
                targetBtn.innerHTML = '<i data-lucide="sparkles" class="cardIcon" aria-hidden="true"></i> ' + esc(tr('card.prompt'));
                if (window.lucide) lucide.createIcons();
              }
            }
          }

          pBtn.addEventListener('click', (e) => {
            // Prevent bubbling to any parent/document click handlers
            e.stopPropagation();

            const isOpen = box.style.display === "block";

            // Always close the previously expanded card first
            if (expandedBox && expandedBox !== box) {
              collapseBox(expandedBox);
              expandedBox = null;
            }

            if (isOpen) {
              // Toggle off: close this card's prompt
              box.style.display = "none";
              expandedBox = null;
              pBtn.innerHTML = '<i data-lucide="sparkles" class="cardIcon" aria-hidden="true"></i> ' + esc(tr('card.prompt'));
              if (window.lucide) lucide.createIcons();
            } else {
              // Toggle on: open this card's prompt
              populateBox();
              box.style.display = "block";
              copyRow.style.display = "flex";
              expandedBox = box;
              pBtn.textContent = tr('card.seeLess');
            }
          });

          cards.appendChild(card);
        });

      // ── Empty state ──────────────────────────────────────────────────────
      if (filtered.length === 0 && q) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'emptyState';
        const titleText = tr('search.empty.title') + ' \u201c' + q + '\u201d';
        emptyDiv.innerHTML = `
          <div class="emptyStateIcon"><i data-lucide="search" aria-hidden="true"></i></div>
          <p class="emptyStateTitle">${esc(titleText)}</p>
          <p class="emptyStateHint">${esc(tr('search.empty.hint'))}</p>
          <p class="emptyStateExamples">${esc(tr('search.empty.examples'))}</p>
          <button type="button" class="emptyStateClear">${esc(tr('search.empty.clear'))}</button>
        `;
        emptyDiv.querySelector('.emptyStateClear').addEventListener('click', () => {
          searchInput.value = '';
          currentQuery = '';
          render();
        });
        cards.appendChild(emptyDiv);
      }
      if (window.lucide) lucide.createIcons();
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

    // Quick Guide drawer events
    if (qgBtn)     qgBtn.addEventListener('click', openDrawer);
    if (qgOverlay) qgOverlay.addEventListener('click', closeDrawer);
    const qgCloseBtn = document.getElementById('qgCloseBtn');
    if (qgCloseBtn) qgCloseBtn.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && qgOpen) closeDrawer(); });

    // 4) Primera renderización
    render();
    renderChips();

    // ══════════════════════════════════════════════════════════════════════
    // ONBOARDING TOUR
    // ══════════════════════════════════════════════════════════════════════
    const TOUR_KEY = 'promptLibraryTourCompleted';

    const TOUR_STEPS = [
      { el: '#searchInput',          textKey: 'tour.step1.text', pos: 'bottom' },
      { el: '#searchChips',          textKey: 'tour.step2.text', pos: 'bottom' },
      { el: '#teamSelect',           textKey: 'tour.step3.text', pos: 'bottom' },
      { el: '#cards .card',          textKey: 'tour.step4.text', pos: 'right'  },
      { el: '#cards .card .pUnified',textKey: 'tour.step5.text', pos: 'top'    },
      { el: '#qgBtn',                textKey: 'tour.step6.text', pos: 'top'    },
    ];

    let tourActive  = false;
    let tourStepIdx = 0;

    const tourWelcomeEl  = document.getElementById('tourWelcome');
    const tourStartBtn   = document.getElementById('tourStartBtn');
    const tourSkipW      = document.getElementById('tourSkipWelcome');
    const tourBackdropEl = document.getElementById('tourBackdrop');
    const tourHighlightEl= document.getElementById('tourHighlight');
    const tourTooltipEl  = document.getElementById('tourTooltip');
    const tourTipText    = document.getElementById('tourTooltipText');
    const tourProgressEl = document.getElementById('tourProgress');
    const tourPrevBtn    = document.getElementById('tourPrevBtn');
    const tourNextBtn    = document.getElementById('tourNextBtn');
    const tourSkipBtn    = document.getElementById('tourSkipBtn');
    const tourReplayBtn  = document.getElementById('tourReplayBtn');

    function _tourPopulateWelcome() {
      document.getElementById('tourWelcomeTitle').textContent = tr('tour.welcome.title');
      document.getElementById('tourWelcomeBody').textContent  = tr('tour.welcome.body');
      tourStartBtn.textContent = tr('tour.welcome.start');
      tourSkipW.textContent    = tr('tour.welcome.skip');
    }

    function checkAndShowTour() {
      if (!localStorage.getItem(TOUR_KEY)) {
        setTimeout(() => {
          _tourPopulateWelcome();
          tourWelcomeEl.hidden = false;
        }, 700);
      }
    }

    function _startTour() {
      tourWelcomeEl.hidden = true;
      tourActive  = true;
      tourStepIdx = 0;
      _showTourStep(0);
    }

    function _dismissWelcome() {
      tourWelcomeEl.hidden = true;
      localStorage.setItem(TOUR_KEY, 'true');
    }

    function _showTourStep(idx) {
      const step   = TOUR_STEPS[idx];
      const target = document.querySelector(step.el);

      // Skip step if element is absent (e.g. no cards rendered yet)
      if (!target) {
        if (idx < TOUR_STEPS.length - 1) { tourStepIdx = idx + 1; _showTourStep(idx + 1); }
        else _finishTour();
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const PAD  = 6;

        // Place spotlight
        tourHighlightEl.style.top    = `${rect.top    - PAD}px`;
        tourHighlightEl.style.left   = `${rect.left   - PAD}px`;
        tourHighlightEl.style.width  = `${rect.width  + PAD * 2}px`;
        tourHighlightEl.style.height = `${rect.height + PAD * 2}px`;
        tourHighlightEl.hidden = false;
        tourBackdropEl.hidden  = false;

        // Populate tooltip
        tourTipText.textContent    = tr(step.textKey);
        tourProgressEl.textContent = `${idx + 1} / ${TOUR_STEPS.length}`;
        tourPrevBtn.hidden         = idx === 0;
        tourPrevBtn.textContent    = tr('tour.btn.prev');
        tourSkipBtn.textContent    = tr('tour.btn.skip');
        const isLast = idx === TOUR_STEPS.length - 1;
        tourNextBtn.textContent    = isLast ? tr('tour.btn.finish') : tr('tour.btn.next');

        _positionTooltip(rect, step.pos);
        tourTooltipEl.hidden = false;
      }, 300);
    }

    function _positionTooltip(rect, pref) {
      const TW  = 300;
      const vW  = window.innerWidth;
      const vH  = window.innerHeight;
      const pad = 14;
      const tH  = tourTooltipEl.offsetHeight || 140;

      const clampL = (l) => Math.max(pad, Math.min(l, vW - TW - pad));
      const clampT = (t) => Math.max(pad, Math.min(t, vH - tH - pad));

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

      tourTooltipEl.style.top  = `${top}px`;
      tourTooltipEl.style.left = `${left}px`;
    }

    function _nextStep() {
      if (tourStepIdx < TOUR_STEPS.length - 1) { tourStepIdx++; _showTourStep(tourStepIdx); }
      else _finishTour();
    }

    function _prevStep() {
      if (tourStepIdx > 0) { tourStepIdx--; _showTourStep(tourStepIdx); }
    }

    function _finishTour() {
      _hideTour();
      localStorage.setItem(TOUR_KEY, 'true');
    }

    function _skipTour() {
      _hideTour();
      localStorage.setItem(TOUR_KEY, 'true');
    }

    function _hideTour() {
      tourActive = false;
      tourBackdropEl.hidden  = true;
      tourHighlightEl.hidden = true;
      tourTooltipEl.hidden   = true;
    }

    function updateTourI18n() {
      const _rSpan = tourReplayBtn && tourReplayBtn.querySelector('span');
      if (_rSpan) _rSpan.textContent = tr('tour.btn.replay');
      if (tourWelcomeEl && !tourWelcomeEl.hidden) _tourPopulateWelcome();
      if (tourActive) _showTourStep(tourStepIdx);
    }

    // Wire welcome modal
    tourStartBtn.addEventListener('click', _startTour);
    tourSkipW.addEventListener('click', _dismissWelcome);

    // Wire tour controls
    tourNextBtn.addEventListener('click', _nextStep);
    tourPrevBtn.addEventListener('click', _prevStep);
    tourSkipBtn.addEventListener('click', _skipTour);

    // Close tour on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!tourWelcomeEl.hidden) { _dismissWelcome(); return; }
        if (tourActive)            { _skipTour(); }
      }
    });

    // Replay button — bottom-left floating pill
    if (tourReplayBtn) {
      const _rSpan = tourReplayBtn.querySelector('span');
      if (_rSpan) _rSpan.textContent = tr('tour.btn.replay');
      tourReplayBtn.addEventListener('click', () => {
        tourActive  = true;
        tourStepIdx = 0;
        _showTourStep(0);
      });
    }

    // Navbar Demo button — launches tour
    const navDemoBtn = document.getElementById('navDemoBtn');
    if (navDemoBtn) {
      navDemoBtn.addEventListener('click', () => {
        tourActive  = true;
        tourStepIdx = 0;
        _showTourStep(0);
      });
    }

    // Check and show on first visit (after render completes)
    checkAndShowTour();
    // ══════════════════════════════════════════════════════════════════════

    // 5) Re-render on language change
    window.addEventListener('languageChanged', () => {
      const newLang = (typeof getLang === 'function') ? getLang() : 'es';
      // Update the default option text
      const defaultOpt = teamSelect.querySelector('option[value=""]');
      if (defaultOpt) defaultOpt.textContent = tr('index.profile.option');
      // Re-populate team options in the new language
      populateTeamSelect(newLang);
      render();
      renderChips();
      if (qgOpen) renderQuickGuide();  // re-render body in new lang; labels updated by applyTranslations
      updateTourI18n();
    });
  })
  .catch((e) => console.error("Error:", e));

