#!/usr/bin/env node
/**
 * migrate-multilang.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads prompts.json, corrects Spanish spelling, auto-translates es → ca + en,
 * and writes prompts.multilang.json.
 *
 * Setup:   npm install @vitalets/google-translate-api@8
 * Run:     node migrate-multilang.js
 * Options:
 *   --dry-run   Preview without calling the translation API.
 *   --resume    Continue from an existing prompts.multilang.json (skips already
 *               translated fields, only retranslates plain-string remainders).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────
const INPUT_FILE  = path.join(__dirname, 'prompts.json');
const OUTPUT_FILE = path.join(__dirname, 'prompts.multilang.json');

// ── Config ────────────────────────────────────────────────────────────────────
const DELAY_MS             = 400;   // ms between API calls — respect rate limits
const RETRY_DELAY_MS       = 2000;  // ms to wait between retry attempts
const MAX_RETRIES          = 3;     // retry count on network errors
const LONG_FIELD_THRESHOLD = 3000;  // fields longer than this are chunk-split
const CHUNK_MAX            = 2000;  // max chars per translation chunk

// Fields to convert to { es, ca, en } objects.
// Fields NOT listed here (e.g. "Nivel de datos (DPC / DSK)") are preserved as-is.
const translatableFields = [
  'Equipo',
  'Use Case',
  'Situacion / Problema',
  'Valor / Beneficio',
  'Prompt',
  'Notas',
  'Save up',
];

// ── Spanish spell-correction map ──────────────────────────────────────────────
// Each entry: [RegExp, replacement]
// Only apply safe, unambiguous corrections.
const SPELL_MAP = [
  // Duplicated words / obvious typos found in the corpus
  [/\bquee\b/g,            'que'],
  [/\benfoquees\b/g,       'enfoques'],
  [/\barqueitecton/gi,     'arquitecton'],   // arqueitectonica → arquitectónica
  [/\banalaticos\b/gi,     'analíticos'],

  // Missing tildes — common nouns & verbs
  [/\banalisis\b/g,        'análisis'],
  [/\banalizar\b/g,        'analizar'],       // already correct, no-op
  [/\boptimizacion\b/g,    'optimización'],
  [/\boptimizaciones\b/g,  'optimizaciones'],
  [/\bgestion\b/g,         'gestión'],
  [/\bgenstiones\b/g,      'gestiones'],
  [/\bgestiones\b/g,       'gestiones'],
  [/\bevaluacion\b/g,      'evaluación'],
  [/\bevaluaciones\b/g,    'evaluaciones'],
  [/\bdefinicion\b/g,      'definición'],
  [/\bdefiniciones\b/g,    'definiciones'],
  [/\bimplementacion\b/g,  'implementación'],
  [/\bintegracion\b/g,     'integración'],
  [/\bintegraciones\b/g,   'integraciones'],
  [/\bautomatizacion\b/g,  'automatización'],
  [/\bgeneracion\b/g,      'generación'],
  [/\bdocumentacion\b/g,   'documentación'],
  [/\bcomunicacion\b/g,    'comunicación'],
  [/\binformacion\b/g,     'información'],
  [/\bcolaboracion\b/g,    'colaboración'],
  [/\bplanificacion\b/g,   'planificación'],
  [/\bpresentacion\b/g,    'presentación'],
  [/\bpreparacion\b/g,     'preparación'],
  [/\bconfiguracion\b/g,   'configuración'],
  [/\bvalidacion\b/g,      'validación'],
  [/\baccion\b/g,          'acción'],
  [/\bacciones\b/g,        'acciones'],       // already correct
  [/\breunion\b/g,         'reunión'],
  [/\breuniones\b/g,       'reuniones'],
  [/\bdecision\b/g,        'decisión'],
  [/\bdecisiones\b/g,      'decisiones'],
  [/\bsolucion\b/g,        'solución'],
  [/\bsoluciones\b/g,      'soluciones'],
  [/\brecuperacion\b/g,    'recuperación'],
  [/\bmigracion\b/g,       'migración'],
  [/\bmigraciones\b/g,     'migraciones'],
  [/\badopcion\b/g,        'adopción'],
  [/\badopciòn\b/g,        'adopción'],
  [/\bsesion\b/g,          'sesión'],
  [/\bsesiones\b/g,        'sesiones'],
  [/\biteracion\b/g,       'iteración'],
  [/\biteraciones\b/g,     'iteraciones'],
  [/\brevisuion\b/g,       'revisión'],
  [/\bsituacion\b/g,       'situación'],
  [/\batencion\b/g,        'atención'],
  [/\bfuncion\b/g,         'función'],
  [/\bfunciones\b/g,       'funciones'],
  [/\bpublicacion\b/g,     'publicación'],
  [/\bpublicaciones\b/g,   'publicaciones'],
  [/\bproduccion\b/g,      'producción'],
  [/\bcreacion\b/g,        'creación'],
  [/\bcreaciones\b/g,      'creaciones'],
  [/\bseleccion\b/g,       'selección'],
  [/\bseleccionar\b/g,     'seleccionar'],    // already correct
  [/\bpromotion\b/g,       'promoción'],
  [/\bcontribucion\b/g,    'contribución'],
  [/\bejecucion\b/g,       'ejecución'],
  [/\bdistribucion\b/g,    'distribución'],
  [/\bconexion\b/g,        'conexión'],
  [/\bconexiones\b/g,      'conexiones'],
  [/\bpeticion\b/g,        'petición'],
  [/\bpeticiones\b/g,      'peticiones'],
  [/\batencion\b/g,        'atención'],

  // Encoding artefacts (UTF-8 mojibake)
  [/Ã©/g, 'é'], [/Ã³/g, 'ó'], [/Ã­/g, 'í'],
  [/Ã¡/g, 'á'], [/Ã±/g, 'ñ'], [/â€œ/g, '"'], [/â€/g, '"'],
];

function correctSpelling(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  for (const [pattern, replacement] of SPELL_MAP) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// ── Translation via translate.googleapis.com (routed through corporate proxy) ─
const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Read proxy from npm config, then env vars, then the known corporate default
const PROXY_URL =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY  ||
  process.env.http_proxy  ||
  'http://10.36.129.6:8080';

const proxyAgent = new HttpsProxyAgent(PROXY_URL);

/**
 * Raw HTTPS GET via corporate proxy, returning the response body as a string.
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      agent: proxyAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json, text/javascript, */*',
      },
    }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(new Error('Request timed out')); });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function translateChunk(text, to) {
  // Public Google Translate endpoint — same one used by browser extensions
  const url =
    'https://translate.googleapis.com/translate_a/single' +
    '?client=gtx&sl=es&tl=' + encodeURIComponent(to) +
    '&dt=t&q=' + encodeURIComponent(text);

  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await sleep(DELAY_MS);
      const raw  = await httpGet(url);
      const json = JSON.parse(raw);
      // Response: [[['translated','original',...], ...], null, 'es', ...]
      return json[0].map((item) => item[0]).filter(Boolean).join('');
    } catch (err) {
      lastErr = err;
      process.stdout.write(` [retry ${attempt}/${MAX_RETRIES}]`);
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastErr;
}

