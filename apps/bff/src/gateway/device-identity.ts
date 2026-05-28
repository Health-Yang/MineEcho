/**
 * OpenClaw Gateway 设备身份：生成/加载 Ed25519 密钥，并对 connect.challenge 的 nonce 签名，
 * 以便 BFF 以「已配对设备」身份连接，无需用户在 OpenClaw 里单独配置 token。
 */
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";

const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

const DEVICE_DIR = getMineEchoHome();
const DEVICE_FILE = join(DEVICE_DIR, "device.json");

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function derivePublicKeyRaw(publicKeyPem: string): Buffer {
  const key = createPublicKey(publicKeyPem);
  const spki = key.export({ type: "spki", format: "der" }) as Buffer;
  if (
    spki.length === ED25519_SPKI_PREFIX.length + 32 &&
    spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
  ) {
    return spki.subarray(ED25519_SPKI_PREFIX.length);
  }
  return spki;
}

function fingerprintPublicKey(publicKeyPem: string): string {
  const raw = derivePublicKeyRaw(publicKeyPem);
  return createHash("sha256").update(raw).digest("hex");
}

function generateIdentity(): { deviceId: string; publicKeyPem: string; privateKeyPem: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }) as string;
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
  const deviceId = fingerprintPublicKey(publicKeyPem);
  return { deviceId, publicKeyPem, privateKeyPem };
}

export function loadOrCreateDeviceIdentity(): { deviceId: string; publicKeyPem: string; privateKeyPem: string } {
  if (!existsSync(DEVICE_DIR)) mkdirSync(DEVICE_DIR, { recursive: true });
  if (existsSync(DEVICE_FILE)) {
    try {
      const raw = readFileSync(DEVICE_FILE, "utf8");
      const parsed = JSON.parse(raw) as {
        version?: number;
        deviceId?: string;
        publicKeyPem?: string;
        privateKeyPem?: string;
      };
      if (
        parsed?.version === 1 &&
        typeof parsed.deviceId === "string" &&
        typeof parsed.publicKeyPem === "string" &&
        typeof parsed.privateKeyPem === "string"
      ) {
        const derivedId = fingerprintPublicKey(parsed.publicKeyPem);
        return {
          deviceId: derivedId,
          publicKeyPem: parsed.publicKeyPem,
          privateKeyPem: parsed.privateKeyPem,
        };
      }
    } catch (_) {}
  }
  const identity = generateIdentity();
  const stored = {
    version: 1,
    deviceId: identity.deviceId,
    publicKeyPem: identity.publicKeyPem,
    privateKeyPem: identity.privateKeyPem,
    createdAtMs: Date.now(),
  };
  writeFileSync(DEVICE_FILE, JSON.stringify(stored, null, 2) + "\n", "utf8");
  return identity;
}

function signPayload(privateKeyPem: string, payload: string): string {
  const key = createPrivateKey(privateKeyPem);
  const sig = sign(null, Buffer.from(payload, "utf8"), key);
  return base64UrlEncode(sig);
}

function publicKeyRawBase64UrlFromPem(publicKeyPem: string): string {
  return base64UrlEncode(derivePublicKeyRaw(publicKeyPem));
}

/** 与 OpenClaw normalizeDeviceMetadataForAuth 一致：trim + 仅 ASCII 大写转小写 */
function normalizeDeviceMetadataForAuth(value: string | undefined | null): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32));
}

/** 与 OpenClaw buildDeviceAuthPayloadV2 一致（无 platform/deviceFamily） */
function buildDeviceAuthPayloadV2(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token: string | null;
  nonce: string;
}): string {
  const scopes = params.scopes.join(",");
  const token = params.token ?? "";
  return [
    "v2",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopes,
    String(params.signedAtMs),
    token,
    params.nonce,
  ].join("|");
}

/** 与 OpenClaw buildDeviceAuthPayloadV3 一致（platform/deviceFamily 用 normalizeDeviceMetadataForAuth） */
function buildDeviceAuthPayloadV3(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token: string | null;
  nonce: string;
  platform?: string;
  deviceFamily?: string;
}): string {
  const scopes = params.scopes.join(",");
  const token = params.token ?? "";
  const platform = normalizeDeviceMetadataForAuth(params.platform);
  const deviceFamily = normalizeDeviceMetadataForAuth(params.deviceFamily);
  return [
    "v3",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopes,
    String(params.signedAtMs),
    token,
    params.nonce,
    platform,
    deviceFamily,
  ].join("|");
}

export function buildDeviceConnectParams(opts: {
  nonce: string;
  role: string;
  scopes: string[];
  clientId: string;
  clientMode: string;
  platform?: string;
  deviceFamily?: string;
  token?: string;
}): { id: string; publicKey: string; signature: string; signedAt: number; nonce: string } {
  const identity = loadOrCreateDeviceIdentity();
  const signedAtMs = Date.now();
  const payloadV3 = buildDeviceAuthPayloadV3({
    deviceId: identity.deviceId,
    clientId: opts.clientId,
    clientMode: opts.clientMode,
    role: opts.role,
    scopes: opts.scopes,
    signedAtMs,
    token: opts.token ?? null,
    nonce: opts.nonce,
    platform: opts.platform ?? "node",
    deviceFamily: opts.deviceFamily ?? "",
  });
  const signature = signPayload(identity.privateKeyPem, payloadV3);
  return {
    id: identity.deviceId,
    publicKey: publicKeyRawBase64UrlFromPem(identity.publicKeyPem),
    signature,
    signedAt: signedAtMs,
    nonce: opts.nonce,
  };
}
