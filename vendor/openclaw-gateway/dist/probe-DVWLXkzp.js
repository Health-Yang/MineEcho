import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { u as withTimeout } from "./fs-safe-JUdtLZkh.js";
import "./error-runtime-BFXFWfvK.js";
import "./text-utility-runtime-Da3iUwdt.js";
import { t as MessagingApiClient } from "./messagingApiClient-CLvV39gg.js";
//#region extensions/line/src/probe.ts
async function probeLineBot(channelAccessToken, timeoutMs = 5e3) {
	if (!channelAccessToken?.trim()) return {
		ok: false,
		error: "Channel access token not configured"
	};
	const client = new MessagingApiClient({ channelAccessToken: channelAccessToken.trim() });
	try {
		const profile = await withTimeout(client.getBotInfo(), timeoutMs);
		return {
			ok: true,
			bot: {
				displayName: profile.displayName,
				userId: profile.userId,
				basicId: profile.basicId,
				pictureUrl: profile.pictureUrl
			}
		};
	} catch (err) {
		return {
			ok: false,
			error: formatErrorMessage(err)
		};
	}
}
//#endregion
export { probeLineBot as t };
