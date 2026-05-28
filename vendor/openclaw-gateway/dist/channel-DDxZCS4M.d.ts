import { t as BaseProbeResult } from "./types.core-CmhUJuY-.js";
import { n as ChannelPlugin } from "./types.public-DkG_i7qb.js";
import { t as ResolvedMatrixAccount } from "./accounts-BqQEVp9B.js";
//#region extensions/matrix/src/matrix/probe.d.ts
type MatrixProbe = BaseProbeResult & {
  status?: number | null;
  elapsedMs: number;
  userId?: string | null;
};
//#endregion
//#region extensions/matrix/src/channel.d.ts
declare const matrixPlugin: ChannelPlugin<ResolvedMatrixAccount, MatrixProbe>;
//#endregion
export { matrixPlugin as t };