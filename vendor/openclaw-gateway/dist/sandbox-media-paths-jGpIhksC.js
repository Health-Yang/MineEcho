import { n as assertSandboxPath } from "./sandbox-paths-U414eGG1.js";
import { o as resolveMediaReferenceSandboxPath } from "./media-reference-CWwsLZO_.js";
import path from "node:path";
//#region src/agents/sandbox-media-paths.ts
function createSandboxBridgeReadFile(params) {
	return async (filePath) => await params.sandbox.bridge.readFile({
		filePath,
		cwd: params.sandbox.root
	});
}
async function resolveSandboxedBridgeMediaPath(params) {
	const normalizeFileUrl = (rawPath) => rawPath.startsWith("file://") ? rawPath.slice(7) : rawPath;
	const mediaPathInfo = params.inboundFallbackDir ? resolveMediaReferenceSandboxPath(params.mediaPath, params.inboundFallbackDir) : { resolved: params.mediaPath };
	const filePath = normalizeFileUrl(mediaPathInfo.resolved);
	const rewrittenFrom = mediaPathInfo.rewrittenFrom;
	if (rewrittenFrom) {
		if (!await params.sandbox.bridge.stat({
			filePath,
			cwd: params.sandbox.root
		})) throw new Error(`Sandbox media reference is not staged: ${rewrittenFrom}`);
	}
	const enforceWorkspaceBoundary = async (hostPath) => {
		if (!params.sandbox.workspaceOnly) return;
		await assertSandboxPath({
			filePath: hostPath,
			cwd: params.sandbox.root,
			root: params.sandbox.root
		});
	};
	const resolveDirect = () => params.sandbox.bridge.resolvePath({
		filePath,
		cwd: params.sandbox.root
	});
	try {
		const resolved = resolveDirect();
		if (resolved.hostPath) await enforceWorkspaceBoundary(resolved.hostPath);
		return {
			resolved: resolved.hostPath ?? resolved.containerPath,
			...rewrittenFrom ? { rewrittenFrom } : {}
		};
	} catch (err) {
		const fallbackDir = params.inboundFallbackDir?.trim();
		if (!fallbackDir) throw err;
		const fallbackPath = path.join(fallbackDir, path.basename(filePath));
		try {
			if (!await params.sandbox.bridge.stat({
				filePath: fallbackPath,
				cwd: params.sandbox.root
			})) throw err;
		} catch {
			throw err;
		}
		const resolvedFallback = params.sandbox.bridge.resolvePath({
			filePath: fallbackPath,
			cwd: params.sandbox.root
		});
		if (resolvedFallback.hostPath) await enforceWorkspaceBoundary(resolvedFallback.hostPath);
		return {
			resolved: resolvedFallback.hostPath ?? resolvedFallback.containerPath,
			rewrittenFrom: filePath
		};
	}
}
//#endregion
export { resolveSandboxedBridgeMediaPath as n, createSandboxBridgeReadFile as t };
