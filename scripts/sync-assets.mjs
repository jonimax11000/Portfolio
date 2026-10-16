// Sincroniza las fuentes del alumno (data/ y assets/ en la raíz del repo)
// hacia public/, que es lo que Vite sirve en dev y copia a dist/ en build.
// Una sola fuente de verdad (raíz); cero edición manual doble (Anexo B.2.4).
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const pairs = [
  ['data', 'public/data'],
  ['assets', 'public/assets']
];

for (const [from, to] of pairs) {
  const src = join(root, from);
  const dest = join(root, to);
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`synced ${from}/ -> ${to}/`);
}
