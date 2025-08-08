import QuillSnowTheme from '~quill/themes/snow.js';
import Emitter from 'quill/core/emitter.js';
import LinkBlot from 'quill/formats/link.js';
import { Range } from 'quill/core/selection.js';

export default class SnowTheme extends QuillSnowTheme {
  extendToolbar(toolbar) {
    super.extendToolbar(toolbar);

    if (this.tooltip) {
      // Replace the emitter added by SnowTooltip with a custom implementation.
      const listener = this.quill.emitter.listeners(Emitter.events.SELECTION_CHANGE).at(-1);
      if (listener) {
        this.quill.off(Emitter.events.SELECTION_CHANGE, listener);
      }

      this.quill.on(Emitter.events.SELECTION_CHANGE, (range, oldRange, source) => {
        if (range == null) return;
        if (range.length === 0 && source === Emitter.sources.USER) {
          const [link, offset] = this.quill.scroll.descendant(LinkBlot, range.index);
          if (link != null) {
            this.tooltip.linkRange = new Range(range.index - offset, link.length());
            const { href: preview } = LinkBlot.formats(link.domNode);

            // @ts-expect-error Fix me later
            this.tooltip.preview.textContent = preview;
            // @ts-expect-error Fix me later
            this.tooltip.preview.setAttribute('href', preview);
            this.tooltip.show();
            const bounds = this.quill.getBounds(this.tooltip.linkRange);
            if (bounds != null) {
              this.tooltip.position(bounds);
            }
            return;
          }
        } else {
          delete this.tooltip.linkRange;
        }
        this.tooltip.hide();
      });
    }
  }
}
