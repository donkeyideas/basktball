const { chromium } = require('playwright');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 10000 }
  });

  const mockupPath = path.resolve(__dirname, '../../basktball-app-mockup.html');
  await page.goto(`file:///${mockupPath.replace(/\\/g, '/')}`);
  await page.waitForTimeout(2000);

  // Get all phone-wrap elements
  const phoneWraps = await page.$$('.phone-wrap');

  // Best screens for Play Store (by label index)
  const targetScreens = [
    { index: 4, name: '01-home' },        // HOME / DASHBOARD
    { index: 5, name: '02-scores' },       // SCORES + STANDINGS
    { index: 6, name: '03-the-court' },    // THE COURT (SOCIAL FEED)
    { index: 7, name: '04-search' },       // SEARCH
    { index: 8, name: '05-profile' },      // PROFILE
    { index: 9, name: '06-game-detail' },  // GAME DETAIL
    { index: 10, name: '07-player-detail' }, // PLAYER DETAIL
    { index: 12, name: '08-compose' },     // COMPOSE TAKE
  ];

  const outDir = path.join(__dirname);

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

    // Screenshot the phone element
    const rawPath = path.join(outDir, `raw-${screen.name}.png`);
    await phone.screenshot({ path: rawPath });

    // Resize to Play Store dimensions (1080x1920 = 9:16)
    const finalPath = path.join(outDir, `screenshot-${screen.name}.png`);
    await sharp(rawPath)
      .resize(1080, 1920, { fit: 'cover', position: 'center' })
      .png()
      .toFile(finalPath);

    // Clean up raw
    fs.unlinkSync(rawPath);
    console.log(`Captured: screenshot-${screen.name}.png`);
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to store-assets/');
}

captureScreenshots().catch(console.error);
