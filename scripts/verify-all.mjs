// Ejecutor de verificaciones: lanza todos los scripts verify-*.mjs
// Uso: node scripts/verify-all.mjs
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const scripts = readdirSync(scriptsDir)
  .filter((f) => /^verify-.*\.mjs$/.test(f))
  .sort();

let failed = 0;
for (const script of scripts) {
  console.log(`\n=== ${script} ===`);
  const result = spawnSync(process.execPath, [join(scriptsDir, script)], { stdio: 'inherit' });
  if (result.status !== 0) failed++;
}

console.log(`\n=== Resumen: ${scripts.length - failed}/${scripts.length} verificaciones OK ===`);
process.exit(failed ? 1 : 0);
