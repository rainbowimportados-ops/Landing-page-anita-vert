// vCard 3.0: escape values and fold at 75 UTF-8 bytes, without splitting accents.
const escape = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
function fold(line) {
  let result = '', bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) { result += '\r\n '; bytes = 1; }
    result += char; bytes += size;
  }
  return result;
}
export function contactCard(company = {}, units = []) {
  const phone = String(company.phone || '5516999657667').replace(/\D/g, '');
  const instagram = (value, fallback) => {
    try { const url = new URL(value || fallback); return url.protocol === 'https:' ? url.href : fallback; } catch { return fallback; }
  };
  const clinic = instagram(company.instagram, 'https://www.instagram.com/institutovert.br/');
  const anita = instagram(company.anitaInstagram, 'https://www.instagram.com/dra.anitaalmeida/');
  const addresses = units.filter(u => u.active !== false && u.address);
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'N:;Instituto Vert;;;', 'FN:Instituto Vert', 'ORG:Instituto Vert', `TEL;TYPE=CELL,WORK:+${phone}`, 'URL:https://institutovert.app/cartao', `X-SOCIALPROFILE;TYPE=instagram:${clinic}`, `X-SOCIALPROFILE;TYPE=instagram:${anita}`];
  addresses.forEach((unit, i) => lines.push(`item${i + 1}.ADR;TYPE=WORK:;;${escape(unit.address)};;;;`, `item${i + 1}.X-ABLabel:${escape(unit.city || unit.name || 'Unidade')}`));
  lines.push(`NOTE:${escape(['Instagram Instituto Vert: ' + clinic, 'Instagram Dra. Anita: ' + anita, ...addresses.map(u => `${u.city || u.name || 'Unidade'}: ${u.address}`)].join('\n'))}`, 'END:VCARD');
  return lines.map(fold).join('\r\n') + '\r\n';
}
let objectUrl;
export function updateContactCard(company, units) {
  const next = URL.createObjectURL(new Blob([contactCard(company, units)], { type: 'text/vcard;charset=utf-8' }));
  document.querySelectorAll('[data-track="salvar_contato"]').forEach(link => { link.href = next; link.download = 'Instituto-Vert.vcf'; });
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = next;
}
