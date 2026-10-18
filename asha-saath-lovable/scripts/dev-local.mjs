import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const children = [
  spawn(process.execPath, ['backend/server.mjs'], {cwd: root, stdio: 'inherit'}),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'dev'], {cwd: root, stdio: 'inherit'}),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return; stopping = true;
  for (const child of children) child.kill();
  setTimeout(() => process.exit(code), 300);
}
for (const child of children) {
  child.on('error', e => { console.error(e.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code ?? 1); });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
