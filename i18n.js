// i18n.js — Global internationalisation module
// Provides: t(key, vars?), getLang(), setLanguage(lang)
// Injects the ES / CAT / EN language switcher into every page header.
// Persists the selected language in localStorage under 'promptsGPT_lang'.

(function () {
  'use strict';

  // ─── Supported languages & defaults ────────────────────────────────────────
  var SUPPORTED = ['es', 'ca', 'en'];
  var DEFAULT_LANG = 'es';
  var STORAGE_KEY  = 'promptsGPT_lang';

  // ─── Translation dictionary ─────────────────────────────────────────────────
  var _tx = {

    // ════════════════════════════════════════════════════════════════
    //  ESPAÑOL
    // ════════════════════════════════════════════════════════════════
    es: {
      // Navigation
      'nav.prompts'   : '📚 Prompts',
      'nav.agents'    : '🤖 Agentes',
      'nav.frameworks': '⚡ Plantillas Ejecutivas',
      'nav.dpc'       : '🔍 DPC Check',

      // ── index.html ──────────────────────────────────────────────
      'index.title'              : 'Prompt Library',
      'index.dpc.guide'          : 'DPC (guía rápida)',
      'index.dpc.0'              : 'Público / anónimo',
      'index.dpc.1'              : 'Profesional',
      'index.dpc.2'              : 'Sensible (solo con normas)',
      'index.dpc.3'              : 'Crítico (prohibido)',
      'index.profile.label'      : 'Escoge tu perfil',
      'index.profile.option'     : 'Escoge tu perfil...',
      'index.search.label'       : 'Buscar',
      'index.search.placeholder' : 'Busca por título o descripción…',

      // ── Cards (app.js dynamic) ───────────────────────────────────
      'card.situation' : 'Situación / problema:',
      'card.benefit'   : 'Beneficio',
      'card.saveUp'    : '⏱️ Save up',
      'card.prompt'    : '💡 Prompt',
      'card.copy'      : 'Copy',
      'card.seeMore'   : 'Ver más',
      'card.seeLess'   : 'Ver menos',
      'card.empty'     : '(vacío)',

      // ── framework.html ───────────────────────────────────────────
      'framework.title'         : 'ChatGPT Enterprise – Plantillas Ejecutivas',
      'framework.intro.title'   : 'Plantillas Ejecutivas para generar prompts estratégicos',
      'framework.intro.subtitle': 'Completa los campos y genera un prompt adaptado a tu rol y contexto.',
      'framework.sidebar.title' : 'Plantillas Disponibles',
      'framework.empty'         : 'Selecciona una plantilla de la lista',

      // ── Framework builder (framework.js dynamic) ─────────────────
      'builder.title'        : '✏️ Rellena tu prompt',
      'builder.reset'        : '🔄 Reset',
      'builder.copyTemplate' : '📋 Copiar plantilla',
      'builder.copyFinal'    : '✅ Copiar prompt final',
      'builder.preview'      : '👁️ Vista previa del prompt final',
      'builder.advanced'     : 'Opciones Avanzadas',
      'builder.badge.current': 'Plantilla actual:',

      // Status badges
      'status.nuevo'      : 'Nuevo',
      'status.proximamente': 'Próximamente',

      // Section headers
      'section.contexto_operativo': '📊 Contexto Operativo',
      'section.contexto_capitulo' : '👥 Contexto del Chapter',
      'section.okrs'              : '🎯 OKRs',
      'section.contexto_tecnico'  : '🛠️ Stack Técnico',
      'section.governance'        : '⚙️ Governance',

      // Copy feedback
      'copy.template': 'Plantilla copiada al portapapeles',
      'copy.final'   : 'Prompt final copiado al portapapeles',
      'copy.error'   : 'No se pudo copiar al portapapeles.',

      // ── agents.html ──────────────────────────────────────────────
      'agents.title'              : 'ChatGPT Enterprise – Agentes',
      'agents.search.placeholder' : 'Buscar agentes...',
      'agents.filter.team'        : 'Equipo',
      'agents.filter.dpc'         : 'Nivel DPC',
      'agents.filter.all'         : 'Todos',
      'agents.reset'              : 'Reset',
      'agents.results'            : 'Mostrando {shown} de {total}',
      'agents.empty'              : 'No se encontraron agentes con esos criterios.',
      'agents.row.before'         : 'Antes (cómo se hacía)',
      'agents.row.time'           : 'Tiempo',
      'agents.row.savings'        : 'Ahorro estimado',
      'agents.row.impact'         : 'Impacto cualitativo',
      'agents.row.notes'          : 'Notas',
      'agents.row.timeBefore'     : 'Antes:',
      'agents.row.timeNow'        : 'Ahora:',
      'agents.row.team'           : 'Equipo:',
      'agents.row.type'           : 'Tipo:',
      'agents.row.seeMore'        : 'Ver más',
      'agents.row.seeLess'        : 'Ver menos',

      // ── dpc.html ─────────────────────────────────────────────────
      'dpc.pagetitle'    : '🔍 DPC Check',
      'dpc.hero.title'   : 'DPC Check',
      'dpc.hero.subtitle': 'Herramienta para clasificar datos antes de usar ChatGPT Enterprise',
      'dpc.hero.desc'    : 'Responde el cuestionario para determinar la categoría de sensibilidad de tus datos según la política interna DPC.',

      'dpc.s1.title': 'Sección 1: Datos Personales',
      'dpc.s1.desc' : 'Responde las siguientes preguntas sobre datos personales',
      'dpc.q1'      : '1. ¿Contiene datos personales?',
      'dpc.q2'      : '2. ¿Son datos profesionales?',
      'dpc.q3'      : '3. ¿Incluye datos sensibles de clientes o privados?',
      'dpc.q4'      : '4. ¿Incluye datos de salud, religión o biométricos?',

      'dpc.s2.title': 'Sección 2: Clasificación de Información Corporativa',
      'dpc.s2.desc' : 'Define el nivel de confidencialidad de la información',
      'dpc.q5'      : '5. ¿Cuál es el tipo de información corporativa?',

      'dpc.class.interna'            : 'Interna',
      'dpc.class.interna.desc'       : 'Información compartida entre equipos internos. Accesible solo a empleados.',
      'dpc.class.interna.example'    : 'Ej: Planificación interna, reportes de equipo, procesos internos',
      'dpc.class.privada'            : 'Privada / Restringida',
      'dpc.class.privada.desc'       : 'Información con acceso limitado a ciertos roles o departamentos. Divulgación no autorizada causa daño.',
      'dpc.class.privada.example'    : 'Ej: Datos financieros, información de clientes, estrategia comercial',
      'dpc.class.confidencial'       : 'Confidencial',
      'dpc.class.confidencial.desc'  : 'Información altamente sensible. Acceso solo a personal autorizado. Divulgación causa daño severo.',
      'dpc.class.confidencial.example': 'Ej: Credenciales, tokens, acuerdos legales, información de fusiones, secretos comerciales',

      'dpc.q6': '6. ¿Es información ya disponible públicamente?',
      'dpc.q7': '7. Si se filtrara, ¿cuál sería el nivel de impacto?',
      'dpc.q8': '8. ¿Contiene secretos (contraseñas, tokens, credenciales) o documentos completos críticos?',

      'dpc.yes'   : 'Sí',
      'dpc.no'    : 'No',
      'dpc.low'   : 'Bajo',
      'dpc.medium': 'Medio',
      'dpc.high'  : 'Alto',

      'dpc.submit'  : 'Calcular Clasificación DPC',
      'dpc.reset'   : 'Hacer Nueva Consulta',
      'dpc.validate': 'Por favor, responde todas las preguntas antes de enviar.',

      // Result labels
      'dpc.result.permitido'   : 'Permitido',
      'dpc.result.limitado'    : 'Uso Limitado',
      'dpc.result.prohibido'   : 'Prohibido',
      'dpc.result.rec.ok'      : 'Puedes usar esta información en ChatGPT Enterprise sin restricciones.',
      'dpc.result.rec.limited' : 'Usa esta información con precaución. Sigue las políticas internas de tu equipo.',
      'dpc.result.rec.blocked' : 'No uses esta información en ChatGPT Enterprise. Datos altamente sensibles.',
      'dpc.result.detail.secrets'    : '🔴 ALERTA CRÍTICA: No pegar credenciales, contraseñas, tokens o secretos. Sanitiza toda la información antes de usar.',
      'dpc.result.detail.personal3'  : '🔴 Datos Personales Sensibles (Categoría Especial): No compartas información de salud, religión, origen étnico, datos biométricos o similar. Datos altamente protegidos.',
      'dpc.result.detail.personal2'  : '🟡 Datos Personales Sensibles: Limita el contexto compartido. Anonimiza nombres, referencias personales y números específicos.',
      'dpc.result.detail.confidencial': '🔴 Información Confidencial: Úsala solo con resúmenes u abstracciones. Nunca pases documentos completos o datos específicos.',
      'dpc.result.detail.privada'    : '🟡 Información Restringida (Privada): Limita el contexto compartido. Anonimiza nombres, referencias internas y números específicos.',
      'dpc.result.detail.interna'    : '🟢 Información Interna: Puedes usarla con precaución. Sigue siempre las políticas de seguridad de tu organización.',

      // Q5 labels used in result
      'dpc.q5.interna'    : 'Interna',
      'dpc.q5.privada'    : 'Privada / Restringida',
      'dpc.q5.confidencial': 'Confidencial',

      // Personal-data-driven result labels
      'dpc.result.label.personal3': 'DPC 3 • Categoría especial',
      'dpc.result.label.personal2': 'DPC 2 • Datos sensibles',
    },

    // ════════════════════════════════════════════════════════════════
    //  CATALÀ
    // ════════════════════════════════════════════════════════════════
    ca: {
      // Navigation
      'nav.prompts'   : '📚 Prompts',
      'nav.agents'    : '🤖 Agents',
      'nav.frameworks': '⚡ Plantilles Executives',
      'nav.dpc'       : '🔍 DPC Check',

      // ── index.html ──────────────────────────────────────────────
      'index.title'              : 'Biblioteca de Prompts',
      'index.dpc.guide'          : 'DPC (guia ràpida)',
      'index.dpc.0'              : 'Públic / anònim',
      'index.dpc.1'              : 'Professional',
      'index.dpc.2'              : 'Sensible (sols amb normes)',
      'index.dpc.3'              : 'Crític (prohibit)',
      'index.profile.label'      : 'Escull el teu perfil',
      'index.profile.option'     : 'Escull el teu perfil...',
      'index.search.label'       : 'Cercar',
      'index.search.placeholder' : 'Cerca per títol o descripció…',

      // ── Cards ─────────────────────────────────────────────────────
      'card.situation' : 'Situació / problema:',
      'card.benefit'   : 'Benefici',
      'card.saveUp'    : '⏱️ Estalvi',
      'card.prompt'    : '💡 Prompt',
      'card.copy'      : 'Copiar',
      'card.seeMore'   : 'Veure més',
      'card.seeLess'   : 'Veure menys',
      'card.empty'     : '(buit)',

      // ── framework.html ───────────────────────────────────────────
      'framework.title'         : 'ChatGPT Enterprise – Plantilles Executives',
      'framework.intro.title'   : 'Plantilles Executives per generar prompts estratègics',
      'framework.intro.subtitle': 'Omple els camps i genera un prompt adaptat al teu rol i context.',
      'framework.sidebar.title' : 'Plantilles Disponibles',
      'framework.empty'         : 'Selecciona una plantilla de la llista',

      // ── Framework builder ─────────────────────────────────────────
      'builder.title'        : '✏️ Omple el teu prompt',
      'builder.reset'        : '🔄 Reset',
      'builder.copyTemplate' : '📋 Copiar plantilla',
      'builder.copyFinal'    : '✅ Copiar prompt final',
      'builder.preview'      : '👁️ Previsualització del prompt final',
      'builder.advanced'     : 'Opcions Avançades',
      'builder.badge.current': 'Plantilla actual:',

      'status.nuevo'      : 'Nou',
      'status.proximamente': 'Pròximament',

      'section.contexto_operativo': '📊 Context Operatiu',
      'section.contexto_capitulo' : '👥 Context del Chapter',
      'section.okrs'              : '🎯 OKRs',
      'section.contexto_tecnico'  : '🛠️ Stack Tècnic',
      'section.governance'        : '⚙️ Governance',

      'copy.template': 'Plantilla copiada al porta-retalls',
      'copy.final'   : 'Prompt final copiat al porta-retalls',
      'copy.error'   : "No s'ha pogut copiar al porta-retalls.",

      // ── agents.html ──────────────────────────────────────────────
      'agents.title'              : 'ChatGPT Enterprise – Agents',
      'agents.search.placeholder' : 'Cercar agents...',
      'agents.filter.team'        : 'Equip',
      'agents.filter.dpc'         : 'Nivell DPC',
      'agents.filter.all'         : 'Tots',
      'agents.reset'              : 'Reset',
      'agents.results'            : 'Mostrant {shown} de {total}',
      'agents.empty'              : "No s'han trobat agents amb aquests criteris.",
      'agents.row.before'         : 'Abans (com es feia)',
      'agents.row.time'           : 'Temps',
      'agents.row.savings'        : 'Estalvi estimat',
      'agents.row.impact'         : 'Impacte qualitatiu',
      'agents.row.notes'          : 'Notes',
      'agents.row.timeBefore'     : 'Abans:',
      'agents.row.timeNow'        : 'Ara:',
      'agents.row.team'           : 'Equip:',
      'agents.row.type'           : 'Tipus:',
      'agents.row.seeMore'        : 'Veure més',
      'agents.row.seeLess'        : 'Veure menys',

      // ── dpc.html ─────────────────────────────────────────────────
      'dpc.pagetitle'    : '🔍 DPC Check',
      'dpc.hero.title'   : 'DPC Check',
      'dpc.hero.subtitle': "Eina per classificar dades abans d'usar ChatGPT Enterprise",
      'dpc.hero.desc'    : 'Respon el qüestionari per determinar la categoria de sensibilitat de les teves dades segons la política interna DPC.',

      'dpc.s1.title': 'Secció 1: Dades Personals',
      'dpc.s1.desc' : 'Respon les preguntes següents sobre dades personals',
      'dpc.q1'      : '1. Conté dades personals?',
      'dpc.q2'      : '2. Són dades professionals?',
      'dpc.q3'      : '3. Inclou dades sensibles de clients o privades?',
      'dpc.q4'      : '4. Inclou dades de salut, religió o biomètriques?',

      'dpc.s2.title': 'Secció 2: Classificació d\'Informació Corporativa',
      'dpc.s2.desc' : 'Defineix el nivell de confidencialitat de la informació',
      'dpc.q5'      : '5. Quin és el tipus d\'informació corporativa?',

      'dpc.class.interna'            : 'Interna',
      'dpc.class.interna.desc'       : 'Informació compartida entre equips interns. Accessible només a empleats.',
      'dpc.class.interna.example'    : 'Ex: Planificació interna, informes d\'equip, processos interns',
      'dpc.class.privada'            : 'Privada / Restringida',
      'dpc.class.privada.desc'       : 'Informació amb accés limitat a certs rols o departaments. La divulgació no autoritzada causa dany.',
      'dpc.class.privada.example'    : 'Ex: Dades financeres, informació de clients, estratègia comercial',
      'dpc.class.confidencial'       : 'Confidencial',
      'dpc.class.confidencial.desc'  : 'Informació altament sensible. Accés només a personal autoritzat. La divulgació causa dany greu.',
      'dpc.class.confidencial.example': 'Ex: Credencials, tokens, acords legals, informació de fusions, secrets comercials',

      'dpc.q6': '6. Aquesta informació ja és disponible públicament?',
      'dpc.q7': '7. Si es filtrés, quin seria el nivell d\'impacte?',
      'dpc.q8': '8. Conté secrets (contrasenyes, tokens, credencials) o documents complets crítics?',

      'dpc.yes'   : 'Sí',
      'dpc.no'    : 'No',
      'dpc.low'   : 'Baix',
      'dpc.medium': 'Mitjà',
      'dpc.high'  : 'Alt',

      'dpc.submit'  : 'Calcular Classificació DPC',
      'dpc.reset'   : 'Fer Nova Consulta',
      'dpc.validate': 'Si us plau, respon totes les preguntes abans d\'enviar.',

      'dpc.result.permitido'   : 'Permès',
      'dpc.result.limitado'    : 'Ús Limitat',
      'dpc.result.prohibido'   : 'Prohibit',
      'dpc.result.rec.ok'      : 'Pots usar aquesta informació a ChatGPT Enterprise sense restriccions.',
      'dpc.result.rec.limited' : 'Usa aquesta informació amb precaució. Segueix les polítiques internes del teu equip.',
      'dpc.result.rec.blocked' : 'No uses aquesta informació a ChatGPT Enterprise. Dades altament sensibles.',
      'dpc.result.detail.secrets'    : '🔴 ALERTA CRÍTICA: No enganxis credencials, contrasenyes, tokens o secrets. Sanititza tota la informació abans d\'usar.',
      'dpc.result.detail.personal3'  : '🔴 Dades Personals Sensibles (Categoria Especial): No comparteixis informació de salut, religió, origen ètnic, dades biomètriques o similar. Dades altament protegides.',
      'dpc.result.detail.personal2'  : '🟡 Dades Personals Sensibles: Limita el context compartit. Anonimitza noms, referències personals i números específics.',
      'dpc.result.detail.confidencial': '🔴 Informació Confidencial: Usa-la només amb resums o abstraccions. Mai passis documents complets o dades específiques.',
      'dpc.result.detail.privada'    : '🟡 Informació Restringida (Privada): Limita el context compartit. Anonimitza noms, referències internes i números específics.',
      'dpc.result.detail.interna'    : '🟢 Informació Interna: Pots usar-la amb precaució. Segueix sempre les polítiques de seguretat de la teva organització.',

      'dpc.q5.interna'    : 'Interna',
      'dpc.q5.privada'    : 'Privada / Restringida',
      'dpc.q5.confidencial': 'Confidencial',

      'dpc.result.label.personal3': 'DPC 3 • Categoria especial',
      'dpc.result.label.personal2': 'DPC 2 • Dades sensibles',
    },

    // ════════════════════════════════════════════════════════════════
    //  ENGLISH
    // ════════════════════════════════════════════════════════════════
    en: {
      // Navigation
      'nav.prompts'   : '📚 Prompts',
      'nav.agents'    : '🤖 Agents',
      'nav.frameworks': '⚡ Executive Templates',
      'nav.dpc'       : '🔍 DPC Check',

      // ── index.html ──────────────────────────────────────────────
      'index.title'              : 'Prompt Library',
      'index.dpc.guide'          : 'DPC (quick guide)',
      'index.dpc.0'              : 'Public / anonymous',
      'index.dpc.1'              : 'Professional',
      'index.dpc.2'              : 'Sensitive (rules only)',
      'index.dpc.3'              : 'Critical (forbidden)',
      'index.profile.label'      : 'Choose your profile',
      'index.profile.option'     : 'Choose your profile...',
      'index.search.label'       : 'Search',
      'index.search.placeholder' : 'Search by title or description…',

      // ── Cards ─────────────────────────────────────────────────────
      'card.situation' : 'Situation / problem:',
      'card.benefit'   : 'Benefit',
      'card.saveUp'    : '⏱️ Save up',
      'card.prompt'    : '💡 Prompt',
      'card.copy'      : 'Copy',
      'card.seeMore'   : 'See more',
      'card.seeLess'   : 'See less',
      'card.empty'     : '(empty)',

      // ── framework.html ───────────────────────────────────────────
      'framework.title'         : 'ChatGPT Enterprise – Executive Templates',
      'framework.intro.title'   : 'Executive Templates to generate strategic prompts',
      'framework.intro.subtitle': 'Fill in the fields and generate a prompt adapted to your role and context.',
      'framework.sidebar.title' : 'Available Templates',
      'framework.empty'         : 'Select a template from the list',

      // ── Framework builder ─────────────────────────────────────────
      'builder.title'        : '✏️ Fill in your prompt',
      'builder.reset'        : '🔄 Reset',
      'builder.copyTemplate' : '📋 Copy template',
      'builder.copyFinal'    : '✅ Copy final prompt',
      'builder.preview'      : '👁️ Final prompt preview',
      'builder.advanced'     : 'Advanced Options',
      'builder.badge.current': 'Current template:',

      'status.nuevo'      : 'New',
      'status.proximamente': 'Coming soon',

      'section.contexto_operativo': '📊 Operational Context',
      'section.contexto_capitulo' : '👥 Chapter Context',
      'section.okrs'              : '🎯 OKRs',
      'section.contexto_tecnico'  : '🛠️ Tech Stack',
      'section.governance'        : '⚙️ Governance',

      'copy.template': 'Template copied to clipboard',
      'copy.final'   : 'Final prompt copied to clipboard',
      'copy.error'   : 'Could not copy to clipboard.',

      // ── agents.html ──────────────────────────────────────────────
      'agents.title'              : 'ChatGPT Enterprise – Agents',
      'agents.search.placeholder' : 'Search agents...',
      'agents.filter.team'        : 'Team',
      'agents.filter.dpc'         : 'DPC Level',
      'agents.filter.all'         : 'All',
      'agents.reset'              : 'Reset',
      'agents.results'            : 'Showing {shown} of {total}',
      'agents.empty'              : 'No agents found with those criteria.',
      'agents.row.before'         : 'Before (how it was done)',
      'agents.row.time'           : 'Time',
      'agents.row.savings'        : 'Estimated savings',
      'agents.row.impact'         : 'Qualitative impact',
      'agents.row.notes'          : 'Notes',
      'agents.row.timeBefore'     : 'Before:',
      'agents.row.timeNow'        : 'Now:',
      'agents.row.team'           : 'Team:',
      'agents.row.type'           : 'Type:',
      'agents.row.seeMore'        : 'See more',
      'agents.row.seeLess'        : 'See less',

      // ── dpc.html ─────────────────────────────────────────────────
      'dpc.pagetitle'    : '🔍 DPC Check',
      'dpc.hero.title'   : 'DPC Check',
      'dpc.hero.subtitle': 'Tool to classify data before using ChatGPT Enterprise',
      'dpc.hero.desc'    : 'Answer the questionnaire to determine the sensitivity category of your data according to the internal DPC policy.',

      'dpc.s1.title': 'Section 1: Personal Data',
      'dpc.s1.desc' : 'Answer the following questions about personal data',
      'dpc.q1'      : '1. Does it contain personal data?',
      'dpc.q2'      : '2. Is it professional data?',
      'dpc.q3'      : '3. Does it include sensitive client or private data?',
      'dpc.q4'      : '4. Does it include health, religion or biometric data?',

      'dpc.s2.title': 'Section 2: Corporate Information Classification',
      'dpc.s2.desc' : 'Define the confidentiality level of the information',
      'dpc.q5'      : '5. What type of corporate information is it?',

      'dpc.class.interna'            : 'Internal',
      'dpc.class.interna.desc'       : 'Information shared among internal teams. Accessible to employees only.',
      'dpc.class.interna.example'    : 'E.g.: Internal planning, team reports, internal processes',
      'dpc.class.privada'            : 'Private / Restricted',
      'dpc.class.privada.desc'       : 'Information with limited access to certain roles or departments. Unauthorized disclosure causes harm.',
      'dpc.class.privada.example'    : 'E.g.: Financial data, client information, commercial strategy',
      'dpc.class.confidencial'       : 'Confidential',
      'dpc.class.confidencial.desc'  : 'Highly sensitive information. Access only to authorised personnel. Disclosure causes severe harm.',
      'dpc.class.confidencial.example': 'E.g.: Credentials, tokens, legal agreements, merger information, trade secrets',

      'dpc.q6': '6. Is the information already publicly available?',
      'dpc.q7': '7. If leaked, what would be the impact level?',
      'dpc.q8': '8. Does it contain secrets (passwords, tokens, credentials) or complete critical documents?',

      'dpc.yes'   : 'Yes',
      'dpc.no'    : 'No',
      'dpc.low'   : 'Low',
      'dpc.medium': 'Medium',
      'dpc.high'  : 'High',

      'dpc.submit'  : 'Calculate DPC Classification',
      'dpc.reset'   : 'New Query',
      'dpc.validate': 'Please answer all questions before submitting.',

      'dpc.result.permitido'   : 'Allowed',
      'dpc.result.limitado'    : 'Limited Use',
      'dpc.result.prohibido'   : 'Forbidden',
      'dpc.result.rec.ok'      : 'You can use this information in ChatGPT Enterprise without restrictions.',
      'dpc.result.rec.limited' : 'Use this information with caution. Follow your team\'s internal policies.',
      'dpc.result.rec.blocked' : 'Do not use this information in ChatGPT Enterprise. Highly sensitive data.',
      'dpc.result.detail.secrets'    : '🔴 CRITICAL ALERT: Do not paste credentials, passwords, tokens or secrets. Sanitise all information before use.',
      'dpc.result.detail.personal3'  : '🔴 Sensitive Personal Data (Special Category): Do not share health, religion, ethnicity, biometric data or similar. Highly protected data.',
      'dpc.result.detail.personal2'  : '🟡 Sensitive Personal Data: Limit shared context. Anonymise names, personal references and specific numbers.',
      'dpc.result.detail.confidencial': '🔴 Confidential Information: Use only with summaries or abstractions. Never pass complete documents or specific data.',
      'dpc.result.detail.privada'    : '🟡 Restricted Information (Private): Limit shared context. Anonymise names, internal references and specific numbers.',
      'dpc.result.detail.interna'    : '🟢 Internal Information: You can use it with caution. Always follow your organisation\'s security policies.',

      'dpc.q5.interna'    : 'Internal',
      'dpc.q5.privada'    : 'Private / Restricted',
      'dpc.q5.confidencial': 'Confidential',

      'dpc.result.label.personal3': 'DPC 3 • Special category',
      'dpc.result.label.personal2': 'DPC 2 • Sensitive data',
    }
  };

  // ─── Core API ────────────────────────────────────────────────────────────────

  function getLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.indexOf(stored) !== -1 ? stored : DEFAULT_LANG;
  }

  /**
   * t(key, vars?)
   * Look up a translation key for the current language.
   * Falls back to Spanish, then returns the key itself if not found.
   * Supports simple variable substitution: t('agents.results', {shown:3, total:10})
   */
  function t(key, vars) {
    var lang = getLang();
    var dict = _tx[lang] || _tx[DEFAULT_LANG];
    var text = (dict[key] !== undefined) ? dict[key]
             : (_tx[DEFAULT_LANG][key] !== undefined ? _tx[DEFAULT_LANG][key] : key);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        text = text.replace('{' + k + '}', vars[k]);
      });
    }
    return text;
  }

  // ─── DOM helpers ─────────────────────────────────────────────────────────────

  function applyTranslations() {
    // textContent
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    // placeholder attribute
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-i18n-ph'));
    });
    // Update html[lang]
    document.documentElement.lang = getLang();
  }

  function updateSwitcher() {
    var lang = getLang();
    document.querySelectorAll('.langBtn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function setLanguage(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    updateSwitcher();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
  }

  // ─── Language switcher injection ─────────────────────────────────────────────

  function injectSwitcher() {
    var nav = document.querySelector('.headerNav');
    if (!nav) return;

    var switcher = document.createElement('div');
    switcher.className = 'langSwitcher';

    ['es', 'ca', 'en'].forEach(function (code) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'langBtn';
      btn.dataset.lang = code;
      btn.textContent = code === 'ca' ? 'CAT' : code.toUpperCase();
      btn.addEventListener('click', function () { setLanguage(code); });
      switcher.appendChild(btn);
    });

    nav.appendChild(switcher);
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  function init() {
    injectSwitcher();
    applyTranslations();
    updateSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ──────────────────────────────────────────────────────────────
  window.t       = t;
  window.getLang = getLang;
  window.i18n    = { t: t, getLang: getLang, setLanguage: setLanguage };

})();
