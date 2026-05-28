import { Stats } from "node:fs";
import { FileHandle } from "node:fs/promises";

//#region node_modules/@openclaw/fs-safe/dist/read-opened-file.d.ts
type ReadResult = {
  buffer: Buffer;
  realPath: string;
  stat: Stats;
};
//#endregion
export { ReadResult as t };