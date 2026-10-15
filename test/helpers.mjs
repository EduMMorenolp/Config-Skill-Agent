// Utilidades compartidas de la suite estructural del repo (skills + agentes).
// Todo se lee en UTF-8 explícito: Node lo hace por defecto, PowerShell no (evitar Get-Content).
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const SKILLS_DIR = join(ROOT, "skills");
export const AGENTS_DIR = join(ROOT, "agents");

/** Skills externas (upstream, ej. archify): no siguen las convenciones propias del repo. */
export const EXTERNAL_SKILLS = new Set(["archify"]);

/**
 * Colisiones de triggers PERMITIDAS: pares equivalentes que resuelven el mismo caso en dos
 * lados (backend vs frontend). Cualquier otra frase compartida entre dos skills es un fallo:
 * el agente no sabría cuál disparar.
 */
export const ALLOWED_TRIGGER_PAIRS = [
  ["arquitectura-backend", "arquitectura-frontend"],
  ["autenticacion-jwt-backend", "auth-frontend"],
  ["config-env-backend", "config-env-frontend"],
  ["validacion-entrada-backend", "formularios-frontend"],
];

/** Secciones/criterios fijos que toda skill propia debe tener (crear-skill-global). */
export const FIXED_SECTIONS = [
  "## Cuándo usarla",
  "## Checklist de ejecución",
  "## Anti-patrones",
  "## Solapamiento",
  "Verificación (obligatoria)",
];

/** Referencias a repos/proyectos ajenos: las skills son genéricas y autocontenidas. */
export const EXTERNAL_REFS_RE =
  /regla[s]\/|patrone[s]\/|br[ai]n\/|proy[e]ctos\/|portafoli[o]|openbr[ai]n|vizt[a]|vau[l]t/i;

/** Sufijos que delatan un token como nombre de skill (para detectar referencias colgantes). */
export const SKILL_SUFFIXES = ["-backend", "-frontend", "-global", "-cli", "-builder"];

export function readUtf8(absPath) {
  return readFileSync(absPath, "utf8").replace(/^\uFEFF/, "");
}

export function readRootFile(name) {
  return readUtf8(join(ROOT, name));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Parser mínimo de frontmatter (solo campos de primer nivel: name, description, license...). */
export function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return { ok: false, fields: {} };
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (field) fields[field[1]] = field[2];
  }
  return { ok: true, fields };
}

/** Extrae los triggers entre comillas dobles de la description (van después de `Triggers:`). */
export function triggersOf(description = "") {
  const idx = description.indexOf("Triggers:");
  if (idx === -1) return [];
  return [...description.slice(idx).matchAll(/"([^"]+)"/g)].map((m) => m[1].trim().toLowerCase());
}

export function loadSkills() {
  return walk(SKILLS_DIR)
    .filter((file) => basename(file) === "SKILL.md")
    .map((file) => {
      const text = readUtf8(file);
      const { ok, fields } = parseFrontmatter(text);
      return {
        file,
        rel: relative(ROOT, file).split("\\").join("/"),
        folder: basename(dirname(file)),
        text,
        // sin el salto final: un archivo terminado en "\n" no suma una línea vacía fantasma
        lines: text.replace(/\r?\n$/, "").split(/\r?\n/).length,
        frontmatterOk: ok,
        fm: fields,
        external: EXTERNAL_SKILLS.has(basename(dirname(file))),
      };
    })
    .sort((a, b) => a.rel.localeCompare(b.rel));
}

export function loadAgents() {
  return readdirSync(AGENTS_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => {
      const file = join(AGENTS_DIR, e.name);
      const text = readUtf8(file);
      const { ok, fields } = parseFrontmatter(text);
      return {
        file,
        rel: relative(ROOT, file).split("\\").join("/"),
        base: basename(e.name, ".md"),
        text,
        frontmatterOk: ok,
        fm: fields,
      };
    })
    .sort((a, b) => a.rel.localeCompare(b.rel));
}

/** Tokens entre backticks que parecen nombres de skill (por sufijo conocido). */
export function skillLikeTokens(text) {
  const tokens = [...text.matchAll(/`([A-Za-z0-9][A-Za-z0-9._-]*)`/g)].map((m) => m[1]);
  return [...new Set(tokens.filter((t) => SKILL_SUFFIXES.some((suf) => t.endsWith(suf))))];
}
