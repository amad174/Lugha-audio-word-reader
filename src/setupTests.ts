import '@testing-library/jest-dom';

if (process.env.FIREBASE_INTEGRATION_TEST === 'true') {
  const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
  Object.assign(globalThis, { ReadableStream, WritableStream, TransformStream });

  const { fetch, Headers, Request, Response } = require('undici');
  Object.assign(globalThis, { fetch, Headers, Request, Response });

  const { File, Blob } = require('buffer');
  if (typeof globalThis.File === 'undefined') globalThis.File = File;
  if (typeof globalThis.Blob === 'undefined') globalThis.Blob = Blob;

  if (typeof FileReader === 'undefined') {
    class FileReaderPolyfill {
      result: string | ArrayBuffer | null = null;
      onload: ((e: { target: FileReaderPolyfill }) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;

      readAsDataURL(file: File) {
        file
          .arrayBuffer()
          .then(buf => {
            const base64 = Buffer.from(buf).toString('base64');
            this.result = `data:${file.type || 'application/octet-stream'};base64,${base64}`;
            this.onload?.({ target: this });
          })
          .catch(err => this.onerror?.(err));
      }
    }
    (globalThis as typeof globalThis & { FileReader: typeof FileReaderPolyfill }).FileReader =
      FileReaderPolyfill;
  }
}
