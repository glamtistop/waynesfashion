# Wayne's Fashion — waynesfashion.com
Static website (no server needed): `index.html`, `styles.css`, `app.js`, `data.json`.

## Edit content
1. Go to `yoursite.com/#/admin` (default password `wayne1978` — change it in **Site Info**).
2. Edit prices, products, sections, tree types/heights, delivery ZIPs, payment QR codes, policies.
3. **Save & Publish → Download data.json**, then replace `data.json` in this repo. The live site updates.

## Getting orders
Create a free form at formspree.io (or similar), paste its URL into **Site Info → Order notification endpoint**. Every order is emailed to you. Customers are also prompted to email their payment confirmation with the full order details.

## Hosting
Works on GitHub Pages / Netlify / Vercel. Point the waynesfashion.com domain at the host.
