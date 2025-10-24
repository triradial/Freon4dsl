export function dedent(strings: TemplateStringsArray, ...values: any[]) {
  let str = strings.reduce((acc, s, i) => acc + (i > 0 ? values[i - 1] : "") + s, "");
  const match = str.match(/^[ \t]*(?=\S)/gm);
  if (!match) return str;
  const indent = Math.min(...match.map(el => el.length));
  const re = new RegExp(`^[ \t]{${indent}}`, 'gm');
  return indent > 0 ? str.replace(re, '') : str;
} 