import { NextResponse } from 'next/server'

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  const script = `
(function() {
  var appUrl = ${JSON.stringify(appUrl)};
  var container = document.currentScript && document.currentScript.parentNode;
  if (!container) return;

  var mode = document.currentScript.getAttribute('data-mode') || '';
  var dark = document.documentElement.classList.contains('dark') ? '1' : '0';
  var src = appUrl + '/embed';
  if (mode === 'update') src += '?mode=update';
  var sep = src.indexOf('?') === -1 ? '?' : '&';
  if (dark === '1') src += sep + 'dark=1';

  var iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.style.width = '100%';
  iframe.style.maxWidth = '480px';
  iframe.style.height = '520px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.display = 'block';
  iframe.style.margin = '0 auto';
  container.appendChild(iframe);
})();
`.trim()

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
