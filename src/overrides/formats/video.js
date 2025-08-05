import QuillVideo from '~quill/formats/video.js';

const HTML_ATTRIBUTES = ['frameborder', 'allowfullscreen'];

export default class Video extends QuillVideo {
  html() {
    const { video } = this.value();

    const attrs = HTML_ATTRIBUTES.reduce((final, name) => {
      const value = this.domNode.getAttribute(name);
      if (value) {
        final.push(`${name}="${value}"`)
      }
      return final;
    }, []);
    attrs.push(`src="${video}"`);

    return `<iframe class="ql-video" ${attrs.join(' ')}></iframe>`
  }
}
