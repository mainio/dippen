import QuillLink, { sanitize } from '~quill/formats/link.js';

const EXTERNAL_LINK_RE = new RegExp('^(https?://)');

const formatLink = (domNode) => {
  const value = domNode.getAttribute('href')
  if (EXTERNAL_LINK_RE.test(value)) {
    domNode.setAttribute('target', '_blank');
  } else {
    domNode.removeAttribute('target');
  }
};

const ATTRIBUTES = ['href', 'class', 'target'];

class Link extends QuillLink {
  static create(value) {
    let node = null;
    if (typeof value === 'string') {
      node = super.create(value);
    } else {
      node = super.create(value?.href);
    }

    if (value.className) {
      node.setAttribute('class', value.className);
    }
    if (value.target) {
      node.setAttribute('target', value.target);
    } else {
      formatLink(node);
    }

    return node;
  }

  static formats(domNode) {
    return ATTRIBUTES.reduce((formats, attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }

  static value(domNode) {
    return domNode.getAttribute('href');
  }

  format(name, value) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }

    if (name !== this.statics.blotName || !value) {
      return;
    }

    formatLink(this.domNode);
  }
}

export { Link as default, sanitize };

