import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(packageRoot, 'src/generated/client');
const destination = resolve(packageRoot, 'dist/generated/client');

if (!existsSync(source)) {
  throw new Error(`Generated Prisma client not found at ${source}. Run prisma generate first.`);
}

mkdirSync(dirname(destination), { recursive: true });
cpSync(source, destination, { recursive: true });

console.log(`Copied generated Prisma client to ${destination}`);
