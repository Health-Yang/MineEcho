import { n as ChannelOutboundAdapter } from "../../outbound.types-BgikmK_M.js";
import { y as ChannelMessageActionAdapter } from "../../types.core-CmhUJuY-.js";
import { n as ChannelPlugin } from "../../types.public-DkG_i7qb.js";
//#region extensions/imessage/src/imessage.test-plugin.d.ts
declare const createIMessageTestPlugin: (params?: {
  outbound?: ChannelOutboundAdapter;
  actions?: ChannelMessageActionAdapter;
}) => ChannelPlugin;
//#endregion
export { createIMessageTestPlugin };