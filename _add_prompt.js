const fs = require('fs');
const filePath = './prompts.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const newEntries = [
  {
    "Equipo": "Chapter Leads",
    "Use Case": "Gestión de talento (alto potencial y bajo rendimiento)",
    "Situacion / Problema": "Necesito detectar perfiles de alto potencial, diseñar planes de aceleración y gestionar situaciones de bajo rendimiento con planes de mejora estructurados.",
    "Valor / Beneficio": "Maximiza el potencial del equipo, retiene talento clave y corrige desviaciones de rendimiento de forma objetiva y documentada.",
    "Nivel de datos (DPC / DSK)": "DPC 1",
    "Save up": "3–5 horas por plan de talento",
    "Notas": "Chapter Leads",
    "Prompt": "Necesito dos plantillas completas para gestionar el talento del equipo dentro de T-Systems Iberia: una para empleados de alto potencial y otra para empleados con bajo rendimiento.\n\nObjetivo:\nAsegurar un desarrollo adecuado del talento, potenciando el crecimiento de los perfiles estratégicos y corrigiendo de forma estructurada situaciones de bajo rendimiento.\n\nIncluye:\n\n1) Gestión de Alto Potencial:\n- Criterios para identificar alto potencial (skills, actitudes, ritmo de aprendizaje, impacto).\n- Plan de aceleración profesional con retos progresivos.\n- Actividades de exposición: participación en iniciativas, colaboración transversal, visibilidad ante stakeholders.\n- Acciones de desarrollo: formación avanzada, mentoring, shadowing.\n- KPIs de crecimiento y métricas de progreso.\n- Riesgos asociados (sobrecarga, expectativas, falta de soporte).\n- Recomendaciones para seguimiento trimestral.\n\n2) Gestión de Bajo Rendimiento:\n- Criterios para identificar bajo rendimiento (indicadores observables).\n- Plan de mejora estructurado basado en objetivos SMART.\n- Evidencias requeridas para medir avances.\n- Acciones correctivas y soporte necesario.\n- Plazos de revisión: semanal/mensual.\n- KPIs de mejora y señales de alerta.\n- Consecuencias si no se alcanza la mejora esperada (sin incluir información disciplinaria real).\n- Recomendaciones para conversaciones difíciles.\n\nFormato:\nDos plantillas separadas (Alto Potencial + Bajo Rendimiento) en formato tabla + resumen narrativo orientado a la acción.\n\nSi necesitas adaptar las plantillas según rol, seniority, proyecto o situación concreta, pídemelo antes de generar la versión final."
  },
  {
    "Equipo": "Chapter Leads",
    "Use Case": "Relación con HR",
    "Situacion / Problema": "Necesito preparar respuestas estructuradas a requerimientos de HR, organizar procesos internos de evaluación y coordinar acciones cuando apliquen, garantizando compliance corporativo.",
    "Valor / Beneficio": "Asegura respuestas coherentes y bien documentadas ante HR, reduce riesgos de compliance y facilita la gestión de situaciones sensibles con rigor profesional.",
    "Nivel de datos (DPC / DSK)": "DPC 1",
    "Save up": "2–4 horas por gestión con HR",
    "Notas": "Chapter Leads",
    "Prompt": "Necesito una plantilla completa para gestionar interacciones formales y procesos internos en coordinación con HR dentro de T-Systems Iberia.\n\nObjetivo:\nResponder de forma profesional y consistente a requerimientos de HR, documentar información clave y asegurar que los procesos internos (evaluaciones, incidencias, conversaciones difíciles) se gestionan con claridad, rigor y cumplimiento corporativo.\n\nIncluye:\n\n1) Respuestas a requerimientos de HR:\n- Resumen del caso o solicitud.\n- Datos objetivos relevantes (sin incluir información sensible o personal no permitida).\n- Evaluación estructurada de la situación.\n- Acciones realizadas y evidencias disponibles.\n- Riesgos asociados desde una perspectiva operativa o de equipo.\n- Próximos pasos recomendados.\n\n2) Procesos internos de evaluación:\n- Plantilla para coordinar evaluaciones internas o solicitudes especiales.\n- Criterios de valoración y evidencias requeridas.\n- Calendario de seguimiento y responsables.\n\n3) Acciones disciplinarias (cuando apliquen):\n- Estructura para documentar hechos de forma objetiva.\n- Análisis profesional sin juicios de valor.\n- Registro de evidencias verificables.\n- Recomendaciones para la comunicación con HR.\n- Indicaciones para mantener compliance y evitar prácticas no autorizadas.\n\nFormato:\nPlantilla editable + informe breve en texto estructurado.\n\nSi falta contexto (tipo de requerimiento, rol del empleado, situación específica o alcance), solicítalo antes de generar la versión final."
  },
  {
    "Equipo": "Chapter Leads",
    "Use Case": "Comunicación organizativa",
    "Situacion / Problema": "Necesito redactar comunicaciones formales al equipo, preparar mensajes delicados y traducir decisiones corporativas de forma clara, empática y alineada con los valores de T-Systems Iberia.",
    "Valor / Beneficio": "Mejora la claridad y el impacto de las comunicaciones internas, reduce malentendidos y refuerza la confianza del equipo ante cambios o mensajes sensibles.",
    "Nivel de datos (DPC / DSK)": "DPC 1",
    "Save up": "1–3 horas por comunicación",
    "Notas": "Chapter Leads",
    "Prompt": "Necesito una plantilla completa para redactar comunicaciones organizativas dirigidas al equipo dentro de T-Systems Iberia.\n\nObjetivo:\nTransmitir mensajes corporativos o de equipo de forma clara, profesional y empática, asegurando comprensión, transparencia y alineación con los valores de la organización.\n\nIncluye:\n\n1) Estructura del mensaje:\n- Asunto claro y directo.\n- Introducción breve que contextualice el motivo de la comunicación.\n- Mensaje principal explicado de forma sencilla y sin tecnicismos innecesarios.\n- Motivo del cambio o comunicación (razones, impacto organizativo o de servicio).\n- Detalle del impacto para el equipo: qué cambia, qué se mantiene igual, plazos y próximos pasos.\n- Acciones que el equipo debe realizar, si aplica.\n- Mensaje final de tranquilidad, cohesión y disponibilidad.\n- Cierre profesional.\n\n2) Consideraciones específicas:\n- Adaptar el tono según la sensibilidad del mensaje (neutro, empático, motivador).\n- Evitar ambigüedades, alarmas innecesarias o información no confirmada.\n- Formular anticipaciones: posibles dudas del equipo y cómo abordarlas.\n- Añadir un apartado de preguntas frecuentes si el mensaje es complejo.\n\n3) Reglas de comunicación corporativa:\n- Claridad y concisión.\n- Lenguaje respetuoso y profesional.\n- Evitar datos sensibles o información personal.\n- Mantener alineación con guidelines internas de comunicación.\n\nFormato:\nEmail corporativo estructurado + versión corta para canales internos (Teams, Yammer o similar).\n\nSi necesitas adaptar la comunicación según el tema, el tipo de cambio o el público destinatario, pídemelo antes de generar la versión final."
  },
  {
    "Equipo": "Chapter Leads",
    "Use Case": "Reporting y seguimiento del Chapter",
    "Situacion / Problema": "Necesito consolidar métricas del Chapter, preparar informes periódicos y estructurar datos para la toma de decisiones sobre el estado del equipo, el talento y los riesgos operativos.",
    "Valor / Beneficio": "Proporciona visibilidad completa del estado del equipo, facilita decisiones informadas y permite anticipar riesgos antes de que impacten en el servicio.",
    "Nivel de datos (DPC / DSK)": "DPC 1",
    "Save up": "3–5 horas por informe trimestral",
    "Notas": "Chapter Leads",
    "Prompt": "Necesito una plantilla completa para generar un informe de reporting y seguimiento del equipo dentro de T-Systems Iberia.\n\nObjetivo:\nTener una visión clara y consolidada del estado del equipo, el cumplimiento operativo, la evolución del talento y los riesgos que puedan afectar a la prestación del servicio, facilitando la toma de decisiones informadas.\n\nIncluye:\n\n1) Situación general del equipo:\n- Número de personas, cambios recientes (altas/bajas), rotación prevista.\n- Capacidad disponible vs. capacidad utilizada.\n- Carga de trabajo y distribución por proyecto/cliente (si aplica).\n\n2) Cumplimiento operativo:\n- Formación obligatoria completada.\n- Imputación de horas y regularidad.\n- Vacaciones planificadas vs. aprobadas.\n- Indicadores clave de cumplimiento (KPI).\n\n3) Evolución de talento:\n- Avances en planes de desarrollo.\n- Perfiles con riesgos (bajo rendimiento, sobrecarga, desmotivación).\n- Identificación de alto potencial y necesidades de formación.\n\n4) Rendimiento y estado de proyectos:\n- Hitos relevantes.\n- Riesgos operativos detectados.\n- Necesidades de refuerzo o reasignación de recursos.\n\n5) Riesgos globales y mitigaciones:\n- Riesgos a corto y medio plazo.\n- Acciones propuestas para mitigarlos.\n- Dependencias con otras áreas o unidades.\n\n6) Próximos pasos y prioridades del siguiente periodo:\n- Acciones inmediatas.\n- Objetivos estratégicos y operativos.\n- Recomendaciones para dirección (si aplica).\n\nFormato:\nInforme trimestral en texto estructurado + tablas para KPIs, capacidad y riesgos.\n\nSi falta información sobre el equipo, los KPIs disponibles o el periodo a analizar, pídemelo antes de generar el reporte final."
  }
];

const lastChapterIndex = data.map((x, i) => x['Equipo'] === 'Chapter Leads' ? i : -1).filter(i => i >= 0).pop();
data.splice(lastChapterIndex + 1, 0, ...newEntries);

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
const verify = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const cl = verify.filter(x => x['Equipo'] === 'Chapter Leads');
console.log('Chapter Leads entries:', cl.length);
cl.forEach((e, i) => console.log(` ${i + 1}.`, e['Use Case']));
