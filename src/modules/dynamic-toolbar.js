import Module from 'quill/core/module.js';
import Emitter from 'quill/core/emitter.js';

/**
 * Custom module for quilljs to create conditionally displayed dropdowns within
 * the toolbar element
 *
 * Some of this code is based on the original module:
 * https://github.com/T-vK/DynamicQuillTools
 *
 * License: BSD-3-Clause license (same as Quill.js)
 * Author: @T-vK (original package)
 */

const DROPDOWN_ICON = '<svg viewBox="0 0 18 18"><polygon class="ql-stroke" points="7 11 9 13 11 11 7 11"></polygon><polygon class="ql-stroke" points="7 7 9 5 11 7 7 7"></polygon></svg>';

const generateId = () => {
  return Math.random().toString().substring(2, 10);
};

let injectStyle = () => {
  const style = document.createElement('style');
  document.head.appendChild(style);

  const cssRule = '.ql-snow .ql-picker.ql-dropdown .ql-picker-label::before { content: attr(data-label); margin-right: 30px; }';
  style.sheet.insertRule(cssRule);
};

class ToolbarItem {
  constructor(quill, options) {
    this.element = document.createElement('span');
    this.element.className = 'ql-formats';

    if (options.onSelectionChange) {
      this.onSelectionChange = options.onSelectionChange.bind(this);
    }
    if (options.onTextChange) {
      this.onTextChange = options.onTextChange.bind(this);
    }

    if (options.hide) {
      this.hide();
    }
  }

  attachTo(toolbar) {
    toolbar.container.appendChild(this.element);
  }

  show() {
    this.element.style.removeProperty('display');
  }

  hide() {
    this.element.style.display = 'none';
  }
}

class ToolbarDropdown extends ToolbarItem {
  constructor(quill, options) {
    super(quill, options);

    this.currentValue = null;
    this.valueAsLabel = Boolean(options.valueAsLabel);

    if (options.onValueSelected) {
      this.onValueSelected = options.onValueSelected.bind(this);
    }

    const optionValues = options.options;

    const id = generateId();
    const dropdown = document.createElement('span');
    dropdown.className = `ql-dropdown ql-dropdown-${id} ql-picker`

    const pickerLabel = document.createElement('span');
    pickerLabel.className = 'ql-picker-label';
    pickerLabel.innerHTML = DROPDOWN_ICON;
    pickerLabel.dataset.label = options.label ?? Object.keys(optionValues)[0];
    pickerLabel.tabIndex = 0;
    pickerLabel.ariaExpanded = false;
    pickerLabel.role = 'button';
    pickerLabel.ariaControls = `ql-dropdown-options-${id}`;
    dropdown.appendChild(pickerLabel)

    const pickerOptions = document.createElement('span');
    pickerOptions.id = pickerLabel.ariaControls;
    pickerOptions.className = 'ql-picker-options';
    pickerOptions.tabIndex = -1;
    pickerOptions.ariaHidden = true;
    dropdown.appendChild(pickerOptions);

    this.element.appendChild(dropdown);

    const openDropdown = () => {
      dropdown.classList.add('ql-expanded');
      pickerLabel.classList.add('ql-active');
      pickerLabel.ariaExpanded = true;
      pickerOptions.ariaHidden = false;
    };
    const closeDropdown = (focusQuill = true) => {
      if (focusQuill) {
        quill.focus();
      }

      dropdown.classList.remove('ql-expanded');
      pickerLabel.classList.remove('ql-active');
      pickerLabel.ariaExpanded = false;
      pickerOptions.ariaHidden = true;
    };
    const toggleDropdown = () => {
      if (dropdown.classList.contains('ql-expanded')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    };

    pickerLabel.addEventListener('click', (evt) => {
      evt.preventDefault();

      toggleDropdown();
    });
    pickerLabel.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        evt.stopPropagation();
        toggleDropdown();
      }
    });
    document.addEventListener('click', (evt) => {
      if (!dropdown.contains(evt.target)) {
        closeDropdown(false);
      }
    });

    const selectOption = (value) => {
      this.setCurrentValue(value);

      if (typeof this.onValueSelected === 'function') {
        this.onValueSelected(quill, value);
      }

      // Make sure the dropdown is closed after the current value is set because
      // this will fire a selection change on the editor as it refocuses the
      // editor.
      closeDropdown();
    };

    for (let [text, value] of Object.entries(optionValues)) {
      const option = document.createElement('span');
      option.className = 'ql-picker-item';
      option.tabIndex = 0;
      option.role = 'button';
      option.dataset.value = value;
      option.innerText = text;
      pickerOptions.appendChild(option);

      option.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') {
          evt.preventDefault();
          evt.stopPropagation();
          selectOption(value);
        }
      });
      option.addEventListener('click', (evt) => {
        evt.preventDefault();
        selectOption(value);
      });
    }
  }

  setCurrentValue(value) {
    this.currentValue = value;
    this.updateSelectedOption();

    if (this.valueAsLabel) {
      this.setLabelAsSelectedValue();
    }
  }

  show() {
    super.show();
    this.updateSelectedOption();
  }

  updateSelectedOption() {
    const pickerOptions = this.element.querySelector('.ql-picker-options');
    for (let option of pickerOptions.querySelectorAll('.ql-picker-item')) {
      if (option.dataset.value === (this.currentValue ?? '')) {
        option.classList.add('ql-selected');
      } else {
        option.classList.remove('ql-selected');
      }
    }
  }

  setLabel(label) {
    const pickerLabel = this.element.querySelector('.ql-picker-label');
    pickerLabel.dataset.label = label;
  }

  setLabelAsSelectedValue() {
    const pickerOptions = this.element.querySelector('.ql-picker-options');
    const option = pickerOptions.querySelector(`.ql-picker-item[data-value="${this.currentValue}"]`);
    if (option) {
      this.setLabel(option.innerText);
    }
  }
}

