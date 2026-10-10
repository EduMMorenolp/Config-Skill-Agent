---
name: auth-frontend
description: 'Complete authentication package for React SPAs (login, register, session, guards). Use when adding login, auth screens, route guards, token refresh, logout, or when auth flows are missing. Triggers: "login", "autenticacion", "guardar ruta", "sesion", "cerrar sesion", "registro", "recuperar contraseña", "refresh token", "flujos de auth".'
---

# Auth Frontend — si hay login, el paquete completo

**Regla:** nunca se entrega un login a medias: si el SPA tiene autenticación, incluye las 8
pantallas/flujos, guards de ruta y manejo de sesión/token.

## Cuándo usarla

- Agregar autenticación a un SPA o revisar que esté completa.
- Implementar guards, refresh de token o logout.
- Auditoría de flujo: ¿falta registro, recuperación o verificación?

## Checklist de ejecución

### 1. Paquete de pantallas (mínimo obligatorio)

1. **Login** email + contraseña con **toggle mostrar/ocultar**.
2. **Registro** (si hay login, hay register).
3. **"Recordarme"** distinguiendo sesión persistente vs sesión de navegador.
4. **Recuperación**: pantalla de solicitud (envía mail) + página de restablecer con token.
5. **Verificación de email** tras el registro.
6. **OAuth (Google)**: en el front solo botón + callback; el flujo es del backend.
7. **Cerrar sesión** que limpia token y estado local.
8. **Cambiar contraseña** estando logueado.

### 2. Comportamiento transversal

- **Guards de ruta**: ruta privada sin sesión → redirect a login (guard declarativa en el
  router, no chequeos dispersos dentro de las páginas).
- **Sesión/token**: refresh transparente y manejo de expiración; al expirar, redirect a login
  **sin perder** la ruta original si aplica.
- **Estados de formulario**: submit deshabilitado mientras carga; errores del backend
  traducidos a mensajes legibles **inline** (no solo toast).
- El front **no** implementa lógica de auth (validar credenciales, firmar tokens): consume la
  API `Auth` desde `api/auth.ts` y maneja la sesión en `store/auth`.

### 3. Contrato mínimo que el SPA consume

`POST /auth/login` · `register` · `refresh` · `forgot` · `reset` · `verify-email` ·
`logout` · `change-password` · OAuth start/callback.

### 4. Verificación (obligatoria)

```bash
# login completo: ¿existe la pantalla de recuperación y registro?
ls src/pages | rg -i "login|register|forgot|reset|verify"
# guards declarados en el router
rg "RequireAuth|ProtectedRoute|guard" src/
# token/refresh centralizado (no disperso)
rg "localStorage|sessionStorage" src/ -l
# chequeos de sesión dentro de páginas (debería ser guard, no inline)
rg "isAuthenticated|token" src/pages
```

## Anti-patrones (cómo detectarlos)

| Anti-patrón | Detección |
|---|---|
| Login sin registro ni recuperación | `ls src/pages` → solo `Login` |
| Rutas protegidas chequeadas dentro de cada página | `rg "if \(!user" src/pages` → repetido |
| Protección por ID de usuario hardcodeada en el front | `rg "userId === [0-9]\|rol !== [0-9]" src/` → reglas de permiso que son del backend |
| 403/401 manejado cerrando sesión sin distinguir causas | manejar 401 (sesión) y 403 (permiso) por separado |
| Contraseña en `localStorage` o logueada | `rg -i "password" src/ \| rg "localStorage\|console"` |
| Logout que no limpia stores/cache | revisar que el logout clear stores + query cache |
| Token expirado sin refresh → loop de redirects | probar flujo con token vencido |

## Solapamiento

- `data-fetching-frontend` — cómo el cliente HTTP adjunta el token y remueve la sesión ante 401.
- `config-env-frontend` — la base de los endpoints de auth (`VITE_API_URL`) sale de la config
  de entrada; los tokens no son env, se manejan en runtime/sesión.
- `estados-toast-frontend` — loading/error de los formularios de auth; errores graves → toast.
- `formularios-frontend` — validación de los formularios de login/registro/recuperación.
- `arquitectura-frontend` — `api/auth.ts` + `store/auth` viven donde dice la estructura.
