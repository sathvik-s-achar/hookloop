const fs = require('fs');
['HookLoop', 'EnvValidator', 'JwtDecoder', 'MockServer', 'RequestForge'].forEach(f => {
  let p = 'dashboard/src/tools/' + f + '.jsx';
  let c = fs.readFileSync(p, 'utf8');

  // Strip all existing MagicBento wrappers we inserted mistakenly
  c = c.replace(/<MagicBento[^>]*>/g, '');
  c = c.replace(/<\/MagicBento>/g, '');

  if(c.includes('return (')) {
     c = c.replace(/return\s*\(\s*/, 'return (\n    <MagicBento enableStars={false} enableSpotlight={true} enableBorderGlow={true} enableTilt={false} enableMagnetism={false} clickEffect={true} spotlightRadius={400} particleCount={12} glowColor="132, 0, 255" disableAnimations={false}>\n');
     
     // add </MagicBento> right before the last );
     let target = c.lastIndexOf(');');
     if (target !== -1) {
         c = c.slice(0, target) + '\n    </MagicBento>\n  ' + c.slice(target);
     }
  }

  // Also replace `<div style={{ background: '#0B0B0C'` stuff if needed, but earlier script already made them `<div className="magic-bento-card--border-glow"`
  // Let's ensure the component ends cleanly.
  fs.writeFileSync(p, c);
});
console.log("Cleanup script done.");
