import Quill, { Parchment } from 'quill';
import icons from 'quill/ui/icons.js';
import BaseModule from './base'

const { '': IconAlignLeft, right: IconAlignRight, center: IconAlignCenter, justify: IconFloatFull } = icons.align;
const IconPencil = '<svg viewBox="0 0 18 18"><path class="ql-fill" d="M 12.9 2 L 11.3 3.6 L 14.8 7 L 16.3 5.5 L 12.9 2 Z M 9.3 5.5 L 2 12.2 L 2 15.5 L 5.7 15.5 L 13 8.9 L 9.3 5.5 Z"/></svg>';

const ALIGNMENT_CLASSES = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center',
  FULL: 'full'
}

// Quill.js 2.x support
const ClassAttributor = Parchment.ClassAttributor
  ? Parchment.ClassAttributor
  : Parchment.Attributor.Class

const ImageFormatClass = new ClassAttributor('imagestyle', 'ql-resize-style', {
  scope: Parchment.Scope.BLOCK,
  whitelist: Object.values(ALIGNMENT_CLASSES)
})

Quill.register(ImageFormatClass, true)

export default class Toolbar extends BaseModule {
  static Icons = {
    left: IconAlignLeft,
    center: IconAlignCenter,
    right: IconAlignRight,
    full: IconFloatFull,
    edit: IconPencil
  }

  static Tools = {
    left: {
      toolClass: ALIGNMENT_CLASSES.LEFT,
      isApplied (activeEle) {
        return ImageFormatClass.value(activeEle) === ALIGNMENT_CLASSES.LEFT
      }
    },
    center: {
      toolClass: ALIGNMENT_CLASSES.CENTER,
      isApplied (activeEle) {
        return ImageFormatClass.value(activeEle) === ALIGNMENT_CLASSES.CENTER
      }
    },
    right: {
      toolClass: ALIGNMENT_CLASSES.RIGHT,
      isApplied (activeEle) {
        return ImageFormatClass.value(activeEle) === ALIGNMENT_CLASSES.RIGHT
      }
    },
    full: {
      toolClass: ALIGNMENT_CLASSES.FULL,
      isApplied (activeEle) {
        return ImageFormatClass.value(activeEle) === ALIGNMENT_CLASSES.FULL
      }
    },
    edit: {
      handler (evt, button, activeEle) {
        this.quill.emitter.emit('resize-edit', activeEle, this.blot)
      }
    }
  }

  onCreate() {
    // Setup Toolbar
    this.toolbar = document.createElement('div')
    this.toolbar.className = 'ql-resize-toolbar'
    this.overlay.appendChild(this.toolbar)

    // Setup Buttons
    this._addToolbarButtons()
  }

  _addToolbarButtons() {
    const Icons = this.constructor.Icons
    const Tools = this.constructor.Tools
    const buttons = []
    this.options.tools.forEach((t) => {
      const tool = Tools[t] || t
      if (tool.verify && tool.verify.call(this, this.activeEle) === false) return

      const button = document.createElement('button')
      button.type = 'button'
      buttons.push(button)
      button.innerHTML = ((tool.icon || '') + (tool.text || '')) || Icons[t]
      button.addEventListener('click', (evt) => {
        if (tool.handler && tool.handler.call(this, evt, button, this.activeEle) !== true) return

        // deselect all buttons
        buttons.forEach(button => (button.classList.remove('active')))
        if (tool.isApplied && tool.isApplied.call(this, this.activeEle)) {
          // If applied, unapply
          ImageFormatClass.remove(this.activeEle)
        } else {
          // otherwise, select button and apply
          button.classList.add('active')

          if (tool.toolClass) {
            const blotIndex = this.quill.getIndex(this.blot)
            this.quill.formatLine(blotIndex, 1, "imagestyle", tool.toolClass)
          }
        }

        // image may change position; redraw drag handles
        this.requestUpdate()
      })

      if (tool.isApplied && tool.isApplied.call(this, this.activeEle)) {
        // select button if previously applied
        button.classList.add('active')
      }
      this.toolbar.appendChild(button)
    })
  }
}
