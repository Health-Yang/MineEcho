declare module "adm-zip" {
  interface ZipEntry {
    isDirectory: boolean;
    entryName: string;
    getData(): Buffer;
  }
  export default class AdmZip {
    constructor(buffer: Buffer);
    getEntries(): ZipEntry[];
    extractAllTo(targetPath: string, overwrite: boolean): void;
  }
}
