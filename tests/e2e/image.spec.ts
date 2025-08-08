import { test, expect } from '@playwright/test';
import { dragResize, deleteScreenShots, setContentHTML, elementClassList } from '../helpers/utils';

test.describe('editor', () => {
  let editor, editorContent, toolbar, videoButton, imageButton, paragraphs, image, resizeDisplay, altBox;

  test.beforeAll(async() => {
    await deleteScreenShots();
  })

  test.beforeEach(async({ page }) => {
    await page.goto('/');
    editor = page.locator('#editor');
    editorContent = page.locator('.ql-editor')
    toolbar = editor.locator('.ql-toolbar');
    videoButton = toolbar.locator('button.ql-video');
    imageButton = toolbar.locator('button.ql-image');
    paragraphs = editor.locator('.ql-editor p');
    image = editor.locator('img[src="/images/600x400.png"]');
    resizeDisplay = page.locator('.ql-resize-display'); 
    altBox = page.locator('.ql-tooltip[data-mode="image-alt"]');
  });

  test('loads the editor and its contents', async ({ page }) => {
    await Promise.all([
      expect(page).toHaveTitle(/Dippen - Test page/),
      expect(editor).toBeVisible(),
      expect(toolbar).toBeVisible(),
      expect(videoButton).toBeVisible(),
      expect(imageButton).toBeVisible(),
      expect(paragraphs).toHaveCount(3),
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
      // Focus editor and type text
      await editorContent.click();
      await page.keyboard.type('Hello');

      // Shift+Enter should create a <br> in same paragraph
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');

      await page.keyboard.type('World');

      const html = await editorContent.innerHTML();
      expect(html).toContain('<p>Hello<br>World</p>');
    });

    test('Enter creates a new paragraph', async ({ page }) => {
      await editorContent.click();
      await page.keyboard.type('Hello');

      await page.keyboard.press('Enter');
      await page.keyboard.type('World');

      const html = await editorContent.innerHTML();

      expect(html).toContain('<p>Hello</p>');
      expect(html).toContain('<p>World</p>');
    });
  });

  test.describe('dynamic-links', ()=> {
    let link, defaultButton, newTabButton, linkEditDialogue, editLinkButton, removeButton, previewButton, editingDialogue
    const html = `<p>This is a paragraph with a <a href="https://example.org" rel="noopener noreferrer" target="_blank">link</a></p>`;
    test.beforeEach(async ({ page }) => {
      await setContentHTML(html, page);

      defaultButton = toolbar.locator('.ql-picker-label[data-label="Default"]');
      newTabButton = toolbar.locator('.ql-picker-label[data-label="New tab"]');
      link = editorContent.locator('a');
      linkEditDialogue = editor.locator('.ql-flip');
      editLinkButton = linkEditDialogue.locator('.ql-action');
      removeButton = linkEditDialogue.locator('.ql-remove');
      previewButton = linkEditDialogue.locator('.ql-preview');
      editingDialogue = page.locator('.ql-editing[data-mode="link"]')
    });

    test('it toggles dynamic links when clicking the link', async({ page }) => {
      await expect(link).toHaveCount(1);
      await expect(link).toBeVisible();
      
      expect(defaultButton).toBeHidden();
      expect(newTabButton).toBeHidden();
      expect(linkEditDialogue).toBeHidden();
      await link.click()
      // opens the link edit and toggles the default and new tab buttons
      expect(defaultButton).toBeVisible();
      expect(newTabButton).toBeVisible();
      expect(linkEditDialogue).toBeVisible();
      expect(editLinkButton).toBeVisible();
      expect(removeButton).toBeVisible();
      expect(previewButton).toBeVisible();
      const href = await previewButton.getAttribute('href');
      expect(href).toContain('https://example.org');
    })

    test('edits the link url', async() => {
      await link.click();
      expect(linkEditDialogue).toBeVisible();
      expect(editLinkButton).toBeVisible();
      await editLinkButton.click(editLinkButton)
      expect(editingDialogue).toBeVisible();
      //change the link
      const linkInput = editingDialogue.locator('input');
      expect(linkInput).toBeVisible();
      await linkInput.fill('https://another-link.org')
      await editingDialogue.locator('a.ql-action').click()
      const linkSrc = await link.getAttribute('href');
      expect(linkSrc).toContain('https://another-link.org');
    })

    test.describe('new tab link', () => {
      test('it toggles link new tab', async({ page }) => {
        const target = await link.getAttribute('target');
        expect(target).toEqual('_blank')
        await link.click()
        expect(newTabButton).toBeVisible();
        await newTabButton.click();
        const options = page.locator('.ql-dropdown .ql-picker-item');
        await options.filter({ hasText: 'Link' }).click();
        const editedLink = editorContent.locator('a');
        const editedTarget = await editedLink.getAttribute('target');
        expect(editedTarget).toEqual(null)
      })
    })

    test.describe('dynamic class', () => {
      test('it does not add any class by default', async() => {
         const classes = await elementClassList(link)
         expect(classes).toEqual([])
      })
      test('it changes to small button', async({ page }) => {
         await link.click()
        expect(defaultButton).toBeVisible();
        await defaultButton.click();
        const options = page.locator('.ql-dropdown .ql-picker-item');
        await options.filter({ hasText: 'Small button' }).nth(0).click();
        const updatedLink = editorContent.locator('a');
        const classes = await elementClassList(updatedLink)
        expect(classes).toEqual(expect.arrayContaining(["button", "primary", "small"]))
      })

      test('it changes to small hollow button', async({ page }) => {
         await link.click()
        expect(defaultButton).toBeVisible();
        await defaultButton.click();
        const options = page.locator('.ql-dropdown .ql-picker-item');
        await options.filter({ hasText: 'Small button' }).nth(1).click();
        const updatedLink = editorContent.locator('a');
        const classes = await elementClassList(updatedLink)
        expect(classes).toEqual(expect.arrayContaining(["button", "primary", "hollow", "small"]))
      })

      test('it changes to standard button', async({ page }) => {
         await link.click()
        expect(defaultButton).toBeVisible();
        await defaultButton.click();
        const options = page.locator('.ql-dropdown .ql-picker-item');
        await options.filter({ hasText: 'Standard button' }).nth(0).click();
        const updatedLink = editorContent.locator('a');
        const classes = await elementClassList(updatedLink)
        expect(classes).toEqual(expect.arrayContaining(["button", "primary"]))
      })

      test('it changes to standard hallow button', async({ page }) => {
         await link.click()
        expect(defaultButton).toBeVisible();
        await defaultButton.click();
        const options = page.locator('.ql-dropdown .ql-picker-item');
        await options.filter({ hasText: 'Standard button' }).nth(1).click();
        const updatedLink = editorContent.locator('a');
        const classes = await elementClassList(updatedLink)
        expect(classes).toEqual(expect.arrayContaining(["button", "primary", "hollow"]))
      })

      test('it changes to large button', async({ page }) => {
         await link.click()
        expect(defaultButton).toBeVisible();
        await defaultButton.click();
        const options = page.locator('.ql-dropdown .ql-picker-item');
        await options.filter({ hasText: 'Large button' }).nth(0).click();
        const updatedLink = editorContent.locator('a');
        const classes = await elementClassList(updatedLink)
        expect(classes).toEqual(expect.arrayContaining(["button", "primary", "large"]))
      })

      test('it changes to large hollow button', async({ page }) => {
         await link.click()
        expect(defaultButton).toBeVisible();
        await defaultButton.click();
        const options = page.locator('.ql-dropdown .ql-picker-item');
        await options.filter({ hasText: 'Large button (hollow)' }).nth(0).click();
        const updatedLink = editorContent.locator('a');
        const classes = await elementClassList(updatedLink)
        expect(classes).toEqual(expect.arrayContaining(["button", "primary", "hollow", "large"]))
      })
    })
  })
})
