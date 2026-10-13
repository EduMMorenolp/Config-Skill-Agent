import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = join(HERE, '..');
const CLI = join(SKILL_ROOT, 'bin', 'presentador.mjs');
const EXAMPLE = join(SKILL_ROOT, 'examples', 'reserva-admin.feature.json');

function run(args) {
  const res = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
  let payload = null;
  try {
    payload = JSON.parse(res.stdout);
  } catch {
    payload = null;
  }
  return { status: res.status, payload, stderr: res.stderr };
}

function tmp() {
  return mkdtempSync(join(tmpdir(), 'docskill-'));
}

test('doctor reports ready', () => {
  const { status, payload } = run(['doctor']);
  assert.equal(status, 0);
  assert.equal(payload.ok, true);
  assert.equal(payload.doctor, 'ready');
});

test('guide returns sections and questions', () => {
  const { status, payload } = run(['guide', 'presentar reserva para administración', '--json']);
  assert.equal(status, 0);
  assert.ok(payload.sections.length >= 5);
  assert.ok(payload.askUser.length >= 5);
});

test('finalize passes all gates on the example', () => {
  const dir = tmp();
  const out = join(dir, 'reserva-admin.html');
  try {
    const { status, payload } = run(['finalize', EXAMPLE, out, '--json']);
    assert.equal(status, 0, JSON.stringify(payload?.gates, null, 2));
    assert.equal(payload.summary.failed, 0);
    const html = readFileSync(out, 'utf8');
    assert.ok(html.includes('Ingreso automático de reservas'));
    assert.ok(html.includes('Historias de usuario'));
    assert.ok(html.includes('@page'));
    assert.ok(!/rel="stylesheet"/.test(html));
    assert.ok(!/url\(\s*['"]?https?:\/\//.test(html));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('finalize fails on schema violation', () => {
  const dir = tmp();
  try {
    const bad = join(dir, 'bad.json');
    writeFileSync(bad, JSON.stringify({ meta: { title: 'x' } }));
    const { status, payload } = run(['finalize', bad, join(dir, 'bad.html'), '--json']);
    assert.equal(status, 1);
    assert.equal(payload.ok, false);
    assert.equal(payload.summary.failed > 0, true);
    assert.equal(payload.gates[0].name, 'validate');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('finalize fails on placeholder content', () => {
  const dir = tmp();
  try {
    const candidate = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
    candidate.context.summary = 'Resumen TODO por completar ___';
    const bad = join(dir, 'placeholder.json');
    writeFileSync(bad, JSON.stringify(candidate));
    const { status, payload } = run(['finalize', bad, join(dir, 'ph.html'), '--json']);
    assert.equal(status, 1);
    const gateNames = payload.gates.map((g) => g.name);
    assert.ok(gateNames.includes('placeholders'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('finalize rejects unexpected properties', () => {
  const dir = tmp();
  try {
    const candidate = JSON.parse(readFileSync(EXAMPLE, 'utf8'));
    candidate.bogusSection = 'no debería estar';
    const bad = join(dir, 'extra.json');
    writeFileSync(bad, JSON.stringify(candidate));
    const { status, payload } = run(['finalize', bad, join(dir, 'extra.html'), '--json']);
    assert.equal(status, 1);
    assert.ok(payload.gates[0].errors.some((e) => e.includes('unexpected property')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('rendered document includes all required sections and no template tokens', () => {
  const dir = tmp();
  const out = join(dir, 'doc.html');
  try {
    const { status } = run(['finalize', EXAMPLE, out, '--json']);
    assert.equal(status, 0);
    const html = readFileSync(out, 'utf8');
    for (const heading of ['Contexto y objetivo', 'Alcance', 'Qué queda fuera', 'Definiciones pendientes', 'Flujo paso a paso', 'Historias de usuario', 'Impacto técnico', 'Notas'])
      assert.ok(html.includes(heading), `missing ${heading}`);
    assert.ok(!html.includes('{{'), 'unreplaced template token');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
