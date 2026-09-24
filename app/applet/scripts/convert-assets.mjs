import sharp from 'sharp';
import { readdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const SRC_DIR = 'generated-face-assets';
const DEST_DIR = 'android/app/src/main/res/drawable-nodpi';

async function convert() {
  const files = await readdir(SRC_DIR);
  for (const file of files) {
    if (file.endsWith('.svg')) {
      let outputFilename = '';
      if (file === 'nexuss-face-icon.svg') {
        outputFilename = 'nexuss_face_icon.png';
      } else {
        // Map frame-x-... to nexuss_splash_frame_x.png
        const match = file.match(/frame-(\d+)-/);
        if (match) {
          outputFilename = `nexuss_splash_frame_${match[1]}.png`;
        }
      }

      if (outputFilename) {
        console.log(`Converting ${file} to ${outputFilename}...`);
        await sharp(join(SRC_DIR, file))
          .png()
          .toFile(join(DEST_DIR, outputFilename));
      }
    }
  }
  console.log('Conversion complete!');
}

convert().catch(console.error);
