# Reglas financieras

Regla de oro: **source data → cálculo → visualización**. Ningún total es editable;
para cambiar un total, se edita el dato primario que lo genera.

## Deuda

| Concepto | Fórmula |
|---|---|
| **Deuda mensual** | Σ (cuota mensual de cada obligación con cuotas) |
| **Deuda total** | Σ (cuota × cuotas restantes) |

Ejemplo: cuota 500.000 × 8 cuotas → deuda total 4.000.000.

Un **servicio recurrente** (Internet 120.000) NO es deuda con cuotas: su deuda
mensual y total son 0. Solo los conceptos con `installments > 0` cuentan como deuda.

La deuda vive **dentro** de su categoría (p.ej. Gastos fijos → Obligaciones no
esenciales), no en una lista aparte. Así el disponible no la cuenta dos veces.

## Flujo del mes

| Concepto | Fórmula |
|---|---|
| **Total ingresos** | Σ ingresos |
| **Salidas totales** | Gastos fijos + Membresías + Imprevistos + Entretenimiento + Provisiones |
| **Saldo disponible** | Total ingresos − Salidas totales |
| **Tasa de ahorro** | Provisiones / Total ingresos × 100 |
| **Relación de endeudamiento (DTI)** | Deuda mensual / Total ingresos × 100 |
| **Gastos de supervivencia** | Σ conceptos de la subcategoría "Gastos de supervivencia" |
| **Meses de cobertura** | Fondo de emergencia / Gastos de supervivencia |

## Saldos consolidados (Resumen)

Para cada periodo visible:

- **Disponible** = Ingresos − Salidas − Provisiones del periodo.
- **Acumulado** = Disponible del periodo + acumulado anterior (running). Lo que
  sobra se consolida mes a mes, arrastrando lo previo aunque mires un solo mes.
- **Ahorro acumulado** = Provisiones del periodo + acumulado anterior. Si marzo
  ahorró 400 y abril 400, marzo muestra 400 y abril 800.
- **Total saldos** = Acumulado + Ahorro acumulado (patrimonio consolidado).

## Auto-fill y valores reales

- **Auto-fill ON**: los periodos futuros se proyectan con el monto base.
- **Auto-fill OFF**: los futuros quedan en 0.
- **Incremento mensual %** (opcional): compone SOLO hacia meses futuros
  proyectados; nunca modifica históricos. 100.000 al 5% → 105.000, 110.250, …
- **Precedencia**: un valor **real** registrado para un mes pisa al proyectado.
  El histórico no se destruye.

## Periodos

- **Mensual**: una columna por mes.
- **Quincenal (semi-monthly)**: periodo 1 = día 1–15; periodo 2 = día 16–fin de
  mes. NO es "cada 14 días". El monto mensual se reparte de forma estable
  (la primera quincena lleva el redondeo; ambas suman el mes exacto).

## Moneda

COP es la base y no lleva decimales. Cambiar a USD solo cambia la visualización;
sin una tasa FX explícita no se convierte (se muestra el valor original).
