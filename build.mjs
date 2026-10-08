import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const source = await readFile(new URL('./src/main.ts', import.meta.url), 'utf8');
const output = stripTypeScriptTypes(source, { mode: 'strip' });
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await writeFile(new URL('./dist/main.js', import.meta.url), output);
console.log('Built dist/main.js. Open index.html in a browser.');
