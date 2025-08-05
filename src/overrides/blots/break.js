import { LeafBlot, ParentBlot } from 'parchment';
import QuillBreak from '~quill/blots/break.js';
import SoftBreak from './soft-break.js';

class Break extends QuillBreak {
  optimize() {
    const thisIsLastBlotInParent = this.next == null;
    const thisIsFirstBlotInParent = this.prev == null;
    const thisIsOnlyBlotInParent =
      thisIsLastBlotInParent && thisIsFirstBlotInParent;
    const prevLeaf =
      this.prev instanceof ParentBlot
        ? this.prev.descendants(LeafBlot).at(-1)
        : this.prev;
    const prevLeafIsSoftBreak =
      prevLeaf != null && prevLeaf.statics.blotName == SoftBreak.blotName;
    const shouldRender =
      thisIsOnlyBlotInParent || (thisIsLastBlotInParent && prevLeafIsSoftBreak);
    if (!shouldRender) {
      this.remove();
    }
  }
}

export default Break;
