const fs = require('fs');
const tools = ['src/tools/MockServer.jsx', 'src/tools/RequestForge.jsx', 'src/tools/EnvValidator.jsx', 'src/tools/JwtDecoder.jsx'];

tools.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Basic string replacement for known opaque dark colors to make them semi-transparent
  const replacements = [
    { from: "backgroundColor: '#121214'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#121214'", to: "background: 'rgba(20, 20, 22, 0.5)'" },
    
    { from: "backgroundColor: '#0F0F11'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#0F0F11'", to: "background: 'rgba(20, 20, 22, 0.5)'" },

    { from: "backgroundColor: '#1C1C1E'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#1C1C1E'", to: "background: 'rgba(20, 20, 22, 0.5)'" },

    { from: "backgroundColor: '#1A1D20'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#1A1D20'", to: "background: 'rgba(20, 20, 22, 0.5)'" },

    { from: "backgroundColor: '#202022'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#202022'", to: "background: 'rgba(20, 20, 22, 0.5)'" },

    { from: "backgroundColor: '#18181A'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#18181A'", to: "background: 'rgba(20, 20, 22, 0.5)'" },

    { from: "backgroundColor: '#2D2D35'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#2D2D35'", to: "background: 'rgba(20, 20, 22, 0.5)'" },
    
    { from: "backgroundColor: '#111827'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#111827'", to: "background: 'rgba(20, 20, 22, 0.5)'" },

    { from: "backgroundColor: '#1F2937'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#1F2937'", to: "background: 'rgba(20, 20, 22, 0.5)'" },

    { from: "backgroundColor: '#374151'", to: "backgroundColor: 'rgba(20, 20, 22, 0.5)'" },
    { from: "background: '#374151'", to: "background: 'rgba(20, 20, 22, 0.5)'" },
    
    // specifically also target main content wrapper
    { from: "backgroundColor: '#0B0B0C', padding: '60px 40px'", to: "backgroundColor: 'rgba(11, 11, 12, 0.85)', padding: '60px 40px'" },
    { from: "backgroundColor: '#0B0B0C', minHeight", to: "backgroundColor: 'rgba(11, 11, 12, 0.85)', minHeight" }
  ];

  let initialContent = content;
  for (let r of replacements) {
    content = content.replaceAll(r.from, r.to);
  }
  
  if (content !== initialContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
