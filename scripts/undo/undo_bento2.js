const fs = require('fs');

const files = ['HookLoop.jsx', 'EnvValidator.jsx', 'JwtDecoder.jsx', 'MockServer.jsx', 'RequestForge.jsx'];

files.forEach(f => {
  const p = 'dashboard/src/tools/' + f;
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  
  // Replace opening MagicBento
  c = c.replace(/<MagicBento\s+[^>]*>/, '');
  // Replace closing MagicBento
  c = c.replace(/<\/MagicBento>/, '');
  
  // You might also need to restore any fragments like `<>` if they were substituted
  fs.writeFileSync(p, c);
  console.log('Undone magicbento in ', f);
});