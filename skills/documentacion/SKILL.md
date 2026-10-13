---
name: documentacion
description: 'Genera documentos HTML ejecutivos de presentación de una feature o implementación para un servicio y un rol (portada, contexto, alcance, fuera de alcance, flujo, historias de usuario, impacto técnico) a partir de un JSON tipado validado por CLI propia. Use when presenting a feature to a stakeholder or role, documenting an upcoming implementation, creating a presentation document for the administrative or any role, or producing an executive HTML briefing ready to print or share. Triggers: "documento de presentación", "presentar feature", "presentar implementación", "documento para el rol administrativo", "presentar módulo", "briefing de feature", "documento ejecutivo de X", "armar documento para presentar".'
---

# Documentación — documentos ejecutivos de presentación de features

**Regla:** cada feature se documenta como un **HTML ejecutivo autocontenido** generado por
`bin/presentador.mjs` desde un JSON tipado (`schemas/feature.schema.json`); el agente recolecta
el pedido del usuario, escribe el candidato y solo da por bueno el HTML cuando `finalize`
pasa sus tres gates (validate + content + deliver). Documento continuo, imprimible a A4.

## Cuándo usarla

- Piden "un documento para presentar la feature X al rol administrativo".
- Documentar una implementación futura de un servicio para stakeholders.
- Presentar un módulo antes de estimarlo o implementarlo (el documento define el alcance).
- Reemplazar a la memoria de conversación: lo que no está en el documento no existe.

## Checklist de ejecución

1. **Recolectar el pedido**: feature, servicio afectado, rol destinatario, estado
   (Propuesta | En implementación | Completada), contexto/objetivo, qué entra, qué queda
   fuera y pendiente, flujo paso a paso, historias de usuario y (si aplica) impacto técnico.
   Preguntar lo que falte; nunca inventar fechas, montos ni reglas de negocio.
2. **Ubicación fija del documento**: el HTML siempre se escribe en la **raíz del proyecto**
   que se está trabajando (`<raiz-proyecto>/<slug-feature>.html`); el candidato JSON queda al
   lado (`<raiz-proyecto>/<slug-feature>.feature.json`) para poder regenerar. Los reruns de
   reparación pisan esos mismos archivos; nunca van a una subcarpeta ni a una carpeta oculta.
3. **Escribir el candidato** contra el schema (ejemplos en `examples/`): `meta` (title,
   service, role, status, version, date, author), `context`, `scope` (in/out/pending),
   `flow.steps`, `stories` (as/want/so), `techImpact` opcional (services/endpoints/tables/files).
4. **Finalizar** (nunca entregar el HTML sin este paso):

```bash
node bin/presentador.mjs finalize <raiz-proyecto>/<slug>.feature.json <raiz-proyecto>/<slug>.html --json
```

5. **Reparar si falla**: leer `evidence.gates[].errors` del JSON de salida, corregir SOLO el
   candidato (nunca el HTML a mano ni la plantilla) y re-correr el mismo `finalize`.
6. **Entrega**: informar la ruta absoluta del HTML, el resumen de gates y recordar que el
   PDF sale con Ctrl+P desde el navegador. `guide "<scenario>" --json` devuelve el esqueleto
   y las preguntas pendientes si el pedido viene incompleto.
7. **Verificación (obligatoria)**:

```bash
# doctor: runtime + plantilla + schema
node bin/presentador.mjs doctor
# finalize real sobre el ejemplo: los 3 gates deben dar ok
node bin/presentador.mjs finalize examples/reserva-admin.feature.json /tmp/reserva-admin.html --json
# tests de la CLI
node --test test/presentador.test.mjs
# name = carpeta, tamaño y secciones fijas
rg "^name: documentacion" SKILL.md
rg -c '^' SKILL.md
rg "^## " SKILL.md
# el ecosistema la descubre (desde la raíz del repo)
npx skills add . -l
```

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| Entregar HTML sin pasar `finalize` | HTML cuyo `finalize` no corrió o dio error → no es entregable |
| Editar el HTML generado a mano | rerun de `finalize` pisa el archivo → la edición se pierde; corregir el candidate.json |
| Invented contenido (fechas, montos, reglas) | candidate con datos que el usuario no dio → volver al paso 1 |
| Placeholders en el documento | `finalize` gate content falla con `placeholder-detected` |
| CSS externo o CDN en la salida | gate deliver falla con `external-resource-detected` |
| Secciones requeridas vacías | gate validate/content: `scope.in`, `flow.steps` o `stories` con < 1 ítem |
| Dos skills peleando por "un documento lindo" | ver Solapamiento: estimaciones es por rol y horas; archify es diagrama |

## Solapamiento

- `generador-estimaciones-global` — ese genera horas de esfuerzo por rol; éste presenta el
  alcance funcional de la feature. Si piden ambas cosas, éste primero (define alcance).
- `archify` — si lo que se quiere es un **diagrama** (arquitectura/flujo/sequence), manda
  archify; éste es prosa ejecutiva con listas, no diagramas.
- `changelog-global` — el documento describe lo que se VA a hacer; el CHANGELOG registra lo
  que se HIZO, en el mismo gesto de la implementación.
