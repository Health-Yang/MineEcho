declare module "@opendoc/pdf2md" {
  export function convert(buffer: Buffer): Promise<string>;
}
