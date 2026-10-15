// Estructura y convenciones de cada skill (los 6 checks de crear-skill-global, codificados).
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSkills, FIXED_SECTIONS, EXTERNAL_REFS_RE } from "./helpers.mjs";

const skills = loadSkills();

test("suite: descubre el catálogo completo de skills", () => {
  assert.ok(
    skills.length >= 25,
    `solo se descubrieron ${skills.length} skills: ¿rompiste el layout skills/<categoría>/<nombre>/SKILL.md?`
  );
});

test("skills: estructura y convenciones del repo", async (t) => {
  for (const s of skills) {
    await t.test(`${s.folder}${s.external ? " (externa)" : ""}`, () => {
      // 1) frontmatter presente y bien delimitado (si no, npx skills descarta la skill en silencio)
      assert.ok(
        s.frontmatterOk,
        "frontmatter ausente o sin cerrar: el archivo debe empezar con --- ... ---"
      );

      // 2) name = nombre de la carpeta
      assert.equal(
        s.fm.name,
        s.folder,
        `name "${s.fm.name}" ≠ carpeta "${s.folder}" (npx skills las da de baja por nombre)`
      );

      // 3) description presente
      assert.ok(s.fm.description, "description ausente");

      if (s.external) {
        // Las skills externas solo respetan techo absoluto y name = carpeta.
        assert.ok(s.lines <= 500, `${s.lines} líneas > 500 (techo absoluto)`);
        return;
      }

      // 4) description entrecomillada con comillas simples de YAML + Triggers:
      assert.match(
        s.fm.description,
        /^'[\s\S]*'$/,
        "description sin comillas simples: un `:` sin comillas rompe el frontmatter y npx skills la descarta"
      );
      assert.match(s.fm.description, /Triggers:/, "description sin `Triggers:` (disparos exactos)");

      // 5) anti description-trap: la description describe QUÉ y CUÁNDO, nunca pasos numerados
      assert.doesNotMatch(
        s.fm.description,
        /(^|\s)\d+\.\s/,
        "description con numeración de pasos: resume el flujo y el agente se saltea la skill (description-trap)"
      );

      // 6) secciones fijas
      for (const section of FIXED_SECTIONS) {
        assert.ok(
          s.text.includes(section),
          `falta la sección/criterio "${section}" (orden fijo de crear-skill-global)`
        );
      }

      // 7) cero referencias externas al repo
      const externalRef = s.text.match(EXTERNAL_REFS_RE);
      assert.equal(
        externalRef,
        null,
        `referencia a un repo/proyecto ajeno: "${externalRef?.[0]}" — las skills son genéricas y autocontenidas`
      );

      // 8) tamaño: objetivo <=150, absoluto 500
      assert.ok(s.lines <= 150, `${s.lines} líneas > 150 (objetivo de la convención)`);
    });
  }
});
