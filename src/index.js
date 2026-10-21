const LANG_REDIRECT_ENABLED = true;   // kill switch
const LANG_REDIRECT_HOMEPAGE = true;  // homepage redirect enabled for non-bot visitors with a non-English browser language; bots are never redirected

const SUPPORTED_LANGS = ['en', 'es', 'pt', 'fr', 'de', 'hi', 'id'];
const BOT_REGEX = /bot|crawler|spider|google|googlebot|bing|bingbot|msnbot|adsbot|yandex|duckduckbot|slurp|baiduspider|facebookexternalhit|twitterbot|linkedinbot|embedly|pinterest|slackbot|whatsapp|telegram|preview|lighthouse|pagespeed|gtmetrix|headless|inspectiontool/i;

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1].trim()) : null;
}

function parseAcceptLanguage(header) {
  if (!header) return null;
  const items = header.split(',').map((part, index) => {
    const [tag, ...params] = part.trim().split(';');
    let q = 1.0;
    for (const param of params) {
      const [k, v] = param.trim().split('=');
      if (k === 'q') {
        const parsedQ = parseFloat(v);
        if (!isNaN(parsedQ)) q = parsedQ;
      }
    }
    return { tag: tag.trim(), q, index };
  });

  const validItems = items.filter(item => item.q > 0);
  validItems.sort((a, b) => b.q - a.q || a.index - b.index);

  for (const item of validItems) {
    let primary = item.tag.toLowerCase().split(/[-_]/)[0].trim();
    if (primary === 'in') primary = 'id';
    if (SUPPORTED_LANGS.includes(primary)) {
      return primary;
    }
  }
  return null;
}

function extractHreflangUrl(htmlChunk, targetLang) {
  const linkRegex = /<link\b[^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(htmlChunk)) !== null) {
    const tag = match[0];
    if (/\brel\s*=\s*["']?alternate["']?/i.test(tag)) {
      const langMatch = tag.match(/\bhreflang\s*=\s*["']?([^"'\s>]+)["']?/i);
      const hrefMatch = tag.match(/\bhref\s*=\s*["']?([^"'\s>]+)["']?/i);
      if (langMatch && hrefMatch && langMatch[1].toLowerCase() === targetLang.toLowerCase()) {
        return hrefMatch[1];
      }
    }
  }
  return null;
}

