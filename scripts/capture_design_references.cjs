// Read-only public portal capture. Uses bundled Playwright and a headless browser.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/GANPATI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'docs', 'reference-captures');
fs.mkdirSync(out, { recursive: true });
const sites = [
  ['myscheme', 'https://www.myscheme.gov.in/'],
  ['ux4g', 'https://www.ux4g.gov.in/'],
  ['abdm', 'https://abdm.gov.in/'],
  ['emitra', 'https://emitra.rajasthan.gov.in/'],
  ['darpan', 'https://ngodarpan.gov.in/'],
];
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const records = [];
  for (const [slug, url] of sites) {
    const context = await browser.newContext({viewport:{width:1440,height:1000},locale:'en-IN',ignoreHTTPSErrors:false});
    const page = await context.newPage();
    const record = {slug,url,captured_at:new Date().toISOString(),viewport:'1440x1000'};
    try {
      const response = await page.goto(url,{waitUntil:'domcontentloaded',timeout:22000});
      await page.waitForTimeout(1500);
      record.status = response?.status();
      record.final_url = page.url();
      record.title = await page.title();
      record.visible_text = (await page.locator('body').innerText()).slice(0,14000);
      record.styles = await page.evaluate(() => {
        const body = getComputedStyle(document.body);
        return {body_font:body.fontFamily,body_size:body.fontSize,body_color:body.color,background:body.backgroundColor};
      });
      const file = `${slug}-desktop.png`;
      await page.screenshot({path:path.join(out,file),fullPage:false});
      record.screenshot = file;
      if (slug === 'myscheme' || slug === 'emitra') {
        await page.setViewportSize({width:390,height:844});
        await page.waitForTimeout(500);
        await page.screenshot({path:path.join(out,`${slug}-mobile.png`),fullPage:false});
        record.mobile_screenshot = `${slug}-mobile.png`;
      }
      console.log(JSON.stringify({slug,status:record.status,title:record.title,screenshot:record.screenshot}));
    } catch (error) {
      record.error = error.message;
      console.log(JSON.stringify({slug,error:record.error}));
    }
    records.push(record);
    fs.writeFileSync(path.join(out,'capture-metadata.json'),JSON.stringify(records,null,2));
    await context.close();
  }
  await browser.close();
})();
