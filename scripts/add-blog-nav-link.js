const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../public');

// Language mapping: directory -> { targetNav: string, blogLink: string }
const configs = [
  {
    dir: publicDir,
    target: '<a href="/about" class="nav-link">About</a>',
    replacement: '<a href="/blog" class="nav-link">Blog</a>\n            <a href="/about" class="nav-link">About</a>'
  },
  {
    dir: path.join(publicDir, 'es'),
    target: '<a href="/about" class="nav-link">Acerca de</a>',
    replacement: '<a href="/es/blog" class="nav-link">Blog</a>\n            <a href="/about" class="nav-link">Acerca de</a>'
  },
  {
    dir: path.join(publicDir, 'pt'),
    target: '<a href="/about" class="nav-link">Sobre</a>',
    replacement: '<a href="/pt/blog" class="nav-link">Blog</a>\n            <a href="/about" class="nav-link">Sobre</a>'
  },
  {
    dir: path.join(publicDir, 'fr'),
    target: '<a href="/about" class="nav-link">À propos</a>',
    replacement: '<a href="/fr/blog" class="nav-link">Blog</a>\n            <a href="/about" class="nav-link">À propos</a>'
  },
  {
    dir: path.join(publicDir, 'de'),
    target: '<a href="/about" class="nav-link">Über uns</a>',
    replacement: '<a href="/de/blog" class="nav-link">Blog</a>\n            <a href="/about" class="nav-link">Über uns</a>'
  },
  {
    dir: path.join(publicDir, 'hi'),
    target: '<a href="/about" class="nav-link">हमारे बारे में</a>',
    replacement: '<a href="/hi/blog" class="nav-link">ब्लॉग</a>\n            <a href="/about" class="nav-link">हमारे बारे में</a>'
  },
  {
    dir: path.join(publicDir, 'id'),
    target: '<a href="/about" class="nav-link">Tentang Kami</a>',
    replacement: '<a href="/id/blog" class="nav-link">Blog</a>\n            <a href="/about" class="nav-link">Tentang Kami</a>'
  }
];

let updatedCount = 0;

for (const cfg of configs) {
  if (!fs.existsSync(cfg.dir)) continue;

  const files = fs.readdirSync(cfg.dir);
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    // Skip blog.html as it already has the active blog link
    if (file === 'blog.html') continue;

    const filePath = path.join(cfg.dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Only update if not already containing the blog link
    if (content.includes('href="/blog"') || content.includes('/blog" class="nav-link"')) {
      continue;
    }

    if (content.includes(cfg.target)) {
      content = content.replace(cfg.target, cfg.replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      updatedCount++;
      console.log(`Updated nav link in: ${path.relative(publicDir, filePath)}`);
    }
  }
}

console.log(`Successfully updated ${updatedCount} HTML files with Blog navigation link.`);
