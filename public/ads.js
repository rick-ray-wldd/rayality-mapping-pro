import config from './ads-config.js';
// This module is loaded only by the guide, never by the editor or output.
// A reviewed, certified CMP adapter must supply this callback before enabling ads.
// No permissive fallback and no home-made "accept" button.
const consent = window.rayalityAdConsent;
const slot = document.getElementById('guide-ad');
if (config.enabled && /^ca-pub-\d{16}$/.test(config.publisherId) && /^\d+$/.test(config.slotId)
    && slot && typeof consent === 'function' && await consent() === true) {
  slot.hidden = false;
  slot.textContent = 'Advertisement';
  const ad = document.createElement('ins');
  ad.className = 'adsbygoogle';
  ad.style.display = 'block';
  ad.dataset.adClient = config.publisherId;
  ad.dataset.adSlot = config.slotId;
  ad.dataset.adFormat = 'auto';
  ad.dataset.fullWidthResponsive = 'true';
  slot.append(ad);
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.publisherId}`;
  script.onload = () => (window.adsbygoogle = window.adsbygoogle || []).push({});
  document.head.append(script);
}
