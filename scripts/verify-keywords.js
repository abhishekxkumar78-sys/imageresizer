const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.wrangler' && file !== '.kilo') {
        results = results.concat(getHtmlFiles(fullPath));
      }
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = getHtmlFiles('./public');

const competitorKeywords = [
  "resizepixel", "birme", "iloveimg", "canva image resizer", "adobe image resizer",
  "picresize", "imresizer", "fotor image resizer", "kapwing image resizer",
  "pixlr image resizer", "picsart image resizer", "photoresizer", "web resizer",
  "easy resize", "bulk resize photos", "img2go", "ezgif image resizer",
  "cloudinary image resizer", "watermarkly", "simple image resizer", "resize pixel",
  "pic resize", "resizebox", "picssizer"
];

const genericKeywords = [
  "image resizer", "free image resizer", "photo resizer", "picture resizer",
  "resize image", "photo resize", "image compressor", "image converter",
  "image editor", "image enlarger", "crop image", "jpg resize",
  "pic size reducer", "video resizer"
];

const allTargetKeywords = [...competitorKeywords, ...genericKeywords];

// Map of lower-cased keyword -> list of { file, exact }
const keywordOccurrences = new Map();
allTargetKeywords.forEach(k => keywordOccurrences.set(k.toLowerCase(), []));

const fileKeywordMap = new Map();

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const match = content.match(/<meta\s+[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i) ||
                content.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']keywords["']/i);
  if (match) {
    const kws = match[1].split(',').map(s => s.trim()).filter(Boolean);
    fileKeywordMap.set(f, kws);
    kws.forEach(k => {
      const lower = k.toLowerCase();
      if (keywordOccurrences.has(lower)) {
        keywordOccurrences.get(lower).push({ file: f, exact: k });
      }
    });
  }
});

console.log('=== VERIFICATION OF TARGET KEYWORDS ===');
console.log(`Total target keywords: ${allTargetKeywords.length}`);

let missing = [];
let multiple = [];
let exactlyOne = [];

for (const [kw, occs] of keywordOccurrences.entries()) {
  if (occs.length === 0) {
    missing.push(kw);
  } else if (occs.length === 1) {
    exactlyOne.push({ kw, file: occs[0].file });
  } else {
    multiple.push({ kw, files: occs.map(o => o.file) });
  }
}

console.log(`Keywords found exactly once: ${exactlyOne.length} / ${allTargetKeywords.length}`);
console.log(`Missing keywords: ${missing.length}`);
if (missing.length > 0) {
  console.log('Missing list:', missing);
}
console.log(`Duplicate keywords across site: ${multiple.length}`);
if (multiple.length > 0) {
  console.log('Duplicate list:', multiple);
}

// Group by page
const perPage = {};
exactlyOne.forEach(({ kw, file }) => {
  const rel = path.relative('.', file).replace(/\\/g, '/');
  if (!perPage[rel]) perPage[rel] = [];
  perPage[rel].push(kw);
});

console.log('\n=== PER-PAGE BREAKDOWN OF ADDED KEYWORDS ===');
for (const [p, kws] of Object.entries(perPage)) {
  console.log(`\nPage: ${p} (${kws.length} keywords)`);
  kws.forEach(k => console.log(`  - ${k}`));
}

// Check for any duplicate keyword WITHIN the same page
console.log('\n=== INTERNAL PAGE DUPLICATE CHECK ===');
let pageInternalDupes = 0;
for (const [f, kws] of fileKeywordMap.entries()) {
  const seen = new Set();
  const dupes = [];
  kws.forEach(k => {
    const l = k.toLowerCase();
    if (seen.has(l)) dupes.push(k);
    seen.add(l);
  });
  if (dupes.length > 0) {
    console.log(`Duplicates in ${f}:`, dupes);
    pageInternalDupes++;
  }
}
if (pageInternalDupes === 0) {
  console.log('Zero internal duplicate keywords within any page.');
}
