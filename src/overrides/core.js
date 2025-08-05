import Quill, { Module, Delta, Op, OpIterator, AttributeMap, Parchment, Range } from '~quill/core.js';
import SoftBreak from './blots/soft-break.js';

export { Module, Delta, Op, OpIterator, AttributeMap, Parchment, Range };

Quill.register('blots/soft-break', SoftBreak);

export default Quill;
