# Costos — objetivo $0

DALTO es local-first: **no hay backend, base de datos en la nube, funciones ni
cron**. El único servicio externo es el hosting estático.

| Servicio | Costo | Límites relevantes | ¿Tarjeta? | ¿Elegido? |
|---|---|---|---|---|
| **Cloudflare Pages** | $0 | Estático y ancho de banda **ilimitados**; 500 builds/mes; hasta 100 dominios/proyecto en Free | No | ✅ **Sí** |
| GitHub Pages | $0 | Estático desde repo público (privado requiere plan pago) | No | Repositorio |
| Vercel Hobby | $0 | ~100 GB/mes; **solo uso personal no comercial**; 1 build concurrente | No | No |
| Supabase / Firebase | $0* | Solo si algún día se escala a nube (no en V1) | Varía | No (futuro) |

*Verificado agosto 2026. Cloudflare cambia condiciones; revisar la fuente antes
de decidir: https://developers.cloudflare.com/pages/platform/limits*

## Elección

**Cloudflare Pages + GitHub (repo público)**. Razones:

- El ancho de banda ilimitado en todos los tiers es consecuencia del modelo de
  negocio de Cloudflare (venden seguridad/DNS, no ancho de banda), así que no hay
  letra chica de tráfico que alcance a un proyecto personal.
- Sin cláusula "no comercial" (a diferencia de Vercel Hobby), por si algún día se
  comparte más ampliamente.
- Admite repositorio privado si se quisiera; como no hay secretos, el público
  también es seguro.

## Riesgos de costo

Ninguno mientras el sitio sea **estático**. El día que se añadan Pages Functions
(dinámico), entra el límite de Workers Free (100.000 req/día). V1 no usa nada de
eso.

**Costo esperado de V1: $0 USD.**
