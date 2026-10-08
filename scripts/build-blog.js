const fs = require('fs');
const path = require('path');
const generateSitemap = require('./generate-sitemap');

const DOMAIN = 'https://www.freeeimageresizer.com';
const POSTS_PER_PAGE = 12;

const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    htmlLang: 'en',
    root: '/',
    blogRoot: '/blog',
    contentDir: path.join(__dirname, '../content/blog/en'),
    htmlOutDir: path.join(__dirname, '../public/blog'),
    indexHtmlPath: path.join(__dirname, '../public/blog.html'),
    pageTitle: 'Blog & Guides — Image Editing & Optimization | ImageResizer',
    pageDescription: 'Helpful tutorials, guides, and tips for image compression, resizing, conversion, cropping, and format optimization.',
    heroBadge: 'ImageResizer Blog',
    heroTitle: 'Image Editing Guides & Articles',
    heroSubtitle: 'Master online image optimization with step-by-step guides, compression tips, and format tutorials.',
    readTimeSuffix: 'min read',
    backToBlog: 'Back to all articles',
    relatedTitle: 'Related Guides',
    readMoreText: 'Read Guide',
    noPostsText: 'No articles published yet. Check back soon for fresh tutorials and guides!',
    prevText: '← Previous',
    nextText: 'Next →',
    pageText: 'Page',
    nav: {
      resize: 'Resize',
      crop: 'Crop',
      compress: 'Compress',
      convert: 'Convert',
      watermark: 'Watermark',
      imageToPdf: 'Image to PDF',
      blog: 'Blog',
      about: 'About',
      contact: 'Contact'
    },
    footer: {
      brandText: 'Free online image resizer &amp; cropper. Process images entirely in your browser.',
      toolsTitle: 'Tools',
      guidesTitle: 'Guides',
      companyTitle: 'Company',
      legalTitle: 'Legal',
      resizeLinkText: 'Image Resizer',
      cropLinkText: 'Crop Image',
      compressLinkText: 'Image Compressor',
      convertLinkText: 'Format Converter',
      watermarkLinkText: 'Watermark Adder',
      imageToPdfLinkText: 'Image to PDF',
      guideInstagram: 'Instagram Resizer',
      guidePassport: 'Passport Photo',
      guideCompress: 'Compress Guide',
      aboutText: 'About Us',
      contactText: 'Contact Us',
      privacyText: 'Privacy Policy',
      termsText: 'Terms &amp; Conditions',
      allRightsReserved: 'All rights reserved.'
    }
  },
  es: {
    code: 'es',
    name: 'Español',
    htmlLang: 'es',
    root: '/es/',
    blogRoot: '/es/blog',
    contentDir: path.join(__dirname, '../content/blog/es'),
    htmlOutDir: path.join(__dirname, '../public/es/blog'),
    indexHtmlPath: path.join(__dirname, '../public/es/blog.html'),
    pageTitle: 'Blog y Guías — Edición y Optimización de Imágenes | ImageResizer',
    pageDescription: 'Tutoriales, guías y consejos útiles para comprimir, redimensionar, convertir y optimizar imágenes online gratis.',
    heroBadge: 'Blog de ImageResizer',
    heroTitle: 'Guías y Artículos de Edición de Imágenes',
    heroSubtitle: 'Aprende a optimizar tus imágenes paso a paso con nuestros tutoriales y guías prácticas.',
    readTimeSuffix: 'min de lectura',
    backToBlog: 'Volver a todos los artículos',
    relatedTitle: 'Guías Relacionadas',
    readMoreText: 'Leer Guía',
    noPostsText: 'No hay artículos publicados todavía. ¡Vuelve pronto para ver nuevos tutoriales!',
    prevText: '← Anterior',
    nextText: 'Siguiente →',
    pageText: 'Página',
    nav: {
      resize: 'Redimensionar',
      crop: 'Recortar',
      compress: 'Comprimir',
      convert: 'Convertir',
      watermark: 'Marca de agua',
      imageToPdf: 'Imagen a PDF',
      blog: 'Blog',
      about: 'Acerca de',
      contact: 'Contacto'
    },
    footer: {
      brandText: 'Redimensionador y recortador de imágenes online gratuito. Procesa imágenes en tu navegador.',
      toolsTitle: 'Herramientas',
      guidesTitle: 'Guías',
      companyTitle: 'Compañía',
      legalTitle: 'Legal',
      resizeLinkText: 'Redimensionar imagen',
      cropLinkText: 'Recortar imagen',
      compressLinkText: 'Comprimir imagen',
      convertLinkText: 'Convertir formato',
      watermarkLinkText: 'Marca de agua',
      imageToPdfLinkText: 'Imagen a PDF',
      guideInstagram: 'Redimensionar para Instagram',
      guidePassport: 'Foto para pasaporte',
      guideCompress: 'Comprimir sin pérdida',
      aboutText: 'Acerca de',
      contactText: 'Contacto',
      privacyText: 'Política de privacidad',
      termsText: 'Términos y condiciones',
      allRightsReserved: 'Todos los derechos reservados.'
    }
  },
  pt: {
    code: 'pt',
    name: 'Português',
    htmlLang: 'pt',
    root: '/pt/',
    blogRoot: '/pt/blog',
    contentDir: path.join(__dirname, '../content/blog/pt'),
    htmlOutDir: path.join(__dirname, '../public/pt/blog'),
    indexHtmlPath: path.join(__dirname, '../public/pt/blog.html'),
    pageTitle: 'Blog e Guias — Edição e Otimização de Imagens | ImageResizer',
    pageDescription: 'Tutoriais e dicas para redimensionar, comprimir, converter e cortar imagens online gratuitamente.',
    heroBadge: 'Blog ImageResizer',
    heroTitle: 'Guias e Artigos de Edição de Imagens',
    heroSubtitle: 'Aprenda as melhores práticas para otimizar fotos e imagens com guias práticos.',
    readTimeSuffix: 'min de leitura',
    backToBlog: 'Voltar para todos os artigos',
    relatedTitle: 'Guias Relacionados',
    readMoreText: 'Ler Guia',
    noPostsText: 'Ainda não há artigos publicados. Volte em breve para novos tutoriais!',
    prevText: '← Anterior',
    nextText: 'Próximo →',
    pageText: 'Página',
    nav: {
      resize: 'Redimensionar',
      crop: 'Recortar',
      compress: 'Comprimir',
      convert: 'Converter',
      watermark: "Marca d'água",
      imageToPdf: 'Imagem para PDF',
      blog: 'Blog',
      about: 'Sobre',
      contact: 'Contato'
    },
    footer: {
      brandText: 'Redimensionador e cortador de imagens online gratuito. Processe imagens inteiramente no seu navegador.',
      toolsTitle: 'Ferramentas',
      guidesTitle: 'Guias',
      companyTitle: 'Empresa',
      legalTitle: 'Legal',
      resizeLinkText: 'Redimensionar imagem',
      cropLinkText: 'Recortar imagem',
      compressLinkText: 'Comprimir imagem',
      convertLinkText: 'Converter formato',
      watermarkLinkText: "Marca d'água",
      imageToPdfLinkText: 'Imagem para PDF',
      guideInstagram: 'Redimensionar para Instagram',
      guidePassport: 'Foto de passaporte',
      guideCompress: 'Guia de compressão',
      aboutText: 'Sobre nós',
      contactText: 'Fale conosco',
      privacyText: 'Política de privacidade',
      termsText: 'Termos e condições',
      allRightsReserved: 'Todos os direitos reservados.'
    }
  },
  fr: {
    code: 'fr',
    name: 'Français',
    htmlLang: 'fr',
    root: '/fr/',
    blogRoot: '/fr/blog',
    contentDir: path.join(__dirname, '../content/blog/fr'),
    htmlOutDir: path.join(__dirname, '../public/fr/blog'),
    indexHtmlPath: path.join(__dirname, '../public/fr/blog.html'),
    pageTitle: "Blog et Guides — Édition et Optimisation d'Images | ImageResizer",
    pageDescription: "Tutoriels et guides pratiques pour redimensionner, compresser et convertir vos images en ligne gratuitement.",
    heroBadge: 'Blog ImageResizer',
    heroTitle: "Guides et Articles d'Édition d'Images",
    heroSubtitle: 'Optimisez vos photos et images facilement grâce à nos tutoriels détaillés.',
    readTimeSuffix: 'min de lecture',
    backToBlog: 'Retour à tous les articles',
    relatedTitle: 'Guides Connexes',
    readMoreText: 'Lire le Guide',
    noPostsText: 'Aucun article publié pour le moment. Revenez bientôt !',
    prevText: '← Précédent',
    nextText: 'Suivant →',
    pageText: 'Page',
    nav: {
      resize: 'Redimensionner',
      crop: 'Recadrer',
      compress: 'Compresser',
      convert: 'Convertir',
      watermark: 'Filigrane',
      imageToPdf: 'Image en PDF',
      blog: 'Blog',
      about: 'À propos',
      contact: 'Contact'
    },
    footer: {
      brandText: 'Outil de redimensionnement et de recadrage d’images en ligne gratuit. Traitement direct dans votre navigateur.',
      toolsTitle: 'Outils',
      guidesTitle: 'Guides',
      companyTitle: 'Entreprise',
      legalTitle: 'Légal',
      resizeLinkText: "Redimensionner l'image",
      cropLinkText: "Recadrer l'image",
      compressLinkText: "Compresser l'image",
      convertLinkText: 'Convertir le format',
      watermarkLinkText: 'Ajouter un filigrane',
      imageToPdfLinkText: 'Image en PDF',
      guideInstagram: 'Redimensionner pour Instagram',
      guidePassport: "Photo d'identité",
      guideCompress: 'Guide de compression',
      aboutText: 'À propos de nous',
      contactText: 'Contactez-nous',
      privacyText: 'Politique de confidentialité',
      termsText: 'Conditions d’utilisation',
      allRightsReserved: 'Tous droits réservés.'
    }
  },
  de: {
    code: 'de',
    name: 'Deutsch',
    htmlLang: 'de',
    root: '/de/',
    blogRoot: '/de/blog',
    contentDir: path.join(__dirname, '../content/blog/de'),
    htmlOutDir: path.join(__dirname, '../public/de/blog'),
    indexHtmlPath: path.join(__dirname, '../public/de/blog.html'),
    pageTitle: 'Blog & Anleitungen — Bildbearbeitung & Optimierung | ImageResizer',
    pageDescription: 'Anleitungen und Tipps zum Verkleinern, Komprimieren, Konvertieren und Zuschneiden von Bildern online.',
    heroBadge: 'ImageResizer Blog',
    heroTitle: 'Anleitungen zur Bildbearbeitung',
    heroSubtitle: 'Schritt-für-Schritt-Anleitungen und nützliche Tipps zur optimalen Bildoptimierung.',
    readTimeSuffix: 'Min. Lesezeit',
    backToBlog: 'Zurück zu allen Artikeln',
    relatedTitle: 'Verwandte Anleitungen',
    readMoreText: 'Anleitung Lesen',
    noPostsText: 'Noch keine Artikel veröffentlicht. Schauen Sie bald wieder vorbei!',
    prevText: '← Vorherige',
    nextText: 'Nächste →',
    pageText: 'Seite',
    nav: {
      resize: 'Größe ändern',
      crop: 'Zuschneiden',
      compress: 'Komprimieren',
      convert: 'Konvertieren',
      watermark: 'Wasserzeichen',
      imageToPdf: 'Bild zu PDF',
      blog: 'Blog',
      about: 'Über uns',
      contact: 'Kontakt'
    },
    footer: {
      brandText: 'Kostenloses Online-Tool zum Ändern der Bildgröße und Zuschneiden direkt im Browser.',
      toolsTitle: 'Tools',
      guidesTitle: 'Anleitungen',
      companyTitle: 'Unternehmen',
      legalTitle: 'Rechtliches',
      resizeLinkText: 'Bildgröße ändern',
      cropLinkText: 'Bild zuschneiden',
      compressLinkText: 'Bild komprimieren',
      convertLinkText: 'Format konvertieren',
      watermarkLinkText: 'Wasserzeichen hinzufügen',
      imageToPdfLinkText: 'Bild zu PDF',
      guideInstagram: 'Instagram Bildgröße',
      guidePassport: 'Passfoto erstellen',
      guideCompress: 'Komprimierungs-Guide',
      aboutText: 'Über uns',
      contactText: 'Kontakt',
      privacyText: 'Datenschutz',
      termsText: 'AGB',
      allRightsReserved: 'Alle Rechte vorbehalten.'
    }
  },
  hi: {
    code: 'hi',
    name: 'हिन्दी',
    htmlLang: 'hi',
    root: '/hi/',
    blogRoot: '/hi/blog',
    contentDir: path.join(__dirname, '../content/blog/hi'),
    htmlOutDir: path.join(__dirname, '../public/hi/blog'),
    indexHtmlPath: path.join(__dirname, '../public/hi/blog.html'),
    pageTitle: 'ब्लॉग और गाइड्स — इमेज एडिटिंग और ऑप्टिमाइज़ेशन | ImageResizer',
    pageDescription: 'इमेज कंप्रेस, रीसाइज़, कन्वर्ट और क्रॉप करने के लिए उपयोगी ट्यूटोरियल और टिप्स हिंदी में।',
    heroBadge: 'इमेज रीसाइज़र ब्लॉग',
    heroTitle: 'इमेज एडिटिंग गाइड्स और लेख',
    heroSubtitle: 'स्टेप-बाय-स्टेप ट्यूटोरियल और उपयोगी टिप्स के साथ इमेज ऑप्टिमाइज़ेशन सीखें।',
    readTimeSuffix: 'मिनट पढ़ने का समय',
    backToBlog: 'सभी लेखों पर वापस जाएं',
    relatedTitle: 'संबंधित गाइड्स',
    readMoreText: 'गाइड पढ़ें',
    noPostsText: 'अभी कोई लेख प्रकाशित नहीं हुआ है। नए ट्यूटोरियल के लिए जल्द वापस आएं!',
    prevText: '← पिछला',
    nextText: 'अगला →',
    pageText: 'पृष्ठ',
    nav: {
      resize: 'रीसाइज़',
      crop: 'क्रॉप',
      compress: 'कंप्रेस',
      convert: 'कन्वर्ट',
      watermark: 'वॉटरमार्क',
      imageToPdf: 'इमेज से PDF',
      blog: 'ब्लॉग',
      about: 'हमारे बारे में',
      contact: 'संपर्क करें'
    },
    footer: {
      brandText: 'मुफ़्त ऑनलाइन इमेज रीसाइज़र और क्रॉपर। ब्राउज़र में ही सुरक्षित इमेज प्रोसेस करें।',
      toolsTitle: 'टूल्स',
      guidesTitle: 'गाइड्स',
      companyTitle: 'कंपनी',
      legalTitle: 'कानूनी',
      resizeLinkText: 'इमेज रीसाइज़ करें',
      cropLinkText: 'इमेज क्रॉप करें',
      compressLinkText: 'इमेज कंप्रेस करें',
      convertLinkText: 'फॉर्मेट कन्वर्ट करें',
      watermarkLinkText: 'वॉटरमार्क लगाएं',
      imageToPdfLinkText: 'इमेज से PDF',
      guideInstagram: 'इंस्टाग्राम रीसाइज़र',
      guidePassport: 'पासपोर्ट फोटो',
      guideCompress: 'कंप्रेस गाइड',
      aboutText: 'हमारे बारे में',
      contactText: 'संपर्क करें',
      privacyText: 'गोपनीयता नीति',
      termsText: 'नियम और शर्तें',
      allRightsReserved: 'सर्वाधिकार सुरक्षित।'
    }
  },
  id: {
    code: 'id',
    name: 'Bahasa Indonesia',
    htmlLang: 'id',
    root: '/id/',
    blogRoot: '/id/blog',
    contentDir: path.join(__dirname, '../content/blog/id'),
    htmlOutDir: path.join(__dirname, '../public/id/blog'),
    indexHtmlPath: path.join(__dirname, '../public/id/blog.html'),
    pageTitle: 'Blog & Panduan — Edit & Optimasi Gambar | ImageResizer',
    pageDescription: 'Panduan lengkap dan tips praktis untuk kompres, ubah ukuran, konversi, dan potong gambar online gratis.',
    heroBadge: 'Blog ImageResizer',
    heroTitle: 'Panduan & Artikel Edit Gambar',
    heroSubtitle: 'Pelajari cara mudah mengoptimalkan gambar dengan panduan langkah demi langkah.',
    readTimeSuffix: 'menit membaca',
    backToBlog: 'Kembali ke semua artikel',
    relatedTitle: 'Panduan Terkait',
    readMoreText: 'Baca Panduan',
    noPostsText: 'Belum ada artikel yang diterbitkan. Kunjungi lagi segera!',
    prevText: '← Sebelumnya',
    nextText: 'Berikutnya →',
    pageText: 'Halaman',
    nav: {
      resize: 'Ubah Ukuran',
      crop: 'Potong',
      compress: 'Kompres',
      convert: 'Konversi',
      watermark: 'Watermark',
      imageToPdf: 'Gambar ke PDF',
      blog: 'Blog',
      about: 'Tentang Kami',
      contact: 'Kontak'
    },
    footer: {
      brandText: 'Pengubah ukuran dan pemotong gambar online gratis. Proses gambar sepenuhnya di browser Anda.',
      toolsTitle: 'Alat',
      guidesTitle: 'Panduan',
      companyTitle: 'Perusahaan',
      legalTitle: 'Hukum',
      resizeLinkText: 'Ubah Ukuran Gambar',
      cropLinkText: 'Potong Gambar',
      compressLinkText: 'Kompres Gambar',
      convertLinkText: 'Konversi Format',
      watermarkLinkText: 'Tambah Watermark',
      imageToPdfLinkText: 'Gambar ke PDF',
      guideInstagram: 'Ukuran Instagram',
      guidePassport: 'Foto Paspor',
      guideCompress: 'Panduan Kompres',
      aboutText: 'Tentang Kami',
      contactText: 'Kontak Kami',
      privacyText: 'Kebijakan Privasi',
      termsText: 'Syarat &amp; Ketentuan',
      allRightsReserved: 'Hak cipta dilindungi undang-undang.'
    }
  }
};

