//#region extensions/minimax/oauth.d.ts
type MiniMaxRegion = "cn" | "global";
type MiniMaxOAuthToken = {
  access: string;
  refresh: string;
  expires: number;
  resourceUrl?: string;
  notification_message?: string;
};
/**
 * Normalize MiniMax token endpoint `expired_in` values to the auth-profile
 * contract: absolute Unix milliseconds.
 */
declare function normalizeOAuthExpires(expiredIn: number, now?: number): number;
declare function loginMiniMaxPortalOAuth(params: {
  openUrl: (url: string) => Promise<void>;
  note: (message: string, title?: string) => Promise<void>;
  progress: {
    update: (message: string) => void;
    stop: (message?: string) => void;
  };
  region?: MiniMaxRegion;
}): Promise<MiniMaxOAuthToken>;
//#endregion
export { loginMiniMaxPortalOAuth as n, normalizeOAuthExpires as r, MiniMaxRegion as t };