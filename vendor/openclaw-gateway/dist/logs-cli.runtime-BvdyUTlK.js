import { p as resolveGatewaySystemdServiceName } from "./constants-BOOZFRBo.js";
import { s as readSystemdServiceRuntime } from "./systemd-b70oYI_I.js";
import { n as buildGatewayConnectionDetails } from "./call-D_O83KsN.js";
import { spawn } from "node:child_process";
//#region src/cli/logs-cli.runtime.ts
async function execFileUtf8Tail(command, args, options) {
	return await new Promise((resolve) => {
		const child = spawn(command, args, {
			env: options.env,
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		const stdoutChunks = [];
		const stderrChunks = [];
		let stdoutBytes = 0;
		let stderrBytes = 0;
		let truncated = false;
		let settled = false;
		child.stdout?.on("data", (chunk) => {
			stdoutChunks.push(chunk);
			stdoutBytes += chunk.length;
			while (stdoutBytes > options.maxBytes && stdoutChunks.length > 0) {
				const first = stdoutChunks[0];
				const overflow = stdoutBytes - options.maxBytes;
				if (first.length <= overflow) {
					stdoutChunks.shift();
					stdoutBytes -= first.length;
				} else {
					stdoutChunks[0] = first.subarray(overflow);
					stdoutBytes -= overflow;
				}
				truncated = true;
			}
		});
		child.stderr?.on("data", (chunk) => {
			stderrChunks.push(chunk);
			stderrBytes += chunk.length;
			while (stderrBytes > 64 * 1024 && stderrChunks.length > 0) {
				const first = stderrChunks[0];
				const overflow = stderrBytes - 64 * 1024;
				if (first.length <= overflow) {
					stderrChunks.shift();
					stderrBytes -= first.length;
				} else {
					stderrChunks[0] = first.subarray(overflow);
					stderrBytes -= overflow;
				}
			}
		});
		child.on("error", (error) => {
			if (settled) return;
			settled = true;
			resolve({
				stdout: Buffer.concat(stdoutChunks).toString("utf8"),
				stderr: error instanceof Error ? error.message : String(error),
				code: 1,
				truncated
			});
		});
		child.on("close", (code) => {
			if (settled) return;
			settled = true;
			resolve({
				stdout: Buffer.concat(stdoutChunks).toString("utf8"),
				stderr: Buffer.concat(stderrChunks).toString("utf8"),
				code: typeof code === "number" ? code : 1,
				truncated
			});
		});
	});
}
//#endregion
export { buildGatewayConnectionDetails, execFileUtf8Tail, readSystemdServiceRuntime, resolveGatewaySystemdServiceName };
