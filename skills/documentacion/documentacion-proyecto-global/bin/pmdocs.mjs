#!/usr/bin/env node
// pmdocs — genera el set de documentacion de proyecto (PMBOK adaptado) desde un JSON tipado.
// Cero dependencias: valida el schema, renderiza plantillas Markdown y aplica gates.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(HERE, "..");
const SCHEMA_PATH = join(SKILL_ROOT, "schemas", "proyecto.schema.json");
const TEMPLATES_DIR = join(SKILL_ROOT, "templates");
const METADATA_TEMPLATE = "_metadata.md";
const ADR_TEMPLATE = "03-tecnico/adr.md";

const PLACEHOLDERS = /(___+|TODO|FIXME|TBD|\bXXX\b)/;

const PHASE_NAMES = {
  "00-inicio": "Inicio",
  "01-definicion": "Definicion",
  "02-planificacion": "Planificacion",
  "03-tecnico": "Tecnico",
  "04-negocio": "Negocio",
  "05-ejecucion": "Ejecucion",
  "06-cierre": "Cierre",
};
const PHASES = Object.keys(PHASE_NAMES);

// Catalogo de documentos: tier "solo" (indispensable siempre), "equipo" (requerido con equipo),
// "opcional" (solo si el candidato trae datos). `mermaid` exige bloque ```mermaid en la salida.
const CATALOG = [
  { key: "acta-constitucion", phase: "00-inicio", file: "acta-constitucion.md", title: "Acta de Constitucion", tier: "solo" },
  { key: "stakeholders", phase: "00-inicio", file: "stakeholders.md", title: "Mapa de Stakeholders", tier: "solo" },
  { key: "objetivos-smart", phase: "00-inicio", file: "objetivos-smart.md", title: "Test de Objetivos SMART", tier: "solo" },
  { key: "vision-producto", phase: "01-definicion", file: "vision-producto.md", title: "Vision de Producto", tier: "solo" },
  { key: "alcance-mvp", phase: "01-definicion", file: "alcance-mvp.md", title: "Declaracion de Alcance (MVP)", tier: "solo" },
  { key: "requisitos-ers", phase: "01-definicion", file: "requisitos-ers.md", title: "Especificacion de Requisitos (ERS)", tier: "solo" },
  { key: "analisis-competitivo", phase: "01-definicion", file: "analisis-competitivo.md", title: "Analisis Competitivo", tier: "opcional" },
  { key: "posicionamiento", phase: "01-definicion", file: "posicionamiento.md", title: "Posicionamiento", tier: "opcional" },
  { key: "edt-epicas", phase: "02-planificacion", file: "edt-epicas.md", title: "EDT / Epicas", tier: "solo", mermaid: true },
  { key: "cronograma-hitos", phase: "02-planificacion", file: "cronograma-hitos.md", title: "Cronograma de Hitos", tier: "solo", mermaid: true },
  { key: "roles-raci", phase: "02-planificacion", file: "roles-raci.md", title: "Matriz de Roles y Responsabilidades (RACI)", tier: "solo" },
  { key: "plan-riesgos", phase: "02-planificacion", file: "plan-riesgos.md", title: "Plan de Riesgos", tier: "solo" },
  { key: "control-cambios", phase: "02-planificacion", file: "control-cambios.md", title: "Control de Cambios", tier: "equipo" },
  { key: "plan-comunicaciones", phase: "02-planificacion", file: "plan-comunicaciones.md", title: "Plan de Comunicaciones", tier: "equipo" },
  { key: "arquitectura", phase: "03-tecnico", file: "arquitectura.md", title: "Arquitectura de la Solucion", tier: "solo", mermaid: true },
  { key: "modelo-datos", phase: "03-tecnico", file: "modelo-datos.md", title: "Modelo de Datos", tier: "solo", mermaid: true },
  { key: "api-contratos", phase: "03-tecnico", file: "api-contratos.md", title: "Contratos de API", tier: "solo" },
  { key: "seguridad-privacidad", phase: "03-tecnico", file: "seguridad-privacidad.md", title: "Seguridad y Privacidad", tier: "solo" },
  { key: "ux-wireframes", phase: "03-tecnico", file: "ux-wireframes.md", title: "UX y Wireframes", tier: "opcional", mermaid: true },
  { key: "adr", phase: "03-tecnico", dir: "adr", title: "Registro de Decisiones de Arquitectura (ADR)", tier: "equipo", multi: "tecnico.adrs" },
  { key: "modelo-negocio-pricing", phase: "04-negocio", file: "modelo-negocio-pricing.md", title: "Modelo de Negocio y Pricing", tier: "solo" },
  { key: "unit-economics", phase: "04-negocio", file: "unit-economics.md", title: "Unit Economics", tier: "solo" },
  { key: "gtm-lanzamiento", phase: "04-negocio", file: "gtm-lanzamiento.md", title: "Plan de Lanzamiento (Go-To-Market)", tier: "equipo" },
  { key: "plan-sprints", phase: "05-ejecucion", file: "plan-sprints.md", title: "Plan de Sprints", tier: "solo" },
  { key: "calidad-testing", phase: "05-ejecucion", file: "calidad-testing.md", title: "Estrategia de Calidad y Testing", tier: "solo" },
  { key: "runbook-ops", phase: "05-ejecucion", file: "runbook-ops.md", title: "Runbook de Operaciones", tier: "equipo" },
  { key: "acta-cierre", phase: "06-cierre", file: "acta-cierre.md", title: "Acta de Cierre", tier: "solo" },
  { key: "retrospectiva", phase: "06-cierre", file: "retrospectiva.md", title: "Retrospectiva", tier: "solo" },
  { key: "lecciones-aprendidas", phase: "06-cierre", file: "lecciones-aprendidas.md", title: "Lecciones Aprendidas", tier: "solo" },
];

