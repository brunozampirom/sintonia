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

  // Android adaptive icon - background (solid dark color matching icon bg)
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#0a0618"/>
  </svg>`;
  await sharp(Buffer.from(bgSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(IMAGES_DIR, 'android-icon-background.png'));
  console.log('✓ android-icon-background.png (1024x1024)');

  // Android monochrome icon (white silhouette on transparent)
  // Simplified waves + central orb matching icon-concept-1 design
  const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <!-- Wave 1 -->
    <path d="M -60 700 C 90 340, 280 780, 512 480 C 744 180, 930 630, 1084 300"
          fill="none" stroke="#FFFFFF" stroke-width="28" stroke-linecap="round" opacity="0.9"/>
    <!-- Wave 2 -->
    <path d="M -30 495 C 190 670, 340 340, 512 525 C 684 710, 830 370, 1054 530"
          fill="none" stroke="#FFFFFF" stroke-width="22" stroke-linecap="round" opacity="0.75"/>
    <!-- Wave 3 -->
    <path d="M -30 460 C 170 610, 330 310, 512 490 C 694 670, 840 340, 1054 480"
          fill="none" stroke="#FFFFFF" stroke-width="16" stroke-linecap="round" opacity="0.6"/>
    <!-- Central orb -->
    <circle cx="512" cy="485" r="52" fill="#FFFFFF"/>
  </svg>`;
  await sharp(Buffer.from(monoSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(IMAGES_DIR, 'android-icon-monochrome.png'));
  console.log('✓ android-icon-monochrome.png (1024x1024)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
