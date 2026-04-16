import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-web-security']
  });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/get-started');

  await browser.close();
})();
