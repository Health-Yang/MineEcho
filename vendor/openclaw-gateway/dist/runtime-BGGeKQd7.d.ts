import { n as PluginRuntime } from "./types-DTbj6Ogc.js";
import { f as sendMessageDiscord } from "./send-B4T2o2pE.js";
import { t as discordMessageActions } from "./channel-actions-CcvVc2Br.js";

//#region extensions/discord/src/runtime.d.ts
type DiscordChannelRuntime = {
  messageActions?: typeof discordMessageActions;
  sendMessageDiscord?: typeof sendMessageDiscord;
};
type DiscordRuntime = PluginRuntime & {
  channel: PluginRuntime["channel"] & {
    discord?: DiscordChannelRuntime;
  };
};
declare const setDiscordRuntime: (next: DiscordRuntime) => void, getOptionalDiscordRuntime: () => DiscordRuntime | null, getDiscordRuntime: () => DiscordRuntime;
//#endregion
export { setDiscordRuntime as t };