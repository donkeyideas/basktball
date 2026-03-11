const sharp = require('sharp');
const path = require('path');

async function createFeatureGraphic() {
  const width = 1024;
  const height = 500;
  const logoSize = 200;

  // Resize the b icon
  const logo = await sharp(path.join(__dirname, 'app-icon-512.png'))
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Create SVG text overlay for "BASKTBALL" and tagline
  const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Anton');
        .title {
          fill: white;
          font-size: 80px;
          font-weight: 900;
          font-family: Arial Black, Arial, sans-serif;
          letter-spacing: 4px;
        }
        .tagline {
          fill: rgba(255,255,255,0.7);
          font-size: 24px;
          font-family: Arial, sans-serif;
          letter-spacing: 1px;
        }
      </style>
      <text x="${width/2 + 60}" y="235" text-anchor="middle" class="title">BASKTBALL</text>
      <text x="${width/2 + 60}" y="290" text-anchor="middle" class="tagline">NBA Scores, Stats &amp; Hot Takes</text>
    </svg>
  `;

  // Subtle accent line
  const accentLine = `
    <svg width="${width}" height="${height}">
      <rect x="0" y="496" width="${width}" height="4" fill="#FF6B35" />
      <rect x="0" y="0" width="${width}" height="4" fill="#FF6B35" />
    </svg>
  `;

  // Create dark background
  const background = await sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 13, g: 13, b: 13, alpha: 255 } // #0D0D0D
    }
  })
  .png()
  .toBuffer();

  // Composite everything
  const result = await sharp(background)
    .composite([
      {
        input: Buffer.from(accentLine),
        top: 0,
        left: 0,
      },
      {
        input: logo,
        top: Math.round((height - logoSize) / 2),
        left: 120,
      },
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(path.join(__dirname, 'feature-graphic-1024x500.png'));

  console.log('Feature graphic created: feature-graphic-1024x500.png');
}

createFeatureGraphic().catch(console.error);
