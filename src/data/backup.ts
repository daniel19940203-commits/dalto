// ============================================================================
// Respaldo — tu red de seguridad en local-first. Exporta/Importa el snapshot.
// ============================================================================
import type { Repository, Snapshot } from './repository';

/** Descarga el snapshot completo como archivo JSON. */
export async function exportToFile(repo: Repository, filename = 'dalto-backup.json'): Promise<void> {
  const snapshot = await repo.exportSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lee y valida un archivo JSON de respaldo, y restaura. */
export async function importFromFile(repo: Repository, file: File): Promise<Snapshot> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Snapshot;
  if (!parsed || !Array.isArray(parsed.concepts) || !Array.isArray(parsed.events)) {
    throw new Error('Archivo de respaldo no válido.');
  }
  await repo.importSnapshot(parsed);
  return parsed;
}
