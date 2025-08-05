import Quill from 'quill';
import Module from 'quill/core/module.js';

import { BaseTooltip } from 'quill/themes/base.js';

let injectStyle = () => {
  const style = document.createElement('style');
  style.innerHTML = '.ql-tooltip[data-mode=image-alt]::before {content: "ALT text:";}';
  document.head.append(style);
};

class AltTooltip extends BaseTooltip {
  static TEMPLATE = ['<input type="text" data-image-alt="Alternative text for image">', '<a class="ql-action"></a>'].join('');

  setBlot(blot) {
    this.blot = blot;
  }

  listen() {
    super.listen();
    this.root.querySelector('a.ql-action').addEventListener('click', event => {
      if (this.root.classList.contains('ql-editing')) {
        this.save();
      }
      event.preventDefault();
    });
  }

  hide() {
    super.hide();
    this.root.classList.remove('ql-editing');
    delete this.blot;
  }

  save() {
    let { value } = this.textbox;
    if (value && value.length < 1) {
      value = null;
    }

    if (this.root.getAttribute('data-mode') === 'image-alt') {
      if (this.blot) {
        this.blot.format('alt', value);
      }
    }

    this.textbox.value = '';
    this.hide();
  }
}

export default class ImageAlt extends Module {
  constructor(quill, options = {}) {
    super(quill, options);

    if (typeof injectStyle === 'function') {
      injectStyle();
      injectStyle = null;
    }

    this.tooltip = new AltTooltip(this.quill, this.quill.root);

    this.quill.root.addEventListener('dblclick', (evt) => {
      this.handleDoubleClick(evt);
    });

    this.quill.on('selection-change', () => {
      this.tooltip.hide();
    });
  }

  handleDoubleClick(evt) {
    if (evt.target.nodeName !== 'IMG') {
      return;
    }

    const blot = Quill.find(evt.target, true);
    if (!blot) {
      return;
    }

    evt.preventDefault();
    evt.stopPropagation();

    // Quill resizer may be hooking on to the keyboard events which causes an
    // issue writing to the active tooltip input.
    this.quill.resizer?.hide();

    const { alt } = blot.formats();
    this.tooltip.setBlot(blot);
    this.tooltip.edit('image-alt', alt);
  }
}
