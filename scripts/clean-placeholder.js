const fs = require('fs');
const path = require('path');
const buildBlog = require('./build-blog');

console.log('--- Cleaning Up Placeholder Test Posts ---');

const contentDir = path.resolve(__dirname, '../content/blog');
const publicDir = path.resolve(__dirname, '../public');

const testSlugs = [
  'sample-how-to-compress-images',
  'muestra-como-comprimir-imagenes',
  'amostra-como-comprimir-imagens',
  'exemple-comment-compresser-des-images',
  'beispiel-anleitung-bilder-komprimieren',
  'sample-photo-compress-kaise-kare',
  'contoh-cara-kompres-gambar'
];

let deletedFiles = 0;

// 1. Remove markdown files
const langDirs = ['en', 'es', 'pt', 'fr', 'de', 'hi', 'id'];
for (const lang of langDirs) {
  const lDir = path.join(contentDir, lang);
  if (fs.existsSync(lDir)) {
    const files = fs.readdirSync(lDir);
    for (const f of files) {
      for (const slug of testSlugs) {
        if (f.includes(slug)) {
          fs.unlinkSync(path.join(lDir, f));
          deletedFiles++;
          console.log(`Deleted source: content/blog/${lang}/${f}`);
        }
      }
    }
  }
}

// 2. Remove compiled html files
const enBlogDir = path.join(publicDir, 'blog');
if (fs.existsSync(enBlogDir)) {
  for (const slug of testSlugs) {
    const p = path.join(enBlogDir, `${slug}.html`);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      deletedFiles++;
      console.log(`Deleted HTML: public/blog/${slug}.html`);
    }
  }
}

for (const lang of ['es', 'pt', 'fr', 'de', 'hi', 'id']) {
  const lBlogDir = path.join(publicDir, lang, 'blog');
  if (fs.existsSync(lBlogDir)) {
    for (const slug of testSlugs) {
      const p = path.join(lBlogDir, `${slug}.html`);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        deletedFiles++;
        console.log(`Deleted HTML: public/${lang}/blog/${slug}.html`);
      }
    }
  }
}

// 3. Rebuild blog & sitemap
buildBlog();

console.log(`Cleanup complete! Removed ${deletedFiles} placeholder files.`);
