const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');
const SVG_PATH = path.join(IMAGES_DIR, 'icon.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(SVG_PATH);

  // Main icon (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(IMAGES_DIR, 'icon.png'));
  console.log('✓ icon.png (1024x1024)');

  // Favicon (48x48)
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(IMAGES_DIR, 'favicon.png'));
  console.log('✓ favicon.png (48x48)');

  // Splash icon (dedicated SVG with text, transparent background)
  const splashSvgPath = path.join(IMAGES_DIR, 'splash-icon.svg');
  const splashSvgBuffer = fs.readFileSync(splashSvgPath);
  await sharp(splashSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(IMAGES_DIR, 'splash-icon.png'));
  console.log('✓ splash-icon.png (512x512)');

  // Android adaptive icon - foreground (the dial + text, transparent bg)
  // For adaptive icons, the foreground should be 108dp (432px at xxxhdpi)
  // but the safe zone is 66dp, so we use 1024 and let Android crop
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(IMAGES_DIR, 'android-icon-foreground.png'));
  console.log('✓ android-icon-foreground.png (1024x1024)');

  // Android adaptive icon - background (solid dark color)
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#0a172b"/>
  </svg>`;
  await sharp(Buffer.from(bgSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(IMAGES_DIR, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png (1024x1024)');

  // Android monochrome icon (white silhouette on transparent)
  // Simplified version - just the arc shape
  const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <path d="M 222 590 A 300 300 0 0 1 802 590"
          fill="none" stroke="#FFFFFF" stroke-width="44"
          stroke-linecap="round"/>
    <line x1="512" y1="590" x2="680" y2="370"
          stroke="#FFFFFF" stroke-width="8"
          stroke-linecap="round"/>
    <circle cx="512" cy="590" r="14" fill="#FFFFFF"/>
  </svg>`;
  await sharp(Buffer.from(monoSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(IMAGES_DIR, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png (1024x1024)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
