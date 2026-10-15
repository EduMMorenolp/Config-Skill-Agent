// Contenido cruzado: Solapamiento resuelve y triggers sin colisiones ambiguas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSkills, triggersOf, ALLOWED_TRIGGER_PAIRS } from "./helpers.mjs";

const skills = loadSkills();
const known = new Set(skills.map((s) => s.folder));

test("skills: cada referencia de `Solapamiento` existe en el repo", async (t) => {
  for (const s of skills) {
    await t.test(s.folder, () => {
      const idx = s.text.indexOf("## Solapamiento");
      if (idx === -1) return; // la ausencia de la sección ya la valida skills-structure
      const section = s.text.slice(idx);
      const refs = [...section.matchAll(/`([A-Za-z0-9][A-Za-z0-9._-]*)`/g)]
        .map((m) => m[1])
        .filter((token) =>
          ["-backend", "-frontend", "-global", "-cli", "-builder"].some((suf) => token.endsWith(suf))
        );
      for (const ref of refs) {
        assert.ok(
          known.has(ref),
          `Solapamiento referencia una skill inexistente "${ref}" (renombraste/moviste una skill y no actualizaste esta)`
        );
      }
    });
  }
});

test("skills: triggers sin colisiones fuera de los pares permitidos", () => {
  const byTrigger = new Map();
  for (const s of skills) {
    for (const trigger of triggersOf(s.fm.description)) {
      if (!byTrigger.has(trigger)) byTrigger.set(trigger, []);
      byTrigger.get(trigger).push(s.folder);
    }
  }

  const allowed = new Set(ALLOWED_TRIGGER_PAIRS.map((p) => [...p].sort().join("||")));

  // Se acumulan TODAS las colisiones: un solo fallo por choque obliga a iterar a ciegas.
  const violations = [];
  for (const [trigger, folders] of byTrigger) {
    if (folders.length < 2) continue;
    const key = [...folders].sort().join("||");
    if (!allowed.has(key)) violations.push(`"${trigger}" → ${folders.join(" + ")}`);
  }

  assert.equal(
    violations.length,
    0,
    `triggers compartidos sin dueño claro (el agente no sabría qué skill disparar):\n  ` +
      violations.join("\n  ") +
      "\nDefiní el dueño en la description o, si es el mismo caso en dos lados, " +
      "agregá la pareja a ALLOWED_TRIGGER_PAIRS en test/helpers.mjs"
  );
});

test("skills: toda skill propia declara al menos 3 triggers", () => {
  for (const s of skills) {
    if (s.external) continue;
    const triggers = triggersOf(s.fm.description);
    assert.ok(
      triggers.length >= 3,
      `${s.folder} declara ${triggers.length} triggers: con menos de 3 casi nunca dispara`
    );
  }
});
