const fs = require('fs');

const tools = ['src/tools/MockServer.jsx', 'src/tools/RequestForge.jsx', 'src/tools/EnvValidator.jsx', 'src/tools/JwtDecoder.jsx'];

tools.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace background colors in components inside the relative wrapper
  // Specifically, find hard-coded dark colors and replace them with semi-transparent ones.
  // We'll replace 
  // backgroundColor: '#0B0B0C' -> stays same if it's the outermost wrapper, but that one is usually at the top.
  // backgroundColor: '#121214', backgroundColor: '#1C1C1E', backgroundColor: '#1A1D20', backgroundColor: '#0F0F11', backgroundColor: '#202022'
  
  // Actually, let's just aggressively replace hex colors #1*, #0F*, etc., in inline styles.
  const regex = /backgroundColor:\s*'#(1[A-Fa-f0-9]{5}|2[0-5][A-Fa-f0-9]{4}|0[A-E][A-Fa-f0-9]{4}|[0-9A-Fa-f]{6})'/g;

  content = content.replace(regex, (match, hex) => {
    // Preserve the outer `#0B0B0C` which is exactly where Antigravity sits.
    if (hex.toUpperCase() === '0B0B0C' && content.indexOf(match) === content.indexOf("backgroundColor: '#0B0B0C'")) {
       return match;
    }
    return "backgroundColor: 'rgba(20, 20, 22, 0.8)'";
  });
  
  // also specifically targeting the main relative zindex 1 div
  // In `MockServer`, we saw: `<div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '60px 40px', backgroundColor: 'rgba(20, 20, 22, 0.8)' }}>`
  // Wait, if it was replaced by Regex, it became `rgba(20, 20, 22, 0.8)`. We actually want the main content wrapper to be `rgba(11, 11, 12, 0.85)` like HookLoop.
  content = content.replace(
      /backgroundColor:\s*'rgba\(20, 20, 22, 0\.8\)'(\s*})>(?=\s*<div)/, 
      "backgroundColor: 'rgba(11, 11, 12, 0.85)'$1>"
  );

  fs.writeFileSync(file, content);
});

console.log('Fixed backgrounds');
