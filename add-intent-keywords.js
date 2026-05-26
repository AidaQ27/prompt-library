#!/usr/bin/env node
/**
 * add-intent-keywords.js  — one-time patch
 * Adds "Intent Keywords": { es, ca, en } to every entry in prompts.multilang.json.
 * Safe to re-run: existing keywords are overwritten with the latest values.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'prompts.multilang.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

/** Normalize for matching: strip diacritics, lowercase, collapse punctuation/spaces */
function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intent Keywords for all 47 prompts.
 * Keys are the normalized (accent-free, punctuation-free) form of the Use Case .es value.
 * Values: { es, ca, en } — search keywords in each language.
 */
const INTENT_MAP = new Map([

  /* 01 — Preparar workshop de adopción IA */
  ['preparar workshop de adopcion ia', {
    es: 'taller formacion presentar entrenar demostrar equipo charla sesion capacitacion inteligencia artificial',
    ca: 'taller formacio presentar entrenar demostrar equip xerrada sessio capacitacio intelligencia artificial',
    en: 'workshop training present demonstrate team session capacity ai artificial intelligence',
  }],

  /* 02 — Explicar una decisión de Arquitectura */
  ['explicar una decision de arquitectura', {
    es: 'justificar defender explicar convencer decision tecnica stakeholders argumento razonamiento',
    ca: 'justificar defensar explicar convencer decisio tecnica stakeholders argument raonament',
    en: 'justify defend explain convince decision technical stakeholders argument reasoning',
  }],

  /* 03 — Comparar opciones de Arquitectura */
  ['comparar opciones de arquitectura', {
    es: 'elegir comparar evaluar tecnologia framework patron alternativa seleccionar',
    ca: 'elegir comparar avaluar tecnologia framework patro alternativa seleccionar',
    en: 'choose compare evaluate technology framework pattern alternative select',
  }],

  /* 04 — Documentar Arquitectura y estandares */
  ['documentar arquitectura y estandares', {
    es: 'documentar wiki adr estandar convencion registro norma arquitectura',
    ca: 'documentar wiki adr estandard convencio registre norma arquitectura',
    en: 'document wiki adr standard convention record norm architecture',
  }],

  /* 05 — Definir y estructurar requisitos de producto */
  ['definir y estructurar requisitos de producto', {
    es: 'requisitos funcionalidad criterios aceptacion especificar producto feature definir',
    ca: 'requisits funcionalitat criteris acceptacio especificar producte feature definir',
    en: 'requirements functionality acceptance criteria product feature define specify',
  }],

  /* 06 — Creación de epicas y user stories */
  ['creacion de epicas y user stories', {
    es: 'crear epica historia usuario story agile scrum backlog refinamiento sprint',
    ca: 'crear epica historia usuari story agile scrum backlog refinament sprint',
    en: 'create epic user story agile scrum backlog refinement sprint',
  }],

  /* 07 — Preparar comunicación de producto para stakeholders */
  ['preparar comunicacion de producto para stakeholders', {
    es: 'presentar comunicar roadmap producto ejecutivo update novedades lanzamiento release',
    ca: 'presentar comunicar roadmap producte executiu update novetats llancament release',
    en: 'present communicate roadmap product executive update news launch release',
  }],

  /* 08 — Planificación de proyecto */
  ['planificacion de proyecto', {
    es: 'planificar proyecto plan hoja ruta cronograma milestone entrega timeline',
    ca: 'planificar projecte pla full ruta cronograma milestone lliurament timeline',
    en: 'plan project roadmap timeline milestone delivery schedule',
  }],

  /* 09 — Seguimiento y reporte de estado */
  ['seguimiento y reporte de estado', {
    es: 'reporte estado avance informe progreso actualizacion resumen reunion proyecto',
    ca: 'informe estat avenc progres actualitzacio resum reunio projecte',
    en: 'report status progress update meeting summary project current state',
  }],

  /* 10 — Gestión de riesgos del proyecto */
  ['gestion de riesgos del proyecto', {
    es: 'riesgo problema bloqueo impacto mitigar contingencia amenaza incidencia proyecto',
    ca: 'risc problema bloqueig impacte mitigar contingencia amenaça incidencia projecte',
    en: 'risk problem blocker impact mitigate contingency threat incident project',
  }],

  /* 11 — Explicar resultados de un análisis */
  ['explicar resultados de un analisis', {
    es: 'datos grafico tabla interpretar analizar resultado insight presentar explicar hallazgos',
    ca: 'dades grafic taula interpretar analitzar resultat insight presentar explicar descobertes',
    en: 'data chart table interpret analyze result insight present explain findings',
  }],

  /* 12 — Soporte para análisis y SQL */
  ['soporte para analisis y sql', {
    es: 'consulta query base datos tablas extraer filtrar agrupar sql postgres bigquery',
    ca: 'consulta query base dades taules extreure filtrar agrupar sql postgres bigquery',
    en: 'query database tables extract filter group sql postgres bigquery analysis',
  }],

  /* 13 — Selección de modelos y enfoques */
  ['seleccion de modelos y enfoques', {
    es: 'modelo algoritmo machine learning elegir comparar evaluar ml ia estadistica',
    ca: 'model algoritme machine learning elegir comparar avaluar ml ia estadistica',
    en: 'model algorithm machine learning choose compare evaluate ml ai statistics',
  }],

  /* 14 — Documentación de modelos y análisis */
  ['documentacion de modelos y analisis', {
    es: 'documentar modelo experimento resultado analisis notebook reporte ciencia datos ml',
    ca: 'documentar model experiment resultat analisi notebook informe ciencia dades ml',
    en: 'document model experiment result analysis notebook report data science ml',
  }],

  /* 15 — Master Prompt - Chapter Leads */
  ['master prompt chapter leads', {
    es: 'chapter lead lider capitulo equipo tecnico gestionar comunidad practica guild',
    ca: 'chapter lead lider capitol equip tecnic gestionar comunitat practica guild',
    en: 'chapter lead community practice technical team manage guild',
  }],

  /* 16 — Gestionar equipo y prioridades del Chapter */
  ['gestionar equipo y prioridades del chapter', {
    es: 'gestionar equipo prioridades sprint backlog chapter planificar coordinar carga trabajo',
    ca: 'gestionar equip prioritats sprint backlog chapter planificar coordinar carrega treball',
    en: 'manage team priorities sprint backlog chapter plan coordinate workload',
  }],

  /* 17 — Seguimiento individual (1on1) */
  ['seguimiento individual 1on1', {
    es: '1on1 reunion individual feedback persona desarrollo seguimiento conversacion coaching',
    ca: '1on1 reunio individual feedback persona desenvolupament seguiment conversa coaching',
    en: 'one on one 1on1 individual meeting feedback person development follow up coaching',
  }],

  /* 18 — Desarrollo profesional y carrera */
  ['desarrollo profesional y carrera', {
    es: 'carrera crecimiento ascenso formacion habilidades desarrollo competencias promocion plan',
    ca: 'carrera creixement ascens formacio habilitats desenvolupament competencies promocio pla',
    en: 'career growth promotion training skills development competencies plan',
  }],

  /* 19 — Evaluación de desempeño */
  ['evaluacion de desempeno', {
    es: 'evaluacion rendimiento performance review desempeno objetivos okr feedback anual',
    ca: 'avaluacio rendiment performance review desempeny objectius okr feedback anual',
    en: 'performance review evaluation objectives okr feedback assessment annual',
  }],

  /* 20 — Salary review y compensación */
  ['salary review y compensacion', {
    es: 'salario compensacion sueldo subida aumento banda salarial review retribucion',
    ca: 'salari compensacio sou pujada augment banda salarial review retribucio',
    en: 'salary compensation pay raise increase band review remuneration',
  }],

  /* 21 — Onboarding y offboarding */
  ['onboarding y offboarding', {
    es: 'incorporar bienvenida nuevo integrante salida incorporacion proceso primer dia checklist',
    ca: 'incorporar benvinguda nou integrant sortida incorporacio proces primer dia checklist',
    en: 'onboard welcome new member departure process first day checklist integration',
  }],

  /* 22 — Coordinación con Customer Delivery */
  ['coordinacion con customer delivery', {
    es: 'cliente entrega coordinacion acuerdo comunicacion stakeholder externo cliente delivery',
    ca: 'client lliurament coordinacio acord comunicacio stakeholder extern client delivery',
    en: 'client delivery coordination agreement communication stakeholder external customer',
  }],

  /* 23 — Procesos de selección */
  ['procesos de seleccion', {
    es: 'entrevista candidato contratar hiring reclutamiento proceso oferta empleo',
    ca: 'entrevista candidat contractar hiring reclutament proces oferta empleo',
    en: 'interview candidate hiring recruitment process offer job',
  }],

  /* 24 — Master Prompt - Java Engineer */
  ['master prompt java engineer', {
    es: 'java desarrollador programador backend ingeniero spring codigo implementar',
    ca: 'java desenvolupador programador backend enginyer spring codi implementar',
    en: 'java developer programmer backend engineer spring code implement',
  }],

  /* 25 — Desarrollo Web API */
  ['desarrollo web api', {
    es: 'api rest endpoint servicio web implementar disenar interfaz http json',
    ca: 'api rest endpoint servei web implementar dissenyar interficie http json',
    en: 'api rest endpoint web service implement design interface http json',
  }],

  /* 26 — Optimización & Rendimiento  →  norm: "optimizacion rendimiento" */
  ['optimizacion rendimiento', {
    es: 'lento optimizar rendimiento performance mejorar velocidad carga memoria cpu latencia',
    ca: 'lent optimitzar rendiment performance millorar velocitat carrega memoria cpu latencia',
    en: 'slow optimize performance improve speed load memory cpu latency',
  }],

  /* 27 — Seguridad */
  ['seguridad', {
    es: 'seguridad vulnerabilidad autenticacion autorizacion token acceso proteger owasp',
    ca: 'seguretat vulnerabilitat autenticacio autoritzacio token acces protegir owasp',
    en: 'security vulnerability authentication authorization token access protect owasp',
  }],

  /* 28 — Arquitectura avanzada */
  ['arquitectura avanzada', {
    es: 'patron diseno microservicio eventos domain driven hexagonal escalable ddd cqrs',
    ca: 'patro disseny microservei esdeveniments domain driven hexagonal escalable ddd cqrs',
    en: 'pattern design microservice events domain driven hexagonal scalable ddd cqrs',
  }],

  /* 29 — Testing */
  ['testing', {
    es: 'test prueba unitaria integracion automatizar calidad cobertura mock junit',
    ca: 'test prova unitaria integracio automatitzar qualitat cobertura mock junit',
    en: 'test unit integration automate quality coverage mock junit',
  }],

  /* 30 — DevOps & CI/CD  →  norm: "devops ci cd" */
  ['devops ci cd', {
    es: 'desplegar pipeline ci cd jenkins github actions deploy automatizar entrega continua',
    ca: 'desplegar pipeline ci cd jenkins github actions deploy automatitzar lliurament continuu',
    en: 'deploy pipeline ci cd jenkins github actions continuous delivery automation',
  }],

  /* 31 — Cloud & Microservices  →  norm: "cloud microservices" */
  ['cloud microservices', {
    es: 'nube cloud kubernetes docker contenedor microservicio escalar infraestructura aws azure gcp',
    ca: 'nuvol cloud kubernetes docker contenidor microservei escalar infraestructura aws azure gcp',
    en: 'cloud kubernetes docker container microservice scale infrastructure aws azure gcp',
  }],

  /* 32 — Troubleshooting */
  ['troubleshooting', {
    es: 'error bug problema depurar resolver fallo diagnosticar causa raiz incidencia stack trace',
    ca: 'error bug problema depurar resoldre fallada diagnosticar causa arrel incidencia stack trace',
    en: 'error bug problem debug resolve failure diagnose root cause incident stack trace',
  }],

  /* 33 — Generación de código base (boilerplate)  →  norm includes "boilerplate" */
  ['generacion de codigo base', {
    es: 'generar crear estructura esqueleto proyecto nuevo codigo base plantilla starter boilerplate',
    ca: 'generar crear estructura esquelet projecte nou codi base plantilla starter boilerplate',
    en: 'generate create structure skeleton project new code base template starter boilerplate',
  }],

  /* 34 — Explicación de código legacy */
  ['explicacion de codigo legacy', {
    es: 'codigo antiguo legado entender explicar heredado comprender documentar refactorizar',
    ca: 'codi antic llegat entendre explicar heretat comprendre documentar refactoritzar',
    en: 'legacy old code understand explain inherited comprehend document refactor',
  }],

  /* 35 — Refactorización */
  ['refactorizacion', {
    es: 'refactorizar mejorar limpiar deuda tecnica reorganizar simplificar codigo calidad',
    ca: 'refactoritzar millorar netejar deute tecnic reorganitzar simplificar codi qualitat',
    en: 'refactor improve clean technical debt reorganize simplify code quality',
  }],

  /* 36 — Documentación técnica */
  ['documentacion tecnica', {
    es: 'documentar codigo readme wiki manual tecnico javadoc swagger openapi guia',
    ca: 'documentar codi readme wiki manual tecnic javadoc swagger openapi guia',
    en: 'document code readme wiki technical manual javadoc swagger openapi guide',
  }],

  /* 37 — Master Prompt - Squad Lead */
  ['master prompt squad lead', {
    es: 'squad lead lider equipo scrum master agile tecnico coordinacion delivery iteracion',
    ca: 'squad lead lider equip scrum master agile tecnic coordinacio lliurament iteracio',
    en: 'squad lead team leader scrum master agile technical coordination delivery iteration',
  }],

  /* 38 — Seguimiento de rendimiento del equipo */
  ['seguimiento de rendimiento del equipo', {
    es: 'rendimiento equipo metricas velocidad productividad kpi medir dashboard sprint',
    ca: 'rendiment equip metriques velocitat productivitat kpi mesurar dashboard sprint',
    en: 'team performance metrics velocity productivity kpi measure dashboard sprint',
  }],

  /* 39 — Priorización operativa y backlog */
  ['priorizacion operativa y backlog', {
    es: 'priorizar backlog sprint siguiente urgente importante ordenar planificar deuda',
    ca: 'prioritzar backlog sprint seguent urgent important ordenar planificar deute',
    en: 'prioritize backlog sprint next urgent important order plan technical debt',
  }],

  /* 40 — Gestión de incidentes y coordinación */
  ['gestion de incidentes y coordinacion', {
    es: 'incidente alerta caida produccion urgente resolver coordinacion crisis escalado',
    ca: 'incident alerta caiguda produccio urgent resoldre coordinacio crisi escalada',
    en: 'incident alert outage production urgent resolve coordinate crisis escalation',
  }],

  /* 41 — Comunicación y alineación de equipo */
  ['comunicacion y alineacion de equipo', {
    es: 'comunicar reunion equipo alinear actualizar informar mensaje nota resumen canal',
    ca: 'comunicar reunio equip alinear actualitzar informar missatge nota resum canal',
    en: 'communicate meeting team align update inform message note summary channel',
  }],

  /* 42 — Identificación de riesgos operativos */
  ['identificacion de riesgos operativos', {
    es: 'riesgo blocker dependencia problema tecnico identificar amenaza operacion impacto',
    ca: 'risc blocker dependencia problema tecnic identificar amenaça operacio impacte',
    en: 'risk blocker dependency technical problem identify threat operation impact',
  }],

  /* 43 — Seguimiento individual (1:1)  →  norm: "seguimiento individual 1 1" */
  ['seguimiento individual 1 1', {
    es: '1on1 reunion individual persona feedback seguimiento conversacion carrera desarrollo',
    ca: '1on1 reunio individual persona feedback seguiment conversa carrera desenvolupament',
    en: 'one on one individual meeting feedback person follow up career development',
  }],

  /* 44 — Reporting y visibilidad */
  ['reporting y visibilidad', {
    es: 'reporte informe resumen resultados estado visibilidad ejecutivo dashboard metricas reunion',
    ca: 'informe resum resultats estat visibilitat executiu dashboard metriques reunio',
    en: 'report summary results status visibility executive dashboard metrics meeting',
  }],

  /* 45 — Reducción de redacción en Emails */
  ['reduccion de redaccion en emails', {
    es: 'email correo redactar escribir mensaje enviar comunicacion formal profesional',
    ca: 'email correu redactar escriure missatge enviar comunicacio formal professional',
    en: 'email write message send formal professional communication draft',
  }],

  /* 46 — Documentación operativa y conocimiento */
  ['documentacion operativa y conocimiento', {
    es: 'documentar proceso runbook wiki conocimiento compartir base procedimiento manual',
    ca: 'documentar proces runbook wiki coneixement compartir base procediment manual',
    en: 'document process runbook wiki knowledge share base procedure manual',
  }],

  /* 47 — Resúmenes de reuniones técnicas */
  ['resumenes de reuniones tecnicas', {
    es: 'resumir reunion meeting notas actas sintesis transcripcion puntos clave',
    ca: 'resumir reunio meeting notes actes sintesi transcripcio punts clau',
    en: 'summarize meeting notes minutes recap synthesis key points',
  }],
]);

// ── Patch ──────────────────────────────────────────────────────────────────────
let added    = 0;
const missed = [];

data.forEach((r, i) => {
  const uc    = r['Use Case'];
  const ucStr = typeof uc === 'object' ? (uc.es || '') : String(uc || '');
  const key   = norm(ucStr);

  // 1) Exact match
  if (INTENT_MAP.has(key)) {
    r['Intent Keywords'] = INTENT_MAP.get(key);
    added++;
    return;
  }

  // 2) Partial match — handles entries where the key is a prefix of the norm value
  //    (e.g. "generacion de codigo base" matching "generacion de codigo base boilerplate")
  for (const [mapKey, kw] of INTENT_MAP) {
    if (key.startsWith(mapKey) || mapKey.startsWith(key.substring(0, 20))) {
      r['Intent Keywords'] = kw;
      added++;
      return;
    }
  }

  missed.push(`[${i + 1}] "${ucStr}"  →  norm: "${key}"`);
});

if (missed.length > 0) {
  console.warn(`\n⚠️  No match for ${missed.length} entries:`);
  missed.forEach((s) => console.warn('  ', s));
}

fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✓  Intent Keywords added to ${added}/${data.length} entries`);
console.log(`✓  Written to: ${FILE}\n`);