// ---------- utilidades ----------
function fail(message, extra = {}) {
  process.stdout.write(JSON.stringify({ ok: false, error: message, ...extra }, null, 2) + "\n");
  process.exit(1);
}
function gate(name, errors) {
  return { name, pass: errors.length === 0, errors };
}
function getPath(obj, path) {
  return String(path)
    .split(".")
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}
function cell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}
function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function labelText(value) {
  return String(value ?? "")
    .replace(/["[\]{}()]/g, "")
    .replace(/\r?\n/g, " ")
    .trim();
}
function mermaidId(value) {
  return String(value ?? "").replace(/[^A-Za-z0-9_]/g, "_");
}
function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
const bulletList = (items) => items.map((item) => `- ${cell(item)}`).join("\n");
const numberedList = (items) => items.map((item, i) => `${i + 1}. ${cell(item)}`).join("\n");

// ---------- builders ({@name}) para estructuras anidadas y diagramas Mermaid ----------
const CARDINALITY = { "1-1": "||--||", "1-N": "||--o{", "N-N": "}o--o{" };
const BUILDERS = {
  gantt(c) {
    const lines = [
      "```mermaid",
      "gantt",
      `    title Cronograma de hitos — ${labelText(c.meta.projectName)}`,
      "    dateFormat YYYY-MM-DD",
      "    axisFormat %d/%m",
      "    section Hitos",
    ];
    c.planificacion.milestones.forEach((m, i) => {
      const start = addDays(c.meta.date, (m.startWeek - 1) * 7);
      const name = labelText(m.name).replace(/:/g, " ");
      lines.push(`    ${name} :m${i + 1}, ${start}, ${m.durationWeeks * 7}d`);
    });
    lines.push("```");
    return lines.join("\n");
  },
  erd(c) {
    const lines = ["```mermaid", "erDiagram"];
    for (const entity of c.tecnico.dataModel.entities) {
      lines.push(`    ${mermaidId(entity.name)} {`);
      for (const field of entity.fields) lines.push(`        string ${mermaidId(field)}`);
      lines.push("    }");
    }
    for (const rel of c.tecnico.dataModel.relations) {
      const card = CARDINALITY[rel.kind] || "||--o{";
      lines.push(`    ${mermaidId(rel.from)} ${card} ${mermaidId(rel.to)} : "${labelText(rel.description)}"`);
    }
    lines.push("```");
    return lines.join("\n");
  },
  archflow(c) {
    const lines = ["```mermaid", "flowchart LR", `    core["${labelText(c.meta.projectName)}"]`];
    c.tecnico.architecture.modules.forEach((m, i) => {
      lines.push(`    mod${i + 1}["${labelText(m.name)}"]`);
      lines.push(`    core --> mod${i + 1}`);
    });
    lines.push("```");
    return lines.join("\n");
  },
  wbsTree(c) {
    const lines = ["```mermaid", "mindmap", `  root((${labelText(c.meta.projectName)}))`];
    for (const epic of c.planificacion.epics) {
      lines.push(`    ${mermaidId(epic.id)}[${labelText(epic.name)}]`);
      for (const pack of epic.packages) lines.push(`      ${labelText(pack)}`);
    }
    lines.push("```");
    return lines.join("\n");
  },
  uxFlow(c) {
    const views = (c.tecnico.ux && c.tecnico.ux.views) || [];
    return views
      .map((view, i) => {
        const lines = ["```mermaid", "flowchart TD", `    v${i}start(["${labelText(view.name)}"])`];
        view.flow.forEach((step, j) => lines.push(`    v${i}s${j}["${labelText(step)}"]`));
        view.flow.forEach((_, j) => {
          const from = j === 0 ? `v${i}start` : `v${i}s${j - 1}`;
          lines.push(`    ${from} --> v${i}s${j}`);
        });
        lines.push("```");
        return lines.join("\n");
      })
      .join("\n\n");
  },
  uxViews(c) {
    return ((c.tecnico.ux && c.tecnico.ux.views) || [])
      .map((view) => `### ${cell(view.name)}\n\n${cell(view.purpose)}\n\n${bulletList(view.flow)}`)
      .join("\n\n");
  },
  entitiesTable(c) {
    const rows = c.tecnico.dataModel.entities.map(
      (entity) => `| ${cell(entity.name)} | ${cell(entity.fields.join(", "))} |`
    );
    return ["| Entidad | Campos |", "|---|---|", ...rows].join("\n");
  },
  pricingTable(c) {
    const rows = c.negocio.pricing.plans.map(
      (plan) => `| ${cell(plan.name)} | ${cell(plan.price)} | ${cell(plan.billing)} | ${cell(plan.features.join("; "))} |`
    );
    return ["| Plan | Precio | Facturacion | Incluye |", "|---|---|---|---|", ...rows].join("\n");
  },
  wbsTable(c) {
    const rows = c.planificacion.epics.map(
      (epic) => `| ${cell(epic.id)} | ${cell(epic.name)} | ${cell(epic.packages.join("; "))} |`
    );
    return ["| ID | Epica | Paquetes de trabajo |", "|---|---|---|", ...rows].join("\n");
  },
  sprintsTable(c) {
    const rows = c.ejecucion.sprints.map(
      (sprint) => `| ${cell(sprint.name)} | ${cell(sprint.goal)} | ${cell(sprint.scope.join("; "))} | ${cell(sprint.weeks)} |`
    );
    return ["| Sprint | Objetivo | Alcance | Semanas |", "|---|---|---|---|", ...rows].join("\n");
  },
  smartMatrix(c) {
    const rows = c.definicion.objectives.map(
      (o) =>
        `| ${cell(o.id)} | ${cell(o.objective)} | ${cell(o.specific)} | ${cell(o.measurable)} | ${cell(o.achievable)} | ${cell(o.relevant)} | ${cell(o.time)} |`
    );
    return [
      "| ID | Objetivo | Especifico | Medible | Alcanzable | Relevante | Con tiempo |",
      "|---|---|---|---|---|---|---|",
      ...rows,
    ].join("\n");
  },
  riskMatrix(c) {
    const levels = ["Alta", "Media", "Baja"];
    const head = `| Probabilidad \\ Impacto | Alto | Medio | Bajo |`;
    const sep = "|---|---|---|---|";
    const rows = levels.map((prob) => {
      const cells = ["Alto", "Medio", "Bajo"].map((impact) => {
        const ids = c.planificacion.risks
          .filter((r) => r.probability === prob && r.impact === impact)
          .map((r) => r.id)
          .join(", ");
        return ids || "-";
      });
      return `| ${prob} | ${cells.join(" | ")} |`;
    });
    return [head, sep, ...rows].join("\n");
  },
  stakeholderMatrix(c) {
    const levels = ["Alto", "Medio", "Bajo"];
    const head = "| Poder \\ Interes | Alto | Medio | Bajo |";
    const sep = "|---|---|---|---|";
    const rows = levels.map((power) => {
      const cells = levels.map((interest) => {
        const names = c.inicio.stakeholders
          .filter((s) => s.power === power && s.interest === interest)
          .map((s) => s.name)
          .join(", ");
        return names || "-";
      });
      return `| ${power} | ${cells.join(" | ")} |`;
    });
    return [head, sep, ...rows].join("\n");
  },
};

// ---------- motor de plantillas ----------
function render(text, ctx) {
  const withEach = text.replace(/\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, path, body) => {
    const arr = getPath(ctx, path);
    if (!Array.isArray(arr)) return "";
    return arr
      .map((item, i) =>
        render(body, {
          ...ctx,
          ...(item && typeof item === "object" ? item : {}),
          this: item,
          "@index": i + 1,
        })
      )
      .join("");
  });
  const withBuilders = withEach.replace(/\{\{@(\w+)\}\}/g, (_, name) => {
    if (name === "index") return String(ctx["@index"] ?? "");
    const fn = BUILDERS[name];
    return fn ? fn(ctx) : "";
  });
  return withBuilders.replace(/\{\{([\w.]+)\}\}/g, (_, path) => cell(getPath(ctx, path)));
}

function loadSchema() {
  if (!existsSync(SCHEMA_PATH)) fail(`schema no encontrado: ${SCHEMA_PATH}`);
  try {
    return JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  } catch (err) {
    fail(`el schema no es JSON valido: ${err.message}`);
  }
}
function loadTemplate(rel) {
  const full = join(TEMPLATES_DIR, rel);
  if (!existsSync(full)) fail(`plantilla no encontrada: ${rel}`);
  return readFileSync(full, "utf8");
}
const metadataTemplate = () => loadTemplate(METADATA_TEMPLATE);

// ---------- validacion de schema (subconjunto de draft-07) ----------
function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}
function validateSchema(schema, data, path, errors) {
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path}: debe ser uno de ${schema.enum.join(", ")} (recibido ${JSON.stringify(data)})`);
    return;
  }
  if (schema.type) {
    const actual = typeOf(data);
    if (actual !== schema.type) {
      errors.push(`${path}: se esperaba ${schema.type}, se recibio ${actual}`);
      return;
    }
  }
  if (schema.type === "string") {
    if (schema.minLength !== undefined && data.trim().length < schema.minLength)
      errors.push(`${path}: minLength ${schema.minLength} no cumplido`);
    if (schema.pattern && !new RegExp(schema.pattern).test(data))
      errors.push(`${path}: no cumple el patron ${schema.pattern}`);
  }
  if (schema.type === "number") {
    if (schema.minimum !== undefined && data < schema.minimum)
      errors.push(`${path}: minimum ${schema.minimum} no cumplido (recibido ${data})`);
  }
  if (schema.type === "array") {
    if (schema.minItems !== undefined && data.length < schema.minItems)
      errors.push(`${path}: minItems ${schema.minItems} no cumplido (recibido ${data.length})`);
    if (schema.items) data.forEach((item, i) => validateSchema(schema.items, item, `${path}[${i}]`, errors));
  }
  if (schema.type === "object") {
    for (const key of schema.required || [])
      if (!(key in data)) errors.push(`${path}.${key}: falta una propiedad requerida`);
    for (const [key, value] of Object.entries(data)) {
      const prop = schema.properties && schema.properties[key];
      if (prop) validateSchema(prop, value, `${path}.${key}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${path}.${key}: propiedad inesperada`);
    }
  }
}
function walkStrings(node, path, out) {
  if (typeof node === "string") out.push({ path, value: node });
  else if (Array.isArray(node)) node.forEach((item, i) => walkStrings(item, `${path}[${i}]`, out));
  else if (node && typeof node === "object")
    for (const [key, value] of Object.entries(node)) walkStrings(value, `${path}.${key}`, out);
}

// ---------- seleccion de documentos e indice ----------
function hasData(c, d) {
  if (d.tier !== "opcional") return true;
  if (d.key === "analisis-competitivo")
    return !!(c.definicion.competencia && c.definicion.competencia.competitors.length);
  if (d.key === "posicionamiento")
    return !!(c.definicion.competencia && c.definicion.competencia.positioning.length);
  if (d.key === "ux-wireframes") return !!(c.tecnico.ux && c.tecnico.ux.views.length);
  return false;
}
function isIncluded(c, d) {
  if (d.tier === "solo") return true;
  if (d.tier === "equipo") return c.meta.teamSize === "equipo";
  return hasData(c, d);
}
const EQUIPO_DATA = {
  "control-cambios": (c) => c.planificacion.changeControl,
  "plan-comunicaciones": (c) => c.planificacion.communications,
  "gtm-lanzamiento": (c) => c.negocio.gtm,
  "runbook-ops": (c) => c.ejecucion.runbook,
  adr: (c) => c.tecnico.adrs && c.tecnico.adrs.length,
};

function baseCtx(candidate, doc, adr) {
  return { ...candidate, doc, adr };
}
function renderDoc(candidate, doc, templateRel, adr) {
  const ctx = baseCtx(candidate, doc, adr);
  const output = `${render(metadataTemplate(), ctx)}\n${render(loadTemplate(templateRel), ctx)}`;
  return output.replace(/\n{3,}/g, "\n\n");
}
function buildFiles(candidate) {
  const files = [];
  const included = [];
  for (const d of CATALOG) {
    if (!isIncluded(candidate, d)) continue;
    if (d.multi === "tecnico.adrs") {
      candidate.tecnico.adrs.forEach((adr) => {
        const rel = `${d.phase}/${d.dir}/${adr.id}-${slugify(adr.title)}.md`;
        const doc = { title: `ADR ${adr.id}: ${adr.title}`, phaseName: PHASE_NAMES[d.phase], file: rel };
        files.push({ rel, content: renderDoc(candidate, doc, ADR_TEMPLATE, adr), doc: { ...d, mermaid: false } });
      });
      included.push(d);
      continue;
    }
    const rel = `${d.phase}/${d.file}`;
    const doc = { title: d.title, phaseName: PHASE_NAMES[d.phase], file: rel };
    files.push({ rel, content: renderDoc(candidate, doc, rel), doc: d });
    included.push(d);
  }
  const readme = buildReadme(candidate, included);
  files.unshift({ rel: "README.md", content: readme.content, doc: { title: "Indice maestro" }, readme: true, links: readme.links });
  return { files, included };
}
function buildReadme(candidate, included) {
  const links = [];
  const isIn = (key) => included.some((d) => d.key === key);
  const ctx = baseCtx(candidate, { title: "Indice maestro", phaseName: "Transversal", file: "README.md" });
  const lines = [render(metadataTemplate(), ctx), "", `# Documentacion del proyecto ${cell(candidate.meta.projectName)}`, ""];
  lines.push(`**Patrocinador:** ${cell(candidate.meta.sponsor)} · **Equipo:** ${candidate.meta.teamSize}`);
  lines.push("");
  lines.push("Este indice es la fuente unica de navegacion del set de documentos. Cada enlace");
  lines.push("apunta al documento de su fase; los documentos marcados como opcionales se crean");
  lines.push("solo cuando el proyecto los necesita.");
  lines.push("");
  lines.push("## Indice por fase");
  lines.push("");
  for (const phase of PHASES) {
    const docs = CATALOG.filter((d) => d.phase === phase);
    if (!docs.length) continue;
    lines.push(`### ${phase} — ${PHASE_NAMES[phase]}`);
    lines.push("");
    for (const d of docs) {
      const kind = d.tier === "equipo" ? "requerido con equipo" : d.tier === "opcional" ? "opcional" : "indispensable";
      if (d.multi === "tecnico.adrs") {
        if (isIn(d.key)) {
          const href = `${d.phase}/${d.dir}/`;
          links.push(href);
          lines.push(`- [${d.title}](${href}) — ${candidate.tecnico.adrs.length} decision(es) registradas`);
        } else {
          lines.push(`- ${d.title} — ${kind}`);
        }
        continue;
      }
      if (isIn(d.key)) {
        const href = `${d.phase}/${d.file}`;
        links.push(href);
        lines.push(`- [${d.title}](${href})`);
      } else {
        lines.push(`- ${d.title} — ${kind}`);
      }
    }
    lines.push("");
  }
  lines.push("## Glosario");
  lines.push("");
  lines.push("- **EDT / WBS:** estructura de desglose del trabajo.");
  lines.push("- **ERS:** especificacion de requisitos de software (RF, RNF y criterios de aceptacion).");
  lines.push("- **RACI:** responsable, aprueba, consultado e informado por actividad.");
  lines.push("- **ADR:** registro de una decision de arquitectura con su contexto y consecuencias.");
  lines.push("- **MVP:** version minima con valor real para validar con usuarios.");
  lines.push("");
  return { content: lines.join("\n").replace(/\n{3,}/g, "\n\n"), links };
}

