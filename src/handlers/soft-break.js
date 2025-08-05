export default function softbreakHandler() {
  const keyboard = this.quill.getModule('keyboard');
  if (!keyboard) {
    return;
  }

  const range = this.quill.getSelection();
  keyboard.handleShiftEnter(range);
}
