const fs = require('fs');
const path = require('path');
const toolsDir = path.join('dashboard', 'src', 'tools');
const files = ['EnvValidator.jsx', 'JwtDecoder.jsx', 'MockServer.jsx', 'RequestForge.jsx'];

files.forEach(file => {
  const filePath = path.join(toolsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/background:\s*'#121214'/g, "background: 'rgba(18, 18, 20, 0.65)', backdropFilter: 'blur(10px)'");
  content = content.replace(/background:\s*'#0F0F11'/g, "background: 'rgba(18, 18, 20, 0.65)', backdropFilter: 'blur(10px)'");

  if (file === 'MockServer.jsx') {
    content = content.replace(/background:\s*rgba\(15,\s*15,\s*18,\s*0\.9\)/g, "background: rgba(18, 18, 20, 0.65); backdrop-filter: blur(10px)");
  }

  fs.writeFileSync(filePath, content);
});
console.log('Done mapping card background transparency overlay!');