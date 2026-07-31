const fs = require('fs');
const s = fs.readFileSync('app.js', 'utf8');
const nb = fs.readFileSync('.tmp_fix/newblock.txt', 'utf8');

const start = s.indexOf('const particleLogo = {');
const endMarker = 'ctx.globalAlpha=1;\n  }\n};';
const endIdx = s.indexOf(endMarker, start);

if (start === -1 || endIdx === -1) {
  console.error('MARKERS NOT FOUND start=' + start + ' end=' + endIdx);
  process.exit(2);
}

const out = s.slice(0, start) + nb + s.slice(endIdx + endMarker.length);
fs.writeFileSync('app.js', out);

// 校验
const galaxyGone = !out.includes('#4cdfff') && !out.includes('globalCompositeOperation') && !out.includes('burstStarted');
const brandPresent = out.includes('#5262a0') && out.includes('#a4baff') && out.includes('#9bd8c6');
const alignsLogo = out.includes('LOGO_MOUNTAIN_PATH');
console.log('OK newlen=' + out.length);
console.log('galaxyGone=' + galaxyGone);
console.log('brandPresent=' + brandPresent);
console.log('alignsLogo=' + alignsLogo);
if (!(galaxyGone && brandPresent && alignsLogo)) process.exit(3);
