---
name: autenticacion-jwt-backend
description: 'JWT authentication middleware for Express backends (sign, verify, refresh rotation, secure storage). Use when adding login, protecting routes, implementing refresh tokens, or auditing auth security. Triggers: "JWT", "login", "token", "autenticación", "refresh token", "proteger ruta", "verifyToken", "middleware de auth", "bcrypt", "hash password".'
---

# Autenticación JWT — un middleware, tokens cortos, refresh rotation

**Regla:** un solo middleware `verifyToken` verifica firma + expiración en toda ruta protegida.
Access tokens cortos (15 min), refresh tokens rotativos, y secretos nunca hardcodeados.

## Cuándo usarla

- Agregar autenticación (login/register) a un backend.
- Proteger rutas con un middleware de JWT.
- Implementar o arreglar refresh token rotation.
- Auditar seguridad de tokens: secretos, expiración, almacenamiento.

## Checklist de ejecución

### 1. Middleware `verifyToken`

```ts
// src/middleware/verifyToken.ts
import jwt from "jsonwebtoken";
import { config } from "../config";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
  if (!token) return next(new AppError("Token requerido", 401));
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = payload;       // { id, role, iat, exp }
    next();
  } catch (err) {
    return next(new AppError("Token inválido o expirado", 401));
  }
};
```

- **Un solo punto** de verificación: nunca verificar en el controller.
- Leer token de `httpOnly` cookie (preferido) **o** header `Authorization: Bearer <token>`.
- `jwt.verify` valida firma + expiración automáticamente; no re-implementar.

### 2. Signing: tokens cortos + claims mínimos

```ts
const accessToken  = jwt.sign({ id: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: "15m" });
const refreshToken = jwt.sign({ id: user.id }, config.JWT_REFRESH_SECRET, { expiresIn: "7d" });
```

- **Claims mínimos:** `id`, `role`. Nunca email, password hash, ni datos mutables.
- **Secretos separados** para access y refresh; ambos en `config` (skill `config-env-backend`).
- **Algoritmo:** HS256 para monolito; RS256 si hay microservicios que solo verifican.

### 3. Refresh token rotation

- Guardar el refresh token **hasheado** en BD (tabla `refresh_tokens` o campo en `users`).
- Al rotar: emitir nuevo access + nuevo refresh, **invalidar el anterior**.
- Si un refresh token ya usado se presenta → **revocar todos los tokens del usuario**
  (señal de robo).
- Endpoint: `POST /auth/refresh` — no reutilizar el endpoint de login.

### 4. Almacenamiento en el cliente

| Mecanismo | Seguro | Notas |
|---|---|---|
| `httpOnly` + `Secure` + `SameSite=Strict` cookie | ✅ | Preferido: inaccesible desde JS |
| `localStorage` | ❌ | Vulnerable a XSS; **prohibido para tokens** |
| Header `Authorization` (SPA sin cookies) | ⚠️ | Solo si el token vive en memoria, nunca persistido |

### 5. Passwords: hash con bcrypt

```ts
const hash = await bcrypt.hash(password, 12);          // register
const valid = await bcrypt.compare(password, user.hash); // login
```

- **Nunca** almacenar passwords en texto plano ni con MD5/SHA sin salt.
- Cost factor ≥ 10 (12 recomendado); no usar `hashSync` en el event loop.

### 6. Verificación (obligatoria)

```bash
# secretos en config (no hardcodeados)
rg "jwt\.sign|jwt\.verify" src/ -A2 | rg -v "config\."
# tokens sin expiración
rg "expiresIn" src/ -c   # debe haber al menos 1 por cada sign
# passwords en texto plano
rg -i "password.*=.*req\." src/services src/controllers
# verificación fuera del middleware
rg "jwt\.verify" src/ -l  # esperado: solo middleware/verifyToken
```

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| Secret hardcodeado (`"mysecret"`) | `rg "jwt\.(sign\|verify).*[\x27\x22]" src/` → string literal como secret |
| Token sin expiración | `rg "jwt\.sign" src/` sin `expiresIn` en options |
| Refresh token sin rotación (reutilizable infinitamente) | Leer flujo de `/auth/refresh`: si no invalida el anterior, es reutilizable |
| `localStorage` para tokens | `rg "localStorage.*(token\|jwt\|access)" src/` |
| Verificación en cada controller en vez de middleware | `rg "jwt\.verify" src/ -l` → hits fuera de `middleware/` |
| Password en texto plano | `rg "password" src/models src/db` → campo sin hash |
| Claims inflados (email, datos mutables en payload) | `rg "jwt\.sign" src/ -A5` → revisar objeto del payload |

## Solapamiento

- `config-env-backend` — `JWT_SECRET` y `JWT_REFRESH_SECRET` se definen en el módulo único de config.
- `errores-respuestas-backend` — 401/403 usan la shape estándar `{ error }` del handler central.
- `validacion-entrada-backend` — schemas de `POST /auth/login` y `/auth/register` se validan como
  cualquier otra ruta.
- `base-datos-conexion-backend` — usuarios y refresh tokens se persisten vía la capa `db/`
  (tabla `refresh_tokens` o campo en `users`); hash del password y rotación de token usan el
  pool único y las transacciones de esa capa.
- **Precede** a la autorización (RBAC, fuera de este repo): primero autenticación (quién sos),
  después autorización (qué podés hacer).