// -------------------------------------------------------------
// Helper: Resolve localized tool URLs
// -------------------------------------------------------------
function getToolUrl(langCode, toolName) {
  const isEn = langCode === 'en';
  const prefix = isEn ? '' : `/${langCode}`;
  switch (toolName) {
    case 'resize':
      return isEn ? '/' : `${prefix}/`;
    case 'crop':
      return `${prefix}/crop`;
    case 'compress':
      return `${prefix}/compress`;
    case 'convert':
      return `${prefix}/convert`;
    case 'watermark':
      return `${prefix}/watermark`;
    case 'image-to-pdf':
    case 'imageToPdf':
      return `${prefix}/image-to-pdf`;
    default:
      return isEn ? '/' : `${prefix}/`;
  }
}

// -------------------------------------------------------------
// Markdown & Frontmatter Parser
// -------------------------------------------------------------
function parseMarkdownFile(rawContent) {
  const lines = rawContent.split(/\r?\n/);
  let inFrontmatter = false;
  const frontmatterLines = [];
  const bodyLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter && line.trim() === '---') {
      inFrontmatter = false;
      continue;
    }
    if (inFrontmatter) {
      frontmatterLines.push(line);
    } else {
      bodyLines.push(line);
    }
  }

  // Parse simple YAML frontmatter
  const metadata = {};
  let currentKey = null;
  let currentObj = null;

  for (const fline of frontmatterLines) {
    if (!fline.trim() || fline.trim().startsWith('#')) continue;

    const indentMatch = fline.match(/^(\s+)([\w-]+):\s*(.*)$/);
    if (indentMatch && currentObj) {
      const subKey = indentMatch[2];
      let subVal = indentMatch[3].trim().replace(/^['"](.*)['"]$/, '$1');
      currentObj[subKey] = subVal;
      continue;
    }

    const keyMatch = fline.match(/^([\w-]+):\s*(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      let val = keyMatch[2].trim();
      if (val === '') {
        currentKey = key;
        currentObj = {};
        metadata[key] = currentObj;
      } else {
        currentKey = null;
        currentObj = null;
        val = val.replace(/^['"](.*)['"]$/, '$1');
        metadata[key] = val;
      }
    }
  }

  const htmlBody = markdownToHtml(bodyLines.join('\n'));
  return { metadata, htmlBody };
}

function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const output = [];
  let inList = false;
  let listType = null;
  let inTable = false;
  let tableHeaderParsed = false;
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];

  function closeList() {
    if (inList) {
      output.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = null;
    }
  }

  function closeTable() {
    if (inTable) {
      output.push('</tbody></table>');
      inTable = false;
      tableHeaderParsed = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        output.push(`<pre><code>${codeBlockLines.join('\n')}</code></pre>`);
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        closeList();
        closeTable();
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(escapeHtml(rawLine));
      continue;
    }

    // Blank line
    if (!trimmed) {
      closeList();
      closeTable();
      continue;
    }

    // Tables: | col1 | col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      // Check if separator line
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        // Table header separator
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderParsed = true;
        output.push('<table><thead><tr>');
        for (const cell of cells) {
          output.push(`<th>${parseInline(cell)}</th>`);
        }
        output.push('</tr></thead><tbody>');
      } else {
        output.push('<tr>');
        for (const cell of cells) {
          output.push(`<td>${parseInline(cell)}</td>`);
        }
        output.push('</tr>');
      }
      continue;
    } else {
      closeTable();
    }

    // Headings
    if (trimmed.startsWith('#')) {
      closeList();
      const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const text = parseInline(hMatch[2]);
        output.push(`<h${level}>${text}</h${level}>`);
        continue;
      }
    }

    // Blockquotes
    if (trimmed.startsWith('>')) {
      closeList();
      const quoteText = parseInline(trimmed.replace(/^>\s*/, ''));
      output.push(`<blockquote><p>${quoteText}</p></blockquote>`);
      continue;
    }

    // Unordered lists
    if (/^[-*+]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        output.push('<ul>');
      }
      const itemText = parseInline(trimmed.replace(/^[-*+]\s+/, ''));
      output.push(`<li>${itemText}</li>`);
      continue;
    }

    // Ordered lists
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        output.push('<ol>');
      }
      const itemText = parseInline(trimmed.replace(/^\d+\.\s+/, ''));
      output.push(`<li>${itemText}</li>`);
      continue;
    }

    // Paragraph
    closeList();
    output.push(`<p>${parseInline(trimmed)}</p>`);
  }

  closeList();
  closeTable();

  return output.join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseInline(text) {
  let res = text;

  // Inline images: ![alt](url)
  res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

  // Inline links: [text](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold & Italic: ***text*** or ___text___
  res = res.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold: **text**
  res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  res = res.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Inline code: `code`
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>');

  return res;
}

