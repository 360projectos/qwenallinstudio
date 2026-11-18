# Lab Studio v4.0.1 SaaS Pro - God of Poker

Plataforma profesional de inteligencia GTO/explotativa para NLHE 6-Max. Arquitectura dual: master/sandbox + produccion independiente.

## Demo en vivo (GitHub Pages)
El motor de inteligencia corre 100% en el navegador (modo demo, sin backend):
**https://360projectos.github.io/qwenallinstudio/**

## Stack
React 19 + TypeScript estricto + Vite + Tailwind CSS v4 (negro #000000 / azul #3B82F6, Plus Jakarta Sans + JetBrains Mono). Backend Express sobre Node.js 22 ESM nativo (node server.ts, type-stripping >= 22.18). Firebase Auth (RS256/JWKS server-side) + PostgreSQL/Drizzle. IA server-side @google/genai con fallback determinista.

## Los 6 pilares
1. Asistente & Solver - DCFR (alpha=1.5 beta=0 gamma=2) sobre 169 manos, matriz 13x13, SPR tipado.
2. Entrenador Pro - simulador 6-Max, 10 categorias, 5 arquetipos, limite diario por plan, diagnostico 100 manos.
3. Rangos & Equidad - Monte Carlo real de 52 cartas, evaluador exacto de 7, presets preflop.
4. Herramientas Pro - ICM Malmuth-Harville exacto, varianza Monte Carlo 2000 sesiones, HUD Profiler, importador HH.
5. Academia Cognitiva - Nivel 0, 12 categorias GTO, SM-2, progreso D3.js.
6. Math & Docs - benchmarks en vivo, auditoria DCFR, consola Admin zero-trust.

## Requisitos
Node.js >= 22.18 y npm.

## Arranque local
    npm install
    npm run dev

## Regla de Oro - 4 gates
    bash scripts/gates.sh
(tsc --noEmit, vite build, node --test, HTTP 200/401). En GitHub Actions: workflow CI - 4 Gates.

## Promocion a produccion
    bash scripts/promote.sh /app/lab-studio-production v4.0.2-prod

## Despliegue Cloud Run (backend completo)
    gcloud builds submit --tag gcr.io/PROJECT/lab-studio:v4.0.2-prod
    gcloud run deploy lab-studio --image gcr.io/PROJECT/lab-studio:v4.0.2-prod --region us-central1 --allow-unauthenticated --port 8080

## Variables de entorno
- PORT (8080), NODE_ENV
- FIREBASE_PROJECT_ID - verificacion RS256/JWKS
- GEMINI_API_KEY - IA server-side (fallback offline si falta)
- DATABASE_URL - PostgreSQL/Cloud SQL (fallback memoria+snapshot si falta)
- LAB_DEV_SECRET - tokens dev solo fuera de produccion
- VITE_DEMO_MODE / VITE_BASE - build de la demo Pages
- VITE_FIREBASE_* - config Firebase del frontend

## Seguridad Zero-Trust
- requireAuth/requireAdmin en cada ruta /api/admin/* (401/403 server-side).
- Admin blindado: rataparicio@gmail.com, 360aparicio@gmail.com, rol admin/superadmin.
- Aislamiento por UID __u_${uid}, perfil limpio al 0%.
- SPA fallback 200 para /admin (sin 301), trust proxy = 1 tras Cloud Run.

## Motor matematico (verificado con node --test)
Evaluador exacto 7 cartas, Monte Carlo 52 cartas, DCFR convergencia Nash (matching pennies/RPS), ICM Malmuth-Harville cross-validado vs fuerza bruta, SM-2, SPR tipado, varianza determinista.