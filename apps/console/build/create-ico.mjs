import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a simple ICO file with embedded PNG
// ICO format: ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG data

const sizes = [16, 32, 48, 256]; // Standard Windows icon sizes

async function createIco() {
  const pngDir = __dirname;
  const pngFiles = sizes.map(s => path.join(pngDir, `icon-${s}.png`));

  // Check which files exist
  const existingFiles = pngFiles.filter(f => fs.existsSync(f));

  if (existingFiles.length === 0) {
    console.error('No PNG files found!');
    return;
  }

  // Read PNG files
  const pngData = [];
  for (const file of existingFiles) {
    const size = parseInt(path.basename(file).match(/icon-(\d+)/)[1]);
    const data = fs.readFileSync(file);
    pngData.push({ size, data });
  }

  // Create ICO header
  const numImages = pngData.length;
  const headerSize = 6 + (numImages * 16);
  let offset = headerSize;

  // Calculate total size
  let totalSize = headerSize;
  for (const { data } of pngData) {
    totalSize += data.length;
  }

  const buffer = Buffer.alloc(totalSize);

  // ICONDIR (6 bytes)
  buffer.writeUInt16LE(0, 0);      // Reserved, must be 0
  buffer.writeUInt16LE(1, 2);      // Image type: 1 = icon
  buffer.writeUInt16LE(numImages, 4); // Number of images

  // ICONDIRENTRY for each image (16 bytes each)
  let entryOffset = 6;
  for (const { size, data } of pngData) {
    buffer.writeUInt8(size === 256 ? 0 : size, entryOffset);     // Width (0 means 256)
    buffer.writeUInt8(size === 256 ? 0 : size, entryOffset + 1); // Height
    buffer.writeUInt8(0, entryOffset + 2);    // Color palette (0 for PNG)
    buffer.writeUInt8(0, entryOffset + 3);    // Reserved
    buffer.writeUInt16LE(1, entryOffset + 4);  // Color planes
    buffer.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    buffer.writeUInt32LE(data.length, entryOffset + 8); // Image data size
    buffer.writeUInt32LE(offset, entryOffset + 12); // Offset to image data

    offset += data.length;
    entryOffset += 16;
  }

  // Copy PNG data
  let dataOffset = headerSize;
  for (const { data } of pngData) {
    data.copy(buffer, dataOffset);
    dataOffset += data.length;
  }

  // Write ICO file
  const icoPath = path.join(__dirname, '..', 'public', 'icon.ico');
  fs.writeFileSync(icoPath, buffer);

  const stat = fs.statSync(icoPath);
  console.log(`ICO created: ${icoPath} (${stat.size} bytes, ${numImages} images)`);

  // Cleanup PNG files
  for (const file of existingFiles) {
    fs.unlinkSync(file);
  }
  const renderHtml = path.join(__dirname, 'icon-render.html');
  if (fs.existsSync(renderHtml)) {
    fs.unlinkSync(renderHtml);
  }

  console.log('Done!');
}

createIco();