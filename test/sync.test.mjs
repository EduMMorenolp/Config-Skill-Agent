// Anti-deriva documental: skill/agente nuevo sin actualizar README, AGENTS.md o CHANGELOG.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  loadSkills,
  loadAgents,
  readRootFile,
  skillLikeTokens,
  SKILLS_DIR,
} from "./helpers.mjs";

const skills = loadSkills();
const agents = loadAgents();
const skillNames = new Set(skills.map((s) => s.folder));
const readme = readRootFile("README.md");
const agentsMd = readRootFile("AGENTS.md");
const changelog = readRootFile("CHANGELOG.md");

test("cada skill está publicada en README, AGENTS.md y CHANGELOG", async (t) => {
  for (const s of skills) {
    await t.test(s.folder, () => {
      assert.ok(
        readme.includes(`(${s.rel})`),
        `sin fila en el catálogo del README: falta el link [${s.folder}](${s.rel})`
      );
      assert.ok(
        agentsMd.includes(s.folder),
        "sin mención en AGENTS.md (mapa de situaciones o cadena de flujo)"
      );
      assert.ok(
        changelog.includes(s.folder),
        "sin entrada en CHANGELOG.md: el alta va en el mismo gesto (changelog-global)"
      );
    });
  }
});

test("cada agente: frontmatter, catálogo y skills hermanas existentes", async (t) => {
  for (const a of agents) {
    await t.test(a.base, () => {
      assert.ok(a.frontmatterOk, "frontmatter ausente o sin cerrar (--- ... ---)");
      assert.equal(
        a.fm.name,
        a.base,
        `name "${a.fm.name}" ≠ nombre de archivo "${a.base}.md" (la convención exige name = archivo)`
      );
      assert.ok(a.fm.description, "description ausente: sin ella no se puede delegar");
      assert.ok(
        readme.includes(`agents/${a.base}.md`),
        `sin fila en el catálogo README ### agents/ para ${a.base}.md`
      );
      for (const ref of skillLikeTokens(a.text)) {
        assert.ok(
          skillNames.has(ref),
          `el agente cita la skill inexistente "${ref}" (agregaste el agente con una hermana que no existe)`
        );
      }
    });
  }
});

test("cada subcarpeta de categoría contiene su SKILL.md", () => {
  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const category = join(SKILLS_DIR, entry.name);
    if (existsSync(join(category, "SKILL.md"))) continue; // categoría-plana (documentacion)
    const children = readdirSync(category, { withFileTypes: true }).filter((e) => e.isDirectory());
    assert.ok(children.length > 0, `la categoría ${entry.name} no tiene skills`);
    for (const child of children) {
      assert.ok(
        existsSync(join(category, child.name, "SKILL.md")),
        `${entry.name}/${child.name} no tiene SKILL.md: carpetita a medio crear rompe el catálogo`
      );
    }
  }
});
