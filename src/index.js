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
        return htmlAsset;
      }
    }

    if (asset.status !== 404) {
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