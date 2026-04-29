// GA4 + custom event helpers for vinaypasricha.com
(function () {
  var GA_ID = 'G-8DGRXBSFM6';

  // Load gtag.js
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { send_page_view: true });

  // Helper for custom events
  window.trackEvent = function (name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
  };

  // Auto-track outbound Amazon CTA clicks and Read Online CTAs
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var text = (a.textContent || '').trim().toLowerCase();

    if (/amazon\.|amzn\./i.test(href)) {
      window.trackEvent('amazon_click', {
        link_url: href,
        link_text: text.slice(0, 80),
        page_path: location.pathname
      });
    } else if (/read[-\s]?the[-\s]?book[-\s]?online/i.test(text) ||
               /book-read\.html|siv-method-read\.html|execution-doctrine-read\.html/.test(href)) {
      window.trackEvent('cta_read_online_click', {
        link_url: href,
        page_path: location.pathname
      });
    }
  }, { passive: true });

  // Auto-fire book_reader_opened on the three reader pages
  var p = location.pathname;
  if (/book-read\.html$/.test(p)) {
    window.trackEvent('book_reader_opened', { book: 'ai_for_business_leaders' });
  } else if (/siv-method-read\.html$/.test(p)) {
    window.trackEvent('book_reader_opened', { book: 'siv_method' });
  } else if (/execution-doctrine-read\.html$/.test(p)) {
    window.trackEvent('book_reader_opened', { book: 'execution_doctrine' });
  }
})();
