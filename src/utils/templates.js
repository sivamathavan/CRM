// ── TEMPLATE DATA ──
export const openers = {
  'Hospital/Clinic': 'Patients search online before booking. Make sure your clinic is the first they find.',
  'Restaurant/Food': 'Customers check menus online before stepping in. Your digital presence is your first table.',
  'Coaching Centre': 'Students and parents research online before enrolling. Stand out before they even call.',
  'IT/Software': 'In a competitive tech space, your digital brand is your biggest differentiator.',
  'Logistics': 'Clients vet logistics partners online. Make sure your operation looks credible and professional.',
  'Hardware': 'Customers search hardware suppliers online before walking in. Your website is your storefront.',
  'Automobile': 'Buyers research online for weeks before visiting. Capture them at the research stage.',
  'Manufacturing': 'B2B buyers research deeply before partnering. Your online presence closes deals before you pitch.',
  'Finance/Insurance': 'Trust is everything — online credibility builds it before a single meeting.',
  'Pharmacy': 'Patients look up pharmacies online. A strong presence means more footfall.',
  'Printing': 'Businesses search print vendors online. A professional presence wins before you even quote.',
  'default': 'Your customers are online right now looking for what you offer. Make sure they find you first.',
};

export const svcs = {
  'Web Dev': {
    icon: '🌐',
    title: 'Website Development',
    pitch: 'a professional website that attracts customers 24/7 — fast, mobile-first, built to convert.',
    checks: [
      '✅ Custom design matching your brand identity',
      '✅ Mobile-first & lightning-fast performance',
      '✅ SEO-optimized to rank in your city on Google',
      '✅ Lead capture forms & WhatsApp integration'
    ],
    waEN: [
      '🌐 Custom professional website tailored to your brand',
      '⚡ Mobile-first & blazing fast — Google-ready performance',
      '🔍 Local SEO to rank your business at the top in your city',
      '📲 WhatsApp & lead capture integration built-in'
    ],
    waTN: [
      '🌐 Ungal brand-ku match aagra professional website',
      '⚡ Mobile-first, super fast — Google-ready',
      '🔍 Ungal city-la Google-la rank aagum',
      '📲 WhatsApp & lead form integration'
    ]
  },
  'App Dev': {
    icon: '📱',
    title: 'Mobile App Development',
    pitch: 'a custom mobile app so your customers can reach you anytime, from anywhere.',
    checks: [
      '✅ Android & iOS cross-platform build',
      '✅ Push notifications & customer loyalty program',
      '✅ Works offline for low-connectivity areas',
      '✅ Full app store launch, branding & support'
    ],
    waEN: [
      '📱 Custom Android & iOS app — your brand, your app',
      '🔔 Push notifications to keep customers coming back',
      '📶 Works offline — perfect for all conditions',
      '🏪 Full app store setup, launch & ongoing support'
    ],
    waTN: [
      '📱 Ungal brand-ku custom Android & iOS app',
      '🔔 Push notifications — customers engaged vaippom',
      '📶 Offline-la kuda work aagum',
      '🏪 App store launch & full support'
    ]
  },
  'AI Automation': {
    icon: '🤖',
    title: 'AI Automation',
    pitch: 'intelligent automation that saves your team 20–30 hours every single week.',
    checks: [
      '✅ AI chatbot for 24/7 customer support & queries',
      '✅ Automated lead generation & follow-up sequences',
      '✅ Invoice, email & document workflow automation',
      '✅ Custom AI dashboards & real-time reporting'
    ],
    waEN: [
      '🤖 AI chatbot — handles customer queries 24/7 automatically',
      '📊 Automated lead generation & smart follow-up sequences',
      '📄 Invoice, email & document automation — zero manual work',
      '📈 Custom dashboards with real-time business insights'
    ],
    waTN: [
      '🤖 24/7 customer queries-ku AI chatbot — automatic-a handle aagum',
      '📊 Automated lead & follow-up — manual work illa',
      '📄 Invoice & email automation',
      '📈 Real-time business dashboards'
    ]
  },
  'Digital Marketing': {
    icon: '📣',
    title: 'Digital Marketing & SEO',
    pitch: 'a full digital marketing system driving real qualified leads every month.',
    checks: [
      '✅ Google Ads & Meta (Facebook/Instagram) campaigns',
      '✅ Local SEO — rank #1 in your city on Google',
      '✅ Social media content creation & management',
      '✅ Monthly analytics & ROI performance reports'
    ],
    waEN: [
      '📣 Google Ads & Meta campaigns — real leads, real ROI',
      '🔍 Local SEO — rank your business #1 in your city',
      '📱 Social media content creation & full management',
      '📊 Monthly analytics reports showing exact ROI'
    ],
    waTN: [
      '📣 Google & Meta Ads — real leads varum',
      '🔍 Ungal city-la Google-la #1 rank',
      '📱 Social media content & management',
      '📊 Monthly ROI reports'
    ]
  },
  'All Digital Services': {
    icon: '✨',
    title: 'Complete Digital Transformation',
    pitch: 'website, mobile app, AI automation & marketing — all working together for your growth.',
    checks: [
      '✅ Website + Mobile App complete combo package',
      '✅ AI-powered workflow automation for your team',
      '✅ Full SEO & paid advertising setup & management',
      '✅ Ongoing maintenance, support & business growth'
    ],
    waEN: [
      '🌐 Website + 📱 App — complete digital presence covered',
      '🤖 AI automation — your team saves 20+ hours every week',
      '📣 Full SEO & paid campaigns for maximum visibility',
      '🛡️ Ongoing support, maintenance & growth strategy'
    ],
    waTN: [
      '🌐 Website + 📱 App — complete package',
      '🤖 AI automation — team time malichukovom',
      '📣 Full SEO & ads — maximum reach',
      '🛡️ Ongoing support & growth'
    ]
  },
};

