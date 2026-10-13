#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(HERE, '..');
const TEMPLATE_PATH = join(SKILL_ROOT, 'assets', 'template.html');
const SCHEMA_PATH = join(SKILL_ROOT, 'schemas', 'feature.schema.json');

const PLACEHOLDERS = /(___+|TODO|FIXME|TBD|\bXXX\b|\{\{|\}\})/;

function fail(message, extra = {}) {
  process.stdout.write(JSON.stringify({ ok: false, error: message, ...extra }, null, 2) + '\n');
  process.exit(1);
}

function ok(payload) {
  process.stdout.write(JSON.stringify({ ok: true, ...payload }, null, 2) + '\n');
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadSchema() {
  if (!existsSync(SCHEMA_PATH)) fail(`schema not found: ${SCHEMA_PATH}`);
  try {
    return JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  } catch (err) {
    fail(`schema is not valid JSON: ${err.message}`);
  }
}

function loadTemplate() {
  if (!existsSync(TEMPLATE_PATH)) fail(`template not found: ${TEMPLATE_PATH}`);
  return readFileSync(TEMPLATE_PATH, 'utf8');
}

function walkStrings(node, path, out) {
  if (typeof node === 'string') out.push({ path, value: node });
  else if (Array.isArray(node)) node.forEach((item, i) => walkStrings(item, `${path}[${i}]`, out));
  else if (node && typeof node === 'object')
    for (const [key, value] of Object.entries(node)) walkStrings(value, `${path}.${key}`, out);
}

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateSchema(schema, data, path, errors) {
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path}: must be one of ${schema.enum.join(', ')} (got ${JSON.stringify(data)})`);
    return;
  }
  if (schema.type) {
    const actual = typeOf(data);
    if (actual !== schema.type) {
      errors.push(`${path}: expected ${schema.type}, got ${actual}`);
      return;
    }
  }
  if (schema.type === 'string') {
    if (schema.minLength !== undefined && data.trim().length < schema.minLength)
      errors.push(`${path}: minLength ${schema.minLength} not met`);
    if (schema.pattern && !new RegExp(schema.pattern).test(data))
      errors.push(`${path}: does not match pattern ${schema.pattern}`);
  }
  if (schema.type === 'array') {
    if (schema.minItems !== undefined && data.length < schema.minItems)
      errors.push(`${path}: minItems ${schema.minItems} not met (got ${data.length})`);
    if (schema.items) data.forEach((item, i) => validateSchema(schema.items, item, `${path}[${i}]`, errors));
  }
  if (schema.type === 'object') {
    for (const key of schema.required || [])
      if (!(key in data)) errors.push(`${path}.${key}: required property missing`);
    for (const [key, value] of Object.entries(data)) {
      const prop = schema.properties?.[key];
      if (prop) validateSchema(prop, value, `${path}.${key}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${path}.${key}: unexpected property`);
    }
  }
}

function gate(name, errors) {
  return { name, pass: errors.length === 0, errors };
}

function contentGates(candidate) {
  const strings = [];
  walkStrings(candidate, '$', strings);
  const placeholders = strings
    .filter((s) => PLACEHOLDERS.test(s.value))
    .map((s) => `${s.path}: "${s.value}"`);
  const empties = strings
    .filter((s) => s.value.trim().length === 0)
    .map((s) => `${s.path}: empty string`);
  const storyErrors = [];
  candidate.stories.forEach((story, i) => {
    if (!/^\S+/.test(story.id)) storyErrors.push(`$.stories[${i}].id: blank id`);
  });
  return [
    gate('placeholders', [...placeholders, ...empties]),
    gate('stories-shape', storyErrors),
  ];
}

function deliverGates(html, candidate) {
  const external = [];
  if (/rel=["']stylesheet["']/.test(html)) external.push('external <link rel="stylesheet">');
  const cssUrl = html.match(/url\(\s*['"]?https?:\/\/[^)]+\)/g) || [];
  external.push(...cssUrl);
  const cdn = html.match(/<script[^>]+src=["']https?:/g) || [];
  external.push(...cdn);

  const requiredHeadings = [
    'Contexto y objetivo',
    'Alcance',
    'Qué queda fuera',
    'Definiciones pendientes',
    'Flujo paso a paso',
    'Historias de usuario',
  ];
  if (candidate.techImpact) requiredHeadings.push('Impacto técnico');
  const missingHeadings = requiredHeadings.filter((h) => !html.includes(h));

  const structural = [];
  if (!html.includes('@page')) structural.push('missing @page print rule');
  if (!html.includes('id="themeToggle"')) structural.push('missing theme toggle');
  if (!html.includes(esc(candidate.meta.title))) structural.push('cover title not rendered');
  if (!html.includes('lang="es"')) structural.push('missing lang attribute');

  return [
    gate('self-contained', external),
    gate('headings', missingHeadings.map((h) => `missing heading: ${h}`)),
    gate('structure', structural),
  ];
}

function render(candidate, template) {
  const m = candidate.meta;
  const t = (v) => esc(v);
  const li = (items, cls) => `<ul class="${cls}">${items.map((i) => `<li>${t(i)}</li>`).join('\n')}</ul>`;

  const sections = [];
  const tocEntries = [];
  const addSection = (id, title, body) => {
    tocEntries.push(`<li><a href="#${id}">${t(title)}</a></li>`);
    sections.push(
      `<section class="card" id="${id}">\n<h2>${t(title)}</h2>\n${body}\n</section>`
    );
  };

  addSection(
    'contexto',
    'Contexto y objetivo',
    `<p>${t(candidate.context.summary)}</p>\n<p class="objective"><b>Objetivo:</b> ${t(candidate.context.objective)}</p>`
  );

  addSection(
    'alcance',
    'Alcance',
    `<div class="cols">
<div>
<p class="subhead">Qué entra</p>
${li(candidate.scope.in, 'list-in')}
</div>
<div>
<p class="subhead">Qué queda fuera</p>
${li(candidate.scope.out, 'list-out')}
</div>
</div>
<p class="subhead" style="margin-top:20px">Definiciones pendientes</p>
${li(candidate.scope.pending, 'list-pending')}`
  );

  const steps = candidate.flow.steps
    .map((s) => `<li><b>${t(s.title)}</b>${t(s.detail)}</li>`)
    .join('\n');
  addSection('flujo', 'Flujo paso a paso', `<ol class="flow">\n${steps}\n</ol>`);

  const stories = candidate.stories
    .map(
      (s) =>
        `<div class="story">
<span class="sid">${t(s.id)}</span>
<p>Como <b>${t(s.as)}</b>, quiero ${t(s.want)},</p>
<p><em>para</em> ${t(s.so)}.</p>
</div>`
    )
    .join('\n');
  addSection('historias', 'Historias de usuario', stories);

  if (candidate.techImpact) {
    const ti = candidate.techImpact;
    const parts = [];
    if (ti.services)
      parts.push(
        `<p class="subhead">Servicios</p>\n<div class="chips">${ti.services
          .map((s) => `<span class="chip">${t(s)}</span>`)
          .join('')}</div>`
      );
    if (ti.endpoints)
      parts.push(
        `<p class="subhead">Endpoints</p>
<table class="data">
<thead><tr><th>Método</th><th>Ruta</th></tr></thead>
<tbody>${ti.endpoints
          .map((e) => `<tr><td><code class="method">${t(e.method)}</code></td><td>${t(e.path)}</td></tr>`)
          .join('')}</tbody>
</table>`
      );
    if (ti.tables)
      parts.push(
        `<p class="subhead">Tablas</p>\n<div class="chips">${ti.tables
          .map((s) => `<span class="chip">${t(s)}</span>`)
          .join('')}</div>`
      );
    if (ti.files)
      parts.push(
        `<p class="subhead">Archivos</p>\n<div class="chips">${ti.files
          .map((s) => `<span class="chip">${t(s)}</span>`)
          .join('')}</div>`
      );
    addSection('impacto', 'Impacto técnico', parts.join('\n'));
  }

  if (candidate.notes)
    addSection('notas', 'Notas', `<ul class="notes">${candidate.notes.map((n) => `<li>${t(n)}</li>`).join('')}</ul>`);

  const authorBadge = m.author ? `<span class="badge"><b>Autor:</b> ${t(m.author)}</span>` : '';
  const toc = `<nav class="toc" aria-label="Índice">
<h2>Índice</h2>
<ol>
${tocEntries.join('\n')}
</ol>
</nav>`;

  return template
    .replace('{{TITLE}}', t(m.title))
    .replace('{{SERVICE}}', t(m.service))
    .replace('{{ROLE}}', t(m.role))
    .replace('{{STATUS}}', t(m.status))
    .replace('{{VERSION}}', t(m.version))
    .replace('{{DATE}}', t(m.date))
    .replace('{{AUTHOR_BADGE}}', authorBadge)
    .replace('{{TOC}}', toc)
    .replace('{{SECTIONS}}', sections.join('\n'))
    .replaceAll('{{TITLE}}', t(m.title))
    .replaceAll('{{DATE}}', t(m.date));
}

function cmdDoctor() {
  const problems = [];
  if (!existsSync(TEMPLATE_PATH)) problems.push(`template missing: ${TEMPLATE_PATH}`);
  if (!existsSync(SCHEMA_PATH)) problems.push(`schema missing: ${SCHEMA_PATH}`);
  if (existsSync(SCHEMA_PATH)) {
    try {
      JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
    } catch (err) {
      problems.push(`schema invalid JSON: ${err.message}`);
    }
  }
  if (existsSync(TEMPLATE_PATH)) {
    const tpl = readFileSync(TEMPLATE_PATH, 'utf8');
    for (const token of ['{{TITLE}}', '{{TOC}}', '{{SECTIONS}}', 'id="themeToggle"', '@page'])
      if (!tpl.includes(token)) problems.push(`template missing token/marker: ${token}`);
  }
  if (problems.length) fail('doctor failed', { problems });
  ok({ doctor: 'ready', node: process.version, template: TEMPLATE_PATH, schema: SCHEMA_PATH });
}

function cmdGuide(args) {
  const scenario = args.filter((a) => !a.startsWith('--')).join(' ') || '';
  ok({
    scenario,
    outputConvention: 'HTML always at the project root: <project-root>/<slug>.html (candidate next to it as <slug>.feature.json)',
    sections: [
      'meta: title, service, role, status (Propuesta | En implementación | Completada), version, date (YYYY-MM-DD), author',
      'context: summary (qué es y por qué), objective (qué resuelve)',
      'scope: in (qué entra), out (qué queda fuera), pending (definiciones pendientes)',
      'flow: steps[] con title + detail',
      'stories: id, as, want, so',
      'techImpact (opcional): services, endpoints[], tables, files',
      'notes (opcional)',
    ],
    askUser: [
      '¿Cómo se llama la feature exactamente?',
      '¿En qué servicio se implementa?',
      '¿A qué rol va dirigido el documento?',
      '¿Cuál es el objetivo de negocio en una frase?',
      '¿Qué queda explícitamente fuera de alcance?',
      '¿Qué definiciones siguen pendientes?',
      '¿Cuáles son los pasos del flujo, en orden?',
      '¿Qué historias de usuario la cubren?',
      '¿Hay endpoints/tablas/archivos afectados?',
    ],
  });
}

function cmdFinalize(args) {
  const positional = args.filter((a) => !a.startsWith('--'));
  const [candidatePath, outputPath] = positional;
  if (!candidatePath || !outputPath) fail('usage: finalize <candidate.json> <output.html> [--json]');

  const schema = loadSchema();
  const template = loadTemplate();

  let candidate;
  try {
    candidate = JSON.parse(readFileSync(resolve(candidatePath), 'utf8'));
  } catch (err) {
    fail(`candidate unreadable or invalid JSON: ${err.message}`);
  }

  const schemaErrors = [];
  validateSchema(schema, candidate, '$', schemaErrors);
  const gates = [gate('validate', schemaErrors)];
  if (schemaErrors.length === 0) gates.push(...contentGates(candidate));

  let html = null;
  if (gates.every((g) => g.pass)) {
    html = render(candidate, template);
    gates.push(...deliverGates(html, candidate));
  }

  const allPass = gates.every((g) => g.pass);
  if (allPass) {
    writeFileSync(resolve(outputPath), html, 'utf8');
  }
  const payload = {
    ok: allPass,
    command: 'finalize',
    candidate: resolve(candidatePath),
    output: allPass ? resolve(outputPath) : null,
    gates,
    summary: {
      total: gates.length,
      passed: gates.filter((g) => g.pass).length,
      failed: gates.filter((g) => !g.pass).length,
    },
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
  if (!allPass) process.exit(1);
}

const [, , command, ...rest] = process.argv;
if (command === 'doctor') cmdDoctor();
else if (command === 'guide') cmdGuide(rest);
else if (command === 'finalize') cmdFinalize(rest);
else {
  fail(`unknown command "${command ?? ''}". Use: doctor | guide "<scenario>" | finalize <candidate.json> <output.html>`);
}
