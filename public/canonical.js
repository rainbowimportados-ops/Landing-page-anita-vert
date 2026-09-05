(() => {
  const canonicalHost = 'instituto-vert.vercel.app';
  // vert.institutovert.app saiu daqui de propósito: ele agora serve a
  // landing page e a configuração dela, não deve ser redirecionado.
  const legacyHosts = new Set([
    'landing-page-vert-liart.vercel.app',
    'landing-page-vert-rainbowimportadosgmailcoms-projects.vercel.app',
    'landing-page-vert-git-main-rainbowimportadosgmailcoms-projects.vercel.app',
    'instituto-vert-rainbowimportadosgmailcoms-projects.vercel.app',
    'instituto-vert-git-main-rainbowimportadosgmailcoms-projects.vercel.app',
    'instituto-vert-git-c-f3824f-rainbowimportadosgmailcoms-projects.vercel.app',
  ]);

  if (!legacyHosts.has(window.location.hostname)) return;

  const destination = new URL(window.location.href);
  destination.protocol = 'https:';
  destination.host = canonicalHost;
  window.location.replace(destination.toString());
})();