export function getSvc(service = '', industry = '') {
  const s = service || '';
  const ind = (industry || '').toLowerCase();
  
  if (s.includes('Web')) return svcs['Web Dev'];
  if (s.includes('App')) return svcs['App Dev'];
  if (s.includes('AI')) return svcs['AI Automation'];
  if (s.includes('Digital Marketing')) return svcs['Digital Marketing'];
  if (s.includes('All') || s.includes('Complete')) return svcs['All Digital Services'];
  
  // Guess from industry
  if (ind.includes('dental') || ind.includes('clinic') || ind.includes('hospital') || ind.includes('doctor')) {
    return svcs['All Digital Services'];
  }
  if (ind.includes('restaurant') || ind.includes('food') || ind.includes('cafe')) {
    return svcs['Digital Marketing'];
  }
  if (ind.includes('coaching') || ind.includes('education') || ind.includes('school')) {
    return svcs['Web Dev'];
  }
  return svcs['All Digital Services'];
}

export function getOpener(industry) {
  if (!industry || industry === '—') return openers['default'];
  const il = industry.toLowerCase();
  
  if (il.includes('dental') || il.includes('dentist')) {
    return 'Patients search for dentists online before calling. Make sure your clinic is the first they find.';
  }
  if (il.includes('hospital') || il.includes('clinic') || il.includes('doctor')) return openers['Hospital/Clinic'];
  if (il.includes('restaurant') || il.includes('food') || il.includes('cafe') || il.includes('hotel')) return openers['Restaurant/Food'];
  if (il.includes('coaching') || il.includes('education') || il.includes('school') || il.includes('college')) return openers['Coaching Centre'];
  if (il.includes('pharma')) return openers['Pharmacy'];
  if (il.includes('auto') || il.includes('car')) return openers['Automobile'];
  if (il.includes('finance') || il.includes('insurance')) return openers['Finance/Insurance'];
  if (il.includes('print')) return openers['Printing'];
  if (il.includes('logistic')) return openers['Logistics'];
  
  for (const [key, val] of Object.entries(openers)) {
    if (il.includes(key.toLowerCase())) return val;
  }
  return openers['default'];
}

export function fn(contactName) {
  return (contactName || '').split(' ')[0];
}

export function getSubject(lead) {
  const s = getSvc(lead.service, lead.industry);
  const n = fn(lead.contact);
  const m = {
    'Website Development': `${n}, let's build ${lead.business} a website that works 24/7`,
    'Mobile App Development': `${n}, a custom app for ${lead.business} — here's what's possible`,
    'AI Automation': `${n}, save 20+ hours/week at ${lead.business} with AI`,
    'Digital Marketing & SEO': `${n}, more customers for ${lead.business} — our proven system`,
    'Complete Digital Transformation': `${n}, complete digital transformation for ${lead.business}`
  };
  return m[s.title] || `${n}, here's how Rturox Technology can help ${lead.business} grow`;
}

