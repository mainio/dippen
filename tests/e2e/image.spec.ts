import { test, expect } from '@playwright/test';
import { dragResize } from '../helpers/drag_utils';

test.describe('editor', () => {
  let editor, toolbar, videoButton, imageButton, paragraphs, image, resizeDisplay, altBox;

  test.beforeEach(async({ page }) => {
    await page.goto('/');
    editor = page.locator('#editor'),
    toolbar = editor.locator('.ql-toolbar'),
    videoButton = toolbar.locator('button.ql-video'),
    imageButton = toolbar.locator('button.ql-image'),
    paragraphs = editor.locator('.ql-editor p'),
    image = editor.locator('img[src="/images/600x400.png"]'),
    resizeDisplay = page.locator('.ql-resize-display'), 
    altBox = page.locator('.ql-tooltip[data-mode="image-alt"]');
  });

  test('loads the editor and its contents', async ({ page }) => {
    await Promise.all([
      expect(page).toHaveTitle(/Dippen - Test page/),
      expect(editor).toBeVisible(),
      expect(toolbar).toBeVisible(),
      expect(videoButton).toBeVisible(),
      expect(imageButton).toBeVisible(),
      expect(paragraphs).toHaveCount(2),
      expect(image).toBeVisible(),
      expect(editor.locator('.ql-editor p:has-text("This is some content.")')).toHaveCount(1)
    ]);
  });

  test.describe('image', () => {
    let tl, tr, bl, br;
    test.beforeEach(({ page }) => {
      tl = page.locator('.ql-resize-handle.tl'),
      tr = page.locator('.ql-resize-handle.tr'),
      bl = page.locator('.ql-resize-handle.bl'),
      br = page.locator('.ql-resize-handle.br');
    })
    test('toggles the overlay and image size', async({ page }) => {
       await Promise.all([
        expect(tl).toBeHidden(), 
        expect(tr).toBeHidden(),
        expect(br).toBeHidden(),
        expect(bl).toBeHidden(),
        expect(resizeDisplay).toBeHidden()
       ])
      await image.click();
      await Promise.all([
        expect(tl).toBeVisible(), 
        expect(tr).toBeVisible(),
        expect(br).toBeVisible(),
        expect(bl).toBeVisible(),
        expect(resizeDisplay).toBeVisible(),
        expect(resizeDisplay).toHaveText('600 ×  400')
      ])
      // Clicking other elements should unfocus the image
      await paragraphs.nth(0).click();

      // ✅ Expect the overlay elements to be hidden again
      await Promise.all([
        expect(tl).toBeHidden(), 
        expect(tr).toBeHidden(),
        expect(br).toBeHidden(),
        expect(bl).toBeHidden(),
        expect(resizeDisplay).toBeHidden()
      ]);
    })

    test.describe('drag', () => {
      test.describe('top-left corner', () => {
        test('shrinks image from top-left', async ({ page }) => {
          await image.click();

          await dragResize(page, tl, 50, 0);
          // The aspect ratio of the image should be preserved
          await expect(resizeDisplay).toContainText(/550 × 367/);
        });

        test('enlarges image from top-left', async ({ page }) => {
          await image.click();

          await dragResize(page, tl, -50, 0);
          await expect(resizeDisplay).toContainText(/650 × 433/);
        });
      });

      test.describe('top-right corner', () => {
        test('shrinks image from top-left', async ({ page }) => {
          await image.click();

          await dragResize(page, tr, 50, 0);
          await expect(resizeDisplay).toContainText(/650 × 433/); 
        });

        test('enlarges image from top-left', async ({ page }) => {
          await image.click();

          await dragResize(page, tr, -50, 0);
          await expect(resizeDisplay).toContainText(/550 × 367/);
        });
      });

      test.describe('bottom-right corner', () => {
        test('shrinks image from top-left', async ({ page }) => {
          await image.click();

          await dragResize(page, br, 50, 0);
          await expect(resizeDisplay).toContainText(/650 × 433/); 
        });

        test('enlarges image from top-left', async ({ page }) => {
          await image.click();

          await dragResize(page, br, -50, 0);
          await expect(resizeDisplay).toContainText(/550 × 367/);
        });
      });

      test.describe('bottom-left corner', () => {
        test('shrinks image from top-left', async ({ page }) => {
          await image.click();

          await dragResize(page, bl, 50, 0);
          await expect(resizeDisplay).toContainText(/550 × 367/);
        });

        test('enlarges image from top-left', async ({ page }) => {
          await image.click();

          await dragResize(page, bl, -50, 0);
          await expect(resizeDisplay).toContainText(/650 × 433/);
        });
      });
    });

    test.describe('alt text', () => {
      test('toggles the alt box by double clicking', async() => {
        await expect(altBox).toBeHidden();

        await image.dblclick();
        await expect(altBox).toBeVisible();
        const altText = altBox.locator('input');
        await expect(altText).toHaveValue('This is an image');
        await expect(image).toHaveAttribute('alt', 'This is an image');

        // changing the alt text
        await altBox.locator('input').fill('Changed alt text.')
        await altBox.locator('a.ql-action').click()

        await expect(altBox).toBeHidden();
        await expect(image).toHaveAttribute('alt', 'Changed alt text.');
      });
    });
  });
  test.describe('video', () => {
    let dataVideoDialog, input, saveButton;

    test.beforeEach(({ page }) =>{
      dataVideoDialog = page.locator('.ql-tooltip[data-mode="video"]') 
      input = dataVideoDialog.locator('input[data-video]');
      saveButton = dataVideoDialog.locator('.ql-action');
    });

    test('toggles video embed box', async({ page }) => {
      await expect(dataVideoDialog).not.toBeAttached();
      await videoButton.click();


      await expect(dataVideoDialog).toBeVisible();
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', 'Embed URL');
      await expect(saveButton).toBeVisible();

      // click outside the element
      await paragraphs.nth(0).click();

      await expect(dataVideoDialog).toBeHidden();
    })

    test.describe('embed videos', () => {
      test('custom video blot preserves extra attributes', async ({ page }) => {
        await videoButton.click();
        await input.fill('https://www.youtube.com/watch?v=dummy-youtube-video');
        await saveButton.click();
        const iframe = page.locator('iframe')
        await expect(iframe).toHaveAttribute('src', /https:\/\/www.youtube.com\/embed\/dummy-youtube-video/);
        await expect(iframe).toHaveAttribute('frameborder', '0');
        await expect(iframe).toHaveAttribute('allowfullscreen', 'true')
      });
    })
  });

  test.describe('Quill Enter vs Shift+Enter behavior', () => {
    test.beforeEach(async({page}) => {
      await page.evaluate(() => {
        const editor = document.querySelector('.ql-editor');
        // clean the editor
        if (editor) editor.innerHTML = '';
      });
    });

    test('Shift+Enter inserts a line break', async ({ page }) => {
      const editor = page.locator('.ql-editor');
      // const htmlBefore = await editor.innerHTML();
      // console.log("BEFORE", htmlBefore)
      // Focus editor and type text
      await editor.click();
      await page.keyboard.type('Hello');

      // Shift+Enter should create a <br> in same paragraph
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');

      await page.keyboard.type('World');

      const html = await editor.innerHTML();
      expect(html).toContain('<p>Hello<br>World</p>');
    });

    test('Enter creates a new paragraph', async ({ page }) => {
      const editor = page.locator('.ql-editor');

      await editor.click();
      await page.keyboard.type('Hello');

      await page.keyboard.press('Enter');
      await page.keyboard.type('World');

      const html = await editor.innerHTML();

      expect(html).toContain('<p>Hello</p>');
      expect(html).toContain('<p>World</p>');
    });
  });
})
