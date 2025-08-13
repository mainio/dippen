import { Locator, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export async function dragResize(page, handle, dragX, dragY) {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Cannot find bounding box for handle');

  // Move mouse to the center of the handle
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  // Drag relative to current position
  await page.mouse.move(box.x + box.width / 2 + dragX, box.y + box.height / 2 + dragY);

  await page.mouse.up();
}

export async function deleteScreenShots() {
  const screenShotPath = path.join(rootPath, 'screenshots')
  if (fs.existsSync(screenShotPath)) {
    const files = fs.readdirSync(screenShotPath);
    for (const file of files) {
      fs.unlinkSync(path.join(screenShotPath, file));
    }
  }
}

export async function setContentHTML(htmlString, page) {
  await page.evaluate((html) => {
    const editor = window.editor;
    editor.setContents([]);
    editor.clipboard.dangerouslyPasteHTML(html);
  }, htmlString);
}

export async function elementClassList(element) {
  const classList = await element.getAttribute('class');
  return classList ? classList.split(/\s+/) : [];
}

const rootPath = path.resolve(__dirname, '../..');
