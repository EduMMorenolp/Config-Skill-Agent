---
name: config-env-frontend
description: 'Frontend environment variables with VITE_ prefix and zero secrets in the browser bundle. Use when adding env vars to a SPA, reviewing .env files, or when a secret might be exposed in the client. Triggers: "variables de entorno frontend", "VITE_", ".env.example", "secretos en el front", "config de vite", "import.meta.env", "exponer variable".'
---

# Config Env Frontend — solo lo público, con prefijo `VITE_`, cero secretos

**Regla:** el bundle del navegador es público: **ningún secreto puede vivir en el frontend**.
Variables con prefijo `VITE_`, documentadas en `.env.example`.

## Cuándo usarla

- Agregar o cambiar una variable de entorno en la SPA.
- Revisar higiene: ¿algún secreto quedó expuesto en el cliente?
- Configurar URL de API, feature flags públicas o constantes de entorno.

## Checklist de ejecución

1. **Prefijo `VITE_` obligatorio.** Vite solo expone al cliente lo que empieza con `VITE_`
   (vía `import.meta.env.VITE_X`). Cualquier otra variable **no existe** en el runtime del
   navegador (y no debe existir).
2. **Criterio de exposición:** si el valor viaja en el bundle, **cualquiera puede leerlo** en
   DevTools. Solo pasa lo público: URL de API, `VITE_APP_NAME`, feature flags no sensibles.
   - API keys de terceros (mapas, OCR, IA) → el llamado va **por el backend**, que guarda el
     secreto y expone un endpoint.
   - Token de auth → no es env: se maneja en runtime (skill `auth-frontend`).
3. **`.env.example` completo** con defaults públicos y comentario; `.env` real gitignored.
4. **Nada de secretos en `localStorage`/código** — ver verificación.
5. **Verificación (obligatoria):**

   ```bash
   # variables usadas sin prefijo VITE_ (no expuestas → undefined en runtime)
   rg "process\.env\." src/            # no existe en Vite; usar import.meta.env
   rg "import\.meta\.env\.([A-Z_]+)" src/ -or '$1' | sort -u   # deben empezar con VITE_
   # secretos obvios en el código fuente
   rg -i "api[_-]?key|secret|password|private[_-]?key" src/
   # .env.example presente y trackeado (incluso gitignored)
   rg --files --hidden --no-ignore -g ".env*"
   ```

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| `process.env.X` en el código (es de Node, no de Vite) | `rg "process\.env" src/` |
| Variable sin `VITE_` usada con `import.meta.env.X` → `undefined` silencioso | comparar usos vs claves del `.env.example` |
| API key de terceros hardcodeada o en env del front | `rg -i "api[_-]?key" src/` con valor no vacío |
| Secreto en `localStorage`/`sessionStorage` | `rg -i "secret\|password\|refresh" src/ \| rg "Storage"` |
| `.env.example` desactualizado respecto al código | claves usadas vs declaradas |
| Secrets parseados en `.env` con default que oculta errores | defaults vacíos para lo obligatorio |

## Solapamiento

- `arquitectura-frontend` — la config vive en el punto de entrada (`main.tsx`/módulo config),
  no repartida.
- `auth-frontend` — el token no es env; se gestiona en sesión/runtime.
- `data-fetching-frontend` — la URL base (`VITE_API_URL`) la consume el cliente HTTP.
