import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { s as ensureDir, t as CONFIG_DIR } from "./utils-B5r0V84N.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
//#region src/infra/widearea-dns.ts
const DNS_LABEL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
const MAX_DNS_NAME_LENGTH = 253;
const INVALID_DOMAIN_ERROR = "wide-area discovery domain must be a valid DNS name";
function normalizedDomainLabels(raw) {
	const trimmed = raw.trim();
	const withoutTrailingDot = trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
	if (!withoutTrailingDot || withoutTrailingDot.length > MAX_DNS_NAME_LENGTH) throw new Error(INVALID_DOMAIN_ERROR);
	const labels = withoutTrailingDot.split(".");
	if (labels.some((label) => !DNS_LABEL_RE.test(label))) throw new Error(INVALID_DOMAIN_ERROR);
	return labels;
}
function normalizeWideAreaDomain(raw) {
	const trimmed = raw?.trim();
	if (!trimmed) return null;
	return `${normalizedDomainLabels(trimmed).join(".")}.`;
}
function resolveWideAreaDiscoveryDomain(params) {
	const env = params?.env ?? process.env;
	const candidate = params?.configDomain ?? env.OPENCLAW_WIDE_AREA_DOMAIN ?? null;
	try {
		return normalizeWideAreaDomain(candidate);
	} catch {
		return null;
	}
}
function zoneFilenameForDomain(domain) {
	return `${normalizedDomainLabels(domain).join(".")}.db`;
}
function assertZonePathUnderDnsDir(zonePath, dnsDir) {
	const relativePath = path.relative(dnsDir, zonePath);
	if (relativePath === "" || relativePath.startsWith("..") || path.isAbsolute(relativePath)) throw new Error("wide-area discovery zone path must stay under DNS config directory");
}
function getWideAreaZonePath(domain) {
	const dnsDir = path.resolve(CONFIG_DIR, "dns");
	const zonePath = path.resolve(dnsDir, zoneFilenameForDomain(domain));
	assertZonePathUnderDnsDir(zonePath, dnsDir);
	return zonePath;
}
function dnsLabel(raw, fallback) {
	const normalized = normalizeLowercaseStringOrEmpty(raw).replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
	const out = normalized.length > 0 ? normalized : fallback;
	return out.length <= 63 ? out : out.slice(0, 63);
}
function txtQuote(value) {
	return `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"").replaceAll("\n", "\\n")}"`;
}
function formatYyyyMmDd(date) {
	return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}
function nextSerial(existingSerial, now) {
	const today = formatYyyyMmDd(now);
	const base = Number.parseInt(`${today}01`, 10);
	if (!existingSerial || !Number.isFinite(existingSerial)) return base;
	if (String(existingSerial).startsWith(today)) return existingSerial + 1;
	return base;
}
function extractSerial(zoneText) {
	const match = zoneText.match(/^\s*@\s+IN\s+SOA\s+\S+\s+\S+\s+(\d+)\s+/m);
	if (!match) return null;
	const parsed = Number.parseInt(match[1], 10);
	return Number.isFinite(parsed) ? parsed : null;
}
function extractContentHash(zoneText) {
	return zoneText.match(/^\s*;\s*openclaw-content-hash:\s*(\S+)\s*$/m)?.[1] ?? null;
}
function computeContentHash(body) {
	let h = 2166136261;
	for (let i = 0; i < body.length; i++) {
		h ^= body.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return (h >>> 0).toString(16).padStart(8, "0");
}
function renderZone(opts) {
	const hostname = os.hostname().split(".")[0] ?? "openclaw";
	const hostLabel = dnsLabel(opts.hostLabel ?? hostname, "openclaw");
	const instanceLabel = dnsLabel(opts.instanceLabel ?? `${hostname}-gateway`, "openclaw-gw");
	const domain = normalizeWideAreaDomain(opts.domain) ?? "local.";
	const txt = [
		`displayName=${opts.displayName.trim() || hostname}`,
		`role=gateway`,
		`transport=gateway`,
		`gatewayPort=${opts.gatewayPort}`
	];
	if (opts.gatewayTlsEnabled) {
		txt.push(`gatewayTls=1`);
		if (opts.gatewayTlsFingerprintSha256) txt.push(`gatewayTlsSha256=${opts.gatewayTlsFingerprintSha256}`);
	}
	if (opts.gatewayDirectReachable) txt.push(`gatewayDirectReachable=1`);
	if (opts.tailnetDns?.trim()) txt.push(`tailnetDns=${opts.tailnetDns.trim()}`);
	if (typeof opts.sshPort === "number" && opts.sshPort > 0) txt.push(`sshPort=${opts.sshPort}`);
	if (opts.cliPath?.trim()) txt.push(`cliPath=${opts.cliPath.trim()}`);
	const records = [];
	records.push(`$ORIGIN ${domain}`);
	records.push(`$TTL 60`);
	const soaLine = `@ IN SOA ns1 hostmaster ${opts.serial} 7200 3600 1209600 60`;
	records.push(soaLine);
	records.push(`@ IN NS ns1`);
	records.push(`ns1 IN A ${opts.tailnetIPv4}`);
	records.push(`${hostLabel} IN A ${opts.tailnetIPv4}`);
	if (opts.tailnetIPv6) records.push(`${hostLabel} IN AAAA ${opts.tailnetIPv6}`);
	records.push(`_openclaw-gw._tcp IN PTR ${instanceLabel}._openclaw-gw._tcp`);
	records.push(`${instanceLabel}._openclaw-gw._tcp IN SRV 0 0 ${opts.gatewayPort} ${hostLabel}`);
	records.push(`${instanceLabel}._openclaw-gw._tcp IN TXT ${txt.map(txtQuote).join(" ")}`);
	const contentBody = `${records.join("\n")}\n`;
	return `; openclaw-content-hash: ${computeContentHash(`${records.map((line) => line === soaLine ? `@ IN SOA ns1 hostmaster SERIAL 7200 3600 1209600 60` : line).join("\n")}\n`)}\n${contentBody}`;
}
function renderWideAreaGatewayZoneText(opts) {
	return renderZone(opts);
}
async function writeWideAreaGatewayZone(opts) {
	const domain = normalizeWideAreaDomain(opts.domain);
	if (!domain) throw new Error("wide-area discovery domain is required");
	const normalizedOpts = {
		...opts,
		domain
	};
	const zonePath = getWideAreaZonePath(domain);
	await ensureDir(path.dirname(zonePath));
	const existing = (() => {
		try {
			return fs.readFileSync(zonePath, "utf-8");
		} catch {
			return null;
		}
	})();
	const nextHash = extractContentHash(renderWideAreaGatewayZoneText({
		...normalizedOpts,
		serial: 0
	}));
	const existingHash = existing ? extractContentHash(existing) : null;
	if (existing && nextHash && existingHash === nextHash) return {
		zonePath,
		changed: false
	};
	const serial = nextSerial(existing ? extractSerial(existing) : null, /* @__PURE__ */ new Date());
	const next = renderWideAreaGatewayZoneText({
		...normalizedOpts,
		serial
	});
	fs.writeFileSync(zonePath, next, "utf-8");
	return {
		zonePath,
		changed: true
	};
}
//#endregion
export { writeWideAreaGatewayZone as a, resolveWideAreaDiscoveryDomain as i, normalizeWideAreaDomain as n, renderWideAreaGatewayZoneText as r, getWideAreaZonePath as t };
