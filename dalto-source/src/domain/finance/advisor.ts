// ============================================================================
// Asesor financiero determinístico — reglas sobre tus datos, sin IA.
// Contenido localizado a Colombia (CDT, TES, FIC).
// ============================================================================
import type { Concept } from './types';
import { debtToIncomeRatio, emergencyMonths, availableBalance, savingsRate } from './calculations';

export type Tier = 'green' | 'yellow' | 'red';

export interface Diagnosis {
  tier: Tier;
  title: string;
  msg: string;
  focus: 'debt' | 'invest' | 'edu';
  dti: number;
  em: number;
  av: number;
  sr: number;
}

export function diagnose(concepts: Concept[]): Diagnosis {
  const dti = debtToIncomeRatio(concepts);
  const em = emergencyMonths(concepts);
  const av = availableBalance(concepts);
  const sr = savingsRate(concepts);

  if (dti > 30 || av < 0)
    return { tier: 'red', focus: 'debt', dti, em, av, sr,
      title: 'Alerta de deuda — Semáforo rojo',
      msg: 'Tu relación de endeudamiento supera el umbral seguro o tu flujo de caja es negativo. Antes de invertir, el foco es liberar deuda y crear un colchón mínimo.' };
  if (em < 3)
    return { tier: 'yellow', focus: 'debt', dti, em, av, sr,
      title: 'Construyendo estabilidad — Semáforo amarillo',
      msg: 'No tienes deuda tóxica, pero tu fondo de emergencia aún no cubre lo suficiente. Tu prioridad absoluta es edificar tu "tanque de oxígeno" antes de invertir.' };
  if (sr < 15)
    return { tier: 'yellow', focus: 'edu', dti, em, av, sr,
      title: 'Estable, con espacio para crecer — Semáforo amarillo',
      msg: 'Tienes control, pero tu capacidad de ahorro es limitada. El camino más rápido es aumentar ingresos con habilidades de alto valor.' };
  return { tier: 'green', focus: 'invest', dti, em, av, sr,
    title: 'Listo para multiplicar — Semáforo verde',
    msg: 'Sin deuda de alto costo y con colchón sólido. Es momento de poner tu dinero a trabajar con inversión indexada y disciplina de largo plazo.' };
}

export interface Pillar {
  title: string;
  intro: string;
  steps: [string, string][];
  note: string;
}

export const PILLARS: Record<'debt' | 'invest' | 'edu', Pillar> = {
  debt: {
    title: 'Salir de deudas',
    intro: 'El 80% del éxito es comportamiento y disciplina; solo el 20% es matemática. Elige un método y sé constante.',
    steps: [
      ['Detén el sangrado', 'Prohíbe nueva deuda y congela el uso de tarjetas de crédito mientras ejecutas el plan.'],
      ['Lista todas tus deudas', 'Anota saldo, cuota mínima y tasa efectiva anual de cada obligación.'],
      ['Elige tu método', 'Bola de nieve (de menor a mayor saldo, gana tracción psicológica) o Avalancha (de mayor a menor tasa, óptimo matemático).'],
      ['Paga mínimos + ataca una', 'Mantén los mínimos de todas y vuelca cada peso extra a la deuda objetivo.'],
      ['Abono directo a capital', 'Paga la cuota del mes y, 2 días después, solicita al banco un "abono a capital" y exige recálculo de la cuota.'],
      ['Crea un colchón mínimo', 'En paralelo, reúne un fondo pequeño para no volver a endeudarte ante un imprevisto.'],
      ['Efecto dominó', 'Al liquidar una deuda, redirige su cuota completa a la siguiente. Repite hasta quedar libre.'],
      ['Mide tu progreso', 'Revisa cada mes cuánto bajó tu deuda total y tu relación de endeudamiento.'],
    ],
    note: 'En Colombia puedes negociar reducción de tasa o reestructuración con tu banco para liberar flujo y abonar a capital voluntariamente.',
  },
  invest: {
    title: 'Inversión inteligente',
    intro: 'El objetivo es enseñarte a pensar la inversión, no decirte qué comprar. Rendimientos pasados no garantizan rendimientos futuros.',
    steps: [
      ['Primero lo primero', 'No inviertas en renta variable si tienes deuda de alto costo o fondo de emergencia incompleto.'],
      ['Solo lo que entiendes', 'Nunca pongas dinero en un vehículo que no comprendes. La claridad es protección.'],
      ['Renta fija vs. variable', 'Renta fija (CDT, TES, cuentas de alto rendimiento) da estabilidad; renta variable (ETFs, fondos indexados como el S&P 500) da crecimiento a largo plazo.'],
      ['Diversifica', 'No concentres el riesgo en un solo activo. Una canasta amplia reduce el golpe de que a uno le vaya mal.'],
      ['Costo promedio (DCA)', 'Invierte un monto fijo cada mes. Automatizas y promedias precios sin adivinar el mercado.'],
      ['Interés compuesto', 'Reinvierte los rendimientos. El tiempo importa más que el monto: empezar antes vale más que aportar más.'],
      ['Rebalancea', 'Revisa tu portafolio periódicamente y ajústalo a tu horizonte y tolerancia al riesgo.'],
    ],
    note: 'Vehículos locales: CDT y cuentas de ahorro de alto rendimiento para la base líquida; FIC (Fondos de Inversión Colectiva) y ETFs para crecimiento diversificado; TES para deuda pública. Contenido educativo, no una recomendación de compra.',
  },
  edu: {
    title: 'Educación financiera',
    intro: 'Sube tu valor de mercado y ordena tu dinero. Estas son las habilidades que más mueven la aguja.',
    steps: [
      ['Presupuesto 50/30/20', '50% esenciales, 30% estilo de vida, 20% ahorro e inversión. Estructura simple para no vivir por encima de tus posibilidades.'],
      ['Gestión de flujo de caja', 'Evita la "diarrea financiera": no gastes todo en los primeros días del ciclo de pago. Planea el mes completo.'],
      ['Manejo de deuda', 'Distingue cuota mínima de abono a capital. Renegocia. Prioriza según método elegido.'],
      ['Fundamentos de inversión', 'Riesgo, liquidez, horizonte, diversificación e interés compuesto.'],
      ['Fondo de emergencia', 'Meta: de 3 a 6 meses de gastos esenciales, líquido y a riesgo cero.'],
      ['Generación de ingresos', 'Skill stacking: combina dos habilidades promedio para volverte un perfil único.'],
      ['Inglés y arbitraje geográfico', 'El inglés profesional abre mercados que pagan tarifas más altas por el mismo trabajo.'],
    ],
    note: 'Placer ≠ felicidad: el consumo impulsivo da una dosis rápida de dopamina y deja deuda; la paz financiera es sostenible.',
  },
};
