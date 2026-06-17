const fs = require('fs');
const path = 'e:/Apex-Multiplier/app/dashboard/page.tsx';
const s = fs.readFileSync(path, 'utf8');
const counts = {
  openBrace: (s.match(/{/g) || []).length,
  closeBrace: (s.match(/}/g) || []).length,
  openParen: (s.match(/\(/g) || []).length,
  closeParen: (s.match(/\)/g) || []).length,
  openBracket: (s.match(/\[/g) || []).length,
  closeBracket: (s.match(/\]/g) || []).length,
  jsxOpen: (s.match(/<[^\/!][^>]*>/g) || []).length,
  jsxClose: (s.match(/<\/[^>]+>/g) || []).length,
};
console.log(JSON.stringify(counts, null, 2));
