import { EmbedBlot } from 'parchment';
import Delta from 'quill-delta';
import Quill from 'quill/core/quill.js';
import logger from 'quill/core/logger.js';
import QuillClipboard, { matchAttributor, matchBlot, matchNewline, matchText, traverse } from '~quill/modules/clipboard.js';

import { SOFT_BREAK_CHARACTER } from '../blots/soft-break.js';

const debug = logger('quill:clipboard');

class Clipboard extends QuillClipboard {
  // The constructor override is needed for soft break support:
  // https://github.com/slab/quill/pull/4565
  constructor(quill, options) {
    super(quill, options);

    // Replace the `br` matcher with the custom implementation.
    const matcherIdx = this.matchers.findIndex(([selector, _]) => selector === 'br');
    if (matcherIdx < 0) {
      return;
    }
    this.matchers[matcherIdx] = ['br', matchBreak];
  }

  // The paste override is for passing the pasted content to the `Uploader`
  // module for uploading the base64 encoded images.
  onPaste(range, data) {
    let { text, html } = data;
    const formats = this.quill.getFormat(range.index);
    const pastedDelta = this.convert({
      text,
      html
    }, formats);
    debug.log('onPaste', pastedDelta, {
      text,
      html
    });
    const delta = new Delta().retain(range.index).delete(range.length).concat(pastedDelta);
    this.quill.updateContents(delta, Quill.sources.USER);

    // range.length contributes to delta.length()
    this.quill.setSelection(delta.length() - range.length, Quill.sources.SILENT);
    this.quill.scrollSelectionIntoView();

    // Pass the pasted content to the uploader to handle the data/image URLs or
    // other possible external URLs.
    this.quill.uploader.onPasteContent(range, pastedDelta);
  }
}

function isLine(node, scroll) {
  if (!(node instanceof Element)) return false;
  const match = scroll.query(node);
  // @ts-expect-error
  if (match && match.prototype instanceof EmbedBlot) return false;
  return ['address', 'article', 'blockquote', 'canvas', 'dd', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'iframe', 'li', 'main', 'nav', 'ol', 'output', 'p', 'pre', 'section', 'table', 'td', 'tr', 'ul', 'video'].includes(node.tagName.toLowerCase());
}

const preNodes = new WeakMap();
function isPre(node) {
  if (node == null) return false;
  if (!preNodes.has(node)) {
    // @ts-expect-error
    if (node.tagName === 'PRE') {
      preNodes.set(node, true);
    } else {
      preNodes.set(node, isPre(node.parentNode));
    }
  }
  return preNodes.get(node);
}

function getParentLine(node, scroll) {
  let current = node;
  while (current.parentElement != null) {
    if (isLine(current.parentElement, scroll)) {
      return current.parentElement;
    }
    current = current.parentElement;
  }
  return null;
}

function isInLastPositionOfParentLine(node, parentLineElement) {
  let current = node;
  while (current.nextSibling == null && current.parentElement != null) {
    if (current.parentElement === parentLineElement) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function matchBreak(node, delta, scroll) {
  const parentLineElement = getParentLine(node, scroll);
  if (parentLineElement == null) {
    // <br> tags pasted without a parent will be treated as soft breaks
    return new Delta().insert(SOFT_BREAK_CHARACTER);
  }
  if (isPre(parentLineElement)) {
    // code blocks don't allow soft breaks
    return new Delta().insert('\n');
  }
  if (isInLastPositionOfParentLine(node, parentLineElement)) {
    // ignore trailing breaks

    // In the original PR version, this returned the passed delta object.
    // However, this would cause an empty final paragraph on a new editor with
    // two line breaks added to it.
    // return delta;
    return new Delta().insert('\n');
  }
  return new Delta().insert(SOFT_BREAK_CHARACTER);
}

export { Clipboard as default, matchAttributor, matchBlot, matchNewline, matchText, traverse };
