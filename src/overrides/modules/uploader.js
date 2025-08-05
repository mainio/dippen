import QuillUploader from '~quill/modules/uploader.js';
import Quill from 'quill/core/quill.js';
import Emitter from 'quill/core/emitter.js';
import Delta, { Op } from 'quill-delta';
import Image from 'quill/formats/image.js';

class Uploader extends QuillUploader {
  constructor(quill, options) {
    super(quill, options);
  }

  async uploadFile(blob) {
    return await this.options.uploadHandler.call(this, blob);
  }

  onPasteContent(range, pastedDelta) {
    let idx = range.index;

    for (let operation of pastedDelta.ops) {
      if (operation.insert) {
        const imageSrc = operation.insert[Image.blotName];
        if (imageSrc && imageSrc.startsWith('data:image/')) {
          const imageIdx = idx;
          const length = Op.length(operation);
          this.options.convertBase64.call(this, imageSrc).then((src) => {
            if (src === imageSrc) {
              return;
            }

            const changeDelta = (new Delta()).retain(imageIdx).delete(length).insert(
              {[Image.blotName]: src},
              operation.attributes
            );
            this.quill.updateContents(changeDelta, Quill.sources.USER);
          });
        }
      }

      idx += Op.length(operation);
    }
  }
}

Uploader.DEFAULTS = {
  ...Uploader.DEFAULTS,

  async convertBase64(srcData) {
    const result = await fetch(srcData);
    const blob = await result.blob();
    return await this.quill.uploader.uploadFile(blob);
  },

  uploadHandler(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  },

  handler(range, files) {
    if (!this.quill.scroll.query('image')) {
      return;
    }
    const promises = files.map((file) => {
      return this.quill.uploader.uploadFile(file);
    });
    Promise.all(promises).then((images) => {
      const update = images.reduce((delta, image) => {
        return delta.insert({ image });
      }, new Delta().retain(range.index).delete(range.length));
      this.quill.updateContents(update, Emitter.sources.USER);
      this.quill.setSelection(range.index + images.length, Emitter.sources.SILENT);
    });
  }
}

export default Uploader;
