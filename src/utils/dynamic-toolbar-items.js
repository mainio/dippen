import Link from 'quill/formats/link.js';

const availableBlots = { link: Link };

const activeBlot = (quill, range, blotClass) => {
  if (!range) {
    return;
  }

  const [blot] = quill.scroll.descendant(blotClass, range.index);
  if (blot) {
    return blot;
  }
};

const handleChange = (quill, range, blotClass, attribute, toolbarItem) => {
  const blot = activeBlot(quill, range, blotClass);

  const format = blot?.formats();
  if (!format) {
    toolbarItem.hide();
    return;
  }

  const blotFormat = format[blotClass.blotName];
  if (blotFormat && typeof blotFormat === 'object') {
    if (blotFormat[attribute]) {
      toolbarItem.setCurrentValue(blotFormat[attribute]);
    } else {
      toolbarItem.setCurrentValue('');
    }
    toolbarItem.show();
  } else {
    toolbarItem.hide();
  }
};

/**
 * Creates dynamic toolbar items that appear on the toolbar only when the
 * specified blot node is within the active selection of the editor.
 *
 * This is a helper function that helps us to write less code when initiating
 * the editor. This creates the `items` option for the `dynamicToolbar` module.
 *
 * For example, use the following code to create the items:
 *   const items = dynamicToolbarItems({
 *     target: {
 *       blot: 'link',
 *       options: { 'Link': '', 'New tab': '_blank' }
 *     },
 *     style: {
 *       blot: 'link',
 *       attribute: 'class',
 *       options: { 'Default': '', 'Button': 'btn', 'Large button': 'btn btn-large' }
 *     }
 *   });
 *
 * Then pass this as an option to the dynamicToolbar module as follows:
 *   const container = document.getElementById('editor');
 *   const quill = new Quill(container, {
 *     modules: {
 *       toolbar: { container: [['bold', 'italic', 'underline', 'soft-break'], ['link']] }
 *       dynamicToolbar: { items }
 *     },
 *     theme: 'snow'
 *   });
 */
export default (definitions) => {
  return Object.keys(definitions).map((name) => {
    const { blot, attribute, options } = definitions[name];
    const attr = attribute ?? name;

    let blotClass = blot;
    if (typeof blotClass === 'string') {
      blotClass = availableBlots[blot];
    }
    if (!blotClass) {
      throw new Error(`Unknown blot name: ${blot}`);
    }

    return {
      dropdown: {
        hide: true,
        valueAsLabel: true,
        options,
        onValueSelected(quill, value) {
          const active = activeBlot(quill, quill.selection.savedRange, blotClass);
          if (active) {
            active.format(attr, value);
          }
        },
        onSelectionChange(quill, range) {
          handleChange(quill, range, blotClass, attr, this);
        },
        onTextChange(quill) {
          handleChange(quill, quill.selection.savedRange, blotClass, attr, this);
        }
      }
    }
  });
};
