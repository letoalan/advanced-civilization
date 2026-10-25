import fs from 'node:fs';
import path from 'node:path';

const MAX_LINES = 200;
const SRC_DIR = path.resolve('src');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function scanDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, results);
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      const lines = countLines(fullPath);
      results.push({
        path: path.relative(process.cwd(), fullPath).replace(/\\/g, '/'),
        lines,
      });
    }
  }
  return results;
}

const allFiles = scanDir(SRC_DIR);
const overLimit = allFiles.filter((f) => f.lines > MAX_LINES);

console.log('='.repeat(70));
console.log(`ANALYSE DE TAILLE DES FICHIERS SRC/ (SEUIL STRICT : ${MAX_LINES} LIGNES)`);
console.log('='.repeat(70));
console.log(`Total fichiers analysés : ${allFiles.length}`);
console.log(`Fichiers conformes (< ${MAX_LINES} lignes) : ${allFiles.length - overLimit.length}`);
console.log(`Fichiers à modulariser (> ${MAX_LINES} lignes) : ${overLimit.length}`);
console.log('-'.repeat(70));

if (overLimit.length > 0) {
  console.log('Fichiers dépassant le seuil :');
  overLimit
    .sort((a, b) => b.lines - a.lines)
    .forEach((f) => {
      console.log(`  - ${f.lines.toString().padStart(4, ' ')} lignes : ${f.path}`);
    });
} else {
  console.log('Parfait ! Tous les fichiers respectent la règle des 200 lignes.');
}
console.log('='.repeat(70));

// Mode strict activable via argument --strict ou variable STRICT_LINES=1
if (process.argv.includes('--strict') || process.env.STRICT_LINES === '1') {
  if (overLimit.length > 0) {
    console.error(`ÉCHEC : ${overLimit.length} fichier(s) dépassent le seuil strict de ${MAX_LINES} lignes.`);
    process.exit(1);
  }
}
