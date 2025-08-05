import CoreQuill, { Parchment, Range, globalRegistry, expandConfig, overload } from '~quill/core/quill.js';

console.log('load quill');

class Quill extends CoreQuill {
  // See:
  // https://github.com/slab/quill/issues/4509
  // https://github.com/slab/quill/issues/4535
  getSemanticHTML() {
    const html = super.getSemanticHTML(...arguments);
    return html.replace(/&nbsp;|\u00A0/g, ' ');
  }
}


export { Parchment, Range };
export { globalRegistry, expandConfig, overload, Quill as default };
