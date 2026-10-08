const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.freeeimageresizer.com';

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const publicDir = path.resolve(__dirname, '../public');

  const staticPages = [
    // 1. Root & Language Homepages (Priority 1.0)
    { path: '/', priority: '1.0', changefreq: 'weekly', lastmod: today },
    { path: '/es/', priority: '1.0', changefreq: 'weekly', lastmod: today },
    { path: '/pt/', priority: '1.0', changefreq: 'weekly', lastmod: today },
    { path: '/fr/', priority: '1.0', changefreq: 'weekly', lastmod: today },
    { path: '/de/', priority: '1.0', changefreq: 'weekly', lastmod: today },
    { path: '/hi/', priority: '1.0', changefreq: 'weekly', lastmod: today },
    { path: '/id/', priority: '1.0', changefreq: 'weekly', lastmod: today },

    // 2. Crop Tool (Root + Languages, Priority 0.8)
    { path: '/crop', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/es/crop', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/pt/crop', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/fr/crop', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/de/crop', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/hi/crop', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/id/crop', priority: '0.8', changefreq: 'weekly', lastmod: today },

    // 3. Compress Tool (Root + Languages, Priority 0.8)
    { path: '/compress', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/es/compress', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/pt/compress', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/fr/compress', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/de/compress', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/hi/compress', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/id/compress', priority: '0.8', changefreq: 'weekly', lastmod: today },

    // 4. Convert Tool (Root + Languages, Priority 0.8)
    { path: '/convert', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/es/convert', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/pt/convert', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/fr/convert', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/de/convert', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/hi/convert', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/id/convert', priority: '0.8', changefreq: 'weekly', lastmod: today },

    // 5. Watermark Tool (Root + Languages, Priority 0.8)
    { path: '/watermark', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/es/watermark', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/pt/watermark', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/fr/watermark', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/de/watermark', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/hi/watermark', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/id/watermark', priority: '0.8', changefreq: 'weekly', lastmod: today },

    // 6. Image to PDF Tool (Root + Languages, Priority 0.8)
    { path: '/image-to-pdf', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/es/image-to-pdf', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/pt/image-to-pdf', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/fr/image-to-pdf', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/de/image-to-pdf', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/hi/image-to-pdf', priority: '0.8', changefreq: 'weekly', lastmod: today },
    { path: '/id/image-to-pdf', priority: '0.8', changefreq: 'weekly', lastmod: today },

    // 7. Landing & Guide Pages (Priority 0.6)
    { path: '/instagram-image-resizer', priority: '0.6', changefreq: 'monthly', lastmod: today },
    { path: '/passport-photo-resizer', priority: '0.6', changefreq: 'monthly', lastmod: today },
    { path: '/compress-image-without-losing-quality', priority: '0.6', changefreq: 'monthly', lastmod: today },

    // 8. Info & Legal Pages
    { path: '/about', priority: '0.7', changefreq: 'monthly', lastmod: today },
    { path: '/contact', priority: '0.6', changefreq: 'monthly', lastmod: today },
    { path: '/privacy', priority: '0.4', changefreq: 'monthly', lastmod: today },
    { path: '/terms', priority: '0.4', changefreq: 'monthly', lastmod: today },

    // 9. Blog Index Pages (Root + 6 Languages, Priority 0.8)
    { path: '/blog', priority: '0.8', changefreq: 'daily', lastmod: today },
    { path: '/es/blog', priority: '0.8', changefreq: 'daily', lastmod: today },
    { path: '/pt/blog', priority: '0.8', changefreq: 'daily', lastmod: today },
    { path: '/fr/blog', priority: '0.8', changefreq: 'daily', lastmod: today },
    { path: '/de/blog', priority: '0.8', changefreq: 'daily', lastmod: today },
    { path: '/hi/blog', priority: '0.8', changefreq: 'daily', lastmod: today },
    { path: '/id/blog', priority: '0.8', changefreq: 'daily', lastmod: today }
  ];

  const blogPosts = [];
  const paginatedPages = [];

  // Helper to extract lastmod date from HTML content if present
  function extractDate(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const dateMatch = content.match(/"datePublished":\s*"([^"]+)"/);
      if (dateMatch) return dateMatch[1];
    } catch (e) {}
    return today;
  }

  // Scan English blog folder
  const enBlogDir = path.join(publicDir, 'blog');
  if (fs.existsSync(enBlogDir)) {
    const items = fs.readdirSync(enBlogDir);
    for (const item of items) {
      const fullPath = path.join(enBlogDir, item);
      if (item === 'page' && fs.statSync(fullPath).isDirectory()) {
        const pageFiles = fs.readdirSync(fullPath);
        for (const pf of pageFiles) {
          if (pf.endsWith('.html')) {
            const pageNum = pf.replace('.html', '');
            paginatedPages.push({
              path: `/blog/page/${pageNum}`,
              priority: '0.5',
              changefreq: 'weekly',
              lastmod: today
            });
          }
        }
      } else if (item.endsWith('.html')) {
        const slug = item.replace('.html', '');
        blogPosts.push({
          path: `/blog/${slug}`,
          priority: '0.7',
          changefreq: 'monthly',
          lastmod: extractDate(fullPath)
        });
      }
    }
  }

  // Scan language blog folders (/es/blog, /pt/blog, etc.)
  const langCodes = ['es', 'pt', 'fr', 'de', 'hi', 'id'];
  for (const lang of langCodes) {
    const langBlogDir = path.join(publicDir, lang, 'blog');
    if (fs.existsSync(langBlogDir)) {
      const items = fs.readdirSync(langBlogDir);
      for (const item of items) {
        const fullPath = path.join(langBlogDir, item);
        if (item === 'page' && fs.statSync(fullPath).isDirectory()) {
          const pageFiles = fs.readdirSync(fullPath);
          for (const pf of pageFiles) {
            if (pf.endsWith('.html')) {
              const pageNum = pf.replace('.html', '');
              paginatedPages.push({
                path: `/${lang}/blog/page/${pageNum}`,
                priority: '0.5',
                changefreq: 'weekly',
                lastmod: today
              });
            }
          }
        } else if (item.endsWith('.html')) {
          const slug = item.replace('.html', '');
          blogPosts.push({
            path: `/${lang}/blog/${slug}`,
            priority: '0.7',
            changefreq: 'monthly',
            lastmod: extractDate(fullPath)
          });
        }
      }
    }
  }

  const allPages = [...staticPages, ...paginatedPages, ...blogPosts];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    p => `  <url>
    <loc>${DOMAIN}${p.path}</loc>
    <lastmod>${p.lastmod || today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xml, 'utf8');

  console.log(`Successfully generated sitemap.xml with ${allPages.length} URLs (${staticPages.length} core, ${paginatedPages.length} paginated, ${blogPosts.length} blog posts, lastmod: ${today})`);
  return allPages.length;
}

if (require.main === module) {
  generateSitemap();
}

module.exports = generateSitemap;
