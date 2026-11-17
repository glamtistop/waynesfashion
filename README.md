# Wayne's Fashion — waynesfashion.com
Static website (no server needed). Source: `template.html`, `styles.css`, `app.js`, `seo.js`, `data.json`. `node build.js` generates one real page per section (e.g. `/christmas-trees/`), `sitemap.xml`, `robots.txt` and `404.html`.

## Edit content
1. Go to `waynesfashion.com/admin/` (default password `wayne1978` — change it in **Site Info**).
2. Edit prices, products, sections, tree types/heights, delivery ZIPs, payment QR codes, policies.
3. **Save & Publish → Download data.json**, then replace `data.json` in this repo. The live site updates.

## Getting orders
Create a free form at formspree.io (or similar), paste its URL into **Site Info → Order notification endpoint**. Every order is emailed to you. Customers are also prompted to email their payment confirmation with the full order details.

## Hosting
Works on GitHub Pages / Netlify / Vercel. Point the waynesfashion.com domain at the host.

## SEO
Page titles/descriptions live in `seo.js` (fixed pages) and per-section fields in the admin. After adding or removing a section, run `node build.js` and commit so the new section gets its own indexed page. The site must be served from the domain root (custom domain, Netlify or Vercel).