export function buildWAEN(lead) {
  const s = getSvc(lead.service, lead.industry);
  const name = fn(lead.contact);
  const u = lead.interest >= 80 
    ? '⏰ Our project slots this month are filling up fast — would love to connect this week!' 
    : '📞 Would love a quick 15-minute call at your convenience. Absolutely no pressure!';
  
  return `Hi ${name} Sir/Madam 🙏

I'm *Mathavan* from *Rturox Technology* — a digital growth agency serving businesses across Tamil Nadu. 🚀

━━━━━━━━━━━━━━━
🏢 *${lead.business}*
📍 ${lead.industry} · ${lead.city}
━━━━━━━━━━━━━━━

I came across your business and genuinely believe we can help you grow with *${s.title}*.

${getOpener(lead.industry)}

Here's exactly what we'll deliver:
${s.waEN.join('\n')}

💰 *Best pricing for Tamil Nadu businesses — guaranteed*
⚡ *Fast delivery with full local support*
🤝 *20+ successful projects delivered across Tamil Nadu*

🔗 *See our work first:*
🌐 https://rturox.com/
👨‍💻 https://maddy-portfolio-azure.vercel.app/
🚀 https://rturox.vercel.app/

${u}

Reply *"YES"* and I'll send a free custom proposal within 24 hours! 😊

— *Mathavan | Rturox Technology*
📞 +91 63811 69124
📧 rturoxtech@gmail.com`;
}

export function buildWATN(lead) {
  const s = getSvc(lead.service, lead.industry);
  const name = fn(lead.contact);
  const u = lead.interest >= 80 
    ? '⏰ Engal project slots fast-a fill aaguthu — இந்த week connect panlama?' 
    : '📞 5 nimisham pesalama? Ungaluku convenient-aana neram sollunga — no pressure at all 😊';
  
  return `Vanakkam ${name} Sir/Madam! 🙏

Naan *Mathavan*, *Rturox Technology*-la irundhu — Tamil Nadu businesses-ku digital growth pannra agency. 🚀

━━━━━━━━━━━━━━━
🏢 *${lead.business}*
📍 ${lead.industry} · ${lead.city}
━━━━━━━━━━━━━━━

Ungal business pathi therinja personally contact pannaren.
${getOpener(lead.industry)}

Neengal *${s.title}* thedreenga — adhudhaan engal strongest area! 💪

Naanga ungaluku pannuvom:
${s.waTN.join('\n')}

💰 *Tamil Nadu businesses-ku best affordable price — guaranteed*
⚡ *Vega delivery · Full local support*
🤝 *20+ successful projects across Tamil Nadu*

🔗 *Engal work mudhalla parunga:*
🌐 https://rturox.com/
👨‍💻 https://maddy-portfolio-azure.vercel.app/
🚀 https://rturox.vercel.app/

${u}

*"YES"* nu oru reply pannunga — 24 hours-la free custom proposal anupurom! 😊

— *Mathavan | Rturox Technology*
📞 +91 63811 69124`;
}

export function buildSMS(lead) {
  const s = getSvc(lead.service, lead.industry);
  const opener = getOpener(lead.industry);
  
  return `Hi ${fn(lead.contact)} Sir/Madam, I'm Mathavan from Rturox Technology (rturox.com).

${opener}

We specialize in ${s.title} for ${lead.industry} businesses in ${lead.city}.

${s.checks.slice(0, 3).join('\n')}

20+ happy clients across Tamil Nadu. Affordable pricing guaranteed.

Portfolio: https://maddy-portfolio-azure.vercel.app/
Rturox-Tech: https://rturox.vercel.app/

Reply YES for a free proposal!
WhatsApp/Call: +91 63811 69124`;
}

