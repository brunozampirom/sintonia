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
    <radialGradient id="bg" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#1a1040"/>
      <stop offset="100%" stop-color="#0a0618"/>
    </radialGradient>
    <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF006E"/>
      <stop offset="30%" stop-color="#FF4D6D"/>
      <stop offset="60%" stop-color="#FF8500"/>
      <stop offset="100%" stop-color="#FFBE0B"/>
    </linearGradient>
    <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFBE0B"/>
      <stop offset="40%" stop-color="#8AC926"/>
      <stop offset="100%" stop-color="#06D6A0"/>
    </linearGradient>
    <linearGradient id="wave3" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06D6A0"/>
      <stop offset="40%" stop-color="#118AB2"/>
      <stop offset="100%" stop-color="#7B2FF7"/>
    </linearGradient>
    <linearGradient id="wave4" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7B2FF7"/>
      <stop offset="50%" stop-color="#C77DFF"/>
      <stop offset="100%" stop-color="#FF006E"/>
    </linearGradient>
    <radialGradient id="orb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="25%" stop-color="#FFBE0B" stop-opacity="0.6"/>
      <stop offset="55%" stop-color="#FF006E" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#FF006E" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF006E" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#FF006E" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7B2FF7" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#7B2FF7" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="bigGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="15"/>
    </filter>
  </defs>

  <rect width="1024" height="500" fill="url(#bg)"/>

  <!-- Ambient glows -->
  <circle cx="200" cy="170" r="150" fill="url(#glow1)"/>
  <circle cx="800" cy="150" r="140" fill="url(#glow2)"/>

  <!-- Background wave blurs -->
  <g filter="url(#bigGlow)" opacity="0.4">
    <path d="M -80 340 C 80 156, 280 390, 512 234 C 744 78, 940 317, 1104 146"
          fill="none" stroke="url(#wave1)" stroke-width="45" stroke-linecap="round"/>
  </g>
  <g filter="url(#bigGlow)" opacity="0.35">
    <path d="M -50 244 C 200 342, 350 146, 512 259 C 674 371, 820 170, 1074 268"
          fill="none" stroke="url(#wave2)" stroke-width="38" stroke-linecap="round"/>
  </g>

  <!-- Crisp foreground waves -->
  <g filter="url(#softGlow)">
    <path d="M -60 340 C 90 166, 280 380, 512 234 C 744 88, 930 307, 1084 146"
          fill="none" stroke="url(#wave1)" stroke-width="14" stroke-linecap="round" opacity="0.9"/>
  </g>
  <g filter="url(#softGlow)">
    <path d="M -30 241 C 190 327, 340 166, 512 256 C 684 346, 830 180, 1054 259"
          fill="none" stroke="url(#wave2)" stroke-width="11" stroke-linecap="round" opacity="0.85"/>
  </g>
  <g filter="url(#softGlow)">
    <path d="M -30 224 C 170 298, 330 151, 512 239 C 694 327, 840 166, 1054 234"
          fill="none" stroke="url(#wave3)" stroke-width="8" stroke-linecap="round" opacity="0.8"/>
  </g>
  <g filter="url(#softGlow)">
    <path d="M -30 259 C 180 170, 350 312, 512 220 C 674 127, 840 283, 1054 210"
          fill="none" stroke="url(#wave4)" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
  </g>

  <!-- Central orb -->
  <circle cx="512" cy="237" r="78" fill="url(#orb)"/>
  <circle cx="512" cy="237" r="25" fill="white" opacity="0.95"/>
  <circle cx="512" cy="237" r="14" fill="white" opacity="0.4"/>

  <!-- Particle dots -->
  <g opacity="0.5">
    <circle cx="180" cy="137" r="2" fill="#FF006E"/>
    <circle cx="320" cy="98" r="1.5" fill="#FFBE0B"/>
    <circle cx="700" cy="107" r="1.8" fill="#7B2FF7"/>
    <circle cx="830" cy="185" r="1.5" fill="#06D6A0"/>
    <circle cx="400" cy="73" r="1.2" fill="#C77DFF"/>
    <circle cx="620" cy="405" r="1.5" fill="#FF4D6D"/>
    <circle cx="870" cy="317" r="1.2" fill="#FFBE0B"/>
  </g>

  <!-- Subtle rings -->
  <circle cx="512" cy="237" r="49" fill="none" stroke="white" stroke-width="0.6" opacity="0.12"/>
  <circle cx="512" cy="237" r="83" fill="none" stroke="white" stroke-width="0.4" opacity="0.06"/>
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