// -------------------------------------------------------------
// Header & Footer HTML Generators
// -------------------------------------------------------------
function buildHeader(currentLangCode, langSelectOptions, isBlogActive = true) {
  const langConfig = LANGUAGES[currentLangCode];
  const nav = langConfig.nav;

  return `    <header class="header" id="header">
        <div class="header-left">
            <a href="${langConfig.root}" class="header-logo-link">
                <div class="logo-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                        <circle cx="14" cy="14" r="14" fill="#6366f1" />
                        <path d="M9 11.5C9 10.1193 10.1193 9 11.5 9H16.5C17.8807 9 19 10.1193 19 11.5V16.5C19 17.8807 17.8807 19 16.5 19H11.5C10.1193 19 9 17.8807 9 16.5V11.5Z" stroke="white" stroke-width="1.5" />
                        <path d="M9 15L12.293 11.707C12.683 11.317 13.317 11.317 13.707 11.707L19 17" stroke="white" stroke-width="1.5" stroke-linecap="round" />
                        <circle cx="16" cy="12" r="1" fill="white" />
                    </svg>
                </div>
                <h1 class="logo-text">ImageResizer</h1>
            </a>
        </div>
        <div class="header-actions">
            <div class="lang-switcher">
                <span class="lang-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                </span>
                <select class="lang-select" onchange="window.location.href=this.value" aria-label="Select language">
${langSelectOptions}
                </select>
            </div>
            <button class="nav-hamburger" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-nav">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
        </div>
        <nav class="header-nav" id="mobile-nav">
            <a href="${getToolUrl(currentLangCode, 'resize')}" class="nav-btn">${nav.resize}</a>
            <a href="${getToolUrl(currentLangCode, 'crop')}" class="nav-btn">${nav.crop}</a>
            <a href="${getToolUrl(currentLangCode, 'compress')}" class="nav-btn">${nav.compress}</a>
            <a href="${getToolUrl(currentLangCode, 'convert')}" class="nav-btn">${nav.convert}</a>
            <a href="${getToolUrl(currentLangCode, 'watermark')}" class="nav-btn">${nav.watermark}</a>
            <a href="${getToolUrl(currentLangCode, 'image-to-pdf')}" class="nav-btn">${nav.imageToPdf}</a>
            <a href="${langConfig.blogRoot}" class="nav-link${isBlogActive ? ' active-nav-link' : ''}">${nav.blog}</a>
            <a href="/about" class="nav-link">${nav.about}</a>
            <a href="/contact" class="nav-link">${nav.contact}</a>
        </nav>
    </header>`;
}

