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
    const brIdx = this.matchers.findIndex(([selector, _]) => selector === 'br');
    if (brIdx > -1) {
      this.matchers[brIdx] = ['br', matchBreak];
    }

    // Replace the match styles element node matcher with the custom
    // implementation. We assume this is the 4th element matcher in the list as
    // is with Quill version 2.0.3. The matcher function's name is not reliable
    // as it can change if the bundled JavaScript is minified.
    let elementMatcherNum = 0;
    const styleIdx = this.matchers.findIndex(([selector, matcher]) => {
      if (selector === Node.ELEMENT_NODE) {
        elementMatcherNum += 1;
      }
      return selector === Node.ELEMENT_NODE && elementMatcherNum === 4;
    });
    if (styleIdx > -1) {
      this.matchers[styleIdx] = [Node.ELEMENT_NODE, matchStyles];
    }
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

function applyFormat(delta, format, value, scroll) {
  if (!scroll.query(format)) {
    return delta;
  }
  return delta.reduce((newDelta, op) => {
    if (!op.insert) return newDelta;
    if (op.attributes && op.attributes[format]) {
      return newDelta.push(op);
    }
    const formats = value ? {
      [format]: value
    } : {};
    return newDelta.insert(op.insert, {
      ...formats,
      ...op.attributes
    });
  }, new Delta());
}

function matchStyles(node, delta, scroll) {
  const formats = {};
  const style = node.style || {};
  if (style.fontStyle === 'italic') {
    formats.italic = true;
  }
  if (style.textDecoration === 'underline' && node.nodeName !== 'A') {
    formats.underline = true;
  }
  if (style.textDecoration === 'line-through') {
    formats.strike = true;
  }
  if (style.fontWeight?.startsWith('bold') ||
  // @ts-expect-error Fix me later
  parseInt(style.fontWeight, 10) >= 700) {
    formats.bold = true;
  }
  delta = Object.entries(formats).reduce((newDelta, _ref5) => {
    let [name, value] = _ref5;
    return applyFormat(newDelta, name, value, scroll);
  }, delta);
  // @ts-expect-error
  if (parseFloat(style.textIndent || 0) > 0) {
    // Could be 0.5in
    return new Delta().insert('\t').concat(delta);
  }
  return delta;
}

export { Clipboard as default, matchAttributor, matchBlot, matchNewline, matchText, traverse };
