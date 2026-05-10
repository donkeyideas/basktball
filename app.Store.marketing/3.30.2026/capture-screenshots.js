const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SLIDES = [
  { id: 'slide-1', name: '01-home' },
  { id: 'slide-2', name: '02-scores' },
  { id: 'slide-3', name: '03-court' },
  { id: 'slide-4', name: '04-player' },
  { id: 'slide-5', name: '05-news' },
  { id: 'slide-6-features', name: '06-features' },
  { id: 'slide-6', name: '07-profile' },
];

// Apple required sizes
const SIZES = {
  iphone: { width: 1284, height: 2778, folder: 'iphone-6.7' },
  ipad: { width: 2048, height: 2732, folder: 'ipad-12.9' },
};

// The HTML slides are designed at 1320x2868
const SLIDE_WIDTH = 1320;
const SLIDE_HEIGHT = 2868;

async function main() {
  const htmlPath = path.resolve(__dirname, 'screenshots-apple.html');
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

  // Create output directories
  for (const size of Object.values(SIZES)) {
    const dir = path.join(__dirname, size.folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await chromium.launch();

  // --- iPhone screenshots ---
  console.log('\n--- iPhone 6.7" (1284x2778) ---');
  const iphonePage = await browser.newPage({
    viewport: { width: SLIDE_WIDTH, height: SLIDE_HEIGHT },
    deviceScaleFactor: 1,
  });
  await iphonePage.goto(fileUrl, { waitUntil: 'networkidle' });
  await iphonePage.waitForTimeout(1000); // let fonts load

  for (const slide of SLIDES) {
    const el = await iphonePage.$(`#${slide.id}`);
    if (!el) { console.log(`  SKIP: #${slide.id} not found`); continue; }

    // Capture at native size
    const rawPng = await el.screenshot({ type: 'png' });

    // Resize to exact Apple dimensions
    const outPath = path.join(__dirname, SIZES.iphone.folder, `${slide.name}.png`);
    await sharp(rawPng)
      .resize(SIZES.iphone.width, SIZES.iphone.height, { fit: 'cover' })
      .png()
      .toFile(outPath);

    console.log(`  OK: ${slide.name}.png (${SIZES.iphone.width}x${SIZES.iphone.height})`);
  }

  // --- iPad screenshots ---
  console.log('\n--- iPad 12.9" (2048x2732) ---');

  // For iPad, we need to scale the slide content to fill the wider aspect ratio.
  // iPad is wider relative to height (0.749) vs iPhone (0.462).
  // Strategy: scale the slide to fit the iPad height, then crop width to center.
  // But better: resize each slide element to iPad dimensions via CSS, then capture.

  const ipadPage = await browser.newPage({
    viewport: { width: 2048, height: 2732 },
    deviceScaleFactor: 1,
  });
  await ipadPage.goto(fileUrl, { waitUntil: 'networkidle' });
  await ipadPage.waitForTimeout(1000);

  // Adjust all slides to iPad dimensions and scale content to fit
  await ipadPage.evaluate(() => {
    const slides = document.querySelectorAll('.screenshot-slide');
    slides.forEach(slide => {
      slide.style.width = '2048px';
      slide.style.height = '2732px';
    });
    // Scale up phone frames for iPad (they need to be bigger on the wider canvas)
    const phones = document.querySelectorAll('.phone-frame');
    phones.forEach(phone => {
      const currentTransform = phone.style.transform || '';
      const scaleMatch = currentTransform.match(/scale\(([\d.]+)\)/);
      if (scaleMatch) {
        const currentScale = parseFloat(scaleMatch[1]);
        const newScale = currentScale * 1.35; // Scale up for iPad
        phone.style.transform = `scale(${newScale})`;
      }
    });
    // Scale up headlines
    document.querySelectorAll('.headline').forEach(h => {
      const size = parseInt(window.getComputedStyle(h).fontSize);
      h.style.fontSize = `${Math.round(size * 1.3)}px`;
    });
    document.querySelectorAll('.subheadline').forEach(h => {
      const size = parseInt(window.getComputedStyle(h).fontSize);
      h.style.fontSize = `${Math.round(size * 1.3)}px`;
    });
  });

  await ipadPage.waitForTimeout(500);

  for (const slide of SLIDES) {
    const el = await ipadPage.$(`#${slide.id}`);
    if (!el) { console.log(`  SKIP: #${slide.id} not found`); continue; }

    const rawPng = await el.screenshot({ type: 'png' });

    const outPath = path.join(__dirname, SIZES.ipad.folder, `${slide.name}.png`);
    await sharp(rawPng)
      .resize(SIZES.ipad.width, SIZES.ipad.height, { fit: 'cover' })
      .png()
      .toFile(outPath);

    console.log(`  OK: ${slide.name}.png (${SIZES.ipad.width}x${SIZES.ipad.height})`);
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to:');
  console.log(`  iPhone: ${path.join(__dirname, SIZES.iphone.folder)}`);
  console.log(`  iPad:   ${path.join(__dirname, SIZES.ipad.folder)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
