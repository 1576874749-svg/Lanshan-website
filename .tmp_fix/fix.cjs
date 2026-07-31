const fs = require('fs');
let s = fs.readFileSync('app.js', 'utf8');
const nb = fs.readFileSync('.tmp_fix/newblock.txt', 'utf8');

const start = s.indexOf('const particleLogo = {');
const e1 = s.indexOf('ctx.globalAlpha=1;', start);
const e2 = s.indexOf('};', e1);
const end = e2 + 2;

if (start === -1 || e1 === -1 || e2 === -1) {
  console.error('MARKERS NOT FOUND start=' + start + ' e1=' + e1 + ' e2=' + e2);
  process.exit(2);
}

let out = s.slice(0, start) + nb + s.slice(end);
// 统一规范为 LF，避免 CRLF 再次引发替换/匹配问题
out = out.replace(/\r\n/g, '\n');
fs.writeFileSync('app.js', out);

const galaxyGone = !out.includes('#4cdfff') && !out.includes('globalCompositeOperation') && !out.includes('burstStarted');
const brandPresent = out.includes('#5262a0') && out.includes('#a4baff') && out.includes('#9bd8c6');
const alignsLogo = out.includes('LOGO_MOUNTAIN_PATH');
console.log('OK newlen=' + out.length);
console.log('galaxyGone=' + galaxyGone);
console.log('brandPresent=' + brandPresent);
console.log('alignsLogo=' + alignsLogo);
if (!(galaxyGone && brandPresent && alignsLogo)) process.exit(3);
