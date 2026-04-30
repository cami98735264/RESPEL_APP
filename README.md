# RESPEL_APP

Aplicacion web para la gestion de RESPEL, construida como una SPA de React con Vite, API en Hono y despliegue en Cloudflare Workers.

## Stack

- React 19 + TypeScript
- Vite
- Hono sobre Cloudflare Workers
- Cloudflare Static Assets para servir la SPA
- Wrangler para desarrollo, tipos y despliegue

## Estructura

```text
src/
  react-app/       Aplicacion React
  worker/          Worker Hono y rutas API
public/            Archivos publicos de Vite
wrangler.json      Configuracion de Cloudflare Workers
```

La API inicial esta en `src/worker/index.ts` y expone `GET /api/`. La SPA se compila en `dist/client` y Wrangler la sirve con fallback de single-page application.

## Requisitos

- Node.js 20 o superior recomendado
- npm
- Cuenta de Cloudflare para desplegar con Wrangler

## Instalacion

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

La aplicacion queda disponible normalmente en `http://localhost:5173`.

## Scripts

```bash
npm run dev        # Servidor local de Vite con plugin de Cloudflare
npm run build      # Compila TypeScript y genera build de produccion
npm run lint       # Ejecuta ESLint
npm run preview    # Build y preview local
npm run check      # Typecheck, build y dry-run de despliegue
npm run deploy     # Despliega a Cloudflare Workers
npm run cf-typegen # Genera tipos de bindings con Wrangler
```

## Cloudflare Workers

La configuracion principal esta en `wrangler.json`:

- `name`: `respel-app`
- `main`: `./src/worker/index.ts`
- `assets.directory`: `./dist/client`
- `assets.not_found_handling`: `single-page-application`
- `compatibility_flags`: `nodejs_compat`

Si se agregan bindings, variables o recursos de Cloudflare en `wrangler.json`, ejecutar:

```bash
npm run cf-typegen
```

## Despliegue

```bash
npm run build
npm run deploy
```

Antes del primer despliegue, iniciar sesion con Wrangler si es necesario:

```bash
npx wrangler login
```

## Repositorio

Repositorio remoto esperado:

```text
https://github.com/yersonxz116/RESPEL_APP.git
```