// ---------- gates ----------
function contentGates(candidate) {
  const gates = [];
  const strings = [];
  walkStrings(candidate, "candidate", strings);
  gates.push(
    gate(
      "placeholders",
      strings.filter((s) => PLACEHOLDERS.test(s.value)).map((s) => `${s.path}: contenido sin completar`)
    )
  );
  const equipo = candidate.meta.teamSize === "equipo";
  const missing = [];
  if (equipo) {
    for (const [key, predicate] of Object.entries(EQUIPO_DATA))
      if (!predicate(candidate)) missing.push(`${key}: requerido cuando teamSize = equipo`);
  }
  gates.push(gate("minimum-set", missing));

  const smartErrors = [];
  candidate.definicion.objectives.forEach((o, i) => {
    const criteria = [o.specific, o.measurable, o.achievable, o.relevant, o.time];
    if (new Set(criteria).size < 3)
      smartErrors.push(`objectives[${i}]: los 5 criterios SMART no pueden repetirse entre si`);
  });
  gates.push(gate("smart-check", smartErrors));
  return gates;
}
function deliverGates(files, included) {
  const gates = [];
  gates.push(
    gate(
      "no-template-tokens",
      files
        .filter((f) => /\{\{|___+/.test(f.content))
        .map((f) => `${f.rel}: quedo un token de plantilla sin reemplazar`)
    )
  );
  gates.push(
    gate(
      "metadata-block",
      files
        .filter((f) => !f.content.includes("**Estado:**") || !f.content.includes("## Control de versiones"))
        .map((f) => `${f.rel}: falta el bloque de metadatos o la tabla de Control de versiones`)
    )
  );
  gates.push(
    gate(
      "mermaid-required",
      files
        .filter((f) => f.doc.mermaid && !f.content.includes("```mermaid"))
        .map((f) => `${f.rel}: debe incluir un diagrama Mermaid`)
    )
  );
  gates.push(
    gate(
      "kebab-case",
      files
        .filter((f) => !kebabOk(f.rel))
        .map((f) => `${f.rel}: nombre o carpeta fuera de kebab-case minuscula con extension .md`)
    )
  );
  gates.push(
    gate(
      "no-external-links",
      files
        .filter((f) => /https?:\/\//.test(f.content))
        .map((f) => `${f.rel}: enlace externo (el set debe ser autocontenido)`)
    )
  );
  const readme = files.find((f) => f.readme);
  const indexErrors = [];
  for (const d of included) {
    if (d.multi === "tecnico.adrs") {
      const href = `${d.phase}/${d.dir}/`;
      if (!readme.content.includes(href)) indexErrors.push(`${d.title}: sin enlace en el indice`);
      continue;
    }
    const href = `${d.phase}/${d.file}`;
    if (!readme.content.includes(href)) indexErrors.push(`${d.title}: sin enlace en el indice`);
  }
  gates.push(gate("index-complete", indexErrors));
  return gates;
}
function kebabOk(rel) {
  const segments = rel.split("/");
  return segments.every((seg, i) => {
    if (i === segments.length - 1) return /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*\.md$/.test(seg);
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(seg);
  });
}
function writeFiles(files, docsRoot) {
  for (const file of files) {
    const full = join(docsRoot, file.rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, `${file.content.replace(/\s+$/, "")}\n`, "utf8");
  }
}

// ---------- comandos ----------
function cmdDoctor() {
  const problems = [];
  for (const d of CATALOG) {
    const rel = d.multi ? ADR_TEMPLATE : `${d.phase}/${d.file}`;
    if (!existsSync(join(TEMPLATES_DIR, rel))) problems.push(`falta la plantilla ${rel} (${d.key})`);
  }
  if (!existsSync(join(TEMPLATES_DIR, METADATA_TEMPLATE))) problems.push(`falta ${METADATA_TEMPLATE}`);
  try {
    loadSchema();
  } catch (err) {
    problems.push(`schema: ${err.message}`);
  }
  if (problems.length) fail("doctor fallo", { problems });
  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        doctor: "ready",
        schema: SCHEMA_PATH,
        templates: CATALOG.length,
        documents: CATALOG.length,
        phases: PHASES.length,
      },
      null,
      2
    ) + "\n"
  );
}

