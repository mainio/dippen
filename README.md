# Dippen

Dippen is our modified version of the [Quill](https://quilljs.com/) editor
specifically designed for the
[Decidim participation platform](https://decidim.org/). The goal of this project
is to provide a maintenance release of the updated Quill v2 editor that works
within Decidim without having to maintain custom workarounds or other Quill
hacks within the Decidim v0.27 maintenance version.

The editor works exactly as Quill and maintains Quill naming for all its APIs.
The customized editor only adds specific extra functionality to the Quill
editor. The editor differs from the original Quill v1 editor slightly and
requires a maintenance version of Decidim to work properly (see the link below).

The desired functionality is to maintain as similar editor experience as in
legacy Decidim v0.27 with the updated Quill v2 editor and some extra features.
The custom functionality added to Quill is migrated to this repository instead
of maintaining that functionality in the Decidim repository.

Changes implemented on top of the default Quill v2 implementation:

- Soft breaks / line breaks (https://github.com/slab/quill/pull/4565)
  * Customizes also the `Keyboard` and `Clipboard` modules with soft break
    support.
- Customized `Clipboard` module from the Quill editor with support for passing
  the pasted content to the `Uploader` module for uploading the pasted base64
  encoded images (if the pasted content is HTML).
- Customized `Uploader` module from the Quill editor with extra features:
  * Converting the pasted base64 encoded images to uploaded images.
  * Easier separation of the image pasting to allow more control over the image
    uploads to the server.
- A new exported function `createServerUploader` for creating the image upload
  function based on the
  [old image upload module](https://github.com/fxmontigny/quill-image-upload).
- Image resize module (https://github.com/mudoo/quill-resize-module, original
  version: https://github.com/kensnyder/quill-image-resize-module)
- Image ALT module allowing to set ALT text to images by double clicking the
  image.
- Bugfix for not wrapping `<a>` elements within `<u>` in case the `<a>` element
  has a style attribute with `text-decoration: underline` defined on it.
- Bugfix for formatting the video `<iframe>` elements correctly through
  `quill.getSemanticHTML()`.

The Decidim maintenance version can be found from:

https://github.com/mainio/decidim/tree/release/0.27-stable-ruby3.4

Note that this editor should be only used within legacy version (v0.27) of
Decidim. Newer versions of the platform have migrated over to
[TipTap](https://tiptap.dev/) (see
https://github.com/decidim/decidim/pull/10196).

## Building and testing

To build and test the editor, run the following commands:

```bash
$ npm run build
$ npm run dev
```

After that, browse to:
http://localhost:8080/

## Usage

To use this editor within the Decidim maintenance version (linked above), there
is nothing you need to do.

In case you want to use this outside of that Decidim version, you need to
override `app/packs/src/decidim/editor.js` with the following code:

```js
import Quill, { createServerUploader } from "dippen";

const quillFormats = [
  "bold",
  "italic",
  "link",
  "underline",
  "header",
  "list",
  "break",
  "soft-break",
  "code",
  "blockquote",
  "indent"
];

export default function createQuillEditor(container) {
  const toolbar = container.dataset.toolbar;
  const disabled = container.dataset.disabled === "true";

  const allowedEmptyContentSelector = "iframe";
  let quillToolbar = [
    ["bold", "italic", "underline", "soft-break"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
    ["code", "blockquote"],
    [{ indent: "-1" }, { indent: "+1" }]
  ];

  let addImage = false;
  let addVideo = false;

  /**
   * - basic = only basic controls without titles
   * - content = basic + headings
   * - full = basic + headings + image + video
   */
  if (toolbar === "content") {
    quillToolbar = [[{ header: [2, 3, 4, 5, 6, false] }], ...quillToolbar];
  } else if (toolbar === "full") {
    addImage = true;
    addVideo = true;
    quillToolbar = [
      [{ header: [2, 3, 4, 5, 6, false] }],
      ...quillToolbar,
      ["video"],
      ["image"]
    ];
  }

  let modules = {
    toolbar: {
      container: quillToolbar
    }
  };

  if (addVideo) {
    quillFormats.push("video");
  }

  if (addImage) {
    quillFormats.push("image");

    const uploadUrl = container.dataset.uploadImagesPath;
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const imageUploader = createServerUploader(uploadUrl, {
      headers: { "X-CSRF-Token": token }
    });

    modules.imageResize = {
      modules: ["Resize", "DisplaySize", "Keyboard"]
    };
    modules.imageAlt = true;
    modules.uploader = {
      async uploadHandler(file) {
        const response = await imageUploader(file);
        return response.url;
      }
    }

    const help = document.createElement("p");
    help.classList.add("help-text");
    help.style.marginTop = "-1.5rem";
    help.innerText = container.dataset.dragAndDropHelpText;
    container.after(help);
  }

  const quill = new Quill(container, {
    readOnly: disabled,
    modules: modules,
    formats: quillFormats,
    theme: "snow"
  });

  quill.on("text-change", () => {
    const text = quill.getText();

    // Triggers CustomEvent with the cursor position
    // It is required in input_mentions.js
    let event = new CustomEvent("quill-position", {
      detail: quill.getSelection()
    });
    container.dispatchEvent(event);

    if (
      (text === "\n" || text === "\n\n") &&
      quill.root.querySelectorAll(allowedEmptyContentSelector).length === 0
    ) {
      $input.val("");
    } else {
      const emptyParagraph = "<p><br></p>";
      const cleanHTML = quill.root.innerHTML.replace(
        new RegExp(`^${emptyParagraph}|${emptyParagraph}$`, "g"),
        ""
      );
      $input.val(cleanHTML);
    }
  });

  return quill;
}
```

## Versioning

The version of this package matches the version of the Quill editor with the
patch version multiplied by 100 and the version of this custom editor added to
the patch version.

For example, version 1 of this editor that targets Quill v2.0.3 has the version
number 2.0.301.

It is recommended to use the exact Quill version this custom version has been
targeted for. The overrides are done in a way that should maintain compatibility
with possible newer Quill versions but this is not guaranteed.

## License

BSD 3-clause

Licenses for the dependencies (some of which are partly or fully contained
within this repository):

- [Quill - BSD 3-clause](https://github.com/slab/quill/blob/main/LICENSE)
- [Image resize module - MIT](https://github.com/mudoo/quill-resize-module/blob/master/LICENSE)
- [Image upload module - MIT](https://github.com/fxmontigny/quill-image-upload/blob/71d9009be03196a2a3eb05a962f79af91c3ef735/package.json#L22)
