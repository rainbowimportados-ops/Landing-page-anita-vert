document.getElementById('year').textContent = new Date().getFullYear();

document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  if (!link.querySelector('.sr-only')) {
    link.setAttribute('aria-label', `${link.textContent.trim()} — abre em uma nova aba`);
  }
});
