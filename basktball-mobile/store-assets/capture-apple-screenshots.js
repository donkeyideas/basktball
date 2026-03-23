const { chromium } = require('playwright');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

async function captureAppleScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 10000 }
  });

  const mockupPath = path.resolve(__dirname, '../../basktball-app-mockup.html');
  await page.goto(`file:///${mockupPath.replace(/\\/g, '/')}`);
  await page.waitForTimeout(2000);

  const phoneWraps = await page.$$('.phone-wrap');

  // Same screens as Play Store, mapped to HTML indices
  const targetScreens = [
    { index: 4, name: '01-home' },
    { index: 5, name: '02-scores' },
    { index: 6, name: '03-the-court' },
    { index: 7, name: '04-search' },
    { index: 8, name: '05-profile' },
    { index: 9, name: '06-game-detail' },
    { index: 10, name: '07-player-detail' },
    { index: 12, name: '08-compose' },
  ];

  const outDir = path.join(__dirname, 'apple');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const screen of targetScreens) {
    if (screen.index >= phoneWraps.length) {
      console.log(`Skipping ${screen.name} - index ${screen.index} out of range (${phoneWraps.length} total)`);
      continue;
    }

    const wrap = phoneWraps[screen.index];
    const phone = await wrap.$('.phone');
    if (!phone) {
      console.log(`No .phone element found in wrap ${screen.index}`);
      continue;
    }

    const rawPath = path.join(outDir, `raw-${screen.name}.png`);
    await phone.screenshot({ path: rawPath });

    // iPhone 6.5" display: 1284x2778 px
    const finalPath = path.join(outDir, `screenshot-${screen.name}.png`);
    await sharp(rawPath)
      .resize(1284, 2778, { fit: 'cover', position: 'center' })
      .png()
      .toFile(finalPath);

    fs.unlinkSync(rawPath);
    console.log(`Captured: apple/screenshot-${screen.name}.png (1284x2778)`);
  }

  await browser.close();
  console.log('\nDone! Apple screenshots saved to store-assets/apple/');
}

captureAppleScreenshots().catch(console.error);
