#!/usr/bin/env node
/* Generates one real HTML page per section (for Google), plus sitemap.xml, robots.txt and 404.html.
   Run `node build.js` after changing sections in data.json. */
const fs = require('fs'), path = require('path');
const { pages, jsonLd, DOMAIN } = require('./seo.js');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const all = pages(D), today = new Date().toISOString().slice(0, 10);
const nav = all.filter(p => !p.noindex).map(p => `<a href="${p.path}">${esc(p.h1)}</a>`).join('');
const render = p => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => ({
  title: esc(p.title), desc: esc(p.desc), h1: esc(p.h1), robots: p.noindex ? 'noindex,nofollow' : 'index,follow', url: DOMAIN + p.path, nav,
  jsonld: JSON.stringify(jsonLd(D)).replace(/</g, '\\u003c'), address: esc(D.site.address), phone: esc(D.site.phone), tel: D.site.phone.replace(/[^\d+]/g, '')
}[k]));
for (const p of all) {
  const dir = path.join(__dirname, p.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), render(p));
}
fs.writeFileSync(path.join(__dirname, '404.html'), render({ path: '/', title: "Wayne's Fashion", desc: '', h1: "Wayne's Fashion", noindex: true }));
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.filter(p => !p.noindex).map(p => `  <url><loc>${DOMAIN}${p.path}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(__dirname, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /cart/\nDisallow: /checkout/\nDisallow: /order/\n\nSitemap: ${DOMAIN}/sitemap.xml\n`);
console.log('Built', all.length, 'pages');
