
export const COUNTRIES = [
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Nigeria', code: '+234' },
  { name: 'Canada', code: '+1' },
  { name: 'Australia', code: '+61' },
  { name: 'Germany', code: '+49' },
  { name: 'France', code: '+33' },
  { name: 'India', code: '+91' },
  { name: 'China', code: '+86' },
  { name: 'Japan', code: '+81' },
];


// Build one option per code, merging names into the label.
export const COUNTRY_OPTIONS = (() => {
  const byCode = new Map<string, string[]>();
  for (const c of COUNTRIES) {
    const code = String(c.code).trim();
    const name = (c.name ?? '').trim();
    if (!byCode.has(code)) byCode.set(code, []);
    const arr = byCode.get(code)!;
    if (name && !arr.includes(name)) arr.push(name);
  }
  return Array.from(byCode.entries()).map(([code, names]) => ({
    code,
    label: `${names.join(' / ')} (${code})`,
  }));
})();
