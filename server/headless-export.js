import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function exportDocumentPdf(templateUrl, templateData, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.goto(templateUrl, { waitUntil: 'networkidle0' });

    if (templateData) {
      await page.evaluate((data) => {
        window.postMessage({ type: 'LOAD_TEMPLATE', payload: data }, '*');
      }, templateData);
      await page.waitForTimeout(500); // allow render
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`Successfully exported PDF to: ${outputPath}`);
    return outputPath;
  } finally {
    await browser.close();
  }
}