/**
 * Split text by paragraph breaks (\n\n), keeping each chunk <= maxLen chars.
 * Falls back to line-splitting when a single paragraph exceeds maxLen.
 */
function splitIntoChunks(text, maxLen) {
  if (text.length <= maxLen) return [text];

  const chunks  = [];
  let   current = '';

  for (const para of text.split('\n\n')) {
    const sep       = current ? '\n\n' : '';
    const candidate = current + sep + para;

    if (candidate.length > maxLen) {
      if (current) chunks.push(current);
      current = '';

      // Paragraph itself too long → fall back to line-splitting
      if (para.length > maxLen) {
        for (const line of para.split('\n')) {
          const lineSep      = current ? '\n' : '';
          const lineCandidate = current + lineSep + line;
          if (lineCandidate.length > maxLen) {
            if (current) chunks.push(current);
            // Single line too long → push as-is (translator handles it)
            if (line.length > maxLen) { chunks.push(line); current = ''; }
            else                      { current = line; }
          } else {
            current = lineCandidate;
          }
        }
      } else {
        current = para;
      }
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

/**
 * Translate text to the target language.
 * Long texts (>LONG_FIELD_THRESHOLD) are paragraph-split into CHUNK_MAX pieces.
 */
async function translateText(text, to) {
  if (!text || text.trim() === '') return text;

  if (text.length <= LONG_FIELD_THRESHOLD) {
    return translateChunk(text, to);
  }

  // Long field: split by paragraphs and translate each chunk
  const chunks = splitIntoChunks(text, CHUNK_MAX);
  process.stdout.write(` [${chunks.length} chunks]`);
  const parts = [];
  for (const chunk of chunks) {
    parts.push(await translateChunk(chunk, to));
  }
  return parts.join('\n\n');
}

// ── Value-type guards ─────────────────────────────────────────────────────────
function isAlreadyTranslated(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.es === 'string'
  );
}

function isTranslatableValue(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value))                  return false;
  if (typeof value === 'number')             return false;
  if (typeof value === 'boolean')            return false;
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isResume = process.argv.includes('--resume');

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  prompts.json → multilang migration                      ║');
  console.log(isDryRun
    ? '║  MODE: DRY-RUN  (no API calls)                           ║'
    : isResume
      ? '║  MODE: RESUME   (skip already-translated fields)         ║'
      : '║  MODE: FULL     (translate all fields)                   ║'
  );
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // ── Load input ──────────────────────────────────────────────────────────────
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`✗  Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  let data;
  if (isResume && fs.existsSync(OUTPUT_FILE)) {
    data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    console.log(`  Resuming from: ${OUTPUT_FILE} (${data.length} entries)`);
  } else {
    data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    console.log(`  Input:  ${INPUT_FILE} (${data.length} entries)`);
  }
  console.log(`  Output: ${OUTPUT_FILE}`);
  console.log('');

  // ── Process entries ─────────────────────────────────────────────────────────
  const result       = [];
  const recordErrors = [];   // accumulates per-entry translation failures
  let   nTranslated  = 0;
  let   nSkipped     = 0;
  let   nErrors      = 0;

  const ERRORS_FILE = path.join(__dirname, 'translation-errors.json');

  for (let i = 0; i < data.length; i++) {
    const entry    = data[i];
    const newEntry = { ...entry };

    const rawLabel = entry['Use Case'] || entry['Equipo'] || `entry #${i + 1}`;
    const useCase  = (
      typeof rawLabel === 'string'
        ? rawLabel
        : rawLabel.es || rawLabel.en || String(rawLabel)
    ).slice(0, 55);

    console.log(`[${i + 1}/${data.length}] Translating: ${useCase}`);

    for (const field of translatableFields) {
      if (!(field in entry)) continue;

      const rawValue = entry[field];

      // ── Already multilingual → skip ────────────────────────────────────────
      if (isAlreadyTranslated(rawValue)) {
        console.log(`        ${field.padEnd(26)}  ⏭  already multilingual`);
        nSkipped++;
        continue;
      }

      // ── Non-string / empty → preserve as-is ───────────────────────────────
      if (!isTranslatableValue(rawValue)) {
        console.log(`        ${field.padEnd(26)}  ⏭  non-string (preserved)`);
        continue;
      }

      const es = correctSpelling(String(rawValue));

      // ── Dry-run → mock output ──────────────────────────────────────────────
      if (isDryRun) {
        newEntry[field] = { es, ca: '[DRY-RUN]', en: '[DRY-RUN]' };
        console.log(`        ${field.padEnd(26)}  ✓  (dry-run)`);
        nTranslated++;
        continue;
      }

      // ── Live translation ───────────────────────────────────────────────────
      process.stdout.write(`        ${field.padEnd(26)}  translating…`);
      try {
        const ca = await translateText(es, 'ca');
        const en = await translateText(es, 'en');
        newEntry[field] = { es, ca, en };
        process.stdout.write(' ✓\n');
        nTranslated++;
      } catch (err) {
        process.stdout.write(` ✗ ${err.message}\n`);
        // Fallback: keep corrected Spanish in all slots so the app always has
        // a valid { es, ca, en } object — record is NOT skipped.
        newEntry[field] = { es, ca: es, en: es };
        nErrors++;
        recordErrors.push({
          entry:   i + 1,
          useCase,
          field,
          error:   err.message,
          ts:      new Date().toISOString(),
        });
        // Persist errors immediately so partial info is never lost
        fs.writeFileSync(ERRORS_FILE, JSON.stringify(recordErrors, null, 2), 'utf8');
      }
    }

    result.push(newEntry);

    // Persist after every entry so --resume can recover from interruptions
    if (!isDryRun) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');
    }
  }

  // Final write (covers dry-run too)
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');

  // ── Final validation ─────────────────────────────────────────────────────────
  const srcData  = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

  // Normalize: strip diacritics + lowercase for comparison (spell correction
  // may add accents that weren't in the original source strings)
  const norm = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const normOut = result.map((r) => {
    const v = r['Use Case'];
    return norm(typeof v === 'object' ? (v.es || '') : v);
  });

  // Apply spell correction to source values before comparing, since the output
  // may have corrected typos (e.g. "enfoquees" → "enfoques")
  const missingEntries = srcData.filter(
    (r) => !normOut.includes(norm(correctSpelling(r['Use Case'] || '')))
  );

  console.log('');
  console.log('──────────────────────────────────────────────────────────');
  console.log(`  ✓  Translated : ${nTranslated} field(s)`);
  console.log(`  ⏭  Skipped    : ${nSkipped} field(s)  (already multilingual)`);
  if (nErrors) {
    console.log(`  ✗  Errors     : ${nErrors} field(s)  (es used as fallback, see translation-errors.json)`);
  }
  console.log(`  →  Written to : ${OUTPUT_FILE}`);
  console.log('');
  console.log('  Validation:');
  if (result.length === srcData.length) {
    console.log(`  ✓  Lengths match: ${result.length} === ${srcData.length}`);
  } else {
    console.log(`  ✗  Length mismatch: output ${result.length} vs source ${srcData.length}`);
  }
  if (missingEntries.length === 0) {
    console.log(`  ✓  All ${srcData.length} source entries found in output`);
  } else {
    console.log(`  ✗  Missing ${missingEntries.length} entries:`);
    missingEntries.forEach((r) => console.log(`     - ${r['Use Case']}`))
  }
  console.log('');
}

main().catch(err => {
  console.error('\n✗  Fatal error:', err.message);
  process.exit(1);
});
