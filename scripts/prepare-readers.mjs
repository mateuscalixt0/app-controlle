import { cp, mkdir, readdir } from 'node:fs/promises';
await mkdir('public/readers/pdf', { recursive: true });
await mkdir('public/readers/tesseract', { recursive: true });
await cp('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'public/readers/pdf/pdf.worker.min.mjs');
for (const directory of ['cmaps', 'standard_fonts', 'wasm']) await cp(`node_modules/pdfjs-dist/${directory}`, `public/readers/pdf/${directory}`, { recursive: true });
await cp('node_modules/tesseract.js/dist/worker.min.js', 'public/readers/tesseract/worker.min.js');
for (const name of await readdir('node_modules/tesseract.js-core')) if (/\.wasm(?:\.js)?$/.test(name)) await cp(`node_modules/tesseract.js-core/${name}`, `public/readers/tesseract/${name}`);
await cp('node_modules/@tesseract.js-data/por/4.0.0/por.traineddata.gz', 'public/readers/tesseract/por.traineddata.gz');
