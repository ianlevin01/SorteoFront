# SorteoFront

Frontend de la plataforma de sorteos. React + Vite + React Router.

La API está en un repo aparte: **SorteoApi** (deploy en EC2).

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5180
```

En dev, `/api` se proxea al backend local (`http://localhost:4001`). No hace falta
configurar nada. Para apuntar a otro backend: `VITE_API_PROXY` en `.env`.

## Build

```bash
npm run build      # -> dist/
npm run preview    # sirve el build localmente
```

## Deploy en Vercel

1. Importar el repo `SorteoFront` en Vercel (detecta Vite solo).
2. En **Settings → Environment Variables**, agregar:
   | Nombre | Valor |
   |---|---|
   | `VITE_API_URL` | `https://renattosorteo.online` (origen de la API, **sin** `/api`) |
3. El `vercel.json` ya configura el build y el rewrite de SPA (para que las rutas
   tipo `/sorteos/xxx` funcionen al recargar).
4. **Settings → Domains**: agregar el dominio del front.

Cada push a `main` redespliega solo.

> Después de deployar, en la API hay que setear `CORS_ORIGIN` con el dominio final
> del front.

## Estructura

```
src/
  components/   ui/, layout/, raffles/, tickets/, auth/, marketing/
  pages/        una por ruta
  hooks/        useRaffles, useOrders, useCountdown
  context/      AuthContext (sesión por DNI)
  lib/          api, format, queryClient, argentina
  styles/       tokens.css (paleta), global.css
scripts/        utilidades de dev (capturas, flujos) — no afectan el build
```

## Notas

- El **azul de marca es un placeholder** — se cambia en `src/styles/tokens.css`
  (variables `--brand-*`).
- El logo también es placeholder (`src/components/brand/BrandLogo.jsx`).
