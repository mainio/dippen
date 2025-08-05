class UploadError extends Error {
  constructor(details) {
    super(`Failed to upload, response code: ${details.code}, status: ${details.type}, body: ${details.body}`);
  }
};

const defaultOptions = {
  method: 'POST',
  name: 'image',
  headers: {},
  csrf: null,
  withCredentials: false
};

/**
 * This replicates the functionality from the original image upload module:
 * https://github.com/fxmontigny/quill-image-upload/blob/master/src/image-upload.js
 *
 * This allows us to maintain the upload functionality with the updated Quill
 * APIs.
 *
 * Extracted from:
 * https://github.com/fxmontigny/quill-image-upload
 *
 * License: MIT
 * Authors: @fxmontigny
 */
export default (url, options = {}) => {
  const { method, name, headers, csrf, withCredentials } = { ...defaultOptions, ...options };

  return (file) => {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append(name, file);

      if (csrf) {
        fd.append(csrf.token, csrf.hash);
      }

      const xhr = new XMLHttpRequest();
      // init http query
      xhr.open(method, url, true);
      // add custom headers
      for (const hdr in headers) {
        xhr.setRequestHeader(hdr, headers[hdr]);
      }

      // listen callback
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new UploadError({
            code: xhr.status,
            type: xhr.statusText,
            body: xhr.responseText
          }));
        }
      };

      if (withCredentials) {
        xhr.withCredentials = true;
      }
      xhr.send(fd);
    });
  };
};
