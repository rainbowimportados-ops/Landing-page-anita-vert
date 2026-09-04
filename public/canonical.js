(() => {
  const canonicalHost = 'instituto-vert.vercel.app';
  const legacyHosts = new Set([
    'landing-page-vert-liart.vercel.app',
    'landing-page-vert-rainbowimportadosgmailcoms-projects.vercel.app',
    'landing-page-vert-git-main-rainbowimportadosgmailcoms-projects.vercel.app',
    'vert.institutovert.app',
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
