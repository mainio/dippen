import Delta from 'quill-delta';
import QuillEditor from '~quill/core/editor.js';

class Editor extends QuillEditor {
  insertContents(index, contents) {
    const normalizedDelta = normalizeDelta(contents);
    const change = new Delta().retain(index).concat(normalizedDelta);
    this.scroll.insertContents(index, normalizedDelta);
    this.scroll.optimize();
    return this.update(change);
  }
}

function normalizeDelta(delta) {
  return delta.reduce((normalizedDelta, op) => {
    if (typeof op.insert === 'string') {
      const text = op.insert.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      return normalizedDelta.insert(text, op.attributes);
    }
    return normalizedDelta.push(op);
  }, new Delta());
}

export default Editor;