function getPageLanguage(path) {
  for (const root of ['/es', '/pt', '/fr', '/de', '/hi', '/id']) {
    if (path === root || path === root + '/' || path.startsWith(root + '/')) {
      return root.slice(1);
    }
  }
  return 'en';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // IndexNow verification key
    if (url.pathname === '/517f75f0fc8149938fe96751a27b530f.txt') {
      return new Response('517f75f0fc8149938fe96751a27b530f', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    const host = url.hostname.toLowerCase();
    const isProduction = host.includes('freeeimageresizer.com');
    const isNonWww = host === 'freeeimageresizer.com';
    const isHttp = url.protocol === 'http:' && isProduction;
    let pathname = url.pathname;
    let needsRedirect = false;

    // Language roots definitions
    const langRoots = ['/es', '/pt', '/fr', '/de', '/hi', '/id'];
    const langDirectoryRoots = ['/es/', '/pt/', '/fr/', '/de/', '/hi/', '/id/'];

    // 1. Normalize duplicate slashes (e.g. //crop -> /crop, // -> /)
    if (pathname.includes('//')) {
      pathname = pathname.replace(/\/+/g, '/');
      needsRedirect = true;
    }

    // 2. Normalize trailing slashes:
    // Language directory roots (/es, /pt, /fr, /de, /hi, /id) MUST have a trailing slash: /es/
    // All other non-root pages (e.g. /crop/, /about/, /es/crop/, /crop.html/) must NOT have a trailing slash
    if (langRoots.includes(pathname)) {
      pathname = `${pathname}/`;
      needsRedirect = true;
    } else if (pathname.endsWith('/') && pathname !== '/' && !langDirectoryRoots.includes(pathname)) {
      pathname = pathname.replace(/\/+$/, '') || '/';
      needsRedirect = true;
    }

    // 3. Normalize .html and /index.html / /index to clean URLs in ONE single hop
    if (pathname === '/index.html' || pathname === '/index') {
      pathname = '/';
      needsRedirect = true;
    } else if (pathname.endsWith('/index.html')) {
      const parent = pathname.slice(0, -11); // strips '/index.html'
      if (langRoots.includes(parent)) {
        pathname = `${parent}/`;
      } else {
        pathname = parent || '/';
      }
      needsRedirect = true;
    } else if (pathname.endsWith('/index')) {
      const parent = pathname.slice(0, -6); // strips '/index'
      if (langRoots.includes(parent)) {
        pathname = `${parent}/`;
      } else {
        pathname = parent || '/';
      }
      needsRedirect = true;
    } else if (pathname.endsWith('.html')) {
      pathname = pathname.slice(0, -5);
      needsRedirect = true;
    }

    // Re-verify trailing slash status after index/html normalization if needed
    if (langRoots.includes(pathname)) {
      pathname = `${pathname}/`;
      needsRedirect = true;
    } else if (pathname.endsWith('/') && pathname !== '/' && !langDirectoryRoots.includes(pathname)) {
      pathname = pathname.replace(/\/+$/, '') || '/';
      needsRedirect = true;
    }

    // 4. Normalize non-www -> www and http -> https in a single 301 hop
    if (isNonWww || isHttp) {
      needsRedirect = true;
    }

    if (needsRedirect) {
      const canonicalHost = isProduction ? 'www.freeeimageresizer.com' : url.host;
      const protocol = isProduction ? 'https:' : url.protocol;
      const canonicalUrl = `${protocol}//${canonicalHost}${pathname}${url.search}`;
      return Response.redirect(canonicalUrl, 301);
    }

    // For language directory roots (e.g. /es/), serve the underlying asset directly to preserve 200 OK on /es/
    if (langDirectoryRoots.includes(pathname)) {
      const cleanPath = pathname.slice(0, -1); // e.g. /es
      const asset = await env.ASSETS.fetch(new Request(new URL(cleanPath, request.url), request));
      if (asset.status === 200) {
        return asset;
      }
    }

    // Try to serve static asset
    let asset = await env.ASSETS.fetch(request);

    // If clean URL was not resolved by asset binding, try appending .html
    if (asset.status === 404 && !pathname.includes('.')) {
      const htmlUrl = new URL(request.url);
      htmlUrl.pathname = `${pathname}.html`;
      const htmlAsset = await env.ASSETS.fetch(new Request(htmlUrl, request));
      if (htmlAsset.status === 200) {
        asset = htmlAsset;
      }
    }

    if (asset.status !== 404) {
      // Check if this is an HTML page navigation
      const isHtmlAsset = asset.status === 200 &&
        (asset.headers.get('content-type') || '').includes('text/html');
      const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
      const hasNonHtmlExt = lastSegment.includes('.') && !lastSegment.endsWith('.html');

      if (isHtmlAsset && !hasNonHtmlExt) {
        const isSecure = url.protocol === 'https:' || isProduction;
        const secureFlag = isSecure ? '; Secure' : '';
        const cookieHeader = request.headers.get('cookie');
        const prefCookie = getCookieValue(cookieHeader, 'lang_pref');

        // Check for internal navigation
        const secFetchSite = (request.headers.get('sec-fetch-site') || '').toLowerCase();
        const isSameSiteFetch = secFetchSite === 'same-origin' || secFetchSite === 'same-site';
        let isSameHostReferer = false;
        const referer = request.headers.get('referer');
        if (referer) {
          try {
            const refUrl = new URL(referer);
            if (refUrl.host.toLowerCase() === url.host.toLowerCase() ||
                (isProduction && refUrl.hostname.toLowerCase().includes('freeeimageresizer.com'))) {
              isSameHostReferer = true;
            }
          } catch (_) {}
        }
        const isInternalNav = isSameSiteFetch || isSameHostReferer;

        // If internal navigation on GET, refresh or set lang_pref cookie if needed
        if (isInternalNav && request.method === 'GET') {
          const pageLang = getPageLanguage(pathname);
          if (prefCookie !== pageLang) {
            const newHeaders = new Headers(asset.headers);
            newHeaders.append('Set-Cookie', `lang_pref=${pageLang}; Path=/; Max-Age=31536000; SameSite=Lax${secureFlag}`);
            return new Response(asset.body, {
              status: asset.status,
              statusText: asset.statusText,
              headers: newHeaders
            });
          }
          return asset;
        }

        // Automatic language redirect evaluation
        const isEnglishPath = !langRoots.some(root => pathname === root || pathname.startsWith(root + '/'));
        const userAgent = request.headers.get('user-agent');
        const isBot = !userAgent || BOT_REGEX.test(userAgent);
        const allowHomepage = pathname !== '/' || LANG_REDIRECT_HOMEPAGE;

        if (LANG_REDIRECT_ENABLED &&
            request.method === 'GET' &&
            isEnglishPath &&
            allowHomepage &&
            !isBot &&
            !isInternalNav) {

          // Determine target language: check cookie first, then Accept-Language header
          let targetLang = null;
          if (prefCookie && SUPPORTED_LANGS.includes(prefCookie.toLowerCase())) {
            targetLang = prefCookie.toLowerCase();
          } else {
            const acceptLang = request.headers.get('accept-language');
            if (acceptLang) {
              targetLang = parseAcceptLanguage(acceptLang);
            }
          }

          // If target is non-English, check for alternate hreflang URL
          if (targetLang && targetLang !== 'en') {
            const cloned = asset.clone();
            const text = await cloned.text();
            const headEnd = text.indexOf('</head>');
            const headContent = headEnd !== -1 ? text.slice(0, headEnd) : text.slice(0, 20000);
            const targetHref = extractHreflangUrl(headContent, targetLang);

            if (targetHref) {
              let targetPath;
              try {
                const targetParsed = new URL(targetHref);
                targetPath = targetParsed.pathname;
              } catch (_) {
                targetPath = targetHref.startsWith('/') ? targetHref : '/' + targetHref;
              }

              if (targetPath && targetPath !== pathname) {
                const targetLocation = `${url.origin}${targetPath}${url.search}`;
                const setCookie = `lang_pref=${targetLang}; Path=/; Max-Age=31536000; SameSite=Lax${secureFlag}`;

                return new Response(null, {
                  status: 302,
                  headers: {
                    'Location': targetLocation,
                    'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
                    'Vary': 'Accept-Language, Cookie',
                    'Set-Cookie': setCookie
                  }
                });
              }
            }
          }
        }
      }

      return asset;
    }

    // Asset not found - serve custom 404.html with 404 status
    const notFoundRequest = new Request(new URL('/404.html', request.url), request);
    const notFoundResponse = await env.ASSETS.fetch(notFoundRequest);

    if (notFoundResponse.status === 200) {
      return new Response(notFoundResponse.body, {
        status: 404,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    // Fallback if 404.html also missing
    return new Response('Not Found', { status: 404 });
  }
};