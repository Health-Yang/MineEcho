import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function convertToIco() {
  const png256 = path.join(__dirname, 'icon-256.png');

  console.log('Converting 256x256 PNG to ICO...');
  const icoBuffer = await pngToIco([png256]);

  const icoPath = path.join(__dirname, '..', 'public', 'icon.ico');
  fs.writeFileSync(icoPath, icoBuffer);

  const stat = fs.statSync(icoPath);
  console.log(`ICO created: ${icoPath} (${stat.size} bytes)`);

  // Cleanup temp files
  fs.unlinkSync(png256);
  fs.unlinkSync(path.join(__dirname, 'icon-render.html'));

  console.log('Done!');
}

convertToIco().catch(console.error);