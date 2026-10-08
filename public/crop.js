/*
  Compatibility wrapper for crop.html.
  crop.html expects crop.js. Existing implementation lives in app.js.
*/

// If app.js already executed, we won't run again.
// The crop tool implementation is IIFE and will run immediately.
// This wrapper is intentionally empty.

// To keep behavior consistent without duplicating code, load app.js dynamically
// only when crop page is used.
(function () {
    const existing = document.querySelector('script[data-crop-wrapper="1"]');
    if (existing) return;
    const s = document.createElement('script');
    s.src = '/app.js';
    s.setAttribute('data-crop-wrapper', '1');
    document.head.appendChild(s);
})();

