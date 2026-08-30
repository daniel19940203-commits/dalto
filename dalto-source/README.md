# DALTO

Control financiero y agenda personal. **Local-first**: todo vive en tu dispositivo, sin servidor, sin costo, sin credenciales que filtrar.

> Tu dinero. Tu tiempo. Tu destino.

## Stack
- **Vite + Svelte + TypeScript** — rápido, compilado, mantenible por una persona.
- **Dexie (IndexedDB)** — almacenamiento local tras una interfaz `Repository`.
- **WebCrypto (AES-GCM + PBKDF2)** — cifrado en reposo opcional con PIN.
- **vite-plugin-pwa (Workbox)** — instalable y 100% offline.
- **Vitest** — el motor financiero está probado (16 tests).

## Comandos
```bash
npm install       # instalar dependencias
npm run dev       # desarrollo (http://localhost:5173)
npm run test      # pruebas del motor financiero + cifrado
npm run build     # build de producción (genera la PWA en dist/)
npm run preview   # previsualizar el build
```

## Estructura
```
src/
  domain/finance/   Motor financiero puro (TS) + tests. Sin UI.
  domain/agenda/    Eventos, recordatorios.
  data/             Persistencia: Dexie, repository, cifrado, respaldo.
  lib/              Utilidades (formato de moneda).
  ui/               (Fase siguiente) componentes Svelte del prototipo.
public/icons/       Iconos PWA generados desde el logo.
docs/               ARCHITECTURE · FINANCIAL-RULES · FREE-TIER-COSTS
```

## Documentación
- `docs/ARCHITECTURE.md` — decisiones de arquitectura y camino de escalado.
- `docs/FINANCIAL-RULES.md` — todas las fórmulas financieras.
- `docs/FREE-TIER-COSTS.md` — por qué el costo es $0.

## Respaldo
Los datos viven solo en este dispositivo. **Exporta un respaldo JSON con frecuencia**
(Ajustes → Exportar). Es tu red de seguridad y tu puente entre dispositivos.
