const fs = require('fs');
const files = ['HookLoop.jsx', 'EnvValidator.jsx', 'JwtDecoder.jsx', 'MockServer.jsx', 'RequestForge.jsx'];
files.forEach(f => {
  const p = 'dashboard/src/tools/' + f;
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/className="magic-bento-card magic-bento-card--border-glow" /g, '');
  c = c.replace(/ className="magic-bento-card magic-bento-card--border-glow"/g, '');
  c = c.replace(/ magic-bento-card magic-bento-card--border-glow/g, '');
  fs.writeFileSync(p, c);
  console.log('Cleaned classes in', f);
});