function buildFooter(currentLangCode) {
  const langConfig = LANGUAGES[currentLangCode];
  const f = langConfig.footer;

  return `    <footer class="footer">
        <div class="footer-content">
            <div class="footer-columns">
                <div class="footer-col footer-col-brand">
                    <div class="footer-logo">
                        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                            <circle cx="14" cy="14" r="14" fill="#6366f1" />
                            <path d="M9 11.5C9 10.1193 10.1193 9 11.5 9H16.5C17.8807 9 19 10.1193 19 11.5V16.5C19 17.8807 17.8807 19 16.5 19H11.5C10.1193 19 9 17.8807 9 16.5V11.5Z" stroke="white" stroke-width="1.5" />
                            <path d="M9 15L12.293 11.707C12.683 11.317 13.317 11.317 13.707 11.707L19 17" stroke="white" stroke-width="1.5" stroke-linecap="round" />
                            <circle cx="16" cy="12" r="1" fill="white" />
                        </svg>
                        <span>ImageResizer</span>
                    </div>
                    <p class="footer-text">${f.brandText}</p>
                </div>
                <div class="footer-col">
                    <h4 class="footer-col-title">${f.toolsTitle}</h4>
                    <a href="${getToolUrl(currentLangCode, 'resize')}" class="footer-link">${f.resizeLinkText}</a>
                    <a href="${getToolUrl(currentLangCode, 'crop')}" class="footer-link">${f.cropLinkText}</a>
                    <a href="${getToolUrl(currentLangCode, 'compress')}" class="footer-link">${f.compressLinkText}</a>
                    <a href="${getToolUrl(currentLangCode, 'convert')}" class="footer-link">${f.convertLinkText}</a>
                    <a href="${getToolUrl(currentLangCode, 'watermark')}" class="footer-link">${f.watermarkLinkText}</a>
                    <a href="${getToolUrl(currentLangCode, 'image-to-pdf')}" class="footer-link">${f.imageToPdfLinkText}</a>
                </div>
                <div class="footer-col">
                    <h4 class="footer-col-title">${f.guidesTitle}</h4>
                    <a href="/instagram-image-resizer" class="footer-link">${f.guideInstagram}</a>
                    <a href="/passport-photo-resizer" class="footer-link">${f.guidePassport}</a>
                    <a href="/compress-image-without-losing-quality" class="footer-link">${f.guideCompress}</a>
                </div>
                <div class="footer-col">
                    <h4 class="footer-col-title">${f.companyTitle}</h4>
                    <a href="/about" class="footer-link">${f.aboutText}</a>
                    <a href="/contact" class="footer-link">${f.contactText}</a>
                </div>
                <div class="footer-col">
                    <h4 class="footer-col-title">${f.legalTitle}</h4>
                    <a href="/privacy" class="footer-link">${f.privacyText}</a>
                    <a href="/terms" class="footer-link">${f.termsText}</a>
                </div>
            </div>
            <p class="footer-copy">&copy; 2026 ImageResizer. ${f.allRightsReserved}</p>
        </div>
    </footer>`;
}