export function buildHTML(lead) {
  const s = getSvc(lead.service, lead.industry);
  const name = fn(lead.contact);
  const opener = getOpener(lead.industry);
  const urgency = lead.interest >= 80 
    ? "I'd love to connect this week — our project slots are filling up fast. Let's make it happen!" 
    : "I'd love a quick 15-minute call at your convenience. No pressure — just a friendly conversation!";
  
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:20px;background:#f0f0f0;font-family:'DM Sans',Arial,sans-serif}@media(max-width:600px){.ep{width:100%!important}.epb{padding:22px 16px!important}.eph{padding:28px 16px!important}.btns a{display:block!important;margin:6px auto!important;text-align:center!important;max-width:200px}}</style></head>
<body><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:10px 0">
<table class="ep" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">
<tr><td class="eph" style="background:linear-gradient(135deg,#1a1f36 0%,#2d3561 100%);padding:36px 44px;text-align:center">
  <div style="color:#fff;font-size:28px;font-weight:800;letter-spacing:-.02em;margin-bottom:6px;font-family:Arial,sans-serif">Rturox Technology</div>
  <div style="color:rgba(255,255,255,.55);font-size:11px;letter-spacing:.12em;text-transform:uppercase">End-to-End Digital Solutions · Coimbatore</div>
</td></tr>
<tr><td class="epb" style="padding:36px 44px">
  <p style="font-size:20px;font-weight:700;color:#1a1f36;margin:0 0 16px;font-family:Arial,sans-serif">Hi <strong>${name}</strong> 👋,</p>
  <p style="font-size:14px;line-height:1.85;color:#555;margin:0 0 12px">${opener}</p>
  <p style="font-size:14px;line-height:1.85;color:#444;margin:0 0 12px">I'm <strong>Mathavan</strong>, Founder &amp; CEO of <strong>Rturox Technology</strong>. We help businesses like <strong>${lead.business}</strong> grow faster with smart digital solutions.</p>
  <p style="font-size:14px;line-height:1.85;color:#444;margin:0 0 24px">I reached out personally because I see a strong opportunity — specifically around <strong>${s.title}</strong> for <strong>${lead.business}</strong>.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border-left:4px solid #4a6cf7;border-radius:0 10px 10px 0;margin-bottom:26px"><tr><td style="padding:20px 22px">
    <div style="font-size:15px;font-weight:700;color:#4a6cf7;margin-bottom:14px;font-family:Arial,sans-serif">${s.icon} What we'll build for ${lead.business}:</div>
    ${s.checks.map(c => `<div style="font-size:13px;color:#333;padding:5px 0;line-height:1.7">${c}</div>`).join('')}
  </td></tr></table>
  <p style="font-size:13px;font-weight:700;color:#1a1f36;text-transform:uppercase;letter-spacing:.07em;margin:0 0 12px;font-family:Arial,sans-serif">Our Complete Service Range:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;margin-bottom:26px">
    <tr style="background:#f8f9ff"><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1f36;border-bottom:1px solid #eee;width:46%">📱 Mobile App Development</td><td style="padding:10px 14px;font-size:13px;color:#555;border-bottom:1px solid #eee">Android, iOS &amp; cross-platform</td></tr>
    <tr><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1f36;border-bottom:1px solid #eee">🌐 Web Application Development</td><td style="padding:10px 14px;font-size:13px;color:#555;border-bottom:1px solid #eee">Scalable, fast &amp; modern</td></tr>
    <tr style="background:#f8f9ff"><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1f36;border-bottom:1px solid #eee">🎨 UI/UX Design</td><td style="padding:10px 14px;font-size:13px;color:#555;border-bottom:1px solid #eee">Beautiful, intuitive experiences</td></tr>
    <tr><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1f36;border-bottom:1px solid #eee">📣 Digital Marketing &amp; SEO</td><td style="padding:10px 14px;font-size:13px;color:#555;border-bottom:1px solid #eee">More visibility, leads &amp; growth</td></tr>
    <tr style="background:#f8f9ff"><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1f36;border-bottom:1px solid #eee">🤖 AI Automation</td><td style="padding:10px 14px;font-size:13px;color:#555;border-bottom:1px solid #eee">Save 20+ hours every week</td></tr>
    <tr><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1f36;border-bottom:1px solid #eee">☁️ Cloud &amp; Hosting (AWS)</td><td style="padding:10px 14px;font-size:13px;color:#555;border-bottom:1px solid #eee">Secure &amp; reliable</td></tr>
    <tr style="background:#f8f9ff"><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1f36;border-bottom:1px solid #eee">🔐 Maintenance &amp; Security</td><td style="padding:10px 14px;font-size:13px;color:#555;border-bottom:1px solid #eee">Safe &amp; always updated</td></tr>
    <tr><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a1f36">✨ Brand Identity &amp; Motion</td><td style="padding:10px 14px;font-size:13px;color:#555">Logo, branding &amp; storytelling</td></tr>
  </table>
  <p style="font-size:14px;line-height:1.85;color:#444;margin:0 0 12px">We've delivered <strong>20+ successful projects</strong> for happy clients across Tamil Nadu — we'd love to make <strong>${lead.business}</strong> our next success story! 🌟</p>
  <p style="font-size:14px;line-height:1.85;color:#444;margin:0 0 26px">${urgency}</p>
  <div class="btns" style="text-align:center;margin-bottom:24px">
    <a href="https://maddy-portfolio-azure.vercel.app/" style="display:inline-block;background:#1a1f36;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;margin:4px;font-family:Arial,sans-serif">🔗 View Portfolio</a>
    <a href="https://rturox.com/" style="display:inline-block;background:#4a6cf7;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;margin:4px;font-family:Arial,sans-serif">🌐 Rturox.com</a>
    <a href="https://rturox.vercel.app/" style="display:inline-block;background:#00b894;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;margin:4px;font-family:Arial,sans-serif">🚀 Rturox-Tech</a>
  </div>
  <p style="font-size:13px;color:#888;text-align:center;margin:0 0 8px">Feel free to reply or reach out anytime — always happy to connect! 🤝</p>
  <p style="font-size:14px;color:#444;text-align:center;margin:0 0 24px">Looking forward to hearing from you,</p>
  <table cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;width:100%"><tr><td style="padding-top:22px">
    <div style="font-size:20px;font-weight:800;color:#1a1f36;margin-bottom:3px;font-family:Arial,sans-serif">Mathavan</div>
    <div style="font-size:13px;color:#777;margin-bottom:14px">Founder &amp; CEO — Rturox Technology</div>
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:28px;vertical-align:top">
        <div style="margin-bottom:5px"><a href="tel:+916381169124" style="font-size:13px;color:#4a6cf7;text-decoration:none">📱 +91 63811 69124</a></div>
        <div style="margin-bottom:5px"><a href="https://rturox.com" style="font-size:13px;color:#4a6cf7;text-decoration:none">🌐 rturox.com</a></div>
        <div><a href="mailto:rturoxtech@gmail.com" style="font-size:13px;color:#4a6cf7;text-decoration:none">📧 rturoxtech@gmail.com</a></div>
      </td>
      <td style="vertical-align:top">
        <div style="margin-bottom:5px"><a href="https://rturox.vercel.app" style="font-size:13px;color:#00b894;text-decoration:none">🚀 rturox-tech</a></div>
        <div><a href="https://maddy-portfolio-azure.vercel.app/" style="font-size:13px;color:#4a6cf7;text-decoration:none">🔗 My Portfolio</a></div>
      </td>
    </tr></table>
  </td></tr></table>
</td></tr>
<tr><td style="background:#f8f8f8;padding:14px 44px;text-align:center;border-top:1px solid #eee">
  <p style="font-size:11px;color:#bbb;margin:0">© 2025 Rturox Technology · Coimbatore, Tamil Nadu 🇮🇳</p>
</td></tr></table></td></tr></table></body></html>`;
}

// Fixed 26 industry categories matching details
export const INDUSTRIES = [
  { label: 'Real Estate', icon: '🏠' },
  { label: 'Jewelry Shops', icon: '💍' },
  { label: 'Clinics & Hospitals', icon: '🏥' },
  { label: 'Resorts & Hotels', icon: '🏨' },
  { label: 'Textile & Boutiques', icon: '👗' },
  { label: 'Educational Institutions', icon: '🎓' },
  { label: 'Restaurants & Cafes', icon: '🍽️' },
  { label: 'Construction & Interior', icon: '🏗️' },
  { label: 'Travel & Tourism', icon: '✈️' },
  { label: 'Furniture Stores', icon: '🛋️' },
  { label: 'Electronics & Mobile', icon: '📱' },
  { label: 'Supermarkets & Grocery', icon: '🛒' },
  { label: 'Manufacturing & Exporters', icon: '🏭' },
  { label: 'Logistics & Transport', icon: '🚚' },
  { label: 'Finance & Financial Services', icon: '💰' },
  { label: 'Event Management', icon: '🎉' },
  { label: 'Gyms & Fitness', icon: '💪' },
  { label: 'Salons & Beauty', icon: '💄' },
  { label: 'Wedding Industry', icon: '💒' },
  { label: 'Automobile & Detailing', icon: '🚗' },
  { label: 'Hardware & Builders', icon: '🔧' },
  { label: 'Franchise Businesses', icon: '🏪' },
  { label: 'Legal & Professional Services', icon: '⚖️' },
  { label: 'Agriculture & Agri-Tech', icon: '🌾' },
  { label: 'Religious & Spiritual Tourism', icon: '🙏' },
  { label: 'Coaching & Personal Brands', icon: '🧑‍🏫' },
];

export function matchIndustry(raw = '') {
  if (!raw || raw === '—') return null;
  const r = raw.toLowerCase();
  
  if (r.includes('real estate') || r.includes('property') || (r.includes('builder') && r.includes('real'))) return 'Real Estate';
  if (r.includes('jewel') || r.includes('gold') || r.includes('silver')) return 'Jewelry Shops';
  if (r.includes('dental') || r.includes('dentist') || r.includes('clinic') || r.includes('hospital') || r.includes('doctor') || r.includes('health') || r.includes('medical')) return 'Clinics & Hospitals';
  if (r.includes('resort') || r.includes('hotel') || r.includes('lodge') || r.includes('stay')) return 'Resorts & Hotels';
  if (r.includes('textile') || r.includes('boutique') || r.includes('saree') || r.includes('cloth') || r.includes('fashion') || r.includes('garment')) return 'Textile & Boutiques';
  if (r.includes('school') || r.includes('college') || r.includes('education') || r.includes('institution') || (r.includes('academy') && !r.includes('coaching'))) return 'Educational Institutions';
  if (r.includes('restaurant') || r.includes('cafe') || r.includes('food') || r.includes('bakery') || r.includes('dhaba') || r.includes('biryani') || r.includes('mess')) return 'Restaurants & Cafes';
  if (r.includes('construction') || r.includes('interior') || r.includes('civil') || r.includes('architect')) return 'Construction & Interior';
  if (r.includes('travel') || r.includes('tourism') || r.includes('tour operator') || r.includes('holiday')) return 'Travel & Tourism';
  if (r.includes('furniture') || r.includes('sofa') || r.includes('modular')) return 'Furniture Stores';
  if (r.includes('electronic') || r.includes('mobile shop') || r.includes('gadget') || r.includes('laptop')) return 'Electronics & Mobile';
  if (r.includes('supermarket') || r.includes('grocery') || r.includes('kirana') || r.includes('mart') || r.includes('provision')) return 'Supermarkets & Grocery';
  if (r.includes('manufactur') || r.includes('export') || r.includes('factory') || r.includes('industry')) return 'Manufacturing & Exporters';
  if (r.includes('logistic') || r.includes('transport') || r.includes('courier') || r.includes('cargo') || r.includes('freight')) return 'Logistics & Transport';
  if (r.includes('finance') || r.includes('insurance') || r.includes('loan') || r.includes('bank') || r.includes('investment') || r.includes('nbfc')) return 'Finance & Financial Services';
  if (r.includes('event') || r.includes('catering') || r.includes('decorator')) return 'Event Management';
  if (r.includes('gym') || r.includes('fitness') || r.includes('yoga') || r.includes('zumba') || r.includes('crossfit')) return 'Gyms & Fitness';
  if (r.includes('salon') || r.includes('beauty') || r.includes('spa') || r.includes('parlour') || r.includes('parlor')) return 'Salons & Beauty';
  if (r.includes('wedding') || r.includes('marriage') || r.includes('bridal')) return 'Wedding Industry';
  if (r.includes('automobile') || r.includes('car') || r.includes('bike') || r.includes('detailing') || r.includes('motor')) return 'Automobile & Detailing';
  if (r.includes('hardware') || r.includes('builder material') || r.includes('cement') || r.includes('plumbing') || r.includes('paint')) return 'Hardware & Builders';
  if (r.includes('franchise')) return 'Franchise Businesses';
  if (r.includes('legal') || r.includes('law') || r.includes('advocate') || r.includes('ca ') || r.includes('chartered') || r.includes('consultant')) return 'Legal & Professional Services';
  if (r.includes('agri') || r.includes('farm') || r.includes('agriculture') || r.includes('crop')) return 'Agriculture & Agri-Tech';
  if (r.includes('temple') || r.includes('church') || r.includes('mosque') || r.includes('spiritual') || r.includes('religious') || r.includes('pilgrim')) return 'Religious & Spiritual Tourism';
  if (r.includes('coaching') || r.includes('tutor') || r.includes('mentor') || r.includes('personal brand') || r.includes('trainer')) return 'Coaching & Personal Brands';
  
  return null;
}
