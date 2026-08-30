# Arquitectura

## Principio: local-first

DALTO no tiene backend. Es una **PWA estática** que corre entera en el
dispositivo, con los datos en **IndexedDB**. Consecuencias:

- **Privacidad máxima**: los datos nunca salen del dispositivo.
- **Costo $0 estructural**: no hay servidor, base de datos en la nube, funciones
  serverless ni cron. No es un free-tier que pueda expirar.
- **Sin secretos**: no hay API keys ni tokens → el repositorio puede ser público
  y no hay `.env` que proteger.
- **Aislamiento automático**: si compartes el enlace, quien lo abra ve la app
  vacía en su propio dispositivo; tus datos siguen solo en el tuyo.

## Capas

```
UI (Svelte)
   │  usa
Dominio (TS puro, sin UI)         data/ (persistencia)
   finance/  agenda/                 Repository (interfaz)
                                        └─ IndexedDbRepository (Dexie)
                                      crypto.ts  backup.ts  db.ts
```

- **Dominio**: reglas financieras y de agenda como funciones puras y testeables.
  No conoce IndexedDB ni Svelte. Se puede cambiar la UI sin tocar las reglas.
- **Repository**: la app habla con una **interfaz**, no con Dexie directamente.

## Seguridad (modelo de amenaza local-first)

| Riesgo | Mitigación |
|---|---|
| Pérdida/robo del dispositivo | PIN + **cifrado en reposo** (AES-GCM, llave derivada del PIN con PBKDF2, 210k iteraciones). Sin el PIN, el contenido en disco es ilegible. |
| El navegador evacúa IndexedDB | `navigator.storage.persist()` + recordatorio de exportar respaldos. |
| Un solo dispositivo (sin sync) | Export/Import JSON como puente y red de seguridad. |
| Borrado accidental | Respaldos JSON periódicos. |

El PIN nunca se almacena; solo el sobre cifrado `{salt, iv, data}`.

## PWA

`vite-plugin-pwa` (Workbox) precachea el app-shell → funciona 100% offline e
instalable ("Añadir a pantalla de inicio" en iPhone). Iconos generados desde el
logo, incluido un icono *maskable*.

## Camino de escalado (documentado, no construido)

Si algún día se quiere **sincronización multi-dispositivo** o **Telegram real**:

1. Implementar `Repository` contra **Supabase** (Postgres + Auth + RLS).
2. Añadir un **Cloudflare Worker con cron** para recordatorios push.

Como el dominio es puro y la persistencia va tras la interfaz `Repository`, esto
es **aditivo**, no un rewrite. La UI y el motor no cambian.

## Despliegue

**Cloudflare Pages** conectado a GitHub. `npm run build` → `dist/`. Deploy
automático en cada push, HTTPS y dominio propio gratis. Ver `FREE-TIER-COSTS.md`.
