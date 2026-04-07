const fs = require('fs');

const bentoJsx = fs.readFileSync('dashboard/src/components/MagicBento.jsx', 'utf8');
const modifiedBentoJsx = bentoJsx.replace('className={`bento-section ${className}`}', 'className={`bento-section ${className}`} style={style}');
fs.writeFileSync('dashboard/src/components/MagicBento.jsx', modifiedBentoJsx);

const files = ['HookLoop', 'EnvValidator', 'JwtDecoder', 'MockServer', 'RequestForge'];

files.forEach(f => {
  const filepath = 'dashboard/src/tools/' + f + '.jsx';
  let code = fs.readFileSync(filepath, 'utf8');
  
  if (!code.includes('import MagicBento')) {
    code = code.replace(/import Antigravity.*?;/, 'import MagicBento, { ParticleCard } from \'../components/MagicBento\';\nimport Antigravity from \'../components/Antigravity\';');
  }

  // Remove Antigravity components specifically from rendering
  code = code.replace(/<Antigravity[^>]*\/>/g, '');

  // Regex string replacement of generic card containers to add the bento card classes
  code = code.replace(/className=\"ms-panel\"/g, 'className="ms-panel magic-bento-card magic-bento-card--border-glow"');
  code = code.replace(/className=\"rf-panel\"/g, 'className="rf-panel magic-bento-card magic-bento-card--border-glow"');

  code = code.replace(/style={{ background: 'transparent',backdropFilter:/g, 'className="magic-bento-card magic-bento-card--border-glow" style={{ background: \'transparent\',backdropFilter:');
  code = code.replace(/style={{ background:\s*'transparent',\s*backdropFilter:/g, 'className="magic-bento-card magic-bento-card--border-glow" style={{ background: \'transparent\',backdropFilter:');
  code = code.replace(/style={{(\s*)background:\s*'(transparent|rgba\(18, 18, 20, 0.65\))',(\s*)backdropFilter:/g, 'className="magic-bento-card magic-bento-card--border-glow" style={{$1background: \'$2\',$3backdropFilter:');

  let lines = code.split('\n');
  let newCode = [];
  let returned = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return (') && !returned && !lines[i].includes('MagicBento')) {
      returned = true;
      newCode.push(lines[i]);
      newCode.push('    <MagicBento enableStars={false} enableSpotlight={true} enableBorderGlow={true} enableTilt={false} enableMagnetism={false} clickEffect={true} spotlightRadius={400} particleCount={12} glowColor="132, 0, 255" disableAnimations={false}>');
      continue;
    }
    newCode.push(lines[i]);
  }

  // Find the last </div> before the final closing to close MagicBento
  let foundLastDiv = false;
  let isClosingBentoAlready = code.includes('</MagicBento>');

  if (!isClosingBentoAlready) {
      for (let i = newCode.length - 1; i >= 0; i--) {
        if (newCode[i].trim() === '</div>' || newCode[i].trim() === '</div>;') {
            newCode.splice(i + 1, 0, '    </MagicBento>');
            foundLastDiv = true;
            break;
        }
      }
      
      // Fallback
      if (!foundLastDiv) {
         for (let i = newCode.length - 1; i >= 0; i--) {
            if (newCode[i].includes('</div>')) {
                newCode.splice(i + 1, 0, '    </MagicBento>');
                foundLastDiv = true;
                break;
            }
         }
      }
  }

  fs.writeFileSync(filepath, newCode.join('\n'));
});

console.log("Done upgrading tools to MagicBento layout!");