// -------------------------------------------------------------
// Tool CTA Box Generator
// -------------------------------------------------------------
function buildToolCta(langCode, toolCtaMeta) {
  if (!toolCtaMeta) return '';
  const toolName = toolCtaMeta.tool || 'resize';
  const targetUrl = getToolUrl(langCode, toolName);
  const title = toolCtaMeta.title || LANGUAGES[langCode].ctaDefaultTitle;
  const desc = toolCtaMeta.description || LANGUAGES[langCode].ctaDefaultDesc;
  const btn = toolCtaMeta.buttonText || LANGUAGES[langCode].ctaDefaultBtn;

  return `            <div class="blog-cta-box">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(desc)}</p>
                <a href="${targetUrl}" class="blog-cta-btn">
                    ${escapeHtml(btn)}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
            </div>`;
}

// -------------------------------------------------------------
// Build All Blog Pages
// -------------------------------------------------------------
function buildBlog() {
  console.log('--- Starting Multilingual Blog Build ---');

  // Load templates
  const indexTemplatePath = path.join(__dirname, '../templates/blog-index.template.html');
  const postTemplatePath = path.join(__dirname, '../templates/blog-post.template.html');

  if (!fs.existsSync(indexTemplatePath) || !fs.existsSync(postTemplatePath)) {
    throw new Error('Templates not found! Ensure templates/blog-index.template.html and templates/blog-post.template.html exist.');
  }

  const indexTemplate = fs.readFileSync(indexTemplatePath, 'utf8');
  const postTemplate = fs.readFileSync(postTemplatePath, 'utf8');

  // 1. Ensure all content and public output directories exist
  for (const langCode of Object.keys(LANGUAGES)) {
    const l = LANGUAGES[langCode];
    if (!fs.existsSync(l.contentDir)) fs.mkdirSync(l.contentDir, { recursive: true });
    if (!fs.existsSync(l.htmlOutDir)) fs.mkdirSync(l.htmlOutDir, { recursive: true });
  }

  // 2. Read and parse all markdown files per language
  const allPostsByLang = {};
  const groupsMap = new Map(); // groupId -> { langCode: postObj }

  for (const langCode of Object.keys(LANGUAGES)) {
    const l = LANGUAGES[langCode];
    allPostsByLang[langCode] = [];

    const files = fs.readdirSync(l.contentDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const filePath = path.join(l.contentDir, file);
      const rawContent = fs.readFileSync(filePath, 'utf8');
      const { metadata, htmlBody } = parseMarkdownFile(rawContent);

      if (!metadata.slug || !metadata.title) {
        console.warn(`[WARN] Skipping ${file} in ${langCode}: missing slug or title.`);
        continue;
      }

      const postObj = {
        lang: langCode,
        slug: metadata.slug,
        title: metadata.title,
        date: metadata.date || new Date().toISOString().split('T')[0],
        author: metadata.author || 'ImageResizer Team',
        category: metadata.category || 'Guides',
        metaTitle: metadata.metaTitle || `${metadata.title} — ImageResizer`,
        metaDescription: metadata.metaDescription || '',
        groupId: metadata.groupId || metadata.slug,
        readingTime: metadata.readingTime ? `${metadata.readingTime} ${l.readTimeSuffix}` : `4 ${l.readTimeSuffix}`,
        toolCta: metadata.toolCta,
        htmlBody: htmlBody,
        path: langCode === 'en' ? `/blog/${metadata.slug}` : `/${langCode}/blog/${metadata.slug}`,
        outHtmlPath: path.join(l.htmlOutDir, `${metadata.slug}.html`)
      };

      allPostsByLang[langCode].push(postObj);

      // Index by groupId
      if (!groupsMap.has(postObj.groupId)) {
        groupsMap.set(postObj.groupId, {});
      }
      groupsMap.get(postObj.groupId)[langCode] = postObj;
    }

    // Sort posts by date descending
    allPostsByLang[langCode].sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  let totalPostsGenerated = 0;

  // 3. Generate individual blog post pages
  for (const langCode of Object.keys(LANGUAGES)) {
    const l = LANGUAGES[langCode];
    const posts = allPostsByLang[langCode];

    for (const post of posts) {
      const groupVariants = groupsMap.get(post.groupId) || {};

      // Build hreflang tags for this post
      const hreflangLines = [];
      const enVariant = groupVariants['en'];
      const xDefaultUrl = enVariant ? `${DOMAIN}${enVariant.path}` : `${DOMAIN}${post.path}`;
      hreflangLines.push(`    <link rel="alternate" hreflang="x-default" href="${xDefaultUrl}" />`);

      for (const code of Object.keys(LANGUAGES)) {
        if (groupVariants[code]) {
          hreflangLines.push(`    <link rel="alternate" hreflang="${code}" href="${DOMAIN}${groupVariants[code].path}" />`);
        }
      }

      // Build language select options for this post
      const langOptions = Object.keys(LANGUAGES)
        .map(code => {
          const cfg = LANGUAGES[code];
          const targetUrl = groupVariants[code] ? groupVariants[code].path : cfg.blogRoot;
          const selected = code === langCode ? ' selected' : '';
          return `                    <option value="${targetUrl}"${selected}>${cfg.name}</option>`;
        })
        .join('\n');

      // Related posts (from the SAME language only)
      const related = posts.filter(p => p.slug !== post.slug).slice(0, 3);
      let relatedHtml = '';
      if (related.length > 0) {
        relatedHtml = `            <div class="blog-related-section">
                <h2 class="blog-related-heading">${l.relatedTitle}</h2>
                <div class="blog-grid">
${related
  .map(
    r => `                    <a href="${r.path}" class="blog-card">
                        <div class="blog-card-top">
                            <span class="blog-card-badge">${escapeHtml(r.category)}</span>
                            <span class="blog-card-date">${r.date}</span>
                        </div>
                        <h3 class="blog-card-title">${escapeHtml(r.title)}</h3>
                        <p class="blog-card-excerpt">${escapeHtml(r.metaDescription)}</p>
                        <div class="blog-card-footer">
                            <span class="blog-card-reading-time">${r.readingTime}</span>
                            <span class="blog-card-link-text">${l.readMoreText} &rarr;</span>
                        </div>
                    </a>`
  )
  .join('\n')}
                </div>
            </div>`;
      }

      // JSON-LD Schemas
      const schemaJsonLd = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": ${JSON.stringify(post.title)},
      "description": ${JSON.stringify(post.metaDescription)},
      "datePublished": "${post.date}",
      "dateModified": "${post.date}",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${DOMAIN}${post.path}"
      },
      "author": {
        "@type": "Organization",
        "name": "ImageResizer",
        "url": "${DOMAIN}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ImageResizer",
        "url": "${DOMAIN}",
        "logo": {
          "@type": "ImageObject",
          "url": "${DOMAIN}/favicon.svg"
        }
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "${DOMAIN}${l.root}"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "${DOMAIN}${l.blogRoot}"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": ${JSON.stringify(post.title)},
          "item": "${DOMAIN}${post.path}"
        }
      ]
    }
    </script>`;

      // Render post page
      const postHtml = postTemplate
        .replace(/\{\{LANG\}\}/g, l.htmlLang)
        .replace(/\{\{PAGE_TITLE\}\}/g, escapeHtml(post.metaTitle))
        .replace(/\{\{META_DESCRIPTION\}\}/g, escapeHtml(post.metaDescription))
        .replace(/\{\{CANONICAL_URL\}\}/g, `${DOMAIN}${post.path}`)
        .replace('{{HREFLANG_TAGS}}', hreflangLines.join('\n'))
        .replace('{{SCHEMA_JSON_LD}}', schemaJsonLd)
        .replace('{{HEADER}}', buildHeader(langCode, langOptions, true))
        .replace(/\{\{BLOG_ROOT\}\}/g, l.blogRoot)
        .replace('{{BACK_TO_BLOG_TEXT}}', l.backToBlog)
        .replace('{{CATEGORY}}', escapeHtml(post.category))
        .replace('{{TITLE}}', escapeHtml(post.title))
        .replace('{{DATE_FORMATTED}}', post.date)
        .replace('{{READING_TIME}}', post.readingTime)
        .replace('{{AUTHOR}}', escapeHtml(post.author))
        .replace('{{CONTENT_HTML}}', post.htmlBody)
        .replace('{{TOOL_CTA_BOX}}', buildToolCta(langCode, post.toolCta))
        .replace('{{RELATED_POSTS_SECTION}}', relatedHtml)
        .replace('{{FOOTER}}', buildFooter(langCode));

      fs.writeFileSync(post.outHtmlPath, postHtml, 'utf8');
      totalPostsGenerated++;
    }
  }

  // 4. Generate Blog Listing / Index pages with PAGINATION
  for (const langCode of Object.keys(LANGUAGES)) {
    const l = LANGUAGES[langCode];
    const posts = allPostsByLang[langCode];
    const totalPosts = posts.length;
    const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));

    // Common blog index hreflangs
    const hreflangLines = [];
    hreflangLines.push(`    <link rel="alternate" hreflang="x-default" href="${DOMAIN}/blog" />`);
    for (const code of Object.keys(LANGUAGES)) {
      hreflangLines.push(`    <link rel="alternate" hreflang="${code}" href="${DOMAIN}${LANGUAGES[code].blogRoot}" />`);
    }

    const langOptions = Object.keys(LANGUAGES)
      .map(code => {
        const cfg = LANGUAGES[code];
        const selected = code === langCode ? ' selected' : '';
        return `                    <option value="${cfg.blogRoot}"${selected}>${cfg.name}</option>`;
      })
      .join('\n');

    for (let page = 1; page <= totalPages; page++) {
      const startIdx = (page - 1) * POSTS_PER_PAGE;
      const endIdx = startIdx + POSTS_PER_PAGE;
      const pagePosts = posts.slice(startIdx, endIdx);

      let gridHtml = '';
      if (pagePosts.length === 0) {
        gridHtml = `                <div style="grid-column: 1 / -1; text-align: center; padding: 64px 20px;">
                    <p style="font-size: 17px; color: var(--text-dark-muted);">${l.noPostsText}</p>
                </div>`;
      } else {
        gridHtml = pagePosts
          .map(
            p => `                <a href="${p.path}" class="blog-card">
                    <div class="blog-card-top">
                        <span class="blog-card-badge">${escapeHtml(p.category)}</span>
                        <span class="blog-card-date">${p.date}</span>
                    </div>
                    <h3 class="blog-card-title">${escapeHtml(p.title)}</h3>
                    <p class="blog-card-excerpt">${escapeHtml(p.metaDescription)}</p>
                    <div class="blog-card-footer">
                        <span class="blog-card-reading-time">${p.readingTime}</span>
                        <span class="blog-card-link-text">${l.readMoreText} &rarr;</span>
                    </div>
                </a>`
          )
          .join('\n');
      }

      // Build Pagination HTML controls
      let paginationHtml = '';
      if (totalPages > 1) {
        const prevDisabled = page === 1;
        const prevHref = page === 2 ? l.blogRoot : `${l.blogRoot}/page/${page - 1}`;
        const nextDisabled = page === totalPages;
        const nextHref = `${l.blogRoot}/page/${page + 1}`;

        const pageBtns = [];
        for (let pNum = 1; pNum <= totalPages; pNum++) {
          const pHref = pNum === 1 ? l.blogRoot : `${l.blogRoot}/page/${pNum}`;
          const pActive = pNum === page ? ' active' : '';
          pageBtns.push(`                <a href="${pHref}" class="blog-page-btn${pActive}">${pNum}</a>`);
        }

        paginationHtml = `            <nav class="blog-pagination" aria-label="Blog pagination">
                <a href="${prevHref}" class="blog-page-btn${prevDisabled ? ' disabled' : ''}"${prevDisabled ? ' tabindex="-1" aria-disabled="true"' : ''}>${l.prevText}</a>
${pageBtns.join('\n')}
                <a href="${nextHref}" class="blog-page-btn${nextDisabled ? ' disabled' : ''}"${nextDisabled ? ' tabindex="-1" aria-disabled="true"' : ''}>${l.nextText}</a>
            </nav>`;
      }

      const canonicalUrl = page === 1 ? `${DOMAIN}${l.blogRoot}` : `${DOMAIN}${l.blogRoot}/page/${page}`;
      const pageTitle = page === 1 ? l.pageTitle : `${l.pageTitle} — ${l.pageText} ${page}`;

      const schemaJsonLd = `    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": ${JSON.stringify(pageTitle)},
      "description": ${JSON.stringify(l.pageDescription)},
      "url": "${canonicalUrl}"
    }
    </script>`;

      const renderedIndexHtml = indexTemplate
        .replace(/\{\{LANG\}\}/g, l.htmlLang)
        .replace(/\{\{PAGE_TITLE\}\}/g, escapeHtml(pageTitle))
        .replace(/\{\{META_DESCRIPTION\}\}/g, escapeHtml(l.pageDescription))
        .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
        .replace('{{HREFLANG_TAGS}}', hreflangLines.join('\n'))
        .replace('{{SCHEMA_JSON_LD}}', schemaJsonLd)
        .replace('{{HEADER}}', buildHeader(langCode, langOptions, true))
        .replace('{{HERO_BADGE}}', l.heroBadge)
        .replace('{{HERO_TITLE}}', l.heroTitle)
        .replace('{{HERO_SUBTITLE}}', l.heroSubtitle)
        .replace('{{POSTS_GRID}}', gridHtml)
        .replace('{{PAGINATION}}', paginationHtml)
        .replace('{{FOOTER}}', buildFooter(langCode));

      if (page === 1) {
        fs.writeFileSync(l.indexHtmlPath, renderedIndexHtml, 'utf8');
      } else {
        const pageDir = path.join(l.htmlOutDir, 'page');
        if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
        const pageFilePath = path.join(pageDir, `${page}.html`);
        fs.writeFileSync(pageFilePath, renderedIndexHtml, 'utf8');
      }
    }
  }

  console.log(`Successfully generated ${totalPostsGenerated} blog posts across 7 languages.`);
  console.log(`Successfully generated 7 blog index pages + paginated routes.`);

  // 5. Trigger automated sitemap update
  generateSitemap();
  console.log('--- Multilingual Blog Build Finished ---');
}

if (require.main === module) {
  buildBlog();
}

module.exports = buildBlog;
