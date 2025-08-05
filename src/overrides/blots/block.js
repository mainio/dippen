import { BlockBlot, EmbedBlot, LeafBlot, Scope } from 'parchment';
import { blockDelta, bubbleFormats, BlockEmbed } from '~quill/blots/block.js';
import Break from './break.js';
import Inline from 'quill/blots/inline.js';
import TextBlot from 'quill/blots/text.js';
import SoftBreak, { SOFT_BREAK_CHARACTER } from './soft-break.js';

const NEWLINE_LENGTH = 1;
const softBreakRegex = new RegExp(`(${SOFT_BREAK_CHARACTER})`, 'g');

class Block extends BlockBlot {
  cache = {};
  delta() {
    if (this.cache.delta == null) {
      this.cache.delta = blockDelta(this);
    }
    return this.cache.delta;
  }
  deleteAt(index, length) {
    super.deleteAt(index, length);
    this.optimizeChildren();
    this.cache = {};
  }
  formatAt(index, length, name, value) {
    if (length <= 0) return;
    if (this.scroll.query(name, Scope.BLOCK)) {
      if (index + length === this.length()) {
        this.format(name, value);
      }
    } else {
      super.formatAt(index, Math.min(length, this.length() - index - 1), name, value);
    }
    this.optimizeChildren();
    this.cache = {};
  }
  insertAt(index, value, def) {
    if (def != null) {
      super.insertAt(index, value, def);
      this.cache = {};
      return;
    }
    if (value.length === 0) return;
    const lines = value.split('\n');
    const text = lines.shift();
    if (text.length > 0) {
      const softLines = text.split(softBreakRegex);
      let i = index;
      softLines.forEach((str) => {
        if (i < this.length() - 1 || this.children.tail == null) {
          const insertIndex = Math.min(i, this.length() - 1);
          if (str === SOFT_BREAK_CHARACTER) {
            super.insertAt(
              insertIndex,
              SoftBreak.blotName,
              SOFT_BREAK_CHARACTER,
            );
          } else {
            super.insertAt(insertIndex, str);
          }
        } else {
          const insertIndex = this.children.tail.length();
          if (str === SOFT_BREAK_CHARACTER) {
            this.children.tail.insertAt(
              insertIndex,
              SoftBreak.blotName,
              SOFT_BREAK_CHARACTER,
            );
          } else {
            this.children.tail.insertAt(insertIndex, str);
          }
        }
        i += str.length;
      });

      this.cache = {};
    }
    // TODO: Fix this next time the file is edited.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let block = this;
    lines.reduce((lineIndex, line) => {
      // @ts-expect-error Fix me later
      block = block.split(lineIndex, true);
      block.insertAt(0, line);
      return line.length;
    }, index + text.length);
  }
  insertBefore(blot, ref) {
    super.insertBefore(blot, ref);
    this.optimizeChildren();
    this.cache = {};
  }
  length() {
    if (this.cache.length == null) {
      this.cache.length = super.length() + NEWLINE_LENGTH;
    }
    return this.cache.length;
  }
  moveChildren(target, ref) {
    super.moveChildren(target, ref);
    this.cache = {};
  }
  optimize(context) {
    super.optimize(context);

    const lastLeafInBlock = this.descendants(LeafBlot).at(-1);

    // in order for an end-of-block soft break to be rendered properly by the browser, we need a trailing break
    if (
      lastLeafInBlock != null &&
      lastLeafInBlock.statics.blotName === SoftBreak.blotName &&
      this.children.tail?.statics.blotName !== Break.blotName
    ) {
      const breakBlot = this.scroll.create(Break.blotName);
      super.insertBefore(breakBlot, null);
    }

    this.cache = {};
  }
  path(index) {
    return super.path(index, true);
  }
  removeChild(child) {
    super.removeChild(child);
    this.cache = {};
  }
  split(index) {
    let force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (force && (index === 0 || index >= this.length() - NEWLINE_LENGTH)) {
      const clone = this.clone();
      if (index === 0) {
        this.parent.insertBefore(clone, this);
        return this;
      }
      this.parent.insertBefore(clone, this.next);
      return clone;
    }
    const next = super.split(index, force);
    this.cache = {};
    return next;
  }
  optimizeChildren() {
    this.children.forEach((child) => {
      if (child instanceof Break) {
        child.optimize();
      }
    });
  }
}
Block.blotName = 'block';
Block.tagName = 'P';
Block.defaultChild = Break;
Block.allowedChildren = [Break, Inline, EmbedBlot, TextBlot];

export { blockDelta, bubbleFormats, BlockEmbed, Block as default };

