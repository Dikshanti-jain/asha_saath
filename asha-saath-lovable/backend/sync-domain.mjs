import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
/** Compile the actual application's pure scheduling modules, without React or a second algorithm. */
export async function syncDomain() {
  await mkdir(path.join(here, 'runtime'), { recursive: true });
  for (const name of ['fixtures', 'time', 'csv', 'planner']) {
    const source = await readFile(path.join(here, '..', 'src', 'lib', 'demo', `${name}.ts`), 'utf8');
    const js = stripTypeScriptTypes(source, { mode: 'strip' }).replace(/from (["'])\.\/(csv|fixtures|time|planner)\1/g, 'from "./$2.mjs"');
    await writeFile(path.join(here, 'runtime', `${name}.mjs`), js);
  }
  const domain = await readFile(path.join(here, 'domain.ts'), 'utf8');
  await writeFile(path.join(here, 'runtime', 'domain.mjs'), stripTypeScriptTypes(domain, { mode: 'strip' }).replaceAll('./runtime/', './'));
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await syncDomain();