function cmdGuide(args) {
  const scenario = args.filter((a) => a !== "--json").join(" ").trim();
  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        command: "guide",
        scenario: scenario || null,
        phases: PHASES.map((phase) => ({ phase, name: PHASE_NAMES[phase], documents: CATALOG.filter((d) => d.phase === phase).map((d) => d.title) })),
        sections: [
          "meta",
          "inicio",
          "definicion",
          "planificacion",
          "tecnico",
          "negocio",
          "ejecucion",
          "cierre",
        ],
        askUser: [
          "¿Cual es el objetivo del proyecto en 25-30 palabras y quien lo patrocina?",
          "¿Cuantas personas trabajan en el proyecto (solo o equipo)? Define el set minimo de documentos.",
          "¿Que entra y que queda explicitamente fuera del alcance del MVP?",
          "¿Cuales son los objetivos medibles (SMART) y sus indicadores?",
          "¿Que riesgos conocidos hay y como se mitigan?",
          "¿Que decisiones tecnicas y de negocio ya estan tomadas (stack, datos, precios)?",
          "¿Cuales son los 3 comercios/pilotos o el criterio de cierre del MVP?",
        ],
        outputConvention: "<docsRoot>/<fase>/<documento>.md + <docsRoot>/README.md (indice)",
      },
      null,
      2
    ) + "\n"
  );
}

