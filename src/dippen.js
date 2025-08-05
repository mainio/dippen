import Quill, { AttributeMap, Delta, Module, Op, OpIterator, Parchment, Range } from 'quill';
import Toolbar from 'quill/modules/toolbar.js';
import ImageResize from './modules/image-resize/index.js';
import ImageAlt from './modules/image-alt.js';
import softbreakHandler from './handlers/soft-break.js';
import createServerUploader from './utils/server-upload-factory.js';

Quill.register('modules/imageResize', ImageResize);
Quill.register('modules/imageAlt', ImageAlt);

const { handlers } = Toolbar.DEFAULTS;
handlers['soft-break'] = softbreakHandler

export { AttributeMap, Delta, Module, Op, OpIterator, Parchment, Range, createServerUploader };
export default Quill;
