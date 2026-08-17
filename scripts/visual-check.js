const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outDir = path.join(__dirname, "..", "artifacts");

async function checkViewport(browser, name, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto("http://127.0.0.1:3020", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(1500);

  const screenshotPath = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      return { hasCanvas: false };
    }
    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const sample = document.createElement("canvas");
    sample.width = canvas.width;
    sample.height = canvas.height;
    const ctx = sample.getContext("2d");
    ctx.drawImage(canvas, 0, 0);
    const image = ctx.getImageData(0, 0, sample.width, sample.height).data;
    let nonBlack = 0;
    let sampled = 0;
    const stride = Math.max(4, Math.floor(image.length / 4000 / 4) * 4);
    for (let i = 0; i < image.length; i += stride) {
      sampled += 1;
      if (image[i] > 10 || image[i + 1] > 10 || image[i + 2] > 10) {
        nonBlack += 1;
      }
    }
    return {
      hasCanvas: true,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      webgl: Boolean(context),
      nonBlackRatio: Number((nonBlack / sampled).toFixed(3))
    };
  });

  await page.close();
  return { name, screenshotPath, ...metrics };
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu-sandbox"]
  });

  const results = [];
  results.push(await checkViewport(browser, "desktop", { width: 1440, height: 1100 }));
  results.push(await checkViewport(browser, "tablet", { width: 900, height: 1100 }));
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