class ToolbarButton extends ToolbarItem {
  constructor(quill, options) {
    super(quill, options);

    const id = generateId();
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = options.icon;
    button.classList = `ql-button ql-button-${id}`;

    this.element.appendChild(button);

    if (options.label) {
      button.ariaLabel = options.label;
    }
    if (options.value) {
      button.value = options.value;
    }
    if (button.type) {
      button.classList.add(`ql-${button.type}`);
    }

    this.setActive(Boolean(options.active));
  }

  setActive(active) {
    const button = this.element.querySelector('button');
    if (active) {
      button.classList.add('ql-active');
      button.ariaPressed = true;
    } else {
      button.classList.remove('ql-active');
      button.ariaPressed = false;
    }
  }

  setLabel(label) {
    const button = this.element.querySelector('button');
    button.ariaLabel = label;
  }
};

const ITEM_TYPES = { dropdown: ToolbarDropdown, button: ToolbarButton };

class DynamicToolbar extends Module {
  constructor(quill, options = {}) {
    super(quill, options);

    this.toolbar = quill.getModule('toolbar');
    if (!this.toolbar) {
      return;
    }

    if (!Array.isArray(options.items)) {
      return;
    }

    if (typeof injectStyle === 'function') {
      injectStyle();
      injectStyle = null;
    }

    this.items = [];
    for (let itemdef of options.items) {
      if (!itemdef) {
        continue;
      }
      if (typeof itemdef !== 'object') {
        continue;
      }

      const [type, itemOptions] = Object.entries(itemdef)[0];
      if (ITEM_TYPES[type]) {
        this.items.push(new ITEM_TYPES[type](quill, itemOptions));
      }
    }

    let listenSelectionChange = false;
    let listenTextChange = false;
    this.items.forEach((item) => {
      if (typeof item.onSelectionChange === 'function') {
        listenSelectionChange = true;
      }
      if (typeof item.onTextChange === 'function') {
        listenTextChange = true;
      }
      item.attachTo(this.toolbar)
    });

    if (listenSelectionChange) {
      this.quill.on(Emitter.events.SELECTION_CHANGE, (range) => {
        if (!range) {
          return;
        }

        this.handleSelectionChange(range);
      });
    }
    if (listenTextChange) {
      this.quill.on(Emitter.events.TEXT_CHANGE, () => {
        this.handleTextChange();
      });
    }
  }

  handleSelectionChange(range) {
    this.items.forEach((item) => {
      if (typeof item.onSelectionChange === 'function') {
        item.onSelectionChange(this.quill, range);
      }
    });
  }

  handleTextChange() {
    this.items.forEach((item) => {
      if (typeof item.onTextChange === 'function') {
        item.onTextChange(this.quill);
      }
    });
  }
}

export { DynamicToolbar as default, ToolbarDropdown, ToolbarButton, ToolbarItem };
