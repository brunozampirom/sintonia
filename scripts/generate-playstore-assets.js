const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');

const sourceIcon = path.join(IMAGES_DIR, 'icon.png');
const playIconOut = path.join(IMAGES_DIR, 'playstore-icon-512.png');
const featureOut = path.join(IMAGES_DIR, 'playstore-feature-graphic-1024x500.png');

function featureSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#122B57"/>
      <stop offset="100%" stop-color="#08162F"/>
    </radialGradient>
    <linearGradient id="signal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E84393"/>
      <stop offset="25%" stop-color="#FF6B6B"/>
      <stop offset="50%" stop-color="#F5A623"/>
      <stop offset="75%" stop-color="#F8E71C"/>
      <stop offset="100%" stop-color="#55EFC4"/>
    </linearGradient>
    <linearGradient id="bands" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#E84393"/>
      <stop offset="18%" stop-color="#FF6B6B"/>
      <stop offset="36%" stop-color="#F5A623"/>
      <stop offset="54%" stop-color="#F8E71C"/>
      <stop offset="72%" stop-color="#55EFC4"/>
      <stop offset="86%" stop-color="#74B9FF"/>
      <stop offset="100%" stop-color="#A29BFE"/>
    </linearGradient>
    <filter id="waveGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="headShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#050B17" flood-opacity="0.5"/>
    </filter>
    <path id="headProfile" d="M 120 420
      C 120 356 132 308 158 276
      C 172 258 188 244 198 228
      C 208 213 210 199 204 186
      C 197 171 180 161 174 145
      C 168 130 170 113 178 98
      C 194 66 228 44 266 44
      C 309 44 343 69 358 108
      C 372 146 366 192 338 220
      C 319 239 307 254 307 273
      C 307 293 322 307 340 320
      C 364 338 378 362 378 392
      L 378 420 Z"/>
    <clipPath id="headClip">
      <use href="#headProfile"/>
    </clipPath>
  </defs>

  <rect width="1024" height="500" fill="url(#bg)"/>

  <!-- Left head -->
  <g transform="translate(-8,18)" filter="url(#headShadow)">
    <use href="#headProfile" fill="#0A1630"/>
    <use href="#headProfile" fill="none" stroke="#0A1630" stroke-width="16"/>
  </g>

  <!-- Right head -->
  <g transform="translate(1032,18) scale(-1,1)" filter="url(#headShadow)">
    <use href="#headProfile" fill="#0A1630"/>
    <use href="#headProfile" fill="none" stroke="#0A1630" stroke-width="16"/>
  </g>

  <!-- Sine wave connecting heads -->
  <path d="M 260 185
           C 328 145, 396 225, 464 185
           C 532 145, 600 225, 668 185
           C 710 162, 742 165, 772 185"
        fill="none" stroke="#0A1630" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
  <g filter="url(#waveGlow)">
    <path d="M 260 185
             C 328 145, 396 225, 464 185
             C 532 145, 600 225, 668 185
             C 710 162, 742 165, 772 185"
          fill="none" stroke="url(#signal)" stroke-width="10" stroke-linecap="round"/>
  </g>
  <path d="M 260 185
           C 328 145, 396 225, 464 185
           C 532 145, 600 225, 668 185
           C 710 162, 742 165, 772 185"
        fill="none" stroke="url(#signal)" stroke-width="6" stroke-linecap="round"/>

  <g opacity="0.85">
    <circle cx="464" cy="185" r="4" fill="#F7F1E3"/>
    <circle cx="532" cy="185" r="4" fill="#F7F1E3"/>
    <circle cx="600" cy="185" r="4" fill="#F7F1E3"/>
  </g>

  <rect x="0" y="0" width="1024" height="500" fill="none" stroke="#1A2744" stroke-width="2" opacity="0.25"/>
</svg>
`;
}

async function main() {
  if (!fs.existsSync(sourceIcon)) {
    throw new Error(`Missing source icon: ${sourceIcon}`);
  }

  await sharp(sourceIcon)
    .resize(512, 512, { fit: 'cover' })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(playIconOut);

  await sharp(Buffer.from(featureSvg()))
    .resize(1024, 500, { fit: 'cover' })
    .png({ compressionLevel: 9, quality: 100 })
    .toFile(featureOut);

  const iconSize = fs.statSync(playIconOut).size;
  const featureSize = fs.statSync(featureOut).size;

  console.log(`Generated: ${playIconOut} (${iconSize} bytes)`);
  console.log(`Generated: ${featureOut} (${featureSize} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