function cmdFinalize(args) {
  const [input, docsRoot] = args.filter((a) => a !== "--json");
  if (!input || !docsRoot)
    fail("uso: finalize <candidate.json> <docsRoot> [--json] — escribe el set de documentos en <docsRoot>");
  let candidate;
  try {
    candidate = JSON.parse(readFileSync(resolve(input), "utf8"));
  } catch (err) {
    fail(`no se pudo leer el candidato: ${err.message}`);
  }
  const schemaErrors = [];
  validateSchema(loadSchema(), candidate, "candidate", schemaErrors);

  const gates = [gate("validate", schemaErrors)];
  let files = [];
  let outputs = [];
  if (schemaErrors.length === 0) {
    gates.push(...contentGates(candidate));
    const built = buildFiles(candidate);
    files = built.files;
    gates.push(...deliverGates(files, built.included));
  }
  const allPass = gates.every((g) => g.pass);
  const root = resolve(docsRoot);
  if (allPass) {
    writeFiles(files, root);
    outputs = files.map((f) => join(root, f.rel));
  }
  const payload = {
    ok: allPass,
    command: "finalize",
    docsRoot: root,
    gates,
    summary: {
      total: gates.length,
      passed: gates.filter((g) => g.pass).length,
      failed: gates.filter((g) => !g.pass).length,
    },
    outputs,
  };
  process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  if (!allPass) process.exit(1);
}

// ---------- dispatcher ----------
const [, , command, ...rest] = process.argv;
if (command === "doctor") cmdDoctor();
else if (command === "guide") cmdGuide(rest);
else if (command === "finalize") cmdFinalize(rest);
else
  fail(
    `comando desconocido "${command ?? ""}". Use: doctor | guide "<escenario>" | finalize <candidate.json> <docsRoot>`
  );
