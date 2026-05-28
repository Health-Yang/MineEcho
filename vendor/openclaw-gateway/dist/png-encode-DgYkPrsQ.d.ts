//#region src/media/png-encode.d.ts
/** Write a pixel to an RGBA buffer. Ignores out-of-bounds writes. */
declare function fillPixel(buf: Buffer, x: number, y: number, width: number, r: number, g: number, b: number, a?: number): void;
/** Encode an RGB buffer as a PNG image. */
declare function encodePngRgb(buffer: Buffer, width: number, height: number): Buffer;
/** Encode an RGBA buffer as a PNG image. */
declare function encodePngRgba(buffer: Buffer, width: number, height: number): Buffer;
//#endregion
export { encodePngRgba as n, fillPixel as r, encodePngRgb as t };