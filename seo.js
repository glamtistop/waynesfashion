/* Page titles + descriptions. Used by the live site (browser) and by build.js (static pages + sitemap). */
(function (root) {
  const DOMAIN = 'https://waynesfashion.com';
  function pages(D) {
    const s = D.site, city = 'Altadena, CA';
    const list = [
      { path: '/', h1: s.name + ' — ' + s.slogan,
        title: "Wayne's Fashion | Altadena Clothing Store & Custom Screen Printing",
        desc: "Wayne's Fashion in Altadena, CA — custom screen printing, sportswear, men's & women's clothing, music and phone accessories since 1978. Order online for pickup, local delivery or California shipping." },
      { path: '/shop/', h1: 'Shop All Departments',
        title: "Shop Clothing, Sportswear & Accessories in Altadena | Wayne's Fashion",
        desc: "Shop every department at Wayne's Fashion: custom printed shirts and hoodies, hats, beanies, casual clothing, speakers, USB drives, chargers and more. Pickup, delivery or ship in California." }
    ];
    if (D.trees.enabled) list.push({ path: '/christmas-trees/', h1: 'Christmas Tree Lot',
      title: "Christmas Trees in Altadena & Pasadena | Delivery & Pickup | Wayne's Fashion",
      desc: "Order a fresh Christmas tree online from Wayne's Fashion tree lot at 2308 N Lincoln Ave, Altadena. " + D.trees.types.map(t => t.name).join(', ') + ". Pickup, AM/PM local delivery or California shipping. Stands available." });
    D.categories.forEach(c => list.push({ path: '/' + c.id + '/', h1: c.title,
      title: c.seoTitle || `${c.title} in ${city} | Wayne's Fashion`,
      desc: c.seoDescription || `${c.title} at Wayne's Fashion in ${city}. ${c.subtitle ? c.subtitle + '. ' : ''}${c.description || ''} Pickup, local delivery or California shipping.`.replace(/\s+/g, ' ').trim() }));
    list.push(
      { path: '/request-an-item/', h1: 'Request an Item or Quote',
        title: "Request an Item or Custom Quote | Wayne's Fashion Altadena",
        desc: "Looking for a specific item, size, team or custom print? Send Wayne's Fashion a request and get a quote — custom shirts, hoodies, hats, bulk orders and special orders in Altadena, CA." },
      { path: '/contact/', h1: 'Contact Us',
        title: "Contact Wayne's Fashion | 2308 N Lincoln Ave, Altadena | " + s.phone,
        desc: `Visit or call Wayne's Fashion at ${s.address}. Phone ${s.phone}. Directions, store info and message form.` },
      { path: '/privacy-policy/', h1: 'Privacy Policy', title: "Privacy Policy | Wayne's Fashion", desc: "How Wayne's Fashion collects, uses and protects your information when you order online." },
      { path: '/refund-policy/', h1: 'Refund Policy', title: "Refund & Return Policy | Wayne's Fashion", desc: "Returns, exchanges and refunds for clothing, custom printed items and Christmas trees at Wayne's Fashion." },
      { path: '/cart/', h1: 'Your Cart', title: "Your Cart | Wayne's Fashion", desc: '', noindex: true },
      { path: '/checkout/', h1: 'Checkout', title: "Checkout | Wayne's Fashion", desc: '', noindex: true },
      { path: '/order/', h1: 'Order Received', title: "Order Received | Wayne's Fashion", desc: '', noindex: true },
      { path: '/admin/', h1: 'Admin', title: "Admin | Wayne's Fashion", desc: '', noindex: true }
    );
    list.forEach(p => { if (p.desc.length > 300) p.desc = p.desc.slice(0, 297) + '…'; });
    return list;
  }
  function jsonLd(D) {
    const s = D.site, m = /^(.*?),\s*(.*?),\s*([A-Z]{2})\s*(\d{5})/.exec(s.address) || [];
    return {
      '@context': 'https://schema.org', '@type': 'ClothingStore', name: s.name, slogan: s.slogan, url: DOMAIN + '/',
      telephone: '+1-' + s.phone, email: s.email, foundingDate: '1978', priceRange: '$$',
      address: { '@type': 'PostalAddress', streetAddress: m[1] || s.address, addressLocality: m[2] || 'Altadena', addressRegion: m[3] || 'CA', postalCode: m[4] || '91001', addressCountry: 'US' },
      areaServed: ['Altadena', 'Pasadena', 'Los Angeles', 'California'],
      paymentAccepted: D.payments.map(p => p.name).join(', '),
      makesOffer: D.categories.filter(c => c.showInNav).map(c => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: c.title } }))
    };
  }
  const api = { DOMAIN, pages, jsonLd };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WF_SEO = api;
})(typeof window !== 'undefined' ? window : globalThis);
