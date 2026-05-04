const fs = require('fs');
const files = ['HookLoop.jsx', 'EnvValidator.jsx', 'JwtDecoder.jsx', 'MockServer.jsx', 'RequestForge.jsx'];
files.forEach(f => {
  const p = 'dashboard/src/tools/' + f;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/(className="magic-bento-card magic-bento-card--border-glow"\s*)+/g, 'className="magic-bento-card magic-bento-card--border-glow" ');
  fs.writeFileSync(p, c);
  console.log('Fixed ', f);
});