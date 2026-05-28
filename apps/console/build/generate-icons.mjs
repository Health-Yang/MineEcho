import { screenshot } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SVG content for MineEcho logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1677ff"/>
      <stop offset="100%" style="stop-color:#69b1ff"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="48" fill="url(#g)"/>
  <text x="128" y="172" font-size="160" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">M</text>
</svg>`;

async function generateIcons() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const buildDir = path.join(__dirname);
  const svgPath = path.join(buildDir, 'icon-temp.svg');

  // Write temporary SVG
  fs.writeFileSync(svgPath, svgContent);

  const pngFiles = [];

  for (const size of sizes) {
    const pngPath = path.join(buildDir, `icon-${size}.png`);
    console.log(`Generating ${size}x${size} icon...`);

    await screenshot({
      url: `file://${svgPath}`,
      fullPage: false,
      viewport: { width: size * 2, height: size * 2 },
    }, pngPath);

    pngFiles.push(pngPath);
  }

  // Cleanup temp SVG
  fs.unlinkSync(svgPath);

  // Now convert to ICO using png-to-ico
  const pngToIco = (await import('png-to-ico')).default;
  const icoBuffer = await pngToIco(pngFiles);

  const icoPath = path.join(buildDir, '..', 'public', 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`ICO created: ${icoPath}`);

  // Also create 256x256 PNG for good measure
  const src256 = path.join(buildDir, 'icon-256.png');
  const dest256 = path.join(buildDir, '..', 'public', 'icon.png');
  fs.copyFileSync(src256, dest256);
  console.log(`PNG created: ${dest256}`);

  // Cleanup temp PNGs
  for (const png of pngFiles) {
    fs.unlinkSync(png);
  }

  console.log('Done!');
}

generateIcons().catch(console.error);
