import { Locator, Page } from '@playwright/test';

export async function dragResize(
  page: Page,
  handle: Locator,
  dragX: number,
  dragY: number
) {
  const box = await handle.boundingBox();
  if (!box) throw new Error('Cannot find bounding box for handle');

  // Move mouse to the center of the handle
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();

  // Drag relative to current position
  await page.mouse.move(box.x + box.width / 2 + dragX, box.y + box.height / 2 + dragY);

  await page.mouse.up();
}