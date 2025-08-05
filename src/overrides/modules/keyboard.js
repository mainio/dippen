import QuillKeyboard, { SHORTKEY, normalize, deleteRange } from '~quill/modules/keyboard.js';
import Quill from 'quill/core/quill.js';
import { SOFT_BREAK_CHARACTER } from '../blots/soft-break.js';

class Keyboard extends QuillKeyboard {
  constructor(quill, options) {
    super(quill, options);

    // The last enter bindings have to be defined in the specific order below,
    // otherwise Shift+Enter will not work. Therefore, the two last Enter
    // bindings are removed first and then re-added in the correct order below.
    for (let i = 0; i < 2; i++) {
      this.bindings.Enter.pop();
    }

    this.addBinding({
      key: 'Enter',
      shiftKey: true,
    }, this.handleShiftEnter);
    this.addBinding({
      key: 'Enter',
      shiftKey: null
    }, this.handleEnter);
    this.addBinding({
      key: 'Enter',
      metaKey: null,
      ctrlKey: null,
      altKey: null
    }, () => {});
  }

  handleShiftEnter(range) {
    this.quill.insertText(
      range.index,
      SOFT_BREAK_CHARACTER,
      Quill.sources.USER,
    );
    this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
  }
}

export { Keyboard as default, SHORTKEY, normalize, deleteRange };
