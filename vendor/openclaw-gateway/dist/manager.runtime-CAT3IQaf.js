import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { t as escapeRegExp } from "./regexp-gnNKXe6h.js";
import { a as resolveAgentDir } from "./agent-scope-config-BfxErZq2.js";
import { n as resolvePreferredOpenClawTmpDir } from "./tmp-openclaw-dir-C60hWKdY.js";
import { a as shouldLogVerbose, r as logVerbose } from "./globals-DZ-ifL5z.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { t as tempWorkspace } from "./private-temp-workspace-BzJHrK4c.js";
import { t as asBoolean } from "./boolean-CZag3-H2.js";
import { i as stripInlineDirectiveTagsForDisplay } from "./directive-tags-DBD-mk-0.js";
import { S as resolveFfmpegBin } from "./media-services-rb2QLp-y.js";
import { i as resolveAgentRoute } from "./resolve-route-uLXK2QLU.js";
import { _ as resolveTtsPrefsPath, g as resolveTtsConfig, o as getTtsProvider } from "./tts-runtime-DJIgAVUc.js";
import { n as parseTtsDirectives } from "./directives-CPLN_vjJ.js";
import "./temp-path-CHSPBUGU.js";
import "./runtime-env-CcOqZeJj.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./routing-BEOAuKfu.js";
import "./ssrf-runtime-C8F9j9mo.js";
import "./media-runtime-BndVydhQ.js";
import "./text-chunking-CWOBXxG4.js";
import "./agent-runtime-BrG2cky1.js";
import { n as agentCommandFromIngress } from "./agent-command-l6N_480Y.js";
import { n as resolveRealtimeBootstrapContextInstructions } from "./realtime-bootstrap-context-kF56FcMT.js";
import { A as resolveRealtimeVoiceAgentConsultToolsAllow, K as REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ, M as matchRealtimeVoiceConsultQuestions, O as resolveRealtimeVoiceAgentConsultToolPolicy, S as buildRealtimeVoiceAgentConsultPolicyInstructions, _ as shouldAutoControlRealtimeVoiceAgentText, h as parseRealtimeVoiceAgentControlToolArgs, j as createRealtimeVoiceForcedConsultCoordinator, k as resolveRealtimeVoiceAgentConsultTools, l as REALTIME_VOICE_AGENT_CONTROL_TOOL, n as resolveConfiguredRealtimeVoiceProvider, s as controlRealtimeVoiceAgentRun, t as createRealtimeVoiceBridgeSession, x as buildRealtimeVoiceAgentConsultChatMessage } from "./session-runtime-DkzeLM7W.js";
import { C as normalizeSupportedRealtimeVoiceActivationName, T as sortRealtimeVoiceActivationNames, _ as classifySkippableRealtimeVoiceConsultTranscript, b as matchRealtimeVoiceActivationName, g as createRealtimeVoiceTurnContextTracker, h as createRealtimeVoiceOutputActivityTracker, i as resamplePcm, p as createRealtimeVoiceAgentTalkbackQueue } from "./realtime-voice-BNYRswSU.js";
import "./speech-Cgmis2hc.js";
import "./text-utility-runtime-Da3iUwdt.js";
import { c as resolveDiscordAccountAllowFrom } from "./accounts-lW-EvTAF.js";
import { t as parseDiscordTarget } from "./target-parsing-D0KB0cgg.js";
import { Ct as getGuildVoiceState, It as ChannelType, l as VoiceStateUpdateListener, o as ReadyListener, s as ResumedListener } from "./discord-DU7KIiYG.js";
import { n as formatDiscordUserTag } from "./format-DZW075F7.js";
import { a as normalizeDiscordSlug, m as resolveDiscordOwnerAccess } from "./allow-list-BSaTXaTo.js";
import { t as formatMention } from "./mentions-CREPxmqu.js";
import { t as getDiscordRuntime } from "./runtime-B_MWZ4rH.js";
import { t as buildDiscordGroupSystemPrompt } from "./inbound-context-0BUTDX_x.js";
import { n as resolveDiscordVoiceEnabled, t as authorizeDiscordVoiceIngress } from "./access-CxyZTcCm.js";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { PassThrough, Readable, Transform } from "node:stream";
//#region node_modules/libopus-wasm/dist/generated/libopus.generated.mjs
async function Module$1(moduleArg = {}) {
	var moduleRtn;
	var Module = moduleArg;
	var ENVIRONMENT_IS_WEB = !!globalThis.window;
	var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
	var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
	if (ENVIRONMENT_IS_NODE) {
		const { createRequire } = await import("node:module");
		var require = createRequire(import.meta.url);
	}
	var quit_ = (status, toThrow) => {
		throw toThrow;
	};
	var _scriptName = import.meta.url;
	if (ENVIRONMENT_IS_NODE) {
		require("node:fs");
		if (_scriptName.startsWith("file:")) require("node:path").dirname(require("node:url").fileURLToPath(_scriptName)) + "";
		if (process.argv.length > 1) process.argv[1].replace(/\\/g, "/");
		process.argv.slice(2);
		quit_ = (status, toThrow) => {
			process.exitCode = status;
			throw toThrow;
		};
	} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) try {
		new URL(".", _scriptName).href;
	} catch {}
	var out = console.log.bind(console);
	var err = console.error.bind(console);
	var wasmBinary;
	var ABORT = false;
	var EXITSTATUS;
	function binaryDecode(bin) {
		for (var i = 0, l = bin.length, o = new Uint8Array(l), c; i < l; ++i) {
			c = bin.charCodeAt(i);
			o[i] = ~c >> 8 & c;
		}
		return o;
	}
	var readyPromiseResolve, readyPromiseReject;
	var runtimeInitialized = false;
	function updateMemoryViews() {
		var b = wasmMemory.buffer;
		HEAP8 = new Int8Array(b);
		Module["HEAP16"] = HEAP16 = new Int16Array(b);
		Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
		HEAPU16 = new Uint16Array(b);
		Module["HEAP32"] = HEAP32 = new Int32Array(b);
		HEAPU32 = new Uint32Array(b);
		Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
		HEAPF64 = new Float64Array(b);
		HEAP64 = new BigInt64Array(b);
		HEAPU64 = new BigUint64Array(b);
	}
	function preRun() {
		if (Module["preRun"]) {
			if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
			while (Module["preRun"].length) addOnPreRun(Module["preRun"].shift());
		}
		callRuntimeCallbacks(onPreRuns);
	}
	function initRuntime() {
		runtimeInitialized = true;
		wasmExports["h"]();
	}
	function postRun() {
		if (Module["postRun"]) {
			if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
			while (Module["postRun"].length) addOnPostRun(Module["postRun"].shift());
		}
		callRuntimeCallbacks(onPostRuns);
	}
	function abort(what) {
		Module["onAbort"]?.(what);
		what = `Aborted(${what})`;
		err(what);
		ABORT = true;
		what += ". Build with -sASSERTIONS for more info.";
		var e = new WebAssembly.RuntimeError(what);
		readyPromiseReject?.(e);
		throw e;
	}
	var wasmBinaryFile;
	function findWasmBinary() {
		return binaryDecode("\0asm\0\0\0±,``\0``\0``\0``\0`\0``||`\0``\0\0`\x07\0`\x07`	\0`}\0`\b`|||`\b\0`|`|`\v}`\v}}\0`	}`|`||`\v`}`\f\0`\v\0`\0``}`\b}`	}}\0`\f`\n`}}`}\0`|\0`~~`\0%aa\0ab\0\0ac\0\bad\0\rae\0	af\0\r»¹\0\0	\n\n\0\0\x07\0\x07\b\n\x07	\x1B\v\v\v\v\0\x07\n\0\0\n	\x07\x07 !\"\0\b\x07\0\0	\n\r\b\0#\f\f\f$%&	\x07\x07'\v()\b\b*\0+\0\0\0\0\0\0\f\f	\rp\b\b\x07\bA°ß\x07\v\x07\x1Bg\0h\0¾i\0»j\0k\0ºl\0¹m\0¸n\0·o\0¶p\0µq\0´r\0s\0³t\0²u\0±v\0°w\0¯x\0®y\0­z\0¬A\0«B\0ªC\0©D\0¨E\0NF\0'G\0¢	\0A\v\x07¼½§¦¥£¤\fN\n¹Û#\0Ak\"$\0  \x006\b  6  6\0AÔ(\0!\0#\0Ak\"$\0  6\fA\0!#\0AÐk\"$\0  6Ì A\xA0j\"A\0A(ü\v\0  (Ì6ÈA\0 AÈj AÐ\0j A\0HA \0 \0(\0\"A_q6\0@@ \0(0E@ \0AÐ\x0060 \0A\x006 \0B\x007 \0(,! \0 6,\f\v \0(\r\vA \0\r\v \0 AÈj AÐ\0j A\xA0j\v!  \0A\0A\0 \0($\0 \0A\x0060 \0 6, \0A\x006 \0( \0B\x007A\0 \v \0 \0(\0 A qr6\0A\0\v AÐj$\0 Aj$\0\0\v§  j! \0(\" v! \0 A\0J@ \0 \0(  j  Ak\"-\0\0lk6  -\0\0 -\0\0k l\f\v   -\0\0lk\v\"6 AM@ \0( !@@ Av\"AÿG@ Av! \0((\"A\0N@A! \0 \0( \0(\" \0(\bjK \0 Aj6 \0(\0 j  j:\0\0A\0A\v \0(,r6,\v \0($\"@ Ak!@A! \0 \0( \0(\" \0(\bjK \0 Aj6 \0(\0 j :\0\0A\0! \0($ \vAk\"6$ \0 \0(, r6, \r\0\v\v \0 Aÿq6( \0(! \0( !\f\v \0 \0($Aj6$\v \0 A\bt\"6 \0 A\btAþÿÿ\x07q\"6  \0 \0(A\bj6 AI\r\0\v\v\vý\b \0(\" v!\x07 \0( !A!@ !  \x07  Aj\"j-\0\0l\"I\r\0\v \0  k\"6 \0  k\"\b6  AM@ \0(! \0((! \0(!	 \0(!\n@ \0 A\bt\"\x076 \0 	A\bj\"	6A\0!  \nI@ \0 Aj\"6 \0(\0 j-\0\0! !\v \0 6( \0  A\btrAvAÿq \bA\btAþÿÿ\x07qrAÿs\"\b6  AI ! \x07!\r\0\v\v \v\v\x07#\0Ak\" 6\fA{!@@@@@@@@@@@@@@@@@@@@@@@@@ A¢k.\b\x07\n\v\f\r\0\v AÎ\0k\x1B\b\v  (\f\"Aj6\f (\0\"A\nK\r \0 6\f\v  (\f\"Aj6\fA! (\0\"A\0H\r  \0(\0(\bN\r \0 6 \f\v  (\f\"Aj6\fA! (\0\"A\0L\r  \0(\0(\bJ\r \0 6$\f\v  (\f\"Aj6\f (\0\"AK\r \0 E6\f \0 AG6\f\v  (\f\"Aj6\f (\0\"Aä\0K\r \0 68\f\v  (\f\"Aj6\f \0 (\x0064\f\v  (\f\"Aj6\f \0 (\x006,\f\v  (\f\"Aj6\f@ (\0\"AôJ\r\0 AF\r\0\f\v \0  \0(A°ã-l\"\0 \0 J\x1B6(\f\r\v  (\f\"Aj6\f (\0\"AkA~I\r \0 6\b\f\f\v  (\f\"Aj6\f (\0\"AkAoI\r\r \0 6<\f\v\v  (\f\"Aj6\f (\0 \0(<6\0\f\n\v  (\f\"Aj6\f (\0\"AK\r\v \0 6D\f	\v  (\f\"Aj6\f (\0\"E\r\n  \0(D6\0\f\b\v \0(\" \0(\0\"(\"At (\b\"AtjA jlA¨j\"@ \0AÌ\0jA\0 ü\v\0\v@  l\"A\0L\r\0 At\" \0 A\bj lAtjjAôj\" j! Aq!A\0! AO@ Aüÿÿÿ\x07q!	@  At\"jA|6\0  jA|6\0  Ar\"jA|6\0  jA|6\0  A\br\"jA|6\0  jA|6\0  A\fr\"jA|6\0  jA|6\0 Aj! \bAj\"\b 	G\r\0\v E\r\v@  At\"jA|6\0  jA|6\0 Aj! \x07Aj\"\x07 G\r\0\v\v \0A\x006Ø \0B\x007` \0A6X \0BÀ?7PA\0\v  (\f\"Aj6\f \0 (\x0060\f\v  (\f\"Aj6\fA\0! (\0\"E\r \0 )87° \0 )07¨ \0 )(7\xA0 \0 ) 7 \0 )7 \0 )7 \0 )\b7 \0 )\x007xA\0\v  (\f\"Aj6\fA\0! (\0\"E\r \0 )\x007¸A\0\v  (\f\"Aj6\f (\0\"E\r  \0(\x006\0\f\v  (\f\"Aj6\f (\0\"E\r  \0(L6\0\f\v  (\f\"Aj6\f \0 (\x006@\f\v  (\f\"Aj6\f \0 (\x006ì\vA\0!\v \vA\v\\@ \0g\"AF\r\0 \0Aÿ\0M@ \0 Akt!\0\f\v \0 A\bjt \0A kvj!\0\v \0Aÿ\0q\"\0 A\x07tk \0A \0klA³lAvjAj\v\b\x07#\0Ak\" 6\fA{!@@@@@@@@@@@@@@@@@@ Aªk&\x07\b\f	\r\0\v AÎ\0k\n	\n\v  (\f\"Aj6\f (\0\"A\nK\r \0 6$\f\r\v  (\f\"Aj6\f (\0\"E\r  \0($6\0\f\f\v  (\f\"Aj6\fA! (\0\"A\0H\r\f  \0(\0(\bN\r\f \0 6\f\v\v  (\f\"Aj6\fA! (\0\"A\0L\r\v  \0(\0(\bJ\r\v \0 6\f\n\v  (\f\"Aj6\f (\0\"AkA~I\r\v \0 6\f\f	\v  (\f\"Aj6\f (\0\"E\r\n  \0(06\0 \0A\x0060A\0\v  (\f\"Aj6\f (\0\"E\r	  \0( \0(m6\0\f\x07\v \0(! \0(\0\"(\b\"At \0(\b\" (AtAàÀ\0jljA@k\"@ \0A,jA\0 ü\v\0\v@ A\0L\r\0 At\" \0 Aj lAtjjAì\0j\" j!A At\" AL\x1B\"Aq!\x07A\0! AN@ Aüÿÿÿ\x07q!	A\0!@  At\"jA|6\0  jA|6\0  Ar\"jA|6\0  jA|6\0  A\br\"jA|6\0  jA|6\0  A\fr\"jA|6\0  jA|6\0 Aj! Aj\" 	G\r\0\v \x07E\r\v@  At\"jA|6\0  jA|6\0 Aj! \bAj\"\b \x07G\r\0\v\v \0B7@\f\v  (\f\"Aj6\f (\0\"E\r\x07  \0(H6\0\f\v  (\f\"Aj6\f (\0\"E\r  \0(\x006\0\f\v  (\f\"Aj6\f \0 (\x006\f\v  (\f\"Aj6\f (\0\"E\r  \0(,6\0\f\v  (\f\"Aj6\f (\0\"AK\r \0 6 \f\v  (\f\"Aj6\f (\0\"E\r  \0( 6\0\vA\0!\v \vA\vç	 \0( \" \0(\" v\"I\"E@ \0  k\"6 \v \0   k \x1B\"6 AM@ \0(! \0((!\x07 \0(!\b \0(!	@ \0 A\bt\"\n6 \0 \bA\bj\"\b6A\0!  	I@ \0 Aj\"6 \0(\0 j-\0\0! !\v \0 6( \0  \x07A\btrAvAÿq A\btAþÿÿ\x07qrAÿs\"6  AI !\x07 \n!\r\0\v\v \v| AJ@ Ak!@  \0 Atj\"*\f»\" ¢ *\b»\" ¢ *\0»\" ¢ *»\" ¢\xA0\xA0\xA0\xA0! Aj\" H\r\0\v Aüÿÿÿ\x07q!\v@  L\r\0@ Aq\"\bE@ !\f\v !@ \"Aj! \0 Atj*\0»\" ¢ \xA0! \x07Aj\"\x07 \bG\r\0\v\v  kA|K\r\0@ \0 Atj\"*\f»\" ¢ *\b»\" ¢ *»\" ¢ *\0»\" ¢ \xA0\xA0\xA0\xA0! Aj\" G\r\0\v\v \v< \0(\"g\" \0(jAt A kv\"\0 \0A\fv\"\0AtAðj(\0Kk \0kAøk\v \0(\"  v\"k!@ E@ !\f\v \0 \0(  j6 \v \0 6 AM@ \0( !@@ Av\"AÿG@ Av! \0((\"A\0N@A! \0 \0( \0(\" \0(\bjK \0 Aj6 \0(\0 j  j:\0\0A\0A\v \0(,r6,\v \0($\"@ Ak!@A! \0 \0( \0(\" \0(\bjK \0 Aj6 \0(\0 j :\0\0A\0! \0($ \vAk\"6$ \0 \0(, r6, \r\0\v\v \0 Aÿq6( \0(! \0( !\f\v \0 \0($Aj6$\v \0 A\bt\"6 \0 A\btAþÿÿ\x07q\"6  \0 \0(A\bj6 AI\r\0\v\v\v¸ @ \0(\f! \0(\" j\"A!O@@A! \0 \0(\" \0(\b\"\x07 \0(jK \0 \x07Aj\"6\b \0(\0  kj :\0\0A\0A\v \0(,r6, A\bv! AJ A\bk!\r\0\v  j!\v \0 6 \0  t r6\f \0 \0( j6\vAÝ\0A¨.AÑ\0\v \0(\f! \0(\" I@ \0(\b! \0(!@A\0!  I \0 Aj\"6\b \0(\0  kj-\0\0A\0\v t r! AH A\bj!\r\0\v\v \0  k6 \0  v6\f \0 \0( j6 A tAsq\v­}  n! \0(\0!@@ AF@C\0\0?!\b \0( A\bN@ \0(!@ @  *\0C\0\0\0\0]\"A\f\v A!\v \0 \0( A\bk6 C\0\0¿C\0\0? \x1B!\b\v \0(@  \b8\0\vA!\n \x07E\r \x07 *\x008\0A\v \0(\"A\0 A\0J\x1B!@@ E@ !	\f\v 	E@ !	\f\v@ A\0J\r\0 AJ\r\0 AqE A\0GqE\r\v At\"\fE\r\0 	  \fü\n\0\0\v A\0J@A\0!\f@@ @ \fAF\rA \ft!  \fvAv! \fAj!A\0!\r@ @  \rAtj!A\0!\v@  \v tAtj\" *\0Có5?\"  \vAtAr \ftAtj\"*\0Có5?\"\x1B8\0   \x1B8\0 \vAj\"\v G\r\0\v\v \rAj\"\r G\r\0\v\v 	E\r\0 \fAF\r\0A \ft!  \fvAv! \fAj!A\0!\r@ @ 	 \rAtj!A\0!\v@  \v tAtj\" *\0Có5?\"  \vAtAr \ftAtj\"*\0Có5?\"\x1B8\0   \x1B8\0 \vAj\"\v G\r\0\v\v \rAj\"\r G\r\0\v\v \nAq-\0ðË \nAuAðËj-\0\0Atr!\nA! \fAj\"\f G\r\0\v\v 	!\v  u!\f@@  t\"Aq\r\0 A\0N\r\0 !	@@ E\r\0 \fA\0L\r\0 Av! \fAt!A\0!\r@ @  \rAtj!A\0!\v@  \v lAtj\" *\0Có5?\"  \vAtAr \flAtj\"*\0Có5?\"\x1B8\0   \x1B8\0 \vAj\"\v G\r\0\v\v \rAj\"\r \fG\r\0\v\v Av!@ E\r\0 \fA\0L\r\0 \fAt!A\0!\r@ @  \rAtj!A\0!\v@  \v lAtj\" *\0Có5?\"  \vAtAr \flAtj\"*\0Có5?\"\x1B8\0   \x1B8\0 \vAj\"\v G\r\0\v\v \rAj\"\r \fG\r\0\v\v Aj! \fAt!\v \n \ft \nr!\n Aq\r 	AH 	Aj!	 \v!\f !\r\0\v\f\v ! \f!\v\v \vAN@ AF! @   u \v t g\v @   u \v t g\v \0    \v   \b \n\x1B!\n \0(E\rA\0!#\0 \v t\"  u\"l\"	AtAjApqk!@ E@ A\0L\r Aüÿÿÿ\x07q! Aq! A\0L! AI!@@ \r\0  Atj!\r   lAtj!\fA\0!A\0!A\0! E@@ \r  lAtj \f Atj*\x008\0 \r Ar\"\0 lAtj \f \0Atj*\x008\0 \r Ar\"\0 lAtj \f \0Atj*\x008\0 \r Ar\"\0 lAtj \f \0Atj*\x008\0 Aj! Aj\" G\r\0\v E\r\v@ \r  lAtj \f Atj*\x008\0 Aj! Aj\" G\r\0\v\v Aj\" G\r\0\v\f\v A\0L\r\0 AtAÌj! Aüÿÿÿ\x07q! Aq!\f A\0L! AI!@@ \r\0  At\"\0j!  \0 j(\0 lAtj!\rA\0!A\0!A\0! E@@   lAtj \r Atj*\x008\0  Ar\"\0 lAtj \r \0Atj*\x008\0  Ar\"\0 lAtj \r \0Atj*\x008\0  Ar\"\0 lAtj \r \0Atj*\x008\0 Aj! Aj\" G\r\0\v \fE\r\v@   lAtj \r Atj*\x008\0 Aj! Aj\" \fG\r\0\v\v Aj\" G\r\0\v\v 	At\"\0@   \0ü\n\0\0\v\f\v \0    \v   \b \n\x1B!\n \0(\r\v \n\v@ E@ \v!\f\f\vA\0!@ At! \n \vAu\"\fv \fA\0J@ Au!	 \vA~q!A\0!@ 	A\0J@  Atj!A\0!\v@   \vlAtj\"\0 \0*\0Có5?\"\x1B  \vAtAr \flAtj\"\0*\0Có5?\"\b8\0 \0 \x1B \b8\0 \vAj\"\v 	G\r\0\v\v Aj\" \fG\r\0\v\v \nr!\n \f!\v Aj\" G\r\0\v\v @A\0!@ \n-\0Ì!\nA !\r AG@A t!  vAv! Aj!\rA\0!@ @  Atj!A\0!\v@  \v \rtAtj\"\0 \0*\0Có5?\"\x1B  \vAtAr tAtj\"\0*\0Có5?\"\b8\0 \0 \x1B \b8\0 \vAj\"\v G\r\0\v\v Aj\" G\r\0\v\v \r\" G\r\0\v\v \f t!@ \x07E\r\0 Aq! ¸¶!\bA\0!A\0!\v AO@ Aüÿÿÿ\x07q!A\0!\f@ \x07 \vAt\"j  j*\0 \b8\0 \x07 Ar\"\0j \0 j*\0 \b8\0 \x07 A\br\"\0j \0 j*\0 \b8\0 \x07 A\fr\"\0j \0 j*\0 \b8\0 \vAj!\v \fAj\"\f G\r\0\v E\r\v@ \x07 \vAt\"\0j \0 j*\0 \b8\0 \vAj!\v Aj\" G\r\0\v\v \nA tAsq\võ@ \0(ü\" L@  \0(\"H\r \0A¨j!  k\"At\"\x07@  Atj  \x07ü\n\0\0\v \0(ü!@@@@@ \0(èAk\0\v \0   L \0  \0(Atj  Atj  \0(ükL\f\v \0    \0  \0(Atj  Atj  \0(ük\f\v \0   | \0  \0(Atj  Atj  \0(ük|\f\v At\"@   ü\n\0\0\v  \0(ükAt\"E\r\0  \0(Atj  Atj ü\n\0\0\v \0(\"\0At\"@    \0kAtj ü\n\0\0\vA\0\vAÿ\bA%AÁ\0\vA§	A%AÃ\0\v At! \0 Atj(\0! A\bG@@ A\0L\r\0 AtAu! AuAjAu!@ AqE@ !\f\v \0 Ak\"Atj(\0 Au l  lj Aÿÿq lAujj!\v AF\r\0@ \0 Ak\"Atj(\0 \0 AtjAk(\0 Au l  lj Aÿÿq lAujj\"Au l  lj Aÿÿq lAujj! AJ !\r\0\v\v \v \0(\0 \0( \0(\b \0(\f \0( \0( \0( \0( AtAu\"\0 Aul  AuAjAu\"lj Aÿÿq \0lAujj\" lj Au \0lj Aÿÿq \0lAuj\" lj Au \0lj Aÿÿq \0lAuj\" lj Au \0lj Aÿÿq \0lAuj\" lj Au \0lj Aÿÿq \0lAuj\" lj Au \0lj Aÿÿq \0lAuj\" lj Au \0lj Aÿÿq \0lAuj\" lj Au \0lj Aÿÿq \0lAuj\vË\v}\x07@@ C\0\0\0\0\\\r\0 C\0\0\0\0\\\r\0 \0 F\r At\"E\r \0  ü\n\0\0\vA~A  AL\x1B\"k! As!A k!\x1BA\0 k!  \bA\fl\"A¸õ\0j*\0!  A´õ\0j*\0!  A°õ\0j*\0! \nA\0 \x07 \bG\x1B \n  [\x1B \nA  AL\x1B\" F\x1B\"A\0J@  \x07A\fl\"A¸õ\0j*\0!  A´õ\0j*\0!  A°õ\0j*\0!  \x1BAtj*\0!\v  Atj*\0!\f  Atj*\0!\r  Atj*\0!A\0!\b@ \0 \bAt\"j   	j*\0\" \"   \b kAtj*\b\"   \v \r   \f C\0\0? \"  \b kAtj\"\x07*\b \x07A\bk*\0   \x07* \x07Ak*\0   \x07*\0  j*\08\0 \r! \f!\r \v!\f !\v \bAj\"\b G\r\0\v \n!\v C\0\0\0\0[@ \0 F\r  kAt\"E\r \0 At\"j  j ü\n\0\0\v  k\"A\0L\r\0 \0 At\"j!  j\" Atj*\0!\r  Atj*\0!  Atj*\0!\v  \x1BAtj*\0!\fA\0!\b@  \bAt\"\0j  \r  \b kAtj*\b\"   \f  \v \0 j*\08\0 !\r \v! \f!\v !\f \bAj\"\b G\r\0\v\v\v½|~|@ \0½B4§Aÿq\"AÉ\x07kA?I@ !\f\v AÉ\x07I@ \0D\0\0\0\0\0\0ð?\xA0\v A\bI\r\0D\0\0\0\0\0\0\0\0 \0½\"BxQ\r AÿO@ \0D\0\0\0\0\0\0ð?\xA0\v B\0S@#\0Ak\"D\0\0\0\0\0\0\09\b +\bD\0\0\0\0\0\0\0¢\v#\0Ak\"D\0\0\0\0\0\0\0p9\b +\bD\0\0\0\0\0\0\0p¢\v \0A+\0¢A+\0\"\xA0\" ¡\"A\xA0+\0¢ A+\0¢ \0\xA0\xA0\" ¢\"\0 \0¢ AÀ+\0¢A¸+\0\xA0¢ \0 A°+\0¢A¨+\0\xA0¢ ½\"§AtAðq\"+ø \xA0\xA0\xA0! ) B-|!\x07 E@| B\bP@ \x07B?}¿\"\0 ¢ \0\xA0D\0\0\0\0\0\0\0¢\f\v \x07Bð?|¿\" ¢\" \xA0\"D\0\0\0\0\0\0ð?c|#\0Ak\" B\b7\b +\bD\0\0\0\0\0\0\0¢9\bD\0\0\0\0\0\0\0\0 D\0\0\0\0\0\0ð?\xA0\"\0   ¡\xA0 D\0\0\0\0\0\0ð? \0¡\xA0\xA0\xA0D\0\0\0\0\0\0ð¿\xA0\"\0 \0D\0\0\0\0\0\0\0\0a\x1B \vD\0\0\0\0\0\0\0¢\v\v \x07¿\"\0 ¢ \0\xA0\v\vÐ~#\0Ak\"$\0@  L\r\0 AÀq\r\0@  k\"A AI\"\x1B\"\bE\r\0  :\0\0  \bj\"Ak :\0\0 \bAI\r\0  :\0  :\0 Ak :\0\0 Ak :\0\0 \bA\x07I\r\0  :\0 Ak :\0\0 \bA	I\r\0 A\0 kAq\"j\"\x07 AÿqA\bl\"6\0 \x07 \b kA|q\"j\"Ak 6\0 A	I\r\0 \x07 6\b \x07 6 A\bk 6\0 A\fk 6\0 AI\r\0 \x07 6 \x07 6 \x07 6 \x07 6\f Ak 6\0 Ak 6\0 Ak 6\0 Ak 6\0  \x07AqAr\"k\"A I\r\0 ­B~!	  \x07j!@  	7  	7  	7\b  	7\0 A j! A k\"AK\r\0\v\v E@@ \0 A Ak\"AÿK\r\0\v\v \0  \v Aj$\0\v×|~ \0½\"\bB0§! \bB÷?}BÿÿÿÿÿÂX@ \bBø?Q@D\0\0\0\0\0\0\0\0\v \0D\0\0\0\0\0\0ð¿\xA0\"\0 \0 \0D\0\0\0\0\0\0\xA0A¢\"\xA0 ¡\" ¢A°+\0\"¢\"\xA0\"\x07 \0 \0 \0¢\"¢\"   A+\0¢ Aø+\0¢ \0Að+\0¢Aè+\0\xA0\xA0\xA0¢ Aà+\0¢ \0AØ+\0¢AÐ+\0\xA0\xA0\xA0¢ AÈ+\0¢ \0AÀ+\0¢A¸+\0\xA0\xA0\xA0¢ \0 ¡ ¢ \0 \xA0¢  \0 \x07¡\xA0\xA0\xA0\xA0\v@ AðÿkA~M@ \0D\0\0\0\0\0\0\0\0a@#\0Ak\"D\0\0\0\0\0\0ð¿9\b +\bD\0\0\0\0\0\0\0\0£\v \bBøÿ\0Q\r AðÿqAðÿG AÿÿMqE@ \0 \0¡\"\0 \0£\v \0D\0\0\0\0\0\x000C¢½B\xA0}!\b\v \bBó?}\"	B4¹\"Aø+\0¢ 	B-§Aÿ\0qAt\"+\xA0\" + \b 	Bx}¿ +­¡ +­¡¢\"\0\xA0\" \0 \0 \0¢\"¢  \0A¨+\0¢A\xA0+\0\xA0¢ \0A+\0¢A+\0\xA0\xA0¢ A+\0¢ A+\0¢ \0  ¡\xA0\xA0\xA0\xA0\xA0!\0\v \0\vn \0A\0H@ \0AÁ~I@A\0\vA\0 \0k\"\0AvAüÿÿÿq\"(Î .\xA0Î \0Aqlk\v \0A¿K@Aÿÿ\v \0AvAüÿÿÿq\".\xA0Î \0Aql (ÀÎj\vÎ?'}|#\0AÐk\"\v$\0 \v\"\fA\x006 \0(\0!+ \0(!A~!@@@@@@@@@@@@  \0(\f\"A2m\" Au\"H\r\0  Au!  Au!\n  AmAl\"  H\x1B!@@@@@@@ AL@  \0(L\"  J\x1B!\f\v \r\vAê\x07!@ \0(P\r\0 \0(H\"\r\0 \0(\b l\"\0A\0L\r	 \0At\"\0E\r	 A\0 \0ü\v\0\f	\v   J@ !@ \0A\0A\0       H\x1BA\0\"A\0H@ !\f\v\v  \0(\b lAtj!  k\"A\0J\r\0\v\f	\v@   \"L\r\0  \n\"J\r\0 ! Aè\x07F\r\0    H\x1B  \n J\x1B!\vA!\"A\0! Aê\x07G\"\f\v \0(@!& \0(L! \0(D! \fA\xA0j  { Aê\x07G!A!' \0(H\"A\0L@A!\" \f\v@ Aê\x07G\r\0 Aê\x07F\r\0 \0(PE\rAê\x07!A!\"A\0\f\v Aê\x07F@A\0!Aê\x07!A!\"A\0\f\vA! Aê\x07G@A!\"A\f\v \0(\b l!\"A!#A\v!  N\rA\f\v \f \0(\b lAtAjApqk\"\"\v$\0 \0A\0A\0     J\x1BA\0  N@Aê\x07!A!#\f\vA\f\v \rA\0!\v E!A!\n\f\v \0 j!\x07 \v \n L\",A \0(\b \nl\vAtAjApqk\"($\0 \0(HAê\x07F@ \x07E\v \v! \0A\n Aè\x07l \0(\fm\" A\nL\x1B6 @@ '@ \0 \0(<6 \0 Aè\x07F &AÍ\bk\"AO\r A\xA0lAÀ>jAý\0\v6\v (  \n J\x1B! \0Aj!\n \0 \0(0AJ6( AtA \x1B! At!)A\0!@@ \0(8 E! \fA\xA0j! !A\0!A\0!\vA\0!*#\0Ak\"$\0 A\x006 B\x007@@@@@ \n(\"	AkAI@@ E\r\0 \x07A\x006Ô 	AF\r\0 \x07A\x006à4\v \x07(¨D 	H@ \x07A\"jM!\v \n(!	\v@ 	AG\r\0 \x07(¨DAG\r\0 \n(\f \x07(Aè\x07lF!*\v@@ \x07(Ô\r\0 	A\0L\r\0A\0!@A!A!@@@@@ \n(\"\b\0\v \bA(F\r \bA<G\r\0A!A!\f\vAÿï\0A;AÌ\0\vA!\f\vA!A!\v \x07 A\"lj\"	 6 	 6Ø \n(\f\"A\nuAj!\r A¸qA8G \rA\fGq\r \n(\b!A\0!@ \rAK\r\0A \rtA¢qE\r\0@@ 	(\"\bAk\0\0\vAÔ\0AØA,\0\v 	 \rAl\"6  \bl!\b@@@ \r 	(F@ 	( F\r\vA\0! 	Aj \rAè\x07l A\04! 	 6 	( \rG\r\vA! \b 	(F\r\v 	Aý\0A©ý\0 	(AF\"\x1BAðü\0Aý\0 \x1B \rA\bF\x1B6Ð E@ 	 \rAl6\xA0A¨!A\n!@@ \rA\bk\0\0\0\0\vAô!A!\v 	 6 	 6¤A\xA0!@@@ \rA\fk\0\0\0\0\v \rA\bF@A!\f\vAÿï\0AØAÙ\0\0\vA!\v 	A6È 	 6Ì 	A\x006¤! 	A\n:\0 	Aä\x006 	A\njA\0A\bü\v\0\v 	 \b6 	 \r6\v \f\vA·Ï\0AØA+\0\v \vj!\v Aj\" \n(\"	H\r\0\v\vA!@ \n(\0\"AG@ !\f\v 	AG\r\0 \x07(¤DAG@A!	 \x07(¨DAG\r\v \x07A\x006\xA0D \x07A\x006D \x07A5j \x07AjAü\n\0\0 \n(!	 \n(\0!\v \x07 	6¨D \x07 6¤DA¸~! \n(\bA÷kA¿Ç}I\r@ AF\r\0 \x07(Ô\r\0@ 	A\0L\r\0A\0!@ \x07 A\"lj\"(ØA\0J@ Aäj!\bA\0!@ \b Atj A\f6\0 Aj\" (ØH\r\0\v\v  A\f6ð Aj\" \n(\"	H\r\0\v 	A\0L\r\0@ \x07 A\"lj\"A\x006ü B\x007ô@ (ðE\r\0 Aôj!	 (Ø\"AF@ 	A6\0\f\v  AtAàj(\0A\b\b (Ø\"\bA\0L\r\0Aj!\r \bAq!A\0!A\0! \bAO@ \bAüÿÿÿ\x07q!A\0!@ 	 Atj \r vAq6\0 	 Ar\"\bAtj \r \bvAq6\0 	 Ar\"\bAtj \r \bvAq6\0 	 Ar\"\bAtj \r \bvAq6\0 Aj! Aj\" G\r\0\v E\r\v@ 	 Atj \r vAq6\0 Aj! Aj\" G\r\0\v\v Aj\" \n(\"	H\r\0\v\v \r\0 \x07(Ø\"A\0L\r\0 \x07Aôj! \x07A5j!\bA\0!@ 	A\0J@A!  At\"j\"(\0@@ 	AG\r\0  AjH \b j(\0\r\0  Ajy\v \x07  A @A Ak(\0\r\vA\0\vG   \x07,\0­ \x07,\0® \x07(F \n(!	\v 	AN@@ \x07 A\"lj\"\r j\"(ô@ \r  A @A Aðj(\0\r\vA\0\vG   \r,\0­ \r,\0® \r(F \n(!	\v Aj\" 	H\r\0\v\v \x07(Ø!\v Aj\" H\r\0\v\v 	AG\r@@@ \0\v  AjH \x07 \x07(ÔAtjAð4j(\0E\r\f\v \x07 \x07(ÔAtjAôj(\0AF\r\v  \x07.D6  \x07.D6\f\vAÿï\0A;AÒ\0\vAÖ\0A;A¥\0\v  AjH \x07 \x07(ÔAtjA5j(\0\r\v  Ajy\f\v A\x006\v@ \n(\"AG\r\0 (\r\0A! \x07(¬DAG\r\0 \x07A,jA\0A\bü\v\0 \x07A\x006°C \x07A\n:\04 \x07Aä\x0064 \x07A6Ô4 \n(!\vA!  \x07(Aj lAtAjApqk\"\x1B$\0  \x1B6\0  \x1B \x07(AtjAj\"$6@@@@ E@ \n(! (E!\f\v \n(! \x07(¬DE\r\0A\0! AG\r\0 AG\r\0 \x07 \x07(à4AtjA5j(\0 \x07 \n(6\"AF!\f\v \x07 \n(6\" A\0L\r\vA!A\0A \x07(Ô\"\bA\0L\"\x1B!	@ \r\0 AG\r\0AA\0 \x07 \bAtjAðj(\0\x1B!	\v \x07  \x1BAj Aj  	n \n(! \x07 \x07(ÔAj6Ô \vj!\v AH\r\0@@ @ \x07 A\"lj\"\b   Atj(\0Aj Aj A\0 \x07(Ô k\"A\0L\r\0 AF@AA\0 At \bjAðj(\0\x1B\f\vAA \x07(¬D\x1B\vn \vj!\v\f\v (At\"E\r\0  Atj(\0AjA\0 ü\v\0\v \x07 A\"lj\" (ÔAj6Ô Aj\" \n(\"H\r\0\v AG\r\0 \n(\0AG\r\0 \x07(! (!% \x1B \x07AÄ\0j\"!(6\0 $ !(\b6\0 ! \x1B %At\"j(\x006 !  $j(\x006\bA At\"m! (! (! A\0J@ Á\"  !/\"kÁlAuAjAu!	   !/\0\"kÁlAuAjAu!\rA\0!@ $ Aj\"At\"j\"AÿÿA~ 	 j\"Á\"\b  \x1Bj.\0\"Aul .\0A\btj A\vtAðq \blAuj \r j\"Á\"\b A\nt \x1B Atj\". .\0jA	tj\"Aulj Aüq \blAujA\x07uAjAu\" A~L\x1B\" AÿÿN\x1B;\0 \" G\r\0\v\v  %H@ Á! Á!@ At!\b $ Aj\"At\"j\"AÿÿA~  \x1Bj.\0\"Au l .\0A\btj A\vtAðq lAuj A\nt \b \x1Bj\". .\0jA	tj\"Au lj Aüq lAujA\x07uAjAu\" A~L\x1B\" AÿÿN\x1B;\0  %G\r\0\v\v ! ; ! ;\0 %A\0J@A\0!@ \x1B Aj\"At\"j\"A~Aÿÿ .\0\"  $j\"\b.\0\"j\" AÿÿN\x1B\" A~L\x1B;\0 \bA~Aÿÿ  k\" AÿÿN\x1B\" A~L\x1B;\0  %G\r\0\v\v (!\f\v \x1B \x07(D6\0 \x07 \x1B (\"Atj(\x006D\v \f \n(\b l \x07.Aè\x07lm\"6 \x1B AtAjApqk\"$\0 \n(\0\" \n(\"  J\x1BA\0J@A\0!@ \x07 A\"ljAj   At\"j(\0Aj (!\r \f(!@ \n(\0\"AG@ A\0L\r Aq!A\0!	A\0! AO@ Aüÿÿÿ\x07q!A\0!@  Atj  Atj.\0²C\0\0\x0088\0  Ar\"\bAtj  \bAtj.\0²C\0\0\x0088\0  Ar\"\bAtj  \bAtj.\0²C\0\0\x0088\0  Ar\"\bAtj  \bAtj.\0²C\0\0\x0088\0 Aj! Aj\" G\r\0\v E\r\v@  Atj  Atj.\0²C\0\0\x0088\0 Aj! 	Aj\"	 G\r\0\v\f\v A\0L\r\0  j!	A\0! AG@ Aq Aþÿÿÿ\x07q!A\0!@ 	 Atj  Atj.\0²C\0\0\x0088\0 	 Ar\"\bAtj  \bAtj.\0²C\0\0\x0088\0 Aj! Aj\" G\r\0\vE\r\v 	 Atj  Atj.\0²C\0\0\x0088\0\v \v \rj!\v Aj\"  \n(\"  J\x1BH\r\0\v\v@@@ AG\r\0 AG\r\0 *\r A\0L\r\0 Aq!\bA\0!	A\0! AO@ Aüÿÿÿ\x07q!A\0!@  Atj\" *\x008  *\b8\f  *8  *8 Aj! Aj\" G\r\0\v \bE\r\v@  Atj\" *\x008 Aj! 	Aj\"	 \bG\r\0\v\v \v!\f\v \x07A5j  \x1BAj ( \vj! \f(\"\vA\0L\r\0A\0! \vAG@ \vAq \vAþÿÿÿ\x07q!\bA\0!	@  Atj  Atj.\0²C\0\0\x0088  Ar\"\vAtj  \vAtj.\0²C\0\0\x0088 Aj! 	Aj\"	 \bG\r\0\vE\r\v  Atj  Atj.\0²C\0\0\x0088\v \n \x07(¤!AF \x07(A\bkA|qA«j(\0 \x07(lA\0\v6@ AF@ \x07(¨D\"\vA\0L\r \vA\x07q!A\0!\bA\0! \vA\bO@ \vAøÿÿÿ\x07q!\vA\0!	@ \x07 A\"lj\"A\n:\0Ü A\n:\0ÐÞ A\n:\0Ä¼ A\n:\0¸ A\n:\0¬x A\n:\0\xA0V A\n:\04 A\n:\0 A\bj! 	A\bj\"	 \vG\r\0\v E\r\v@ \x07 A\"ljA\n:\0 Aj! \bAj\"\b G\r\0\v\f\v \x07 (6¬D\v\v Aj$\0@ E@ \0(\b\" \f(\"\vl!\r\f\v E\r \f 6@ \0(\b\" l\"\rA\0L\r\0  )l\"E\r\0 A\0 ü\v\0\v !\v\v  \rAtj! \v j\" H\r\0\v@ ,\r\0  )l\"E\r\0  ( ü\n\0\0\v !\vA\0!@ ' E\"qE@A\0!\f\vA! \f(¼g \f(´AAq Aé\x07F\x1Bjj AtJ@A\0!\f\v@ Aé\x07F@ \fA\xA0jA\f\fE@Aé\x07!A\0!\f\v \fA\xA0j\"A\f! A&Aj!\x07 \f(¼g! \f(´!\r\f\v \fA\xA0jA\f!  \f(´\"\r \f(¼g\"jAkAuk!\x07\vA\0!\n \f \f(¤ \x07A\0  \x07k\"At\" \r jA k\"N\x1Bk6¤ A\0G!A!  L\rA\0!\v \v \"AtAjApqk\"\"\v$\0A! #E@A\0!#A!\nA\0!\x07\f\vA\0!\x07 \0A\0A\0     J\x1BA\0A!\nA!# !\f\vA}\f\v \0Aý\x006Aÿï\0A¸'A´\0\vA!A\0!#\v \0 +j!\bA\r!@@@@@@ &AÍ\bk\0\vA!\f\vA!\f\vA!\v \f 6 \bAÎ\0 \fAj\vE\rAÕÃ\0A¸'Aº\0\v &\r\r\v \f \0(<6 \bAÎ\0 \fAj\v\r \n@ \vAk\"\r$\0A\0\f\v \v \0(\b lAtAjApqk\"\r$\0A\0 E\r\0 \fA\x006p \bAÎ\0 \fAð\0j\v\r \b  j \x07 \r A\0> \f \fAj6` \bA¿ \fAà\0j\v\rA\v! \f 6P \bAÎ\0 \fAÐ\0j\v\r@ Aè\x07G@@  \0(H\"F\r\0 A\0L\r\0 \0(P\r\0 \bA¼A\0\v\r	\v \b A\0 \x1B        J\x1B \fA\xA0j a! \f \0Aà\0j6@ \bA¿ \fA@k\v\f\v \fAÿÿ;@ \0(HAé\x07G\r\0 @ \0(P\r\v \fA\x0060 \bAÎ\0 \fA0j\v\r	 \b \fAjA   >\v \0 \f(¼6`A\0!\v \f \fAj6  \bAÎ\0 \fA j\v\r\b \f((<!@ \n r\"Aq\r\0 \bA¼A\0\v\r\n \fA\x006 \bAÎ\0 \fAj\v\r\v \b  j \x07 \r A\0> \f \fAj6\0 \bA¿ \f\v\r\fA÷ \0(\fm!\x07 \0(\b\"\bA\0L\r\0 \r \b lAtj!  \b  klAtj!A\0!\n A\0L!\v@A\0! \vE@@   \bl \njAt\"j\"   \x07lAtj*\0\"- -\"-  j*\0C\0\0? - *\08\0 Aj\" G\r\0\v\v \nAj\"\n \bG\r\0\v\v@ E\r\0 \0(HAè\x07F@ \0(PE\r\v \0(\b\"\bA\0L\r\0 Aüÿÿÿ\x07q!\x07 Aq!A\0!\v A\0L! AI!@@ \r\0A\0!A\0!A\0!A\0!\n E@@   \bl \vjAt\"j  \rj*\x008\0  Ar \bl \vjAt\"j  \rj*\x008\0  Ar \bl \vjAt\"j  \rj*\x008\0  Ar \bl \vjAt\"j  \rj*\x008\0 Aj! Aj\" \x07G\r\0\v !\n E\r\v@  \b \nl \vjAt\"j  \rj*\x008\0 \nAj!\n Aj\" G\r\0\v\v \vAj\"\v \bG\r\0\vA÷ \0(\fm!\x07  \b lAt\"j!  \rj!A\0!\n A\0L!\v@A\0! \vE@@   \bl \njAt\"j\"   \x07lAtj*\0\"- -\"- *\0C\0\0? -  j*\08\0 Aj\" G\r\0\v\v \nAj\"\n \bG\r\0\v\v@ #E\r\0 \0(\b!  N@@  l\"A\0L\r\0 Aq!\vA\0!\rA\0! AO@ Aüÿÿÿ\x07q!A\0!\n@  At\"j  j*\x008\0  Ar\"j  j*\x008\0  A\br\"j  j*\x008\0  A\fr\"j  j*\x008\0 Aj! \nAj\"\n G\r\0\v \vE\r\v@  At\"j  j*\x008\0 Aj! \rAj\"\r \vG\r\0\v\vA÷ \0(\fm!\x07 A\0L\r  At\"j!  j!A\0!\n A\0L!\v@A\0! \vE@@   l \njAt\"j\"   \x07lAtj*\0\"- -\"- *\0C\0\0? -  j*\08\0 Aj\" G\r\0\v\v \nAj\"\n G\r\0\v\f\vA÷ \0(\fm! A\0L\r\0A\0!\n A\0L!\v@A\0! \vE@@   l \njAt\"j\"   lAtj*\0\"- -\"- *\0C\0\0? -  j*\08\0 Aj\" G\r\0\v\v \nAj\"\n G\r\0\v\v@ \0(,\"E\r\0 \0(\b ²C-*:»Dï9úþB.æ?¢!. l\"A\0L\r\0 .¶!- Aq!A\0!A\0! AO@ Aüÿÿÿ\x07q!A\0!@  Atj\"\v \v*\0 -8\0 \v \v* -8 \v \v*\b -8\b \v \v*\f -8\f Aj! Aj\" G\r\0\v E\r\v@  Atj\" *\0 -8\0 Aj! Aj\" G\r\0\v\v@ AL@ \0A\x006`\f\v \0 \0(` \f(s6`\v \0 6H \0 AsAq6P   A\0H\x1B\v!\v \fAÐj$\0 \vA¶Â\0A¸'A¼\0\vAéÅ\0A¸'AÊ\0\vAäÆ\0A¸'AÍ\0\vAÜÄ\0A¸'AÑ\0\vAïÁ\0A¸'AÜ\0\vAéÅ\0A¸'Að\0\vAõÇ\0A¸'Aø\0\vAïÁ\0A¸'Aÿ\0\vAéÅ\0A¸'A\0\vAäÆ\0A¸'A\0\vAÿï\0A¸'A·\0\v'\x07}#\0A k\"$\0  \b6  6A!\v \0(!\f \0(! \0(\f!	 \0(\0! \0(\b\"\n(`!\r \n(d!@@ AF\r\0   \r \n(\b Ajl\"Atj 	Atj.\0j\"\n \n-\0\0j-\0\0A\fjL\r\0 AI\r\0  Av\"Atj!	 AF@  \bAq \bAtr6\v \0   	  Aj AjAu\"\b  Ak\"A\0 Ajf (!\f (\b² (²! (!\v (\f!@ AH\r\0 \fAÿÿ\0qE\r\0 \fAÀ\0N@  A kuk!\f\v  AtA kuj\"Au q!\vC\0\0\x008!\x1B C\0\0\x008! (! \0 \0(  \vk\"\n6   AtjA\0 \x1B!\r (!\v   kAm\"  J\x1B\"A\0 A\0J\x1B\"  k\"N@ \0    \b   \x07  \v\x1B \0 	  \0(  \nk j\"\0AkA\0 \f\x1BA\0 \0AJ\x1B j \b \r  \x07 \x1B \v \bu\x1B Autr!\f\v \0 	   \b \r  \x07 \x1B \v \bu\x1B!	 \0   \0(  \nk j\"\0AkA\0 \fAG\x1BA\0 \0AJ\x1B j \b   \x07  \v\x1B 	 Autr!\f\v  \r Atj 	Atj.\0j\"-\0\0\"\nAjAv\"	A\0 Ak\"  	j-\0\0J\"\r\x1B\" \n 	 \r\x1B\"\njAjAv\"	    	j-\0\0J\"\r\x1B\" \n 	 \r\x1B\"\njAjAv\"	    	j-\0\0J\"\r\x1B\" \n 	 \r\x1B\"\rjAjAv\"	    	j-\0\0J\"\x1B\"\n \r 	 \x1B\"	r 	 \nsAvk\"\r \n   \rj-\0\0J\"\n\x1B\" 	 \r \n\x1B\"\rjAjAv\"	    	j-\0\0J\"\x1B\"\n@  \nj-\0\0!\v\v@ \r 	 \x1B\"	 \n  \vk  	j-\0\0 kJ\x1B\"E\r\0 \0 \0( \"\v  j-\0\0Asj\"	6 @ 	A\0N\r\0 \0 \v6  Ak\"E\r@ \0 \v  j-\0\0Asj\"	6  	A\0N\r \0 \v6  Ak\"\r\0\v\f\v A\bO@ A\x07qA\br AvAkt!\v @ \0(, ! \x07! \0(!A\0!	A\0!#\0\"\0!@ A\0J@A! AL\"\b\r \0 At\"A\x1BjApqk\"\v$\0  A   C !A\0!\0#\0 AjApq\"k\"\n k!A  \b\x1B\"\rAt\"@ \nA\0 ü\v\0\v !@ \rAk\"@ \rAq \rAþÿÿÿ\x07q!@  	At\"j  j\"*\0\"\x07C\0\0\0\0]6\0  \x078\0  \vjA\x006\0  Ar\"j  j\"*\0\"\x07C\0\0\0\0]6\0  \x078\0  \vjA\x006\0 	Aj!	 \0Aj\"\0 G\r\0\vE\r\v  	At\"\0j \0 j\"*\0\"\x07C\0\0\0\0]6\0  \x078\0 \0 \vjA\x006\0\vC\0\0\0\0!\x07  AuJ@ \rAq!	A\0!\0A\0!@ AN@ \rAüÿÿÿ\x07q!A\0!@   Atj\"\b*\0 \b* \b*\b \b*\f! Aj! Aj\" G\r\0\v 	E\r\v@   Atj*\0! Aj! \0Aj\"\0 	G\r\0\v\v ²CÍÌL?C\0\0? C\0\0B] C}&^q}  Aü6\0A  AL\x1BAtAk\"\0@ AjA\0 \0ü\v\0\vC\0\0?\v!A\0!C\0\0\0\0!@ \v At\"\0j  \0 j*\0\"ü\0\"\b6\0 \0 \nj \b²\"\x1B \x1B8\0  \x1B !  \bk! \x1B \x1B \x07!\x07 Aj\" \rG\r\0\v\v@ Aj H@ \n*\0 \v \v(\0 j6\0 ²\"\x1B \x1B \x1B \x07!\x07\f\v A\0L\r\0A  AL\x1BAk\"\0A~q! \0Aq! *\0!!A\0! AH!@ \x07C\0\0?\"  \n*\0!\x07  !\"\x1B \x1B!\x1BA!A\0!	A\0!\0@ E@@ \x07   At\"\bj*\0\" \" \x1B   \b \nj*\0\"^@ !\x1B !\x07 !\0\v \x07   Aj\"\bAt\"j*\0\" \" \x1B   \n j*\0\"^@ !\x1B !\x07 \b!\0\v Aj! 	Aj\"	 G\r\0\v E\r\v \x07   At\"\bj*\0\"\x07 \x07 \x1B   \b \nj*\0^E\r\0 !\0\v  \0At\"\0j*\0!\x1B \0 \nj\" *\0\"\x07C\0\0\0@8\0 \0 \vj\"\0 \0(\0Aj6\0   \x07!\x07  \x1B! Aj\" G\r\0\v\vA\0!@ @ \rAq \rAþÿÿÿ\x07q!	A\0!\0@ \v At\"j\"\n \n(\0A\0  j(\0\"\nks \nj6\0 \v Ar\"j\"\n \n(\0A\0  j(\0\"ks j6\0 Aj! \0Aj\"\0 	G\r\0\vE\r\v \v At\"\0j\" (\0A\0 \0 j(\0\"\0ks \0j6\0\v AN@A  n\"\b \bAM\x1B\"\0Aüÿÿÿ\x07q! \0Aq!\n \bAI!A\0!@ \v \b lAtj!\rA\0!\0A\0!	A\0!A\0!@ E@@ \r \0Atj\"(\f (\b ( (\0 rrrr! \0Aj!\0 	Aj\"	 G\r\0\v \0! \nE\r\vA\0!\0@ \r Atj(\0 r! Aj! \0Aj\"\0 \nG\r\0\v\v A\0G t r! Aj\" G\r\0\v\v@@ A\0J@ AL\r \v Ak\"\0Atj(\0\" Au\"s k! Av!	@  \0Ak\"k\"\b   \bJ\x1BAtAÀ£j(\0 \b   \bH\x1BAtj(\0 	j!	  \v Atj(\0\"\n \nAu\"\rs \rkj! \nA\0H@ 	 Aj\"\n \b  \bH\x1BAtAÀ£j(\0 \b \n \b \nJ\x1BAtj(\0j!	\v \0AK !\0\r\0\v \f 	  Aj\"\0 \0 J\x1BAt(À£  \0 \0 H\x1BAtj(\0    H\x1BAt(À£    J\x1BAtj(\0j%\f\vAûÝ\0AAÏ\0\vAòÓ\0AAÀ\0\v @ Aq!\f C\0\0? \x07!\x07A\0!\0A\0!@ AO@ Aüÿÿÿ\x07q!	A\0!@  At\"\bj \x07 \b \vj(\0²8\0  \bAr\"\nj \x07 \n \vj(\0²8\0  \bA\br\"\nj \x07 \n \vj(\0²8\0  \bA\fr\"\bj \x07 \b \vj(\0²8\0 Aj! Aj\" 	G\r\0\v \fE\r\v@  At\"j \x07  \vj(\0²8\0 Aj! \0Aj\"\0 \fG\r\0\v\v  A   C\v $\0 \f\vA÷A(A²\0\vA¥\rA(A³\0\v!\f\v ! !\v !\bA\0!	A\0!\r#\0\"\0!@ A\0J@ AL\r Aq! \0 AtAjApqk\"$\0 \x07C\0\0?} !C\0\0\0\0!\x07 \f \"\0 \"Aj\" \0 H\x1BAtAÀ£j(\0 \0  \0 J\x1BAtj(\0 \0  \0 H\x1BAtAÀ£j(\0 \0  \0 J\x1BAtj(\0j&!\f A\0J@ \0AN@ \0AG@@@@ \0\" L@ \0At\"(À£\" j(\0 \fA\0  Atj\"(\"\n \n \fK\"\x1Bk\"\nK\r !\0 (\0\"\f \nM\r@  \0Ak\"\0Atj(\0\"\f \nK\r\0\v\f\v At\"\n At\"AÄ£j(\0j(\0!\0@ \f AÀ£j(\0 \nj(\0\"I\r\0 \0 \fM\r\0 A\x006\0 \f k\f\v \fA\0 \0 \0 \fK\"\x1Bk!\f !\0@ \f \0Ak\"\0AtAÀ£j(\0 \nj(\0\"I\r\0\v   \0k\"A\0 k \x1BÁ\"6\0 ²\"\x1B \x1B \x07!\x07 \0! \f k\f\v@ \0Ak\"\0AtAÀ£j(\0 j(\0\"\f \nK\r\0\v\v   \0k\"A\0 k \x1BÁ\"6\0 ²\"\x1B \x1B \x07!\x07 \0! \n \fk\v!\f Ak!\0 Aj! AJ\r\0\v\v A\0  At\"\0AsA\0 \0 \fI\"\x1B \fj\"Aj\"\fAv\"\0k\"\nk \n \x1BÁ\"6\0  \0  \fA~qAkA\0 \0\x1Bk\"\0kA\0 \0ksÁ\"\x006 \0²\"\x1B \x1B ²\"\x1B \x1B \x07\f\vAÛ\0AAÚ\0\vAûÝ\0AAÙ\0\v!\x07A\0!\0@ AO@ Aüÿÿÿ\x07q!@  \0At\"j \x07  j(\0²8\0  Ar\"j \x07  j(\0²8\0  A\br\"j \x07  j(\0²8\0  A\fr\"j \x07  j(\0²8\0 \0Aj!\0 	Aj\"	 G\r\0\v E\r\v@  \0At\"j \x07  j(\0²8\0 \0Aj!\0 \rAj\"\r G\r\0\v\v  A \b  \vCA! \bAN@A  \bn\" AM\x1B\"\0Aüÿÿÿ\x07q!\v \0Aq! AI!\nA\0!A\0!@   lAtj!\fA\0!A\0!	A\0!A\0!\0@ \nE@@ \f Atj\"(\f (\b ( (\0 \0rrrr!\0 Aj! 	Aj\"	 \vG\r\0\v ! E\r\vA\0!@ \f Atj(\0 \0r!\0 Aj! Aj\" G\r\0\v\v \0A\0G t r! Aj\" \bG\r\0\v\v $\0 \f\vAºA(Aõ\0\vAã\fA(Aö\0\v!\f\v \0(E@A\0!\f\v \bA tAs\"q\"E@A\0! At\"\0E\r A\0 \0ü\v\0\f\v \0((!@ @A\0! AG@ Aq Aþÿÿÿ\x07q!\vA\0!\b@  At\"j  j*\0C\0\0;C\0\0» AÌå\0lAßæ»ãjAq\x1B8\0  Ar\"j  j*\0C\0\0;C\0\0» A©¹á¹lA²ÒÀºj\"Aq\x1B8\0 Aj! \bAj\"\b \vG\r\0\vE\r\v  At\"j  j*\0C\0\0;C\0\0» AÌå\0lAßæ»ãj\"Aq\x1B8\0\f\v Aq!\vA\0!\b@@ AI@A\0!\f\v Aüÿÿÿ\x07q!	A\0!A\0!@  Atj\"\f \"AÏçË\0lAÌÙ¨k\"Au²8\f \f A¤úzlAÌñkAu²8\b \f A©¹á¹lA²ÒÀºjAu²8 \f AÌå\0lAßæ»ãjAu²8\0 Aj! Aj\" 	G\r\0\v \vE\r\v@  Atj AÌå\0lAßæ»ãj\"Au²8\0 Aj! \bAj\"\b \vG\r\0\v\v !\v \0 6( \0(,   \x07B\v A j$\0 \vsA\0 \0A\0H\r\0Aÿÿÿÿ\x07 \0AþK\r\0 \0Aÿ\0q!A \0A\x07v\"t! \0AÿM A klAÒ~lAu j tA\x07u A klAÒ~lAu j A\x07vl\v j\v\vN  \0(\b\" \0(jO@ @ \0(\0\" j k  \0(j k ü\n\0\0\v \0 6\vA÷A¨.Aù\0\v\xA0 \0-\0\0A qE@@ \0(\"  \0\r \0(\v \0(\"k I@ \0   \0($\0\f\v@@ \0(PA\0H\r\0 E\r\0 !@  j\"Ak-\0\0A\nG@ Ak\"\r\f\v\v \0   \0($\0 I\r  k! \0(!\f\v !\v !@ AO@ @   ü\n\0\0\v\f\v  j!@  sAqE@@ AqE\r\0 E\r\0@  -\0\0:\0\0 Aj! Aj\"AqE\r  I\r\0\v\v A|q!@ AÀ\0I\r\0  A@j\"K\r\0@  (\x006\0  (6  (\b6\b  (\f6\f  (6  (6  (6  (6  ( 6   ($6$  ((6(  (,6,  (060  (464  (868  (<6< A@k! A@k\" M\r\0\v\v  O\r@  (\x006\0 Aj! Aj\" I\r\0\v\f\v AI\r\0 AI\r\0 Ak!@  -\0\0:\0\0  -\0:\0  -\0:\0  -\0:\0 Aj! Aj\" M\r\0\v\v  I@@  -\0\0:\0\0 Aj! Aj\" G\r\0\v\v\v \0 \0( j6\v\v\vW~@AÚ(\0\"­ \0­B\x07|Bøÿÿÿ|\"BÿÿÿÿX@ §\"\0?\0AtM\r \0\r\vA\xA0ÛA06\0A\vAÚ \x006\0 \vù	A g\"\nk! \" AN@@@ Ak\"\vAv\"E@ !\f\v AjA~q!\b !@  Atj\"\x07.\"\f \fl \x07.\"\f \flj v  \x07.\" l \x07.\0\" lj vjj! Aj! 	Aj\"	 \bG\r\0\v \vAq\r\v   Atj\".\" l .\0\" lj vj!\v Aþÿÿÿ\x07q!\v J@   Atj.\0\" l vj!\vA\0!A\" \n gjk\"A\0 A\0J\x1B!A\0! AN@@@ Ak\"\nAv\"E@A\0!\f\v AjA~q!\vA\0!A\0!	@  Atj\"\x07.\"\b \bl \x07.\"\b \blj v  \x07.\" l \x07.\0\" lj vjj! Aj! 	Aj\"	 \vG\r\0\v \nAq\r\v   Atj\".\" l .\0\" lj vj!\v Aþÿÿÿ\x07q!\v  J@  Atj.\0\" l v j!\v  6\0 \0 6\0\v\v~#\0AÀk\"$\0@@ A\nk\x07\0\0\0\0\0\0\vAÏ\0A\xA0=AÙ\0\0\vA°ø\0AÀø\0 AF\x1B!@ Aàj  j-\0\0Atj  Atj.\0\"\bA\buAtA\xA0ö\0j\". .\0\"k \bAÿql A\btjAuAjAu6\0 Aj\" G\r\0\v A6\xA0 A\0 (àk6¤ Av!A!@ A\xA0j\" \"Aj\"Atj At j\"Ak\"\b(\0At Aàj Atj(\0\"	¬\" 4\0~BB|B§k6\0@ AI\r\0 \x07Aq@  (\0 A\bk(\0j \b4\0 ~BB|B§k6\0 Ak!\v \x07AF\r\0@ A\xA0j Atj\" A\bk(\0\"\b (\0j Ak\"\v(\0\"\f¬ ~BB|B§k6\0 \v \f A\fk(\0j \b¬ ~BB|B§k6\0 AJ Ak!\r\0\v\v  (¤ 	k6¤ \x07Aj!\x07  G\r\0\v A6`A\0!\x07 A\0 (äk6d AàjAr!\bA!@ Aà\0j\" \"Aj\"Atj At j\"Ak\"	(\0At \b Atj(\0\"\v¬\" 4\0~BB|B§k6\0@ AI\r\0 \x07Aq@  (\0 A\bk(\0j 	4\0 ~BB|B§k6\0 Ak!\v \x07AF\r\0@ Aà\0j Atj\" A\bk(\0\"	 (\0j Ak\"\f(\0\"\n¬ ~BB|B§k6\0 \f \n A\fk(\0j 	¬ ~BB|B§k6\0 AJ Ak!\r\0\v\v  (d \vk6d \x07Aj!\x07  G\r\0\v @  Atj!	 (`! (\xA0!A\0!@  AtjA\0  Aj\"\x07At\"\v A\xA0jj(\0\"\bj\"\f Aà\0j \vj(\0\" k\"jk6\0 	 AsAtj  \fk6\0 ! \b! \x07\" G\r\0\v\vA\0!A\0!\x07 Aþÿÿÿ\x07q!	 Aq!\v Ak!\b@@@@ A\0L@A\0!\f\vA\0!A\0!A\0! \b@@  Ar\"\fAtj(\0\"\n \nAu\"\ns \nk\"\n  Atj(\0\"\r \rAu\"\rs \rk\"\r   \rI\"\r\x1B\"  \nI\"\n\x1B! \f   \r\x1B \n\x1B! Aj! Aj\" 	G\r\0\v \vE\r\v  Atj(\0\" Au\"s k\"   I\"\x1B!   \x1B!\v AvAjAv\"AO@  A¾ÿAþÿ	  Aþÿ	O\x1B\"AtAÿÿk  AjlAvnk; \x07Aj\"\x07A\nG\r\f\v\v \x07A\nF\r\0 A\0L\r@ \bE@A\0!\f\v Aq Aþÿÿÿ\x07q!\x07A\0!A\0!@ \0 Atj  Atj(\0AuAjAu;\0  Ar\"\bAtj(\0! \0 \bAtj AuAjAu;\0 Aj! Aj\" \x07G\r\0\vE\r\v \0 Atj  Atj(\0AuAjAu;\0\f\v A\0L\r\0A\0!@ \0 AtjAÿÿ  Atj\"(\0Au\"AþÿJ\r\0A~ Aÿÿ{H\r\0 AjAu\v\";\0  At6\0 Aj\" G\r\0\v\v@ \0 U\r\0 A~q!\x07 Aq!\bA\0!@  A~ tAj;A\0!A\0!@ AG@@ \0 Atj  Atj(\0AvAjAv;\0 \0 Ar\"Atj  Atj(\0AvAjAv;\0 Aj! Aj\" \x07G\r\0\v ! \bE\r\v \0 Atj  Atj(\0AvAjAv;\0\v \0 U\r AI Aj!\r\0\v\v AÀj$\0\v| AJ@ Ak!@ \x07 \0 At\"A\fr\"j*\0»  j*\0»¢ \0 A\br\"j*\0»  j*\0»¢ \0 j*\0»  j*\0»¢ \0 Ar\"j*\0»  j*\0»¢\xA0\xA0\xA0\xA0!\x07 Aj\" H\r\0\v Aüÿÿÿ\x07q!\v@  L\r\0 Ar! Aq@ \0 At\"j*\0»  j*\0»¢ \x07\xA0!\x07 !\v  F\r\0@ \0 At\"Aj\"j*\0»  j*\0»¢ \0 j*\0»  j*\0»¢ \x07\xA0\xA0!\x07 Aj\" G\r\0\v\v \x07\v¬\fA!\f@  Alj! \0 Atj!\x07Aÿÿÿÿ\x07!	A\0!@@ 	 \x07(\0 Aj\"\rAt.\xA0 At.\xA0\"\bk\"AÿÿqA3l AvAèÌljAu\"\n \bj\"k\" Au\"s k\"\vM@ -\0\0!\f\v A\0:\0  :\0\0 \v \x07(\0 \nAl \bj\"k\" Au\"s k\"M@ !\f\v A:\0  \x07(\0 \nAl \bj\"k\" Au\"s k\"	M\r A:\0 	 \x07(\0 \nA\x07l \bj\"k\" Au\"s k\"\vM@ !\f\v A:\0 \v \x07(\0 \nA	l \bj\"k\" Au\"s k\"	M@ !\f\v A:\0 \r\"AG\r\0\vA!\v  ÀAm\":\0  A}l j:\0\0 \x07 6\0A! \fA\0!\f\r\0\v \0 \0(\0 \0(k6\0\vn \0,\0\0\"Aÿq!\0 A\0H@  \0AvAqtAm\v \0Aà\0qAà\0F@ \0A\bq@ A2m\v Aä\0m\v \0AvAq\"\0AF@ A<lAè\x07m\v  \0tAä\0m\v AK@ Ak\"AO@ \0 A g\"k\"v\" Aj  vAj2Aÿÿÿ\x07 v q! \0(\f! \0(\" j\"A!O@@A! \0 \0(\" \0(\b\"\x07 \0(jK \0 \x07Aj\"6\b \0(\0  kj :\0\0A\0A\v \0(,r6, A\bv! AJ A\bk!\r\0\v  j!\v \0 6 \0  t r6\f \0 \0( j6\v \0  Aj 2\vAÛ\0A¨.A¿\0\võ\f AK@@ Ak\"\nAO@ \0 \0(\" \nA \ng\"\vk\"\x07v\"Aj\"n\"6$ \0 \0( \"    nAj\"k\"\bA\0  \bO\x1B\"\fk l\"k\"6  \0  k   I\x1B\"6 AM@ \0(! \0((! \0(! \0(!\r@ \0 A\bt\"\b6 \0 A\bj\"6A\0!  \rI@ \0 Aj\"	6 \0(\0 j-\0\0! 	!\v \0 6( \0  A\btrAvAÿq A\btAþÿÿ\x07qrAÿs\"6  AI ! \b!\r\0\v\v \f \x07t!\b \0(\f!@ \x07 \0(\"M@ !\f\v \0(\b! \0(!@A\0!  I \0 Aj\"6\b \0(\0  kj-\0\0A\0\v t r! AH A\bj\"!\r\0\v\v \0  \x07k6 \0  \x07v6\f \0 \0( \x07j6 Aÿÿÿ\x07 \vvq \br\"\x07 \nM\r \0A6, \n\v \0 \0(\" n\"6$ \0 \0( \"    nAj\"k\"A\0  O\x1B\"\x07Asj l\"k\"6  \0   k  K\x1B\"6 AK\r\0 \0(! \0((! \0(! \0(!\n@ \0 A\bt\"\b6 \0 A\bj\"6A\0!  \nI@ \0 Aj\"	6 \0(\0 j-\0\0! 	!\v \0 6( \0  A\btrAvAÿq A\btAþÿÿ\x07qrAÿs\"6  AI ! \b!\r\0\v\v \x07\vAÛ\0Aî.Aà\0\v\f\b@ \0E\r\0 \0A\bk\" \0Ak(\0\"Axq\"\0j!@ Aq\r\0 AqE\r  (\0\"k\"A´Û(\0I\r \0 j!\0@@@A¸Û(\0 G@ (\f! AÿM@  (\b\"G\rA¤ÛA¤Û(\0A~ Avwq6\0\f\v (!\x07  G@ (\b\" 6\f  6\b\f\v (\" Aj (\"E\r Aj\v!@ ! \"Aj! (\"\r\0 Aj! (\"\r\0\v A\x006\0\f\v (\"AqAG\rA¬Û \x006\0  A~q6  \0Ar6  \x006\0\v  6\f  6\b\f\vA\0!\v \x07E\r\0@ (\"At\"(ÔÝ F@ AÔÝj 6\0 \rA¨ÛA¨Û(\0A~ wq6\0\f\v@  \x07(F@ \x07 6\f\v \x07 6\v E\r\v  \x076 (\"@  6  6\v (\"E\r\0  6  6\v  O\r\0 (\"AqE\r\0@@@@ AqE@A¼Û(\0 F@A¼Û 6\0A°ÛA°Û(\0 \0j\"\x006\0  \0Ar6 A¸Û(\0G\rA¬ÛA\x006\0A¸ÛA\x006\0\vA¸Û(\0\"\x07 F@A¸Û 6\0A¬ÛA¬Û(\0 \0j\"\x006\0  \0Ar6 \0 j \x006\0\v Axq \0j!\0 (\f! AÿM@ (\b\" F@A¤ÛA¤Û(\0A~ Avwq6\0\f\v  6\f  6\b\f\v (!\b  G@ (\b\" 6\f  6\b\f\v (\" Aj (\"E\r Aj\v!@ ! \"Aj! (\"\r\0 Aj! (\"\r\0\v A\x006\0\f\v  A~q6  \0Ar6 \0 j \x006\0\f\vA\0!\v \bE\r\0@ (\"At\"(ÔÝ F@ AÔÝj 6\0 \rA¨ÛA¨Û(\0A~ wq6\0\f\v@  \b(F@ \b 6\f\v \b 6\v E\r\v  \b6 (\"@  6  6\v (\"E\r\0  6  6\v  \0Ar6 \0 j \x006\0  \x07G\r\0A¬Û \x006\0\v \0AÿM@ \0AøqAÌÛj!A¤Û(\0\"A \0Avt\"\0qE@A¤Û \0 r6\0 \f\v (\b\v!\0  6\b \0 6\f  6\f  \x006\b\vA! \0Aÿÿÿ\x07M@ \0A& \0A\bvg\"kvAq AtrA>s!\v  6 B\x007 AtAÔÝj!@A¨Û(\0\"A t\"qE@A¨Û  r6\0  6\0A!A\b\f\v \0A AvkA\0 AG\x1Bt! (\0!@ \"(Axq \0F\r Av! At!  Aqj\"(\"\r\0\v  6A! !A\b\v!\0 \"\f\v (\b\" 6\f  6\bA!\0A\b!A\0\v!  j 6\0  6\f \0 j 6\0AÄÛAÄÛ(\0Ak\"\0A \0\x1B6\0\v\vÖ|~@@ \0½\"\x07Bÿÿÿÿÿÿÿ\x07W@ \0D\0\0\0\0\0\0\0\0a@D\0\0\0\0\0\0ðÿ\v \x07B\0Y\r \0 \0¡D\0\0\0\0\0\0\0\0£\v \x07Bÿÿÿÿÿÿÿ÷ÿ\0V\rAx!	 \x07B \"\bBÀÿR@ \b§\f\vAÀÿ \x07§\rD\0\0\0\0\0\0\0\0\vAËw!	 \0D\0\0\0\0\0\0PC¢½\"\x07B §\vAâ¾%j\"\nAv 	j·\"D\0`PDÓ?¢\" \x07Bÿÿÿÿ \nAÿÿ?qAÁÿj­B ¿D\0\0\0\0\0\0ð¿\xA0\"\0 \0 \0D\0\0\0\0\0\0à?¢¢\"¡½Bp¿\"D\0\0 {ËÛ?¢\"\xA0\"   ¡\xA0 \0 \0D\0\0\0\0\0\0\0@\xA0£\"   ¢\" ¢\"  DÆxÐ	Ã?¢D¯xÅqÌ?\xA0¢DúÙ?\xA0¢    DDR>ßñÂ?¢DÞËdFÇ?\xA0¢DY\"$IÒ?\xA0¢DUUUUUå?\xA0¢\xA0\xA0¢ \0 ¡ ¡\xA0\"\0D\0\0 {ËÛ?¢ D6+ñóþY=¢ \0 \xA0DÕ­Ê8»=¢\xA0\xA0\xA0\xA0!\0\v \0\vÂæ}R|~#\0Aà\0k\"3$\0 \0(\b!  \0(! 3A6, 3A\x006( 3A\x006$ 3A\x006 3A\x006 3A\x006\f \0($! \0(\0\"*( !+ *(!( *(\b!4 \0( !0 3A\x006A!@ E\r\0 AH\r\0 *($\"A\0H\r\0 0A\0G!1 \0( l!. *(,!@ .  &tG@  &F &Aj!&E\r\f\v\v E@Aè!VA!A\0\f\v Açj!V ( (gj\"A k! AkAu\v!#@ \0(0E@ (A\bj!;Aû	  Aû	N\x1B!= \0((!/ \0(,E@ /!\f\vA! /AF\r = #k!9 /Al *(\0Al .mmAt\"GAu\f\vAÔß\0AÕ%Aç\0\v  .l! AN@ *(\0 l j!\vA AF\r\0A =  *(\0\"/Atj /Atm\"  =J\x1B\" AL\x1B!=  E\r\0  = \0((\v!/ = #k\"9\v!\x1B E@ 3A0j\"  =x\v \0Aôj!5 =AlA &k\"Rt!S@ GA\0L\r\0 \0(4E\r\0AA\0 AF\x1B\" GAt \0(ÐkAu\"  J\x1B\" 9N\r\0   #j\"= !9\v *(\f!C 3 ( .j\" lAtAjApqk\"\"F$\0 \0*à!\b@@ . (k  l \0(\"m\"A\0J@ Aq!\"A\0!A\0!@ AO@ Aüÿÿÿ\x07q!$A\0!@   Atj\"-*\0\"	  	]\x1B\" -*\"\n  \n]\x1B\" -*\b\"\f  \f]\x1B\" -*\f\"\v  \v]\x1B! \x07 	 \x07 	^\x1B\"\x07 \n \x07 \n^\x1B\"\x07 \f \x07 \f^\x1B\"\x07 \v \x07 \v^\x1B!\x07 Aj! Aj\" $G\r\0\v \"E\r\v@   Atj*\0\"	  	]\x1B! \x07 	 \x07 	^\x1B!\x07 Aj! Aj\" \"G\r\0\v\v \b \x07 \"  \x07]\x1B^\r Aq!\"A\0!C\0\0\0\0!C\0\0\0\0!\x07A\0! AO@ Aüÿÿÿ\x07q!$A\0!@   Atj\"-*\0\"	  	]\x1B\" -*\"\b  \b]\x1B\" -*\b\"\n  \n]\x1B\" -*\f\"\f  \f]\x1B! \x07 	 \x07 	^\x1B\"\x07 \b \x07 \b^\x1B\"\x07 \n \x07 \n^\x1B\"\x07 \f \x07 \f^\x1B!\x07 Aj! Aj\" $G\r\0\v \"E\r\v@   Atj*\0\"	  	]\x1B! \x07 	 \x07 	^\x1B!\x07 Aj! Aj\" \"G\r\0\v\f\v \bC\0\0\0\0^\r\v \x07 \"  \x07]\x1B!\b\v  (lA!I@   (l m\"A\0L@C\0\0\0\0!\x07C\0\0\0\0!\f\v  Atj!- Aq!\"A\0!C\0\0\0\0!C\0\0\0\0!\x07A\0! AO@ Aüÿÿÿ\x07q!A\0!@  - Atj\"*\0\"	  	]\x1B\" *\"\n  \n]\x1B\" *\b\"\f  \f]\x1B\" *\f\"\v  \v]\x1B! \x07 	 \x07 	^\x1B\"\x07 \n \x07 \n^\x1B\"\x07 \f \x07 \f^\x1B\"\x07 \v \x07 \v^\x1B!\x07 Aj! Aj\" G\r\0\v \"E\r\v@  - Atj*\0\"	  	]\x1B! \x07 	 \x07 	^\x1B!\x07 Aj! Aj\" \"G\r\0\v\vAt =At!- \0 \x07 \"  \x07]\x1B\"8à \b   \b]\x1B!	@ AG\r\0A!  	C\0\0?A \0(<t²_\"A E\r\0@ GA\0L@ -!\f\vA!9  = #Aj\"  =J\x1B\"\x1B \x1B\"=At\"!-\v   (gkA j6A\0!I\v 5j!BA  AL\x1B!W (At!A \0AÀj!,A\0!@  At\"j!#   lAtj\") Aj! \0(!A\0!$  ,j\"'*\0! **!\x07@@@ \0(A\0G 	C\0\0G^q\"\r\0 AG\r\0 **C\0\0\0\0\\\r\0 .A\0L\rA\0! .AG@ .Aq .Aþÿÿÿ\x07q!A\0!@  Atj #  lAtj*\0C\0\0\0G\"\b 8\0  Ar\"$Atj #  $lAtj*\0C\0\0\0G\" \x07 \b8\0 Aj! \x07 ! Aj\" G\r\0\vE\r\v  Atj #  lAtj*\0C\0\0\0G\"\b 8\0 ' \x07 \b8\0\f\v . m!\"@ AF\r\0 .At\"E\r\0 A\0 ü\v\0\v@ \"A\0L\r\0@@ \"Ak\"E@A\0!\f\v \"Aq \"Aþÿÿÿ\x07q!:A\0!@   lAtj #  lAtj*\0C\0\0\0G8\0  Ar\"% lAtj #  %lAtj*\0C\0\0\0G8\0 Aj! $Aj\"$ :G\r\0\vE\r\v   lAtj #  lAtj*\0C\0\0\0G8\0\v E\r\0@ E@A\0!\f\v \"Aq \"Aþÿÿÿ\x07q!\"A\0!A\0!@   lAtj\"$C\0\0ÇC\0\0G $*\0\"\b \bC\0\0G^\x1B \bC\0\0Ç]\x1B8\0  Ar lAtj\"$C\0\0ÇC\0\0G $*\0\"\b \bC\0\0G^\x1B \bC\0\0Ç]\x1B8\0 Aj! Aj\" \"G\r\0\vE\r\v   lAtj\"C\0\0ÇC\0\0G *\0\"\b \bC\0\0G^\x1B \bC\0\0Ç]\x1B8\0\v .A\0L\r\0 .Aq!#A\0!$@ .AI@A\0!\f\v .Aüÿÿÿ\x07q!\"A\0!A\0!@  Atj\" *\0\"\b 8\0  *\" \x07 \b8  *\b\"\b \x07 8\b  *\f\" \x07 \b8\f Aj! \x07 ! Aj\" \"G\r\0\v #E\r\v@  Atj\" *\0\"\b 8\0 Aj! \x07 \b! $Aj\"$ #G\r\0\v\v ' 8\0\v Aj! A@ ) B A\nt (kAtj Aü\n\0\0\v  WG\r\0\v *(\0!#\0Ak\"! $\0  \"At\"AjApqk\"$\0@ AG@ A\0L\r E\r   ü\n\0\0\f\v A\0L\r\0A\0! AG@ Aq Aþÿÿÿ\x07q!\"A\0!@  At\"(j  (j\"*\0  At\"$j*\08\0  (Ar\"(j  (j\"(*\0 $ (j*\08\0 Aj! Aj\" \"G\r\0\vE\r\v  At\"j  j\"*\0  Atj*\08\0\v A¸m!(A!  A A\bj!}@@ A¸N@@ E@ *\f! *\b\"\x07C\0\0?^E\r C\0\0\0\0]E\r\v   At\" A\bj!  (L\r\0\v\v \r *\f! *\b!\x07\v »DúBÈyÿÿ@¢ \x07 \x07»\xA0D\0\0\0\0\0\0\0\0cE\r\0 3 8\f| \x07C\0\0\0?»\"i½\"kB §Aÿÿÿÿ\x07q\"AÀÿO@D\0\0\0\0\0\0\0\0D-DTû!	@ kB\0Y\x1B k§ AÀÿkrE\rD\0\0\0\0\0\0\0\0 i i¡£\f\v| AÿÿÿþM@D-DTû!ù? AãI\rD\x07\\3&¦< i i i¢K¢¡ i¡D-DTû!ù?\xA0\f\v kB\0S@D-DTû!ù? iD\0\0\0\0\0\0ð?\xA0D\0\0\0\0\0\0à?¢\"i\"j j iK¢D\x07\\3&¦¼\xA0\xA0¡\"i i\xA0\f\vD\0\0\0\0\0\0ð? i¡D\0\0\0\0\0\0à?¢\"i\"j iK¢ i j½Bp¿\"i i¢¡ j i\xA0£\xA0 i\xA0\"i i\xA0\v\v ¸£¶\f\v 3A\x006\fC\0\0¿\v!\f Aj$\0A!@ \0(A\0L\r\0 \0(@\r\0A\0!@ 0E\r\0 \x1BAJ\r\0 \0(¸AG!\v ! 3*\f!A\0!A\0!#\0\"!$  AtAjApqk\"#$\0 3A\x006 Am!@@ A\0J@ Aþÿÿÿq!A Aþÿÿÿ\x07q!\" Aq!' Aq!, Ak!)C\0\0?C\0\0\0=C\0\0= \x1B\"!	 AlAæ\0k!! ²! ·!i A$H!:@| A\0L@ #B\x007( #B\x007  #B\x007 #B\x007 #B\x007\b #B\x007\0D\0\0\0\0\0\0\0\0\f\v   lAtj!(C\0\0\0\0!\x07A\0!C\0\0\0\0!\rA\0!@ AG@@ # At\"j \x07  (j*\0\"\b8\0 # Ar\"j \rC\0\0\0? \x07 \b\"\n  (j*\0\"\v8\0 \v \n!\r \b \x07C\0\0\0? \n \v!\x07 Aj! Aj\" \"G\r\0\v ,E\r\v # At\"j \x07  (j*\08\0\v #B\x007( #B\x007  #B\x007 #B\x007 #B\x007\b #B\x007\0D\0\0\0\0\0\0\0\0 AH\r\0C\0\0\0\0!\x07A\0!A\0!C\0\0\0\0!\r@ \"AG@@ # Atj  	 \x07 # Atj\"(*\0\"\x07 \x07 (*\"\x07 \x07\"\b\"\x078\0 # Ar\"(Atj  	 \x07 # (Atj\"(*\0\"\x07 \x07 (*\"\x07 \x07\"\n\"\x078\0 \r \b \n!\r Aj! Aj\" AG\r\0\v 'E\r\v # Atj  	 \x07 # Atj\"*\0\"\x07 \x07 *\"\x07 \x07\"\x078\0 \r \x07!\r\vC\0\0\0\0!\b !C\0\0\0\0!\x07@ # Ak\"(Atj\" \bC\0\0`? *\0\"\bC\0\0\0>\"\n8\0 \x07 \n \x07 \n^\x1B!\x07 AJ (!\r\0\v \r \x07»D\0\0\0\0\0\0à?¢\v!j #*\0\"\x07 \x07\\\r  j i¢¶C}&\"\x07 \x07\\\r  :A\0 \x07C\0\0B!\bA\0!A\f!@ A\0C\0\0þB \b # Atj*\0C}&\"\x07 \x07C\0\0þB`\x1Bü\0 \x07C\0\0\0\0]\x1BAÔj-\0\0j! Aj\" )H\r\0\v A\bt\v !m\"H@ 3 6 !\v Aj\" G\r\0\v\v A\0 \fCôýÔ<]E CHáz?^Er\"\x1B!  AÈJq!@ E\r\0 E\r\0 A×J\r\0 3A6A\0!\v 3C\0\0\0\0C\0\0#CC\0\0\0\0 A\x1Bl¸¶C\0\0(Â\" C\0\0\0\0]\x1B\" C\0\0#C^\x1BCeâ;»DnÀÊÁ¿\xA0\"i¶ iD\0\0\0\0\0\0\0\0c\x1B8 $$\0 \f\vA¾ð\0AÕ%A§\0\vAð\0AÕ%A¨\0\vE! 3*!\r\v 3 3*\f\"C\0\0? \r\"\x07  \x07]\x1B\"8\f@@ \0(@A\0 9AJ\x1BE@A\0! 9  A\flL\r 0\r I\r\f\vA\0! 0\r IE\r\v Aj -J\r\0 \0(E!\v \0(d\"X!J \0(! \0Aø\0j!HA\0!#\0A k\"\"$\0 \"B\x007\b \"B\x007\0 \0\"(\0\")(!$ \" \"( .A\bj\"lAtAjApqk\"\0\"$\0 \" \0 Atj6 \" \x006A ( (AL\x1B!: .At!A $ .j!% \"# $Atj!A\0!\0@ \"Aj \0Atj(\0\" B \0A\ftjA ü\n\0\0 AE\"LE@ A j  \0 %lAtj Aü\n\0\0\v \0Aj\"\0 :G\r\0\v}@ E\r\0 C¤p}?^E\r\0CÜI@ \f \f \fCùI@`\x1B!A!\0@ \0\"Aj!\0  ³C®Ç>`\r\0\v \" C)uÉ;^Aþ\x07 ¸D-DTû!@¢ »£D\0\0\0\0\0\0à?\xA0ü\"\0 \0Aþ\x07N\x1BA\v6C\0\0@?\f\v@ E\r\0 AH\r\0  Au\"\0AtAjApqk\"$\0 (H \"Aj  \0 (c (H Aj\"  .AÓ\x07 \"Aj\"\0b \"A\b \"(k6 (H (h *l!A\0!C\0\0\0\0!\bC\0\0\0\0!\nAÿ \0\"(\0Am\"\0 \0AÿN\x1B! .Am!#\0Ak!'@ .AH\r\0  Atk!\0@ .Aþÿÿÿ\x07qAF@A\0!\f\v Aq Aþÿÿÿq!?A\0!@  At\",Ar\"2j*\0\" \0 2j*\0  ,j*\0\"\x07 \0 ,j*\0 \b!\b   \x07 \x07 \n!\n Aj! Aj\" ?G\r\0\vE\r\v  At\"j*\0\" \0 j*\0 \b!\b   \n!\n\v ' \n8\0A! \n!@ ' At\"\0jC\0\0\0\0  \0k*\0\"\x07 \x07    kAtj*\0\" \" C\0\0\0\0]\x1B8\0 AG Aj!\r\0\vA~m!> Aþÿÿÿq!K Aq!T Ak!, C\0\0\0?! At!D \b \n ' Atj*\0\"C\0\0?\"\vCY?! \vC333?!A! !\0@  Dj At\"n\"A\x07N@ AF@   j\" AJ\x1B\f\v D At(\xA0Íl j n\vAt!7 At!<C\0\0\0\0! .AN@  7k!!  <k!?A\0!C\0\0\0\0!\x07A\0!@C\0\0\0\0!	@ ,@@  At\"2Ar\"6j*\0\"	 ! 6j*\0  2j*\0\" ! 2j*\0 ! 	 6 ?j*\0  2 ?j*\0 \x07!\x07 Aj! @Aj\"@ KG\r\0\v \x07!	 TE\r\v  At\"j*\0\"\x07  !j*\0 ! \x07  ?j*\0 	!\x07\v \x07 C\0\0\0?!\v  \n ' <j*\0 ' 7j*\0C\0\0\0?\"	C\0\0?!\x07}   >j\" Au\"s k\"AI\r\0C\0\0\0\0 AG\r\0 C\0\0\0\0  lAl H\x1B\v!} AH@CÍÌÌ>  \" CÍÌÌ>]\x1B\f\vC>  \" C>]\x1B\v \x07]@ \x07!\v !\b 	! !\0\v Aj\"AG\r\v\vC\0\0\0\0!	C\0\0?!\n C\0\0\0\0 \b \bC\0\0\0\0]\x1B\"_E@  C\0\0?!\n\vC\0\0\0\0!C\0\0\0\0!\x07@ .AH\r\0 A \0kAtj!' Aq!!A\0!A\0!@ ,AO@ Aüÿÿÿq!?A\0!@  At\"A\fr\"2j*\0 ' 2j*\0  A\br\"2j*\0 ' 2j*\0  Ar\"2j*\0 ' 2j*\0  j*\0  'j*\0 ! Aj! Aj\" ?G\r\0\v !E\r\v@  At\"j*\0  'j*\0 ! Aj! Aj\" !G\r\0\v\v Aq!!  \0Atk!'A\0!A\0!@ ,AO@ Aüÿÿÿq!?A\0!@  At\"A\fr\"2j*\0 ' 2j*\0  A\br\"2j*\0 ' 2j*\0  Ar\"2j*\0 ' 2j*\0  j*\0  'j*\0 	!	 Aj! Aj\" ?G\r\0\v !E\r\v@  At\"j*\0  'j*\0 	!	 Aj! Aj\" !G\r\0\v\v Aq!  \0AsAtj!'A\0!A\0! ,AO@ Aüÿÿÿq!,A\0!@  At\"A\fr\"!j*\0 ! 'j*\0  A\br\"!j*\0 ! 'j*\0  Ar\"!j*\0 ! 'j*\0  j*\0  'j*\0 \x07!\x07 Aj! Aj\" ,G\r\0\v E\r\v@  At\"j*\0  'j*\0 \x07!\x07 Aj! Aj\" G\r\0\v\v A \x07  	 C333?^AAA\0  \x07 	 \x07C333?^\x1B\v \0Atj\"\0 \0AL\x1B6\0 \v \n \n \v^\x1B! \"(Aÿ\x07N@ \"Aþ\x076\vC\0\0\0\0 C333?\"C\0\0\0?  (8\"\0AJ\x1B\"C\0\0\0?  \0AJ\x1B \0A\bJ\x1B\f\v \"A6C\0\0\0\0\v!\x07 H(\0@ \x07 H*(!\x07\v 9!@ \"(\"\0 (hk\" Au\"s kA\nl \0L@CÍÌL>!\b\f\vCÍÌÌ>!\b \rCHáz?^E\r\0C\0\0\0\0!\x07\vC\0\0\0\0!A\0!! ( 4l!D S / / SJ\x1B!T /AF!YA &t!9  C  CH\x1B! .Aüÿÿÿ\x07q!? .Aq!/ $At! Aôj!2 \x07 \bCÍÌÌ= \b AH\x1BCÍÌÌ= \b A#H\x1B\"	CÍÌÌ½ 	 *l\"	CÍÌÌ>^\x1B\"\bCÍÌÌ½ \b 	CÍÌ\f?^\x1B\"\bCÍÌL> \bCÍÌL>^\x1B]E@A!A\bA 	 \x07 \x07 	CÍÌÌ=]\x1BC\0\0\0BC\0\0@@C\0\0\0?ü\0\"\0 \0AL\x1B\"\0 \0A\bN\x1B\"\0Ak!! \0³C\0\0À=!\v !	 .A\0L!7 .AI!<A\0!@ )(,! A (h\"\0 \0AL\x1B6h #  %lAtj! E\"6E@  2  $lAtj ü\n\0\0\v 7E@  j!@ \"A\bj Atj\">*\0!\x07A\0!,A\0!A\0!\0@ <E@@ \x07 @ \0Atj\"'*\0 '* '*\b '*\f!\x07 \0Aj!\0 Aj\" ?G\r\0\v /E\r\v@ \x07 @ \0Atj*\0!\x07 \0Aj!\0 ,Aj\", /G\r\0\v\v > \x078\0\v  $k!\0  $G@ (H  j \"Aj Atj(\0A j (h\"' ' \0 *l\"\x07 \x07 (p\"' 'A\0A\0\v (H  Atj At\"' \"Ajj(\0 \0AtjA j (h \"( . \0k *l 	 (p J )(< $ 7E@  j! \" 'j\"'*\0!\x07A\0!,A\0!A\0!\0@ <E@@ \x07  \0Atj\"*\0 * *\b *\f!\x07 \0Aj!\0 Aj\" ?G\r\0\v /E\r\v@ \x07  \0Atj*\0!\x07 \0Aj!\0 ,Aj\", /G\r\0\v\v ' \x078\0\v Aj\" :G\r\0\v \"*\b!\x07@@ (AF@ C\0\0>\"\b \x07 \"*\f\"	C\n×#<\"\n \"*\0\"\v \x07]\r \b 	 \x07C\n×#<\"\b \"*\" 	]\r \x07 \v \n]E\r 	  \b]\r\f\v \"*\0 \x07^E\r\vA\0!\0@ # \0 %lAtj! \"Aj \0Atj(\0A j! )(,!/ LE@  $Atj  Aü\n\0\0\vC\0\0\0\0! (H  /Atj  / $kAtj (h \"( $ *lC\0\0\0\0 (p J )(< $ \0Aj\"\0 :G\r\0\vA\0!!A\0!\vA\0!\0A  Ak! # .At\"/j! .A\bH!'A\0 .kAt!,@ 6E@ 2 \0 $lAtj  \0 %lAtj ü\n\0\0\v B \0A\ftj!@ 'E@  \"Aj \0Atj(\0 /jA ü\n\0\0\f\v @   /j ü\n\0\0\v L\r\0  ,jA j \"Aj \0Atj(\0A j Aü\n\0\0\v \0Aj\"\0 :G\r\0\v 3 8( 3 \"(6, 3 !6  \"A j$\0 !A@ 3*(CÍÌÌ>^\r\0 *lCÍÌÌ>^\r\0A\f\v@ H(\0E\r\0 *|»D333333Ó?d\r\0A\f\v 3(,·\"i (h·\"jD)\\Âõ(ô?¢e jDHáz®Gé?¢ ieq\v!Z@ AE@ 0\r Aj -J\r A\0A\f\v AA A\x1B 3(,\"\0Aj\"g\"k\"A% Ap t jA k 3 \x006,  3( A  XA¿ÒA\x07\vA!!A!L@ &@A!% ( (gjAk -J\"L rAqE\r\v F ( .lAtAjApqk\",\"\0$\0 \0 DAtAjApq\"\0k\"\"$\0  \0k\"\0$\0 \0   4l\"?AtAjApqk\"\"\"$\0A\0!%A\0!A\0\f\v F ( .lAtAjApqk\",\"\0$\0 \0 DAtAjApq\"\0k\"\"$\0  \0k\"\0$\0 (! \0   4l\"?AtAjApqk\"\"\"$\0@ A\bH@A\0!LA!\f\vA\0!L (H *A\0 # ,   ( & (Q (H * ,     &A *    \"  DA!8  A\0L@A!\f\v Aüÿÿÿ\x07q!' Aq!$A\0! A\0L!) AkAI! &³C\0\0\0?!@@ )\r\0 \"  4lAtj!A\0!A\0!A\0!/A\0! E@@  Atj\"  *\08\0   *8   *\b8\b   *\f8\f Aj! /Aj\"/ 'G\r\0\v ! $E\r\v@  Atj\"  *\08\0 Aj! Aj\" $G\r\0\v\vA! Aj\"  G\r\0\v\vA\0!! 9\v\"/! (H *  # ,   ( & (Q@@ ,*\0\" \\\r\0  AF\r , .Atj*\0\" \\\r\0A\0\f\vAÓñ\0AÕ%A­\0\vA\0 (AG\r\0 3A\x006A\v![ (H * ,     &A@ (@E\r\0 AH\r\0 *\0C·Ñ8!A! AG@ Aq Aþÿÿÿ\x07qAk!$A\0!@  Atj\" *\0\"\x07   \x07^\x1B\"\x07C}& \x07C}&^\x1B8\0  *\"\x07   \x07^\x1B\"\x07C}& \x07C}&^\x1B8 Aj!  $G Aj!\r\0\vE\r\v  Atj\" *\0\"\x07   \x07^\x1B\"C}& C}&^\x1B8\0\v *    \0  D  ?AtAjApqk\"2$\0 At\"<E\"KE@ 2A\0 <ü\v\0\v ( ;lAt 5j\") DAt\"j!B  Bj\"F j!J@@}@ 0@ (@!\f\v (@! (ì\"E\r\0 @C\0\0\0\0!\f\v@  A\0L\r\0AA (\\\": :AL\x1B\"'k!5 +/\0!A\0!A\0!C\0\0\0\0!C\0\0\0\0!\b@   4lAtj!7 !A\0!@ 7 Atj*\0\"\x07C\0\0>C\0\0\0À \x07C\0\0\0À^\"$\x1BC\0\0> \x07C\0\0>]\"@\x1B\"\x07 $\x1B \x07 @\x1B\"\x07C\0\0\0? \x07 \x07C\0\0\0\0^\x1B\"\x07 At 5j² ! \x07 + Aj\"Atj.\0\"$ Ák\"² \b!\b  j! $!  'G\r\0\v Aj\"  G\r\0\vA\0! A\0L\r\0 C\0\0À@ + 'Atj.\0AmÁ!@ + \"Aj\"Atj.\0 H\r\0\v 'Aj 'Ak   'lll²C\0\0\0?\"C¶óý< C¶óý<]\x1B\"C¶óý¼ C¶óý¼^\x1B!  4Atj! \b ³CÍÌL>!\bA\0!A\0!@  At\"j*\0!\x07  AF@ \x07  j*\0\"	 \x07 	^\x1B!\x07\v \x07C\0\0\0\0 \x07C\0\0\0\0]\x1B   k² \b\"\x07C\0\0>^@  2j \x07C\0\0¾8\0 Aj!\v Aj\" 'G\r\0\v@ AH\r\0 \bC\0\0>\"\bC\0\0\0\0^E@ 'Aq!A\0!A\0! :AN@ 'Aüÿÿÿ\x07q!$A\0!@ 2 Atj\"C\0\0\0\0 *\0C\0\0¾\"\x07 \x07C\0\0\0\0]\x1B8\0 C\0\0\0\0 *C\0\0¾\"\x07 \x07C\0\0\0\0]\x1B8 C\0\0\0\0 *\bC\0\0¾\"\x07 \x07C\0\0\0\0]\x1B8\b C\0\0\0\0 *\fC\0\0¾\"\x07 \x07C\0\0\0\0]\x1B8\f Aj! Aj\" $G\r\0\v E\r\v@ 2 Atj\"C\0\0\0\0 *\0C\0\0¾\"\x07 \x07C\0\0\0\0]\x1B8\0 Aj! Aj\" G\r\0\v\f\v 'At\"@ 2A\0 ü\v\0\vC\0\0\0\0!\bC\0\0\0\0!\v \bCÍÌL>! C\0\0B\f\vAæÜ\0AÕ%AØ\0\vC\0\0\0\0! \rC\0\0\0\0\v!C\0\0\0\0!  0J@C\0\0\0\0 &³C\0\0\0? !\x1B!	C\0\0 Á!\x07 0!@ \x07C\0\0¿\"\x07 \0 Atj\"*\0 	\"\b \x07 \b^\x1B!\x07  AF@ \x07  4Atj*\0 	\"\b \x07 \b^\x1B!\x07\v  \x07! Aj\" G\r\0\v\v C\0\0@@C\0\0À¿   0k² *ð\"\"\x07 \x07C\0\0À¿]\x1B\"\x07 \x07C\0\0@@^\x1B\"C\n×£< 8ð\f\vA!1\v@ 8\r\0 ?At\"E\r\0 \" \0 ü\n\0\0\v@ &E\r\0@ % ( (gjAk\" -Jr\r\0A\0! 1 (AHr\r\0A\0!#\0Að\0k! )*\0!@@  AF@  8\0 AH\rA! *\0!\x07 AG@ Ak\"Aq A~q!'A!@  At\"j \x07C\0\0¿\"  )j*\0\"\x07  \x07^\x1B\"8\0  Aj\"j C\0\0¿\"  )j*\0\"\x07  \x07^\x1B\"\x078\0 Aj! Aj\" 'G\r\0\vE\r\v  At\"j \x07C\0\0¿\"  )j*\0\"\x07  \x07^\x1B8\0\f\v   ) 4Atj*\0\"\x07  \x07^\x1B8\0 AH\rA! *\0!\x07 AG@ Ak\"Aq A~q!'A!@  At\"j \x07C\0\0¿\"  )j\"*\0\"\x07  4At\"!j*\0\"	 \x07 	^\x1B\"\x07  \x07^\x1B\"8\0  Aj\"j C\0\0¿\"  )j\"*\0\"\x07  !j*\0\"	 \x07 	^\x1B\"\x07  \x07^\x1B\"\x078\0 Aj! Aj\" 'G\r\0\vE\r\v  At\"j \x07C\0\0¿\"  )j\"*\0\"\x07  4Atj*\0\"	 \x07 	^\x1B\"\x07  \x07^\x1B8\0\v Ak\"! AqE@  Atj\" *\0\" *C\0\0¿\"\x07  \x07^\x1B8\0 Ak!\v E\r\0@  Atj\" *\0\" *C\0\0¿\"\x07  \x07^\x1B8\0  Ak\"Atj\" *\0\" *C\0\0¿\"\x07  \x07^\x1B8\0 Ak! \r\0\v\vA    AL\x1B! Ak\"A~q!! Aq!:A\0! AH!%C\0\0\0\0!\x07@@ %\r\0A! \0  4lAtj!$A\0! AG@@ \x07C\0\0\0\0C\0\0\0\0 $ At\"'j*\0\" C\0\0\0\0]\x1BC\0\0\0\0  'j*\0\" C\0\0\0\0]\x1B\" C\0\0\0\0]\x1BC\0\0\0\0C\0\0\0\0 $ 'Ar\"'j*\0\" C\0\0\0\0]\x1BC\0\0\0\0  'j*\0\" C\0\0\0\0]\x1B\" C\0\0\0\0]\x1B!\x07 Aj! Aj\" !G\r\0\v :E\r\v \x07C\0\0\0\0C\0\0\0\0 $ At\"j*\0\" C\0\0\0\0]\x1BC\0\0\0\0  j*\0\" C\0\0\0\0]\x1B\" C\0\0\0\0]\x1B!\x07\v Aj\" G\r\0\v \x07   Akl²C\0\0?^E\r\0 (H * 9 # ,   ( & (Q (H * ,     &A *    \0  DA!  A\0J@ Aüÿÿÿ\x07q!# Aq!A\0! A\0L!$ AkAI!' &³C\0\0\0?!@@ $\r\0 \"  4lAtj!(A\0!A\0!A\0!/A\0! 'E@@ ( Atj\"  *\08\0   *8   *\b8\b   *\f8\f Aj! /Aj\"/ #G\r\0\v ! E\r\v@ ( Atj\"  *\08\0 Aj! Aj\" G\r\0\v\v Aj\"  G\r\0\v\v 3AÍ³ò6 ( (gjAk!CÍÌL>!\r 9!/\v  -J\r\0  A\v 2   .lAtAjApqk\":$\0 !'A\0!A    AL\x1B!# 9\" *(,l!$ *( !(@ A\0J@  $l\"9Aj! 9Aj!! 9Aj!% ' *(\b lAtj!1 (/\0!A\0!@@  Á\"8l\"  ( \"Aj\"Atj.\0\"l\"5N\r\0C\0\0? 1 Atj*\0CÒt!A\0!A\0  8 kl\"8kAq\"7@@ :  9jAt\"@j  , @j*\08\0 Aj! Aj\" 7G\r\0\v\v 8A|K\r\0@ :  9jAt\"j   ,j*\08\0 :  %jAt\"j   ,j*\08\0 :  !jAt\"j   ,j*\08\0 :  jAt\"j   ,j*\08\0 Aj\" 5G\r\0\v\v  G\r\0\v\v Aj\" #G\r\0\v 0E  Al \x1BLqE@ (@!A\0\f\v (@!A\0 (AH\r\0 E CHáz?]q\v!M : 4AtAjApq\"8k\"(\"$\0  8k\"$$\0 $ 8k\",\"N$\0 0! (<! *(8! (,!@ (4!O#\0\"  4\"9  lAtAjApq\"k\"\"4$\0 4 k\"%\"$\0  9At\"AjApqk\"!$\0 @ (A\0 ü\v\0\v \0!4 A\0L\"5E@A	 k²!A\0!\0@ % \0At\"j \0Aj³\"\x07C_)Ë; \x07  \0Atj.\0²C\0\0=C\0\0\0?  *°8\0 \0Aj\"\0 G\r\0\v\v \"! +!# \x1B!\" !\x1BA    AL\x1B!7 Aþÿÿÿ\x07q!6 Aq!; Ak!1A\0!\0C33ÿÁ!	@@@@@ 5E@ 4 \0 9lAtj!A\0!A\0!@ 1@@ 	  At\"+j*\0 % +j*\0\"  	]\x1B\"  +Ar\"+j*\0 % +j*\0\"\x07  \x07^\x1B!	 Aj! Aj\" 6G\r\0\v ;E\r\v 	  At\"j*\0  %j*\0\"  	]\x1B!	\v \0Aj\"\0 7G\r ! 9AtAjApq\"\0k\"+$\0 + \0k\"6$\0 1\rA\0!\0\f\v \0Aj\"\0 7G\r\0\v Ak! At!5  AF!;A\0!>\f\v Aq Aþÿÿÿ\x07q!5A\0!\0A\0!@ + \0At\"j  4j*\0  %j*\08\0 + Ar\"j  4j*\0  %j*\08\0 \0Aj!\0 Aj\" 5G\r\0\vE\r\v + \0At\"\0j \0 4j*\0 \0 %j*\08\0\v@  AG\r\0 4 9Atj!@ 1E@A\0!\0\f\v Aq Aþÿÿÿ\x07q!;A\0!\0A\0!@ + \0At\"j\"> >*\0\"  j*\0  %j*\0\"\x07  \x07^\x1B8\0 + Ar\"j\"> >*\0\"  j*\0  %j*\0\"\x07  \x07^\x1B8\0 \0Aj!\0 Aj\" ;G\r\0\vE\r\v + \0At\"\0j\" *\0\" \0 j*\0 \0 %j*\0\"\x07  \x07^\x1B8\0\v At\"5@ 6 + 5ü\n\0\0\vA!@ AF\r\0 1Aq! +*\0!@@ AkAI@A!\0\f\v 1A|q!;A\0!A!\0@ + \0Atj\" *\0\"\x07 C\0\0\0À\"  \x07]\x1B\"8\0  *\"\x07 C\0\0\0À\"  \x07]\x1B\"8  *\b\"\x07 C\0\0\0À\"  \x07]\x1B\"8\b  *\f\"\x07 C\0\0\0À\"  \x07]\x1B\"8\f \0Aj!\0 Aj\" ;G\r\0\v E\r\vA\0!@ + \0Atj\" *\0\"\x07 C\0\0\0À\"  \x07]\x1B\"8\0 \0Aj!\0 Aj\" G\r\0\v\v Ak\"! 1Aq@ + Atj\"\0 \0*\0\" \0*C\0\0@À\"\x07  \x07^\x1B8\0 Ak!\v E\r\0@ + Atj\"\0 \0*\0\" \0*C\0\0@À\"\x07  \x07^\x1B8\0 + Ak\"Atj\"\0 \0*\0\" \0*C\0\0@À\"\x07  \x07^\x1B8\0 Ak! \r\0\v\v  AF!; AG!>C\0\0\0\0 	C\0\0@Á\" C\0\0\0\0]\x1B!A\0!@ , At\"\0jA A AA\0 \0 6j*\0  \0 +j*\0\"\x07  \x07^\x1BC\0\0\0?ü\0\"\0k\" AO\x1Bv \0A\0J\x1B6\0 Aj\" G\r\0\v\v@@ \" &AlAjH\r\0 \x1B\r\0A\0! A\0L\"Q &A\0Gr!U Aþÿÿÿ\x07q!\\ Aq!] Ak\"+A~q!^ +Aq!_ ! Atj\"\0Ak!` \0A\bk!a \0A\fk!b AJ!c AF!d AF!e AF!f A\x07F!gA\0!1@  1 9lAt\"\0j! 5@ !  5ü\n\0\0\v@ U\r\0 ! *\0\" \0 )j*\0\"\x07  \x07^\x1B8\0 AF\r\0 !  \0Aj\"j*\0\"  )j*\0\"\x07  \x07^\x1B8 AF\r\0 !  \0A\bj\"j*\0\"  )j*\0\"\x07  \x07^\x1B8\b d\r\0 !  \0A\fj\"j*\0\"  )j*\0\"\x07  \x07^\x1B8\f AF\r\0 !  \0Aj\"j*\0\"  )j*\0\"\x07  \x07^\x1B8 e\r\0 !  \0Aj\"j*\0\"  )j*\0\"\x07  \x07^\x1B8 f\r\0 !  \0Aj\"j*\0\"  )j*\0\"\x07  \x07^\x1B8 g\r\0 !  \0Aj\"j*\0\"  )j*\0\"\x07  \x07^\x1B8\v \0 j\"\x1B !*\0\"\b8\0@ >E\r\0A\0!\0A! \b\"\x07! AG@@ !\n \x1B At\"6j \x07C\0\0À?\" ! 6j*\0\"\v  \v]\x1B\"8\0 \x1B Aj\"6At\"Ej C\0\0À?\"\x07 ! Ej*\0\"  \x07^\x1B\"\x078\0 6   \v \nC\0\0\0?^\x1B  \vC\0\0\0?^\x1B! Aj! \0Aj\"\0 ^G\r\0\v _E\r\v \x1B At\"\0j \x07C\0\0À?\"\n \0 !j*\0\"\x07 \x07 \n^\x1B8\0   \x07 C\0\0\0?^\x1B!\v@ A\0L\r\0 \x1B Atj*\0!@ AqE@ !\f\v \x1B Ak\"At\"\0j\"6 6*\0\"\x07 C\0\0\0@\" \0 !j*\0\"\n  \n]\x1B\"  \x07^\x1B\"8\0\v AF\r\0@ \x1B AtAk\"\0j\"6 6*\0\"\x07 C\0\0\0@\" \0 !j*\0\"\n  \n]\x1B\"  \x07^\x1B\"8\0 \x1B Ak\"\0At\"6j\"E E*\0\"\x07 C\0\0\0@\" ! 6j*\0\"\n  \n]\x1B\"  \x07^\x1B\"8\0 AJ \0!\r\0\v\vA!\0 c@@ ! \0At\"Ej\"A\bk*\0\" Ak*\0\"\x07  \x07^\"6\x1B\" *\"\n *\b\"\v \n \v^\"h\x1B\" \x07  6\x1B\" \v \n h\x1B\"\x07^\"6\x1B!\v  \x07 6\x1B! \x1B Ej\"E*\0! E } *\0\"\x07   6\x1B\"\n^\"@ \x07   \x07^\x1B  \n^\r \v \n \n \v^\x1B\f\v \n   \n^\x1B  \x07^\r\0 \x07 \v \x07 \v]\x1B\vC\0\0¿^} } @ \x07   \x07^\x1B  \n^\r \v \n \n \v^\x1B\f\v \n   \n^\x1B  \x07^\r\0 \x07 \v \x07 \v]\x1B\vC\0\0¿\v8\0 \0Aj\"\0 G\r\0\v\v \x1B \x1B*\0\"\n \b !*\"  \b]\"\0\x1B\"\v !*\b\"\x07  \b \0\x1B\"  \x07]\x1B \x07 \v^\x1BC\0\0¿\"  \n]\x1B8\0 \x1B \x1B*\"\x07   \x07]\x1B8 \x1B Atj\"\0 \0*\0\"\n b*\0\" a*\0\"\x07  \x07^\"\0\x1B\"\v `*\0\"\b \x07  \0\x1B\"  \b]\x1B \b \v^\x1BC\0\0¿\"  \n]\x1B8\0 \x1B +Atj\"\0 \0*\0\"\x07   \x07]\x1B8\0@ Q\r\0A\0!A\0!\0 +@@ \x1B At\"6j\"E E*\0\" % 6j*\0\"\x07  \x07^\x1B8\0 \x1B 6Ar\"6j\"E E*\0\" % 6j*\0\"\x07  \x07^\x1B8\0 Aj! \0Aj\"\0 \\G\r\0\v ]E\r\v \x1B At\"\0j\" *\0\" \0 %j*\0\"\x07  \x07^\x1B8\0\v 1Aj\"1 7G\r\0\v@ ;E@  N\r Aj!  \"\0kAq@  \0At\"\0j\"C\0\0\0\0 \0 4j*\0 *\0\" C\0\0\0\0]\x1B8\0 !\0\v  F\r@  \0At\"j\"C\0\0\0\0  4j*\0 *\0\" C\0\0\0\0]\x1B8\0  Aj\"j\"C\0\0\0\0  4j*\0 *\0\" C\0\0\0\0]\x1B8\0 \0Aj\"\0 G\r\0\v\f\v  N\r\0 !\0@  \0 9jAt\"j\" *\0\"  \0At\"\x1Bj\"*\0C\0\0À\"\x07  \x07^\x1B\"8\0  *\0\"\x07 C\0\0À\"  \x07]\x1B\"8\0 C\0\0\0\0 \x1B 4j*\0 \" C\0\0\0\0]\x1BC\0\0\0\0  4j*\0 *\0\" C\0\0\0\0]\x1BC\0\0\0?8\0 \0Aj\"\0 G\r\0\v\v  N\"E@ Aj!  \"\0kAq@  \0At\"\0j\" *\0\" \0 2j*\0\"\x07  \x07^\x1B8\0 !\0\v  G@@  \0At\"j\" *\0\"  2j*\0\"\x07  \x07^\x1B8\0  Aj\"j\" *\0\"  2j*\0\"\x07  \x07^\x1B8\0 \0Aj\"\0 G\r\0\v\v !\0@AÐ!  \0At\"j*\0\"C\0\0@]@ »Dï9úþB.æ?¢¶C\0\0PAC\0\0\0?ü\0!\v  $j 6\0 \0Aj\"\0 G\r\0\v\v@ OE\"! @A\0Gq\r\0 \r\0 \r\0  \"\0kAq\"@A\0!@  \0Atj\"\x1B \x1B*\0C\0\0\0?8\0 \0Aj!\0 Aj\" G\r\0\v\v  kA|K\r\0@  \0Atj\" *\0C\0\0\0?8\0  *C\0\0\0?8  *\bC\0\0\0?8\b  *\fC\0\0\0?8\f \0Aj\"\0 G\r\0\v\v@ \r\0  \"\0kAq@@ \0A\bH}C\0\0\0@ A\fI\rC\0\0\0?\v!  Atj\"\0 \0*\0 8\0\v Aj!\0\v Aj F\r\0@@ \0A\bH}C\0\0\0@ \0A\fI\rC\0\0\0?\v!  \0Atj\" *\0 8\0\v@ \0A\x07H}C\0\0\0@ \0A\vH\rC\0\0\0?\v!  \0Atj\" * 8\v \0Aj\"\0 G\r\0\v\v@ CHáz?^E\r\0 \fC\0\0ðB»D-DTû!	@£D\0\0\0\0\0\0à?\xA0ü!\0 E@ !@@ \0 # Atj\".\0\"\x1BH\r\0 \0 .J\r\0  Atj\"% %*\0C\0\0\0@8\0\v@ \x1BAk \0J\r\0 .Aj \0H\r\0  Atj\"% %*\0C\0\0?8\0\v@ \x1BAk \0J\r\0 .Aj \0H\r\0  Atj\"% %*\0C\0\0?8\0\v@ \x1BAk \0J\r\0 .Aj \0H\r\0  Atj\" *\0C\0\0\0?8\0\v Aj\" G\r\0\v\v \0 # Atj.\0H\r\0  +Atj\"\0 \0*\0C\0\0\0@8\0  Atj\"\0 \0*\0C\0\0?8\0\v@ H(\0E\r\0A  AN\x1B\" L\r\0 Aj! HA,j!\x1B  \"\0kAq@  \0Atj\" \0 \x1Bj-\0\0³C\0\0< *\08\0 !\0\v  F\r\0@  \0Atj\" \0 \x1Bj-\0\0³C\0\0< *\08\0  \0Aj\"Atj\"  \x1Bj-\0\0³C\0\0< *\08\0 \0Aj\"\0 G\r\0\v\v @A\0!\f\vA\0!\0  !r @A\0Gq!+ \"AtAm! # Atj/\0!@  At\"!j\" *\0\"C\0\0@ C\0\0@]\x1B\"8\0 + # Aj\"Atj.\0\"\x1B Ák  l &t\"AL@  ü\0\"lAt\f\v A1O@  C\0\0\0Aü\0\"lAtAu\f\v  ³C\0\0À@ü\0\"A0l\v \0j\"Au LrE@ ( Atj At\" \0k6\0\f\v ! (j 6\0 \x1B! !\0 \" G\r\0\v\f\v  N@A\0!\f\v  \"\0kA\x07q\"@A\0!@ $ \0AtjA\r6\0 \0Aj!\0 Aj\" G\r\0\v\vA\0!  kAxK\r\0@ $ \0Atj\"BÐ7\0 BÐ7 BÐ7 BÐ7\b \0A\bj\"\0 G\r\0\v\v 3 6$\0 N 8k\"!$\0@ M@AÎ\0A\xA0 \"m\"\0 \0AÎ\0L\x1BAj!+ 3(!A\0!#\0\"\0A!< \0 AtAjApq\"\0k\"2\"$\0  *( \" Atj.\0  Ak\"@Atj.\0k &tAtAjApq\"k\"%\"$\0  k\"5\"$\0  \0k\"1\"$\0  \0k\"8$\0 A\0J@C\0\0¾C\0\0\0? \r\" C\0\0¾]\x1BC\n×#=\"\b &A\0 \x1B²!\nA &t!MA\0 &Atk!N \b &Aj²!\f :  .lAtj!O@ O *( \"\0 \"Atj.\0\" &tAtj! \0 Aj\"Atj.\0 k\"; &t\"\x1BAt\">E\"PE@ %  >ü\n\0\0\v@ \x1BA\0L\"K@C\0\0\0\0!\x07\f\v \x1BAq!7A\0!C\0\0\0\0!\x07A\0!\0 \x1BAO@ \x1BAüÿÿÿ\x07q!QA\0!@ \x07 % \0Atj\"*\0 * *\b *\f!\x07 \0Aj!\0 Aj\" QG\r\0\v 7E\r\v@ \x07 % \0Atj*\0!\x07 \0Aj!\0 Aj\" 7G\r\0\v\v \n \x07 \x07!A\0!7@ E\r\0 ;AF\r\0 PE@ 5  >ü\n\0\0\v 5 \x1B &u Mi@ K@C\0\0\0\0!\x07\f\v \x1BAq!A\0!C\0\0\0\0!\x07A\0!\0 \x1BAO@ \x1BAüÿÿÿ\x07q!>A\0!@ \x07 5 \0Atj\"*\0 * *\b *\f!\x07 \0Aj!\0 Aj\" >G\r\0\v E\r\v@ \x07 5 \0Atj*\0!\x07 \0Aj!\0 Aj\" G\r\0\v\v \f \x07 \x07\"\x07 ]E\r\0A!7 \x07!\v & ;AG\"> Eqj\"PA\0J@ \x1BAüÿÿÿ\x07q!Q \x1BAq!;A\0!@ % \x1B uA ti & Asj Aj\" \x1B!U@ K@C\0\0\0\0!\x07\f\vA\0!C\0\0\0\0!\x07A\0!A\0!A\0!\0 \x1BAO@@ \x07 % Atj\"\0*\0 \0* \0*\b \0*\f!\x07 Aj! Aj\" QG\r\0\v !\0 ;E\r\v@ \x07 % \0Atj*\0!\x07 \0Aj!\0 Aj\" ;G\r\0\v\v \b U² \x07 \x07\"\x07   \x07^\"\0\x1B!  7 \0\x1B!7  PG\r\0\v\v 2 Atj\" 7At\"\0A\0 \0k \x1B\"\x006\0@ >\r\0 \0A\0 \0 NG\x1B\r\0  \0Ak6\0\v  G\r\0\v 2(\0!\v $(\0\"  &AtAàõ\0j Atj\"%,\0\0At\"k\"\0 \0Au\"\0s \0kl!\0A\0 + \x1B\"\x1B  %,\0At\"k\" Au\"s k lj! AJ@@ 2 <At\"j(\0\"5 k\"7 7Au\"7s 7k  $j(\0\"7l \0 +j\"; \"  ;J\x1Bj! 5 k\"5 5Au\"5s 5k 7l \0  +j\" \0 H\x1Bj!\0 <Aj\"< G\r\0\v\vA!  %,\0At\"5k\" Au\"s k l!  %,\0At\"7k\" Au\"s k l \x1Bj! AN@@ 2 At\"\x1Bj(\0\"< 7k\"; ;Au\";s ;k \x1B $j(\0\";l  +j\"> \"\x1B  >J\x1Bj! < 5k\"< <Au\"<s <k ;l  \x1B +j\"\x1B  \x1BH\x1Bj! Aj\" G\r\0\v\v \0  \0 H\x1B!\0A!  %AA\0     J\x1B \0Hq\"\x1B\x1Bj\",\0\0At\"%k\"\0 \0Au\"\0s \0k l!\0   ,\0At\"5k\" Au\"s klA\0 + \x1Bj!@@@ AJ@@ 1 At\"j \0  +j\"N6\0  8j \0 +j\" N6\0  $j(\0\"  2j(\0\" 5k\"7 7Au\"7s 7kl    H\x1Bj!  %k\" Au\"s k l \0  \0 H\x1Bj!\0 Aj\" G\r\0\v ! @Atj \0 N\"6\0 Ak! @Aq\"\r !\0\f\v ! @Atj \0 N6\0\f\vA\0! !\0@ ! \0At\"j 8 1 AF\x1B j(\"6\0 \0Ak!\0 Aj\" G\r\0\v\v AO@@ ! \0At\"j 8 1 AF\x1B j(\"6\0 ! Ak\"j 8 1 AF\x1B j(\"6\0 ! A\bk\"j 8 1 AF\x1B j(\"6\0 ! A\fk\"j 8 1 AF\x1B j(\"6\0 \0AJ \0Ak!\0\r\0\v\v\v$\0 \x1B!  CL\r ! AtjAk(\0!\0  \"kA\x07q\"@A\0!@ ! Atj \x006\0 Aj! Aj\" G\r\0\v\v  kAxK\r@ ! Atj\" \x006\0  \x006  \x006  \x006  \x006  \x006\f  \x006\b  \x006 A\bj\" G\r\0\v\f\v@@ 0E\r\0 3(E\r\0 A\0L\r A\x07q!A\0!A\0! AkA\x07O@ Aøÿÿÿ\x07q!\x1BA\0!@ ! Atj\"\0B7 \0B7 \0B7\b \0B7\0 A\bj! A\bj\" \x1BG\r\0\v E\r\v@ ! AtjA6\0 Aj! Aj\" G\r\0\v\f\v@ 0E\r\0 \"AJ\r\0 (¸AF\r\0 ! A\0L\r K\r !A\0 <ü\v\0\f\v A\0L\r\0 A\x07q!A\0!A\0! AkA\x07O@ Aøÿÿÿ\x07q!\x1BA\0!@ ! Atj\"\0 6 \0 6 \0 6 \0 6 \0 6\f \0 6\b \0 6 \0 6\0 A\bj! A\bj\" \x1BG\r\0\v E\r\v@ ! Atj 6\0 Aj! Aj\" G\r\0\v\vA\0!\vA    AL\x1B!7 ! ?AtAjApqk\"+$\0A\0!\x1B@  0L\"$E@ \x1B 9l! 0!@ 4  jAt\"\0j\"*\0\" \0 )j*\0C\0\0\0@]@  \0 Jj*\0C\0\0¾ 8\0\v Aj\" G\r\0\v\v \x1BAj\"\x1B 7G\r\0\v (\f!\0 (AJ! (8!6 (@!1A\0!C\0\0\0\0!A\0!#\0Aà\0k\"$\0@ \0@ *T!\x07A!\f\v *T!\x07 \r\0 \x07  0k  l\"\0At²^E\r\0 \0 H!\vA    AL\x1B!%  0kAq!8 *(\b!\x1B  0Aj\"2F!5@@  0L\r\0  \x1Bl!\0 8 4 \0 0jAt\"j*\0  )j*\0\"\b \b ! 2 0\v! 5\r\0 \0Aj!C@ 4  CjAt\"<j*\0 ) <j*\0\"\b \b 4 \0 jAt\"<j*\0 ) <j*\0\"\b \b ! Aj\" G\r\0\v\v Aj\" %G\r\0\v ( (  )7X  )\b7P  )\x007H (!  )$78  (,6@  )70  \x1B  lAtAjApqk\"$\0  *(\b  lAt\"\0AjApqk\"\x1B$\0 \0@  ) \0ü\n\0\0\v Aä\0j!\0C\0\0@@ ²C\0\0\0>\"\bC\0\0A \bC\0\0A_\x1BC\0\0A  0kA\nJ\x1B 1\x1B!\bC\0\0HC  C\0\0HC^\x1B!gj\"8A k!2A\0!%@@ 8Ak -M\"5  5q\" \x1BAF@ * 0  4  - 2 &AÔ\0lAÊ\xA0j \x1B    &A \b 1m!% \r\v !; (\0!C  (6(  )\f7   )7 (!  )$7\b  (,6  )7\0  Cj!< \x1BA  k\"8  F\x1BAjApqk\"@$\0 8E\">E@ @ < 8ü\n\0\0\v  )X7  )P7\b  )H7\0  6  (@6,  )87$  )07 * 0  4 ) - 2 &AÔ\0lA\xA0\xA0j +    &A\0 \b 1m!@  5qE\r\0  %M@  %G\r  \x07 -³ 6²  A	t²ü\0j ;L\r\v  C6\0  ((6  ) 7\f  )7  6  (6,  )\b7$  )\x007 >E@ < @ 8ü\n\0\0\v  At\" *(\bl\"@ )  ü\n\0\0\v  *(\bl\"@ + \x1B ü\n\0\0\v\f\v &AtAð¢j*\0\"\x07 \x07 *T !\f\v  At\" *(\bl\"@ )  ü\n\0\0\v  *(\bl\"E\r\0 + \x1B ü\n\0\0\v  8T Aà\0j$\0A\0!8 &A\0G (At\" ( (gjA k\"AA \x1B\"\x1Bj\"%AjOq!A\0!@ $\r\0 ! 0Atj!  k\"1 %O@  (\0 \x1B ( (gjA k! (\0\f\v A\x006\0A\0\v! 0Aj\" F\r\0AA \x1B!% !\x1B@ ! Atj!@ 1  %jO@  (\0 \x1Bs % (\0\"\x1B r! ( (gjA k!\f\v  \x1B6\0\v Aj\" G\r\0\v\v@ E\r\0 &AtAàõ\0j Atj j\"-\0\0 -\0F\r\0  A At!8\v@ $\r\0 &AtAàõ\0j Atj 8j!  0\"kAq\"@A\0!@ ! Atj\"\x1B  \x1B(\0j,\0\x006\0 Aj! Aj\" G\r\0\v\v 0 kA|K\r\0@ ! Atj\"  (\0j,\0\x006\0   (j,\0\x006   (\bj,\0\x006\b   (\fj,\0\x006\f Aj\" G\r\0\v\v@@ @@ - ( (gjAkN@ (@@A! A6P A\x006d\f\v 0@ (E\r \rA\f\v (!@@ /\r\0 AH\r\0   A\nlN\r\v E\r\f\v (P!6A\0!A\0!%A\0!1A\0!5A\0!2@@ A\0J@@ *( \"C Atj\".\0 Ak.\0k lA	H\r\0 *(, l!;A    AL\x1B!> C/\0!@ : 2 ;lAtj!K !A\0!@ Á! C Aj\"Atj.\0\" k l\"\x1BA	N@ K  lAtj!< \x1BAþÿÿÿ\x07q!M \x1BAq \x1B³!A\0!A\0!A\0!8A\0!A\0!@@  < Atj\"O*\0\"\x07 \x07 \"\x07C\0\0<]j O*\"\b \b \"\bC\0\0<]j!  \x07C\0\0=]j \bC\0\0=]j! 8 \x07C\0\0>]j \bC\0\0>]j!8 Aj! @Aj\"@ MG\r\0\v@  < Atj*\0\"\x07 \x07 \"C\0\0<]j! 8 C\0\0>]j!8  C\0\0=]j!\v *(\bAk H@  8jAt \x1Bn 1j!1\v , Atj(\0\" At \x1BN 8At \x1BNj At \x1BNjl 5j!5  %j!%\v \" G\r\0\v 2Aj\"2 >G\r\0\v A@  1 1  *(\bkAj  lnA\0\v (`jAu\"6`@@@ \0(\0\0\v Aj!\f\v Ak!\v \0A AJ AJ\x1B6\0\v %A\0L\r 5A\0H\r  (X 5A\bt %njAu\"\x006XA! \0Al 6A\x07tkAÂjAu\"\0AÐ\0H\r\0A! \0AI\r\0 \0AI!\v \f\vAËÞ\0AÜ\"Aà\0\vA±Ý\0AÜ\"A\0\vAß\0AÜ\"A\0\v\f\v A6P\f\vA\f\vA\0\v\"6P\v  AÂÒA\x07\v (@@ (A\b \"Am \"AJ\x1B6\0\v + 9AtAjApqk\"\"$\0 * \" &  w -At!A\0! !\x1B $E@A! 0!@ \"\0Aj! ( \0At\"j!A\0!@ At \x1Bj  kN\r\0  \"j\"-(\0A\0L\r\0 # \0Atj.\0!\0 # Atj.\0!  (\0\"A\0J  !\x1B A\0L\r\0@ \x1BA\bj    \0k  l &t\"\0At\"A0 \0 \0A0L\x1B\"\0 \0 J\x1B\"\0j\"kN@ \0!\f\vA! \0\" -(\0N\r\0@   (\0\"HA !\x1B  N\r \0 j! \x1BA\bj  \0 j\"kN\r Aj!  -(\0H\r\0\v\vA  AL\x1BAk!\v  6\0  G\r\0\v\v S T Y\x1B  A(lAj\"A &vA2klk!  AF@ &@ : .Atj! *( \"\0/\0!C}&!\bA\0!-C}&!@ Á &t\" \0 -Aj\"-Atj.\0\" &t\"H@@  : At\"#j*\0\"\x07  #j*\0\"\n \x07 \n! \b \x07 \n!\b Aj\" G\r\0\v\v -A\rG\r\0\v 3 C÷5? \0. &Ajt\"\0AA\r &AF\x1Bj² \b \0²^6$\v Aè\x07m²! (è!\0A\0!@@  AtAÐÒj*\0]\r Aj\"AG\r\0\vA!\v@@ \0 H@  \0At\"AÐÒj*\0 A°Ój*\0]\r\v \0 L\r  \0AtAk\"AÐÒj*\0 A°Ój*\0^E\r\v \0!\v   0   0H\x1B\"\0 \0 J\x1B6è\vA!- \x1BA0j  kL@ @ 0A\0L@ (@E\r\v A\x006äA\f\v 3*!\b (è!C\0\0\0\0!\x07}C\0\0@ AôH\r\0C\0\0\xA0@ AÿðK\r\0 AôkA\nv³C\0\0=C\0\0@\v!\r  AF@ : .Atj!A *( \"#.\0!A\0!@ !\0C\0\0\0\0!@ # Aj\"Atj.\0\" \0k &t\"A\0L\r\0 A \0 &tAt\"j!\0  :j! Aq!,A\0!-A\0! AO@ Aüÿÿÿ\x07q!%A\0!\x1B@  At\"A\fr\"1j*\0 \0 1j*\0  A\br\"1j*\0 \0 1j*\0  Ar\"1j*\0 \0 1j*\0  j*\0 \0 j*\0 ! Aj! \x1BAj\"\x1B %G\r\0\v ,E\r\v@  At\"j*\0 \0 j*\0 ! Aj! -Aj\"- ,G\r\0\v\v \x07 !\x07 A\bG\r\0\vC\0\0? \x07C\0\0\0>\" C\0\0?^\x1B\"\n!\x07 A	N@ #.!A\b!@ !\0 \x07 # Aj\"Atj.\0\" \0k &t\"A\0L}C\0\0\0\0 A \0 &tAt\"j!\0  :j! Aq!,A\0!-C\0\0\0\0!A\0!@ AO@ Aüÿÿÿ\x07q!%A\0!\x1B@  At\"A\fr\"1j*\0 \0 1j*\0  A\br\"1j*\0 \0 1j*\0  Ar\"1j*\0 \0 1j*\0  j*\0 \0 j*\0 ! Aj! \x1BAj\"\x1B %G\r\0\v ,E\r\v@  At\"j*\0 \0 j*\0 ! Aj! -Aj\"- ,G\r\0\v\v \v\"  \x07^\x1B!\x07  G\r\0\v\vCÅ ? \n \n»!iCÅ ?C\0\0? \x07 \x07C\0\0?^\x1B\" »!j  *äC\0\0>\" iDþ+eG÷?¢¶\"\x07C\0\0\0?\"\n jDþ+eG÷?¢¶\"\f \n \f^\x1BC\0\0\0¿\"\n  \n]\x1B8ä \rC\0\0À \x07C\0\0@?\" C\0\0À]\x1B!\r\vA    AL\x1B!A k!\0 Ak\"A~q!\x1B Aq!#C\0\0\0\0!A\0!@@ AH\r\0 4 *(\b lAtj!A\0!A\0!- AG@@  Ar\"Atj*\0 At \0j²  Atj*\0 At \0j² ! Aj! -Aj\"- \x1BG\r\0\v #E\r\v  Atj*\0 At \0j² !\v Aj\" G\r\0\v \rC\0\0\0ÀC\0\0\0@    l²C\0\0?C\0\0À@\" C\0\0\0@^\x1B C\0\0\0À]\x1B  \b \b!A\n H(\0} C\0\0\0ÀC\0\0\0@ H*\bCÍÌL=\" \" C\0\0\0@^\x1B C\0\0\0À]\x1B \vC\0\0\0?ü\0\"\0A\0 \0A\0J\x1B\"\0 \0A\nN\x1B\v\"-AÔA\x07\x07 !\x1B\v  \x1BjA?jAuAj!@ 0@ GA\0L\r   VjAu\"\0 \0 H\x1B!  A¸l GjA k\"\0A\0 \0A\0J\x1B\f\v GA\0L\r G Atk\v! =Aû	 Rv\"\0 \0 =J\x1B!\0 *($ &k!4 (4\"#@ (Ø 4u j!\v@ 0E@ *( \"= (\\\" *(\b\"A \x1B\"Atj.\0! (è!  AF =    J\x1BAtj.\0 j \v &t!  H(\0\",E\r\0  *\"»DÙ?cE\r\0 CÍÌÌ>  At²ü\0k\v! (@! 3*! 3(  AF@  =    J\x1B\"Atj.\0 &t k\"²CÍÌL? ² ²\"\x07 *ä\"\bC\0\0? \bC\0\0?]\x1BCÍÌÌ½ At²\"\b \x07 \b]\x1Bü\0k!\v (ì!Am &tj j\" CX94½ ²ü\0j!@ \r\0 ,E\r\0 A\0 At²\"\x07CÍÌL?ü\0 Z\x1Bj \x07C?CÂõ½ *|C¾\"\x07CÂõ½ \x07C\0\0\0\0]\x1Bü\0j!\v E A\0Gr\"E@ Am\"   At²ü\0j\"  H\x1B!\v  Au\" 	   = AAtjAk.\0 &tlAt²ü\0\"=  =J\x1B\"  H\x1B! #E ErE@   k²C+?ü\0j!\v@ CÍÌL>]E\r\0 \r\0   AîL}AúAî k\" AúO\x1B³C	P6C\0\0\0\0\v ²ü\0j!\v At\"   H\x1B!\f\v 3*\"C\0\0¾C\0\0ÈCü\0Aà\0 RvA\0 (¼\"Aä\0H\x1B jA RvA\0 Aä\0J\x1Bkj! C333?^E\r\0A  AL\x1B!\v \0   \x1Bj\"A jAu\"  H\x1B\" \0 H\x1B!Co:!\x07 (Ü\"AÉ\x07L@  Aj6ÜC\0\0? Aj²!\x07\v A I\x1B!@ #E\r\0  (Ð AtA I\x1B Gkj\"6Ð  (Ô\" \x07  GkA\0 I\x1B 4t  (Øjk²ü\0j\"6Ô A\0 k6Ø A\0N\r\0 A\x006ÐA\0 kAvA\0 I\x1B j!\v  \0  \0 H\x1B\"=\v \" 9AtAjApq\"k\"\0$\0 \0 k\"\"$\0  k\"$\0 * 0  ( \" - Aèj 3A$j =At\"4 Asj\"A\bA\0  &AKq  &AtAjNq\"(\x1B\"#k 3A j  \0    & A (\\A H(\0 (\"A\r  Aúl J\r\0A  A÷l J\r\0A  AàÔl J\r\0AA   AñlH\x1B\v\"  J\x1B Ak\v (@\x1Bk!  (\\\" Aj\" Ak\"   H\x1B\"\x1B  J\x1B \x1B  N\x1B \v6\\  0\"J@A    AL\x1B!\"@@ \0 At\"j\"(\0\"A\0L\r\0 (g (   ljjA k (AtJ\r\0A\0!\x1B  )j!A  +j!A tAu\"Ak!- ²! *(\b!@    \x1BlAtj*\0C\0\0?C\0\0\0? ü\0\" -  -H\x1B\"A\0 A\0J\x1B\",  A *(\b\" \x1BlAt\"j\" *\0 ,³C\0\0\0?AA (\0\"kt²C\0\08C\0\0\0¿C\0\0?\"\x078\0  j\", ,*\0 \x078\0 \x1BAj\"\x1B \"G\r\0\v\v Aj\" G\r\0\v\v DAt\"\x1BE\"E@ JA\0 \x1Bü\v\0\v  ?AjApqk\"$\0A * 0  : : .AtjA\0  AF\x1B  '  / (P 3($ (è ! 4 #k 3(   &  AÌ\0j ( (H (Dh (@  (tAHA\v \0! =At ( (gjkA j!A    AL\x1B!@  0\"\0L\"-\r\0   H\r\0 \0!@@  At\"j\"4(\0A\x07J\r\0  j(\0\r\0  )j!(  +j!/ *(\b!A\0!&@  /  &lAtj*\0C\0\0\0\0]\"EAC\0\0\0¿C\0\0\0? \x1BAA\r 4(\0kt²C\0\08! *(\b\" &l!. )@ ( .Atj\"#  #*\08\0\v / .Atj\". .*\0 8\0 &Aj\"& G\r\0\v  k!\v Aj\" N\r   N\r\0\v\v@ -\r\0   H\r\0@@  \0At\"j\".(\0A\x07J\r\0  j(\0AG\r\0  )j!-  +j! *(\b!A\0!&@    &lAtj*\0C\0\0\0\0]\"EAC\0\0\0¿C\0\0\0? \x1BAA\r .(\0kt²C\0\08! *(\b\" &l!/ )@ - /Atj\"4  4*\08\0\v  /Atj\"/ /*\0 8\0 &Aj\"& G\r\0\v  k!\v \0Aj\"\0 N\r   N\r\0\v\v  0kAq!A\0!\0  0Aj\"F!@@ $\r\0 \0 9l! 0! @ J  jAt\"jC\0\0\0¿C\0\0\0?  +j*\0\" C\0\0\0?^\x1B C\0\0\0¿]\x1B8\0 !\v \r\0 Aj!/@ J  jAt\"jC\0\0\0¿C\0\0\0?  +j*\0\" C\0\0\0?^\x1B C\0\0\0¿]\x1B8\0 J  /jAt\"jC\0\0\0¿C\0\0\0?  +j*\0\" C\0\0\0?^\x1B C\0\0\0¿]\x1B8\0 Aj\" G\r\0\v\v \0Aj\"\0 7G\r\0\v@ I ?A\0Lr\r\0 ?A\x07q!A\0!A\0! ?AkA\x07O@ ?Aøÿÿÿ\x07q!A\0!@ ) Atj\"\0BðA7 \0BðA7 \0BðA7\b \0BðA7\0 A\bj! A\bj\" G\r\0\v E\r\v@ ) AtjA|6\0 Aj! Aj\" G\r\0\v\v  3(,6h 3*(!  X6p  8l@ [E\r\0 9At\"\0E\r\0 \0 )j ) \0ü\n\0\0\v@ @ DA\0L\rA\0! DAG@ DAq DAþÿÿÿ\x07q!A\0!@ B At\"\0j\" *\0\" \0 )j*\0\"\x07  \x07]\x1B8\0 B \0Ar\"\0j\" *\0\" \0 )j*\0\"\x07  \x07]\x1B8\0 Aj! Aj\" G\r\0\vE\r\v B At\"\0j\" *\0\" \0 )j*\0\"\x07  \x07]\x1B8\0\f\v E@ F B \x1Bü\n\0\0\v \r\0 B ) \x1Bü\n\0\0\v 0Aþÿÿÿ\x07q! 0Aq! 9 kAq!\x1B 9 Aj\"\0F!.A\0!/@@ 0A\0L\r\0 / 9l!A\0!A\0! 0AG@@ )  jAt\"jA\x006\0  FjA|6\0  BjA|6\0 ) Aj\"jA\x006\0  FjA|6\0  BjA|6\0 Aj! Aj\" G\r\0\v E\r\v )  jAt\"jA\x006\0  FjA|6\0  BjA|6\0\v@  9N\r\0 / 9l! ! \x1B@ )  jAt\"jA\x006\0  FjA|6\0  BjA|6\0 \0!\v .\r\0 Aj!@ )  jAt\"jA\x006\0  FjA|6\0  BjA|6\0 )  jAt\"jA\x006\0  FjA|6\0  BjA|6\0 Aj\" 9G\r\0\v\v /Aj\"/ WG\r\0\v  E LAsqA\0 (tAj\v6t  (6L vA} = (,\x1B!\v 3Aà\0j$\0 \v}@ AkAI@ Aq\r A\0J@CÛI@ Ar²\"C\0\0\0@  \"C\0\0\0? AI\"\x1B!C\0\0\0\0C\0\0? \x1B!@ \0 \x07At\"j    j*\0C\0\0\0?8\0 \0 Ar\"\bj   \bj*\08\0 \0 A\br\"\bj    \"  \bj*\0C\0\0\0?8\0 \0 A\fr\"j   j*\08\0   ! \x07Aj\"\x07 H\r\0\v\v\vAü×\0A3A0\0\vA»î\0A3A3\0\v÷#\0\"@@@ Aq@ Aø\0G\r B\x007\0 B\x007\0x Ak\"\"$\0A\b!A\f\v  AtAjApqk\"\"$\0 Au\"A\0L\r \v!	@  j\"-\0\0!\b  Atj\"\x07 -\0\" ÀA\x07u\"s kAÿq6 \x07 \b \bÀA\x07u\"s kAÿq6\0  Ar\"j-\0\0!\b  Atj\"\x07 -\0\" ÀA\x07u\"s kAÿq6 \x07 \b \bÀA\x07u\"s kAÿq6\0 Aj\" 	H\r\0\v  AtAjApq\"\x07k\"\"$\0  \x07k\"$\0A\xA0-\0\0!\nA\xA0-\0\0!A\xA0-\0\0!A\xA0-\0\0!A\0!	A\0!\x07 !@   At\"j\"A\x006\0  j!\x1B (! (\0!A\0!!@A!@@@   j\"H@ \f! \r!\v !\r !\f 	!\b \x07!\f\v  (\f (\bj\"\vH@ \r!\v !\r !\f 	!\b \x07!\f\v  ( (j\"\rH@ !\r !\f 	!\b \x07!\f\v  ( (j\"\fH@ !\f 	!\b \x07!\f\v  ($ ( j\"\bH@ 	!\b \x07!\f\v  (, ((j\"H@ \x07!\f\v (4 (0j\" L\r\v !A!\x07\f\v \" (< (8j\"\x07 \x07 J\"\x07\x1B!\"\v@@  \v j\"H@ ! \v!\f\v  \f \rj\"H@ \v!\f\v  \bj\" L\r\v \r! \f\f\v \f  \"j\"	 	 J\"\x1B\v!  j\" J\"\v  j\"\f Jr\"\r \x07 jj!	 \n  \f \r\x1B\"\r   \v\x1B\"\fj\"\x07N \x1B \x076\0A\0A\v 	r@  !Aj\"!6\0  Au\"6  Au\"6\0  (\bAu6\b  (\fAu6\f  (Au6  (Au6  (Au6  (Au6  ( Au6   ($Au6$  ((Au6(  (,Au6,  (0Au60  (4Au64  (8Au68  (<Au6< \b!	 !\x07 !\f\v\v A@k!A! \b!	 !\x07 !  Aj\"  G\r\0\v\f\vAêâ\0A¦ AÙ\0\0\v  AtAjApq\"\x07k\"\"$\0  \x07k\"$\0\v A~q! Aq! Au\"A	lA°£j!Aÿÿÿÿ\x07!\rA\0!\fA\0!\b@ \f j-\0\0!@ E\r\0 \fAlAà¡j\"Aj!A\0!A\0!\v AG@@   At\"\x07j(\0A\0L  \x07 j(\0j \v-\0\0j !  ArAt\"\x07j(\0A\0L@  \x07 j(\0j!\v Aj! -\0\0j! \vAj\"\v G\r\0\v E\r\v   At\"\x07j(\0A\0L  \x07 j(\0j \v-\0\0j!\v \f \b \r J\"\x1B!\b  \r \x1B!\r \fAj\"\fA	G\r\0\v \0 \b A	lA£jA\b\x07 @ \bAlA\xA0\xA0j!A\0!\v@ !@  \vAt\"\bj(\0\"\x07E\r\0 \0A A\b\x07AÂ¡! \x07AH\r\0 \x07Ak!	A\0!@ \0AAÂ¡A\b\x07  	G Aj!\r\0\v\v \0 \b j(\0 A\b\x07 \vAj\"\v G\r\0\vA\0!@  Atj(\0A\0J@  Atj\"\n(< \n(8j\"\f \n(4 \n(0j\"j\" \n(, \n((j\" \n($ \n( j\"\x1Bj\"j\"\r \n( \n(j\"\b \n( \n(j\"j\"	 \n(\f \n(\bj\"\x07 \n( \n(\0j\"\vj\"j\"j\"A\0J@ \0  -\0Ð¨A°§jA\b\x07\v A\0J@ \0  -\0Ð¨A¦jA\b\x07\v A\0J@ \0 \v -\0Ð¨Að¤jA\b\x07\v \vA\0J@ \0 \n(\0 \v-\0Ð¨AÐ£jA\b\x07\v \x07A\0J@ \0 \n(\b \x07-\0Ð¨AÐ£jA\b\x07\v 	A\0J@ \0  	-\0Ð¨Að¤jA\b\x07\v A\0J@ \0 \n( -\0Ð¨AÐ£jA\b\x07\v \bA\0J@ \0 \n( \b-\0Ð¨AÐ£jA\b\x07\v \rA\0J@ \0  \r-\0Ð¨A¦jA\b\x07\v A\0J@ \0 \x1B -\0Ð¨Að¤jA\b\x07\v \x1BA\0J@ \0 \n(  \x1B-\0Ð¨AÐ£jA\b\x07\v A\0J@ \0 \n(( -\0Ð¨AÐ£jA\b\x07\v A\0J@ \0  -\0Ð¨Að¤jA\b\x07\v A\0J@ \0 \n(0 -\0Ð¨AÐ£jA\b\x07\v \fA\0J@ \0 \n(8 \f-\0Ð¨AÐ£jA\b\x07\v\v Aj\" G\r\0\vA\0!@  Atj(\0\"\x07A\0J@  Atj!\bA\0!\v@ \b \vj-\0\0\" ÀA\x07u\"s kÀ!\r \x07\"AG@@ \0 \r Ak\"vAqAðA\b\x07 AJ !\r\0\v\v \0 \rAqAðA\b\x07 \vAj\"\vAG\r\0\v\v Aj\" G\r\0\v\v \0! !\0A\0!	#\0Ak\"\b$\0 \bA\0:\0 A\bjAu\"A\0J@ At AtjAuA\x07lAð¨j!@ \0 	Atj(\0\"A\0J@ \b A Aq\" AO\x1Bj-\0\0:\0A\0!\x07@  \x07j,\0\0\"@  A\0N \bAjA\b\x07\v \x07Aj\"\x07AG\r\0\v\v Aj! 	Aj\"	 G\r\0\v\v \bAj$\0$\0\vû#\0A0k\"\x07$\0@@ \0 A$ljA´0j \0A%j \x1B\",\0At ,\0j\"AI@ A\0 AM\x1B\r@ E AIqE@  AkAõA\b\x07\f\v  AùA\b\x07\v ,\0\0!@ AF@  AÀA\b\x07\f\v  Au ,\0AtA\xA0jA\b\x07  -\0\0A\x07qA\xA0A\b\x07\v \0(ä#AN@A!@   j,\0\0AÀA\b\x07 Aj\" \0(ä#H\r\0\v\v  ,\0\b \0(Ô$\"( .\0 ,\0AuljA\b\x07 \x07Aj \x07 \0(Ô$ ,\0\b3 \0(Ô$\".\" \0(\xA0$G\rA\0! A\0J@ A\bj!\n@@ \n \"Aj\"j\"\b,\0\0\"	AN@ A\b ( \x07Aj Atj.\0jA\b\x07  \b,\0\0AkA¨A\b\x07\f\v 	A|L@ A\0 ( \x07Aj Atj.\0jA\b\x07 A| \b,\0\0kA¨A\b\x07\f\v  	Aj ( \x07Aj Atj.\0jA\b\x07\v  \0(Ô$\".H\r\0\v\v \0(ä#AF@  ,\0AûA\b\x07\v@ -\0AG\r\0@@ AG\r\0 \0(-AG\r\0  . \0.-k\"A	jA\0 A\bjAI\"\x1BAÐü\0A\b\x07 \r\v  .\" \0(à#Au\"m\"A°ü\0A\b\x07   Á Álk \0(Ì$A\b\x07\v \0 /;-  ,\0 \0(Ð$A\b\x07  ,\0 AéA\b\x07 \0(ä#A\0J@ Aj!A\0!@   j,\0\0 ,\0 AtA°j(\0A\b\x07 Aj\" \0(ä#H\r\0\v\v \r\0  ,\0!AòA\b\x07\v \0 ,\06-  ,\0\"AA\b\x07 \x07A0j$\0\vAÑ\0AÀ!A;\0\vAáÔ\0AÀ!A<\0\vA¸AÀ!AÝ\0\0\vÞ\b}#\0AÀk\"	$\0@@@@@@@ \0(\b\"\nAkAI@@ \0(\f\"\bAÿü\0L@ \bAÀ>F\r \bAàÝ\0F\r\f	\v \bAý\0F\r\0 \bAÀ»F\r\0 \bA÷G\r\b\v \0( \bG\r@ \0(\"\x07AßÝ\0L@ \x07E\r \x07AÀ>F\r\f\b\v \x07AàÝ\0F\r\0 \x07Aý\0G\r\x07\v \0( \nG\r \0(AO\r \0( \"\x07AK\rA \x07tAÀ\0qE\r\f\vAÞÕ\0A¸'Aã\0\0\vA£A¸'Aé\0\0\vAå\rA¸'Aë\0\0\vAòÖ\0A¸'Aì\0\0\v \x07A(F\r\0 \x07A<F\r\0Aà\0A¸'Aí\0\0\v@@@@@@@ \0(8\"\x07A\0N@ \x07\rA!\x07 \0(<AkAO\r AK\r\x07@@ E\r\0 E\r\0 E\r\v  \bAÿÿqAno\r\b\vA\0!\n A\0 \x1BE@@ \0A\0A\0  \0(\b \nlAtj  \nkA\0\"\x07A\0H\r	 \x07 \nj\"\n H\r\0\v  \nG\r\f\x07\v A\0H\r\x07 -\0\0\"\x07Aà\0q!\v \x07À\"\fA\0H@ \x07AvAq\"\x07AÎ\bjAÍ\b \x07\x1B\f\vAÑ\bAÐ\b \x07Aq\x1B \vAà\0F\r\0 \x07AvAÍ\bj\v!\r  \b$!\n -\0\0!\x07   	A»jA\0 	AÐ\0j 	A¼j 	AÌ\0j 	AÈ\0j?! \0(4@ 	A\x006H 	A\x006L\v A\0H@ !\x07\f\b\vAé\x07Aè\x07 \vAà\0F\x1B!\vAA \x07Aq\x1B! 	(L!\x07@@@ 	(H\"\bA\0N@ \x07A \b\x1BE\r A1O\r 	 \x076 	 \x076 	 \x076\f 	 \b6$ 	 \b6  	B\x007 	B\x007< 	 68 	 64 	A\x0060 	B\x007( 	A\0:\0D\f\vAÍé\0AÈAú\0\0\vA­ì\0AÈAû\0\0\vAÃÍ\0AÈAü\0\0\v  	(¼j! @@@ \fA\0H\r\0  \nH\r\0 \0(DAê\x07G\r\v \0A\0A\0  A\0 -!\x07\f	\v  \nk!  \nG@ \0(T! \0A\0A\0  A\0 -\"\x07A\0H@ \0 6T\f\n\v  \x07G\r\v \0 \n6L \0 \r6@ \0 \v6D \0 6< \0  	.P  \0(\b lAtj \nA\"\x07A\0N\r\x07\f\b\vA~!\x07  \nl J\r\x07 \0 \n6L \0 \r6@ \0Aê\x07 \v \fA\0H\x1B6D \0 6<A\0!\x07 @A\0!@ \0  	AÐ\0j Atj\"\v.\0  \0(\b \x07lAtj  \x07kA\0\"\bA\0H@ \b!\x07\f\n\v \b \nG\r\x07 \x07 \nj!\x07  \v.\0j! Aj\" G\r\0\v\v \0 \x076T @ \0(8 \0(\b!A\0!A\0!\n@ \0AØ\0j\"\fE\r\0 E\r\0 \x07A\0L\r\0 A\0L\r\0 !A\0!\0A  \x07l\"A\0L\r\0 AG@ Aq! Aþÿÿÿ\x07q!@  \0Atj\"C\0\0\0@C\0\0\0À *\0\" C\0\0\0À]\x1B\" C\0\0\0@^\x1B8\0 C\0\0\0@C\0\0\0À *\" C\0\0\0À]\x1B\" C\0\0\0@^\x1B8 \0Aj!\0 Aj\" G\r\0\vA\0 E\r\v  \0Atj\"\0C\0\0\0@C\0\0\0À \0*\0\" C\0\0\0À]\x1B\" C\0\0\0@^\x1B8\0A\0\v!\r@  \nAt\"\0j!\b \0 \fj\"*\0!A\0!@  \b  lAtj\"\0*\0\"\"C\0\0\0\0`E@ \0   8\0 Aj\" \x07G\r\v\v@ \r@C\0\0\0\0!\f\v \b*\0!A\0!\0@@ \0\"\" \x07N\r\0@ \b  lAtj*\0C\0\0?^\r Aj\" \x07G\r\0\vC\0\0\0\0!\f\v  \x07F@C\0\0\0\0!\f\v Au q! \b  lAtj*\0!@ \"\0A\0L\r\0@  \b \0Ak\" lAtj*\0C\0\0\0\0`@ \0AH !\0E\r\f\v\v \0!\v !@ \"\0 \x07N\r\0@  \b \0 lAtj*\0\"C\0\0\0\0`E\r \0  \" ^\"\x1B!   \x1B! \0Aj\"\0 \x07G\r\0\v \x07!\0\vA\0!\v E@  \b*\0C\0\0\0\0`!\v\v C\0\0¿  \"CYÙ4 \"  C\0\0\0\0^\x1B!@ \0 L\r\0 Aj! \0 kAq@ \b  lAtj\"  *\0\"  8\0 !\v \0 F\r\0@ \b  lAtj\"  *\0\"  8\0 \b Aj lAtj\"  *\0\"  8\0 Aj\" \0G\r\0\v\v@ \v AJqE\r\0  L\r\0  \b*\0\" ³! Aj!  kAq@ \b  lAtj\"C\0\0¿C\0\0?  \" *\0\" C\0\0?^\x1B C\0\0¿]\x1B8\0 !\v  F\r\0@ \b  lAtj\"C\0\0¿C\0\0?  \" *\0\" C\0\0?^\x1B C\0\0¿]\x1B8\0 \b Aj lAtj\"C\0\0¿C\0\0?  \" *\0\" C\0\0?^\x1B C\0\0¿]\x1B8\0 Aj\" G\r\0\v\v \0 \x07G\r\0\v\v  8\0 \nAj\"\n G\r\0\v\v\f\b\v \0B\x007X\f\x07\vAèé\0A¸'Aï\0\0\vAÃÁ\0A¸'Að\0\0\vAÕ\0A¸'Aò\0\0\vAÍA¸'A\0\vAA¸'A¯\0\vAðA¸'Aá\0\v \0 6T !\x07\v 	AÀj$\0 \x07\vAä\0A¸'Aê\0\0\vAã\0A¸'Aç\0\0\vé\n} \0(!	 \0(\0!\x07@ A\0L\r\0 A\x07q!\n A\bO@ Aøÿÿÿ\x07q!\v@ 	 \x07AtA|qj \x07A|qj \x07AuAtj \x07AuAtj \x07AuAtj \x07AuAtj \x07A\x07uAtj \x07A\bu\"\x07Atj!	 \bA\bj\"\b \vG\r\0\v \nE\r\vA\0!\b@ 	 \x07Au\"\x07Atj!	 \bAj\"\b \nG\r\0\v\v \x07Au!\v  AtA|qj!\b \0 Atj(\b!\f \x07Au\"\0A\0J@A\0!\x07 	 \0Atj!\r  \vAk lAtj! \f(,!\nA\0 At\"kAt!@ \b \n.\0Atj\" *\0\" 	 \x07At\"j*\0\" *\0\" \r j*\0\"8\0     8 \nAj!\n  j!  Atj! \x07Aj\"\x07 \0G\r\0\v\v \f \b/ \0AjAu\"A\0J@ 	 \vAt\"j! 	 \0Atj!\0  \bj!\x07A\0!@ \x07Ak\"\n*\0! \x07A\bk\"\x07*\0! \b \b*\" 	 At\"\vj*\0\" \b*\0\" \0 \vj*\0\"8\0 \n    8\0 \x07  \0 AsAt\"\nj*\0\"   \nj*\0\"8\0 \b    8 \bA\bj!\b Aj\" G\r\0\v\v AN@ Am!\0  At\"j!\b  j!\x07A\0!	@  *\0\" \x07Ak\"\x07*\0\" \bAk\"\b*\0\" *\0\"8\0 \b    8\0 Aj! Aj! 	Aj\"	 \0G\r\0\v\v\v}#\0A k\"$\0 \0(\b!\v A6\0 \0A\fj!A!@  \"Atj\"/  Aj\"Atj  .\0l\"6\0AG\r\0\v \vA\0 \vA\0J\x1B!  AtjAk.\0!@@ !A\0!A! \"\v@  At\"jAk.\0!\v@@@@@  j/\0Ak\0\v AG\rA\0! !  \vAtj(\0\"A\0L\r@  *\0\" * \"\x1B8   *$\" *\"8   8$  \x1B 8\0  *\b\" *(\" *,\"Có5?\"\x1B8(  *\f\"  Có5?\"8,   \x1B8\b   8\f *0!  *\"\x1B *4\"80   *\"84   8   \x1B8  *\" *<\" *8\"Có5?\"\x1B88  *\"  Có5¿\"8<   8   \x1B8 A@k! Aj\" G\r\0\v\f\v  \vAtj(\0!	 AG@ 	A\0L\r 	 t\"\fAl! \fAt! Al! At!\n \0(0!A\0!\r@ A\0J@  \r lAtj!A\0! \"! !\x07@ *\0!&  \nj\" *\0\") *\"* *\0\" *\"\"+ *\",\"%  Atj\"*\0\"- \x07*\"\" \x07*\0\"# *\"\x1B\"  j\"\b*\0\"$ *\" *\0\" \b*\"\" \"!8  & )   *\"\" - # \x1B \"\"\x1B $   \"\"8\0  ! %8   8\0  , +\" \x1B \"\x1B8  & \"   \"8\0 \b  \x1B8 \b  8\0 A\bj!  j!  j! \x07 \fAtj!\x07 Aj\" G\r\0\v\v \rAj\"\r 	G\r\0\v\f\vA\0! ! 	A\0L\r@  *\" *\"\x1B\"\" *\f\"# *\"\"$8  *\0\" *\" \"! *\b\" *\"\"8   \x1B\"  \"\x1B8    \" # \"8   \x1B8\f   8\b  \" $8  ! 8\0 A j! Aj\" 	G\r\0\v\f\v  \vAtj(\0\"A\0L\r \0(0\"  t\" lAtj*!\" At! At!A\0!\f@  \f lAtj! \"!\x07 !\n@  Atj\"\b *\0 \b*\0\"# \x07*\0\" \b*\"$ \x07*\"\x1B\"  j\"*\0\"  *\0\"! *\" *\"\"\"C\0\0\0?8\0 \b * # \x1B  $\"\x1B    ! \"\"C\0\0\0?8   *\08\0   *8  \" \x1B \" \b*\08\0  \b* \"  \"8 \b \b*\0 8\0 \b  \b*8 A\bj!  j! \x07 Atj!\x07 \nAk\"\n\r\0\v \fAj\"\f G\r\0\v\f\v  \vAtj(\0\"A\0L\r\0 \0(0\"	  t\"\r lAtj\"*\0!' 	 \rAt\"\b lAtj\"*\0!( \rAt!\f \rAl! At! Al! At! *\".!4 *\"/!5A\0!@ A\0J@   lAtj\" Atj!  j!  j!\x07  j!A\0!\n@ *\0!0  *\"1 *\0\"6 	 \b \nlAtj\"*\"& *\0\") *\"\"* \x07*\0\"+ 	 \n lAtj\"*\", *\0\"% \x07*\"\x1B\"-\"2 *\0\"\" 	 \n \rlAtj\"*\"# *\0\" *\"\"$ *\0\" 	 \n \flAtj\"*\"  *\0\"! *\"\"\"38  0 6 )  &\" + % \x1B ,\"\x1B\"% \"   #\"  !   \"\"8\0  1 3 ' ( 2\"  \"  . /  \x1B\"!\"8  0  ' ( %\"\x1B $ \" . / * -\"\"8\0   8   \x1B8\0  1 3 ( ' 2\"   / ! 4\"\x1B8   .  5\" 0  ( ' %\"8\0 \x07  \x1B8 \x07  8\0 A\bj! \x07A\bj!\x07 A\bj! A\bj! A\bj! \nAj\"\n G\r\0\v\v Aj\" G\r\0\v\v \vAk! \vA\0J\r\0\v A j$\0\vA¶Ò\0A¼AÐ\0\0\vµ\x07\v} A\0J@@ AI\r\0 AN@ Ak!\v Ak!\f AF!\r Aüÿÿÿ\x07q\"\nAr O! \nAr O!@  	At\"\bj\"\x07A\fj! \x07*\b! \x07*! \x07*\0!C\0\0\0\0!C\0\0\0\0!C\0\0\0\0!C\0\0\0\0! \0!A\0!\x07C\0\0\0\0! \rE@@ *\f\" *\f\" *\b\" *\b\" *\"\x1B *\" *\0\" *\0\" !     \x1B    !     \x1B    !     \x1B    ! Aj! Aj! ! ! ! \x07Aj\"\x07 \fH\r\0\v\v  \nF@ !\x07 \f\v Aj!\x07 *\0\" *\0\" !   !   !   ! Aj\v! @ \x07! \f\v \x07Aj! *\0\" \x07*\0\" !   !   !   ! Aj\v!\x07 E@ \x07*\0\" *\0 !   !   !   !\v  \bj\" 8\f  8\b  8  8\0 	Aj\"	 \vH\r\0\v\f\vA¶Ó\0AîAÅ\0\0\v  	J@ Aüÿÿÿ\x07q!\r Aq!\n A\0L! AI!@ 	At!\v@ @C\0\0\0\0!\f\v  \vj!A\0!\x07C\0\0\0\0!A\0!\fA\0! E@@ \0 At\"A\fr\"\bj*\0  \bj*\0 \0 A\br\"\bj*\0  \bj*\0 \0 Ar\"\bj*\0  \bj*\0 \0 j*\0  j*\0 ! Aj! \fAj\"\f \rG\r\0\v \nE\r\v@ \0 At\"j*\0  j*\0 ! Aj! \x07Aj\"\x07 \nG\r\0\v\v  \vj 8\0 	Aj\"	 G\r\0\v\v\vAÞ\0A)A\0\ví} \0(, l!\v  \0( \"\f Atj.\0l!	 \x07AG@ 	 \v \x07m\"\0 \0 	J\x1B!	\vA\0  \b\x1B!\n  \fA\0  \b\x1B\"Atj.\0\"\rl\"At!\x07 @  A\0L\r At\"\0@ A\0 \0ü\v\0\v \0 j\f\v  \x07j\v!\0  \nH@  \x07j! !@C\0\0\0B  At\"\x07j*\0 \x07A°j*\0\" C\0\0\0B^\x1B»Dï9úþB.æ?¢¶!  \rl!\x07  \f Aj\"Atj.\0\"\rl!@ \0 *\0 8\0 Aj! \0Aj!\0 \x07Aj\"\x07 H\r\0\v  \nG\r\0\v\v  \nL@ \vA\0 	 \b\x1B\"\0kAt\"@  \0AtjA\0 ü\v\0\v\vAØAÜ\"Aþ\0\v \0(\" n! \0 @ \0 \0(    kl jj6    kl\f\v   kl j\v\"6 AM@ \0( !@@ Av\"AÿG@ Av! \0((\"A\0N@A! \0 \0( \0(\" \0(\bjK \0 Aj6 \0(\0 j  j:\0\0A\0A\v \0(,r6,\v \0($\"@ Ak!@A! \0 \0( \0(\" \0(\bjK \0 Aj6 \0(\0 j :\0\0A\0! \0($ \vAk\"6$ \0 \0(, r6, \r\0\v\v \0 Aÿq6( \0(! \0( !\f\v \0 \0($Aj6$\v \0 A\bt\"6 \0 A\btAþÿÿ\x07q\"6  \0 \0(A\bj6 AI\r\0\v\v\vº .\"A\0J@ (  lAmj!A\0!@ \0 Atj -\0\0\"AvA\x07qA	l;\0  j ( j .AkA\0 Aq\x1Bj-\0\0:\0\0 \0 Ar\"Atj AvA	l;\0  j ( j .Ak A\x1BtAuqj-\0:\0\0 Aj! Aj\" .H\r\0\v\v\v¤ \0A\0Aü\v\0@@ \0 @@ Aÿü\0L@ AÀ>F\r AàÝ\0F\r\f\v Aý\0F\r\0 A÷F\r\0 AÀ»G\r\v@ AÀ>F\r\0 AàÝ\0F\r\0 Aý\0G\r\vA A\fv Aý\0Kk AÀ»Kv\" AO\x1BAl A\fvjAìû\0j\f\v@ AÀ>F\r\0 Aý\0F\r\0 AàÝ\0G\r\v@ Aÿü\0L@ AÀ>F\r AàÝ\0F\r\f\v Aý\0F\r\0 AÀ»F\r\0 A÷G\r\v A\fvAlA A\fv Aý\0Kk AÀ»Kv\" AO\x1BjAü\0j\v,\0\x006 \0 AÿÿqAè\x07n6 \0 AÿÿqAè\x07n\"6ü \0 A\nl6ì@  I@A! At F@ \0A6èA\0!\f\v \0A6è\f\v  K@ \0A6è At\" AlF@ \0Aàø\x006 \0B07ôA\0!\f\v Al\" AtF@ \0A\xA0ù\x006 \0B 7ôA\0!\f\v  AtF@ \0AÐù\x006 \0B7ôA\0!\f\v  F@ \0Aðù\x006 \0B¤7ôA\0!\f\v  F@ \0A\xA0ú\x006 \0B¤7ôA\0!\f\v  AlF@ \0AÐú\x006 \0B¤7ôA\0!\f\vAÿï\0A%A£\0\vA\0! \0A\x006è\v  t! AvAjAv!  Art nAt! Á!@ \"Aj! Av l  lj Aÿÿq lAuj H\r\0\v \0 6ðA\0\vAÿï\0A%Aî\0\0\vAÿï\0A%Aã\0\0\v¨\0@ A\bN@ \0D\0\0\0\0\0\0à¢!\0 AÿI@ Aÿ\x07k!\f\v \0D\0\0\0\0\0\0à¢!\0Aý  AýO\x1BAþk!\f\v AxJ\r\0 \0D\0\0\0\0\0\0`¢!\0 A¸pK@ AÉ\x07j!\f\v \0D\0\0\0\0\0\0`¢!\0Aðh  AðhM\x1BAj!\v \0 Aÿ\x07j­B4¿¢\vð\r@@ AJ@ Aq\r  H\r  K@ Aq!\f A\bk\"\rAvAjA~q! AF! !\v@ .  \vAt\"j\"Ak.\0l .\0 Ak\"\x07.\0lj . Ak.\0lj . A\bk.\0lj .\b A\nk.\0lj .\n A\fk.\0lj!\b@ \r\0A\0!\nA! \r@@  At\"j\"	. \x07A~ kAtj.\0l 	.\0 \x07 k.\0l \bj 	. \x07 AsAtj.\0ljj 	. \x07A} kAtj.\0lj!\b Aj! \nAj\"\n G\r\0\v \f\r\v \b  At\"	j\"\n.\0 \x07 	k.\0lj \n. \x07 AsAtj.\0lj!\b\v \0 jAÿÿA~ .\0A\ft \bkA\vuAjAu\" A~L\x1B\" AÿÿN\x1B;\0 \vAj\"\v G\r\0\v\v At\"@ \0A\0 ü\v\0\v\vAöÐ\0A¹$AÃ\0\0\vAî\0A¹$AÄ\0\0\vAìA¹$AÅ\0\0\v#\0AÐk\"$\0  6Ì \0(p\"AG@ \0 \0(\0j!\vA{!@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ A\xA0k2\x07\b	\n\r\v\f,,,\x1B&,,,,,,, !\"#,,$%,*\0\v@ AÎ\0k\f+,,,,,,,,(,)\0\v AúÕ\0k&++++++++++++++++\v  (Ì\"Aj6ÌA! A~qAF\r* (\0\"Ak\"AK\r* AF\r* \0(´oE  Gq\r* \0 6È \0 6pA\0!\f*\v  (Ì\"\0Aj6Ì \0(\0\"\0E@A!\f*\v \0 6\0A\0!\f)\v  (Ì\"Aj6Ì \0 (\0\"AxF@ \f\vA!  AF\r\0 A\0L\r)Aô AõI\r\0  \0(tA°ã-l\"\0 \0 J\x1B\v6¨A\0!\f(\v  (Ì\"Aj6Ì (\0\"E@A!\f(\v  \0(¤o\" \0(\"Am \x1B!@ \0(¨\"AF@AàÆÛ\0!\f\v AxG\r\0 \0(t l A<l mj!\v  Al mAàÏ\0lAm\"\0 \0 J\x1B6\0A\0!\f'\v  (Ì\"Aj6Ì@ (\0\"A\0J@  \0(tL\rA!\f(\v AxF\r\0A!\f'\v \0 6|A\0!\f&\v  (Ì\"Aj6Ì (\0\"E@A!\f&\v  \0(|6\0A\0!\f%\v  (Ì\"Aj6Ì (\0\"AÒ\bkA{I@A!\f%\v \0 6@@@ AÍ\bk\0\v \0AÀ>6A\0!\f&\v \0AàÝ\x006A\0!\f%\v \0Aý\x006A\0!\f$\v  (Ì\"Aj6Ì (\0\"E@A!\f$\v  \0(6\0A\0!\f#\v  (Ì\"Aj6Ì@ (\0\"AÍ\bk\"AI\r\0 AxF\r\0A!\f#\v \0 6@@@ \0\v \0AÀ>6A\0!\f$\v \0AàÝ\x006A\0!\f#\v \0Aý\x006A\0!\f\"\v  (Ì\"Aj6Ì (\0\"E@A!\f\"\v  \0(¨o6\0A\0!\f!\v  (Ì\"Aj6Ì (\0\"AK@A!\f!\v \0 6¼A\0!\f \v  (Ì\"Aj6Ì (\0\"E@A!\f \v  \0(¼6\0A\0!\f\v  (Ì\"Aj6Ì (\0\"A\nK@A!\f\v \0 6,A\0! AF\r  6\0 Aª 	\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(,6\0A\0!\f\v  (Ì\"Aj6Ì (\0\"AK@A!\f\v \0 6ÀA\0! \0 A\0G60\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(À6\0A\0!\f\x1B\v  (Ì\"Aj6Ì (\0\"Aä\0K@A!\f\x1B\v \0 6(A\0! AF\r  6 A® Aj	\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0((6\0A\0!\f\v  (Ì\"Aj6Ì (\0\"AK@A!\f\v \0 6 \0 As6@A\0!\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(6\0A\0!\f\v  (Ì\"Aj6Ì (\0\"Aå\0kAI@A!\f\v \0 6A\0!\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(6\0A\0!\f\v  (Ì\"Aj6Ì (\0\"AK@A!\f\v \0 6A\0!\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(6\0A\0!\f\v  (Ì\"Aj6Ì@ (\0\"A¹kAI\r\0 AxF\r\0A!\f\v \0 6A\0!\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(6\0A\0!\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(Am\"6\0A\0!@ \0(pAk\0\0\v  \0(x j6\0\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(6\0A\0!\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v  \0(ào6\0A\0!\f\v  (Ì\"Aj6Ì (\0\"AkAoI@A!\f\v \0 6¬A\0!\f\r\v  (Ì\"Aj6Ì (\0\"E@A!\f\r\v  \0(¬6\0A\0!\f\f\v  (Ì\"Aj6Ì (\0\"A'kAvI@A!\f\f\v \0 6\xA0A\0!\f\v\v  (Ì\"Aj6Ì (\0\"E@A!\f\v\v  \0(\xA06\0A\0!\f\n\v  (Ì\"Aj6Ì (\0\"AK@A!\f\n\v \0 6PA\0!\f	\v  (Ì\"Aj6Ì (\0\"E@A!\f	\v  \0(P6\0A\0!\f\b\v  (Ì\"\0Aj6ÌAA\0 \0(\0\"\0AK\"\x1B! \r\x07 AF\r\x07  \x006  AÎ A j	A\0!\f\x07\v  (Ì\"\0Aj6Ì \0(\0\"\0E@A!\f\x07\v AG@  \x0060 AÏ A0j	A\0!\f\x07\vA\0! \0A\x006\0\f\v \0(! \0AÐjA\0A¨í\0ü\v\0 \0(Aøî\0k\"@ \0Aøî\0jA\0 ü\v\0\v@ \0(pAG@ A¼A\0	 \0(pAF\r\v \0 j \0(t \0(¸ Aä\0jS\v \0A6´o \0Aü6o \0A;ün \0AÑ\b6¨o \0Aé\x076o \0 \0(t6øn \0A<\nA\bt6oA\0!\f\v  (Ì\"Aj6Ì@ (\0\"Aè\x07kAI\r\0 AxF\r\0A!\f\v \0 6A\0!\f\v  (Ì\"Aj6Ì \0 (\0\"\x006´ AF@A\0!\f\v  \x006@ A¨Î\0 A@k	!\f\v  (Ì\"Aj6Ì \0 (\0\"\x006¸o AF@A\0!\f\v  \x006P AªÎ\0 AÐ\0j	!\f\v  (Ì\"Aj6Ì (\0\"E@A!\f\v@ \0(<E\r\0 \0(oA~qAè\x07G\r\0  \0 \0(j\"(ü0\"A	J6\0A\0! A\nH\r \0(\fAG\r (T\r  (¬A	J6\0\f\v \0(¼@  \0(ÔoAJ6\0A\0!\f\vA\0! A\x006\0\f\v  (Ì\"\0Aj6Ì \0(\0\"\0E@A!\f\v E\r  \x006` AÎ\0 Aà\0j	!\v AÐj$\0 \vA\xA0Á\0A¡&A\0\vß Au\"	A\0J@ \0(! \0(\0!A\0!@  AtjAÿÿA~  Atj\".\0A\nt\"\x07 k\"AÿÿqA·~lAu AuA·~lj \x07j\"\x07 j .A\nt\" k\"AÿÿqAÍ\0lAv AuAÍ\0lj\"jA\nuAjAu\"\b \bA~L\x1B\"\b \bAÿÿN\x1B;\0  j!  \x07j! Aj\" 	G\r\0\v \0 6 \0 6\0\v\vê\b@  N@@@@@@@ Ak\v\0\x07\x07\x07\x07\x07\x07\x07\v A\x07H\rA!@ \0 At\"j  j\"*\0 Ak*\0 * Ak*\0 * Ak*\0 *\f A\fk*\0 *\b Ak*\0 *\0 A\bk*\0 *8\0 Aj\" G\r\0\v\f\v A	H\rA\b!@ \0 At\"j  j\"*\0 A k*\0 * Ak*\0 * Ak*\0 * Ak*\0 * Ak*\0 *\f A\fk*\0 *\b Ak*\0 *\0 A\bk*\0 *8\0 Aj\" G\r\0\v\f\v A\vH\rA\n!@ \0 At\"j  j\"*\0 A(k*\0 *$ A$k*\0 *  A k*\0 * Ak*\0 * Ak*\0 * Ak*\0 * Ak*\0 *\f A\fk*\0 *\b Ak*\0 *\0 A\bk*\0 *8\0 Aj\" G\r\0\v\f\v A\rH\rA\f!@ \0 At\"j  j\"*\0 A0k*\0 *, A,k*\0 *( A(k*\0 *$ A$k*\0 *  A k*\0 * Ak*\0 * Ak*\0 * Ak*\0 * Ak*\0 *\f A\fk*\0 *\b Ak*\0 *\0 A\bk*\0 *8\0 Aj\" G\r\0\v\f\v AH\r\0A!@ \0 At\"j  j\"*\0 A@j*\0 *< A<k*\0 *8 A8k*\0 *4 A4k*\0 *0 A0k*\0 *, A,k*\0 *( A(k*\0 *$ A$k*\0 *  A k*\0 * Ak*\0 * Ak*\0 * Ak*\0 * Ak*\0 *\f A\fk*\0 *\b Ak*\0 *\0 A\bk*\0 *8\0 Aj\" G\r\0\v\v At\"@ \0A\0 ü\v\0\v\vAÌA°6AÚ\0\vAÿï\0A°6Aò\0\vï} Ak!@ AH@ !\f\v Aq! ! AkAO@ A|q!	@ \0 Atj\"  *\08\0   \" *8   \" *\b8\b   \" *\f8\f Aj!  ! \bAj\"\b 	G\r\0\v E\r\v@ \0 Atj\"  *\08\0 Aj!  ! \x07Aj\"\x07 G\r\0\v\v \0 Atj\"\0  \0*\08\0\v¶ Ak! AN@ Ak!A\0!@ \0 Atj\" (\0\"Á\" AÿÿqlAu  Aulj AuAjAu lj6\0  lAuAjAu j! Aj\" G\r\0\v\v \0 Atj\"\0 \0(\0\"\0Á\" AÿÿqlAu  Aulj \0AuAjAu lj6\0\vÙ\0 \0A\0A°Ï\0ü\v\0 \0 6ä'Að\n! \0A6¸$ \0 A\btA k\"6\f \0 6\b \0Bñ7\\ \0B\x007D \0B\x007< \0B\x0074 \0B\x007, \0B\x007$ \0B7 \0Bñ¶´Ü\n7t \0BÄÈ7d \0Bð7 \0Bí\xA07| \0B°·£7l \0BÈ7L \0BÈ7TA\0\v\b Au\"\nA\0J@ (! (\0!A\0!@  At\"\bjAÿÿA~  \0 Atj\"\x07.A\nt\"\v k\"AÿÿqA¤Ô\0lAv AuA¤Ô\0lj\"j\"\f \x07.\0A\nt\"\x07 k\"AÿÿqAÂ~lAu AuAÂ~lj \x07j\"\x07jA\nuAjAu\"	 	A~L\x1B\"	 	AÿÿN\x1B;\0  \bjAÿÿA~ \f \x07kA\nuAjAu\"\b \bA~L\x1B\"\b \bAÿÿN\x1B;\0  \vj!  \x07j! Aj\" \nG\r\0\v  6  6\0\v\v\0 \0    A\0 a\v®\b\v @ A\x006\0 \x07A\x006\0\vA!@ A\0H\r\0 E\r\0A|! E\r\0 \0-\0\0\"\bÀ\"A\0H@A÷ \bAvAqtAn\f\vAÀ\x07Aà \bA\bq\x1B \bAà\0qAà\0F\r\0AÀ \bAvAq\"\bAF\r\0A÷ \btAä\0n\v!\vA!	 \0Aj!\n Ak!\b@@@@@@@@ Aq\"Ak\0\v \bAq\r\x07  \bAv\";\0A!	A\0!\f\v \bE\r \n-\0\0\"AüO@ \bAF\rA!	 \0-\0At j!\v  ;\0 \b 	k\"\b H\r \b k!\b 	 \nj!\nA\0!A!	\f\v AF\r \n-\0\0\"\fA?q\"	E\r 	 \vlA-K\r Ak!\b \0Aj!A\0!@ \fAÀ\0qE@ !\n\f\v@ \bA\0L\r\x07 Aþ -\0\0\"\v \vAþO\x1B\"\nj! \b \nAsj!\b Aj\"\n! \vAÿF\r\0\v \bA\0H\r\v \fÀA\0N\r 	AI\r\0 	Ak! \b!\f@  \rAtj! \fE\rA!\v \n-\0\0\"AüO@ \fAF\rA!\v \n-\0At j!\v  ;\0 \f \vk\"\f H\r \n \vj!\n \b  \vjk!\b \r G \rAj!\r\r\0\v \bA\0H\r\v \b!\f\v \b 	n\" 	l \bG\r 	AI@A!	\f\v 	Ak\"\vA\x07q!A\0!\fA\0!\b 	AkA\x07O@ \vAxq!A\0!\v@  \bAtj\"\r ; \r ;\f \r ;\n \r ;\b \r ; \r ; \r ; \r ;\0 \bA\bj!\b \vA\bj\"\v G\r\0\v E\r\v@  \bAtj ;\0 \bAj!\b \fAj\"\f G\r\0\v\f\v Aÿÿ;\0A|\v Aÿÿ;\0A|\v Aû	J\r\0  	AtjAk ;\0 @  \n \0k6\0\vA\0!@ 	AG@ 	Aq 	A>q!A\0!\0@ @  Atj \n6\0\v Ar! \n  Atj.\0j!\b @  Atj \b6\0\v Aj! \b  Atj.\0j!\n \0Aj\"\0 G\r\0\vE\r\v @  Atj \n6\0\v \n  Atj.\0j!\n\v @  \n6\0 \x07 6\0\v @  :\0\0\v 	!\v \v}	#\0A k\"$\0  \n6  6 \0(\0! \0(!@ AF@ \0( A\bH@C\0\0?!\vA\0\f\v@ @  *\0C\0\0\0\0]\"A\f\v A!\v \0 \0( \"A\bk6 C\0\0¿C\0\0? \x1B!\v AJ\v \0(\"@  \v8\0\vC\0\0?!\v@ @  *\0C\0\0\0\0]\"A\f\v A!\v \0 \0( A\bk6 C\0\0¿C\0\0? \x1B!\v \0( \v@  \v8\0\vA!	 \bE\r \b *\x008\0\f\v@ E\r\0 \0($ \0(\fAtj\" \0(\b(\bAtj*\0!\v *\0\"CÿæÛ.] \vCÿæÛ.]rE\r\0 At! \v ]@ E\r   ü\n\0\0\f\v E\r\0   ü\n\0\0\v \0     Aj   \x07A Ajf (\b²C\0\0\x008!\v (²C\0\0\x008! (! (! (\0@ AF@ ( \0 \0( AxA\0 Aÿÿ~q\"\x1B\" kj6    AÀ\0J\"\x1B!   \x1B! j!@ E\r\0 @  *\0 * * *\0C\0\0\0\0]\"A\f\v A!\v \0 A    \x07 \bC\0\0? 	 \n!	  * At\"Ak²8\0  *\0A k²8 \0(E\r   *\08\0   *8  \v *\0\"\f8\0  \v *8  *\0\"\v \f8\0  \v *\08\0  *\"\v *8  \v *8\f\v (! (\f! \0 \0(  k\"6  (!\n   kAm\"  H\x1B\"A\0 A\0J\x1B\"  k\"N@ \0      \x07 \bC\0\0? 	 \n \0    \0(  k j\"AkA\0 \x1BA\0 AJ\x1Bj A\0 \x07A\0 \vA\0 \n ur!	\f\v \0    A\0 \x07A\0 \vA\0 \n u \0   \0(  k j\"AkA\0 AG\x1BA\0 AJ\x1B j   \x07 \bC\0\0? 	 \nr!	\v \0(E\r\0@ AF\r\0 Aq!A\0!\bC\0\0\0\0!\vA\0!\0@ AO@ Aüÿÿÿ\x07q!A\0!\n@  \0At\"A\fr\"\x07j*\0  \x07j*\0  A\br\"\x07j*\0  \x07j*\0  Ar\"\x07j*\0  \x07j*\0  j*\0  j*\0 \v!\v \0Aj!\0 \nAj\"\n G\r\0\v E\r\v@  \0At\"j*\0  j*\0 \v!\v \0Aj!\0 \bAj\"\b G\r\0\v\v Aq!A\0!\bC\0\0\0\0!\fA\0!\0@ AO@ Aüÿÿÿ\x07q!A\0!\n@  \0Atj\"*\f\"\r \r *\b\"\r \r *\"\r \r *\0\"\r \r \f!\f \0Aj!\0 \nAj\"\n G\r\0\v E\r\v@  \0Atj*\0\"\r \r \f!\f \0Aj!\0 \bAj\"\b G\r\0\v\v@  \v\"\v \v\"\v   \f\"\f\"\rCRI:]E@ \f \v\"\fCRI:]E\r\v At\"\0E\r   \0ü\n\0\0\f\v Aþÿÿÿ\x07q! AqC\0\0? \r!\vC\0\0? \f!\fA\0!\0A\0!\b@  \0At\"j\"\x07 \f  \x07*\0\"\r  j\"\x07*\0\"8\0 \x07 \v \r 8\0  Ar\"j\"\x07 \f  \x07*\0\"\r  j\"*\0\"8\0  \v \r 8\0 \0Aj!\0 \bAj\"\b G\r\0\vE\r\0  \0At\"\0j\" \f  *\0\" \0 j\"\0*\0\"\f8\0 \0 \v  \f8\0\vE\r\0 Aq!A\0!A\0!\0 AO@ Aüÿÿÿ\x07q!A\0!\b@  \0Atj\" *\08\0  *8  *\b8\b  *\f8\f \0Aj!\0 \bAj\"\b G\r\0\v E\r\v@  \0Atj\" *\08\0 \0Aj!\0 Aj\" G\r\0\v\v A j$\0 	\vå}A  AL\x1B! \0(, t! \0( !\v@ A\0J@  \n lAtj!  \0(\b \nlAtj! \v.\0!\fA\0!	@ \f!  	Atj \v 	Aj\"	Atj.\0\"\f k t\"\bA\0L}Cj)   tAtj!\r \bAq!A\0!C\0\0\0\0!\x07A\0!@ \bAO@ \bAüÿÿÿ\x07q!A\0!@ \r Atj\"\b*\f\"  \b*\b\"  \b*\"  \b*\0\"  \x07!\x07 Aj! Aj\" G\r\0\v E\r\v@ \r Atj*\0\"  \x07!\x07 Aj! Aj\" G\r\0\v\v \x07CÒt\v8\0  	G\r\0\v\v \nAj\"\n G\r\0\v\vÓ}@ A\0L\r\0 Aq!@ AO@ Aüÿÿÿ\x07q!@ \0 Atj\"*\f\"	 	 *\b\"	 	 *\"	 	 *\0\"	 	 \n!\n Aj! \x07Aj\"\x07 G\r\0\v E\r\v@ \0 Atj*\0\"	 	 \n!\n Aj! \bAj\"\b G\r\0\v\v Aq! C\0\0? \nC}&! AO@ Aüÿÿÿ\x07q!A\0!@ \0  \0*\08\0 \0  \0*8 \0  \0*\b8\b \0  \0*\f8\f \0Aj!\0 Aj\" G\r\0\v E\r\vA\0!@ \0  \0*\08\0 \0Aj!\0 Aj\" G\r\0\v\v\vö\x07}|@ At N\r\0 E\r\0 ² AtAÜËj(\0 l j²\"\b \bC\0\0\0?\"\b»D-DTû!ù?¢C\0\0? \b»D-DTû!ù?¢! A\0! At L@ Au!A!@ \" l Aj\"l j H\r\0\v\v  n! A\0L\r\0 Ak! Aq! Ak! Ak! Ak\"A~q! Aq!  k\"Aþÿÿÿ\x07q! Aq!  Asj!\x1B  AtAsj\"Ak!¶\"\b!\n  ¶\"	!\v A\0N!@  l!\r@ E@@ E\r\0 \0 \rAtj!@ A\0L\r\0A\0! ! \x1B@@  At\"j\" 	 *\0\" *\0\"\x07 \b8\0  	 \x07  \n8\0 Aj j\" 	 *\0\" *\"\x07 \b8\0  	 \x07  \n8 A\bj! Aj\" G\r\0\v E\r\v  Atj\" 	 *\0\" *\0\"\x07 \b8\0  	 \x07  \n8\0\v A\0H\r\0  Atj!   Atj\" 	 *\0\" *\0\"\x07 \b8\0  	 \x07  \n8\0 Ak!  \v! E\r\0@  At\"j\" 	 *\0\" *\0\"\x07 \b8\0  	 \x07  \n8\0  Ak\"j\" 	 *\0\" *\0\"\x07 \b8\0  	 \x07  \n8\0 A\bk! AG Ak!\r\0\v\v \0 \rAtj!@ AH\r\0 *\0!A\0! ! @@  \b  *\"\x07 \v8\0  \b *\b\"\f \b \x07  	\"\x07 	\"8\b  \b \x07 \f \v8 A\bj! Aj\" G\r\0\v E\r\v  \b  *\"\x07 \v8\0  \b \x07  	8\v A\0H\r  Atj!   \b *\" *\0\"\x07 	8  \b \x07  \v8\0 Ak!  \v! E\r@  \b *\" *\0\"\x07 	8  \b \b \x07  \v\" Ak\"*\0\"\x07 	8\0  \b \x07  \v8\0 A\bk! AF Ak!E\r\0\v\f\v \0 \rAtj!@ AH\r\0 *\0!A\0! ! @@  \b  *\"\x07 	8\0  \b *\b\"\f \b \x07  \v\"\x07 \v\"8\b  \b \x07 \f 	8 A\bj! Aj\" G\r\0\v E\r\v  \b  *\"\x07 	8\0  \b \x07  \v8\v@ A\0H\r\0  Atj!   \b *\" *\0\"\x07 \v8  \b \x07  	8\0 Ak!  \v! E\r\0@  \b *\" *\0\"\x07 \v8  \b \b \x07  	\" Ak\"\r*\0\"\x07 \v8\0 \r \b \x07  	8\0 A\bk! AG Ak!\r\0\v\v E\r\0@ A\0L\r\0A\0! ! \x1B@@  At\"\rj\" 	 *\0\" *\0\"\x07 \n8\0  	 \x07  \b8\0 Aj \rj\"\r 	 \r*\0\" *\"\x07 \n8\0  	 \x07  \b8 A\bj! Aj\" G\r\0\v E\r\v  Atj\" 	 *\0\" *\0\"\x07 \n8\0  	 \x07  \b8\0\v A\0H\r\0  Atj!   Atj\" 	 *\0\" *\0\"\x07 \n8\0  	 \x07  \b8\0 Ak!  \v! E\r\0@  At\"j\"\r 	 \r*\0\" *\0\"\x07 \n8\0  	 \x07  \b8\0  Ak\"j\"\r 	 \r*\0\" *\0\"\x07 \n8\0  	 \x07  \b8\0 A\bk! AG Ak!\r\0\v\v Aj\" G\r\0\v\v\vÏ	}A  AL\x1B!\v Aþÿÿÿ\x07q!\f Aq!\r  kA\x07q!\n  kAxK!@@ A\0L\r\0 \0(\b 	l!A\0!A\0!\x07 AG@@ At*°!   jAt\"\bj  \bj*\0»Dþ+eG÷?¢¶ 8\0 Ar\"\bAt*°!   \bjAt\"\bj  \bj*\0»Dþ+eG÷?¢¶ 8\0 Aj! \x07Aj\"\x07 \fG\r\0\v \rE\r\v At*°!   jAt\"j  j*\0»Dþ+eG÷?¢¶ 8\0\v@  N\r\0  \0(\b 	lAtj!\x07A\0! ! \n@@ \x07 AtjA|6\0 Aj! Aj\" \nG\r\0\v\v \r\0@ \x07 Atj\"B°A7\0 B°A7 B°A7 B°A7\b A\bj\" G\r\0\v\v 	Aj\"	 \vG\r\0\v\v) \0M \0A\"jM \0A\x006\xA0D \0B\x007D \0A\x006¬D\v\v\v#\0A\xA0k\"\r$\0A\b! \0 AuA	lA£jA\b\b!@@ Aq@ Aø\0F\rAêâ\0Aó A;\0\v Au\"A\0L\r\v AlA\xA0\xA0j!\x07@ \r At\"	j\"\bA\x006\0A\0!\n \0 \x07A\b\b\"AF@@ \0 \nAj\"\nA\nFAÂ¡jA\b\b\"AF\r\0\v \b \n6\0\v \rAÐ\0j 	j 6\0 Aj\" G\r\0\vA\0!\n@  \nAtA\vuj!@ \rAÐ\0j \nAtj(\0\"A\0J@A\0!\x07A\0!\bA\0!\vA\0!	 @@ A\0L\r\0  \0 -\0Ð¨A°§jA\b\b\"k!	 Á\"\x07A\0L@A\0!\x07\f\v  \0 \x07-\0Ð¨A¦jA\b\b\"k!\x07 Á\"\fA\0J\r\v A\x006\0A\0\f\v  \0 \f-\0Ð¨Að¤jA\b\b\"k!\f  Á\"A\0J  \0 -\0Ð¨AÐ£jA\b\b\"\bkA\0\v;  \b;\0A\0 \fÁ\"A\0L\r\0 \f \0 -\0Ð¨AÐ£jA\b\b\"\vk\v;  \v;A\0!  \x07Á\"\bA\0L@ A\x006\bA\0\f\v \x07 \0 \b-\0Ð¨Að¤jA\b\b\"\bk!\vA\0!\x07  \bÁ\"\fA\0J \b \0 \f-\0Ð¨AÐ£jA\b\b\"\x07kA\0\v;\n  \x07;\bA\0 \vÁ\"\x07A\0L\r\0 \v \0 \x07-\0Ð¨AÐ£jA\b\b\"k\v;  ;\fA\0!\x07A\0! @ 	Á\"\bA\0J@ 	 \0 \b-\0Ð¨A¦jA\b\b\"\bk!A\0!	 \bÁ\"\vA\0J\r\v A\x006A\0\f\v \b \0 \v-\0Ð¨Að¤jA\b\b\"\x07k!\b  \x07Á\"\vA\0J \x07 \0 \v-\0Ð¨AÐ£jA\b\b\"	kA\0\v;  	; \bÁ\"\x07A\0L@A\0!\x07A\0\f\v \b \0 \x07-\0Ð¨AÐ£jA\b\b\"\x07k\v;  \x07;A\0!\x07  Á\"	A\0L@ A\x006A\0\f\v  \0 	-\0Ð¨Að¤jA\b\b\"	k!\bA\0!  	Á\"\vA\0J 	 \0 \v-\0Ð¨AÐ£jA\b\b\"kA\0\v;  ;A\0 \bÁ\"A\0L\r\0 \b \0 -\0Ð¨AÐ£jA\b\b\"\x07k\v;  \x07;\f\v B\x007 B\x007 B\x007\b B\x007\0\v \nAj\"\n G\r\0\vA\0!@ \r At\"\bj(\0\"	A\0J@  AtA\vuj!\vA\0!\x07@ \v \x07Atj\"\f/\0!\nA\0!@ \0AðA\b\b \nAtj!\n Aj\" 	G\r\0\v \f \n;\0 \x07Aj\"\x07AG\r\0\v \rAÐ\0j \bj\" (\0 	Atr6\0\v Aj\" G\r\0\v\v \rAÐ\0j!\x07A\0!#\0Ak\"$\0 A\0:\0 A\bjAu\"A\0J@ At AtjAuA\x07lAð¨j!\n@ \x07 Atj(\0\"A\0J@  \nA Aq\" AO\x1Bj-\0\0:\0A\0!@  Atj\".\0A\0J@  \0 AjA\b\bAtAk /\0l;\0\v Aj\"AG\r\0\v\v A j! Aj\" G\r\0\v\v Aj$\0 \rA\xA0j$\0\v#\0A0k\"$\0 \0@ E@ \0 AtjAäj(\0E\r\v AõA\b\bAj\f\v AùA\b\b\v\"Aq:\0® \0 Av\":\0­ \0Aj! \0 AF@ AÀA\b\b\f\v   AtAuA\xA0jA\b\bAt:\0\0 A\xA0A\b\b -\0\0j\v:\0 \0(AN@A!@  j AÀA\b\b:\0\0 Aj\" \0(H\r\0\v\v \0  \0(\"( .\0 \0,\0­AuljA\b\b\":\0 Aj  \0( À3 \0(\".\" \0(¤F@A\0! A\0J@ \0Aj!@@@@  ( Aj Atj.\0jA\b\b\"	\0\vA\0 A¨A\b\bk!\f\v A¨A\b\bA\bj!\v  Aj\"j Ak:\0\0  \0(\".H\r\0\v\vA! \0 \0(AF AûA\b\bA\v:\0¯ \0-\0­AF@ \0@ AG\r\0 \0(ÜAG\r\0 AÐü\0A\b\b\"ÁA\0L\r\0  \0/àjA	k\f\v \0 A°ü\0A\b\b \0(Avl;ª  \0(ÌA\b\b \0/ªj\v\";ª \0 ;à \0  \0(ÐA\b\b:\0¬ \0 AéA\b\b:\0° \0(A\0J@ \0Aj!A\0!@  j  \0,\0°AtA°j(\0A\b\b:\0\0 Aj\" \0(H\r\0\v\vA\0! \0 A\0 AòA\b\b\v:\0±\v \0 \0,\0­6Ü \0 AA\b\b:\0² A0j$\0\vAúA\"AÒ\0\0\vÜ \0AÀA\b\b! \0AA\b\b! \0AA\b\b!  \0AA\b\bAtA\xA0j  Am\"A{ljAlj\".\0\" . k\"AÿÿqA3l AvAèÌljAu \0AA\b\bAtArÁlj\"\x006  AtArÁ AtA\xA0j Alj\". .\0\"k\"AÿÿqA3l AvAèÌljAul j \0k6\0\vç \0 \0(  \0($\"  kl\"k\"6  \0    kl \0( k\v\"6 AM@ \0(! \0((! \0(!\x07 \0(!\b@ \0 A\bt\"	6 \0 \x07A\bj\"\x076A\0!  \bI@ \0 Aj\"6 \0(\0 j-\0\0! !\v \0 6( \0  A\btrAvAÿq A\btAþÿÿ\x07qrAÿs\"6  AI ! 	!\r\0\v\v\v|D\0\0\0\0\0\0ð? \0 \0¢\"D\0\0\0\0\0\0à?¢\"¡\"D\0\0\0\0\0\0ð? ¡ ¡    DË\xA0ú>¢DwQÁlÁV¿\xA0¢DLUUUUU¥?\xA0¢  ¢\" ¢  DÔ8¾éú¨½¢DÄ±´½î!>\xA0¢D­RO~¾\xA0¢\xA0¢ \0 ¢¡\xA0\xA0\v\0 \0 \0 \0 \0 \0 \0D	÷ý\rá=?¢D²uàïI?\xA0¢D;hµ(¤¿\xA0¢DUDUÁÉ?\xA0¢D}oëÖÔ¿\xA0¢DUUUUUUÅ?\xA0¢ \0 \0 \0 \0D.±Å¸³?¢DY\x1Blæ¿\xA0¢DÈYå*\0@\xA0¢DK-':À\xA0¢D\0\0\0\0\0\0ð?\xA0£\v×\r A\0J@ \0(!\b \0(! \0(\f! \0(\b!	 \0(! \0(\0!\x07@  \vAtj\"\fAÿÿA~    \vAtj.\0A\nt\"\r k\"AÿÿqAÆ5lAv AuAÆ5lj\"j\" k\"AÿÿqA©ÉlAv AuA©Élj\"j\" \bk\"AÿÿqAö±lAu AuAö±lj j\"\bA	uAjAu\" A~L\x1B\" AÿÿN\x1B; \fAÿÿA~  \x07 \r \x07k\"AÿÿqAÒ\rlAv AuAÒ\rlj\"\x07j\"\f k\"AÿÿqAõ\0lAv AuAõ\0lj\"j\"\n 	k\"AÿÿqA«±~lAu AuA«±~lj \nj\"	A	uAjAu\"\n \nA~L\x1B\"\n \nAÿÿN\x1B;\0  \bj!\b  	j!	  j!  \fj! \r j! \x07 \rj!\x07 \vAj\"\v G\r\0\v \0 \b6 \0 6 \0 6\f \0 	6\b \0 6 \0 \x076\0\v\v\n \0AjA\0A\"ü\v\0 \0A6\0 \0A6ÈAÿÿ \0(¤\"Ajm!@ A\0L\r\0 Aq!\x07 \0A´ j!\b AO@ Aüÿÿÿ\x07q!	@ \b Atj\"  j\" j\"\n;  ;\0   \nj\";   j\"; Aj! Aj\" 	G\r\0\v \x07E\r\v@ \b Atj  j\";\0 Aj! Aj\" \x07G\r\0\v\v \0B7! \0BÀ\x007ô! \0BÀ7\" \0 \0(A\x07t6¬!A\0\vÅ(\v#\0Ak\"\n$\0@@@@@@@@@@ \0AôM@A¤Û(\0\"A \0A\vjAøq \0A\vI\x1B\"Av\"\0v\"Aq@@ AsAq \0j\"At\"AÌÛj\"\0 (ÔÛ\"(\b\"F@A¤Û A~ wq6\0\f\v  \x006\f \0 6\b\v A\bj!\0  Ar6  j\" (Ar6\f\v\v A¬Û(\0\"\bM\r @@A \0t\"A\0 kr  \0tqh\"At\"AÌÛj\" (ÔÛ\"\0(\b\"F@A¤Û A~ wq\"6\0\f\v  6\f  6\b\v \0 Ar6 \0 j\"\x07  k\"Ar6 \0 j 6\0 \b@ \bAxqAÌÛj!A¸Û(\0! A \bAvt\"qE@A¤Û  r6\0 \f\v (\b\v!  6\b  6\f  6\f  6\b\v \0A\bj!\0A¸Û \x076\0A¬Û 6\0\f\v\vA¨Û(\0\"\vE\r \vhAt(ÔÝ\"(Axq k! !@@ (\"\0E@ (\"\0E\r\v \0(Axq k\"   I\"\x1B! \0  \x1B! \0!\f\v\v (!	  (\f\"\0G@ (\b\" \x006\f \0 6\b\f\n\v (\" Aj (\"E\r Aj\v!@ !\x07 \"\0Aj! \0(\"\r\0 \0Aj! \0(\"\r\0\v \x07A\x006\0\f	\vA! \0A¿K\r\0 \0A\vj\"Axq!A¨Û(\0\"\x07E\r\0A!\bA\0 k! \0Aôÿÿ\x07M@ A& A\bvg\"\0kvAq \0AtkA>j!\b\v@@@ \bAt(ÔÝ\"E@A\0!\0\f\vA\0!\0 A \bAvkA\0 \bAG\x1Bt!@@ (Axq k\" O\r\0 ! \"\r\0A\0! !\0\f\v \0 (\"   AvAqj(\"F\x1B \0 \x1B!\0 At! \r\0\v\v \0 rE@A\0!A \bt\"\0A\0 \0kr \x07q\"\0E\r \0hAt(ÔÝ!\0\v \0E\r\v@ \0(Axq k\" I!   \x1B! \0  \x1B! \0(\"  \0(\v\"\0\r\0\v\v E\r\0 A¬Û(\0 kO\r\0 (!\b  (\f\"\0G@ (\b\" \x006\f \0 6\b\f\b\v (\" Aj (\"E\r Aj\v!@ ! \"\0Aj! \0(\"\r\0 \0Aj! \0(\"\r\0\v A\x006\0\f\x07\v A¬Û(\0\"M@A¸Û(\0!\0@  k\"AO@ \0 j\" Ar6 \0 j 6\0 \0 Ar6\f\v \0 Ar6 \0 j\" (Ar6A\0!A\0!\vA¬Û 6\0A¸Û 6\0 \0A\bj!\0\f	\v A°Û(\0\"I@A°Û  k\"6\0A¼ÛA¼Û(\0\"\0 j\"6\0  Ar6 \0 Ar6 \0A\bj!\0\f	\vA\0!\0 A/j\"AüÞ(\0@Aß(\0\f\vAßB7\0AßB\xA07\0AüÞ \nA\fjApqAØªÕªs6\0AßA\x006\0AàÞA\x006\0A \v\"j\"A\0 k\"\x07q\" M\r\bAÜÞ(\0\"@AÔÞ(\0\"\b j\"	 \bM\r	  	I\r	\v@AàÞ-\0\0AqE@@@@@A¼Û(\0\"@AäÞ!\0@ \0(\0\"\b M@  \b \0(jI\r\v \0(\b\"\0\r\0\v\vA\0\"AF\r !Aß(\0\"\0Ak\" q@  k  jA\0 \0kqj!\v  M\rAÜÞ(\0\"\0@AÔÞ(\0\" j\"\x07 M\r \0 \x07I\r\v \"\0 G\r\f\v  k \x07q\"\" \0(\0 \0(jF\r !\0\v \0AF\r A0j M@ \0!\f\vAß(\0\"  kjA\0 kq\"AF\r  j! \0!\f\v AG\r\vAàÞAàÞ(\0Ar6\0\v !A\0!\0 AF\r \0AF\r \0 M\r \0 k\" A(jM\r\vAÔÞAÔÞ(\0 j\"\x006\0AØÞ(\0 \0I@AØÞ \x006\0\v@A¼Û(\0\"@AäÞ!\0@  \0(\0\" \0(\"jF\r \0(\b\"\0\r\0\v\f\vA´Û(\0\"\0A\0 \0 M\x1BE@A´Û 6\0\vA\0!\0AèÞ 6\0AäÞ 6\0AÄÛA6\0AÈÛAüÞ(\x006\0AðÞA\x006\0@ \0At\" AÌÛj\"6ÔÛ  6ØÛ \0Aj\"\0A G\r\0\vA°Û A(k\"\0Ax kA\x07q\"k\"6\0A¼Û  j\"6\0  Ar6 \0 jA(6AÀÛAß(\x006\0\f\v  M\r  K\r \0(\fA\bq\r \0  j6A¼Û Ax kA\x07q\"\0j\"6\0A°ÛA°Û(\0 j\" \0k\"\x006\0  \0Ar6  jA(6AÀÛAß(\x006\0\f\vA\0!\0\f\vA\0!\0\f\vA´Û(\0 K@A´Û 6\0\v  j!AäÞ!\0@@  \0(\0\"G@ \0(\b\"\0\r\f\v\v \0-\0\fA\bqE\r\vAäÞ!\0@@ \0(\0\" M@   \0(j\"I\r\v \0(\b!\0\f\v\vA°Û A(k\"\0Ax kA\x07q\"k\"\x076\0A¼Û  j\"6\0  \x07Ar6 \0 jA(6AÀÛAß(\x006\0  A' kA\x07qjA/k\"\0 \0 AjI\x1B\"A\x1B6 AìÞ)\x007 AäÞ)\x007\bAìÞ A\bj6\0AèÞ 6\0AäÞ 6\0AðÞA\x006\0 Aj!\0@ \0A\x076 \0A\bj \0Aj!\0 I\r\0\v  F\r\0  (A~q6   k\"Ar6  6\0 AÿM@ AøqAÌÛj!\0A¤Û(\0\"A Avt\"qE@A¤Û  r6\0 \0\f\v \0(\b\v! \0 6\b  6\fA\f!A\b\f\vA!\0 Aÿÿÿ\x07M@ A& A\bvg\"\0kvAq \0AtrA>s!\0\v  \x006 B\x007 \0AtAÔÝj!@@A¨Û(\0\"A \0t\"qE@A¨Û  r6\0  6\0\f\v A \0AvkA\0 \0AG\x1Bt!\0 (\0!@ \"(Axq F\r \0Av! \0At!\0  Aqj\"(\"\r\0\v  6\v  6A\b! \"!\0A\f\f\v (\b\"\0 6\f  6\b  \x006\bA\0!\0A!A\f\v j 6\0  j \x006\0\vA°Û(\0\"\0 M\r\0A°Û \0 k\"6\0A¼ÛA¼Û(\0\"\0 j\"6\0  Ar6 \0 Ar6 \0A\bj!\0\f\vA\xA0ÛA06\0A\0!\0\f\v \0 6\0 \0 \0( j6 Ax kA\x07qj\"\b Ar6 Ax kA\x07qj\"  \bj\"k!\x07@A¼Û(\0 F@A¼Û 6\0A°ÛA°Û(\0 \x07j\"\x006\0  \0Ar6\f\vA¸Û(\0 F@A¸Û 6\0A¬ÛA¬Û(\0 \x07j\"\x006\0  \0Ar6 \0 j \x006\0\f\v (\"\0AqAF@ \0Axq!	 (\f!@ \0AÿM@ (\b\" F@A¤ÛA¤Û(\0A~ \0Avwq6\0\f\v  6\f  6\b\f\v (!@  G@ (\b\"\0 6\f  \x006\b\f\v@ (\"\0 Aj (\"\0E\r Aj\v!@ ! \0\"Aj! \0(\"\0\r\0 Aj! (\"\0\r\0\v A\x006\0\f\vA\0!\v E\r\0@ (\"\0At\"(ÔÝ F@ AÔÝj 6\0 \rA¨ÛA¨Û(\0A~ \0wq6\0\f\v@  (F@  6\f\v  6\v E\r\v  6 (\"\0@  \x006 \0 6\v (\"\0E\r\0  \x006 \0 6\v \x07 	j!\x07  	j\"(!\0\v  \0A~q6  \x07Ar6  \x07j \x076\0 \x07AÿM@ \x07AøqAÌÛj!\0A¤Û(\0\"A \x07Avt\"qE@A¤Û  r6\0 \0\f\v \0(\b\v! \0 6\b  6\f  \x006\f  6\b\f\vA! \x07Aÿÿÿ\x07M@ \x07A& \x07A\bvg\"\0kvAq \0AtrA>s!\v  6 B\x007 AtAÔÝj!\0@@A¨Û(\0\"A t\"qE@A¨Û  r6\0 \0 6\0\f\v \x07A AvkA\0 AG\x1Bt! \0(\0!@ \"\0(Axq \x07F\r Av! At! \0 Aqj\"(\"\r\0\v  6\v  \x006  6\f  6\b\f\v \0(\b\" 6\f \0 6\b A\x006  \x006\f  6\b\v \bA\bj!\0\f\v@ \bE\r\0@ (\"At\"(ÔÝ F@ AÔÝj \x006\0 \0\rA¨Û \x07A~ wq\"\x076\0\f\v@  \b(F@ \b \x006\f\v \b \x006\v \0E\r\v \0 \b6 (\"@ \0 6  \x006\v (\"E\r\0 \0 6  \x006\v@ AM@   j\"\0Ar6 \0 j\"\0 \0(Ar6\f\v  Ar6  j\" Ar6  j 6\0 AÿM@ AøqAÌÛj!\0A¤Û(\0\"A Avt\"qE@A¤Û  r6\0 \0\f\v \0(\b\v! \0 6\b  6\f  \x006\f  6\b\f\vA!\0 Aÿÿÿ\x07M@ A& A\bvg\"\0kvAq \0AtrA>s!\0\v  \x006 B\x007 \0AtAÔÝj!@@ \x07A \0t\"qE@A¨Û  \x07r6\0  6\0  6\f\v A \0AvkA\0 \0AG\x1Bt!\0 (\0!@ \"(Axq F\r \0Av! \0At!\0  Aqj\"\x07(\"\r\0\v \x07 6  6\v  6\f  6\b\f\v (\b\"\0 6\f  6\b A\x006  6\f  \x006\b\v A\bj!\0\f\v@ 	E\r\0@ (\"At\"(ÔÝ F@ AÔÝj \x006\0 \0\rA¨Û \vA~ wq6\0\f\v@  	(F@ 	 \x006\f\v 	 \x006\v \0E\r\v \0 	6 (\"@ \0 6  \x006\v (\"E\r\0 \0 6  \x006\v@ AM@   j\"\0Ar6 \0 j\"\0 \0(Ar6\f\v  Ar6  j\" Ar6  j 6\0 \b@ \bAxqAÌÛj!\0A¸Û(\0!A \bAvt\"\x07 qE@A¤Û  \x07r6\0 \0\f\v \0(\b\v! \0 6\b  6\f  \x006\f  6\b\vA¸Û 6\0A¬Û 6\0\v A\bj!\0\v \nAj$\0 \0\vÅ|~| \0½B4§Aÿq\"AÉ\x07kA?O@ AÉ\x07I@ \0D\0\0\0\0\0\0ð?\xA0\v \0½!@ A\bI\r\0D\0\0\0\0\0\0\0\0 BxQ\r AÿO@ \0D\0\0\0\0\0\0ð?\xA0\v B\0Y@#\0Ak\"D\0\0\0\0\0\0\0p9\b +\bD\0\0\0\0\0\0\0p¢\v B³È@T\r\0#\0Ak\"D\0\0\0\0\0\0\09\b +\bD\0\0\0\0\0\0\0¢\v A\0 BBX\x1B!\v \0 \0AÈ+\0\"\0\xA0\" \0¡¡\"\0 \0¢\" ¢ \0Að+\0¢Aè+\0\xA0¢  \0Aà+\0¢AØ+\0\xA0¢ \0AÐ+\0¢ ½\"\x07§AtAðq\"+ø\xA0\xA0\xA0!\0 ) \x07B-|! E@| \x07B\bP@ B\b}¿\" \0¢ \xA0\"\0 \0\xA0\f\v Bð?|¿\" \0¢\" \xA0\"\0D\0\0\0\0\0\0ð?c|#\0Ak\" B\b7\b +\bD\0\0\0\0\0\0\0¢9\bD\0\0\0\0\0\0\0\0 \0D\0\0\0\0\0\0ð?\xA0\"   \0¡\xA0 \0D\0\0\0\0\0\0ð? ¡\xA0\xA0\xA0D\0\0\0\0\0\0ð¿\xA0\"\0 \0D\0\0\0\0\0\0\0\0a\x1B \0\vD\0\0\0\0\0\0\0¢\v\v ¿\" \0¢ \xA0\v\v\nA|!@ \0(A\0H\r\0 \0(4A\0J@ \0 \"\r\vA\0! \0(0 \0(,N\r\0 \0(\"A\0L\r\0@ Ak! \0(\"\x07Aj!	 \x07-\0\0\"\bAq! \0@ \bAv\"\nAF\r\0 \nE\" \bq\r\0@@ \bA?K\r\0 \r\0  I\r  	j!A\0!  k\f\vA\0! 	!A\0!\v E@  \x07j!A\0\f\v@ A\0L\r Aj! \v -\0\0\"j!\v  Asj! Aj! AÿF\r\0\v A\0N\"E\r\0  \vA\0 \x1Bj! \f\v \0A6A|\vA\0! 	! \v\"6 \0 6@  \0(\0k \0( kF@@@@ \nAk\0\vA! @ 	-\0\0\"E\r\v \0 \0(0 j\"60 \0(( L@ \0A6A|\v \0(, L@ \0A\x006A\0!\v \0A\x006$ \0A\x006\f \0 6\b\f\v \0 :\x008 \0 \0(\b\"6 \0 \0(0Aj64 \0 \x07 k\"6 \0 6  \0 \"\r \0(!\f\v \bAI\r \0 \bAÀ\0O@ \0 6\fA\0\f\v \0($ j\v6$ E@A\v  \n6\0A! \0(0!\0   \x07jAj6\b  \x006  As \x07k j6\f\f\vAAÈAÿ\0\vA\0! A\0J\r\0\v\v \v·} \0(,! \0(!\x1B @ \0($\f\v  t!A! \0($ k\v!A  AL\x1B! \0A@k!  l\" \x1Bj! @ A\0J@   lAtj!!    lAtj!\"A\0!@ \"  lAtj ! Atj! \0(<!A\0!#\0\"\f!#  Atj (! (\0!\b@ A\0L\r\0 A\x07q!\n A\bO@ Aøÿÿÿ\x07q!\vA\0!	@  \bAtA|qj \bA|qj \bAuAtj \bAuAtj \bAuAtj \bAuAtj \bA\x07uAtj \bA\bu\"\bAtj! 	A\bj\"	 \vG\r\0\v \nE\r\vA\0!	@  \bAu\"\bAtj! 	Aj\"	 \nG\r\0\v\v(\b! \x1BAu\"\nAtj\"	 \bAu\"At\"\vjAk! \f \vAjApqk\"\r$\0 \r \bAu\"AtAjApqk\"$\0 \x1BAjAu\"A\0L@ \r!\bA\0\f\v  \nAtj\"\nAk!\vA\0 kAt!\f \r!\b@ \b 	 Atj*\0 \v*\0\"% *\0 \n*\0\"$8\0 \b $ 	*\0 % \f j*\08 \vA\bk!\v \nA\bj!\n A\bk! 	A\bj!	 \bA\bj!\b Aj\" G\r\0\v \v!\v *!(  k\"\f \vJ@@  \v jkAq\"E@ \v!\n\f\vA\0! \v!\n@ \b *\x008\0 \b 	*\x008 \nAj!\n A\bk! 	A\bj!	 \bA\bj!\b Aj\" G\r\0\v\v  k \vjA}I@@ \b *\x008\0 \b 	*\x008 \b A\bk*\x008\b \b 	*\b8\f \b Ak*\x008 \b 	*8 \b Ak*\x008 \b 	*8 A k! 	A j!	 \bA j!\b \nAj\"\n \fH\r\0\v\v \f!\v\v@@ \v H@  \x1BAtjAk!\nA\0 kAt!\f@ \b *\0 \n*\0\"% 	 \fj*\0 *\0\"$8\0 \b % 	*\0 $  Atj*\08 \nA\bk!\n A\bj! A\bk! 	A\bj!	 \bA\bj!\b \vAj\"\v G\r\0\v\f\v A\0J\r\0  /\f\v  Atj! (,!\fA\0!\b@  \f \bAtj.\0Atj\"\n ( \r*\"&  \bAt\"\vj*\0\"' \v j*\0\"% \r*\0\"$8 \n ( $ ' & %8\0 \rA\bj!\r \bAj\"\b G\r\0\v  /A\0!\b  Atj!\f  Ak lAtj!	A\0 At\"\nkAt!\r@  *\"& \f \bAt\"\vj*\0\"' *\0\"% \v j*\0\"$8\0 	 % ' $ &8\0 A\bj! 	 \rj!	  \nAtj! \bAj\"\b G\r\0\v\v #$\0 Aj\" G\r\0\v\v Aj\" G\r\0\v@ AG\r\0 AG\r\0 A\0L\r\0  Atj!\rA\0! AG@ Aq Aþÿÿÿ\x07q!A\0!@  At\"j\"\0 \0*\0C\0\0\0?  \rj*\0C\0\0\0?8\0  Ar\"j\"\0 \0*\0C\0\0\0?  \rj*\0C\0\0\0?8\0 Aj! Aj\" G\r\0\vE\r\v  At\"j\"\0 \0*\0C\0\0\0?  \rj*\0C\0\0\0?8\0\v \x07AG@A  AL\x1B!\r  \x07m\"Aüÿÿÿ\x07q!\v Aq!  kAt!\b  Atj! \x07²!$ AI!A\0!@  l!\n@ A\0L\r\0  \nAtj!\x07A\0!A\0!\0A\0! E@@ \x07 Atj\"\f \f*\0 $8\0 \f \f* $8 \f \f*\b $8\b \f \f*\f $8\f Aj! \0Aj\"\0 \vG\r\0\v E\r\v@ \x07 Atj\"\0 \0*\0 $8\0 Aj! Aj\" G\r\0\v\v \b@  \nAtjA\0 \bü\v\0\v Aj\" \rG\r\0\v\v\vò Ak!@ AH\r\0 Ak! AG@ Aq A~q!\b@ \0 Atj\"  .\0lAvAjAv;\0   lAuAjAu j\" .lAvAjAv;  lAuAjAu j! Aj! Aj\" \bG\r\0\vE\r\v \0 Atj\"  .\0lAvAjAv;\0  lAuAjAu j!\v \0 Atj\"\0  \0.\0lAvAjAv;\0\v®AÐ\0A¸ AF\x1B\"@ \0A\0 ü\v\0\v@ A\0L\r\0 \0AØ\0j!A\0!@  A°Ï\0lj <E@  Aj\"G\r\f\v\vAÿï\0AÉ:Aß\0\0\v \0B7@ B7\0  \0(¤$6\b  \0(¬$6\f  \0(°$6  \0(´$6  \0(Ü$6  \0(Ø$6  \0(à$6   \0(è$6$  \0(16(  \0(ô064  \0(%68  \0(¸$\"ÁAè\x07l6L  \0($6PA\0!  AF \0(tA\vE6TA\0\vè@ A\0N@ AK\r@ A\0L\r\0 AG@ Aq Aþÿÿÿ\x07q!	@ \0 At\"j  j/\0\"   j/\0 kÁlAvj;\0 \0 Ar\"j  j/\0\"   j/\0 kÁlAvj;\0 Aj! \x07Aj\"\x07 	G\r\0\vE\r\v \0 At\"j  j/\0\"\0   j/\0 \0kÁlAvj;\0\v\vAøê\0A*A-\0\vAÓ\0A*A.\0\v÷\b\r~#\0Aà\0k!\x07@ \x07 A\0J@ Aq!\f@ AO@ Aüÿÿÿ\x07q!\b@ \x07 Atj \0 Atj.\0\"A\ft6\0 \x07 Ar\"Atj \0 Atj.\0\"A\ft6\0 \x07 Ar\"	Atj \0 	Atj.\0\"	A\ft6\0 \x07 Ar\"\vAtj \0 \vAtj.\0\"\vA\ft6\0 \v 	   jjjj! Aj! \nAj\"\n \bG\r\0\v \fE\r\v@ \x07 Atj \0 Atj.\0\"\nA\ft6\0 Aj!  \nj! Aj\" \fG\r\0\v\v AÿJ\r AF@B!A\0\f\vA!\n !@@ \x07 \"\fAk\"Atj\"\v(\0\"Aßÿ\x07kAÃÁpI\rA\0AA\0 A\x07tk¬\" ~B §k\"­ \n­~B\"§A|q\"\nAîÆH\rA\0Aÿÿÿÿ  g\"Akt\"\bAu\"m\"Á\"\0 \bAÿÿqlAu \0 ljAtk\"\b AuAjAul Atj \bAu \0lj \bAøÿq \0lAuj!\0   Au\"s kg\"\bk\"A\0N@Aÿÿÿÿ\x07 v\" \0Ax u\" \0 J\x1B \0 J\x1B t\f\v \0A\0 ku\v!@ Av\"\r@A \bk­! ¬!A\0!\0@ \x07 \0Atj\"(\0\" \v \0AsAtj\"(\0\"¬ ~BB|B§\"k\"	AuAxs 	   	A\0N\"	\x1B   	\x1BAsqA\0H\x1B\"¬ ~!~@ \bAF@ ­ ~B B|\"B\b}BpZ\r\f\v\v  B|B\"B\b}BpT\r\n  >\0  ¬ ~BB|B§\"k\"AuAxs    A\0N\"\x1B   \x1BAsqA\0H\x1B¬ ~ B|B\f\v  >\0  ¬ ~BB|B§\"k\"AuAxs    A\0N\"\x1B   \x1BAsqA\0H\x1B\"­ ~B ¬ ~B|\v\"B\b}BpT\r  >\0 \0Aj\"\0 \rG\r\0\v\v Ak! \fAH\r\f\v\v\f\v Büÿÿÿ!A\0\f\vB! Ak\vAtj(\0Aßÿ\x07kAÃÁpI\r BA\0 \x07(\0A\x07tk¬\" ~B }Bÿÿÿÿ~B§A|q\"\0A\0 \0AîÆN\x1B\v\vA\0\vç|	#\0Ak\"\x07$\0 AM@ Aj\"\nAq!\v@ AO@ \nA<q!\rA\0!\n@ \x07 Atj\"	  Atj*\0»\"9\0 	 9\b \x07 Ar\"	Atj\"\f  	Atj*\0»\"9\0 \f 9\b \x07 Ar\"	Atj\"\f  	Atj*\0»\"9\0 \f 9\b \x07 Ar\"	Atj\"\f  	Atj*\0»\"9\0 \f 9\b Aj! \nAj\"\n \rG\r\0\v \vE\r\v@ \x07 Atj\"\n  Atj*\0»\"9\0 \n 9\b Aj! \bAj\"\b \vG\r\0\v\v @A\0!\v !@ \0 \v\"Atj \x07 Aj\"\vAtj+\0 \x07+\b\"D\0\0\0à\v.> D\0\0\0à\v.>d\x1B£\"¶8\0@  N\r\0A\0!\b  \vG@ Aq A~q!A\0!\n@ \x07 \bAtj\"\r Atj\"	 \r+\b\" ¢ 	+\"\xA09 \r   ¢\xA09\b 	 \r+\" ¢ 	+ \"\xA09  \r   ¢\xA09 \bAj!\b \nAj\"\n G\r\0\vE\r\v \x07 \bAtj\"\b Atj\" \b+\b\" ¢ +\"\xA09 \b   ¢\xA09\b\v Ak!  \vG\r\0\v\v \x07+\b \x07Aj$\0¶\vAÍÌ\0Aá5A,\0\vE    J\x1B\"A\0J@A\0!@ \0 At\"j   j  k\"¶8\0 Aj\" G\r\0\v\v\v³\n\f#\0Ak\"\n$\0 \nAj \nA\fj    \n \nA\bj    \n \n(\0 \n(\f\"\x07 \n(\b\"\b \x07 \bJ\x1B\"Aq j\" \bku6\0 \nA \n(  \x07ku\"\x07 \x07AL\x1B6A\0!\x07A\0!\bA\0 A\0L\r\0@ AG@ Aq Aþÿÿÿ\x07q!\fA\0!@  \bAt\"	Ar\"\rj.\0  \rj.\0l u  	j.\0  	j.\0l u \x07jj!\x07 \bAj!\b Aj\" \fG\r\0\vE\r\v  \bAt\"j.\0  j.\0l u \x07j!\x07\v \x07\v\"\x07 \x07 \x07Au\"s kg\"\bAkt\"Aÿÿÿÿ \n(\"  Au\"s kg\"	Akt\"\vAumÁ\" AÿÿqlAu Au lj\"¬ \v¬~B§Axqk\"\vAu l j \vAÿÿq lAuj! AA \b 	k\"AoL@Aÿÿÿÿ\x07Ap k\"v\"\b Ax u\"	  	J\x1B  \bJ\x1B t\f\v  AjuA\0 AH\x1B\v\" AL\x1B\" AN\x1B\"Aÿÿq lAu Au lj\"\v \vAu\"s k\"  H\x1B! Au!\bA\0! (\0!	  A\0L@ Á\"A\0 	kAul\f\vA g\"k!\f Ak!\rAAé Aq\x1B Avv\"AÕl\" \" AF\"\r\0  \rt Aÿ\0M\r\0  A\bjt  \fvj\vAÿ\0qlAv j \bt 	kAu! Á!@ \r\0 Aÿ\0M@  \rt!\f\v  A\bjt  \fvj!\v  Aÿ\0qlAv j!  l\v 	j  \bt 	kAÿÿq lAuj\"6\0  (\" \n(\0  \x07Aul  \x07AÿÿqlAujAtk \v Aul \v AÿÿqlAujAtj\"A\0L@A\0!A\0\f\vA g\"k!\x07 Ak!	AAé Aq\x1B Avv\"\vAÕl\"\f  AF\"\r\r\0  	t Aÿ\0M\r\0  A\bjt  \x07vj\vAÿ\0qlAv \vj@ \r\r\0 Aÿ\0M@  	t!\f\v  A\bjt  \x07vj!\v \f Aÿ\0qlAv \vj! \bt\v kAu lj  \bt kAÿÿq lAuj\"6   Au\"s kg\"Akt\"AÿÿÿÿA  AL\x1B\" g\"Akt\"AumÁ\" AÿÿqlAu Au lj\"¬ ¬~B§Axqk\"Au l j Aÿÿq lAuj! \0Aÿÿ  k\"\0ApL@Aÿÿÿÿ\x07Aq \0k\"\0v\" Ax \0u\"  J\x1B  J\x1B \0t\f\v  \0AjuA\0 \0AH\x1B\v\"\0A\0 \0A\0J\x1B\"\0 \0AÿÿN\x1B6\0 \nAj$\0 \v²@@ ,\0 ,\0Alj\"AH@ \0 AÀA\b\x07 ,\0\0\"AN\r ,\0AN\r \0 AA\b\x07 \0 ,\0AA\b\x07 ,\0\"AJ\r ,\0AJ\r \0 AA\b\x07 \0 ,\0AA\b\x07\vAÒ\0A-A,\0\vAÏÓ\0A-A/\0\vAà?A-A0\0\v­	#\0Ak\"!\n $\0  \0(à#\"F@A\0 \0(Ð# \0(Ì#F\r\v E@ \0A-j \0(Ì# Aè\x07lA4\f\v \0Aì8j!\x07  \0(ä#A\nlAj\"	 l\"  	l\"\b  \bJ\x1BAtAjApqk\"$\0@ A\0L\r\0 \"Aq@  Ak\"AtjAÿÿA~ \x07 Atj*\0ü\0\" A~L\x1B\" AÿÿN\x1B;\0\v AF\r\0@  Ak\"AtjAÿÿA~ \x07 Atj*\0ü\0\" A~L\x1B\" AÿÿN\x1B;\0  Ak\"AtjAÿÿA~ \x07 Atj*\0ü\0\" A~L\x1B\" AÿÿN\x1B;\0 AJ !\r\0\v\vA\0! \n \0.à#Aè\x07l \0(Ì#A\04!  \0(Ì#Aè\x07m 	l\"	AtAjApqk\"$\0 \n    j \0A-j\" \0(Ì# ÁAè\x07lA4j!    	@ \bA\0L\r\0 \b\"Aq\"@@ \x07 Ak\"Atj  Atj.\0²8\0 Aj\" G\r\0\v\v \bAI\r\0@ \x07 Ak\"Atj  Atj.\0²8\0 \x07 Ak\"Atj  Atj.\0²8\0 \x07 Ak\"Atj  Atj.\0²8\0 \x07 Ak\"Atj  Atj.\0²8\0 AJ !\r\0\v\v j\v \0 \0(Ì#6Ð# \nAj$\0\vEA! A\0L@A\v@@@ \0-\0\0Aq\0\0\0\vA\v AF@A|\v \0-\0A?q!\v \vþ}#\0!\x07 A\0L@ \x07$\0A\v@@@ E\r\0 A\0L\r\0 \r\0 \0(\f!	A!@@@ -\0\0Aq\0\0\0\vA!\f\v AF@ \x07$\0A|\v -\0A?q!\vA|!\b  	$ l\"A\0L\r Al 	AlJ\r    I\x1B!\v \0(\b\"AkAO\r \x07  lAtAjApqk\"$\0 \0     A-\"\bA\0J@A\0!@ \0(\b \bl\"\0A\0L\r\0 \0AG@ \0Aq \0Aþÿÿÿ\x07q!\0A\0!@  Atj  Atj*\0C\0\0\0G\"\nC\0\0\0Ç \nC\0\0\0Ç^\x1B\"\nC\0þÿF \nC\0þÿF]\x1Bü\0;\0  Ar\"Atj  Atj*\0C\0\0\0G\"\nC\0\0\0Ç \nC\0\0\0Ç^\x1B\"\nC\0þÿF \nC\0þÿF]\x1Bü\0;\0 Aj! Aj\" \0G\r\0\vE\r\v  Atj  Atj*\0C\0\0\0G\"\nC\0\0\0Ç \nC\0\0\0Ç^\x1B\"\nC\0þÿF \nC\0þÿF]\x1Bü\0;\0\v\v\v \x07$\0 \b\vAÞÕ\0A¸'A\x07\0\vî#\0Ak\"\x07$\0@@@@ \0Aÿü\0L@ \0AÀ>F\r \0AàÝ\0F\r\f\v \0Aý\0F\r\0 \0A÷F\r\0 \0AÀ»G\r\v AkA}K\r\v E\r A6\0\f\v \x07A°Ä\x006\f \x07 \x07(\fAjA|q6\f \x07(\fA¬«(\0AtAàÀ\0j lA°«(\0AtjjAÐjN\"E@A\0! E\r Ay6\0\f\v#\0Ak\"$\0A!\b@@ \0Aÿü\0L@ \0AÀ>F\r \0AàÝ\0F\r\f\v \0Aý\0F\r\0 \0A÷F\r\0 \0AÀ»G\r\v AkA~I\r\0 A°Ä\x006\f  (\fAjA|q6\f (\fA¬«(\0AtAàÀ\0j lA°«(\0AtjjAÐj\"@ A\0 ü\v\0\vA}!\b A°Ä\x006\b  (\bAjA|q\"6\b  6<  6\b Aä\x006 A\x0060  \x006  \x006\f  6  Aä\0j\"6\0 Aä\0jE\r\0  j!A AK\r\0Ay E\r\0A¬«(\0AtAàÀ\0j lA°«(\0AtjAì\0j\"@ A\0 ü\v\0\v A¨«6\0A¬«(\0! B7  6\f  6\b  6A´«(\0! A\x006(  AF6  A6  6 A¼A\0\v  \0}\"6A\0A \x1B\v\r\0A\0!\b A\x006\0 A\xA0Î\0 \v  \0AÿÿqAn6L A\x006H A\x0068\v Aj$\0 \b!\0 @  \x006\0\v \0E\r\0 'A\0!\v \x07Aj$\0 \v\n#\0\"\f \0(\b! \0(! \f \0(,\" 	t\"\rAtAjApqk\"\f$\0 \0($A\0 	 \b\x1Bk!A 	t\"A \b\x1B!	  \r \b\x1B!@@ AG\r\0 \x07AG\r\0 \0  \f     \n \v1 ( AmAtj! \rAt\"@  \f ü\n\0\0\v 	A\0L\r \0A@k!A\0!\b@   \bAtj (\0 \b lAtj \0(<   	. \bAj\"\b 	G\r\0\v \0A@k!A\0!\b@  \f \bAtj ( \b lAtj \0(<   	. \bAj\"\b 	G\r\0\v\f\v AF \x07AFqE@A \x07 \x07AL\x1B!\x07 \0A@k!A\0!@ \0   \rlAtj \f   lAtj    \n \v1 	A\0J@  Atj!A\0!\b@  \f \bAtj (\0 \b lAtj \0(<   	. \bAj\"\b 	G\r\0\v\v Aj\" \x07G\r\0\v\f\v (\0! \0  \f     \n \v1 \0  \rAtj  AmAtj\"  Atj    \n \v1@ \rA\0L\r\0A\0!\b \rAG@ \rAq \rAþÿÿÿ\x07q!A\0!@ \f \bAt\"j\"\x07 \x07*\0C\0\0\0?  j*\0C\0\0\0?8\0 \f Ar\"j\"\x07 \x07*\0C\0\0\0?  j*\0C\0\0\0?8\0 \bAj!\b Aj\" G\r\0\vE\r\v \f \bAt\"j\" *\0C\0\0\0?  j*\0C\0\0\0?8\0\v 	A\0L\r\0 \0A@k!A\0!\b@  \f \bAtj (\0 \b lAtj \0(<   	. \bAj\"\b 	G\r\0\v\v$\0\v¯}#\0Ak\"!	 $\0 \0Aì\0j! \0(\"\x07Aj!A \0(\b\" AL\x1B\"Aq!\n  \x07AtAjApqk\"\f$\0A\0!@ AN@ Aüÿÿÿ\x07q!\rA\0!@ 	A\bj\"\b Atj   lAtj6\0 Ar\"At \bj   lAtj6\0 Ar\"At \bj   lAtj6\0 Ar\"At \bj   lAtj6\0 Aj! Aj\" \rG\r\0\v \nE\r\v@ 	A\bj Atj   lAtj6\0 Aj! \vAj\"\v \nG\r\0\v\v \0(\0! \x07Am! \f \x07At\"\nj!\vA\0 kAt!\rA\0!@ 	A\bj Atj(\0\" \rjA@k! \0(L! \0(H! \0*T! \0*P! \0(\\! \0(X! \0((! \f    \x07    A\0A\0 \x07AN@ (<\"\b \nj!A\0!@   kAtjA@k \b At\"j*\0 \v AsAt\"j*\0  j*\0 \f j*\08\0 Aj\" G\r\0\v\v Aj\" G\r\0\v 	Aj$\0\v\n}#\0@ AG\r\0 AG\r\0 \x07\r\0 *!\b *\0!	 A\0J@ \0(! \0(\0! *\0!\nA\0!\0@  \0At\"j*\0!\v  \0Atj\"\x07 \b  j*\0C`B¢\r\"\bC\0\0\x0088 \x07 	 \vC`B¢\r\"	C\0\0\x0088\0 \n \b!\b \n 	!	 \0Aj\"\0 G\r\0\v\v  \b8  	8\0\vA  AL\x1B!\x1B Aþÿÿÿ\x07q! Aq! Ak!  m\"Aþÿÿÿ\x07q! Aq! Ak! AtAjApqk! *\0!	@  At\"j! \0 j(\0!\f  j\"*\0!\b@@ AN@@ A\0L\r\0A\0!A\0!\r @@  At\"j \b \f j*\0C`B¢\r\"\b8\0  Ar\"j 	 \b \f j*\0C`B¢\r\"\b8\0 	 \b!\b Aj! \rAj\"\r G\r\0\v E\r\v  At\"j \b  \fj*\0C`B¢\r\"\b8\0 	 \b!\b\v  \b8\0\f\v@ \x07E@ A\0L\rA\0!A\0!\r @@   lAtj \b \f Atj*\0C`B¢\r\"\bC\0\0\x0088\0  Ar\" lAtj 	 \b \f Atj*\0C`B¢\r\"\bC\0\0\x0088\0 	 \b!\b Aj! \rAj\"\r G\r\0\v E\r\v   lAtj \b \f Atj*\0C`B¢\r\"\bC\0\0\x0088\0 	 \b!\b\f\v A\0L\r\0A\0!A\0!\r @@   lAtj\" \b \f Atj*\0C`B¢\r\"\bC\0\0\x008 *\08\0  Ar\" lAtj\" 	 \b \f Atj*\0C`B¢\r\"\bC\0\0\x008 *\08\0 	 \b!\b Aj! \rAj\"\r G\r\0\v E\r\v   lAtj\"\r \b \f Atj*\0C`B¢\r\"\bC\0\0\x008 \r*\08\0 	 \b!\b\v  \b8\0 \r\0A\0!\f\v \x07E@A! A\0L\rA\0!\fA\0! @@   \flAtj   \flAtj*\0C\0\0\x0088\0  \fAr\"\r lAtj   \rlAtj*\0C\0\0\x0088\0 \fAj!\f Aj\" G\r\0\v E\r\v   \flAtj   \flAtj*\0C\0\0\x0088\0\f\vA! A\0L\r\0A\0!\fA\0! @@   \flAtj\"\r   \flAtj*\0C\0\0\x008 \r*\08\0  \fAr\"\r lAtj\"   \rlAtj*\0C\0\0\x008 *\08\0 \fAj!\f Aj\" G\r\0\v E\r\v   \flAtj\"   \flAtj*\0C\0\0\x008 *\08\0\v Aj\" \x1BG\r\0\v\vÊa}3|#\0AÐ\0k\".$\0 \0(\b!7 .A\x006\f .A\x006\b \0(\f!*@@@@@@@@@@@@@@@@@@@ \0\"(\0A¨«F@ \0(Aø\0G\r \0(\"\0AN\r (\bAkAO\r (\fAkAO\r (A\0L\r@@ (\"\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\vAÆÎ\0Aì&A\xA0\0\v \0 L\r ((\"\0A\0H\r\x07 \0\r\b (4\"\0AÑN\r	 \0Aã\0LA\0 \0\x1B\r\n (H\"\0A\bN\r\v \0ALA\0 \0\x1B\r\f (L\"\0A\bN\r\r \0ALA\0 \0\x1B\r (X\"\0AN\r \0A\0H\r (\\\"\0AN\r \0A\0H\r\f\vAäð\0Aì&A\0\vAæá\0Aì&A\0\vA¯Û\0Aì&A\0\vAÞÕ\0Aì&A\0\vAÕ\0Aì&A\0\vA³ç\0Aì&A\0\vA²Aì&A¡\0\vAèé\0Aì&A£\0\vAÃÁ\0Aì&A¤\0\vAþ>Aì&A§\0\vAë\0Aì&A¨\0\vAÑÊ\0Aì&Aª\0\vAØì\0Aì&A«\0\vAË\0Aì&A¬\0\vA¶í\0Aì&A­\0\vA­Ø\0Aì&A®\0\vAûè\0Aì&A¯\0\vAÚÙ\0Aì&A°\0\vAê\0Aì&A±\0\vA!@ (\0\",($\"A\0H\r\0 Aì\0j\" ,(\";Aj\" 7lAtj\" ,(\b\"&At\"\0j\"$ \0j\"' \0j!< ( l!) &At!0 (!! (!\0 ,( !3 ,(,!@ )  tG@  F Aj!E\r\f\v\v Aû	K\r\0 E\r\0A\0!A\0 )k!\x1BA 7 7AL\x1B!2@ 7AN@ 2Aq 2Aþÿÿÿ\x07q!A\0!@ At\"\" .Aj\"(j   lAtj\"+6\0 \" .Aj\"#j + \x1BAt\"\"jA@k6\0 ( Ar\"+At\"5j   +lAtj\"(6\0 # 5j \" (jA@k6\0 Aj! Aj\" G\r\0\vE\r\v At\" .Ajj   lAtj\"6\0 .Aj j  \x1BAtjA@k6\0\v A\0 AK\x1BE@A\0!A\0!A\0!\"#\0A\xA0 k\"$\0 Aì\0j!\0A\0 )k!5A (\b\" AL\x1B!& (\0\"\x1B(\"Aj! \x1B( !* \x1B(\b!(@ AN@ &Aq &Aþÿÿÿ\x07q!!@ At\" A\bj\" j \0  lAtj\"6\0  j  5At\"jA@k6\0   Ar\"At\"$j \0  lAtj\" 6\0  $j   jA@k6\0 Aj! Aj\" !G\r\0\vE\r\v At\" A\bjj \0  lAtj\"6\0  j  5AtjA@k6\0\v \0  lAtj\"! (At\"\0j \0j \0j! (! (8!;@@ (<A'J\r\0 \r\0 (DE\r\v \x1B(\f!2 (! &Aq!+  )kAtA@k!\0   )lAtAjApqk\"$$\0A\0!@ AN@ &Aüÿÿÿ\x07q!#A\0!@ )At!  A\bj Atj! \0E\"'E@ (\0\"0   0j \0ü\n\0\0\v 'E@ (\"0   0j \0ü\n\0\0\v 'E@ (\b\"0   0j \0ü\n\0\0\v 'E@ (\f\"   j \0ü\n\0\0\v Aj! Aj\" #G\r\0\v +E\r\v@ \0@ A\bj Atj(\0\"  )Atj \0ü\n\0\0\v Aj! \"Aj\"\" +G\r\0\v\v   2  2H\x1B\"J!\0 (`@  )_\v   \0\x1B!'C\0\0\0?C\0\0À? ;\x1B!\x07  kAq!\"A\0!  Aj\"\0F!2@@  N\r\0  (l!  ! \"@ !   jAt\"j\"+  j*\0\"\b +*\0 \x07\"	 \b 	^\x1B8\0 \0!\v 2\r\0  Aj!+@ !   jAt\"#j\"0  #j*\0\"\b 0*\0 \x07\"	 \b 	^\x1B8\0 !  +jAt\"#j\"0  #j*\0\"\b 0*\0 \x07\"	 \b 	^\x1B8\0 Aj\" G\r\0\v\v Aj\" &G\r\0\v (,! A\0J@A\0!@  H@  )l!\" !\0@ * \0Atj.\0\" t \"j! * \0Aj\"\0Atj.\0 k t\" A\0J@ $ Atj!(A\0!@ ( Atj AÌå\0lAßæ»ãj\"Au²8\0 Aj\"  G\r\0\v\v (( $ Atj  C\0\0?B \0 'G\r\0\v\v Aj\" G\r\0\v\v  6,A\0! (( \x1B $  !  '  A\0  (A\0^@ A (H\"\0 \0AL\x1B\"6H A (L\"\0 \0AL\x1B\"6L ((  Atj(\0\"\0 \0   \x1B(, *T *P (\\ (X \x1B(<  @ (( \0 \x1B(,\"Atj\"\0 \0 (H\"\0 \0 ) k *P\"\x07 \x07 (X\"\0 \0 \x1B(< \v Aj\" &G\r\0\v A\x006`  (H6L  *P8T  (X6\\AÄ\0!A\f\v} (@AG@ (( A\bj Aj\"A\b c A°\vj A°\nAì A jb AÐ ( k\"'64C\0\0?\f\v (4!'CÍÌL?\v! \0 j!< Aà k\"(\"\0$\0A\b 'At\" A\bN\x1B\"Aq!4 A k\"$A\b 'k\"Atj!A Au\"#Aþÿÿÿ\x07q!= ( At\"1kAà j!! Aþÿÿÿ\x07q!8 Aq!9  )j\"Aüÿÿÿ\x07q!> Aq!3 At!?A )kAt!* \0 1AjApqk\"$\0 \x1B(<!0  )kAt!@ AkAI!6A\0!2@ A\bj 2Atj(\0!A\0!@ ( At\"\0j \0 j*\xA08\0 ( \0Ar\"j  j*\xA08\0 ( \0A\br\"j  j*\xA08\0 ( \0A\fr\"\0j \0 j*\xA08\0 Aj\"A\bG\r\0\v@ (@AF@ 2Aà\0l!\f\v (( $ Aj 0 AA\bd  *CG?8A!@ Aj\"\0 Atj\" *\0\"\x07 \x07C¾78 ³\"\x07 \x078\0 Aj\"At \0j\" *\0\"\x07 \x07C¾78 ³\"\x07 \x078\0 Aj\"AG\r\0\v < 2Aà\0l\"j \0Ae\v ((  <j\" !\0A\0!A\0!A\0!\x1B#\0\"@  !G@ Aà\0k\"$\0 \0Aà\0j!\0@  Atj\"\" \0 AsAtj*\x008\0 \" \0 AþÿÿÿsAtj*\x008 \" \0 AýÿÿÿsAtj*\x008\b \" \0 AüÿÿÿsAtj*\x008\f Aj! \x1BAj\"\x1BAG\r\0\v AH\r Ak!\"@ ! At\"%j\"\x1BAà\0k\"\0A\fj! \0*\b!\x07 \0*!\b \0*\0!\r \x1B*\0!\n ! ArAt\"/j*\0!\f ! ArAt\"-j*\0! ! ArAt\":j*\0! !\0A\0!\x1B@ \0*\f\" *\f\" \0*\b\" *\b\"\v \0*\" *\"	 \0*\0\" *\0\" !  \v  	    \x07 !  	    \x07  \b \f!\f    \x07  \b  \r \n!\n Aj! \0Aj!\0 	!\r !\x07 \v!\b \x1BAj\"\x1BAH\r\0\v  %j \n8\0  /j \f8\0  -j 8\0  :j 8\0 Aj\" \"H\r\0\v\f\vAÀ\vAà-A\0\v  H@@ ! At\"%j*\0!\x07 ! AkAtj!A\0!\x1BA\0!\0@  \0At\"\"A\fr\"/j*\0  /j*\0  \"A\br\"/j*\0  /j*\0  \"Ar\"/j*\0  /j*\0  \"j*\0  \"j*\0 \x07!\x07 \0Aj!\0 \x1BAj\"\x1BAG\r\0\v  %j \x078\0 Aj\" G\r\0\v\v$\0 1@ !  1ü\n\0\0\v@ #A\0L@C\0\0?!\nC\0\0?!\x07\f\vC\0\0?!\x07A\0!A\0!C\0\0?!\n 'AG@@ $ Ar\"\0 kAtjA j*\0\"\b \b $  kAtjA j*\0\"\b \b \x07!\x07 $ \0 #kAtjA j*\0\"\b \b $  #kAtjA j*\0\"\b \b \n!\n Aj! Aj\" =G\r\0\v 4E\r\v $  kAtjA j*\0\"\b \b \x07!\x07 $  #kAtjA j*\0\"\b \b \n!\n\v *@   )Atj *ü\n\0\0\v@ A\0L\":@C\0\0\0\0!\n\f\v  \n \x07 \x07 \n^\x1B \x07\"\b!\x07  *j!\0  @jA j!C\0\0\0\0!\nA\0!A\0!@ \0 Atj \x07 \b \x07  'H\"\x1B\x1B\"\x07 A A\0 ' \x1B\x1Bk\"At\"\x1Bj*\08\0 Aj!  \x1Bj*\0\"	 	 \n!\n Aj\" G\r\0\v\vA\0!@ Aj\"\0 Atj Aÿ  )jkAtj*\x008\0 Ar\"At \0j Aÿ  )jkAtj*\x008\0 Ar\"At \0j Aÿ  )jkAtj*\x008\0 Ar\"At \0j Aÿ  )jkAtj*\x008\0 Aj\"AG\r\0\v ((  5AtjA@k! \0!\x1B#\0\"\0 \0Aà\0k\"$\0  Aj\"%AtAjApqk\"+$\0  \"Aà\0j! A\0!\0@  \0Atj\"\"   \0AsAtj*\x008\0 \"   \0AþÿÿÿsAtj*\x008 \"   \0AýÿÿÿsAtj*\x008\b \"   \0AüÿÿÿsAtj*\x008\f \0Aj\"\0AG\r\0\v \x1BAà\0j! A\0!\0@ + \0Atj\"\"   \0AsAtj*\08\0 \"   \0AþÿÿÿsAtj*\08 \"   \0AýÿÿÿsAtj*\08\b \"   \0AüÿÿÿsAtj*\08\f \0Aj\"\0AG\r\0\v@ %AL\r\0 %AkAt\"\0E\r\0 +Aà\0jA\0 \0ü\v\0\v +Aà\0j!/A\0!  AN@ Ak!C@ +  At\"%j\"\0A\fj!\" \0*\b!\x07 \0*!\b \0*\0!\r  %j*\0!\f   ArAt\"Dj*\0!   ArAt\"Ej*\0!   ArAt\"Fj*\0!A\0!- !\0@ \0*\f\" \"*\f\" \0*\b\" \"*\b\"\v \0*\" \"*\"	 \0*\0\" \"*\0\" !  \v  	    \x07 !  	    \x07  \b !    \x07  \b  \r \f!\f \"Aj!\" \0Aj!\0 	!\r !\x07 \v!\b -Aj\"-AH\r\0\v % /j\"\0 \f8\0  %j \f8\0 \0  \f *\0\"\x078  Dj \x078\0 \0  \x07 *\0 \f *\"\b8\b  Ej \b8\0 \0  \b *\0 \x07 * \f *\b\"\x078\f  Fj \x078\0  Aj\"  CH\r\0\v\v   J@@   At\"j*\0!\x07  +j!\"A\0!\0A\0!%@ \x07  \0At\"-j*\0 \" -j*\0  -Ar\"-j*\0 \" -j*\0!\x07 \0Aj!\0 %Aj\"%AG\r\0\v  /j \x078\0  j \x078\0  Aj\"  G\r\0\v\v  Atj!A\0!\0A\0!@ \x1B \0Atj\"  \0AsAtj*\x008\0   \0AþÿÿÿsAtj*\x008   \0AýÿÿÿsAtj*\x008\b   \0AüÿÿÿsAtj*\x008\f \0Aj!\0 Aj\"AG\r\0\v$\0@@ :E@  *j!C\0\0\0\0!\x07A\0!A\0!\0A\0!\x1BA\0!@ 6E@@  \0Atj\"*\f\"\b \b *\b\"\b \b *\"\b \b *\0\"\b \b \x07!\x07 \0Aj!\0 \x1BAj\"\x1B >G\r\0\v \0! 3E\r\v@  Atj*\0\"\b \b \x07!\x07 Aj! Aj\" 3G\r\0\v\v \n \x07CÍÌL>^\r ?E\r A\0 ?ü\v\0\f\vC\0\0\0\0!\x07 \nC\0\0\0\0^E\r\v \x07 \n^E\r\0 \nC\0\0? \x07C\0\0?!\b@ A\0L\r\0C\0\0? \b!\x07  *j!A\0!A\0!\0 AG@@  At\"j\"\x1BC\0\0?  0j*\0 \x07 \x1B*\08\0  Ar\"j\"\x1BC\0\0?  0j*\0 \x07 \x1B*\08\0 Aj! \0Aj\"\0 8G\r\0\v 9E\r\v  At\"\0j\"C\0\0? \0 0j*\0 \x07 *\08\0\v )A\0L\r\0  *j!\0 !@ \0 Atj\" \b *\08\0 Aj\" H\r\0\v\v 2Aj\"2 &G\r\0\vAà\0!A\v!\0  jA6\0  \x006@ AÎ\0 ;A t\"\0j\" AÎ\0N\x1B68 AÎ\0 (< \0j\"\0 \0AÎ\0N\x1B6< A\xA0 j$\0 .Aj  ) 7 ( ,Aj Aä\0j ` ) (m!\f\v ,(\f!? (8E@ A\x006D\v E@ .A j\"  {\vA!5@ *AG\r\0 &A\0L\r\0  &Atj!A\0! &AG@ &Aq &Aþÿÿÿ\x07q!\x1BA\0!@  At\"j\"   *\0\"\x07  j*\0\"\b \x07 \b^\x1B8\0  Ar\"j\"   *\0\"\x07  j*\0\"\b \x07 \b^\x1B8\0 Aj! Aj\" \x1BG\r\0\vE\r\v  At\"j\" *\0\"\x07  j*\0\"\b \x07 \b^\x1B8\0\v (g\" (jA k\" At\" H@A\0!5A\0 AG\r A\f\"5E@A\0!5A!A\0\f\v (g!\v    kA j6  !A\v!AA\0!\"@ \0@A\0!A\0!+\f\vA\0!A\0!+ Aj  J\r\0 A\f  A&\"AjA tjAk!+ AAj²C\0\0À=!\r   ( (gjAkN AàÍA\bA\0\vA\0\v! ( (gjA k!\v Aj!@ E\r\0   J\r\0 A\f!\" ( (gjAk!\v@   L@ A\f\"\r\vA\0! (8\"E\r\0 \0 !N\r\0C\0\x000A  u\"Aj² A\nJ\x1B!\vC\0\0\0?C\0\0\0\0 AF\x1BC\0\0À? \x1B! \0!@@  At\"j\"*\0\"\b  $j*\0\"	  'j*\0\"\x07 \x07 	]\x1B]@C\0\0\xA0Á \bC\0\0\0\0 \v 	 \b\"	 \x07 \bC\0\0\0?\"\x07 \x07 	]\x1B\"\x07C\0\0\0@ \x07C\0\0\0@]\x1B\"\x07 \x07C\0\0\0\0]\x1B\"\x07 \x07C\0\0\xA0Á]\x1B!\x07\f\v \b 	 \b 	]\x1B\"\b \x07]E\r\0 \b!\x07\v  \x07 8\0 Aj\" !G\r\0\v \0!@@   &jAt\"j\"*\0\"\b  $j*\0\"	  'j*\0\"\x07 \x07 	]\x1B]E@ \b 	 \b 	]\x1B\"\b \x07]E\r \b!\x07\f\vC\0\0\xA0Á \bC\0\0\0\0 \v 	 \b\"	 \x07 \bC\0\0\0?\"\x07 \x07 	]\x1B\"\x07C\0\0\0@ \x07C\0\0\0@]\x1B\"\x07 \x07C\0\0\0\0]\x1B\"\x07 \x07C\0\0\xA0Á]\x1B!\x07\v  \x07 8\0 Aj\" !G\r\0\vA\0!\v \0!C\0\0\0\0!\x07#\0Ak\"1$\0 1B\x007\b }C\0> At\"Að¢j*\0!\x07 A£j*\0\v!\b  !H@ AÔ\0l A*ljA\xA0\xA0j!-A * *AL\x1B!4 (AtA j!= \b!	@  Atj!8 -A  AN\x1BAtj!%A\0!@ = ( (\"\x1Bgjk\"AN@ %-\0\0A\x07t! %-\0At!/A\0!@@@  \x1BAv\"\x1B6$  (  \x1BnAsAj\"\x1BA\0 \x1BAM\x1B\"#K@ !\x1BA\0\f\vA!\x1B@@A /kAàÿ klAv\"E@ !A!(\f\vA!(@ Aj\"At\"9 j\" #K@ !\x1B\f\v (Aj!( ! 9Ak /lAv\"\r\0\v\v  # k\"A~qj! Av (j!(\v   \x1Bj\"  #K\"\x1B\"AO\r  #K\rA\0 (k ( \x1B\v #A \x1B j\"\x1B \x1BAO\x1B\"\x1BO\r   \x1BAI\f\vA¨Í\0AÇ,A\0\vAAÇ,A\0\vA¬ñ\0AÇ,A\0\v\f\v AN@ A£A\b\"AuA\0 Aqks\f\vA AG\r\0A\0 A\fk\v! 8 ,(\b lAtj\" \x07C\0\0Á *\0\"\b \bC\0\0Á]\x1B 1A\bj Atj\"*\0\"\v ²\"\b8\0  	 \b \v \b8\0 Aj\" 4G\r\0\v Aj\" !G\r\0\v\v 1Aj$\0 . &AtAjApqk\"($\0A\0! A\0G (At\" ( (gjA k\"\x1BAA \"\x1B\"j\"#AjOq!A\0!@ \0 !N\"1\r\0  k\"% #O@  \f! ( (gjA k!\x1B\v ( \0Atj 6\0 \0Aj\" !F\r\0AA \"\x1B!# !@ % \x1B #jO@  #\f s\" r! ( (gjA k!\x1B\v ( Atj 6\0 Aj\" !G\r\0\v\v@ E\r\0 AtAàõ\0j \"Atj j\"-\0\0 -\0F\r\0 A\fAt!\v@ 1\r\0 AtAàõ\0j \"Atj j! ! \0\"kAq\"@A\0!\x1B@ ( Atj\"  (\0j,\0\x006\0 Aj! \x1BAj\"\x1B G\r\0\v\v \0 !kA|K\r\0@ ( Atj\"  (\0j,\0\x006\0   (j,\0\x006   (\bj,\0\x006\b   (\fj,\0\x006\f Aj\" !G\r\0\v\vA!/   ( (gjAkN@ AãÍA\b!/\v ( &AtAjApq\"k\"%\"$\0 , %  *wA! At!  k\"#$\0 !\x1B@ 1@ !\f\v \0! !@ Aj! At!1@@ At \x1Bj N\r\0 % 1j\"-(\0A\0L\r\0 3 Atj.\0! 3 Atj.\0!  \f !\x1BE\r\0@   k *l t\"At\"A0  A0L\x1B\"  J\x1B\"k\" \x1BA\bjL@ !\f\v \" -(\0N\r\0@ A\f !\x1BE\r  j!  k\" \x1BA\bjL\r  -(\0H\r\0\v\v # 1j 6\0A  AL\x1BAk  A\0J\x1B!\f\v # 1jA\x006\0\v \" !G\r\0\v\v # &At\"AjApqk\"$\0A!  \x1BA0jN@ AçÍA\x07\b!\vA t\"=A\0 \"\x1B!4A\0! !  AjApq\"k\"1$\0 1 k\"\x1B$\0 , \0 ! # %  .A\fj .A\bj  Asj\"A\bA\0 \"A\0G AKq  AtAjNq\"8\x1B\"9k .Aj 1  \x1B *  A\0A\0A\0k!> ! \0\"J@A * *AL\x1B!#@@  At\"j(\0\"A\0L\r\0 (g (  *ljjA k (AtJ\r\0  j!%AA Á\"kt²!\x07A\0!@  !3 % ,(\b lAtj\"- -*\0 3²C\0\0\0? \x07C\0\08C\0\0\0¿C\0\0?8\0 Aj\" #G\r\0\v\v Aj\" !G\r\0\v\v 2Aq!- ; )kAtA@k! \x1B ) *lAtAjApqk\"$\0A\0!@ 7AN@ 2Aüÿÿÿ\x07q!@@ )At!# .Aj Atj!% E\"3E@ %(\0\"6 # 6j ü\n\0\0\v 3E@ %(\"6 # 6j ü\n\0\0\v 3E@ %(\b\"6 # 6j ü\n\0\0\v 3E@ %(\f\"% # %j ü\n\0\0\v Aj! :Aj\": @G\r\0\v -E\r\v@ @ .Aj Atj(\0\"# # )Atj ü\n\0\0\v Aj! Aj\" -G\r\0\v\v  & *l\"#AjApqk\"3$\0A\0 , \0 !   )AtjA\0 *AF\x1B 3A\0 1 4 / .(\b .(\f (  9k .(   > A,jA\0 (( ( h@ 8@ A , \0 !   \x1B   ( (gjkA j  *lE\r (( (,! ! \0\"J@AA t\" AL\x1B!8A * *AL\x1B!9 *AF!> AF!@ AF!6@ ,( \" Aj\"Atj.\0\"\x1B  At\":j.\0\"%k\"(Aþÿÿÿ\x07q!B (Aq!CC\0\0? ( t\"D·¶!\v 1 At\"j(\0Aj (n v²C\0\0\0¾»Dï9úþB.æ?¢¶C\0\0\0?!	 3  *lj!E  j!F  'j!G  $j!HA\0! % \x1BAkF!I@ ' ,(\b\" l\"\x1B jAt\"%j*\0!\x07 $ %j*\0!\n >@ \x07 G At\"j*\0\"\b \x07 \b^\x1B!\x07 \n  Hj*\0\"\b \b \n]\x1B!\n\vC\0\0\0\0 F \x1BAtj*\0 \n \x07 \x07 \n^\x1B\"\x07 \x07C\0\0\0\0]\x1B»Dï9úþB.æ¿¢!K@ 6\r\0   )lAtj ,(  :j.\0 tAtj!/  Ej!J \v 	 K¶\"\x07 \x07\"\x07Cóµ? \x07 @\x1B\"\x07 \x07 	^\x1B\"\x07!\bA\0!-A\0!\x1B@@ J-\0\0 \x1BvAq\r\0A!- (A\0L\r\0 / \x1BAtj!%A\0!A\0!4 IE@@ %  tAtj \x07 \b AÌå\0lAßæ»ãjAq\x1B8\0 % Ar tAtj \x07 \b A©¹á¹lA²ÒÀºj\"Aq\x1B8\0 Aj! 4Aj\"4 BG\r\0\v CE\r\v %  tAtj \x07 \b AÌå\0lAßæ»ãj\"Aq\x1B8\0\v \x1BAj\"\x1B 8G\r\0\v -E\r\0 / DC\0\0?B\v Aj\" 9G\r\0\v \" !G\r\0\v\v\f\v , \0 !   \x1B   ( (gjkA j  *l\vA\0!@ A #A\0JqE\r\0 #A\x07q! #A\bO@ #Aøÿÿÿ\x07q!A\0!\x1B@  Atj\"BðA7 BðA7 BðA7\b BðA7\0 A\bj! \x1BA\bj\"\x1B G\r\0\v E\r\vA\0!@  AtjA|6\0 Aj! Aj\" G\r\0\v\v (`@  )_\v (( ,  .Aj  \0 ! ? ! ?H\x1B * 7 \"  ( 5^A\0!@ A (H\" AL\x1B\"6H A (L\" AL\x1B\"6L (( .Aj Atj(\0\"    ,(, *T *P (\\ (X ,(< ; @ ((  ,(,\"Atj\"  (H + ) k *P \r (X  ,(< ;\v Aj\" 2G\r\0\v  (H6L *P!\x07  \r8P  \x078T (X!  6X  6\\  +6H @  6\\  \r8T  +6L\v@ *AG\r\0 &At\"E\r\0  j  ü\n\0\0\v@@ \"@ &A\0L\rA\0!@A 0 0AL\x1B\"AG@ Aq Aþÿÿÿ\x07q!A\0!@ $ At\"j\" *\0\"\x07  j*\0\"\b \x07 \b]\x1B8\0 $ Ar\"j\" *\0\"\x07  j*\0\"\b \x07 \b]\x1B8\0 Aj! Aj\" G\r\0\vE\r\v $ At\"j\" *\0\"\x07  j*\0\"\b \x07 \b]\x1B8\0\v\f\v &At\"E\"E@ ' $ ü\n\0\0\v E@ $  ü\n\0\0\v &A\0L\r\vC\v×#> (8 =j\"²Co: A\xA0J\x1B!\x07A\0!A 0 0AL\x1B\"AG@ Aq Aþÿÿÿ\x07q!A\0!@ < At\"j\" \x07 *\0\"\b  j*\0\"	 \b 	]\x1B8\0 < Ar\"j\" \x07 *\0\"\b  j*\0\"	 \b 	]\x1B8\0 Aj! Aj\" G\r\0\vE\r\v < At\"j\" \x07 *\0\"\x07  j*\0\"\b \x07 \b]\x1B8\0\v@ \0A\0L\r\0 \0Aq!A\0! \0AO@ \0Aüÿÿÿ\x07q!A\0!\x1B@  At\"jA\x006\0  'jA|6\0  $jA|6\0  Ar\"jA\x006\0  'jA|6\0  $jA|6\0  A\br\"jA\x006\0  'jA|6\0  $jA|6\0  A\fr\"jA\x006\0  'jA|6\0  $jA|6\0 Aj! \x1BAj\"\x1B G\r\0\v E\r\vA\0!@  At\"jA\x006\0  'jA|6\0  $jA|6\0 Aj! Aj\" G\r\0\v\v@ ! &N\"\r\0 & !\"kAq\"@A\0!@  At\"jA\x006\0  'jA|6\0  $jA|6\0 Aj! Aj\" G\r\0\v\v ! &kA|K\r\0@  At\"jA\x006\0  'jA|6\0  $jA|6\0  Aj\"jA\x006\0  'jA|6\0  $jA|6\0  A\bj\"jA\x006\0  'jA|6\0  $jA|6\0  A\fj\"jA\x006\0  'jA|6\0  $jA|6\0 Aj\" &G\r\0\v\v@ \0A\0L\r\0A\0! \0AG@ \0Aq \0Aþÿÿÿ\x07q!A\0!@   &jAt\"\0jA\x006\0 \0 'jA|6\0 \0 $jA|6\0  \0Aj\"\0jA\x006\0 \0 'jA|6\0 \0 $jA|6\0 Aj! Aj\" G\r\0\vE\r\v   &jAt\"\0jA\x006\0 \0 'jA|6\0 \0 $jA|6\0\v@ \r\0 !Aj!\0 & !kAq@  ! &jAt\"jA\x006\0  'jA|6\0  $jA|6\0 \0!!\v \0 &F\r\0 &Aj!@  ! &jAt\"\0jA\x006\0 \0 'jA|6\0 \0 $jA|6\0   !jAt\"\0jA\x006\0 \0 'jA|6\0 \0 $jA|6\0 !Aj\"! &G\r\0\v\v  (6, .Aj  ) 7 ( ,Aj Aä\0j ` A\x006` A6@ B\x0078A}!   ( (gjA kN@ (,@ A60\v ) (m!\v\v .AÐ\0j$\0 \vÃ}#\0\"\f!@ A\0J@ A\0L\r \f A|qAjApqk\"\"\f$\0 \f  j\"A|qAjApqk\"\"\f$\0 Av! \f Av\"AtAjApqk\"$\0@ Av\"E\r\0 Aq!A\0!\f AO@ Aüÿÿÿq!@  \vAtj \0 \vAtj*\x008\0  \vAr\"\rAtj \0 \rAtj*\x008\0  \vAr\"\rAtj \0 \rAtj*\x008\0  \vAr\"\rAtj \0 \rAtj*\x008\0 \vAj!\v Aj\" G\r\0\v E\r\v@  \vAtj \0 \vAtj*\x008\0 \vAj!\v \fAj\"\f G\r\0\v\v@ E\r\0 Aq!A\0!\fA\0!\v AO@ Aüÿÿÿq!A\0!@  \vAtj  \vAtj*\x008\0  \vAr\"\rAtj  \rAtj*\x008\0  \vAr\"\rAtj  \rAtj*\x008\0  \vAr\"\rAtj  \rAtj*\x008\0 \vAj!\v Aj\" G\r\0\v E\r\v@  \vAtj  \vAtj*\x008\0 \vAj!\v \fAj\"\f G\r\0\v\v     Av\"0@ E@C\0\0?!\f\v Aq!C\0\0?!A\0!\fA\0!\v AO@ Aüÿÿÿq!\rA\0!@  \vAtj\"*\f\"  *\b\"  *\"  *\0\"  ! \vAj!\v Aj\" \rG\r\0\v E\r\v@  \vAtj*\0\"  ! \vAj!\v \fAj\"\f G\r\0\v\v E@A}!A{\f\vC\0\0¿!\nA\0!A!\fA\0!\vC\0\0¿!@@  \vAt\"\rj*\0\"\bC\0\0\0\0^E\r\0 	 \bCÌ¼+\"\b \b\"\b  ^E\r\0 \x07 \b \n ^@ !\f \v! \n! \b!\n \x07!	 !\x07\f\v \v!\f \b! !	\vC\0\0?  \r j\"\r Atj*\0\"  \r*\0\" \" C\0\0?]\x1B! \vAj\"\v G\r\0\vA} Atk!A} \fAtk\v! Av! @ Aüÿÿÿq! Aq! A\bI!\rA\0!@  At\"j\"\vA\x006\0  jA{I  jAzMqE@@ E@C\0\0\0\0!\f\v  j!A\0!C\0\0\0\0!A\0!A\0!\f \rE@@ \0 \fAt\"A\fr\"j*\0  j*\0 \0 A\br\"j*\0  j*\0 \0 Ar\"j*\0  j*\0 \0 j*\0  j*\0 ! \fAj!\f Aj\" G\r\0\v E\r\v@ \0 \fAt\"j*\0  j*\0 ! \fAj!\f Aj\" G\r\0\v\v \vC\0\0¿  C\0\0¿]\x1B8\0\v Aj\" G\r\0\v\v@ E@C\0\0?!\f\v Aq!C\0\0?!A\0!\fA\0!\0 A\bO@ Aüÿÿÿq!A\0!@  \0Atj\"\v*\f\"\x07 \x07 \v*\b\"\x07 \x07 \v*\"\x07 \x07 \v*\0\"\x07 \x07 ! \0Aj!\0 Aj\" G\r\0\v E\r\v@  \0Atj*\0\"\x07 \x07 ! \0Aj!\0 \fAj\"\f G\r\0\v\vA\0!@ E@A\0!\f\f\vC\0\0¿!\nC\0\0\0\0!\x07A\0!\fA\0!\0C\0\0\0\0!	C\0\0¿!@@  \0At\"j*\0\"\bC\0\0\0\0^E\r\0 	 \bCÌ¼+\"\b \b\"\b  ^E\r\0 \x07 \b \n ^@ \0!\f \n! \b!\n \x07!	 !\x07\f\v \b! !	\vC\0\0?   j\" Atj*\0\"  *\0\" \" C\0\0?]\x1B! \0Aj\"\0 G\r\0\v \fE\r\0 \f AkN\r\0A!  \fAtj\"\0*\" \0Ak*\0\"	 \0*\0\"\x07 	C333?^\r\0 	  \x07 C333?^!\v   \fAtj6\0 $\0\vAÍÝ\0A)AÅ\0\vAÞ\0A)AÆ\0\v\v}#\0A0k\"$\0 \0(\0! AN@A!@  Atj  At\"Atj\"*\0C\0\0\0?  AkAtj*\0C\0\0> *C\0\0>8\0 Aj\" G\r\0\v\v  *C\0\0> *\0C\0\0\0?\"8\0 AF@ \0(!\0 AN@A!@  Atj\" *\0 \0 At\"Atj\"*\0C\0\0\0? \0 AkAtj*\0C\0\0> *C\0\0>8\0 Aj\" G\r\0\v\v   \0*C\0\0> \0*\0C\0\0\0?8\0\vA\0!\0  Aj\"A\0A\0A d  *CG?8  *\"Co¼Co< 8  *\"Co¼Co< 8  *\"C¦Ä¼C¦Ä< 8  * \"Co½Co= 8   Ae@ A\0L\r\0 *\bC½:?\"CÍÌL? *\fC*ö'?\"!\x07 *C(\\O?\"CÍÌL? !\b *\0Cfff?\"CÍÌL? !	 CÍÌL?!\n CÍÌL?!\vC\0\0\0\0!C\0\0\0\0!C\0\0\0\0! AG@ Aq Aþÿÿÿ\x07q!A\0!@  \0Atj\" \n  \x07 \r \b \" 	 \f\" \v \" *\0\"\f8\0  \n \r \x07  \b  	  \v \f *\"8 \0Aj!\0 !\r Aj\" G\r\0\vE\r\v  \0Atj\"\0 \n  \x07  \b  	 \f \v  \0*\08\0\v A0j$\0\v¤}#\0\"!	  At\"AjApqk\"\x07$\0@ A\0J@ A\0H\r @ @ \x07 \0 ü\n\0\0\vA\0!@ \x07 At\"\bj  \bj*\0\"\v \0 \bj*\08\0 \x07  AsjAt\"\bj \v \0 \bj*\08\0 Aj\" G\r\0\v \x07!\0\v \0 \0   k\"\x07 Aj0A\0! A\0N@ \0 \x07Atj!\b@ \"Aj!C\0\0\0\0!\v@  \x07j\" N\r\0  kAq@ \0 Atj*\0 \b*\0C\0\0\0\0!\v Aj!\v  F\r\0@ \0 Aj\"\nAtj*\0 \0 \n kAtj*\0 \0 Atj*\0 \0  kAtj*\0 \v!\v Aj\" G\r\0\v\v  Atj\" \v *\08\0  G\r\0\v\v 	$\0A\0\vAåÝ\0Aà-A®\0\vAß\0Aà-A¯\0\v¿	} *\0! At\"@ \0A\0 ü\v\0\v@ *\0CÿæÛ.^E\r\0A!\n A\0L\r\0 A\0 A\0J\x1B!\v@@ E@C\0\0\0\0!\f\f\v@ AF@C\0\0\0\0!\fA\0!\f\v Aq A~q!\bC\0\0\0\0!\fA\0!A\0!@ \0 Ar\"Atj*\0   kAtj*\0 \0 Atj*\0   kAtj*\0 \f!\f Aj! Aj\" \bG\r\0\vE\r\v \0 Atj*\0   kAtj*\0 \f!\f\v \0 Atj\"	 \f  Aj\"Atj*\0 \"\r8\0@ E\r\0A\0! AG@ Aq Aþÿÿÿ\x07q!\bA\0!@ \0 Atj\" \r 	 AsAtj\"*\0\" *\0\"\f8\0   \r \f8\0  \r 	 AþÿÿÿsAtj\"*\0\" *\"\f8   \r \f8\0 Aj! Aj\" \bG\r\0\vE\r\v \0 Atj\" \r 	 AsAtj\"*\0\" *\0\"\f8\0   \r \f8\0\v  \r \r \" *\0Co:_\r \nAj\"\nAv! \" \vG\r\0\v\v\v±\x07}\v \0($!\x1B \0(! \0(! \0(\0!A!@@@@@@@@@@ (\0\" \0(\b\"(8 \0(\f\"Atj.\0 \bAtj\"\bkA k\" \bAuApA| AF 	A\0Gq\"\b\x1Bj AtA~A \b\x1Bj\"\bl j \bm\"\b \b J\x1B\"\bAN@AÀ\0 \b \bAÀ\0O\x1B\"\bA\x07qAt.ÍA \bAvkuAjA~q\"AN\r\vA   L\x1B  	\x1B!@@@@ @ @ @ \0(,A\0!A\0!@ 	@ A\0L\r@ AF@A\0!\b\f\v Aq Aþÿÿÿ\x07q!A\0!\b@  \bAt\"Ar\"j*\0\"\r  j*\0\"\"   j*\0\"  j*\0\"\"  \v!\v \r \"\r \r  \"\r \r \f!\f \bAj!\b Aj\" G\r\0\vE\r\v  \bAt\"\bj*\0\"\r  \bj*\0\"\"  \v!\v \r \"\r \r \f!\f\f\v A\0L\r\0 Aq!A\0!\b@ AO@ Aüÿÿÿ\x07q!@  \bAtj\"*\f\"\v \v *\b\"\v \v *\"\v \v *\0\"\v \v \f!\f \bAj!\b Aj\" G\r\0\v E\r\v@  \bAtj*\0\"\v \v \f!\f \bAj!\b Aj\" G\r\0\v\v Aq!A\0!C\0\0\0\0!\vA\0!\b@ AO@ Aüÿÿÿ\x07q!A\0!@  \bAtj\"*\f\"\r \r *\b\"\r \r *\"\r \r *\0\"\r \r \v!\v \bAj!\b Aj\" G\r\0\v E\r\v@  \bAtj*\0\"\r \r \v!\v \bAj!\b Aj\" G\r\0\v\v \vC\0\0\0\0!\v \fC\0\0\0\0!\f\v}C\0\0\0\0 \f\"\f \f \v\"\v \vCï!]\r\0 \v \f]@ \v \f\"\f \f \f\"\v \v \v \v \v \v \vCË·»C«¾¼<C\0¤l½CÿÈ=CÆ¾C\bkL>Cy¨ª¾ \fCù\"?\f\v \f \v\"\f \f \f\"\v \v \v \v \v \v \vCË·»C«¾¼<C\0¤l½CÿÈ=CÆ¾C\bkL>Cy¨ª¾ \fCù\"¿C\0\0?\vC\0\0NC\0\0\0?ü\0Au! ! AF\r\x07@ 	@ \0(0\"\0\r  lA@kAu\f\v  lA@k\"Au!\b@ \0(8E@ \b!\0\f\v \bA\0L@ \b!\0\f\v \b N@ \b!\0\f\v Aq \"\0n\"At\"A\ru ÁlAjAu\" Aûÿÿ\x07lAjAvAÕÀ\0jAÿÿqlAtAïkAu lAjAv kÁA~s\"g\"A k\"A\ru AulAjAu\" Aûÿÿ\x07lAjAvAÕÀ\0jAÿÿqlAtAïkAu lAjAv kÁA~s\"g\"kA\vt  AktÁ\"AÛëÿÿ\x07lAjAvAü=jAÿÿq lAjAvk  AktÁ\"AÛëÿÿ\x07lAjAvAü=jAÿÿq lAjAvjÁ A\x07tAkÁlAjAu\" (\0\"J\r\0 \bA\0 A\0 kN\x1B!\0\v \x07AJ\r\x07  \0k\"\bAj\" \0Aj\" \0 Au\"\x07J\"\x1B! \x07Aj\"\x07 \x07l!\x07 \r \0 lAu\f\v \0AsAv  lAÿÿA~ AÀ\0J\x1B mjAu\"\0A\0 \0A\0J\x1B\"\0 Ak\"\x07 \0 \x07H\x1Bj\v!\0 AM\r  Am\"\x07AlAj\"\b \x07Asj \0j \0Al\" \0 \x07J\"\x1B \b \x07k \0j Aj \x1B \x07 \bj2\f\v ! AF\r\n@ 	E\r\0 AI\r\0   Am\"\x07Aj\"Al\"\b \x07j\"z\"\0 \bH@ \0Am\f\v \0 Atk\v\"\0 \b \x07Asjj \0Al\" \0 \x07J\"\x1B \b \x07k \0j Aj \x1B I\f\v@ \x07AJ\r\0 	\r\0  Au\"\x07Aj\"\0 \0l\"z\" \0 \x07lAuN\r AtArpAkAv\"	Aj\"\0 	lAv\f\v  Aj&!\0\f\v \x07  \bAjlAuk\v\"\b \b j \x072\f\v  Aj\"\0 \0At  AsjAtArpkAv\"	k\"\0  	kAjlAuk\v\" \0 j I 	At n!\f	\v  \0 Aj%\v \0A\0H\r \0At\"\0 n! 	E\r\x07 E\r\x07 \0 I@ \x1B Atj\"\0 (\bAtj*\0\"\v \v \v \0*\0\"\f \fC}&C}&\"\r!\v \f \r!\fA\0!\x07A\0!	 AF\r Aq Aþÿÿÿ\x07q!A\0!\0@  	At\"j\" \f *\0 \v  j*\08\0  Ar\"j\" \f *\0 \v  j*\08\0 	Aj!	 \0Aj\"\0 G\r\0\v\r\f\x07\vA\0!	 AG@ Aq Aþÿÿÿ\x07q!A\0!\0@  	At\"\x07j\" *\0Có5?\"\v  \x07j\"*\0Có5?\"\f8\0  \f \v8\0  \x07Ar\"\x07j\" *\0Có5?\"\v  \x07j\"\x07*\0Có5?\"\f8\0 \x07 \f \v8\0 	Aj!	 \0Aj\"\0 G\r\0\vE\r\b\v  	At\"\0j\" *\0Có5?\"\v \0 j\"\0*\0Có5?\"\f8\0 \0 \f \v8\0\f\x07\v 	E\rA\0!	A\0!\x07@ AÀ\0H\r\0 \0(4\r\0 Aq!A\0!A\0!\b@ AI\r\0 Aüÿÿÿ\x07q!@  \bAtj\" *\08\0  *8  *\b8\b  *\f8\f \bAj!\b \x07Aj\"\x07 G\r\0\v \r\0A!\x07\f\v@  \bAtj\"\x07 \x07*\08\0A!\x07 \bAj!\b Aj\" G\r\0\v\v \x1B Atj\"\b (\bAtj*\0\"\v \v \v \b*\0\"\f \fC}&C}&\"\r!\v \f \r!\f AG@ Aq Aþÿÿÿ\x07q!A\0!@  	At\"\bj\" \f *\0 \v  \bj*\08\0  \bAr\"\bj\" \f *\0 \v  \bj*\08\0 	Aj!	 Aj\" G\r\0\vE\r\v  	At\"j\" \f *\0 \v  j*\08\0\f\v  	At\"\0j\" \f *\0 \v \0 j*\08\0\f\vAúÎ\0AÜ\"A\0\vA¸ß\0AÜ\"AÈ\0\vA\0!\x07 	E\r\vA\0A\0 (\0AH\r\0A\0 \0( AH\r\0 @  \x07A \x07\f\v A\f\v \0(4\x1B!\x07\v !\0  (\0 \0 k\"k6\0\f\v !\0  (\0 \0 k\"k6\0A! AF\r \r !\x07\v \n \n(\0A tAsq6\0A!\0Aÿÿ!A\0!A\0!	\f\v \n \n(\0A tAs tq6\0Aÿÿ!	A\0!\x07A\0!A!\0\f\v Á At\"A\rulAjAu\"\0 \0Aûÿÿ\x07lAjAvAÕÀ\0jAÿÿqlAtAïkAu \0lAjAv \0kÁA~s\"g\"A k\"\0A\ru \0AulAjAu\"\0 \0Aûÿÿ\x07lAjAvAÕÀ\0jAÿÿqlAtAïkAu \0lAjAv \0kÁA~s\"	g\"\0kA\vt  AktÁ\"AÛëÿÿ\x07lAjAvAü=jAÿÿq lAjAvk 	 \0AktÁ\"\0AÛëÿÿ\x07lAjAvAü=jAÿÿq \0lAjAvjÁ A\x07tAkÁlAjAu!\0A\0!\x07 !\v  6  6  \x006\f  	6\b  6  \x076\0\v®#\0\"!   l\"AtAjApqk\"\f$\0 A\0J@@ E@ Aüÿÿÿ\x07q!\r Aq!\bA\0! A\0L! AI!@@ \r\0 \0 Atj! \f  lAtj!A\0!	A\0!\nA\0! E@@  Atj   lAtj*\x008\0  Ar\"\x07Atj   \x07lAtj*\x008\0  Ar\"\x07Atj   \x07lAtj*\x008\0  Ar\"\x07Atj   \x07lAtj*\x008\0 Aj! \nAj\"\n \rG\r\0\v \bE\r\v@  Atj   lAtj*\x008\0 Aj! 	Aj\"	 \bG\r\0\v\v Aj\" G\r\0\v\f\v Aüÿÿÿ\x07q!\r Aq!\b AtAÌj!A\0! A\0L! AI!\x07@@ \r\0 \0 At\"j! \f  j(\0 lAtj!A\0!	A\0!\nA\0! \x07E@@  Atj   lAtj*\x008\0  Ar\"\vAtj   \vlAtj*\x008\0  Ar\"\vAtj   \vlAtj*\x008\0  Ar\"\vAtj   \vlAtj*\x008\0 Aj! \nAj\"\n \rG\r\0\v \bE\r\v@  Atj   lAtj*\x008\0 Aj! 	Aj\"	 \bG\r\0\v\v Aj\" G\r\0\v\v At\"@ \0 \f ü\n\0\0\v $\0\vA°Þ\0AÜ\"AÆ\0\v©0}#\0A\xA0k\"! $\0 A\0G\". \vE A\x07Jqq\" \0Er!/  ( \"' (\bAt\"jAk.\0 ' Atj\"@.\0\"0k t .tAtAjApqk\"\"$\0  'j\"Ak.\0!A tA 	\x1B!& \0A\0G q\"2@  .\0 k t\"	AtAjApqk\"%\"$\0Aû	\f\v  ' (\fAtjAk.\0 tAtj!%A!	A\v!  	AtAjApq\"	k\"\"\"$\0  	k\"#\"$\0  	k\"3\"$\0  	k\"4\"$\0  	k\"5\"$\0  6ü  \x076  \f6ð  \x006à  6è (\0!	  6  6  \n6ô  	6 A\x006  /6ä  AjAðqk\"6$\0  &AJ\"\x006   HAA \x1B!7   tAtj 0 t\"8Atk\"+A\0 8kAt\"	j!A 	 j!, A\0 \x1B!B \nAG \0r!C Aj!9 Ak!-A &tAs! !A\0!A!\n@  \"6ì@ ' Aj\"Atj.\0 ' Atj\"$.\0\"k\"	 t\"A\0J@   \":k\"\0Ak6A\0!  :A\0  G\x1Bk!;  J@Aÿÿ\0 \0 \b Atj(\0 ;A  k\" AN\x1Bmj\" \0 H\x1B\"\0A\0 \0A\0J\x1B\"\0 \0Aÿÿ\0N\x1B!\v /@    \x1B \nAq\x1B\"\0 \0   9F\x1B $.\0 	k t @.\0 tN\x1B!\v  tAt\" j@  9G\"D\r\0 (  Atj\"\0.\" \0.\0k t\"\nAt \0. k t\"kAt!\0 \nAt!  \nkAt\"\nE\"E@  j \0 j \nü\n\0\0\v \vE\r\0 \r\0  +j \0 +j \nü\n\0\0\vA\0 \x1B  j  \r At\"<j(\0\"6ø %A\0  (\fH\"\x1B\x1B\" A\0  -G\"!\x1B!%A!@ E@ \"\0!\n\f\v \"\0!\n C A\0HrE\r\0 ' Atj.\0 	 0jk t\"\0A\0 \0A\0J\x1B\" 8j!	 !@ ' Ak\"Atj.\0 t 	J\r\0\v    H\x1BAk!\0@  L@ \0!\f\v 	 j!\n Ak!@ ' Aj\"	Atj.\0 t \nN\r 	\" \0G\r\0\v \0!\vA\0!\0A\0!\n@ \0   .tj\"	-\0\0r!\0 \n 	 7jAk-\0\0r!\n  H Aj!\r\0\v\v   % 2\x1B!%  \x1B\x1B! B \x1B\x1B! \vE\r /E \f GrE@ $.\0 0k t\"	A\0L\rA\0! 	AG@ 	Aq 	Aþÿÿÿ\x07q! A\0!\v@  At\"	j\" *\0 	 +j*\0C\0\0\0?8\0  	Ar\"	j\" *\0 	 +j*\0C\0\0\0?8\0 Aj! \vAj\"\v  G\r\0\vE\r\v  At\"	j\"\v \v*\0 	 +j*\0C\0\0\0?8\0\f\v \f F\rA\0  At\"	j AF\"\x1B!\x1B Av! !E@A\0 	 +j \x1B! Aàj    & \x1B A\0C\0\0? % \0!	A\0\f\vA\0 	 +j \x1B! Aàj    & \x1B  , $.\0 tAtjC\0\0?   \0!	 A $.\0 tAtj\v!$ Aàj    &   $C\0\0? % \n\f\vAØç\0AÜ\"A©\r\0\v @ 2E \f LrE@ \x07 <j\"	 (\bAtj*\0!I 	*\0!J (!( (\0!=  )7Ø  )\b7Ð (!!  (,6È  )$7À  )7¸  (6  )7x  )7p  )7h  )ø7`  )ð7X  )è7P  )à7H At\"\x1BE\" E@ \"  \x1Bü\n\0\0\v  E@ #  \x1Bü\n\0\0\v A6A\0! \0 \nr!>A\0!\0 Aq! Ak!	C\0\0\0\0!H Aàj     &  AtjA\0 AG\x1B\"E   -F\"1A\0 , $.\0 tAtj\v % >@!\n@ AO@ Aüÿÿÿ\x07q!\vA\0!@ \" At\"\0A\fr\")j*\0  )j*\0 \" \0A\br\")j*\0  )j*\0 \" \0Ar\")j*\0  )j*\0 \0 \"j*\0 \0 j*\0 H!H Aj! Aj\" \vG\r\0\v E\r\vA\0!\0@ \" At\"\vj*\0 \v j*\0 H!H Aj! \0Aj\"\0 G\r\0\v\vA\0!C\0\0\0\0!GA\0!\0@ 	AI\")E@ Aüÿÿÿ\x07q!A\0!\v@ # \0At\"	A\fr\"*j*\0  *j*\0 # 	A\br\"*j*\0  *j*\0 # 	Ar\"*j*\0  *j*\0 	 #j*\0 	 j*\0 G!G \0Aj!\0 \vAj\"\v G\r\0\v E\r\v@ # \0At\"	j*\0 	 j*\0 G!G \0Aj!\0 Aj\" G\r\0\v\v  )(7°  ) 7¨  )7\xA0  )7  )\b7  )\x007  )à7\b  )è7  )ð7  )ø7   )7(  )70  )78  (6@  E@ 3  \x1Bü\n\0\0\v  E@ 4  \x1Bü\n\0\0\v@ 1\r\0  \r\0 5 , $.\0 tAtj \x1Bü\n\0\0\v ! =j!* ( !k\"?E\"FE@ 6 * ?ü\n\0\0\v  (6  =6\0  )Ø7  )Ð7\b  !6  (È6,  )À7$  )¸7  )H7à  )P7è  )X7ð  )`7ø  )h7  )p7  )x7  (6  E@  \" \x1Bü\n\0\0\v  E@  # \x1Bü\n\0\0\v@ D\r\0 (  Atj\"\0. \0.\"	k t\"\v 	 \0.\0k t\"\0kAt\"	E\r\0  \0Atj  \0At \vkAtj 	ü\n\0\0\v A6A\0!\0A\0! I J I I J^\x1BC\0\0@@\"I\"K G!G J I\"I HC\0\0\0\0!H Aàj     & E  1A\0 , $.\0 tAtj\v % >@!	@ )E@ Aüÿÿÿ\x07q!A\0!@ \" \0At\"\vA\fr\"!j*\0  !j*\0 \" \vA\br\"!j*\0  !j*\0 \" \vAr\"!j*\0  !j*\0 \v \"j*\0 \v j*\0 H!H \0Aj!\0 Aj\" G\r\0\v E\r\vA\0!@ \" \0At\"\vj*\0 \v j*\0 H!H \0Aj!\0 Aj\" G\r\0\v\v G!JA\0!C\0\0\0\0!GA\0!\0@ )E@ Aüÿÿÿ\x07q!!A\0!\v@ # \0At\"A\fr\"(j*\0  (j*\0 # A\br\"(j*\0  (j*\0 # Ar\"(j*\0  (j*\0  #j*\0  j*\0 G!G \0Aj!\0 \vAj\"\v !G\r\0\v E\r\v@ # \0At\"\vj*\0 \v j*\0 G!G \0Aj!\0 Aj\" G\r\0\v\vA\0!\v I H K G J_  )°7(  )¨7   )\xA07  )7  )7\b  )7\0  )\b7à  )7è  )7ð  ) 7ø  )(7  )07  )87  E@  3 \x1Bü\n\0\0\v  E@  4 \x1Bü\n\0\0\v@ 1\r\0  \r\0 , $.\0 tAtj 5 \x1Bü\n\0\0\v FE@ * 6 ?ü\n\0\0\v \n 	\v\f\vA\0!\v A\x006A\0! Aàj     &  AtjA\0 AG\x1B   -G , $.\0 tAtjA\0\v % \0 \nr@\f\vA\0!\vA\0! Aàj    &  AtjA\0 AG\x1B   -G , $.\0 tAtjA\0\vC\0\0? % \0 \nr\v\"	\v!   .tj\"\0 	:\0\0 \0 7jAk :\0\0 \b <j(\0 A\x006 : ;jj!  AtJ!\n  G\r\0\v ( 	\v6\0 A\xA0j$\0\v} A\0J@ Au! At!\x07@ A\0J@ \0 Atj!A\0!@   \x07lAtj\" *\0Có5?\"\b  AtAr lAtj\"*\0Có5?\"	8\0  \b 	8\0 Aj\" G\r\0\v\v Aj\" G\r\0\v\v\v4\0 \0AüH@  \0:\0\0A\v  \0 \0A|r\"\0AÿqkAv:\0  \0:\0\0A\v#\0\"!& \bA\0 \bA\0J\x1BA\bA\0 \bA\bN\x1B\"'k!\x1B \0(\b!@ \rAG@\f\v  kA\xA0£j-\0\0\" \x1BJ@A\0!\f\v \x1B k\"\bA\bA\0 \bA\bN\x1B\"k!\x1B\v  AtAjApq\"\bk\"!\"$\0  \bk\"\"\"$\0  \bk\"\"$\0 \rAt!  \bk\" $\0  N\"#E@ Aj!  kAk \rl! \0( \" Atj/\0! !\b@  \bAt\"j   \bAj\"Atj.\0\" Ák\"Al tAtAu\"  J\x1B6\0   j   \bAsjl l tAu A\0  tAF\x1Bk6\0 ! \"\b G\r\0\v\v \0(0\"(Ak!A!@@  jAu! #E@ \0(4  lj!$ \0( \"% Atj/\0!A\0!A\0! !\b@ Á % \bAk\"\bAtj.\0\"k \rl \b $j-\0\0l tAu\"A\0J   \bAtj(\0 j\"A\0 A\0J\x1B \v  \bAt\"j(\0j!@ E@   j(\0H\r\v   j(\0\"  H\x1B!A\f\v A\0  N\x1B!A\0\v!  j! !  \bH\r\0\v  Aj  \x1BJ\"\x1B\" Ak  \x1B\"L\r \0(4\"  lj!  Ak lj!$ \0( \"% Atj/\0! \"\b!@ % \bAj\"Atj.\0\" Ák \rl\" \b $j-\0\0l tAu!  (N@  \bAtj(\0\f\v  \b j-\0\0l tAu\v! A\0J@   \bAtj(\0 j\"A\0 A\0J\x1B!\v A\0J@   \bAtj(\0 j\"A\0 A\0J\x1B!\v ! \bAt\"j   j(\0\"A\0 AJ\x1Bj\"6\0  \"j   kj\"A\0 A\0J\x1B6\0 \b  A\0J\x1B! ! \"\b G\r\0\v\f\v  Aj \x1BA\0H\"\x1B\" Ak  \x1B\"L\r\0\v !\vAÀ\0!A\0!A\0!@  jAu! !A\0!A\0! #E@@ \" Ak\"At\"j(\0 lAu  !j(\0j!\b@ E@ \b  j(\0H\r\v \b  j(\0\" \b H\x1B!\bA\f\v A\0 \b N\x1B!\bA\0\v! \b j!  H\r\0\v\v    \x1BJ\"\x1B!   \x1B! Aj\"AG\r\0\vA\0!  H@ !A\0!@ \n Ak\"At\"\bj \b !j(\0 \b \"j(\0 lAuj\" A\0  N\x1B   \b j(\0Nr\"Aq\x1B\"  \bj(\0\"\b \b J\x1B\"\b6\0 \b j!  H\r\0\v\v@@  Ak\"N@ !\b !\f\v Aj! A\bj! !@ \0( \" Atj.\0\"  \"\bAtj.\0\" k\"! \x1B k\"\"   Atj.\0\"kn\"#l \n \bAt\"j\"(\0\"j  \"j  k  k #lj\"A\0 A\0J\x1Bj\"  j(\0\"   J\x1BN@@@ @@  L\r\0 \b L@  !A	A\x07  H\x1BlA\0 AJ\x1B tAtAuJ\r\v A\0A\f\v AA\f\v A\fE\r\v !\b !\f\v A\bk! A\bj! (\0!\v A\0LA\0 \b kA\xA0£j-\0\0\v!  A\0  N\x1B\"6\0   jk j j! ! \b! \bAk\" J\r\0\v\v \x1B 'j!\x1B\v@@@  \bH@@@@@ A\0 A\0J@ E\r  (\0\" \b  \bH\x1B\"6\0   k \b kAj% (\0\f\v A\x006\0A\0\v L\"\x1B! E\r \r E\r  \x07(\0A\f\v   \b kAj& j\"6\0 A\0  N\"\x1B! E\r \r\v \x07 A\f6\0\f\v \x07A\x006\0\v  \x1B kj\" \0( \" \bAtj.\0\"  Atj.\0\"kn! ! \b \"k\"Aq@ \n Atj\" (\0  Aj\"Atj.\0\" k lj6\0\v \b Asj\"@@ \n Atj\" (\0  Aj\"Atj.\0\" Ák lj6\0 \n Atj\" (\0  Aj\"Atj.\0\" k lj6\0 \b G\r\0\v\v  k l j!@ AqE@ ! !\f\v \n Atj\"   Aj\"Atj.\0\" k\"  J\x1B\" (\0j6\0  k!\v @@ \n Atj\"   Aj\"Atj.\0\" Ák\"  J\x1B\" (\0j6\0 \n Atj\"  k\"  Aj\"Atj.\0\" k\"  H\x1B\" (\0j6\0  k! \b G\r\0\v\v \rAJ\"!A\0!@  \bF\r\0 At!AA \x1B!@ \n At\"j\"(\0\"A\0H\r  j!  Aj\"Atj.\0\" Ák t\"AN@    j(\0\"  H\x1B\"6\0  k!\x1B  \rl! \x1BA\0J!@A\0 \rAG\r\0A\0 AF\r\0A\0 \x07(\0\r\0  (\0H\v j\"At\"AuA\0 AF\x1B Aklj  \0(8 Atj.\0j l\"Auj\" j\" AtH@  Auj!\f\v  AlN\r\0  Auj!\v \v j\" At j j\"A\0 A\0J\x1B nAv\"6\0 A\b (\0\" uAu  \r l AuJ\x1B\" A\bN\x1B\"6\0 \f j (\0 j  lL6\0  (\0 (\0 lk6\0 \x1BA\0 \x1B\f\v     H\x1B6\0 \v jA\x006\0 \f jA6\0  k\"A\0 A\0J\x1B\v\" \v j\"  v\"A\b (\0\"k\"  H\x1B\" j6\0 \f j  l\"  kN6\0  kA\0\v! (\0A\0H\r \v j(\0A\0N@ ! \" \bF\r\f\v\vA¹ê\0AÖ)A\0\v 	 6\0  \bJ@ \b!@ \v At\"\0j\" \0 \nj\"(\0 uAu\"6\0 (\0  lG\r A\x006\0 \0 \fj (\0A\0L6\0 Aj\" G\r\0\v\v &$\0 \b\vAã\vAÖ)A\0\vAÙê\0AÖ)A½\0\vAÙê\0AÖ)A\0\vAæ=AÖ)A\0\vì\bA \b \bAL\x1B!\v@  N\"\f\r\0  \bH\r\0 !\n@@  \nAt\"	j\"\r(\0A\x07J\r\0  	j(\0\r\0  	j!A\0!	@ \x07A! @  \0(\b 	lAtj\" *\0 ²C\0\0\0¿AA\r \r(\0kt²C\0\088\0\v 	Aj\"	 \vG\r\0\v  \vk!\v \nAj\"\n N\r  \bN\r\0\v\v@ \f\r\0  \bH\r\0@@  At\"\nj\"\f(\0A\x07J\r\0  \nj(\0AG\r\0  \nj!\nA\0!	@ \x07A!\r @ \n \0(\b 	lAtj\" *\0 \r²C\0\0\0¿AA\r \f(\0kt²C\0\088\0\v 	Aj\"	 \vG\r\0\v  \vk!\v Aj\" N\r  \bN\r\0\v\v\vù\n\b}#\0Ak\"$\0 B\x007\b  AjN@ 	 \fA\v \f}C\0> \vAt\"Að¢j*\0!! A£j*\0\v!A\0!  H@A \n \nAL\x1B! \nAl! A j! \0(\b!\f !# !!$ !\v@ A\0G \vAJq!\x1B \b \vAt\"j!  \v kl!  j! \x07A \v \vAN\x1BAtj!A\0!\n@  $C\0\0Á  \n \fl\"\f \vjAt\"j*\0\" C\0\0Á]\x1B\"%  j*\0\" A\bj \nAtj\"*\0\"\"\"&C\0\0\0?ü\0\"6@ A\0N\r\0 C\0\0àÁ  \fAtj*\0\"   C\0\0àÁ]\x1B \r\" ]E\r\0    ü\0 j\"Au q\"6\v  	( 	(gjk! !\f@  \vF\r\0  j\"AJ\r\0 A \f \fA\0J\x1B\"\f6 AJ\r\0 A \f \fA\0H\x1B\"\f6\v \x1B@  \fAu \fq\"\f6\v@ AN@ -\0\0A\x07t!\f -\0At!A\0!@@ (\"@  Au\"s k!A!@A kAàÿ \fklAv\"E\r\0 AH\r\0@ Aj! \f At\"jAj!\f  lAv\"E\r  H\r\0\v\v@ E@   k\" AvAr \fkAuAk\"  J\x1B\"  jj s6 \f j AtjAj\"AG!\f\f\v \f Aj\"\fA\0 A\0N\x1Bj!\v \f jAO\r \fE\r\v \f j! 	(\"Av!\f 	 @ 	 	(  \f Akl jj6  \f  kl\f\v \f Akl j\v\"\f6 \fAM@ 	( !@@ Av\"AÿG@ Av!\f 	((\"A\0N@ 	 	( 	(\" 	(\bjK 	 Aj6 	(\0 j \f j:\0\0A\0A\v 	(,r6,\v 	($\"@ \fAk!@A!\f 	 	( 	(\" 	(\bjK 	 Aj6 	(\0 j :\0\0A\0!\f 	($ \vAk\"6$ 	 	(, \fr6, \r\0\v\v 	 Aÿq6( 	(!\f 	( !\f\v 	 	($Aj6$\v 	 \fA\bt\"\f6 	 A\btAþÿÿ\x07q\"6  	 	(A\bj6 \fAI\r\0\v\v\f\vAÍ\0AÇ,AØ\0\0\vAÝ\0AÇ,AÙ\0\0\v AN@  \fA\0J \fA\0Hk\"6 	 At \fAusA£A\x07\f\v AF@  \fAu \fq\"\f6 	A\0 \fkA\f\v A6\v  \0(\b\"\f \nlAt\"j & (\"²\"8\0  j ! % \" 8\0  #  \" 8\0  k\" Au\"s k j! \nAj\"\n G\r\0\v \vAj\"\v G\r\0\v\v Aj$\0A\0  \x1B\vò<'#\0Ak\"$\0 \0(!\v A\x006@@@ \vAkAÀI@@@@@ \0\v \0 \0(ÔAtjAôj(\0AG\r\v  \vAjAð\x07qAtk\"$\0 \0  \0(Ô  G   \0,\0­ \0,\0® \0(F#\0A@j\"$\0 Aj \0Aj \0Aj AF \0(t A j\" \0Aj \0(o \0(¨! A@k\"  \0(¤! A j!\f@@ \0(ÈAF@ \0A:\0¯\f\v \0,\0¯\"\bAJ\r\0@ \0(¤\"A\0L\r\0 \0A¨j!	A\0! AG@ Aq Aþÿÿÿ\x07q!@  At\"\rj 	 \rj.\0\" A j \rj.\0 k \blAvj;\0  \rAr\"\rj 	 \rj.\0\" A j \rj.\0 k \blAvj;\0 Aj! \nAj\"\n G\r\0\vE\r\v  At\"j  	j.\0\"	 A j j.\0 	k \blAvj;\0\v \0(¨! \f  !\f\v \0(¤At\"E\r\0 \f  ü\n\0\0\v \0(¤\"At\"@ \0A¨j A j ü\n\0\0\v \0(\xA0!@ \f AÒðR  \0(¤AÒðR\v@ \0-\0­AF@ \0.ª \0,\0¬! \0(!\b@ \0(\"	A\bF@AÀ©!A\v!@@ \bAk\0\0\vAÝÛ\0AÅ(A6\0\vA©!A!\f\vAð©!A\"!@@ \bAk\0\0\vAÝÛ\0AÅ(A?\0\vA\xA0©!A\f!\v 	AtAu\"\f 	ÁAl\"	 	 \fJ\x1B!\r \f 	 	 \fH\x1B!	  j! \fj!\nA\0!@  Atj 	 \n   lj,\0\0j\"\f \r \f \rJ\x1B 	 \fH\x1B6\0 Aj\" \bG\r\0\v \0(\"\bA\0J@ \0,\0°AtA°j(\0!	 Aà\0j!\r \0Aj!\nA\0!@ \r A\nlj\" 	  \nj,\0\0Alj\"\f,\0\0A\x07t;\0  \f,\0A\x07t;  \f,\0A\x07t;  \f,\0A\x07t;  \f,\0A\x07t;\b Aj\" \bG\r\0\v\v \0,\0±AtAj.\0!\f\vA\0! \0(At\"@ A\0 ü\v\0\v \0(A\nl\"@ Aà\0jA\0 ü\v\0\v \0A\0:\0°\v  6 A@k$\0#\0A\xA0k\"!\b $\0  \0(\xA0\"AtAjApqk\"\"$\0   \0(\"jAtAjApqk\"\"$\0  \0(AtAjApqk\"\f$\0 \0,\0¯! A\0J@ \0,\0­AtA|qAj \0,\0®Atj.\0At!\r \0Aj!\n \0,\0²!	@ \n \x07AtjA\0  \x07Atj.\0\"At\"A\nk A\nr  A\0H\x1B A\0J\x1B \rj\"k  	AµÎÝ\0lAëÆå°j\"A\0H\x1B6\0  j!	 \x07Aj\"\x07 \0(H\r\0\v\v \b \0)¼\n78 \b \0)´\n70 \b \0)¬\n7( \b \0)¤\n7  \b \0)\n7 \b \0)\n7 \b \0)\n7\b \b \0)\n7\0@@@ \0(A\0J@ \0AÄ\nj! Aj!& Aà\0j!' A j!( \0Aj! \0(\xA0! AH!)A\0!\r !@ ( \rAtA`qj! \0(¤At\"@ \bAj  ü\n\0\0\vA\0 & \rAt\"j(\0\"  Au\"s k\"\ng\"\x07Akt\"AÿÿqAÿÿÿÿ Au\"	m\"Á\"lAu  	ljAtk\"	 AuAjAul Atj 	Au lj 	Aøÿq lAuj! \0-\0­! \nAÿÿ\x07M@Aÿÿÿÿ\x07 \x07Ak\"	v\"\n Ax 	u\"  J\x1B  \nJ\x1B 	t\f\v  \x07Asu\v!A!	 \0(\0\"\n G@ \n \n \nAu\"	s 	kg\"\nAkt\"	 	Au l 	Aÿÿq lAuj\"	¬ ¬~B§Axqk\"Au l 	j Aÿÿq lAuj! \n \x07k\"\x07ArL@Aÿÿÿÿ\x07As \x07k\"\x07v\"	 Ax \x07u\"\n  \nJ\x1B  	J\x1B \x07t\f\v  \x07A\rjuA\0 \x07AH\x1B\v\"	Aÿÿq! 	Au!\nA\0!\x07@ \b \x07Atj\" (\0\"Á\" lAu \n lj AuAjAu 	lj6\0 \x07Aj\"\x07AG\r\0\v\v ' \rA\nlj!\n \0 6\0@@@@@ \0(\xA0!E\r\0 \0(¤!AG\r\0 AF\r\0 \rAK\r\0 \nB\x007\0 \nA\0;\b \nA ;  j \0(\"6\0\f\v AG\r  j(\0!\v@A\0 \r ) \rAF\"q\x1BE@ \0(\xA0\"  \0(¤\"	jk\"AL\r\x07 \0(!\x07  Ak\"At\"j  j  \x07At\"\x07@  Atj  \x07ü\n\0\0\v \0(¤!	 \0(\xA0! \0( \x07\v \rlAtj   k 	6 \rE@ .\"\x07 AÿÿqlAu \x07 AuljAt!\v AH\r Aÿÿq!	 Au!  Atj!  \0(\xA0Atj!@ AF@A\0!\x07\f\v Aq A~q!A\0!A\0!\x07@  \x07As\"Atj 	  Atj.\0\"lAu  lj6\0  \x07A~s\"Atj 	  Atj.\0\"lAu  lj6\0 \x07Aj!\x07  F Aj!E\r\0\vE\r\v  \x07As\"Atj 	  Atj.\0\"lAu  lj6\0\f\v 	AF\r\0 AH\r\0 Aj! 	Aÿÿq! 	Au!  Atj!A\0!\x07@  \x07AsAtj\" (\0\"Á\" lAu  lj AuAjAu 	lj6\0  \x07F \x07Aj!\x07E\r\0\v\v \0(\"	A\0L\r   kAtjA\bj!\x07 \n.\b! \n.! \n.! \n.! \n.\0!\nA\0!@ \f At\"j  j(\0 \x07(\0\"Au \nl Aÿÿq \nlAuj \x07Ak(\0\"Au lj Aÿÿq lAuj \x07A\bk(\0\"Au lj Aÿÿq lAuj \x07A\fk(\0\"Au lj Aÿÿq lAuj \x07Ak(\0\"Au lj Aÿÿq lAujAtjAj\"6\0  Atj At6\0 Aj! \x07Aj!\x07 Aj\" 	G\r\0\v \f!\f\v ! \0(\"	A\0L\r\v@ \0(¤\"\nA\nk\x07\0\0\v A\ntAu! \nAv!* AuAjAu!+ \b.! \b.! \b.! \b.! \b.! \b.!\x1B \b.! \b.! \b.! \b.! \b.!  \b.!! \b.!\" \b.!# \b.!$ \b.!%A\0! \b(<!@ Au %l *j Aÿÿq %lAuj \b At\"j\"\x07(8\"Au $lj Aÿÿq $lAuj \x07(4\"Au #lj Aÿÿq #lAuj \x07(0\"Au \"lj Aÿÿq \"lAuj \x07(,\"Au !lj Aÿÿq !lAuj \x07((\"Au  lj Aÿÿq  lAuj \x07($\"Au lj Aÿÿq lAuj \x07( \"Au lj Aÿÿq lAuj \x07(\"Au lj Aÿÿq lAuj \x07(\"Au lj Aÿÿq lAuj! \x07 \nAF@  \x07(\",Au \x1Blj ,Aÿÿq \x1BlAuj \x07(\"Au lj Aÿÿq lAuj \x07(\f\"Au lj Aÿÿq lAuj \x07(\b\"Au lj Aÿÿq lAuj \x07(\"Au lj Aÿÿq lAuj \x07(\0\"Au lj Aÿÿq lAuj!\vAÿÿÿ?A@  A@L\x1B\" Aÿÿÿ?N\x1BAt\"  j(\0\"\x07j\"A\0N@Ax   \x07qAqH\x1B\f\vAÿÿÿÿ\x07   \x07rA\0N\x1B\v\"6@  AtjAÿÿA~ Au l  +lj Aÿÿq lAujA\x07uAjAu\"\x07 \x07A~L\x1B\"\x07 \x07AÿÿN\x1B;\0 Aj\" 	G\r\0\v\v \b \b 	At\"j\")878 \b )070 \b )(7( \b ) 7  \b )7 \b )7 \b )\b7\b \b )\x007\0  	Atj!  j! \rAj\"\r \0(H\r\0\v\v \0A\nj\" \b)878  \b)070  \b)(7(  \b) 7   \b)7  \b)7  \b)\b7\b  \b)\x007\0 \bA\xA0j$\0\f\vAÿå\0Aå*A\0\vA³Ð\0Aå*AÍ\0\v \0(\xA0\" \0(\"H\r \0AÄ\nj!  kAt\"@   Atj ü\n\0\0\v \0(At\"@  j  ü\n\0\0\v \0  A\0 \0A\x006\xA0! \0 \0,\0­\"6¤! AO\r \0A\x006È\f\v \0  A \0(\xA0\" \0(\"H\r \0AÄ\nj!  kAt\"@   Atj ü\n\0\0\v \0(At\"E\r\0  j  ü\n\0\0\vA\0!A\0!\bA\0!#\0A k\"\f$\0 \0(\"\n \0(!G@Aÿÿ \0(¤\"Ajm!@ A\0L\r\0 Aq!	 \0A´ j!\r AO@ Aüÿÿÿ\x07q!A\0!\x07@ \r Atj\"  j\" j\";  ;\0   j\";   j\"; Aj! \x07Aj\"\x07 G\r\0\v 	E\r\v@ \r Atj  j\";\0 Aj! \bAj\"\b 	G\r\0\v\v \0 \n6! \0B7!\v \v! \0A´j!	@@ \0(\xA0!E@@ \0(¤!\r\0@ \0(¤\"A\0L\r\0 \0A´ j!\v \0A¨j!\bA\0! AG@ Aq Aþÿÿÿ\x07q!\rA\0!@ \v At\"j\"\n \n.\0\"\n  \bj.\0 \nk\"\nAÿÿqAÜÿ\0lAv \nAvAÜÿ\0ljj;\0 \v Ar\"j\"\n \n.\0\"\n  \bj.\0 \nk\"AÿÿqAÜÿ\0lAv AvAÜÿ\0ljj;\0 Aj! Aj\" \rG\r\0\vE\r\v \v At\"j\" .\0\"  \bj.\0 k\"AÿÿqAÜÿ\0lAv AvAÜÿ\0ljj;\0\v@ \0(\"\rA\0L@A\0!\b\f\v \rAq!\n Aj!\vA\0!A\0!A\0!\bA\0! \rAO@ \rAüÿÿÿ\x07q!A\0!\x07@ \v Ar\"Atj(\0\" \v Ar\"Atj(\0\" \v Ar\"Atj(\0\" \v Atj(\0\"   H\"\x1B\"  H\"\x1B\"  H\"\x1B\"  H\"\x1B!     \b \x1B \x1B \x1B \x1B!\b Aj! \x07Aj\"\x07 G\r\0\v \nE\r\v@ \v Atj(\0\"\x07   \x07H\"\x07\x1B!  \b \x07\x1B!\b Aj! Aj\" \nG\r\0\v\v \0(\" \rAtAkl\"@ 	 Atj 	 ü\n\0\0\v \0(\"At\"@ 	 \0  \blAtjAj ü\n\0\0\v \0(\"A\0L\r\0 Aj!\b \0(!!A\0!@ \0  \b Atj\"\v(\0 k\"\x07AuA$lj \x07AÿÿqA$lAvj\"6! \v(\0\"\v AuA¼ê~l j AÿÿqA¼ê~lAujH@ \0 \v6! \v!\v Aj\" G\r\0\v\v \0(\xA0!E\r\v \f AtAÏ\0jApqk\"\v$\0 \0(ø!\"Á\" \0/ä!\"lAu  Á\"Aulj AuAjAu lj\"Au! \0(!\"AH Aÿÿÿ\0LqE@A\0 Au\" l  lAtk\"A\0L\r@ g\"AF\r\0 Aÿ\0M@  Akt!\f\v  A\bjt A kvj!\v Aÿ\0qAÕlArAAé Aq\x1B AvvlA|q\f\vA\0 Á\"\b Aul Á\"\x07 AÿÿqlAu  \x07lj AuAjAv ljAtk \b AÿÿqlAuj AuAjAu lj\"A\0L\r\0@ g\"AF\r\0 Aÿ\0M@  Akt!\f\v  A\bjt A kvj!\vAAé Aq\x1B Avv\" Aÿ\0qlAÕlAv jA\bt\v!\x07Aÿ!@ \"Av!  H\r\0\v \0(!!@ E\r\0 \vA@k!\rA\0! AG@ Aq A~q!A\0!\b@ \r Atj\" 	 AµÎÝ\0lAëÆå°jAv qAtj(\x006\0  	 Aùå£{lAî¶Ãk\"Av qAtj(\x006 Aj! \bAj\"\b G\r\0\vE\r\v \r Atj 	 AµÎÝ\0lAëÆå°j\"Av qAtj(\x006\0\v \0 6! \0(¨! \f \0A´ j \0(¤! \v \0)!78 \v \0)!70 \v \0)ü 7( \v \0)ô 7  \v \0)ì 7 \v \0)ä 7 \v \0)Ü 7\b \v \0)Ô 7\0@@ \0(¤\"\bA\nk\x07\0\0\0\0\0\0\vA³Ð\0A×;A\0\v @ \bAv! \x07A\ntAu!	 \x07AuAjAu! \v(<! \f.!\x07 \f.!\r \f.!\n \f.! \f.! \f.! \f.! \f.! \f.! \f.\f! \f.\n! \f.\b! \f.! \f.! \f.!\x1B \f.\0!A\0!@ Au l j Aÿÿq lAuj \v Atj\"(8\"Au \x1Blj Aÿÿq \x1BlAuj (4\"Au lj Aÿÿq lAuj (0\"Au lj Aÿÿq lAuj (,\"Au lj Aÿÿq lAuj ((\"Au lj Aÿÿq lAuj ($\"Au lj Aÿÿq lAuj ( \"Au lj Aÿÿq lAuj (\"Au lj Aÿÿq lAuj (\"Au lj Aÿÿq lAuj!  \bAF@  (\"Au lj Aÿÿq lAuj (\"Au lj Aÿÿq lAuj (\f\"Au lj Aÿÿq lAuj (\b\"Au \nlj Aÿÿq \nlAuj (\"Au \rlj Aÿÿq \rlAuj (\0\"Au \x07lj Aÿÿq \x07lAuj!\vAÿÿÿ?A@  A@L\x1B\" Aÿÿÿ?N\x1BAt\" (@\"j\"A\0N@Ax   qAqH\x1B\f\vAÿÿÿÿ\x07   rA\0N\x1B\v\"6@Aÿÿ  Atj\".\0AÿÿA~ Au 	l  lj Aÿÿq 	lAujA\x07uAjAu\" A~L\x1B\" AÿÿN\x1Bj\"AÿÿJ\r\0A A~H\r\0 \v!  ;\0 Aj\" G\r\0\v\v \0AÔ j\" \v Atj\")878  )070  )(7(  ) 7   )7  )7  )\b7\b  )\x007\0\f\v \0(¤At\"E\r\0 \0AÔ jA\0 ü\v\0\v \fA j$\0#\0Ak\"$\0@ \0(\xA0!@ \0Aè!j \0Aì!j    \0A6Ü!\f\v@ \0(Ü!E\r\0 A\bj A\fj    (\f\" \0(ì!\"\vJ@ \0 \0(è!  \vku6è! (\b\f\v (\b\"  \vN\r\0  \v ku\v!  \0(è!\"\vL\r\0 \0 \v \vg\"\vAkt\"\b6è!A\0!\fA\0! \bA A \vk\"A\0 A\0J\x1Bu\" AL\x1Bm\"A\0J@@ g\"\vAF\r\0 Aÿ\0M@  \vAkt!\f\v  \vA\bjt A \vkvj!\vAAé \vAq\x1B \vAvv\"\v Aÿ\0qlAÕlAv \vjAt!\vA k m A\0L\r\0At!@  \fAtj\"\v \v.\0\"\v AüÿqlAv Av \vlj;\0  j\"AJ\r \fAj\"\f G\r\0\v\v \0A\x006Ü!\v Aj$\0 \0  \0(AtjAk(\x006  6\0 Aj$\0A\0\vAäÉ\0A°+AÄ\0\0\vAA°+Aè\0\0\vAÙ\0A°+Aÿ\0\0\vAA°+A\0\v¶\b#\0AÐ\0k\"$\0 A j A@k  ,\0\03 .\"A\0J@ .!\x07 !@  Ak\"\bAtj  j,\0\0\"A\nt\"\nAæ\0k \nAæ\0r Auq A\0J\x1B\"Au \x07l A@k \bj-\0\0 	ÁlA\buj Aþÿq \x07lAuj\"	;\0 AK \b!\r\0\v ,\0\0 l\" (\bj!\b (\f Atj!\x07A\0!@ \0 At\"jAÿÿ  j.\0At  \x07j.\0m  \bj-\0\0A\x07tj\"A\0 A\0J\x1B\" AÿÿN\x1B;\0 Aj\" .\"H\r\0\v\v \0 ($ q AÐ\0j$\0\vVAA \0gkAu\"t!@ \0A\0 At j t\" \0 I\"\x1Bk!\0A\0  \x1B j! A\0J Av! Ak!\r\0\v \vÜ\n Ak\"A~q! Aq!  At\"j!\f \0 jAk!\v AH!@@@ \0.\0 .\0\"\x07k!@ @A\0!\f\vA\0!A!A\0! AG@@ \0 Aj\"	At\"\bj.\0 \0 At\"\nj\"\r.\0\"  \bj.\0jk\"\b  \rAk.\0  \nj.\0jk\"\n   \nJ\"\n\x1B\"  \bJ\"\b\x1B! 	   \n\x1B \b\x1B! Aj! Aj\" G\r\0\v E\r\v \0 At\"j\"	.\0 	Ak.\0  j.\0jk\"   J\"\x1B!   \x1B!\vA \f.\0\" \v.\0jk\"   J\"\x1BA\0N\r@   \x1B\"E@ \0 \x07;\0\f\v  G@@ A\0L@A\0!\f\v Aq!	A\0!A\0!A\0! AO@ Aüÿÿÿ\x07q!\nA\0!\b@   Atj\"\x07.\0j \x07.j \x07.j \x07.j! Aj! \bAj\"\b \nG\r\0\v 	E\r\v@   Atj.\0j! Aj! Aj\" 	G\r\0\v\v   At\"\nj\"\r.\0Au\"	j!\x07A!@  L\r\0  k\"Aq!\b  \"kA|M@ A|q!A\0!@   Atj\".\0 Ak.\0j Ak.\0j Ak.\0jk! Ak! Aj\" G\r\0\v \bE\r\vA\0!@   Atj.\0k! Ak! Aj\" \bG\r\0\v\v \0 \nj\"Ak\" \x07  	k\"  \x07H\x1B\"\b .\0 .\0j\"Au Aqj\" \x07   \x07J\x1B\"  H\x1B  \bJ\x1B 	k\";\0   \r/\0j;\0\f\v \vA~ k;\0\v Aj\"AG\r\0\v \0!A!@ A\0J@ AG@@  Atj.\0! !\0@@   \0Ak\"Atj.\0\"\x07N\r  \0Atj \x07;\0 \0AJ !\0\r\0\vA\0!\0\v  \0Atj ;\0 Aj\" G\r\0\v\v\f\vAðç\0A´A\0\v  .\0\"\0 .\0\" \0 J\x1B;\0 AH\r /\0!A!@  At\"\0j\"Aÿÿ \0 j.\0 Áj\"\0AÿÿJ\r\0 .\0\" \0A~H\r\0  \0 \0 H\x1B\v\";\0 Aj\" G\r\0\v \v \v.\0\"\0A \f.\0k\" \0 H\x1B;\0 Ak\"\0! Aq@  \0Atj\" .\0\"  AtAk\"j.\0  j.\0k\"  H\x1B;\0 Ak!\v \0E\r\0@  At\"\0j\" .\0\"  \0Aj\"j.\0  j.\0k\"  H\x1B\";\0  Ak\"Atj\" .\0\" Á \0 j.\0k\"\0 \0 J\x1B;\0 Ak! \r\0\v\v\v \v \v.\0\"\0A \f.\0k\" \0 H\x1B;\0\v\b@@ A\0J@ A\0L\r  I\r A\x07q!	@ A\bO@ Aøÿÿÿ\x07q!\b@  Atj 6\0  Ar\"Atj 6\0  Ar\"Atj 6\0  Ar\"Atj 6\0  Ar\"Atj 6\0  Ar\"Atj 6\0  Ar\"Atj 6\0  A\x07r\"Atj 6\0 A\bj! A\bj\" \bG\r\0\v 	E\r\v@  Atj 6\0 Aj! \x07Aj\"\x07 	G\r\0\v\vA! AG@@ \0 Atj(\0!\x07 !@@ \x07 \0 Ak\"	At\"\bj(\0\"N\r \0 At\"\nj 6\0  \nj  \bj(\x006\0 AJ 	!\r\0\vA\0!\v \0 At\"j \x076\0  j 6\0 Aj\" G\r\0\v\v  J@ Ak!	 \0 AtjAk! AF!\n@ \0 Atj(\0\"\b (\0H@A\0!\x07 	! \0 \nA\0@@ \0 At\"j(\0\"\x07 \bL@ !\f\v \0 Aj\"\vj \x076\0  \vj  j(\x006\0 A\0J Ak\"!\r\v\v Aj\vAt\"j \b6\0  j 6\0\v Aj\" G\r\0\v\v\vAè\0A´A3\0\vAðç\0A´A4\0\vAËÉ\0A´A5\0\v A\0L@A\0\v Aq!@ AO@ Aüÿÿÿ\x07q!@ \"Aj! Aj\" G\r\0\v \0 j\"-\0\0At ,\0A\btj ,\0jA\bt ,\0j! E\r\v@ \0 j,\0\0 A\btj! Aj! Aj\" G\r\0\v\v \v« A\0J@@ A?  rE@ ,\0\0\" ,\0\0Ak\"\x07  \x07J\x1B\f\v  j,\0\0Ak\" ,\0\0\"\x07A\bj\"\bJ@ \x07 At \bkj\f\v  \x07j\vÀ\"A\0 A\0J\x1B\" A?N\x1B\":\0\0 \0 Atj Al Añ8lAvjAªj6\0 Aj\" G\r\0\v\v\vñ A\0J@@  \bAtj\"	(\0\n \0 \bj\"\x07 	(\0\nAtA¨Á\0kAuAËlAv\":\0\0 \x07A?  ,\0\0 ÀJjÀ\"A\0 A\0J\x1B\" A?N\x1B\":\0\0 ,\0\0!@  \brE@ \x07A? Ak\"\x07   \x07H\x1B AÃ\0J\x1B\":\0\0  :\0\0\f\v \x07  k\":\0\0 \x07A$A| À\"\n ,\0\0\"kAùjAv A\bj\"j   \nH\x1BÀ\" A|L\x1B\" A$N\x1B\":\0\0   H@A? -\0\0 At kjÀ\" A?N\x1B\f\v -\0\0 j\v:\0\0 \x07 \x07-\0\0Aj:\0\0 -\0\0!\v 	AÕ À\"\x07Añ8lAu \x07Alj\"\x07 \x07AÕN\x1BAªj6\0 \bAj\"\b G\r\0\v\v\vï\x07@@Aÿÿÿÿ\x07 \0(\"g\"v\" \0( \"jAx uq\" r  jO@Aÿÿÿÿ v jA| uq! Aj!\f\v \r\0\f\v@@ Av\"AÿG@ Av! \0((\"A\0N@A! \0 \0( \0(\"\x07 \0(\bjK \0 \x07Aj6 \0(\0 \x07j  j:\0\0A\0A\v \0(,r6,\v \0($\"@ Ak!@A! \0 \0( \0(\"\x07 \0(\bjK \0 \x07Aj6 \0(\0 \x07j :\0\0A\0! \0($ \vAk\"6$ \0 \0(, r6, \r\0\v\v \0 Aÿq6(\f\v \0 \0($Aj6$\v A\btAþÿÿ\x07q! A\bJ A\bk\"\x07!\r\0\v\vA!@@@ \0((\"A\0H@ \0($\"\r\f\v \0 \0( \0(\" \0(\bjK \0 Aj6 \0(\0 j :\0\0A\0A\v \0(,r6, \0($\"E\r\v@A! \0 \0( \0(\" \0(\bjK \0 Aj6 \0(\0 jAÿ:\0\0A\0! \0($ \vAk\"6$ \0 \0(, r6, \r\0\v\v \0A\x006(\v \0(\f!@ \0(\"A\x07L@ \0(,!\f\v !@A! \0 \0(\" \0(\b\" \0(jK \0 Aj\"6\b \0(\0  kj :\0\0A\0A\v \0(,r\"6, A\bv! AJ A\bk\"!\r\0\v\v@ \r\0@ \0(\0\"E\r\0 \0( \0(\" \0(\bjk\"E\r\0  jA\0 ü\v\0\v A\0L\r\0 \0(\b\" \0(\"O@ \0A6,\v@ \0( j I\r\0 A\0 \x07k\"L\r\0 \0A6, A tAsq!\v \0(\0 j Asj\"\0 \0-\0\0 r:\0\0\v\v \0(\b\"A\0J@  AtjAk!\x07 \0(h!\b \0( \"	.\0!@  Atj \b  \x07lj j-\0\0A@k 	 Aj\"Atj.\0\" Ák t llAu6\0 !  \0(\b\"H\r\0\v\v\vE\0 \0B7 \0B7 \0B\x007\b \0 6\0 \0B\x007  \0Bÿÿÿÿ7( \0 6\v\0  \0AÙA\b\b6\0\v+ \0 \0( n\"6$ \0(  nAs j\"\0A\0 \0 M\x1B\vú \0B7 \0B7 \0B\x007\b \0 6 \0 6\0 @ \0A6 -\0\0!A!\v \0A\x006, \0 6( \0A6 \0A6 \0 AvAÿ\0s\"6 @  M@ !\f\v \0 Aj\"6  j-\0\0!\x07\v \0 \x076( \0A6 \0A6 \0 \x07 A\btrAvAÿq A\btrAÿs\"\b6 A\0! \0  M@ !A\0\f\v \0 Aj\"6  j-\0\0\v\"6( \0Ax6 \0A!6 \0  \x07A\btrAvAÿq \bA\btrAÿs\"6   K@ \0 Aj6  j-\0\0!\v \0 6( \0  A\btrAvAÿq A\btrAÿs6 \vÀ#\0\"\x07 \0Aj! \x07 \0(ô\"\b \0(ì\"jAtAjApqk\"\f$\0 \bAt\"\x07@ \f  \x07ü\n\0\0\v \0(\"\x07Aj! \0(ð! \x07!@ \0 \f \bAtj      H\x1B\"~ At!\r@@@@@ \0(ô\"Ak\0\v \rA\0L\r \0(ø\"Á!A\0!@ AÿÿA~  Aÿÿq lAu\"\nAlj\".\0\"	 \f AuAtj\"\b(\0\"\vAÿÿqlAu \vAu 	lj .\"	 \b(\"\vAulj \vAÿÿq 	lAuj .\"	 \b(\b\"\vAulj \vAÿÿq 	lAuj .\"	 \b(\f\"\vAulj \vAÿÿq 	lAuj .\b\"	 \b(\"\vAulj \vAÿÿq 	lAuj .\n\"	 \b(\"\vAulj \vAÿÿq 	lAuj .\f\"	 \b(\"\vAulj \vAÿÿq 	lAuj .\"	 \b(\"\vAulj \vAÿÿq 	lAuj .\" \b( \"	Aulj 	Aÿÿq lAuj   \nAsjAlj\".\0\"\n \b(D\"	Aulj 	Aÿÿq \nlAuj .\"\n \b(@\"	Aulj 	Aÿÿq \nlAuj .\"\n \b(<\"	Aulj 	Aÿÿq \nlAuj .\"\n \b(8\"	Aulj 	Aÿÿq \nlAuj .\b\"\n \b(4\"	Aulj 	Aÿÿq \nlAuj .\n\"\n \b(0\"	Aulj 	Aÿÿq \nlAuj .\f\"\n \b(,\"	Aulj 	Aÿÿq \nlAuj .\"\n \b((\"	Aulj 	Aÿÿq \nlAuj .\" \b($\"\bAulj \bAÿÿq lAujAuAjAu\"\b \bA~L\x1B\"\b \bAÿÿN\x1B;\0 Aj!  j\" \rH\r\0\v\f\vA\0!\b \rA\0L\r@ AÿÿA~ \x07.\" \f \bAuAtj\"(\\ (\0j\"AÿÿqlAu Au lj \x07.\" (X (j\"Aulj Aÿÿq lAuj \x07.\b\" (T (\bj\"Aulj Aÿÿq lAuj \x07.\n\" (P (\fj\"Aulj Aÿÿq lAuj \x07.\f\" (L (j\"Aulj Aÿÿq lAuj \x07.\" (H (j\"Aulj Aÿÿq lAuj \x07.\" (D (j\"Aulj Aÿÿq lAuj \x07.\" (@ (j\"Aulj Aÿÿq lAuj \x07.\" (< ( j\"Aulj Aÿÿq lAuj \x07.\" (8 ($j\"Aulj Aÿÿq lAuj \x07.\" (4 ((j\"Aulj Aÿÿq lAuj \x07.\" (0 (,j\"Aulj Aÿÿq lAujAuAjAu\" A~L\x1B\" AÿÿN\x1B;\0 Aj! \b j\"\b \rH\r\0\v\f\vAÿï\0A¢1A\0\vA\0!\b \rA\0L\r\0@ AÿÿA~ \x07.\" \f \bAuAtj\"( (\0j\"AÿÿqlAu Au lj \x07.\" ( (j\"Aulj Aÿÿq lAuj \x07.\b\" ( (\bj\"Aulj Aÿÿq lAuj \x07.\n\" ( (\fj\"Aulj Aÿÿq lAuj \x07.\f\" (| (j\"Aulj Aÿÿq lAuj \x07.\" (x (j\"Aulj Aÿÿq lAuj \x07.\" (t (j\"Aulj Aÿÿq lAuj \x07.\" (p (j\"Aulj Aÿÿq lAuj \x07.\" (l ( j\"Aulj Aÿÿq lAuj \x07.\" (h ($j\"Aulj Aÿÿq lAuj \x07.\" (d ((j\"Aulj Aÿÿq lAuj \x07.\" (` (,j\"Aulj Aÿÿq lAuj \x07.\" (\\ (0j\"Aulj Aÿÿq lAuj \x07.\" (X (4j\"Aulj Aÿÿq lAuj \x07. \" (T (8j\"Aulj Aÿÿq lAuj \x07.\"\" (P (<j\"Aulj Aÿÿq lAuj \x07.$\" (L (@j\"Aulj Aÿÿq lAuj \x07.&\" (H (Dj\"Aulj Aÿÿq lAujAuAjAu\" A~L\x1B\" AÿÿN\x1B;\0 Aj! \b j\"\b \rH\r\0\v\v  k\"AN@ At\"@ \f \f Atj ü\n\0\0\v  Atj! \0(! \0(ô!\b \0(ì!\f\v\v At\"\0@  \f Atj \0ü\n\0\0\v$\0\v_\0@@@ \0Aÿü\0L@ \0AÀ>F\r \0AàÝ\0G\rA\v \0Aý\0F\rA \0A÷F\r \0AÀ»G\rA\vA\vAÿï\0AøA×\0\0\vA\v\v A\0J@ \0(\0! .! .\0!\x07A\0!@  Atj  Atj.\0A\bt j\"6\0 \0(!\b \0 At\"Aüÿq\"	 lAu Au\" lj6 \0 \b  \x07lj \x07 	lAuj\"6\0 Aj\" G\r\0\v\v\v/\0@ Aÿ\0M\r\0 AqA¿F\r\0A\xA0ÛA6\0A\v \0 :\0\0A\v®\0@@@@@@@@@@ A	k\0\x07\b	\x07\b	\b		\x07\b\v  (\0\"Aj6\0 \0 (\x006\0\v  (\0\"Aj6\0 \0 2\x007\0\v  (\0\"Aj6\0 \0 3\x007\0\v  (\0\"Aj6\0 \0 0\0\x007\0\v  (\0\"Aj6\0 \0 1\0\x007\0\v  (\0A\x07jAxq\"A\bj6\0 \0 +\x009\0\v\v  (\0\"Aj6\0 \0 4\x007\0\v  (\0\"Aj6\0 \0 5\x007\0\v  (\0A\x07jAxq\"A\bj6\0 \0 )\x007\0\vo \0(\0\",\0\0A0k\"A	K@A\0\v@A! AÌ³æ\0M@A  A\nl\"j  Aÿÿÿÿ\x07sK\x1B!\v \0 Aj\"6\0 ,\0 ! !A0k\"A\nI\r\0\v \v\v#\0\"  \0(ì\"AtAjApqk\"$\0  \0) 7\b  \0)7\0 Aj!\v \0(ð!\f@ \0 \v     H\x1B\"LA\0!\b At\"\rA\0J@@ AÿÿA~ \bAÿÿqA\flAv\"	At\"Aû\0j\"\x07.  \bAuAtj\".l .{ .\0lj \x07. .lj \x07. .ljA\v 	kAt\"	Aû\0j\"\x07. .\blj \x07. .\nlj \x07. .\flj 	.{ .ljAuAjAu\" A~L\x1B\" AÿÿN\x1B;\0 Aj! \b \fj\"\b \rH\r\0\v\v  k\"A\0J@   Atj\")\b7\b  )\x007\0  Atj! \0(ì!\f\v\v \0  Atj\")\b7  \0 )\x007$\0\v~Aýô\0!#\0A@j\"\x07$\0 \x07Aýô\x006< \x07A)j! \x07A'j! \x07A(j!@@@@@A\0!@ !\n  \fAÿÿÿÿ\x07sJ\r  \fj!\f@@@@ \"-\0\0\"@@@@ Aÿq\"E@ !\f\v A%G\r !@ -\0A%G@ !\f\v Aj! -\0 Aj\"!A%F\r\0\v\v  \nk\" \fAÿÿÿÿ\x07s\"J\r	 \0@ \0 \n \v \r\x07 \x07 6< Aj!A!@ ,\0A0k\"A	K\r\0 -\0A$G\r\0 Aj!A! !\v \x07 6<A\0!\b@ ,\0\0\"\vA k\"AK@ !\f\v !A t\"AÑqE\r\0@ \x07 Aj\"6<  \br!\b ,\0\"\vA k\"A O\r !A t\"AÑq\r\0\v\v@ \vA*F@@ ,\0A0k\"A	K\r\0 -\0A$G\r\0 \0E@  AtjA\n6\0A\0\f\v  Atj(\0\v!\r Aj!A\f\v \r Aj! \0E@ \x07 6<A\0!A\0!\r\f\v  (\0\"Aj6\0 (\0!\rA\0\v! \x07 6< \rA\0N\rA\0 \rk!\r \bAÀ\0r!\b\f\v \x07A<j\"\rA\0H\r\n \x07(<!\vA\0!A!	A\0 -\0\0A.G\r\0 -\0A*F@@ ,\0A0k\"A	K\r\0 -\0A$G\r\0 Aj! \0E@  AtjA\n6\0A\0\f\v  Atj(\0\v\f\v \r Aj!A\0 \0E\r\0  (\0\"Aj6\0 (\0\v!	 \x07 6< 	A\0N\f\v \x07 Aj6< \x07A<j!	 \x07(<!A\v!@ !A! \",\0\0\"Aû\0kAFI\r\v Aj! A:l jAßÓj-\0\0\"AkAÿqA\bI\r\0\v \x07 6<@ A\x1BG@ E\r\f A\0N@ \0E@  Atj 6\0\f\f\v \x07  Atj)\x0070\f\v \0E\r\b \x07A0j  \f\v A\0N\r\vA\0! \0E\r\b\v \0-\0\0A q\r\v \bAÿÿ{q\"\v \b \bAÀ\0q\x1B!\bA\0!AÙ\v! !@ \0A  \r@@@@@@@@@@@@@ -\0\0\"À\"ASq  AqAF\x1B  \x1B\"AØ\0k!	\n\0\v@ AÁ\0k\x07\v\0\v AÓ\0F\r\v\f\v \x07)0!AÙ\v\f\vA\0!@@@@@@@ \b\0\v \x07(0 \f6\0\f\x1B\v \x07(0 \f6\0\f\v \x07(0 \f¬7\0\f\v \x07(0 \f;\0\f\v \x07(0 \f:\0\0\f\v \x07(0 \f6\0\f\v \x07(0 \f¬7\0\f\vA\b 	 	A\bM\x1B!	 \bA\br!\bAø\0!\v !\n \x07)0\"\"B\0R@ A q!@ \nAk\"\n §Aq-\0ð× r:\0\0 B\"B\0R\r\0\v\v P\r \bA\bqE\r AvAÙ\vj!A!\f\v ! \x07)0\"\"B\0R@@ Ak\" §A\x07qA0r:\0\0 B\"B\0R\r\0\v\v !\n \bA\bqE\r 	  k\"  	H\x1B!	\f\v \x07)0\"B\0S@ \x07B\0 }\"70A!AÙ\v\f\v \bAq@A!AÚ\v\f\vAÛ\vAÙ\v \bAq\"\x1B\v! ! \"BZ@@ Ak\" \" B\n\"Bö~|§A0r:\0\0 BÿÿÿÿV\r\0\v\v B\0R@ §!\n@ Ak\" \nA\nn\"Aöl \njA0r:\0\0 \nA	K !\n\r\0\v\v !\n\v  	A\0Hq\r \bAÿÿ{q \b \x1B!\b@ B\0R\r\0 	\r\0 !\nA\0!	\f\v 	 P  \nkj\"  	H\x1B!	\f\r\v \x07-\x000!\f\v\vAÿÿÿÿ\x07 	 	Aÿÿÿÿ\x07O\x1B\"\"A\0G!@@@ \x07(0\"\nA·ð\0 \n\x1B\"\n\"\bAqE\r\0 E\r\0@ \b-\0\0E\r Ak\"A\0G! \bAj\"\bAqE\r \r\0\v\v E\r@ \b-\0\0E\r\0 AI\r\0@A\b \b(\0\"k rAxqAxG\r \bAj!\b Ak\"AK\r\0\v\v E\r\v@ \b \b-\0\0E\r \bAj!\b Ak\"\r\0\v\vA\0\v\" \nk  \x1B\" \nj! 	A\0N@ \v!\b !	\f\f\v \v!\b !	 -\0\0\r\f\v\v \x07)0\"B\0R\rA\0!\f	\v 	@ \x07(0\f\v \0A  \rA\0 \bA\0\f\v \x07A\x006\f \x07 >\b \x07 \x07A\bj\"\n60A!	 \n\v!\nA\0! \n!@@ (\0\"\vE\r\0 \x07Aj \v\"\vA\0H\r \v 	 kK\r\0 Aj!  \vj\" 	I\r\v\vA=! A\0H\r\f \0A  \r  \bA\0\" E\r\0@@ \n(\0\"\vE\r\0 \x07Aj\"	 \v\"\v j\" K\r\0 \0 	 \v \nAj!\n  K\r\v\v \v\"\n \bAÀ\0s \r \n \n \rH\x1B!\f\b\v  	A\0Hq\r	A=! \x07+0\0\v -\0! Aj!\f\0\v\0\v \0\r	 E\rA!@  Atj(\0\"\0@  Atj \0 A!\f Aj\"A\nG\r\f\v\v\v A\nO@A!\f\f\n\v@  Atj(\0\rA!\f Aj\"A\nG\r\0\v\f	\vA!\f\v \x07 :\0'A!	 !\n \v!\b\v 	  \nk\"\v 	 \vJ\x1B\" Aÿÿÿÿ\x07sJ\rA=! \r  j\"	 	 \rH\x1B\" K\r \0A   	 \b \0   \0A0  	 \bAs \0A0  \vA\0 \0 \n \v \0A   	 \bAÀ\0s \x07(<!\f\v\v\vA\0!\f\f\vA=!\vA\xA0Û 6\0\vA!\f\v \x07A@k$\0 \f\v{| \0 \0¢\"  ¢¢ D|ÕÏZ:Ùå=¢Dë+æåZ¾\xA0¢  D}þ±WãÇ>¢DÕaÁ\xA0*¿\xA0¢D¦ø?\xA0\xA0! \0  D\0\0\0\0\0\0à?¢ \0 ¢\"\0 ¢¡¢ ¡ \0DIUUUUUÅ?¢\xA0¡\v|~#\0Ak\"$\0| \0½B §Aÿÿÿÿ\x07q\"AûÃ¤ÿM@D\0\0\0\0\0\0ð? AÁòI\r \0D\0\0\0\0\0\0\0\0J\f\v \0 \0¡ AÀÿ\x07O\r\0#\0A0k\"	$\0@@@ \0½\"B §\"Aÿÿÿÿ\x07q\"AúÔ½M@ Aÿÿ?qAûÃ$F\r Aü²M@ B\0Y@  \0D\0\0@Tû!ù¿\xA0\"\0D1cba´Ð½\xA0\"9\0  \0 ¡D1cba´Ð½\xA09\bA!\f\v  \0D\0\0@Tû!ù?\xA0\"\0D1cba´Ð=\xA0\"9\0  \0 ¡D1cba´Ð=\xA09\bA!\f\v B\0Y@  \0D\0\0@Tû!	À\xA0\"\0D1cba´à½\xA0\"9\0  \0 ¡D1cba´à½\xA09\bA!\f\v  \0D\0\0@Tû!	@\xA0\"\0D1cba´à=\xA0\"9\0  \0 ¡D1cba´à=\xA09\bA~!\f\v A»ñM@ A¼û×M@ Aü²ËF\r B\0Y@  \0D\0\x000|ÙÀ\xA0\"\0DÊ§é½\xA0\"9\0  \0 ¡DÊ§é½\xA09\bA!\f\v  \0D\0\x000|Ù@\xA0\"\0DÊ§é=\xA0\"9\0  \0 ¡DÊ§é=\xA09\bA}!\f\v AûÃäF\r B\0Y@  \0D\0\0@Tû!À\xA0\"\0D1cba´ð½\xA0\"9\0  \0 ¡D1cba´ð½\xA09\bA!\f\v  \0D\0\0@Tû!@\xA0\"\0D1cba´ð=\xA0\"9\0  \0 ¡D1cba´ð=\xA09\bA|!\f\v AúÃäK\r\v \0DÈÉm0_ä?¢D\0\0\0\0\0\x008C\xA0D\0\0\0\0\0\x008Ã\xA0\"ü!@ \0 D\0\0@Tû!ù¿¢\xA0\" D1cba´Ð=¢\"¡\"D-DTû!é¿c@ Ak! D\0\0\0\0\0\0ð¿\xA0\"D1cba´Ð=¢! \0 D\0\0@Tû!ù¿¢\xA0!\f\v D-DTû!é?dE\r\0 Aj! D\0\0\0\0\0\0ð?\xA0\"D1cba´Ð=¢! \0 D\0\0@Tû!ù¿¢\xA0!\v   ¡\"9\0@ Av\" ½B4§AÿqkAH\r\0   D\0\0`a´Ð=¢\"¡\"\0 Dsp.£;¢  \0¡ ¡¡\"¡\"9\0  ½B4§AÿqkA2H@ \0!\f\v  \0 D\0\0\0.£;¢\"¡\" DÁI %{9¢ \0 ¡ ¡¡\"¡\"9\0\v   ¡ ¡9\b\f\v AÀÿ\x07O@  \0 \0¡\"\x009\0  \x009\bA\0!\f\v 	Aj\"A\br! Bÿÿÿÿÿÿÿ\x07B°Á\0¿!A!@  ü·\"\x009\0  \0¡D\0\0\0\0\0\0pA¢! A\0! !\r\0\v 	 9 A!@ \"Ak! 	Aj\"\r Atj+\0D\0\0\0\0\0\0\0\0a\r\0\vA\0!#\0A°k\"$\0 AvA\bk\"AkAm\"\x07A\0 \x07A\0J\x1B\"Ahl j!\vAô½(\0\"\x07 Aj\"Ak\"\njA\0N@ \x07 j!  \nk!@ AÀj Atj A\0H|D\0\0\0\0\0\0\0\0 At(¾·\v9\0 Aj! Aj\" G\r\0\v\v \vAk!\bA\0! \x07A\0 \x07A\0J\x1B! A\0L!\f@@ \f@D\0\0\0\0\0\0\0\0!\0\f\v  \nj!A\0!D\0\0\0\0\0\0\0\0!\0@ \r Atj+\0 AÀj  kAtj+\0¢ \0\xA0!\0 Aj\" G\r\0\v\v  Atj \x009\0  F Aj!E\r\0\vA/ \vk!A0 \vk! AtA¾j! \vAH! \x07!@  Atj+\0!\0A\0! ! A\0J@@ Aàj Atj \0D\0\0\0\0\0\0p>¢ü·\"D\0\0\0\0\0\0pÁ¢ \0\xA0ü6\0  AtjA\bk+\0 \xA0!\0 Ak! Aj\" G\r\0\v\v \0 \b5\"\0 \0D\0\0\0\0\0\0À?¢D\0\0\0\0\0\0 À¢\xA0\"\0 \0ü\"\f·¡!\0@@@ E@ At j\" (Ü\"  u\" tk\"6Ü  \fj!\f  u\f\v \b\r At j(ÜAu\v\"\nA\0L\r\f\vA!\n \0D\0\0\0\0\0\0à?f\r\0A\0!\n\f\vA\0!A\0!A! A\0J@@ Aàj Atj\"(\0!@  Aÿÿÿ\x07 E\rA\b\v k6\0A!A\0\f\vA\0!A\v! Aj\" G\r\0\v\v@ \r\0Aÿÿÿ!@@ \bAk\0\vAÿÿÿ!\v At j\" (Ü q6Ü\v \fAj!\f \nAG\r\0D\0\0\0\0\0\0ð? \0¡!\0A!\n \r\0 \0D\0\0\0\0\0\0ð? \b5¡!\0\v@@ \0D\0\0\0\0\0\0\0\0a@A\0! !  \x07L\r@ Aàj Ak\"Atj(\0 r!  \x07J\r\0\v E\r@ \bAk!\b Aàj Ak\"Atj(\0E\r\0\v\f\v@ \0A \vk5\"\0D\0\0\0\0\0\0pAf@ Aàj Atj \0D\0\0\0\0\0\0p>¢ü\"·D\0\0\0\0\0\0pÁ¢ \0\xA0ü6\0 Aj! \v!\b\f\v \0ü!\v Aàj Atj 6\0\vD\0\0\0\0\0\0ð? \b5!\0 A\0N@ !@  \"Atj \0 Aàj Atj(\0·¢9\0 Ak! \0D\0\0\0\0\0\0p>¢!\0 \r\0\v !@@ \x07  k\"  \x07J\x1B\"\bA\0H@D\0\0\0\0\0\0\0\0!\0\f\v  Atj!\vA\0!D\0\0\0\0\0\0\0\0!\0@ At\"\r+ÐÓ \v \rj+\0¢ \0\xA0!\0  \bG Aj!\r\0\v\v A\xA0j Atj \x009\0 A\0J Ak!\r\0\v\vD\0\0\0\0\0\0\0\0!\0 A\0N@ !@ \"Ak! \0 A\xA0j Atj+\0\xA0!\0 \r\0\v\v 	 \0 \0 \n\x1B9\0 +\xA0 \0¡!\0A! A\0J@@ \0 A\xA0j Atj+\0\xA0!\0  G Aj!\r\0\v\v 	 \0 \0 \n\x1B9\b A°j$\0 \fA\x07q\f\vA!@ \"Aj! Aàj \x07 kAtj(\0E\r\0\v  j!@ AÀj  j\"Atj  Aj\"Atj(\0·9\0A\0!D\0\0\0\0\0\0\0\0!\0 A\0J@@ \r Atj+\0 AÀj  kAtj+\0¢ \0\xA0!\0 Aj\" G\r\0\v\v  Atj \x009\0  H\r\0\v !\f\0\v\0\v! 	+\0!\0 B\0S@  \09\0  	+\b9\bA\0 k!\f\v  \x009\0  	+\b9\b\v 	A0j$\0 +\b!\0 +\0!@@@@ AqAk\0\v  \0J\f\v  \0\f\v  \0J\f\v  \0\v Aj$\0\v\0\0\v\0 \0'\v~ \0(\" \0(ü!G@ \0BÀ\x007ô! \0BÀ7\" \0 6ü! \0 \0(A\x07t6¬!\v @#\0A@j\"$\0  \0(\xA0\" \0(jAtAjApqk\"\"$\0  AtAjApqk\"\f$\0  \0(ô!Au6\b  \0(ø!\"Au\"6\f \0(È@ \0B\x007Ò! \0B\x007Ê! \0B\x007Â! \0B\x007º!\v A4j A<j A0j! A8j! \0Aj\"!\n \0(!\b#\0\"!  \0(\"AtAjApqk\"\x07$\0@ A\0J@ (\b\"AuAjAu! \n \bAk lAtj! Á!A\0!@ \x07 AtjAÿÿA~   Atj(\0\"	AÿÿqlAu  	Aulj 	 ljA\bu\"	 	A~L\x1B\"	 	AÿÿN\x1B;\0 Aj\" G\r\0\v \x07 Atj! (\f\"AuAjAu!	 \n \bAk lAtj! Á!\nA\0!@  AtjAÿÿA~ \n  Atj(\0\"\bAÿÿqlAu \n \bAulj \b 	ljA\bu\"\b \bA~L\x1B\"\b \bAÿÿN\x1B;\0 Aj\" G\r\0\v\f\v \x07 Atj!\v \x07        $\0 \0(\"! (4 (8u (0 (<uH@ \0(\" Akl\f\v \0(\" l\v! \0/ä!!\v \0(\xA0!!\x07 \0(¤!!\n \0Aº!j\" \0(¤AñúR \0(¤\"At\"\b@ Aj  \bü\n\0\0\vA \x07 \x07A\0J\x1BAt\"\x07AÎø\0AÒø\0 \nAF\x1Bj.\0!\r \x07AÊø\0j.\0!@ \0(\xA0!\r\0 \0(¤!AF@ \0.ð!AÍA \0/¸! \0/¶! \0/´! \0/°! \0/²!jjjjkÁ\"\x07 \x07AÍL\x1BlAv!\v\f\vAÀ\0A  U\" AL\x1B\" AÀ\0N\x1B\"AtAøÿq \rlAu A\rv \rljAv!\r \0(¤!A!\v\v@ \0(\xA0\"\n  \0(¬!A\x07uAjAu\"jk\"\x07AJ@ \0(à!! \f \x07Ak\"\x07At\"j \0 jAÄ\nj Aj \n \x07k 6A\0 \0(ø!\"  Au\"s k\"g\"Akt\"AÿÿqAÿÿÿÿ Au\"	m\"\bÁ\"lAu  	ljAtk\"	 \bAuAjAul \bAtj 	Au lj 	Aøÿq lAuj! AÿÿM@Aÿÿÿÿ\x07 Ak\"v\"\b Ax u\"	  	J\x1B  \bJ\x1B t\f\v A ku\v! \0(¤\" \x07j\" \0(\xA0\"H@Aÿÿÿÿ  AÿÿÿÿN\x1B\"\x07Aÿÿq! \x07Au!\x07@  Atj  \f Atj.\0\"\blAu \x07 \blj6\0 Aj\" H\r\0\v\v \0(\"A\0J@ A  AL\x1BAtjAk! \0.A$l! \0/¸!! \0/¶!! \0/´!!\f \0/²!!\b \0/°!!	 \0(¬!! \rÁ!\x1B \0(!@@ A\0L@ \vÁ!\x07 Á! Á! \fÁ!\f \bÁ!\b 	Á!	\f\v  \n kAtjA\bj! \vÁ!\x07 Á! Á! \fÁ!\f \bÁ!\b 	Á!	A\0!\r@  \nAtj (\0\"\vAu 	l \vAÿÿq 	lAuj Ak(\0\"\vAu \blj \vAÿÿq \blAuj A\bk(\0\"\vAu \flj \vAÿÿq \flAuj A\fk(\0\"\vAu lj \vAÿÿq lAuj Ak(\0\"\vAu lj \vAÿÿq lAuj  AµÎÝ\0lAëÆå°j\"AvAüqj(\0\"\vAu \x07lj \vAÿÿq \x07lAujAtA\bj6\0 \nAj!\n Aj! \rAj\"\r G\r\0\v\v \0 AuAl j AÿÿqAlAvj\"   H\x1B\"6¬! A\x07uAjAu! \x07 \x1BlAv!\v  lAv!  lAv! \f lAv!\f \b lAv!\b 	 lAv!	 Aj\" G\r\0\v \0 ;¸! \0 ;¶! \0 \f;´! \0 \b;²! \0 	;°!\v  Atj\"A@j\" \0)¼\n78  \0)´\n70  \0)¬\n7(  \0)¤\n7   \0)\n7  \0)\n7  \0)\n7\b  \0)\n7\0 A\nN@ \0(\"\fA\0J@ Aq! Av!\x1B Aþÿÿÿ\x07qA\fk! AuAjAu!  Á!\b .\"!	 . !\r .! .! .! .! .! .! .! .! A\nk!A\0!\x07@  \x07At\"j\"(<\"Au l \x1Bj Aÿÿq lAuj (8\"Au lj Aÿÿq lAuj (4\"Au lj Aÿÿq lAuj (0\"Au lj Aÿÿq lAuj (,\"Au lj Aÿÿq lAuj ((\"Au lj Aÿÿq lAuj ($\"Au lj Aÿÿq lAuj ( \"Au lj Aÿÿq lAuj (\"Au \rlj Aÿÿq \rlAuj (\"Au 	lj Aÿÿq 	lAuj!A\n!A\0!\n@@@ \0\v@  Aj\" Atj.\0\"  \x07 kAtj(<\"!Aulj !Aÿÿq lAuj  \x07 Ar\"kAtj(<\"Au At j.\0\"lj Aÿÿq lAuj! Aj! \n G \nAj!\n\r\0\v E\r\v  Aj Atj.\0\"\n  \x07 kAtj(<\"Aulj Aÿÿq \nlAuj!\v  j\"(\0\"Aÿÿÿ?A@  A@L\x1B\" Aÿÿÿ?N\x1BAt\"j\"\nA\0N@Ax \n  qAqH\x1B\f\vAÿÿÿÿ\x07 \n  rA\0N\x1B\v!  6\0  \x07AtjAÿÿA~ Au \bl   lj Aÿÿq \blAujA\x07uAjAu\" A~L\x1B\" AÿÿN\x1B;\0 \x07Aj\"\x07 \fG\r\0\v\v \0A\nj\"  \fAtj\")878  )070  )(7(  ) 7   )7  )7  )\b7\b  )\x007\0 \0 \v;ä! \0 6à!  6\f  6\b  6  6\0 A@k$\0\f\vAâ\0AÝ<Aõ\0\vAæ\0AÝ<A¿\0\v \0 \0(\xA0!Aj6\xA0!\v \0 \0,\0­\"6¤!@ AF@ \0(!\x07@@@ \0(\"@A\0!  Atj\"\bAk\"	(\0\"\nA\0J\r\vA\0! \0A\x006°!\f\v \0A°!j! Aà\0j!\f@  \f  As\"\rj\"\vA\nlj\". .\0j .j .j .\bj\"H@  \f \vÁA\nlj\")\x007\0  /\b;\b \0 \b \rAtj(\0A\bt6¬! 	(\0!\n !\v  Aj\"G  \x07l \nHq\r\0\v A\0;\b B\x007\0 \0 ;´! AÌÙ\0J\r\v \0A\x006¶! \0A\x006°! \0AèÌA  AL\x1BnÁ lA\nv;´!\f\v AÎù\0I\r \0 ÁAÍù\0 nlAv;´!\f\v \0B\x007°! \0A\0;¸! \0 ÁA$l6¬! \0(!\x07 \0(!\v \0(¤At\"@ \0Aº!j A@k ü\n\0\0\v \0 (;ð!  Atj)\b!\" \0 \x076\" \0 \"7ô! \0 6\"\vY \0 \0(H\"Ak r6H \0(\0\"A\bq@ \0 A r6\0A\v \0B\x007 \0 \0(,\"6 \0 6 \0  \0(0j6A\0\v\x07\v}@ \0(\f\"A\0L\r\0 \0(\b!	 Aq!\n \0(\0!@ AO@ Aüÿÿÿ\x07q!\v@  Atj  j,\0\0²8\0  Ar\"\bAtj  \bj,\0\0²8\0  Ar\"\bAtj  \bj,\0\0²8\0  Ar\"\bAtj  \bj,\0\0²8\0 Aj! \x07Aj\"\x07 \vG\r\0\v \nE\r\v@  Atj  j,\0\0²8\0 Aj! Aj\" \nG\r\0\v\v 	Aþÿÿÿ\x07q!\v 	Aq!\b \0(!\fA\0!@@ 	A\0L\r\0  \fj!  Atj\"\n*\0!A\0!A\0!\x07 	AG@@ \n   lj,\0\0²  Atj*\0 \"8\0 \n  Ar\"\r lj,\0\0²  \rAtj*\0 \"8\0 Aj! \x07Aj\"\x07 \vG\r\0\v \bE\r\v \n   lj,\0\0²  Atj*\0 8\0\v Aj\" G\r\0\v Aq!A\0!A\0!@ AO@ Aüÿÿÿ\x07q!	A\0!\x07@  Atj\" *\0C\0\0\0<8\0  *C\0\0\0<8  *\bC\0\0\0<8\b  *\fC\0\0\0<8\f Aj! \x07Aj\"\x07 	G\r\0\v E\r\v@  Atj\" *\0C\0\0\0<8\0 Aj! Aj\" G\r\0\v\vA\0! \0(E@@  Atj\"\0C\0\0¿C\0\0? \0*\0\"  \"C4Ï\x1B?CãÈÀB CË!nD C->AC\x1B¯ÎC CV.nD\" C\0\0?^\x1B\" C\0\0¿]\x1B8\0 Aj\" G\r\0\f\v\0\v@  Atj\"\0C\0\0¿C\0\0? \0*\0C\0\0\0?\"  \"C4Ï\x1B?CãÈÀB CË!nD C->AC\x1B¯ÎC CV.nD\" C\0\0?^\x1B\" C\0\0¿]\x1BC\0\0\0?C\0\0\0?8\0 Aj\" G\r\0\v\v\vÂ\x07\b}#\0\"! E@ $\0C\0\0\0\0\v@@ \x07A÷F@ At! At!\f\v \x07AÀ»F\r\0 \x07Aý\0G\r AtAm! AtAm!\v  AtAjApqk\"$\0    A\0A~  \0\0@ AG\r\0 A\0L\r\0 Aq!A\0!A\0! AO@ Aüÿÿÿ\x07q!A\0!@  Atj\"\0 \0*\0C\0\0\0?8\0 \0 \0*C\0\0\0?8 \0 \0*\bC\0\0\0?8\b \0 \0*\fC\0\0\0?8\f Aj! Aj\" G\r\0\v E\r\v@  Atj\"\0 \0*\0C\0\0\0?8\0 Aj! Aj\" G\r\0\v\v@ \x07A÷F@ AH\r Am!A\0!\0@   \0Atj\"*\0\"\b \b *\0\"\nCÿ\x1B?\"\v8\0  *\"\b \b *\"\fCÀ>>\"\r8  \b *\b\"CÀ>>\" \b8\b  \0Atj \f \n \v\"\b \rC\0\0\0?8\0 \b  \"\b \b 	!	 \0Aj\"\0 G\r\0\v 	C\0\00!	\f\v \x07Aý\0G@ \x07AÀ»G\r At\"\0E\r   \0ü\n\0\0\f\v  Al\"AtAjApqk\"$\0 A\0J@A\0!\0@ AG@ Aq Aþÿÿÿ\x07q!A\0!@  \0A\flj\"  \0Atj*\0\"\b8\b  \b8  \b8\0  \0Ar\"A\flj\"  Atj*\0\"\b8\b  \b8  \b8\0 \0Aj!\0 Aj\" G\r\0\vE\r\v  \0A\flj\"  \0Atj*\0\"\b8\b  \b8  \b8\0\v Av!A\0!\0@   \0Atj\"*\0\"\b \b *\0\"\nCÿ\x1B?\"\v8\0  *\"\b \b *\"\fCÀ>>\"\r8  \b *\bCÀ>> \b8\b  \0Atj \f \n \v \rC\0\0\0?8\0 \0Aj\"\0 G\r\0\v\v\v $\0 	\vAÿï\0AAµ\0\v¬\r\b}\v~ \0 \0(:  \0(\b\"\rAmmj\"\f6: \0(:\"! \fA\bN@ \0  \fAk\"\vA\0 \v \fM\x1BA\x07j\"\vAvjAj\"6: \0 \f \vAxqkA\bk6:\v \0(:!\f Aä\0N@ \0 Aä\0k6:\vA\0!\v  \0A´;j\"Aã\0   Aj\"A\0 Aä\0G\x1B \f F\x1B  \rA2mL\x1B\"  \fFk\" A\0H\x1B\"Atj\")878  )070  )(7(  ) 7   )7  )7  )\b7\b  )\0\"7\0 §@ \f k\"A\0H!\f Aä\0j *!@} Aj\"A\0 Aä\0G\x1B\" \0(:\"F@ !C\0\0?\f\v  Atj\"*!  ( \"\v ( \"  \vH\x1B\"6     ]\x1B!A!A\0!\v  !  Aj\"A\0 Aä\0G\x1B\"F@C\0\0\0@!\x07A\0!\f\v  Atj\"*!   ( \"  H\x1B\"6     ]\x1B!A!  !C\0\0@@  Aj\"A\0 Aä\0G\x1B\"F\r\0  Atj\"*!   ( \"  H\x1B6     ]\x1B!  !A\0!A!\vC\0\0@\v!\x07A\0!\v  \f\x1B!@Aã\0 Ak A\0L\x1B\"\f F\r\0  ( \"\r  \fAtj( \"  \rH\x1B6 Aã\0 \fAk \fA\0L\x1B\"\f F\r\0  ( \"\r  \fAtj( \"  \rH\x1B6 Aã\0 \fAk \fA\0L\x1B\"\f F\r\0  ( \"\r  \fAtj( \"  \rH\x1B6  \v\r\0Aã\0 \fAk \fA\0L\x1B\"\r F\r\0  ( \"\v  \rAtj( \"  \vH\x1B6  \r\0Aã\0 \rAk \rA\0L\x1B\"\r F\r\0  ( \"\v  \rAtj( \"  \vH\x1B6  \r\0Aã\0 \rAk \rA\0L\x1B\" F\r\0  ( \"\v  Atj( \"  \vH\x1B6 \v   \x07\" CÍÌL¾\"  ]\x1B8 \"\v! AN@A¡A AÞ\0J\x1B j\"\vAj!AA Aâ\0J\x1B j!\v  \vAtj*CÍÌÌ=  Atj*$\"	 	CÍÌÌ=]\x1B\"!@  A\0 Aä\0G\x1B\"F@C\0\0?!\x07C\0\0\0\0!\f\vC\0\0\0\0!C\0\0?!\x07@ Aj\"A\0 Aä\0G\x1B\" F\r 	  Atj*$\"\n\"\bC\0\0 A  \"   ]\x1B! \bC\0\0 Á  \" \x07  \x07]\x1B!\x07 CÍÌÌ= \n \nCÍÌÌ=]\x1B\"!   Atj* ! Aj\"\vA\0 \vAä\0G\x1B\" G\r\0\v\v   \"8    ]\x1B\"C\0\0? C\0\0?]\x1B!  \x07  \x07]\x1B\"C\0\0\0\0 C\0\0\0\0^\x1B! A	L@ !\x07 !@ \0(:\"\0AH\r\0 \0AG@A \0 \0AN\x1BAk\"\0Aq \0A~q!\0A\0!@  Aã\0 Ak A\0L\x1B\"\vAtj*\"\b  \b^\x1B\" Aã\0 \vAk \vA\0L\x1B\"Atj*\"  ^\x1B! \x07 \b \x07 \b]\x1B\"\x07   \x07^\x1B!\x07 Aj\" \0G\r\0\vE\r\v  Aã\0 Ak A\0L\x1BAtj*\"  ^\x1B! \x07   \x07^\x1B!\x07\v ²CÍÌÌ½C\0\0?\"C\0\0? 	CÍÌÌ= \" C\0\0?^\x1B  ! C\0\0\0\0 	CÍÌÌ½ \x07\" C\0\0\0\0]\x1B  !\v  8  8\v\v#\0Aàk\"$\0A A\0L\r\0A\0  F\r\0A  J\r\0  AjApqk\"$\0 A\x006\b @  \0 ü\n\0\0\v Aj\"  \"   (\b \0 A\v\v!\0 Aàj$\0 \0 \0Auq\v¦#\0Ak\"	! 	$\0A!\b@@ A\0L\r\0  \0(J\r\0A\0!\b \0A¬j!\v \0Aìj! \0A¬j!@ \f  At\"\x07j(\0! \x07 j(\0!\x07  \vj-\0\0!\r#\0A@j\"\n$\0@@ \x07A\0N@ A \x07\x1BE\r \rA1O\r \n 6\f \n 6\b \n 6 \n \x076 \n \x076 \nB\x007 \nB\x0074 \n \r60 \n \r6, \nA\x006( \nB\x007  \nA\0:\0<A\0!@ \"\x07Aj! \nAjA\0PA\0J\r\0\v \nA@k$\0 \x07\f\vAÍé\0AÈAú\0\0\vA­ì\0AÈAû\0\0\vAÃÍ\0AÈAü\0\0\v\"A\0 A\0J\x1Bj!\f Aj\" G\r\0\v 	A \f \fAM\x1BAtk\"$\0A\0!\r \0AÈj!\n \0A\bj! \0A¬j! \0Aìj! \0A¬j!A\0!\x07@@@@@@@  \f \rk6\f  \x07At\"j(\0!  j(\0!	  \rAtj! \x07 j-\0\0!\v#\0AÐ\0k\"$\0@@@@ A\fj\"@ E@ (\0\r\v 	A\0H\r A 	\x1BE\r \vA1O\r  6  6  6  	6,  	6( B\x007  B\x007D  \v6@  \v6<A\0! A\x0068 B\x0070 A\0:\0L@ Aj AjP\"	A\0J@@ (\0 F@A~!	\f\v  Atj\"	 )\f7\b 	 )7\0 Aj! Aj AjP\"	A\0J\r\0\v\v  6\0\v AÐ\0j$\0 	\f\vAÓÀ\0AÈAí\0\vAñë\0AÈAî\0\vAÍé\0AÈAú\0\0\vA­ì\0AÈAû\0\0\vAÃÍ\0AÈAü\0\0\vA\0H\r@ (\f\"	A\0L\r\0 	Aq!A\0!\vA\0! 	AO@ 	Aüÿÿÿ\x07q!A\0!@  Atj\" \x07 (j6  \x07 (j6  \x07 ($j6$  \x07 (4j64 Aj! Aj\" G\r\0\v E\r\v@  Atj\" \x07 (j6 Aj! \vAj\"\v G\r\0\v\v 	 \rj!\r \x07Aj\"\x07 G\r\0\v@@@@@ Ak\0\v  \n.\0Aj\"\bH@A~!\b\f\v\v  \0-\0\0Aüq:\0\0 Aj!\f\v \n/\0\"\bÁ! \b \n/\"\x07F@  AtAj\"\bH@A~!\b\f\v\v  \0-\0\0AüqAr:\0\0 Aj!\f\v  \x07Á j AûJjAj\"\bH@A~!\b\f\n\v  \0-\0\0AüqAr:\0\0 \n.\0 Aj\"j j!\f\v ! AJ\r\v @  \bJ\r \rA\0J\r\f\v \rA\0L\r\vA!A! \n.\0!\b@@ AL\r\0 \bAÿÿq!\x07@ \x07 \n Atj/\0F@  Aj\"G\r\f\v\v Ak\"\x07Aq!\fA\0!\v@@ AkAI@A\0!\f\v \x07A|q!A\0!A\0!	@  \n Atj\"\b.\0\"jAA AûJ\x1Bj \b.\"jAA AûJ\x1Bj \b.\"jAA AûJ\x1Bj \b.\"jAA AûJ\x1Bj! Aj! 	Aj\"	 G\r\0\v \fE\r\v@  \n Atj.\0\"\bjAA \bAûJ\x1Bj! Aj! \vAj\"\v \fG\r\0\v\vA!	   \n \x07Atj.\0j\"\bH@A~!\b\f	\v \0-\0\0!\0  Ar:\0  \0Ar:\0\0\f\v   \blAj\"\bH@A~!\b\f\b\v \0-\0\0!\0  :\0  \0Ar:\0\0A\0!	\v  \bk!A\0!\0 Aj! \rA\0L@ A\0 \x1B!A\0!\x07\f\vA\0   \r \"\x07A\0H@ \x07!\b\f\x07\v \r \x07 \x07AýjAþnA\v \x07j!\f\vA}!\b\f\v \r\0A\0\f\v  -\0AÀ\0r:\0  AkAÿm\"\f \bj\"\v \x07jL@A~!\b\f\v  \bj!\b AN@A \f \fAL\x1B\"\0@ Aÿ \0ü\v\0\v \0 jAj!\v \b \x07k!\0   \fjAk:\0\0 Aj! \vAj\v!\f 	E\r AH\r Ak!	A\0!@ \n Atj.\0 j j!  	G Aj!\r\0\v\f\vA\0!\x07A\0!\0A\0!\f\v@ A\0L\r\0A\0! AG@ Aq Aþÿÿÿ\x07q!A\0!	@ \n Atj\".\0\"@   Atj(\0 ü\n\0\0\v  .\0j! \n Ar\"Atj\".\0\"@   Atj(\0 ü\n\0\0\v  .\0j! Aj! 	Aj\"	 G\r\0\vE\r\v \n Atj\"\n.\0\"	@   Atj(\0 	ü\n\0\0\v  \n.\0j!\v \x07@ \0 j \x07  \r  \x07G\r\v@ \0 \fL\r\0 \0 \fk\"\0E\r\0  \fjA \0ü\v\0\v E\r\0 \r\r\0   j\"\0O\r\0 \0 k\"\0E\r\0 A\0 \0ü\v\0\v\v Aj$\0 \b\vAþAî#A·\0\vÄ#\0Ak\"\b$\0A|!@ A\0L\r\0@ \0(E@ \0 -\0\0:\0\0 \0 AÀ>$6¨\f\v -\0\0 \0-\0\0sAK\r\v  [\"A\0L\r\0 \0(¨ \0(\" jlAÀ\x07J\r\0   \bAj \0 At\"jA\bj \0 AtjAÈjA\0 \0A¬j\" j \0Aìj\" j?\"A\0L\r\0 \0A¬j\"\x07 \0(j :\0\0 \0(!@ AF\r\0 Aq  \0 Aj\"6  AtjA\x006\0 \x07 \0(jA\0:\0\0  \0(\"AtjA\x006\0 Ak\v! AF\r\0@ \0 Aj\"6  AtjA\x006\0 \x07 \0(jA\0:\0\0  \0(\"AtjA\x006\0 \0 Aj\"6  AtjA\x006\0 \x07 \0(jA\0:\0\0  \0(\"AtjA\x006\0 AJ Ak!\r\0\v\v \0 Aj6A\0!\v \bAj$\0 \v¡ (\0\"AkAý\0I@ (\f!@ AM@ AK@A\v E\r  L@A~\v \0@ \0 j (\b-\0\0:\0\0\v Aj\v A\0H@A\vA\0 AÿnAj \x1B j  kJ@A~\v E@ AÿO@A\0!@ \0@ \0 jAÿ:\0\0 (\f!\v Aj! Aj\" AÿmH\r\0\v\v \0@ \0 j Aÿo:\0\0 (\f!\v Aj!\v \0 @ \0 j (\b ü\n\0\0\v (\f \v j!\v \vAÎ\0AÈA©\0\v\v#\0AÀk\"\n$\0A!\x07@@@ A\0N@@ A0J\r\0@ A\0L\r\0 A\x07q! A\bO@ Aøÿÿÿ\x07q!\f@ \nAj 	Atj\"\v 6 \v 6 \v 6 \v 6 \v 6\f \v 6\b \v 6 \v 6\0 	A\bj!	 A\bj\" \fG\r\0\v E\r\v@ \nAj 	Atj 6\0 	Aj!	 \bAj\"\b G\r\0\v\vA\0! At\"\vE\"\fE@ \nAÀjA\0 \vü\v\0\v A\0J@@  Atj\"\b(\"A\0H\r  L\r \b(\0AkAI\r At\" \nAjj\"\b \b(\0\"\b   \bJ\x1B6\0 \nAÀj j\" (\0\" Aj\"  H\x1B6\0  G\r\0\v\v@ A\0L\"\x07\r\0 \f\r\0 \n \nAj \vü\n\0\0\vA\0!\f@ \x07@A\0!\f\v A\0 A\0J\x1B! Ak! \n AtjAk!A\0!\x07A\0!@ \fAt\" \nAÀjj(\0! \nAj j(\0!A!@  \fAj\"\vL\"@A\0!\f\vA\0!  N\r\0 \n j! !@ \f  Atj\"\b(F@ \v!@ \n At\"	j(\0\"\r \nAÀj 	j(\0N\r  \rAtj\"	( G\r\b 	(\0\"\r \b(\0G\r \rAL@ 	(\f \b(\fG\r\v Aj\" G\r\0\v \rA N@ (\0!\v \v!	@ 	At\" \nAÀjj(\0\"\r  \nj\"(\0Aj\"  \rH\x1B!\b@  \rN\r\0@ 	  Atj(G@ \r Aj\"J\r\f\v\v !\b\v  \b6\0 	Aj\"	 G\r\0\v  6\0 Aj!\v Aj\" G\r\0\v\v  H@   \vkl! \n j! A\0N!\r@@  Atj\"( \fG\r\0@ \x07 \fF\r\0  kAH@A~!\x07\f\x07\v \f \x07k\"\x07AF@ \0@ \0 jA:\0\0\v Aj!\f\v \0@ \0 j\"\bA:\0\0 \b \x07:\0\v Aj!\vA~!\x07  L\r (\0\"\bAkAý\0O\r\b  F!	 \0@ \bAt! \0 j \bAM@ (\f\f\v 	E\v j:\0\0\v \0  Aj  	\"A\0H@ !\x07\f\v Aj! A\0L@ \f!\x07\f\v  (\0G@ \f!\x07\f\v  L\r  j F\"\x07 \x07 Aj N \r\x1Br!	 \0@ \0 jAA 	Aq\x1B:\0\0\v Aj! \v!\b E@@ \bAt\"\x07 \nAjj\"(\0\" \x07 \nj(\0\"\x07H@@ \b  Atj\"(F@ \0    	  Fq\"A\0H@ !\x07\f\v\v Aj!\v Aj\" \x07G\r\0\v \x07!\v  6\0 \bAj\"\b G\r\0\v\v \f 	Aqj!\x07\v Aj\" G\r\0\v\v \v\"\f G\r\0\v\v  G\r !\x07\v \nAÀj$\0 \x07\vAÍé\0AÈAä\0\vA³AÈA\0\vAÎ\0AÈAÑ\0\vA¸\fAÈAð\0\v£\f \0(4\"	A\0J@@@ \0((\"\v 	J@ \0( !@ 	Aj!\f A\0J@ \0(!\b@ Ak! \bAj! \0@ \b-\0\0\"Av\"\nAF\r\0 \nE\"\x07 q\r\0 Aq!@@ A?K\r\0 \x07\r\0  I\r  j!\b  k\f\vA\0!\x07 E@  \bj!\bA\0\f\v@ A\0L\r \x07 -\0\0\"j!\x07  Asj! Aj! AÿF\r\0\v A\0N\"E\r\0  \x07A\0 \x1Bj!\b \f\v \0A6 A¨é\0AÈA©\0\v !\b \v\"6  \0 \b6@ AI\r\0@ \0-\x008\r\0 \v \fJ\r\0 Aþq  \b \0(\fF\x1B\"Av!\n\v \0(! \0(!\x07@@ \nAF@ ! \x07\f\v Aq! A?M@  J\r  k!  \x07j\f\vA\0! @ \x07! !A\0!@ A\0L\r Aj!  -\0\0\"\rj!  \rAsj! Aj! \rAÿF\r\0\v A\0H\r \0 6 \0  j\"6\f\v  \0($\"H\r \x07  kj\v! \0 6 \0 6A\0! A\0N\rA|\v \0A6A|\v  \0(\0k \0( kG\r 	 \0(,N\r\0A! E\r  	6  \n6\0   \x07j\"\x006\b   \0k6\fA\v A\0J\r\0\v\v \0 \f64 \0 \0(\b6 \0 \0(\"6  \f\"	 \vG\r\0\v\vA\0! \0A\x006\f \0 \0(6\b@ \0-\x008\r\0 \0 \0(0Aj\"60  \vH\r\0 \0A\x006\v \0A\x0064\v \vAAÈA¼\0\vAç\0AÈA\xA0\0\vÌ} AA÷ \bm\" AL\x1B\"\vm!\n@ AG@A\0!\b \nA\0L\r@  \bAt\"j \0 j*\0 \x07 \b \vlAtj*\0\"	 	\"	  C\0\0? 	\"	8\0  Ar\"j \0 j*\0 	8\0 \bAj\"\b \nG\r\0\v\f\v \nA\0L\r\0A\0!\b \nAG@ \nAq \nAþÿÿÿ\x07q!A\0!@  \bAt\"\fj \0 \fj*\0 \x07 \b \vlAtj*\0\"	 	\"	  C\0\0? 	8\0  \bAr\"\fAt\"\rj \0 \rj*\0 \x07 \v \flAtj*\0\"	 	\"	  C\0\0? 	8\0 \bAj!\b Aj\" G\r\0\vE\r\v  \bAt\"j \0 j*\0 \x07 \b \vlAtj*\0\"	 	\"	  C\0\0? 	8\0\vA  AL\x1B!\v  \nl!  \nkAq!A\0!  \nAj\"\x07F!\f@@  \nL\r\0 \n!\b @   jAt\"\bj  \0 \bj*\08\0 \x07!\b\v \f\r\0@   \bl jAt\"\rj  \0 \rj*\08\0  \bAj l jAt\"\rj  \0 \rj*\08\0 \bAj\"\b G\r\0\v\v Aj\" \vG\r\0\v\v;	}#\0AÐk\"\f$\0 \fA\x006Ì \fA\x006 \0A\x006ào@@ \0(p\"\rAF\r\0 \0 \0(j!&A!\x1B \rAG\r\0 \0A¨ï\0j!$ \0(¨o!\f\v \0(\0!\r \f \fAÌj6 \0 \rj\"AÎ\0 \fAj	 \0A¨ï\0j!$ \0(¨o! \0(p\"\x1BAkAI\r\0 \0(x!\v \0(\" m!\"A\0 \r\0 (\0@A *$CÍÌÌ=`\r@ \0(t l\"A\0L\r\0 Aq!A\0! AO@ Aüÿÿÿ\x07q!\r@  Atj\"*\f\") ) *\b\") ) *\") ) *\0\") ) (!( Aj! Aj\" \rG\r\0\v E\r\v@  Atj*\0\") ) (!( Aj! Aj\" G\r\0\v\v \0*Øo ( ²CqC]\f\vA \0(oAê\x07G\r\0@ \0(t l\"A\0L\r\0 Aq!A\0! AO@ Aüÿÿÿ\x07q!\r@  Atj\"*\f\") ) *\b\") ) *\") ) *\0\") ) (!( Aj! Aj\" \rG\r\0\v E\r\v@  Atj*\0\") ) (!( Aj! Aj\" G\r\0\v\v \0*Øo ( ²C\0\0\0?CqC]\v!! \0(°o@ \0A\x006°oA!\bA!	A!\x07\vAü	  Aü	N\x1B! \0(¤!A\0 \x07E\r\0A\0 \0(oAê\x07F\r\0A \0(øn\"\rA(lAj\"AÈ \"kl jAlAm\"\x07 At AtkAðlA÷ \"mAðjm jA\bm\"  \x07J\x1B\" AN\x1BA\0  \rAtArJ\x1B\" A\0G\v! \fAj Aj\"# Akx \0Aäï\0j! \f  j\"' \0(t\"\x07lAtAjApqk\"$\0 \x07 lAt\"@   \0(° k \x07lAtj ü\n\0\0\v Al Al mm! \0 \0(oAê\x07F@A<\nA\bt\f\v &(`\v \0(o\"\x07k\"AuA×\x07l \x07j AÿÿqA×\x07lAvj\"6o A\bu!  \0(t\" lAtj! \0(!@ \0(p\"%AF@ ÁA§l Aè\x07mm! A\0L\r Á\" AÿÿqlAu  Aulj AuAjAu lj\"Á\"\r A©|lAj\"Au\"Aÿÿq\"\x07lAu \r Au\"lj AkAuAjAu lj²C\0\01!/ AuAjAu l  Á\"lj  \x07lAuj²C\0\01!0 A®\x07lAk²C\0\01!, ²C\0\01!* \0*o!( \0*o!-A\0!@ \0 *   lAt\"\x07j*\0\".\") ) -\"+ 0C`B¢\r\")8o \0 , . ( + /\"-8o \x07 j +8\0 )!( Aj\" G\r\0\v AG\r Aj!\r Aj!\x07 \0*o!( \0*o!-A\0!@ \0 * \x07 At\"j*\0\".\") ) -\"+ 0C`B¢\r\")8o \0 , . ( + /\"-8o  \rj +8\0 )!( Aj\" G\r\0\vA!\f\vC\0\0?C43A ²\"*!+ \0*o!( AF@ \0*o!, A\0J@A\0!@  At\"\rAr\"\x07j*\0!. \r j  \rj*\0\") (8\0 \x07 j . ,8\0 + ( * )C`B¢\r!( + , * .C`B¢\r!, Aj\" G\r\0\v\v \0 ,8o \0 (8oA!\f\v@ A\0L\r\0A\0! AG@ Aq Aþÿÿÿ\x07q!\rA\0!@  At\"\x07j  \x07j*\0\". (8\0  \x07Ar\"\x07j  \x07j*\0\") + ( * .C`B¢\r\"(8\0 + ( * )C`B¢\r!( Aj! Aj\" \rG\r\0\vE\r\v  At\"j  j*\0\") (8\0 + ( * )C`B¢\r!(\v \0 (8o\v \x1BAF!@  l\"A\0L\r\0   lAtj! Aq!\x07A\0!\rC\0\0\0\0!(A\0!@ AO@ Aüÿÿÿ\x07q!A\0!@  Atj\"*\f\") ) *\b\") ) *\") ) *\0\") ) (!( Aj! Aj\" G\r\0\v \x07E\r\v@  Atj*\0\") ) (!( Aj! \rAj\"\r \x07G\r\0\v\v (C(knN]\r\0 At\"@ A\0 ü\v\0\v \0B\x007o \0B\x007o\vA\0   \x1B!A\0  \x1B! Aê\x07!\rC\0\0?!-@ \0(o\"Aê\x07F\r\0 Al m\"  kAt\"   H\x1BA\bklAm!\x07@@@@@ Aé\x07F@ \0(8AtAA  A2lF\x1Bj! \0(!A \x07 \0(øn\"m\"AàÝ\0H\r\0A Aý\0I\r\0A A\xA0I\r\0A AÀ»I\r\0A AúI\r\0 AôO\rA\vAl\"AÖj\"(\0\"\r k AìÕj\" At\"j(\0l  j(\0  (\0\"klj \r km\f\v \0 \x076$ \0(¸o\"\r \x07!\f\v AtAøÖj(\0 AôkAvj\v! \0  Aä\0j \x1B\"A¬j  AÐ\bF\x1B l\"Aè\x07k  AßÝ\0J\x1B  AF\x1B\"6$ \0(¸o\"E\r !\x07\v \0(\r \x07!\f\vC\0\0?  \x07k²C\0\0:»Dï9úþB.æ?¢¶!-\f\v \0(´@ \x07!\f\vC\0\0úE!,A\r!\r@@@ $(\0\"$AÍ\bk\0\vC\0;F!,A!\r\f\vC\0\0zF!,A!\r\v@ A\0L@C\0\0\0\0!(\f\v \rAk!A\0!\x1BC\0\0\0\0!(@  \x1BAÔ\0lj!A\0!A\0!@ (  Atj\"*\0\"(C\0\0\0?C\0\0\0À (C\0\0\0À^\"\x1BC\0\0\0? (C\0\0\0?]\"\x1B\"( \x1B ( \x1B\"(C\0\0\0? ( (C\0\0\0\0^\x1B *\"(C\0\0\0?C\0\0\0À (C\0\0\0À^\"\x1BC\0\0\0? (C\0\0\0?]\"\x1B\"( \x1B ( \x1B\"(C\0\0\0? ( (C\0\0\0\0^\x1B!( Aj!  G Aj!\r\0\v (  Atj*\0\"(C\0\0\0?C\0\0\0À (C\0\0\0À^\"\x1BC\0\0\0? (C\0\0\0?]\"\x1B\"( \x1B ( \x1B\"(C\0\0\0? ( (C\0\0\0\0^\x1B!( \x1BAj\"\x1B G\r\0\v\vA\0 \x07AtkAm\" , ( \r³ ²CÍÌL>ü\0\"  H\x1B! \0 $A~qAÐ\bF AlAm \v \x07j\"6$\v \0 6\b \0 \0(øn\"6\f \0 Aè\x07l m6 AÀ>!AÀ>!@@@ AÍ\bk\0\vAàÝ\0!Aý\0! Aé\x07F\r AÏ\bF\rA¿Ë\0A¡&AÆ\0\vAàÝ\0!AàÝ\0!\v \0 6@ Aé\x07F@ \0BýÐ7\f\v \0Býè\x077 Aè\x07G\r\0  lAtAm! \"A3N@ AtAm!\v A¿>J\r\0 \0 6 \0AàÝ\x006 A×6J\r\0 \0AÀ>6 \0AÀ>6\v \0 At\"A\bk\"6D \0 \0(\"\x07E6@@@@@@ AH\r\0  E\r\0 \0  AtAsj\"6D Aé\x07G\r \0 Ak\"6D \x07E\r\f\v \x07E\r Aé\x07G\r\v \0(8AtAA  A2lF\x1Bj! \0@A  l m m\"AàÝ\0H\r\0A Aý\0I\r\0A A\xA0I\r\0A AÀ»I\r\0A AúI\r\0 AôO\rA\vAl\"AÖj\"\r(\0\"\x07 k AìÕj\" At\"j(\0l  \rj(\0  (\0\"klj \x07 km\f\v AtAøÖj(\0 AôkAvj\v\"A¬j  AÐ\bF\x1B l\"Aè\x07k  AßÝ\0J\x1B  AF\x1BAl m6D\f\v Aé\x07G\r\vA\0!\r   l mk\"A\0N@ ÁAlA|m!\r\v \0A\x006@ \0  \rj\"A\0 A\0J\x1B6D\v \0A\bj!\r@ 	E\r\0 %AF\r\0 \fA\x006  \0(° Am\" \0(xjk lAt\"\x07j\" C\0\0\0\0C\0\0? \f(Ì\"(   (<  \x07@ A\0 \x07ü\v\0\v & \r  \0(°A\0 \fAj 	 ! \0A\x006L \0(t!\vA} & \r   lAtj  \fAj \fAÈjA\0 !\r \0(T!@ \0(o\"\rAè\x07F@ AÀ>F@AÍ\b!\f\v Aý\0G@ AàÝ\0G\rAÎ\b!\f\vAÏ\b!\f\v Aý\0F\r\0AÃå\0A¡&A¶\0\v \0 \0(d \0(ÜoA\vE\"6L !AF@ \0(hA\0G!!\v \f(ÈE@A\0! \0A\x006ào \0( m\"AL@@ Aj! At\"AH\r\0\v At!\v @@@ \rAè\x07k\0\v Aðj AtAà\0jr\f\v AÎ\b  AÎ\bL\x1BAtAà\0qAÀsr\f\v Aðj AtrAà\0r\vAA\0 \0(ønAF\x1Br:\0\0A\f\v \0(p!% E\r\0 %AG@A \0(¤ \0(øn\"\x07A(lAj\"AÈ \"kljAlAm\"  AtkAðlA÷ \"mAðjm jA\bm\"  J\x1B\" AN\x1BA\0  \x07AtArJ\x1B\"A\0G! \v \0A6°oA\0!\b\v@ %AG \f AÍ\bk\"AM At(×A\v6ð AÎ\0 \fAðj	 \f \0(øn6à AÎ\0 \fAàj	 \fA6Ð A¢ \fAÐj	 \0(o \r\vAè\x07F@  \0(\" \0(t\"lAmAtAjApqk\"\x1B$\0Aè\x07!\r\f\v \fA\0A \0(P\x1B6À AÎ\0 \fAÀj	 \0(o!\r  \0(\" \0(t\"lAm\"\x07AtAjApqk\"\x1B$\0 \rAè\x07F@Aè\x07!\r\f\v \r \0(o\"F\r\0 A\0L\r\0 \0(pAF\r\0 \x07At\"E\r\0 \x1B  \0(° Að|m kj lAtj ü\n\0\0\v@ \0(°\"\x07 'k l\"A\0J@ At\"\x07@    lAtj \x07ü\n\0\0\v  'lAt\"E\r \x07 j  ü\n\0\0\f\v  \x07lAt\"E\r\0   ' \x07k lAtj ü\n\0\0\v \f(Ì!@ \0*o\"(C\0\0?] -C\0\0?]rE\r\0 E\r\0   ( - (   (< \v \0 -8o@ \rAé\x07F@ \0(ønAG\r\v \0A \nAúJ\r\0A\0 \nAý\0H\r\0AA\xA0 \nA\vtk \nA°í\0knk\v6`\v@ \0(¸o\r\0 AG\r\0 \0(`\"\nAÿÿ\0J \0.ün\"\x07ANq\r\0@ E\r\0A\0!C\0\0? \n²C\0\08!* (AA÷ m\" AL\x1B\"	m\"A\0J@C\0\0? \x07²C\0\08!+ (<!\x07@  Atj\" *\". \x07  	lAtj*\0\"( (\"( * +C\0\0? ( *\0\") .C\0\0\0?\"(8  ) (8\0 Aj\" G\r\0\v !\v  N\r\0 Aj!  kAq@  Atj\" *\"( * *\0\") (C\0\0\0?\"(8  ) (8\0 !\v  F\r\0@  Atj\" *\"( * *\0\") (C\0\0\0?\"(8  ) (8\0  *\b\"( * ( *\f\")C\0\0\0?\"(8\b  ) (8\f Aj\" G\r\0\v\v \0 \n;ün\v@@ \rAê\x07F\r\0 \f(´g \f(¬AAq \rAé\x07F\"\x1Bjj Ak\"AtJ\r\0 @ \fAj  A\f\v  E\r\0A! \fAj\"	 \bAAA  \f(´g \f(¬ArAg \0(o\"Aé\x07F\x1BjjAuk\"   H\x1B\" AL\x1B\" AN\x1B!\x07A\0! Aé\x07G\r 	 \x07AkA%\f\vA\0! \0A\x006°oA!A\0!\x07\v \0(o\"	Aè\x07F@ \f(´! \f(¬ \fAjv gjAkAu\"\f\v \fAj  \x07Asj\"A\0\v!\r@ \r\0 \0(oAè\x07G\r\0 \bA\0G!A\0\f\v \f 6° A¦Î\0 \fA°j	 \0(oAé\x07F@ \f \0(h6 \f \0(l6 \f \fAj6\xA0 A¬Î\0 \fA\xA0j	\vA\0 \bA\0G\" qE\r\0 \fA\x006 AÎ\0 \fAj	 \fA\x006 A¦ \fAj	 \fA6ð A¢ \fAðj	A}   \0(AÈm  #j \x07A\0)A\0H\r \f \fAj6à A¿ \fAàj	 A¼A\0	A!A\v!\b \0(pAG@ \fAA\0 	Aê\x07G\x1B6Ð AÎ\0 \fAÐj	\v \0Aàï\0j!	 A\0:\0\0@ \0(oAè\x07G@ \f \0(6À A¦ \fAÀj	 \0(!@ \0(oAé\x07F@ E\r \f \0(¤ \0($k6 A¢ \fAj	 \fA\x006p A´ \fAð\0j	\f\v E\r\0 \fA6° A¦ \fA°j	 \f \0(6\xA0 A´ \fA\xA0j	 \f \0(¤6 A¢ \fAj	\v@ \0(o\" \0(oF\r\0 A\0L\r\0 \0(pAF\r\0 A¼A\0	  \x1B \0(Am \fAjAA\0) \fA\x006` AÎ\0 \fAà\0j	\v@ \f(¬ \f(´gjA k AtJ\r\0A}   A\0  \fAj)\"\rA\0H\r \bE\r\0 \0(oAé\x07G\r\0  \rF\r\0 \x07@ \r #j  #j \x07ü\n\0\0\v \x07 \rj!\v \f 	6P A¿ \fAÐ\0j	\f\v 	 \f(´6\0\v@  rE@ \0(! A¼A\0	 \fA\x006@ AÎ\0 \fA@k	 \fA\x0060 AÎ\0 \fA0j	 \fA\x006  A¦ \fA j	 \fA6 A¢ \fAj	 \0(oAé\x07F@ \fAj \r \r!\v   \0(t  AÈm\"\bk\" Am\"klAtj  \fAjAA\0)   \0(t lAtj \b  #j \x07A\0)A\0H\r \f \fAj6\0 A¿ \f	\v \0(o!A\0! \0( m\"AL@@ Aj! At\"AH\r\0\v At!\v  -\0\0@@@ Aè\x07k\0\v Aðj AtAà\0jr\f\v AÎ\b  AÎ\bL\x1BAtAà\0qAÀsr\f\v Aðj AtrAà\0r\vAA\0 \0(ønAF\x1Brr:\0\0 	 	(\0 \f(s6\0 \0 \vAê\x07 \0(o\v6o \0A\x006´o \0 6¤o \0 \0(øn\"6\xA0o@@ \0(¼E\r\0 \0(<\r\0 !@ \0A\x006Ôo\f\v \0 \0(Ôo AÐl \0(\"mj\"6Ôo AH\r A±	O@ \0A6Ôo\f\vA\0! \0A\x006ào \0(o!\0  m\"\rAL@@ Aj! \rAt\"\rAH\r\0\v At!\v @@@ \0Aè\x07k\0\v Aðj AtAà\0jr\f\v AÎ\b  AÎ\bL\x1BAtAà\0qAÀsr\f\v Aðj AtrAà\0r\vAA\0 AF\x1Br:\0\0A\f\v \0A\x006Ôo\v@ \f(¬ \f(´gjA k AtA\bkJ@A~ AH\r #A\0:\0\0 	A\x006\0A!\r\f\v  \0(oAè\x07Gr\r\0 \rAH\r\0@  \rj-\0\0\r \rAJ \rAk!\r\r\0\vA!\r\v \x07 \rjAj\" \0(\rA}    \x1B\f\vA}\v \fAÐj$\0\vø)}1#\0AÀk\"@$\0 @A\x006¼ \0A\x006àoA!4@@ A\0L\r\0 A\0L\r\0 AF@A~!4 \0( A\nlF\r\v@ \0(p\"4AF\r\0 \0 \0(j!Y 4AG\r\0  \0(¬\"4  4H\x1B\f\v \0(\0!8 \0(¬!4 @ @A¼j6 \0 8j\"ZAÎ\0 @Aj	  4  4H\x1B\v!K@ \0(t l\"A\0L\r\0 Aq!>A\0!4 AO@ Aüÿÿÿ\x07q!;A\0!8@ \n  4Atj\"*\0\"\f \n \f]\x1B\"\n *\"\r \n \r]\x1B\"\n *\b\" \n ]\x1B\"\n *\f\" \n ]\x1B!\n \v \f \v \f^\x1B\"\v \r \v \r^\x1B\"\v  \v ^\x1B\"\v  \v ^\x1B!\v 4Aj!4 8Aj\"8 ;G\r\0\v >E\r\v@ \n  4Atj*\0\"\f \n \f]\x1B!\n \v \f \v \f^\x1B!\v 4Aj!4 <Aj\"< >G\r\0\v\v @A\x006üC\0\0?A Kt²\"* \v \n\"\n \n \v]\x1B`!L@@ \0(,A\x07H\r\0 \0(\"Aý\0kAúK\r\0 \0(pAF\r\0 \0(à;!S \0(Ü;!M \0AÄj!3 @(¼![#\0AàØ\0k\"5$\0 \"8@ \b!> 	!; Aß\0lA2m\" \x07A~q\"\x07  \x07H\x1B\"\\ 3(:\"Dk\"HA\0J@ 3A¨:j!< 3Að7j!] 3A-j!^ 3A\xA02j!P 3Aà-j!T 3A¨7j!I 3Aà6j!N 3Aj!_ 3AÌ%j!` 3A´;j!U 3A¨;j!V 3AÌj!	 3Aj!a 3AÌ\x07j!b 3A\fj!c A2m!OC\rl:AA\b K KA\bL\x1BA\bkt²\"\n \n\"(C\0\0@@!+@ 3(¤:E@ 3A6¤: 3Að6-\v O H H OJ\x1B! 3(:!4 3(\b\"Aý\0G@ D A÷G\r Am! DAm\f\v AlAm! DAlAm\v!7 [(H!\x07 3 ; 8 	 3(-\"\bAtj V AÐ \bk\"\b  \bH\x1B 7 >  3*\xA0:\"8\xA0:@ 3(- j\"AÏL@ 3 6-\f\vC\n×#=C\0\0? 4Aj²\" 4AJ\x1B! 3AA 3(:\"9Aâ\0J\x1B 9j6:C\0\0\0\0!\vC\0\0\0\0!\nA\0!A\0!6@ \v 	 Atj\"\b*\0\"\f \v \f]\x1B\"\v \b*\"\r \v \r]\x1B\"\v \b*\b\" \v ]\x1B\"\v \b*\f\" \v ]\x1B!\v \n \f \n \f^\x1B\"\n \r \n \r^\x1B\"\n  \n ^\x1B\"\n  \n ^\x1B!\n Aj! 6Aj\"6AÐG\r\0\vC\0\0?A Kt² \n \v\"\v \n \v^\x1B`A\0!@ 5A-j\"6 Atj\": At\"=*\xA0×\"\n 	 =j\"=*\08\0 : \n =*À\x078 6Aß k\":Atj\"6 \n 	 :Atj*\08\0 6 \n 	AÏ kAtj*\08 Aj\"AðG\r\0\v 	 `AÀ\x07ü\n\0\0 ; 8 _ V  3(-\"jAÐk\" 7 kAÐj > 3(\b!\n 3 Aðj6- 3 \n8\xA0: U 9Atj!9@ 9 U 3(:\"AtjA1A AH\x1Bj\")878 9 )070 9 )(7( 9 ) 7  9 )7 9 )7 9 )\b7\b 9 )\x007\0\f\v \x07!A\0!@ 5Aj\"\x07 5A-j\"\bG@@ (\0\"7A\0L\r\0 *!\n (,!6 7AG@ 7Aq 7Aþÿÿÿ\x07q!=A\0!7@ \b Atj\"A*\0!\v \x07 6 Atj.\0Atj\"G \n A*8 G \n \v8\0 \b Ar\"AAtj\"G*\0!\v \x07 6 AAtj.\0Atj\"A \n G*8 A \n \v8\0 Aj! 7Aj\"7 =G\r\0\vE\r\v \b Atj\"\b*\0!\v \x07 6 Atj.\0Atj\" \n \b*8  \n \v8\0\v  \x07/\f\vA÷A¼Aò\0\vA! 5*\" \\@ 9A\x006\0\f\v@A\0 kAt 5jA-j\"*\0\"\n 5Aj Atj\"\x07*\0\"\v!\f \x07*\" *\"!\rC\0\0\0\0!}C\0\0\0\0 \v \n\" \"\n  \" \"\vCï!]\r\0CÛÉ¿CÛÉ? C\0\0\0\0]\x1B\"   \nCøÜ> \v \nC!±-? \v \nCe	°= \v \n \v]\r\0   \" \vCøÜ> \n \vC!±-? \n \vCe	°= \nCÛÉ¿CÛÉ? C\0\0\0\0]\x1B\vCù\">\" c At\"j\"\x07*\0\"  bj\"\b*\0!@ \f \f\"\n \r \r\"\vCï!]\r\0 \n \v^@CÛÉ¿CÛÉ? \fC\0\0\0\0]\x1B \f \r \vCøÜ> \n \vC!±-? \n \vCe	°= \n!\f\vCÛÉ¿CÛÉ? \fC\0\0\0\0]\x1B \f \r\"\f \nCøÜ> \v \nC!±-? \v \nCe	°= \vCÛÉ¿CÛÉ? \fC\0\0\0\0]\x1B!\v Cù\">\"\f \"\r \"\nü\0!7  5j  ü\0²\"\v \n 7²\"\n8\0  aj\"7*\0! 5AÎ\0j jC\0\0? \n \n\"\n \n\"\nCÑsGC\0\0?CÂu¼8\0 5AÀ\x07j jC\0\0? \n \n  \v \v\"\v \vC\0\0>CÑsGC\0\0?CÂu¼8\0 \x07 \f8\0 \b \r8\0 7 \n8\0 Aj\"AðG\r\0\vA! 5*N!\v@ At\" 5AÀ\x07jj\"\x07 \x07*\0\"\f \v  5jAÎ\0j*\0\"\r 5AÎ\0j Aj\"Atj*\0\"\n \n \r]\x1B\"\r \v \r]\x1BCÍÌÌ½\"\v \v \f]\x1BCfff?8\0 \n!\v AïG\r\0\v 9A\x006 3(:\":E@ 3BùÔßÀÐ\x007à6 3BùÔßÀP7¨7 3BùÔßÀP7°7 3BùÔßÀÐ\x007è6 3BùÔßÀP7¸7 3BùÔßÀÐ\x007ð6 3BùÔßÀP7À7 3BùÔßÀÐ\x007ø6 3BùÔßÀP7È7 3BùÔßÀÐ\x0077 3BùÔßÀÐ\x0077 3BùÔßÀP7Ð7 3BùÔßÀÐ\x0077 3BùÔßÀP7à7 3BùÔßÀP7Ø7 3BùÔßÀÐ\x0077 3AùÔ}6è7 3AùÔ6\xA07 3AùÔ}6ì7 3AùÔ6¤7\vCÍÌÌ=  4A	J\x1B! 5  \"\n \n 5*\"\n \n\"\n \n 5*ü,\"\n \n 5*\"\n \n 5*\"\n \n 5*ø,\"\n \n 5*ô,\"\n \n 5*\"\n \n 5*\"\n \n 5*ð,\"\n \n 5*ì,\"\n \n 5*\"\n \n 5*\"\n \n 5*è,\"\n \nC\0\00CÿæÛ.»¶C;ª8?\"8\xA0MC\0\0\0\0!A\0!\x07A!C\0\0\0\0!C\0\0\0\0!C\0\0\0\0!\x1BC\0\0\0\0!)C\0\0\0\0!C\0\0\0\0!@C\0\0\0\0!\fC\0\0\0\0!\vC\0\0\0\0!\nC\0\0\0\0!C\0\0\0\0!C\0\0\0\0!\r@  \x07Aj\"\bAt\"7(àÞ\"N\r\0@A\0 kAt 5jA-j\"6*\"\r \r 5Aj Atj\"=*\"\r \r =*\0\"\r \r 6*\0\"\r \rC\0\00\"\rC\0\0\0\0 At\"6 5AÀ\x07jj*\0\" C\0\0\0\0]\x1B \v!\v \n \r!\n \r \rC\0\0\0? 5 6j*\0 \f!\f Aj\" G\r\0\v \f! \v! \n\"\rC(knN]\r\0 9A\x006\0\f\v \x07At\" T 3(:AÈ\0l\"6jj \r8\0 5A\xA0Í\0j 7j \rCÿæÛ.\"»¶\"\vC;ª8?8\0 5AÀ×\0j j \v8\0 6 Pj j \v8\0  Nj!7  Ij!6@} :@ 7*\0!\n 6*\0\f\v  Nj \v8\0  Ij \v8\0 \v\"\n\v\"\f» \n»D\0\0\0\0\0\0@\xA0dE\r\0 \f \v \v \n^@ 6 \fC\n×#¼\"\f8\0\f\v 7 \nC\n×#<\"\n8\0\v \rC}&!@ \v \f^@ 6 \v8\0 7 \vC\0\0pÁ\"\f \n \n \f]\x1B\"\n8\0 \v!\f\f\v \n \v^E\r\0 7 \v8\0 6 \vC\0\0pA\"\n \f \n \f]\x1B\"\f8\0 \v!\n\v 5AØ\0j j\"7  \"  ^j\"6*\0C\xA0éu?  Tj\"*\0\"\rC\0\0\0\0 *H\" *\" *Ø\"  *\xA0\"! *è\"\" *°\"# *ø\"$ \rC\0\0\0\0     ! \" # $C\0\0\0A»DVç¯Ò<\xA0¶\"\r \r\"  \rC¤p}?^\x1B\"\"\r \r ]\x1B\"\r8\0  \r! \x07A	O@  7A$k*\0!\v  !   ! ) !)  \v \n \f \nC¬Å'7! 6 \r8\0  \x07Ak²CÂõ<C\0\0? \"\n \n ]\x1B! \r \x07A\bk² \x1B!\x1B ! \b\"\x07AG\r\0\v 5 8ÐL 5 C\0\0 À\"\n8LA!A!@ At\"\b 5AÐÌ\0jj  \b(àÞ\"\x07 k²\"\v \vC\0\0>\"\f\"\r 5A\xA0Í\0j \bj*\0\"\v \v \r^\x1B\"8\0 5AÌ\0j \bj \n \f\"\n \vC\0\0 À\"\v \n \v^\x1B\"\n8\0 \x07! Aj\"AG\r\0\vA!AÀ! 5*ÄL!\v 5*M!\n@ \"\x07At\" 5AÐÌ\0jj\"\b \n  (àÞ\"k²\"\n \nC\0\0>\"\f\"\n \b*\0\"\r \n \r]\x1B\"\n8\0 5AÌ\0j j\" \v \f\"\v *\0\"\f \v \f^\x1B\"\v8\0 \x07Ak! \x07\r\0\v 9A,j!\bA\0!A\0!@C\0\0\0\0!  \bjAÿC\0\0\0\0 At\"\x07 5AÌ\0jj*\0 5A\xA0Í\0j \x07j*\0\"\n\"\v \vC\0\0\0\0]\x1BC\0\0\0\0 \n 5AÐÌ\0j \x07j*\0C\0\0 @\"\n \nC\0\0\0\0]\x1BC\0\0B»D\0\0\0\0\0\0à?\xA0ü\"\x07 \x07AÿN\x1B:\0\0 Aj\"AG\r\0\v@ P AÈ\0lj\"*\b!\n *!\f *\0!\r *D! *@! *<! *8! *4! *0! *,! *(!  *$!! * !\" *!# *!$ *!% *!& *\f!'A\0!C©_cX!\v@ \v \v  P AÈ\0lj\"\x07*D\"   \x07*@\"   \x07*<\"   \x07*8\"   \x07*4\"   \x07*0\"   \x07*,\"    \x07*(\"  ! \x07*$\"  \" \x07* \"  # \x07*\"  $ \x07*\"  % \x07*\"  & \x07*\"  ' \x07*\f\"  \n \x07*\b\"  \f \x07*\"  \r \x07*\0\" C\0\0\0\0\" \v ]\x1B  F\x1B!\v Aj\"A\bG\r\0\v  \v! Aj\"A\bG\r\0\vC\0\0\0\0!\vC\0\0\0\0C¤p}?C\0\0?  4Aã\0J\x1B 4AH\x1B! 3(Ü-!6A\0!\x07A!C\0\0\0\0!\rA\0!7C\0\0\0\0!C\0\0\0\0!\f@ \v!C\0\0\0\0!\vC\0\0\0\0!\n \x07Aj\"\bAt(àÞ\"4 \"J@@ \vA\0 kAt 5jA-j\":*\"\n \n 5Aj Atj\"=*\"\n \n =*\0\"\n \n :*\0\"\n \n!\v Aj\" 4G\r\0\v \vC\0\00!\n\v ] \x07At\"j\":  :*\0\"\v \n \n \v]\x1B\"\v8\0 \f \n!  \n \n ]\x1B\" \nC(knN]@ \b \b 7 \n ( 4 k²\"^\x1B \v + ^\x1B!7\v  \n  \x07A\vI\"\x1B!\v \f  \x1B!\f 5AÐÕ\0j j \n \rC\n×#<CÍÌL= \x07 6H\x1B]6\0 \rCÍÌL=\"\r \n \n \r]\x1B!\r 4! \b\"\x07AG\r\0\v@ 3(\bA÷G@ 5(VA\0G!\f\v 3  3*¸8\"\v C´¢9\"\n \n \v]\x1B\"\v8¸8@ \v (C\0\0 AC\0\0ðA 6AF\"\x1B\"\fC\0\0@@C\0\0 C^E@ \n ( \fC\0\0 C^E\r\vA!7\v \n !\f 5 \nC\n×#<CÍÌL= \x1B \r]\"6V\v C\0\0\0>C\0\0A 9  \fC\0\0? \f ^\x1B8( 7AF@A \r\v 7 7Ak\"AK\r\0  7 7At 5jAÌÕ\0j(\0\x1B\v!6! 3 3*:C¦D»\"\v »(¶C\0\0\xA0A\"\n \n \v]\x1B\"\v8: 3 C\0\0?  3*:\"\f \f \n \vC\0\0ðÁ]\x1B8: 3(:!\bA\0!\x07 5*üW!\n 5*øW!\v 5*ôW!\f 5*ðW!\r 5*ìW! 5*èW! 5*äW! 5*àW! 5*ÜW! 5*ØW! 5*ÔW! 5*ÐW! 5*ÌW! 5*ÈW! 5*ÄW! 5*ÀW!A\0!@ 5A\xA0×\0j Atj At\"*ìß \n *èß \v *äß \f *àß \r *Üß  *Øß  *Ôß  *Ðß  *Ìß  *Èß  *Äß  *Àß  *¼ß  *¸ß  *´ß  *°ß C\0\0\0\08\0 Aj\"A\bG\r\0\v@ \x07AtA°ßj!4A\0!C\0\0\0\0!\v@ 4 At\"Ar\"7j*\0C\0\0\0? 7 Ij*\0 7 Nj*\0  4j*\0C\0\0\0?  Ij*\0  Nj*\0 \v!\v Aj\"AG\r\0\v 5AðÍ\0j \x07Atj \v8\0 \x07Aj\"\x07A\bG\r\0\v 9C\0\0? C\0\0A\"C\0\0\0? C\0\0A \bA\nH\x1B 8 3 C\0\0A\"\n 3*Ø-CÍÌL?\"\v \n \v^\x1B\"\n8Ø- 9 \x1BC\0\0<8\b 3AÎ\0 \b \bAÎ\0N\x1BAj6: 3 3(:AjA\bo6: 9 \n8 5 3*¼9\"CÎª·¿ 3*Ü8\"Cj2? 5*\xA0W\" 3*9\"\"C.âû½ 3*¼8\" 3*ü8\"\"Cßàû>\"\v8°V 5 3*À9\"%CÎª·¿ 3*à8\"Cj2? 5*¤W\" 3*\xA09\",\"&C.âû½ 3*À8\" 3*9\"\"'Cßàû>\"\f8´V 5 3*Ä9\"-CÎª·¿ 3*ä8\" Cj2? 5*¨W\" 3*¤9\".\"/C.âû½ 3*Ä8\"! 3*9\"\"\"0Cßàû>\"\r8¸V 5 3*È9\"\nCÎª·¿ 3*è8\"1Cj2? 5*¬W\"\x1B 3*¨9\"2C.âû½ 3*È8\"# 3*9\"$Cßàû>\"8¼V 3 \nC\0\0? \"\n  \x1B8È9 3 \n -  8Ä9 3 \n %  8À9 3 \n   8¼9 5  CMÖ\b¿ /CMÖ\b? 0CMÖ¾8ØV 5 CMÖ\b¿ &CMÖ\b? 'CMÖ¾8ÔV 5 CMÖ\b¿ CMÖ\b? CMÖ¾\"%8ÐV 5 \x1B 2Cæè!? # $Cæè¡>\"&8ÌV 5  .Cæè!? ! \"Cæè¡>\"'8ÈV 5  ,Cæè!?  Cæè¡>\"8ÄV 5  Cæè!?  Cæè¡>\"8ÀVA 6 \bAH\x1B!W 3*Ü9!@ \bAL@ 3*ü9!\v 3*ô9!\r 3*ð9! 3*ì9! 3*è9! 3*ä9! 3*à9!\f\f\v 3 \n  \v  \v\"8Ü9 3 \n 3*à9 \f  \f\"\f8à9 3 \n 3*ä9 \r  \r\"8ä9 3 \n 3*è9   \"8è9 3 \n 3*ì9   \"8ì9 3 \n 3*ð9   \"8ð9 3 \n 3*ô9 '  '\"\r8ô9 3 \n 3*ø9 &  &8ø9 3 \n 3*ü9 %  %\"\v8ü9\v 5  5*ðM8°V 5  5*ôM8´V 5  5*øM8¸V 5 \x1B 5*üM8¼V 3 8Ü8 3 8\xA09 3 8¼8 3 89 3 8à8 3 \"8¤9 3 8À8 3  89 3 !8ä8 3 $8¨9 3 8Ä8 3 189 3 #8è8 3 \x1B8È8 3 89 3 8ü8 3*9!\n 3 3*ì889 3 \n8¬9 3 3*Ì88ì8 3 5*°W8Ì8 3*9!\n 3 3*ð889 3 3*Ð88ð8 3 \n8°9 3 5*´W8Ð8 3 3*98´9 3 3*ô889 3 3*Ô88ô8 3 5*¸W8Ô8 3 3*98¸9 3 3*ø889 3 3*Ø88ø8 3 5*¼W8Ø8 5 \vCõ¿8üV 5 \rCt`¡¿8ôV 5 C¸s\nÀ8ðV 5 C[|qÀ8ìV 5 C¹ÅÌ¿8èV 5 C#¤â¿8äV 5 \fCk^À8àV 5 CëµÀ8ÜV 5 C®G¿8øV 5 9*Cµo¾8W 9*!\n 5 )C\0\0AC=d>¿8W 5 \nC49¿8W 5 9*\bCÁ=8W 5 3*:Câ½8WAðé 5AË\0j\"\b 5A°Ö\0jA\0!A\0!A\0!\x07#\0Ak\"7$\0@A°(\0\"4A\0L\r\0A¬(\0!= 4Aq!GA\xA0(\0!6@ 4Ak\"AAO@ 4Aüÿÿÿ\x07q!J@ 7Aj\": Atj  6j,\0\0²8\0 Ar\"EAt :j 6 Ej,\0\0²8\0 Ar\"EAt :j 6 Ej,\0\0²8\0 : Ar\"EAtj 6 Ej,\0\0²8\0 Aj! \x07Aj\"\x07 JG\r\0\v GE\r\v@ 7Aj Atj  6j,\0\0²8\0 Aj! Aj\" GG\r\0\v\v 4Al!: =Aþÿÿÿ\x07q!E =Aq!? =Ak!GA¤(\0!JA\0!6@ =A\0J@ 6 Jj! 7Aj 6Atj\"C*\0!\nA\0!A\0!\x07@ G@@  Ar\"B :lj,\0\0² \b BAtj*\0   :lj,\0\0² \b Atj*\0 \n!\n Aj! \x07Aj\"\x07 EG\r\0\v ?E\r\v   :lj,\0\0² \b Atj*\0 \n!\n\v C \n8\0\v 6Aj\"6 4G\r\0\v 4Aþÿÿÿ\x07q!C 4Aq!BA¨(\0!EA\0!6@ 6 Ej!? 7Aj 6Atj\"F*\0!\nA\0!A\0!\x07A\0!@ A@@ ? Ar\" :lj,\0\0² < Atj*\0 ?  :lj,\0\0² < Atj*\0 \n!\n Aj! \x07Aj\"\x07 CG\r\0\v ! BE\r\v ?  :lj,\0\0² < Atj*\0 \n!\n\v F \n8\0 6Aj\"6 4G\r\0\vA\0!@ 7Aj Atj\"C\0\0¿C\0\0? *\0C\0\0\0<C\0\0\0?\"\n \n \n\"\nC4Ï\x1B?CãÈÀB \nCË!nD \nC->AC\x1B¯ÎC \nCV.nD\"\n \nC\0\0?^\x1B\"\n \nC\0\0¿]\x1BC\0\0\0?C\0\0\0?8\0 Aj\" 4G\r\0\v 4Aq!CA\xA0(\0 4j!6A\0!\x07A\0!@ AAO@ 4Aüÿÿÿ\x07q!BA\0!@ 7Aj\"? Atj  6j,\0\0²8\0 Ar\"FAt ?j 6 Fj,\0\0²8\0 Ar\"FAt ?j 6 Fj,\0\0²8\0 ? Ar\"FAtj 6 Fj,\0\0²8\0 Aj! Aj\" BG\r\0\v CE\r\v@ 7Aj Atj  6j,\0\0²8\0 Aj! \x07Aj\"\x07 CG\r\0\v\v =Aþÿÿÿ\x07q!? =Aq!C 4 Jj!BA\0!6@ =A\0J@ 6 Bj! 7Aj 6Atj\"F*\0!\nA\0!A\0!\x07@ G@@  Ar\"Q :lj,\0\0² \b QAtj*\0   :lj,\0\0² \b Atj*\0 \n!\n Aj! \x07Aj\"\x07 ?G\r\0\v CE\r\v   :lj,\0\0² \b Atj*\0 \n!\n\v F \n8\0\v 6Aj\"6 4G\r\0\v 4Aþÿÿÿ\x07q!C 4Aq!B 4 Ej!FA\0!6@ 6 Fj!? 7Aj 6Atj\"Q*\0!\nA\0!A\0!\x07A\0!@ A@@ ? Ar\" :lj,\0\0² < Atj*\0 ?  :lj,\0\0² < Atj*\0 \n!\n Aj! \x07Aj\"\x07 CG\r\0\v ! BE\r\v ?  :lj,\0\0² < Atj*\0 \n!\n\v Q \n8\0 6Aj\"6 4G\r\0\vA\0!@ 7Aj Atj\"C\0\0¿C\0\0? *\0C\0\0\0<C\0\0\0?\"\n \n \n\"\nC4Ï\x1B?CãÈÀB \nCË!nD \nC->AC\x1B¯ÎC \nCV.nD\"\n \nC\0\0?^\x1B\"\n \nC\0\0¿]\x1BC\0\0\0?C\0\0\0?8\0 Aj\" 4G\r\0\v 4Aq!?A\xA0(\0 4Atj!6A\0!\x07A\0!@ AAO@ 4Aüÿÿÿ\x07q!CA\0!@ 7 Atj  6j,\0\0²8\0 7 Ar\"BAtj 6 Bj,\0\0²8\0 7 Ar\"BAtj 6 Bj,\0\0²8\0 7 Ar\"BAtj 6 Bj,\0\0²8\0 Aj! Aj\" CG\r\0\v ?E\r\v@ 7 Atj  6j,\0\0²8\0 Aj! \x07Aj\"\x07 ?G\r\0\v\v@@ AE@A\0!\f\v 4Aq 4Aþÿÿÿ\x07q!?A\0!A\0!\x07@ At\" 7Aj\"Cj  <j*\0 7Aj j*\08\0 C Ar\"j  <j*\0 7Aj j*\08\0 Aj! \x07Aj\"\x07 ?G\r\0\vE\r\v At\" 7Ajj  <j*\0 7Aj j*\08\0\v =Aþÿÿÿ\x07q!? =Aq!C J 4At\"Bj!JA\0!6@ =A\0J@ 6 Jj! 7 6Atj\"F*\0!\nA\0!A\0!\x07@ G@@  Ar\"Q :lj,\0\0² \b QAtj*\0   :lj,\0\0² \b Atj*\0 \n!\n Aj! \x07Aj\"\x07 ?G\r\0\v CE\r\v   :lj,\0\0² \b Atj*\0 \n!\n\v F \n8\0\v 6Aj\"6 4G\r\0\v 4Aþÿÿÿ\x07q!= 4Aq!G B Ej!JA\0!\b@ \b Jj!6 7 \bAtj\"E*\0!\nA\0!A\0!A\0!\x07@ A@@ 6 Ar\"\x07 :lj,\0\0² 7Aj\"? \x07Atj*\0 6  :lj,\0\0² At ?j*\0 \n!\n Aj! Aj\" =G\r\0\v !\x07 GE\r\v 6 \x07 :lj,\0\0² 7Aj \x07Atj*\0 \n!\n\v E \n8\0 \bAj\"\b 4G\r\0\vA\0!@ 7 At\"j\"\x07 7Aj j*\0\"\n  <j*\0C\0\0? \nC\0\0¿C\0\0? \x07*\0C\0\0\0<\"\n \n \n\"\nC4Ï\x1B?CãÈÀB \nCË!nD \nC->AC\x1B¯ÎC \nCV.nD\"\n \nC\0\0?^\x1B\"\n \nC\0\0¿]\x1B8\0 Aj\" 4G\r\0\v 4At\"E\r\0 < 7 ü\n\0\0\v 7Aj$\0Að 5A¨Ö\0j < 9 5*¬V8$ 5*¨V!\n 9 W6  9 \n8 3 W6Ü- 9A6\0 9 8\f\v D Oj!D H Ok\"HA\0J\r\0\v\v 3 \\ k6:\v 3 @Aüj  5AàØ\0j$\0\f\vA!M \0(è;@ \0AÐjA\0A¨í\0ü\v\0\vA!S\v LE@ \0A6\v \0A\x006Ðo @(ü\";@ \0(AxF@ \0C\0\0? @AüjAA \0(o\"Aê\x07F\x1BA \x1Bj*\0C\0\0ÈB»D\0\0\0\0\0\0à?\xA0ü6\v \0AÍ\b @(\"A\rH\r\0AÎ\b AI\r\0AÏ\b AI\r\0AÐ\bAÑ\b AI\x1B\v6Ðo\v \0(t!\x07@ L\r\0 @*\xA0CÍÌÌ=^E ;A\0Gq\r\0 \0*ØoCw¾?!\n@  \x07l\"A\0J@ Aq!\bA\0!<C\0\0\0\0!\vA\0!4@ AO@ Aüÿÿÿ\x07q!	A\0!8@  4Atj\"*\f\"\f \f *\b\"\f \f *\"\f \f *\0\"\f \f \v!\v 4Aj!4 8Aj\"8 	G\r\0\v \bE\r\v@  4Atj*\0\"\f \f \v!\v 4Aj!4 <Aj\"< \bG\r\0\v\v \n \v ³\"\f^\r Aq!A\0!<C\0\0\0\0!\vA\0!4@ AO@ Aüÿÿÿ\x07q!\bA\0!8@  4Atj\"*\f\"\n \n *\b\"\n \n *\"\n \n *\0\"\n \n \v!\v 4Aj!4 8Aj\"8 \bG\r\0\v E\r\v@  4Atj*\0\"\n \n \v!\v 4Aj!4 <Aj\"< G\r\0\v\v \v \f!\n\f\v \nC\0\0\0\0 ²\"\v^\r\0 \v!\n\v \0 \n8Øo\v Aè;H!\bC\0\0\0\0!\v@ \x07AG\r\0 \0(|AF\r\0C\0\0\0\0!\nC\0\0\0\0!\rC\0\0ÈAA2 \0( m\" A2L\x1B³!\f AN@ Ak!	A\0!\x07@ \r  \x07Atj\"*\" *\" *\" *\" *\b\" *\f\" *\0\" *\"!\r \n        !\n \v        !\v \x07Aj\"\x07 	H\r\0\v\v \0A¼ï\0j\"C\0\0\0\0C\0\0? \f * \f \rC\0\0\0\0 \vC(knN] \nC(knN]q\"\x07\x1B\"\r \rC\0\0\0\0]\x1B\"\r8 C\0\0\0\0 \f \nC\0\0\0\0 \x07\x1B *\b\"\n \n\"\n \nC\0\0\0\0]\x1B\"\n8\b C\0\0\0\0 \f \vC\0\0\0\0 \x07\x1B *\0\"\v \v\"\v \vC\0\0\0\0]\x1B\"\v8\0@ \v \n \n \v]\x1BC·Q:^E@ *!\n\f\v  \r \v\"\v \n\"\f\"\n \n \r^\x1B\"\r8  *\f\" \v\"\v \f\"\f \vC}& \f\"\v \vC\0\0? \r \nC}&\"\n \n\"\n \nC\0\0?^\x1B  ²\"\v\"\n8\f  *C\n×£¼ \v\"\v \n \n \v]\x1B\"\n8\vC\0\0? \nC\0\0\xA0A\"\n \nC\0\0?^\x1B!\v\v Aè; \b\x1B!<A!3 \0(!@ \0(¨\"4AF@AàÆÛ\0!4\f\v 4AxG\r\0 \0(t l A<l mj!4\v \0 4 < Al m\"6lAtAm\"  4J\x1B\"86¤  m!5 \0(\"7E@ \0 6 8Al 6mAjA\bm\" <  <H\x1B\"3lAtAm\"86¤A 3 3AL\x1B!<\v@@ <AH\r\0 8 5AlH\r\0 5A1J\r 5 <lA¬H\r\0 8AàH\r\0 \0((!\x07 \0(,!: \0(t!>A\0!4 8\f\v \0(¨o\"AÍ\b \x1B!A\0!A\0!4A2 5 5AFAê\x07 \0(o\"Aè\x07 \x1B 5Aä\0J\x1B\"8Aè\x07Gq\"\x1B\"AJ@ \f\v@ AG@ 8Aè\x07G\r A\nF\r\v A\rH!Aè\x07!8AA A\fF\x1B\f\vA2 m!A!A2\v\"AM@@ 4Aj!4 At\"AH\r\0\v 4At!4\v@ AÐ\bH\r\0 8Aè\x07G\r\0AÏ\b\f\v@ AÎ\bG\r\0 8Aê\x07G\r\0AÍ\b\f\vAÐ\b  8Aé\x07F\x1B  AÑ\bH\x1B\v! \0(øn! @@@ 8Aè\x07k\0\v 4Aðj AtAà\0jr\f\v 4AÎ\b  AÎ\bL\x1BAtAà\0qAÀsr\f\v 4Aðj AtrAà\0r\vAA\0 AF\x1Br r:\0\0 AF@  :\0\vAA AI\x1B!4 \0(\rA} < 4 4 <H\x1B\"\0  4 \0\x1B!4\f\v \0((!\x07 \0(,!: \0(t!>A\0!4 8 5A2F\r\0A!4 >AXlAk 5A2kl 8j\v! 7  Atm j\v :AÚ\0j\"AlAä\0m\"\b \x07l \x07A\flAj\"Hm!9Aÿ\0!@@@ \0(A¹k\0\vA\0!\f\v \0(\"A\0N@Aó\0 AÇlA\bv\" Aó\0O\x1B  \0(pAF\x1B!\f\vAó\0A0 \0(pAF\x1B!\v@@ \0(|\"	AxG@ >AG\r \0 	6øn\f\v >AG\r\0 \0AA  lAÐlAvAý\0AÐ \0(ønAF\x1Bj \b 9kH\x1B\"	6øn\f\v \0 >6øn >!	\v 8!\b 4@ 	AXlAk 5A2kl \bj!\b\v \0 ; LrE \0(¼A\0Gq\"96< 7 \b \bAtm \bj\v AlAä\0m\"D \x07l Hm!=@@@@@@@@ \0(p\";Ak\0\v \0(\"\bAxG\r \0Aè\x07Aê\x07 D =kC\0\0? \v\"\nC\0\0zG \vC\0à+Gü\0 \nC\0@F \vC\0@Fü\0\"\bk  llAu \bj\"\bAÀ>j \b ;AF\x1B\"\bA\xA0k \bA\xA0j \b \0(o\"\bA\0J\x1B \bAê\x07F\x1BH\x1B\"\b6o@@ \0(0E\r\0 \x07A kAuL\r\0 \0(ÀAF AIq\rAè\x07!\b \0Aè\x076o\v 9 Aä\0KqE\r\0Aè\x07!\b \0Aè\x076o\v <Að¥A\xA0 4\x1B 6mA\bmN\r\v \0Aê\x076o \0Aï\0j!9  Aä\0mH!Aê\x07!\b\f\v \0 \b6o\v \0Aï\0j!9  Aä\0m\"DH! \bAê\x07F\r  DN\r ;AG\r\f\vAè\x07!\b \0Aè\x076o  Aä\0mH\r \0A´j!I \0Aï\0j!9A\0!\f\vAê\x07!\b 9Aê\x076\0\v \0A´j!I ;AF\r\0 \0(´E\r\0Aê\x07!\b 9Aê\x076\0\v \0(o\";A\0L@A\0!DA!RA\0\f\v@ ;Aê\x07G\r\0 \bAê\x07F\r\0A!DA!XA\0\f\v \bAê\x07G@A!RA\0!DA\0\f\vAê\x07!\bA!RA\0!DA\0 ;Aê\x07F rAq\r\0 9 ;6\0A\0!RA!X ;!\bA\v!= 8@ 	AG\r\0 \0(\xA0oAG\r\0 \0(H\r\0 ;Aê\x07F\r\0 \bAê\x07F\r\0 \0A6øn \0A6HA\f\v \0A\x006H 	AXlAk\v 5A2klA\0 4\x1Bj! 7  Atm j\v AlAä\0m!	@@@ \bA~qAè\x07F@ :AL@ 	AtAm!	\v 	 \x07 	l \x07AlA\njmk\f\vAê\x07!8 \bAê\x07F@A\0!7A! :AJ\r 	A	lA\nm!	\f\v 	 \x07 	l Hmk\v!	Aê\x07!8A\0!A\0!7@ ;Aê\x07G\r\0 Y > \0(¸ @A jSA!7 \0(o\"\bAê\x07G\r\0A!\f\v \0(´oE@ \0(XE\r\v \b!8\v \0(t  l\"\x07A¨Õ(\0AÈÕ(\0\"klAu j! \x07A\xA0Õ(\0AÀÕ(\0\"\bklAu \bj!\b@@ \0@@ \0(´o\">E@AÑ\b!4 	  \x07A¬Õ(\0AÌÕ(\0\";klAu ;j\";A\0 ;k \0(¬oAÑ\bH\x1BjH\rA\f\v  	J\rAÑ\b\f\v \x07A¤Õ(\0AÄÕ(\0\"klAu j! \0(¬oAÐ\bN@ \b k!\b\f\v  \bj!\b\v \b 	L@AÐ\b!4A\f\v \x07AÕ(\0A¸Õ(\0\"klAu j!\b \x07AÕ(\0A°Õ(\0\"klAu j! >E@AÏ\b!4A\0 	 \b \x07AÕ(\0A¼Õ(\0\";klAu ;j\";A\0 ;k \0(¬o\";AÏ\bH\x1BjN\r \x07AÕ(\0A´Õ(\0\"\bklAu \bj!\x07 ;AÎ\bH\r  \x07k!\f\v \b 	J\rAÏ\b\v\"46¨o \0 46¬o\f\v  \x07j!\vAÍ\bAÏ\b  	J\x1B!4A\0\v! \0 46¨o \0 46¬o  >r\r \0(\\ Asr\rAÏ\b!4 \0AÏ\b6¨o\f\v \0(¨o!4 \b!8\v \0(\" 4H@ \0 6¨o !4\v \0(\"AxG@ \0 6¨o !4\v@ 8Aê\x07F\r\0 6 <lAtA¿J\r\0 \0AÏ\b 4 4AÏ\bN\x1B\"46¨o\v@ \0(\"\bAÀ»J@ 4!\x07\f\vAÐ\b!\x07@@@@ 4AÐ\bL@ \bAý\0N@ 4!\x07\f\v 4AÐ\bF\r \bAáÝ\0H\r 4!\x07\f\v \0AÐ\b6¨o \bAý\0N\r\vAÏ\b!\x07 \0AÏ\b6¨o \bAáÝ\0N\r\f\v 4AÎ\bJ\r\0 \bAÀ>J@ 4!\x07\f\v 4\"\x07AÎ\bG\r\f\vAÎ\b!\x07 \0AÎ\b6¨o \bAÀ>J\r\vAÍ\b!\x07 \0AÍ\b6¨o\v@ AxG\r\0 \0(Ðo\"\bE\r\0 \0 \b@ \0(øn\"AÐl 	N@ E\rAÍ\b\f\v  	 AÀ»lLqE\r\0AÎ\b\f\vAÏ\b A°êl 	N\r\0AÑ\bAÐ\b 	 Aà×lJ\x1B\v\"  \bH\x1B\"6Ðo \0 \x07   \x07J\x1B\"\x076¨o\v \0A\0  \0(0E \0((\"Err\r\0Aý\0A  AN\x1Bk!\b \0(8\">AF!; AH! \x07!4@@ 4At\"Aèj(\0 Aìj(\0\"A\0 ;\x1BkA\0  >\x1Bj \bl\"AÿÿqAlAv AuAlj! \r  	H\r 4AÍ\bJ@ \0 4Ak\"46¨o\f\v\v \0 \x076¨oA\0\f\v  	H\v68 \0(pAG@ @ K6\0 ZAÄ @	 9(\0!8\v@ 8Aê\x07G\r\0 \0(¨oAÎ\bG\r\0 \0AÏ\b6¨o\v@@@@@@ I(\0@AÍ\b!4 \0AÍ\b6¨o\f\v \0(¨o!4@ \0(pAG\r\0 4AÏ\bL\r\0AÏ\b!4 \0AÏ\b6¨o\f\v 8Aè\x07G\r\0 4AÏ\bJ\r\v@ 8Aé\x07G\r\0 4AÏ\bJ\r\0Aè\x07!8 9Aè\x076\0\v  \0(\"A2m\"\bJ\r 8!\f\v \0Aé\x076o  \0(\"A2m\"\bJ\r  AlA2mJ\r\f\vAè\x07! 8Aè\x07G\r\v  Al\"\x07A2m\"4L\r Aè\x07G\r\0 AtAm F@ Am!\b\f\v 4 \b  \x07AmF\x1B!\b\v  \bm! MAG@ \0 S6à; \0 M6Ü;\v@@ \0(\r\0 \0(¨AF\r\0 3A\0H\r 3   3J\x1B!\v @A} Ak\"KAsAt AF\x1B j j\"5AjApqk\"$\0 @A\x006$@ \0(H\"A@ \0A6|\f\v \0 \0(øn6\xA0o\vA\0!3@ A\0J@ \0AÄj!L 5 m!9 =E!H RE!6 MAF!MA\0!A\0!8@ \0A\x006H \0  KH6Üo 5 8k\"\x07 \0(¤Al \0(Al \bmmA\bm\"4 9 4 9H\x1B\"4H!> 6 E Hq =  KFq\"I\x1B!; ME@ L @Aüj \b\v \x07 4 >\x1B!N 6 ; R\x1B!O  \0(t \bl\"\x07 lAtj!>@ \x07A\0L@C\0\0\0\0!\vC\0\0\0\0!\n\f\v \x07Aq!:A\0!<C\0\0\0\0!\nC\0\0\0\0!\vA\0!4 \x07AO@ \x07Aüÿÿÿ\x07q!PA\0!\x07@ \n > 4Atj\";*\0\"\f \n \f]\x1B\"\n ;*\"\r \n \r]\x1B\"\n ;*\b\" \n ]\x1B\"\n ;*\f\" \n ]\x1B!\n \v \f \v \f^\x1B\"\v \r \v \r^\x1B\"\v  \v ^\x1B\"\v  \v ^\x1B!\v 4Aj!4 \x07Aj\"\x07 PG\r\0\v :E\r\v@ \n > 4Atj*\0\"\f \n \f]\x1B!\n \v \f \v \f^\x1B!\v 4Aj!4 <Aj\"< :G\r\0\v\vA}!4 \0 > \b  N @Aüj \v \n\"\n \n \v]\x1B *_ O D 7 	 I\"\x07A\0H\r @A j  \x07A\0H\r  \x07j! \x07 8j!8 3 \x07AFj!3 Aj\" G\r\0\v\v @A j    \0(E  3Gq! \0 A6HA}  A\0H\x1B!4\v\f\vAãÞ\0A¡&AØ\r\0\v \0    < @Aüj L X D 7 	 =!4\v @AÀj$\0 4\vAÉ\0A¡&Aÿ\v\0\vì\x07\b}	}@@@ At\" H@  k\"A\0L@C\0\0\0\0\f\v  ArG\r\f\vA\xA0\vAÕ%A\n\0\v  Aq\"k!@ \0 \fAtj\"\r*\" \rAj\" At\"j*\0 \r*\0\"\b \r j*\0 !   At\"j*\0 \b \r j*\0 \x07!\x07   \b \b ! \fAj!\f Aj\" G\r\0\v E\r\v \0 \fAtj\"\f*\0\" \f Atj*\0 !  \f Atj*\0 \x07!\x07   !\v  \v!\b@ A\0J@ \0 Atj!\r@@ Ak\"E@C\0\0\0\0!A\0!\f\f\v Aq Aþÿÿÿ\x07q!C\0\0\0\0!A\0!\fA\0!@  \r \fAt\"j*\0\"  \0 j*\0\"  \r Ar\"j*\0\"  \0 j*\0\" ! \fAj!\f Aj\" G\r\0\vE\r\v  \r \fAt\"\fj*\0\"  \0 \fj*\0\" !\v  ! \0 Atj!\r \0  kAtj!@@ E@C\0\0\0\0!A\0!\f\f\v Aq Aþÿÿÿ\x07q!C\0\0\0\0!A\0!\fA\0!@   \fAt\"j*\0\"  \r j*\0\"   Ar\"j*\0\"  \r j*\0\" ! \fAj!\f Aj\" G\r\0\vE\r\v   \fAt\"\fj*\0\"  \f \rj*\0\" !\v  !	C\0\0\0\0!A\0!\f@  \0  \fj\"\r kAtj*\0 \0 \r kAtj*\0 \0 \fAtj\"\r*\0 \r Atj*\0! \fAj\"\f G\r\0\v\f\vC\0\0\0\0! C\0\0\0\0\"	!\vA!\0  	\"	  \"\"\n \x07 \x07 \" \"\x07\"\v\" \nCo:]A }C\0\0?  \b  \v\"_\r\0C\0\0¿  `\r\0  \v8 }Cøÿÿ?  	  \b \x07\"C\0\0\0?\"_\r\0Cøÿÿ¿  `\r\0  \v8\0A\0\v\vçW3}#\0A k\"$\0@@@@ (\0\"\n (H\r\0 \n \0(DH\r\0 (HE\r \nA\0L\r \nA\x07q! \nA\bO@ \nAøÿÿÿ\x07q!\v@ \0 \bA°Ï\0lj\"A6àÐ A6° A6² A6Ðâ A6\xA0 A6ðÃ A6Àt A6% \bA\bj!\b \rA\bj\"\r \vG\r\0\v E\r\v@ \0 \bA°Ï\0ljA6% \bAj!\b 	Aj\"	 G\r\0\v\f\vAÂAÉ:A«\0\v \nA\0L\r\v \nA\x07q!A\0!\b \nAkA\x07O@ \nAxq!A\0!	@ \0 \bA°Ï\0lj\"\nA\x006Ù \nA\x006ì \nA\x006¼º \nA\x006ë \nA\x006Ü \nA\x006¬Ì \nA\x006ü| \nA\x006Ì- \bA\bj!\b 	A\bj\"	 G\r\0\v E\r\v@ \0 \bA°Ï\0ljA\x006Ì- \bAj!\b \fAj\"\f G\r\0\v\v@@@@@@@@@@ @@ (\b\"\bA¿»L@ \bAÀ>F\r \bAàÝ\0F\r \bAý\0G\r\f\f\v \bAÃØL@ \bAÀ»F\r \bAúF\r\f\f\v \bA÷F\r\0 \bAÄØG\r\v\v@ (\"\bAÀ>F\r\0 \bAý\0F\r\0 \bAàÝ\0G\r\v\v@ (\f\"	AÀ>F\r\0 	Aý\0F\r\0 	AàÝ\0G\r\v\v@ (\"\nAÀ>F\r\0 \nAý\0F\r\0 \nAàÝ\0G\r\v\v \b \nI\r\n \b 	K\r\n@@ (\"\bA\nk\v\0\v \bA(F\r\0 \bA<G\r\v ( Aå\0O\r (4AO\r (8AO\r ((AO\r (\0\"\bAkA}M\r (\"	AkA}M\r\x07 \b 	I\r\b ($A\vO\r	A\0\f\v\vAûÀ\0Aá\x1BA)\0\vAÿï\0Aá\x1BAÈ\0\0\vAÿï\0Aá\x1BAÌ\0\0\vAÿï\0Aá\x1BAÐ\0\0\vAÿï\0Aá\x1BAÔ\0\0\vAÿï\0Aá\x1BAØ\0\0\vAÿï\0Aá\x1BAÜ\0\0\vAÿï\0Aá\x1BAà\0\0\vAÿï\0Aá\x1BAä\0\0\vAÿï\0Aá\x1BAè\0\0\vAÿï\0Aá\x1BAÁ\0\0\vE@ A\x006\\@ ( \0(DL\r\0 \0AÐ\0j \0(¼(<! \0B7 \0B\x007\b \0A\x006\0 \0B7 \0(@AG\r\0 \0Aý\0j \0Aè-jAü\n\0\0 \0 \0)X7P\v (!	A! (\"\" \0(Ü$F@ \0(D 	G!\v \0AØ\0j! (\0!\b \0 	6D \0 \b6@ Aä\0l\"\n (\b\"\bm!@@@@ @ AG\r AF@  \0)p7  \0)h7 \0(¸$!\v\vA\0!\b@ 	A\0J@ AG!\n\f\v A\n6 ($!+ A\x006$\f\v@@  \bA°Ï\0lj\"	 	(ä'< \nE@ 	 )7 	 )7 	 \v6 \vE@ \bAj\"\b (\"	N\r\f\v\vA\fAÉ:Aë\0\v (!\" A\n6 ($!+A\0! A\x006$ 	A\0L\r 	Aq!\fA\0!\rA\0!\b@ 	AI\r\0 	Aüÿÿÿ\x07q!A\0!\v@  \bA°Ï\0lj\"\nA6Ø \nA\x006Ì \nA6¨Ã \nA\x006Ã \nA6øs \nA\x006ìs \nA6È$ \nA\x006¼$ \bAj!\b \vAj\"\v G\r\0\v \f\r\0\f\v@  \bA°Ï\0lj\"\nA6È$ \nA\x006¼$ \bAj!\b \rAj\"\r \fG\r\0\v\f\v A\0H\r \b l \nG\r \b \"l!\bA\0!\" Aè\x07l \bJ\r\v@@@@ 	A\0L\r\0A\0!	@A\0!\f  	A°Ï\0lj!\b \0(P!\n 	AF \0(¸$A\0\v!\r \b (460 \b (86Ä$ \b (\b\"\v6Ì# \b (\f6Ô# \b (6Ø# \b (6Ü# \b ((6¨0 \b (\x006ø, (! \b 	6- \b \n6¸# \b 6ü,@@ \b(¼$E\r\0 \b(È$\r\0A\0!\n \v \b(Ð#F\r \b(à#\"\vA\0L\r \b \vZ\f\v \b \r \b(à#\"\vE@ \b( !\v\v \vAtE@ \b(Ü#\"\n \b(Ì#\"\v \n \vH\x1BAè\x07m\f\v \b(Ô#!@@ \vÁAè\x07l\"\n \b(Ì#\"J\r\0 \n J\r\0 \n \b(Ø#N\r\v    J\x1B\"\n \b(Ø#\"\v \n \vJ\x1BAè\x07m\f\v \b(\"AN@ \bA\x006\v@@ \b(¸#E@ (DE\r\v \b(Ü#\" \nH@@@ \b(@ (D\r A\0J\r\f\v \bB\x007 \bA6 (DE\r\v \bA\x006A\fA\b \vAF\x1B\f\v \bA~6 \v\f\v \n H@ (D@ \bB\x007 \bB7A\fA \vA\bF\x1B\f\v \b(E\r \bA6 \v\f\v \b(A\0N\r\0 \bA6\v \v\f\v A6\\  (<\"\n \nAl (Ajmk6< \v\v \r\x1B\"\nZ!A\0!\r (\"\v \b($G@@@@ \vA\nk\v\0\v \vA(F\r \vA<F\r\vA!\r\v@ \vA\nL@ \bA6ð, \b \nÁ\" \vÁl6è# \bAA \vA\nF\x1B6ä# \b Al6Ä# \b(à#A\bF@ \bA©ý\x006Ð$\f\v \bAý\x006Ð$\f\v \bA6ä# \b \vAn6ð, \b \nÁ\"Al6è# \b Al6Ä# \b(à#A\bF@ \bAý\x006Ð$\f\v \bAðü\x006Ð$\v \bA\x006$ \b \v6$\v@@@@@ \nAK\r\0A \ntA¢qE\r\0@@ \b(ä#\"Ak\0\0\vAÍÒ\0A´/Aò\0\v@ \n \b(à#G@ \bA\x006è8 \bB\x007à8 \bA\x006ô, \bA\x006ì, \bB\x007 \bA\x006$ \bAjA\0A\xA0\"ü\v\0A\n!\v \bA\n:\0à8 \bA6¸$ \bAä\x006À# \b \n6à# \bA\0:\0½# \bA6# \bAä\x006ü\" \nA\bF@A¨!Aý\0A©ý\0 AF\x1B\f\vA¨Aô \nA\fF\"\v\x1B!A\nA \v\x1B!\vAðü\0Aý\0 AF\x1B\v! \b 6Ô$ \b \v6\xA0$ \b 6Ð$ \b \nAl\"\v6ì# \b \nAt6ô# \b \nAl6ð# \b \nAl6È# \b \v l6è# \bA\xA0AA \nA\fF\x1B \nAF\x1B6Ì$ \bAA AF\x1B \nl6Ä#\f\v \b(è# \b(ì# lG\r\v ($\"A\vO\r@@@@ \0\v \bAÍ6¬$ \bBà\x007¤$ \bA\f6$ \bA\x006À$ \bA6´$ \bB7$\f\x07\v \bA6¬$ \bB7¤$ \bA6$ \bA\x006À$ \bA6´$ \bB7$\f\v \bAÍ6¬$ \bBà\x007¤$ \bA\f6$ \bA\x006À$ \bA6´$ \bB7$\f\v AM@ \bA6¬$ \bA6¤$ \bA6$ \bA\x006À$ \bA6´$ \bB7$\f\v AM@ \bAñú6¬$ \bA6¤$ \bA6$ \bA6´$ \bB7$ \b \nA×\x07l6À$ \b \nAl\"\v6ø#A\n\f\v \nA×\x07l! \nAl!\v A\x07M@ \bAÒð6¬$ \bBÀ7¤$ \bA6$ \b 6À$ \bA\b6´$ \bB7$ \b \v6ø#A\f\f\v \bA³æ6¬$ \bB7¤$ \bA6$ \b 6À$ \bA6´$ \bB7$ \b \v6ø#A\f\vA·Ï\0A´/Añ\0\vAþA´/A®\0\vA´â\0A´/A»\0\v \b \nAl\"\v6ø#A\b\f\v \b \nAl\"\v6ø#A\v! \b 6$ \b \nAl \vAtj6ü# \b  \b(\xA0$\"\n \n J\x1B6¨$ \b ( \"\n6$ \b(¬0!\v \b (0\"6¬0 @ \b \vA \nAuAÍl \nAÿÿqA³æ\0lAvkA\x07j\"\n \nAL\x1BA\x07\v6°0\v \r j!\n \bA6¼$\v \n\v\"\r@ \b(¸$A\0G rAqE\r\0 \0(È-A\0L\r\0 \bAô$j!\n@ \n \fAtjA\x006\0 \fAj\"\f \0(È-H\r\0\v\v \b \b(06\xA00 	Aj\"	 (\"\bH\r\0\vA\0! \bAG\r\0 \0(¸$!\f\f\v \0(¸$\"\f \0(èsG\r\v \0Aø1j!0 \0A1j!1 \0AÌ%j!2 \0A3j!3A  AL\x1B\"\bAþÿÿÿ\x07q!4 \bAv\"&Ak!5 \0AÑ\0j!6 \0Aèj!, \0Aøô\0j!- \0AÐ\0j!7 \0A4j!# \0Aüô\0j!8 \0A\"j!' \0Aô÷\0j!$ \0Að÷\0j!. \0Aý\0j!( \0AÀ(j!) \0AÄ(j! \0Aè-j!%  \f A\nl\"9l\"/ \0(¤$l \fAè\x07lmAtAjApqk\"$\0@ \0(À$ \0(Ä-\"	k\"\b / \b /H\x1B\"\n \0(¤$l \0(¸$Aè\x07lm!@@@@@@@ (\0Ak\0\v@@ (Ak\0\v \0(Ì-!\v@ A\0L\"\r\r\0A\0!\f AG@ Aq Aþÿÿÿ\x07q!A\0!\b@  \fAtj  \fAtj*\0C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0  \fAr\"Atj  Atj*\0C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0 \fAj!\f \bAj\"\b G\r\0\vE\r\v  \fAtj  \fAtj*\0C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0\v@ \0(HAG\r\0 \v\r\0 ( %Aü\n\0\0\v %  	Atj   \0 \0(Ä- \nj6Ä- \0(ðs \0(ô|\"	k\"\n \0(ès 9l\"\f \n \fH\x1B!\n j!\v@ \r\r\0A\0!\f AG@ Aq Aþÿÿÿ\x07q!A\0!\b@  \fAtj  \fAtj*C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0  \fAr\"Atj  Atj*C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0 \fAj!\f \bAj\"\b G\r\0\vE\r\v  \fAtj  \fAtj*C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0\v ( $ 	Atj   \0 \0(ô| \nj6ô| \vj! \0(Ä-!\f\f\vA\0!\f A\0J@@  \fAtj  \fAtj\"\b*\0 \b*C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0\"\bÁAv \bAqj;\0 \fAj\"\f G\r\0\v\v % ) 	AtjAj   j!@ \0(HAG\r\0 \0(Ì-\r\0 ( . \0(ô|AtjAj   j! \0(À$\"\bA\0L\r\0 . \0(ô|Atj!	 ) \0(Ä-Atj!\vA\0!\f \bAG@ \bAq \bAþÿÿÿ\x07q!A\0!@ \v \fAt\"\bj\" \b 	j. .jAv; \v \bAr\"\bj\" \b 	j. .jAv; \fAj!\f Aj\" G\r\0\vE\r\v \v \fAt\"\bj\"\f \b 	j. \f.jAv;\v \0 \0(Ä- \nj\"\f6Ä-\f\v (AG\r@ A\0L\r\0A\0!\f AG@ Aq Aþÿÿÿ\x07q!\rA\0!\b@  \fAtj  \fAtj*\0C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0  \fAr\"Atj  Atj*\0C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0 \fAj!\f \bAj\"\b \rG\r\0\vE\r\v  \fAtj  \fAtj*\0C\0\0\0G\";C\0\0\0Ç ;C\0\0\0Ç^\x1B\";C\0þÿF ;C\0þÿF]\x1Bü\0;\0\v %  	Atj   \0 \0(Ä- \nj\"\f6Ä- j!\v (\0!: \0A\x006PA\0 \0(À$\"\b \fJ\r \b \fG\r (\"\bAG@ \0(ô| \0(ðsG\r\vA\0 \0(Ì- r\rA\0! A\0; A\0A \0(È-Aj \blvk:\0 A\0 AjA\b\x07 (! (! (\"\vA\0L\r@@  A°Ï\0lj\"(ð,\"\bA\0L@ A\0:\0ó$\f\v \bAq! Aô$j!\nA\0!\rA\0!\fA\0!	@ \bAO@ \bAüÿÿÿ\x07q!\x1BA\0!@ \n \fAtj(\0 \ft 	r \n \fAr\"	Atj(\0 	tr \n \fAr\"	Atj(\0 	tr \n \fAr\"	Atj(\0 	tr!	 \fAj!\f Aj\" \x1BG\r\0\v E\r\v@ \n \fAtj(\0 \ft 	r!	 \fAj!\f \rAj\"\r G\r\0\v\v  	A\0J:\0ó$ 	E\r\0 \bAF\r\0  	Ak \bAtAàj(\0A\b\x07 (!\v\v \v Aj\"J\r\0\v\f\vAÜ\0AÉ:AÎ\0\vAéAÉ:Aà\0\vAàAÉ:Aá\0\vA\0!	 \0(È-\"\fA\0J@@ \vA\0J@A!\b 2 	At\"\fj\"\n(\0@@ \vAG\r\0  ' 	AljY \f 8j(\0\r\0  	 #j,\0\0AÙA\b\x07\v   	A 	@A \nAk(\0\r\vA\0\v,  1 	A$lj\"\n,\0 \n,\0 0 	AÀlj \0(À$+ (!\v\v \vAN@@  \bA°Ï\0lj\"\n \fj\"\r(ô$@ \n  	A 	@A \rAð$j(\0\r\vA\0\v,  \n 	A$lj\"\v,\0Ñ0 \v,\0Ò0 \n 	AÀljA\xA01j \n(è#+ (!\v\v \bAj\"\b \vH\r\0\v\v \0(È-!\f\v 	Aj\"	 \fH\r\0\v\vA\0!\f \vA\0J@@  \fA°Ï\0lj\"\bA\x006ü$ \bB\x007ô$ \fAj\"\f (H\r\0\v\v (g ( g jkj\v!\b -\0½#AF@ (à#A\xA0l (À#m\n!	 (Ø$!\nAð\n!\fAð\n!\v  .´#A3AM 	 (\b\"\rA\buk 	 \fkÁ \nÁ\"\fA\0 \nAtk\"\nAüÿqlAu \nAu \flj\"\nAulj 	 \vkÁ \nAÿÿqlAujAk\"	Al 	 	A\0H\x1B\"	 	AML\x1B\"	 	A3N\x1Bl\"	AuA3l \rj 	AÿÿqA3lAvj6\bA<\n!\nAä\0\n!\f (\b!	 @ \nA\bt \fA\btJ@A<\nA\bt 	H@A<\nA\bt\f\v (\bAä\0\nA\btN\rAä\0\nA\bt\f\vAä\0\nA\bt 	H@Aä\0\nA\bt\f\v (\bA<\nA\btN\r\0A<\nA\bt\f\v (\b\v6\b\v (\"\f (\"	lAè\x07m!\n  \n \0A\0 \bA\nH\r\0 \b \0(8\"\vA\nH\r\0 \b \vjAv\v\"\b68 \n \bk\v \0(È-m\"\nÁAä\0A2 \fA\nF\x1Bl \0(<Atk!\b@ \r\0 \0(Ì-\"\fA\0L\r\0 \0(8 \n \flj ( (gjkAt \bjA@k!\b\vA' 	 	A'L\x1B\"\n \bA' 	 	A'N\x1B\"	 \b 	J\x1B \b \nJ\x1B!\n@ (AF@ ' \0(Ì-\"Alj! \0($! (@!* \0(¸$! \0(À$!\fA\0!	#\0Ak\"\b$\0 Ak! \b \fAt\"\rAjApqk\"$\0 \fAN@A \fAj\"\v \vAL\x1B!@  	At\"\vj $ \vAk\"\x1Bj.\0\" \x1B j.\0\"\x1Bj\"Av Aqj;\0 \v jAÿÿ \x1B k\"\vAu \vAqj\"\v \vAÿÿN\x1B;\0 	Aj\"	 G\r\0\v\v  #j!\x1B  \0(6\0  \0(\b\"\v6\0 \0 \r j(\x006 \0 \r j(\x006\b  \rAjApq\"	k\"\"\r$\0 \r 	k\"\"$\0@ \fA\0J@ /\0!\rA\0!	@ \rÁ!  	At\"j  	Aj\"	Atj.\0\"\r   j.\0jAujAjAu\";\0  j \r k;\0 	 \fG\r\0\v  \fAtAjApq\"	k\"\r$\0 \r 	k\"$\0A\0!	@ \vÁ! \r 	At\"j  	Aj\"	Atj.\0\"\v   j.jAujAjAu\";\0  j \v k;\0 	 \fG\r\0\v\f\v  \fAtAjApq\"	k\"\r\"\v$\0 \v 	k\"$\0\v \b \bAj  \r \0A\fj \fAÈA \f A\nlF\"	\x1B\"\v Á\"\r \rl\"\rAýÿqlAv \v \rAvlj\"X\"6\b \b \b   \0Aj \f X\"6\fAAÐvA¨{ 	\x1B \nj\"	 	AL\x1B\"\r \rg\"Akt\"\vA \b(\0 \b.Alj\"	 	AN\x1B\"Al\"A4j\"	 	 	Au\"s kg\"Akt\"	¬Aÿÿÿÿ 	AumÁ\"	 \vAÿÿqlAu 	 \vAulj\"\v¬~B§Axqk\" Au 	l \vj  Aÿÿq 	lAuj!	 ÁAØlAÐj!\v   k\"AuL@Aÿÿÿÿ\x07Av k\"v\" 	Ax u\"  	  J\x1B 	 J\x1B t\f\v 	 A\njuA\0 AH\x1B\v\"	6 	 \vH@  \v6  \r \vk\"	6 	At \vk\"	 	 	Au\"s kg\"Akt\"Aÿÿÿÿ \vÁ\"	 AjAul Aÿÿq 	lAuj\"	 	 	Au\"s kg\"Akt\" AumÁ\"	 AþÿqlAu 	 Aulj\"¬  ¬~B§Axqk\" Au 	l j  Aþÿq 	lAuj!	A  k\"ArL@Aÿÿÿÿ\x07As k\"v\" 	Ax u\" 	 J\x1B 	 J\x1B t\f\v 	 A\rjuA\0 AH\x1B\v\"	A\0 	A\0J\x1B\"	 	AN\x1B\f\v  \r 	k6A\v!	 \0 \0.\" Á 	 k\"	AÿÿqlAv 	Av ljj;A\0! \x1BA\0:\0\0@@@@@@ *@ \bB\x007\b \bA\bj #\f\v \rAt! \0.!	@ \0/E@ \vA\rl L@ Au 	l Aÿÿq 	lAujA²J\r\v \b Á 	lAu6\f \b Á 	lAu6\b \bA\bj # \bB\x007\b A\x006  \r6 \x1BA:\0\0\f\v \vA\vl L@ Au 	l Aÿÿq 	lAujAÇJ\r\v \b Á 	lAu6\f \b Á 	lAu6\b \bA\bj # \bB\x007\b\f\v 	AÎù\0N@ \bA\bj #A!\f\v \b Á 	lAu6\f \b Á 	lAu6\b \bA\bj # \0.!\v \x1B-\0\0AG\r\v \0 \0/  \f Atkj\"	;  	Á AlH@ \x1BA\0:\0\0\f\v \0AÎ\0; \f\v \0A\0; \v \x1B-\0\0\r\v (A\0J\r\0 A6 A \rAk\"	 	AM\x1B6\v \0.!\rA At\"	m!\v \b(\f! \b(\b!\x1B A\0J@ \vÁ\"\v  \rk\"AÿÿqlAu Au \vljA\nt! \v  \0/\"kÁlAuAjAu! \v \x1B \0/\0\"kÁlAuAjAu!*A\0!\vA\0 k!A\0 k! \rA\nt!\r@ $ \vAt\"jAkAÿÿA~  \vAj\"\vAt\"j.\0\" \r j\"\rAul  k\"Á\"   j.\0\"Aulj \rAøq lAuj A\vtAðq  lAuj  *k\"Á\" A\nt  j.\0  j.\0jA	tj\"Aulj Aüq lAujA\x07uAjAu\" A~L\x1B\" AÿÿN\x1B;\0 	 \vG\r\0\v\v 	 \fH@ Au! A\ntAøq!A\0 AtkAu!\vA\0 \x1BAtkAu!\r@ $ 	At\"jAkAÿÿA~   	Aj\"	At\"j.\0\"l  j.\0\"Au \vlj  lAuj A\vtAðq \vlAuj A\nt  j.\0  j.\0jA	tj\"Au \rlj Aüq \rlAujA\x07uAjAu\" A~L\x1B\" AÿÿN\x1B;\0 	 \fG\r\0\v\v \0 ; \0 ; \0 \x1B;\0 \bAj$\0@ # \0(Ì-\"\bj-\0\0E@ \0(TAF@ ,A\x006\b ,B\x007\0 \0B\x007P 6A\0A\xA0\"ü\v\0 \0A\n:\0è \0Aä\x006s \0Aä\x006Ès \0A\0:\0Ås \0A6Àt \0A6s\v 7 \x07\f\v \b -jA\0:\0\0\v \r  ' \0(Ì-AljY - \0(Ì-\"\bj-\0\0\r  \b #j,\0\0AÙA\b\x07\f\v \0 \0(6À( \0 ) \0(À$Atj(\x006\v  :l  \x07@ (\"\vA\0L\r\0 (<!\f@ !E &AFq\"E@ \f!	 &AG\r !@ !AG\r 	AlAm!	\f\v \fAtAm!	\f\v \fAlAm!	\v ! 5F\" (8A\0Gq!\r@ \vAF@ \n!\b\f\v (!\b (A\0L\r\0 	 \f 4mk!	A\0!\r\v \bA\0J@  \b   AA\0 \0(Ì-A\0J\x1B 	 \r! (!\v\v \0A\x006Ä- \0A\x006%A!\f \0 \0(Ì-Aj6Ì- \vAH\r\0@ (<!	@ @ 	AlAm!	\f\v &AG\r\0 !E@ 	AtAm!	\f\v !AG\r\0 	AlAm!	\v (8!\r \n!\b \vAG@ Aj \fAtj(\0!\b\v \bA\0J@  \fA°Ï\0lj\"\v \b \v   \f \0(Ì-HAA \0(T\x1BA\0\v 	 \rA\0G q! (!\v\v  \fA°Ï\0lj\"\bA\x006ì, \bA\x006¼$ \b \b(ô,Aj6ô, \fAj\"\f \vH\r\0\v\vAt!  k! \0 3 \0(Ì-\"j,\0\x006T@ (\0A\0L\r\0  \0(È-G\r\0A\0!\rA\0!\b \vA\0J@@@  \rA°Ï\0lj\"(ð,\"\nA\0L\r\0 \nAq! Að$j!A\0!	@ \nAI@A\0!\f\f\v \nAüÿÿÿ\x07q!\nA\0!\fA\0!@ \bAt \f j\"\b,\0\0Atr \b,\0rAt \b,\0Atr \b,\0r!\b \fAj!\f Aj\" \nG\r\0\v E\r\v@ \f j,\0\0 \bAtr!\b \fAj!\f 	Aj\"	 G\r\0\v\v ,\0ó$ \bAtr!\b \rAj\"\r \vG\r\0\v\v E@@ Aj \vl\"	A	I@A 	tAsA\b 	k\"\ft!\n (@ (\0\"	 	-\0\0 \nAsq \b \ftr:\0\0\f\v ((\"\vA\0N@  \v \nAsq \b \ftr6(\f\v (Ax 	vM@  (  \nAtAsq \b 	Astr6 \f\v A6,\f\vAº?A¨.Aä\0\v\v@ \0(ø0E\r\0 (AG@ \0(¨E\r\v A\x006\0\v \0AÎ\0 \0(< (\0Atj (\"\b (lAxmj\"	A\0 	A\0J\x1B\"	 	AÎ\0N\x1B6< \0 \0($ \0(L\"	ÁAôlAuA\rjH@ \0A6PA\0\f\v \0A\x006P \b 	j\v6L\v  j! !Aj!! \r\0\v \0(P\v! \0 (\"6H  6P  \0(¸$\"AF \0(tA\vE6T  ÁAè\x07l6LA\0!\b  (@A\0 \0.\v6X@ E\r\0  +6$  \"6 A\0L\r\0 Aq! AO@ Aüÿÿÿ\x07q!A\0!	@  \bA°Ï\0lj\"A\x006Ø A\x006Ì A\x006¨Ã A\x006Ã A\x006øs A\x006ìs A\x006È$ A\x006¼$ \bAj!\b 	Aj\"	 G\r\0\v E\r\vA\0!\f@  \bA°Ï\0lj\"A\x006È$ A\x006¼$ \bAj!\b \fAj\"\f G\r\0\v\v  \0,\0õ%\"6`  AtA|qAj \0,\0ö%Atj.\x006d\v A j$\0 \vA\bAÉ:A\0\vAÿï\0AÉ:Aþ\0\vAÿï\0AÉ:Aø\0\vAÿï\0AÉ:AÛ\0\vAÿï\0AÉ:A·\0\v \0 6$ \0(à#! \0(ä#AF@  ApmjAÐk!\vAðÎ!Aê\0!@@@ A\bk\0\vAàÏ!A!\f\vAÑ!A¾!\v \0 Aè N  AÈjAnA\nk\"\0  \0 I\x1Bj-\0\0AlA\0\v6ì$\vïÐ:\r}\x07|#\0Aê\0k\"$\0 B\x007¨N B\x007\xA0N \0 \0($\"Aq:\0¢% \0 Aj6$ \0(ð#!\f \0Aê'j! \0(è#!#\0A k\"$\0 \0(\"\b@@A \0(\"	A\ntk\"Au\"\x07AL@ Aøq\"@ \x07A\flA°j!\v AO@  Á\" \v(\"\n \v(\bk\"Aul \nj Aÿÿq lAuj6  \v(\"\n \v(k\"Au l \nj Aÿÿq lAuj6  \v(\f\"\n \v(\0k\"Au l \nj Aÿÿq lAuj6  \x07AtAðj\"\x07(\f\"\n \x07(k\"Au l \nj Aÿÿq lAuj6\f  \x07(\b\"\n \x07(\0k\"Au l \nj Aÿÿq lAuj6\b\f\v  \v( \v(\b\"\nk\"Au l \nj Aÿÿq lAvj6  \v( \v(\"\nk\"Au l \nj Aÿÿq lAvj6  \v(\f \v(\0\"\nk\"Au l \nj Aÿÿq lAvj6  \x07AtAðj\"\x07(\f \x07(\"\nk\"Au l \nj Aÿÿq lAvj6\f  \x07(\b \x07(\0\"\nk\"Au l \nj Aÿÿq lAvj6\b\f\v  \x07A\flA°j\"(\b6  )\x007  \x07AtAðj)\x007\b\f\v Aè(\x006 Aà)\x007 A)\x007\b\v \0A \b 	j\"A\0 A\0J\x1B\" AN\x1B6A\0!\x07 A\0J@A\0 (\fk\"\nAÿÿ\0q!A\0 (\bk\"Aÿÿ\0q!\r \nAtAu! AtAu! \0(!	 \0(!\b@ \0 	 \b  \x07At\"j.\0\"4 (\"Aulj Aÿÿq 4lAujAt\"\vAu\"\b lj \vAüÿq\"\n lAuj \b \rl \n \rlAvjA\ruAjAuj\"6 (!	 \0 \b l \n lAuj \b l \n lAvjA\ruAjAuj\"\n6 \0 4 	Aul 4 	AÿÿqlAuj j\"\b6 \0 \n 4 (\"AÿÿqlAu 4 Auljj\"	6  jAÿÿA~ \vAüÿ\0jAu\" A~L\x1B\" AÿÿN\x1B;\0 \x07Aj\"\x07 G\r\0\v\v\v A j$\0 \0Aì8j\"; \fAt\"#j\"4 \0(à#\"\bAlj! A|m!?@ \0(è#\"\nA\0L\r\0 \n\"\x07Aq\"@@  \x07Ak\"\x07Atj  \x07Atj.\0²8\0 Aj\" G\r\0\v\v \nAI\r\0@  \x07Ak\"Atj  Atj.\0²8\0  \x07Ak\"Atj  Atj.\0²8\0  \x07Ak\"Atj  Atj.\0²8\0  \x07Ak\"Atj  Atj.\0²8\0 \x07AJ !\x07\r\0\v\v  *\0C½758\0  \nAu\"	Atj\" *\0C½758\0  \nAxqj\" *\0C½7µ8\0  	A\flj\" *\0C½7µ8\0  	Atj\" *\0C½758\0  	Alj\" *\0C½758\0  	Alj\" *\0C½7µ8\0  	Alj\" *\0C½7µ8\0 @ \0(È$E@ \0(ä' A¤ä\0j! A\xA0Ï\0j!1#\0AÐ\rk\",$\0@ \0(ô#\"\b \0(è#j\" \0(ð#\"	j\"\n \0(Ä#\"N@ , 4 Atj Atk\"A \b*  \0(ô#\"At\"j!\x07  ,j!\b \0(Ä#\"At Atk\"@ \b \x07 ü\n\0\0\v \b  AtkAt\"j  \x07jA * ,A\rj\" , \0(Ä# \0(¨$AjW , ,*\r\"@ @Co:C\0\0?8\r ,A\fj\"  \0(¨$V!@  ,*\r @C\0\0? @C\0\0?^\x1B8À ,AÀ\fj\"  \0(¨$¡  \0(¨$C¤p}?: 1  4 	Atk \n \0(¨$9@@ \0-\0%E\r\0 \0(¸$\r\0 \0(À#! \0(¬$²C\0\07!C \0(è$²CÍÌÌ½C\0\0\x008 \0,\0½#Au²C¾ \0(´#²CÍÌÌ½C\0\0; \0(¨$²Co»C?!A \0(à#!' \0(¤$!2 \0(ä#!#\0A\xA0Ú\0k\"$\0@@@@@@@@ 'AK\r\0A 'tA¢qE\r\0 2A\0H\r 2AO\r AlAj\"At! At!\n  'l!\b 'AF@ \bA\0J@ \b!@ A\xA0j\"\x07 Ak\"	AtjAÿÿA~ 1 	Atj*\0ü\0\"	 	A~L\x1B\"	 	AÿÿN\x1B;\0 \x07 Ak\"	AtjAÿÿA~ 1 	Atj*\0ü\0\"\x07 \x07A~L\x1B\"\x07 \x07AÿÿN\x1B;\0 AJ 	!\r\0\v\v B\x007àB AàÂ\0j AÀÅ\0j A\xA0j \b8 A}H\r !@ AÀÏ\0j Ak\"	Atj AÀÅ\0j 	Atj.\0²8\0 AK 	!\r\0\v\f\v 'A\fF@ \bA\0J@ \b!@ A\xA0j\"\x07 Ak\"	AtjAÿÿA~ 1 	Atj*\0ü\0\"	 	A~L\x1B\"	 	AÿÿN\x1B;\0 \x07 Ak\"	AtjAÿÿA~ 1 	Atj*\0ü\0\"\x07 \x07A~L\x1B\"\x07 \x07AÿÿN\x1B;\0 AJ 	!\r\0\v\v B\x007ðB B\x007èB B\x007àB AÀÅ\0j! A\xA0j! #\0Ak\"\x07$\0 \x07 AàÂ\0j\"))\b7\b \x07 ))\x007\0 )Aj!Aû\0.\0!-Aû\0.\0!Aþú\0.\0!/Aüú\0.\0! \x07Aj!@    Aøú\0Aà \b \bAàN\x1B\"	~ \bAN@ \x07\"\f(\0!% 	!@ AÿÿA~ \f(\b\"Aÿÿq lAu Au lj\" %Au l %Aÿÿq lAuj \f(\"Au\"\r /lj Aÿÿq\" /lAujj \f(\f\"%Au\" -lj %Aÿÿq\"\v -lAujAuAjAu\" A~L\x1B\" AÿÿN\x1B;\0 AÿÿA~  /l \v /lAuj \r -lj j  -lAuj \f(\"Au lj Aÿÿq lAujAuAjAu\" A~L\x1B\" AÿÿN\x1B; Aj! \fA\fj!\f AJ Ak!\r\0\v\v \b 	k\"\bA\0J@ \x07 \x07 	Atj\")\b7\b \x07 )\x007\0   	Atj! \f\v\v ) \x07 	Atj\")\b7\b ) )\x007\0 \x07Aj$\0 A}H\r !@ AÀÏ\0j Ak\"	Atj AÀÅ\0j 	Atj.\0²8\0 AK 	!\r\0\v\f\v 'A\bG\r A|L\r !@ AÀÅ\0j\"\x07 Ak\"	AtjAÿÿA~ 1 	Atj*\0ü\0\"\b \bA~L\x1B\"\b \bAÿÿN\x1B;\0 AK 	!\r\0\v B\x007àB AàÂ\0j AÃ\0j \x07 8\f\vAõÏ\0Aí7Að\0\0\vAÊ>Aí7Aó\0\0\vA>Aí7Aô\0\0\vA÷Í\0Aí7A\0\v B\x007àB AàÂ\0j AÃ\0j AÀÅ\0j 8\f\v B\x007àB AàÂ\0j AÃ\0j AÀÅ\0j 8 A}H\r\v \n!@ AÀÊ\0j Ak\"Atj AÃ\0j Atj.\0²8\0 AK !\r\0\v \n!@}C\0þÿF \"At jA¸Ê\0j*\0 AÀÊ\0j Ak\"Atj\"	*\0ü\0²\"@C\0þÿF^\r\0C\0\0\0Ç @C\0\0\0Ç]\r\0 @ü\0²\v!@ 	 @8\0 AJ\r\0\v\v AÔl\"@ A0jA\0 ü\v\0\v Aäj! \0A%j!$ \0A%j!- \0A¬Ï\0j! @@@@@@ Au\"\bA\0J@ AÀÊ\0j \nAtj!\x07 AÍ\0j!A\0!\f@ A\xA0j\"	 \x07K\r A k\" AÀÊ\0jI\r Aj \x07K\r  A\xA0k A.jA(AÁ\00 *0!@ A(\r!N A(\r!O  *°0 @»\"M M\xA0 N O\xA0D\0\0\0\0\0A\xA0\"N£¶8°0A	!@ A0j Atj\"\n \n*\0A\0 kAt jA\xA00j*\0»\"M M\xA0 N Ak\"\n*\0»\"M M¢ *»\"M M¢¡\xA0\"N£¶8\0 \n! Aj\"AÉ\0G\r\0\v 	! \fAj\"\f \bG\r\0\v\v 'At!* 'Al!! 'Al\"(Ak!) At!%AÈ\0!@ A0j\"	 Atj\" *\0\"@ @ ³C\0\0¹8\0 A	O@ 	 Ak\"\nAtj\" *\0\"@ @ \n³C\0\0¹8\0 Ak!\f\v\v A°0j!\v Að,j!A\0!A\0!A\0!\x07@@ 2AtAj\"	\"\fA\0J@ \fAÁ\0K\r \fA\x07q!@ \fA\bO@ \fAøÿÿÿ\x07q!\b@  Atj 6\0  Ar\"\nAtj \n6\0  Ar\"\nAtj \n6\0  Ar\"\nAtj \n6\0  Ar\"\nAtj \n6\0  Ar\"\nAtj \n6\0  Ar\"\nAtj \n6\0  A\x07r\"\nAtj \n6\0 A\bj! A\bj\" \bG\r\0\v E\r\v@  Atj 6\0 Aj! \x07Aj\"\x07 G\r\0\v\vA! \fAG@@ \v Atj*\0!D !@@ D \v Ak\"\nAt\"\x07j*\0\"@^E\r \v At\"\bj @8\0 \b j \x07 j(\x006\0 AJ \n!\r\0\vA\0!\v \v At\"j D8\0  j 6\0 Aj\" \fG\r\0\v\v \fAÁ\0H@ \fAk!\n \v \fAtjAk! \fAF!\x07@ \v \fAtj*\0\"D *\0^@ \n! \v \x07A\0@@ D \v At\"\bj*\0\"@^E@ !\f\v \v \bAj\"j @8\0  j \b j(\x006\0 A\0J Ak\"!\r\v\v Aj\vAt\"j D8\0  j \f6\0\v \fAj\"\fAÁ\0G\r\0\v\v\f\vAè\0Aá3A2\0\vAËÉ\0Aá3A4\0\v *°0\"@CÍÌL>]\r C @!@A\0!@ At\" A0jj*  @^E@ !\x07\f\v  Að,j\"\nj\" (\0AtAj6\0 Ar\"\x07At\" A0jj*  @^E\r  \nj\" (\0AtAj6\0 Aj\" 	G\r\0\v 	!\x07\f\vA×	Aí7A­\0\vAö\nAí7A²\0\vA§\nAí7A³\0\v \x07A\0J\r\0Aææ\0Aí7Añ\0\v AÖ*jA\0Aü\v\0 \x07Aq!\nA\0!@ \x07AO@ \x07A|q!A\0!\x07@ AÀ*j\"\b Að,j Atj\"	(\0AtjA;\0 	(At \bjA;\0 	(\bAt \bjA;\0 	(\fAt \bjA;\0 Aj! \x07Aj\"\x07 G\r\0\v \nE\r\v@ AÀ*j Að,j Atj(\0AtjA;\0 Aj! &Aj\"& \nG\r\0\v\vA!@ AÀ*j Atj\"\b \b/\0 \bAk/\0\"	 \bAk\"\n/\0\"jj;\0 AI@A!@ AÀ*j Ar\"Atj.\0A\0J@ Að,j +Atj 6\0 +Aj!+\v AÀ*j Aj\"Atj.\0A\0J@ Að,j +Atj 6\0 +Aj!+\v AG\r\0\vA!@ AÀ*j Atj\"\x07 \x07/\0 \x07Ak/\0\"\b \x07Ak/\0\"	 \x07Ak\"\n/\0\"jjj;\0 AI@A\0!\fA!@ AÀ*j\" Atj.\0A\0J@ \fAt j Ak;\0 \fAj!\f\v AG@ AÀ*j\"\n Ar\"Atj.\0A\0J@ \fAt \nj Ak;\0 \fAj!\f\v Aj!\f\v\v A0jA\0AÐü\v\0 A\0J@ 1 AÀÏ\0j 'A\bF\x1BAj! \fA\0L!\x07@ A(\r!M \x07E@ MD\0\0\0\0\0\0ð?\xA0!M A0j \x1BAÔlj!\bA\0!@C\0\0\0\0!@  AÀ*j Atj.\0At\"	k\"\n A(\"\"OD\0\0\0\0\0\0\0\0d@ O O\xA0 M \nA(\r\xA0£¶!@\v \b 	j @8\0 Aj\" \fG\r\0\v\v A\xA0j! \x1BAj\"\x1B G\r\0\v\v A\0L}C\0\0\0\0 'A\fF AtAm  'AFv\v\"A\0J!\" ²»(Dl£y	O\n@¢¶\v!LA!% +A\0L\rAÀ©A© AF\"\x1B!/A\vA \x1B!\x1BA\vA 'A\bF q 2A\0Gq\"\x1B\"A\x07k! Aþÿÿÿ\x07q! Aq!A!	 Ak! A ²\"K!E KCÍÌL>\"F!JC\0\0zÄ!DC\0\0\0\0!CA\0!\n@ A0j Að,j 3Atj(\0\"\bAtj!\vA\0!@ AÐ-j Atj\"A\x006\0 A\0J@  /j!\fA\0!C\0\0\0\0!@A\0!&@ @@ \v Ar\"\x07AÔlj \f \x07 \x1Blj,\0\0Atj*\0 \v AÔlj \f  \x1Blj,\0\0Atj*\0 @!@ Aj! &Aj\"& G\r\0\v E\r\v \v AÔlj \f  \x1Blj,\0\0Atj*\0 @!@\v  @8\0\v Aj\" G\r\0\vC\0\0zÄ!@A\0!&A\0!A\0!A\0!\x07 @@ AÐ-j\" Ar\"Atj*\0\"I Ar\"\rAt j*\0\"G Ar\"At j*\0\"H At j*\0\"A @ @ A]\"\x1B\"@ @ H]\"\v\x1B\"@ @ G]\"\f\x1B\"@ @ I]\"\x1B!@  \r    \x1B \v\x1B \f\x1B \x1B! Aj! \x07 G \x07Aj!\x07\r\0\v\v@ AÐ-j Atj*\0\"A @ @ A]\"\x07\x1B!@   \x07\x1B! Aj! &Aj\"&AG\r\0\v J \b²»(Dl£y	O\n@¢¶\"H @!A \"@ A H L\"A A\"A F  *\0 AC\0\0\0?!A\v@ A D^E\r\0 @ E^E\r\0 !\n \b!	 A!D @!C\v 3Aj\"3 +G\r\0\v 	AF\r   C K8\0 $@@@ 'A\bL@ A\0L\r \n /j! \rA\0!\f\v 'A\fF@ 	ÁAl\"Au Aqj\f\v 	At\v!A\xA0©!3A¸©!+A\f!\vA\f!\n@@@ Ak\0\0\vAÝÛ\0Aí7A\0\v 2AtA«j!+ 2,\0«!\vAð©!3A\"!\n\v  *  *J\x1B )  (H\x1B\"\bAj\" )  )H\x1B! \vAþÿÿÿ\x07q! \vAq!A\0!\x07A\0 \bAk\" *  *J\x1B\"	kAt! 1 'AÐ\0lj\"!@   j + \x07Atj\",\0\"\"At\"k AÀÙ\0j\" ! \" ,\0\0\"\fk\"Aj\"\r0@ \f \"J\r\0 \rAq!A\0!& \f!A\0! AO@ \rA|q!\r  j!A\0!\x1B@ A\xA0j Atj\" AÀÙ\0j \" kAtj\"*\x008\0   AsAtj*\x008  A\fk)\0B 7\b Aj! Aj! \x1BAj\"\x1B \rG\r\0\v E\r\v@ A\xA0j Atj AÀÙ\0j \" kAtj*\x008\0 Aj! Aj! &Aj\"& G\r\0\v\v@ \vA\0L\r\0 3 \x07 \nlj!  \x07A¨lj!\rA\0!A\0!\x1B \vAG@@ \r Alj\" A\xA0j\"  j,\0\0 \fkAtj\"(6  )\b7\b  )\x007\0 \r Ar\"Alj\"  j,\0\0 \fkAt j\"(6  )\b7\b  )\x007\0 Aj! \x1BAj\"\x1B G\r\0\v E\r\v \r Alj\" A\xA0j  j,\0\0 \fkAtj\"(6  )\b7\b  )\x007\0\v  !Atj! \x07Aj\"\x07 G\r\0\vA\xA0©!\x07A¸©!\fA\f! A\f!@@@ Ak\0\0\vAÝÛ\0Aí7AÈ\0\v 2AtA«j!\f 2,\0«! Að©!\x07A\"!\v  Aþÿÿÿ\x07q!\r  Aq!A\0!\n !\v@  \v 	 \f \nAtj\",\0\0\"jAtk\" !\rDü©ñÒMbP?\xA0\"N¶8ÀY  ,\0\"H@  k!A!@ At\" AÀÙ\0jj  k*\0»\"M M¢ N  ! kAtj*\0»\"M M¢¡\xA0\"N¶8\0  F Aj!E\r\0\v\v@  A\0L\r\0 \x07 \n lj! A\xA0j \nA¨lj!A\0!A\0!\x1B  AG@@  Alj\" AÀÙ\0j\"  j,\0\0 kAtj\"(6  )\b7\b  )\x007\0  Ar\"Alj\"  j,\0\0 kAt j\"(6  )\b7\b  )\x007\0 Aj! \x1BAj\"\x1B \rG\r\0\v E\r\v  Alj\" AÀÙ\0j  j,\0\0 kAtj\"(6  )\b7\b  )\x007\0\v \v !Atj!\v \nAj\"\n G\r\0\v AG@A\xA0©!3A\f!\vA\f\f\vAð©!3A\"!\v 2,\0«\v!   !l\r!MA\0!\n 	 L@ MD\0\0\0\0\0\0ð?\xA0!M Aþÿÿÿ\x07q! Aq!CÍÌL½ \b²!C  	kAj!C\0\0zÄ!AA\0!@ A\0J@ ( 	k!\r At\" A\xA0jj!  j!A\0!@C\0\0\0\0!@@ A\0L\r\0  Al\"j!  j!D\0\0\0\0\0\0\0\0!NA\0! M!OA\0!\x07@ @@ O  A¨l\"\fj*\0»\xA0  ArA¨l\"j*\0»\xA0!O N \f j*\0»\xA0  j*\0»\xA0!N Aj! \x07Aj\"\x07 G\r\0\v E\r\v O  A¨l\"j*\0»\xA0!O N  j*\0»\xA0!N\v ND\0\0\0\0\0\0\0\0dE\r\0 C ³C\0\0? N N\xA0 O£¶!@\v@ @ A^E\r\0 \r ,\0ð©L\r\0 !\n @!A 	!\b\v Aj\" G\r\0\v\v 	Aj!	 Aj\" G\r\0\v\v@ A\0L\r\0 \n 3j!\f@ E@A\0!\f\v Aq Aþÿÿÿ\x07q!	A\0!A\0!\x07@  Atj ( \b \f  \vlj,\0\0j\" *  *J\x1B  (J\x1B6\0  Ar\"Atj ( \b \f  \vlj,\0\0j\" *  *J\x1B  (J\x1B6\0 Aj! \x07Aj\"\x07 	G\r\0\vE\r\v  Atj ( \b \f  \vlj,\0\0j\" *  *J\x1B  (J\x1B6\0\v \b *k\f\v Aq Aþÿÿÿ\x07q!\bA\0!A\0!&@  AtjAA 	   \x1Blj,\0\0j\" AL\x1B\" AN\x1B6\0  Ar\"AtjAA 	   \x1Blj,\0\0j\" AL\x1B\" AN\x1B6\0 Aj! &Aj\"& \bG\r\0\vE\r\v  AtjAA 	   \x1Blj,\0\0j\" AL\x1B\" AN\x1B6\0\v 	Ak\v;\0 - \n:\0\0A\0 $.\0A\0N\rAÚè\0Aí7AÚ\0 \n \x07A\bk/\0 \b 	jj j;\0 Ak!\f\v\0\v\0 \n \bAk/\0 	j j;\0 Ak!\f\v\0\v\0\v %@ A\0 %ü\v\0\v  A\x006\0 $A\0;\0 -A\0:\0\0A\v A\xA0Ú\0j$\0E@ \0A:\0%\f\v \0A:\0%\f\v B\x007ì B\x007ä \0A\x006¬O \0A\0:\0% \0A\0;%\v ,AÐ\rj$\0\f\vAÆA¯4A;\0\v # 1j\"!\x07A\0!\bA\0!)#\0A\xA0	k\"$\0 \0\"\n(ø#! \0(ì$!\0  \n(Ü$ \n(Ø$j²C\0\0\0?C\0\0\x008\"H8¸ D\0\0\0\0\0\0ð? \0²\"DC\0\0\0<\"GC\0\0\xA0ÁC\0\0¾»D\0\0\0\0\0\0ð?\xA0£¶\"@8¼ \n(Ä$E@ G HC\0\0\0?C\0\0\0? @ @ \n(´#²C\0\0»C\0\0?\"@ @!G\v@ \n-\0%AF@ \nA\0:\0% \n*¬O\"@ @ G!J\f\v \n(à#! \n.ä#\"\0AlAm!	 \0A\0J@ At\"\f²\"C \x07 \f\r¶»(Dl£y	O\n@¢¶!@ \fAt!A!\0@ B C  \x07j\"\x07 \f\r¶»(Dl£y	O\n@¢¶\"A @!B A!@ 	 \0Aj\"\0G\r\0\v\v DCÍÌÌ¾C\0\0\0<C\0\0À@C\0\0? H G!J 	Ak²C? B]@ \nA\0:\0%\f\v \nA:\0%\v@ \n(ä#\"A\0L\r\0 4 Atk! C×£p? *ÀCo:\"@ @C\0\0?!G Aôj!C\0\0? *¼C\n×#< \n(À$²C\0\07\"F F!I F!E@ Aàj\"	  A \n(ü# \n(à#\"\0Al\"kAm\"\b* \0A\fl\"@ 	 \bAt\"\0j \0  j ü\n\0\0\v  \bjAt\"\0 Aàj\"j \0  jA \b* \n(ì# \n($! \n(ü#!@ \n(À$A\0J@D\0\0\0\0\0\0\0\0!Q#\0A\xA0k\"$\0 AÐj\"A\0AÈü\v\0 A\0AÈü\v\0 AqE@ A\0J@  At\"\0j!\r \0 j!\f F»\"R!SA\0!	 A\0L!\x07@  	Atj*\0»!PA\0!\0 \x07E@@ \0At\"A\br\"\b AÐj\"j\"+\0!N  j P9\0  j\" +Ð\"O P¢ +\0\xA09\0 R N¢ Q\xA0!M \0Aj\"\0At j+\0!Q  M S P¢\xA0\"M9\0 \b j\" O M¢ +\0\xA09\0 S M¢ N R Q¢\xA0\xA0!P \0 H\r\0\v\v \f P9\0 \r +Ð\"Q P¢ \r+\0\xA09\0 	Aj\"	 G\r\0\v\vA\0!\0 A\0N@ Að\0j!\b AO@ Aüÿÿÿ\x07q!	A\0!@ \b \0Atj  \0Atj+\0¶8\0 \b \0Ar\"Atj  Atj+\0¶8\0 \b \0Ar\"Atj  Atj+\0¶8\0 \b \0Ar\"Atj  Atj+\0¶8\0 \0Aj!\0 Aj\" 	G\r\0\v\v Aq!	A\0!@ \b \0Atj  \0Atj+\0¶8\0 \0Aj!\0  	G Aj!\r\0\v\v A\xA0j$\0\f\vAï\0A7A1\0\v \n(ä' Að\0j Aàj  AjW\v  *p\"@ @C¨û7C\0\0?8p  Að\0j \n($V!@  )Aà\0lj\"  \n($¡  )Atj\"\b @\"@8\0 \n($!\x07 \n(À$A\0J@  \x07AtjAk*\0!B@ \x07AH\r\0A\0! \x07Ak\"	!\0 \x07AkAq\"@@ E B  \0Atj*\0!B \0Ak!\0 Aj\" G\r\0\v\v 	AI\r\0@ E E E E B  \0Atj\"*\0 Ak*\0 A\bk*\0  \0Ak\"Atj*\0!B \0Ak!\0 \r\0\v\v \b @C\0\0? F BC\0\0?8\0\vAt  \x07 G: \n($!\x1B@ \n(À$A\0J@ \x1BAk!	@ \x1BAH\"\"E@ 	\"\0Aq@  \0Atj\"Ak\"\0 E *\0 \0*\08\0 \x1BAk!\0\v \x1BAG@@  \0Atj\"Ak\" E *\0 *\0\"@8\0 A\bk\" E @ *\08\0 \0AJ \0Ak!\0\r\0\v\v\f\v \x1BAG\r\v \x1BAq!$ I F *\0C\0\0?!@A\0!!A\0!@ 	AI\"-E@ \x1BA|q!\0A\0!@  Atj\"\b @ \b*\08\0 \b @ \b*8 \b @ \b*\b8\b \b @ \b*\f8\f Aj! Aj\" \0G\r\0\v $E\r\v@  Atj\"\0 @ \0*\08\0 Aj! !Aj\"! $G\r\0\v\v \x1BA|q!/ \x1BAk!\b 	Aq! 	A~q!  	Atj\"Ak!A\0!#A\0!!@C\0\0¿!BA\0!\0A\0!A\0!@ -E@@  \0Ar\"\rAtj*\0\"H  \0Ar\"Atj*\0\"D  \0Ar\"Atj*\0\"C  \0Atj*\0\"A B A B^\"\v\x1B\"A A C]\"\f\x1B\"A A D]\"\x07\x1B\"A A H]\"\x1B!B \r   \0 ! \v\x1B \f\x1B \x07\x1B \x1B!! \0Aj!\0 Aj\" /G\r\0\v \0! $E\r\vA\0!\0@  Atj*\0\"A B A B^\"\x1B!B  ! \x1B!! Aj! \0Aj\"\0 $G\r\0\v\v BCï@_\r@ \"\r\0A\0!A! \b@@  Atj\"\x07Ak\"\0 F \x07*\0\"A \0*\08\0 \x07 A F \x07*8\0 Aj! Aj\" G\r\0\v E\r\v  Atj\"Ak\"\0 F *\0 \0*\08\0\vC\0\0? @!@A\0!A\0!A\0!\0@ -E@@  Atj\"\x07 @ \x07*\08\0 \x07 @ \x07*8 \x07 @ \x07*\b8\b \x07 @ \x07*\f8\f Aj! \0Aj\"\0 /G\r\0\v !\0 $E\r\v@  \0Atj\" @ *\08\0 \0Aj!\0 Aj\" $G\r\0\v\v  \x1BC¤p}? #³CÍÌÌ=CÍÌL? BCïÀ B !Aj³:@ \"\r\0 	!\0 @  E *\0 *\08\0 \b!\0\v \bE\r\0@  \0Atj\"Ak\" E *\0 *\0\"@8\0 A\bk\" E @ *\08\0 \0AJ \0Ak!\0\r\0\v\v I F *\0C\0\0?!@A\0!A\0!A\0!\0@ -E@@  Atj\"\x07 @ \x07*\08\0 \x07 @ \x07*8 \x07 @ \x07*\b8\b \x07 @ \x07*\f8\f Aj! \0Aj\"\0 /G\r\0\v !\0 $E\r\v@  \0Atj\" @ *\08\0 \0Aj!\0 Aj\" $G\r\0\v\v #Aj\"#A\nG\r\0\v\f\v \x1BA\0L\r\0 \x1BAüÿÿÿ\x07q!\r \x1BAq!A\0!\x07A\0!!@C\0\0¿!BA\0!\0A\0!A\0!@ \x1BAO@@  \0Ar\"Atj*\0\"D  \0Ar\"Atj*\0\"C  \0Ar\"\vAtj*\0\"A  \0Atj*\0\"@ B @ B^\"\f\x1B\"@ @ A]\"\b\x1B\"@ @ C]\"	\x1B\"@ @ D]\"\x1B!B   \v \0 ! \f\x1B \b\x1B 	\x1B \x1B!! \0Aj!\0 Aj\" \rG\r\0\v \0! E\r\vA\0!\0@  Atj*\0\"@ B @ B^\"\x1B!B  ! \x1B!! Aj! \0Aj\"\0 G\r\0\v\v BCï@_\r  \x1BC¤p}? \x07³CÍÌÌ=CÍÌL? BCïÀ B !Aj³: \x07Aj\"\x07A\nG\r\0\v\v  j!  )Aj\") \n(ä#\"H\r\0\v JC\n×#¾»O A\0L@A\0!\b\f\v¶!@ Aq!\x07A\0!!A\0!\0@ AI\r\0 Aüÿÿÿ\x07q!	A\0!@  \0Atj\"\b \b*\0 @CLÉ?8\0 \b \b* @CLÉ?8 \b \b*\b @CLÉ?8\b \b \b*\f @CLÉ?8\f \0Aj!\0 Aj\" 	G\r\0\v \x07\r\0A!\b\f\v@  \0Atj\" *\0 @CLÉ?8\0A!\b \0Aj!\0 !Aj\"! \x07G\r\0\v\v \n(´#²\"AC\0\0; \n(Ø$²C\0\0\x008C\0\0¿C\0\0\0?C\0\0?C\0\0@!D@ \n-\0%AF@ \b@ Aj!	 Aôj! Aäj!\0CÍÌL> \n(à#²!@A\0!\x07@  \x07At\"\fj @C\0\0@@ \0 \fj(\0²\"CC\0\0¿8\0 	 \fjC\0\0? C C D8\0 \x07Aj\"\x07 G\r\0\v\v ACff¾C\0\0;C\0\0¾!@C\0\0?C\0\0? *¼ *¸CÍÌL>C> \n*¬O!B\f\v Cff¦? \n(à#²\"@C\0\0¿\"A8ô C\0\0? @ @ DC¿8C\0\0\0\0!BC\0\0¾!@ AH\r\0 Aj! Aôj! Ak\"Aq!\fA!\0 AkAO@ A|q!\x07A\0!@  \0At\"\vj A8\0 \v j *\x008\0  \vAj\"	j A8\0 	 j *\x008\0  \vA\bj\"	j A8\0 	 j *\x008\0  \vA\fj\"	j A8\0 	 j *\x008\0 \0Aj!\0 Aj\" \x07G\r\0\v \fE\r\vA\0!@  \0At\"	j A8\0 	 j *\x008\0 \0Aj!\0 Aj\" \fG\r\0\v\v \b@ Aj!	 A¤j!A\0!\x07@ \n B \n*ä8\"ACÍÌÌ> A\"A8ä8  \x07At\"\0j A8\0 \n @ \n*è8\"ACÍÌÌ> A\"A8è8 \0 	j A8\0 \x07Aj\"\x07 G\r\0\v\v A\xA0	j$\0 !\0 !A\0!A\0!\bA\0!A\0!	A\0!\f#\0Ak\"$\0 B\x007\f B\x007\f B\x007\f B\x007\f@@@ \n(ä#\"\rA\0J@@ \rAG@ \rAq \rAþÿÿÿ\x07q!\x07@ At\" A\xA0\fj\"jC\0\0?  j*\08\0  Ar\"jC\0\0?  j*\08\0 Aj! \bAj\"\b \x07G\r\0\vE\r\v At\" A\xA0\fjjC\0\0?  j*\08\0\v \n-\0%AF\r 4 \n(\xA0$\"%Atk! \n(ì#! !\b@ !\0 A\xA0\fj \fAtj*\0!@A\0!A\0!\r  %j\"\x07Aüÿq\"@@ \b At\"	j @ \0 	j*\08\0 \b 	Ar\"j @ \0 j*\08\0 \b 	A\br\"j @ \0 j*\08\0 \b 	A\fr\"j @ \0 j*\08\0 Aj\" I\r\0\v\v@  \x07N\r\0 \x07 \"kAq\"	@@ \b At\"j @ \0 j*\08\0 Aj! \rAj\"\r 	G\r\0\v\v  \x07kA|K\r\0@ \b At\"j @ \0 j*\08\0 \b Aj\"j @ \0 j*\08\0 \b A\bj\"j @ \0 j*\08\0 \b A\fj\"j @ \0 j*\08\0 Aj\" \x07G\r\0\v\v \b \n(ì#\"At\"j \n(\xA0$\"%Atj!\b \0 j! \fAj\"\f \n(ä#\"\rH\r\0\v\f\v \n-\0%AG\r\v (äAj \n(ð# \n(\xA0$kL@ \n(ä' A\rj\"!# A°\fj\"!\x07 Aäj\"!! \n(ì#!\" \rA\0J@ \"Aj!\v@ # \0A~  Atj(\0kAtj\"\fAj\"Ak\" \"\r\"M¶8\0A!\b@ # \bAlj M  \bAtk*\0\"@ @  \" \bkAtj*\0\"@ @»\xA0\"M¶8\0 \bAj\"\bAG\r\0\v A\bk!A!A!@ # Alj   \"\"\"M¶\"@8\0 # Atj @8\0 Ak!A!\bA kAN@@ \bAt\" # \b j\"Aljj M  k*\0  k*\0  \" \bkAt\"j*\0  j*\0»\xA0\"M¶\"@8\0 # \bAlj Atj @8\0 \bAj\"\b G\r\0\v\v Ak! Aj\"AG\r\0\v \fAj!A\0!\b@ \x07 \bAtj Ak\" \0 \"\"¶8\0 \bAj\"\bAG\r\0\v #C\0\0? \0 \v\r¶\"A #*\0 #*`CÂu<C\0\0?\"@ @ A]\x1B\"@A\xA0 \x07 @A\xA0 \x07Aj!\x07 #Aä\0j!# \0 \"Atj!\0 Aj\" \rG\r\0\v\v \n(ä' \nA%j!% \nA\xA0%j!( \nA°$j!3 \n(ì#!\x1B \n(ä#!\0A\0!#\0Ak\"\v$\0A \0Al\" AL\x1B\"Aq!\x07A\0!@ \0A\0J@ Aüÿÿÿ\x07q!\b@ At\"\r \vAÐ\0j\"\fj  \rj*\0C\0\0\0Hü\x006\0 \f \rAr\"j  j*\0C\0\0\0Hü\x006\0 \f \rA\br\"j  j*\0C\0\0\0Hü\x006\0 \f \rA\fr\"j  j*\0C\0\0\0Hü\x006\0 Aj! Aj\" \bG\r\0\v \x07E\r\v@ At\" \vAÐ\0jj  j*\0C\0\0\0Hü\x006\0 Aj! 	Aj\"	 \x07G\r\0\v\vA \0Al\" AL\x1B\"1Aq!\bA\0!A\0!@ \0A\0J@ 1Aüÿÿÿ\x07q!A\0!	@ \v At\"\x07j \x07 j*\0C\0\0\0Hü\x006\0 \v \x07Ar\"j  j*\0C\0\0\0Hü\x006\0 \v \x07A\br\"j  j*\0C\0\0\0Hü\x006\0 \v \x07A\fr\"j  j*\0C\0\0\0Hü\x006\0 Aj! 	Aj\"	 G\r\0\v \bE\r\v@ \v At\"j  j*\0C\0\0\0Hü\x006\0 Aj! Aj\" \bG\r\0\v\v \vAÐ\0j!A\0!\x07#\0Ak\"$\0 \0\"\bA\0L!Aÿÿÿÿ\x07!	@ 3(\0!@ @A\0!A\0! !\0\f\v 5At\"\0(\xA0!$ \0(°! \0(!  5,\0\xA0!A\0!2A\0!A\0! \v!\f !\r@ !\0AÕ0 kA3k!) \f(! \f(\f! \f(\b! \f(! \f(\0! Aÿÿÿÿ\x076 Aÿÿÿÿ\x076\b A\fj 2j\"-A\0:\0\0 A\0J@ A\x07t!/ A\x07t!# A\x07t!\" A\bt! A\bt! \x1BÁ!A\0!*@@ \0,\0\0\" \r(\0l \0,\0\" \r(l \"k \0,\0\"+ \r(\blj \0,\0\", \r(\flj \0,\0\"& \r(ljAtj\"Au l Aÿÿq lAuj \r( l \r( +l #k \r(  ,lj \r($ &ljAtj\"Au lj Aÿÿq lAuj \r(0 +l \r(4 ,l /k \r(8 &ljAtj\"Au +lj Aÿÿq +lAuj & \r(LlAt k \r(H ,lj\"Au ,lj Aÿÿq ,lAuj \r(` &l k\"Au &lj Aÿÿq &lAujA¡j\"A\0H\r\0  $ *j-\0\0\" )k\"A\0 A\0J\x1BA\vtj\"\nAtA<kAu l   *j-\0\0Atj\" (J\r\0  6  6\b - *:\0\0  6\0\v \0Aj!\0 *Aj\"* G\r\0\v\v ( j\"A\0N! (\b j\"A\0N!A\0!\0 Aÿÿÿÿ\x07 \x1B! Aÿÿÿÿ\x07 \x1B! \fAj!\f \rAä\0j!\r (\0A3j\n jA\x07N@ (\0A3j\n jA\x07k!\0\v \0! 2Aj\"2 \bG\r\0\v\v 	 N@ ( 5:\0\0 \b@ % A\fj \bü\n\0\0\v \0!\x07 !	\v 5Aj\"5AG\r\0\v \bA\0J@ \vAàj!\0 (,\0\0AtA°j(\0!A\0!\r@ \0 \rA\nlj\"  \r %j\",\0\0Alj,\0\0A\x07t;\0   ,\0\0Alj,\0A\x07t;   ,\0\0Alj,\0A\x07t;   ,\0\0Alj,\0A\x07t;   ,\0\0Alj,\0A\x07t;\b \rAj\"\r \bG\r\0\v\v Aj! 3 \x076\0 \v AA \bAF\x1Bu\nAtA<kAuA}l6 Aj$\0@ \bA\0L\r\0 1Aüÿÿÿ\x07q! 1Aq!	A\0!A\0!\0@  Atj \vAàj\"\b Atj.\0²C\0\088\0  Ar\"Atj At \bj.\0²C\0\088\0  Ar\"Atj At \bj.\0²C\0\088\0  Ar\"Atj At \bj.\0²C\0\088\0 Aj! \0Aj\"\0 G\r\0\v 	E\r\0A\0!\0@  Atj \vAàj Atj.\0²C\0\088\0 Aj! \0Aj\"\0 	G\r\0\v\v  \v(²C\0\0\0<8Ä \vAj$\0  E@ \n(ð, \n($l!\0 \n \n-\0ó$ \0Á\"\0 \0lAä\0nAj \0\vÁ\" *Äü\0lAÔ \n(ì$kJ:\0¡% *Ä!@A¼ \n(ì$k!\0 \n \n-\0¡%  @ü\0l \0Jj\"\0:\0¡% \0À\f\v \nA\0:\0¡%A\0\vAtAj.\0²C\0\088à !\0 4 \n(\xA0$\"Atk!\b \n(ì#!A\0! \n(ä#\"\fA\0J@ \0A\xA0\fj!\x07  j\"\vA\0L!	@ 	E@ \x07 At\"j*\0!I \b  !j(\0Atk!  Alj\"*!G *\f!H *\b!D *!C *\0!AA\0!\r@ \0 \rAt\"j\"  \bj*\0\"@8\0  @ A *\b\"@8\0  C * @\"@8\0  D *\0 @\"@8\0  H Ak*\0 @\"@8\0  I G A\bk*\0 @8\0 Aj! \rAj\"\r \vG\r\0\v\v \b Atj!\b \0 \vAtj!\0 Aj\" \fG\r\0\v\v\f\vAÚ\0A5A?\0\v \rAl\"\0@ AjA\0 \0ü\v\0\v A\x006Ä \nA\x006°$\v A\fj! \n(¸$}C\n×#< *¼!@ *ÄC\0\0@@»O¶C\0@F @C\0\0@?C\0\0>\v!@ \n(ä'#\0A\xA0\rk\"$\0 \n\"A:\0% Aà\fj  @ \n(\xA0$\"\0 \n(ì#j\" \n(ä# \0!A@ \n($E\r\0 \n(¸$\r\0 \n(ä#AG\r\0A! A\fj\"\0  Atj @ A \n(\xA0$!@  \0 \n(\xA0$ \nA#j! At!\v A @!C  Atj!\fCÿÿ!A@ AÀ\fj\"	   \"\0 (\xA0$T (ä' A\fj! (\xA0$!\bA\0!#\0A k\"$\0  	 \b!@ \bA\0L\r\0 \bAq!\rA\0!	 \bAO@ \bAüÿÿÿ\x07q!\x07A\0!#@  Atj  Atj.\0²C\0\098\0  Ar\"\bAtj  \bAtj.\0²C\0\098\0  Ar\"\bAtj  \bAtj.\0²C\0\098\0  Ar\"\bAtj  \bAtj.\0²C\0\098\0 Aj! #Aj\"# \x07G\r\0\v \rE\r\v@  Atj  Atj.\0²C\0\098\0 Aj! 	Aj\"	 \rG\r\0\v\v A j$\0    \v (\xA0$9@  (\xA0$\"Atj  k\r \f (\xA0$\"Atj  k\r\xA0¶\"@ C]@  \0:\0% @!C\f\v @ A^\r\v \0Ak! @!A \0\r\0\v\v@ -\0%AF@  Aà\fj (\xA0$ -\0%AF\r\v@ ($E\r\0 (¸$\r\0 (ä#AF\r\vAò\0A÷9Aè\0\0\v A\xA0\rj$\0 Aj!' !\0 A#j!3A\0!5A\0!#\0A@j\"$\0#\0Aà\0k\"6$\0@@@@ \"($AG@ -\0%AG\r\v .´#\"A{l AîÎlAujAÊj\"AuA\0 (ä#AF\x1B j\"A\0L\r 6A j \0 (\xA0$@ ($AG\r\0 ,\0%\"AJ\r\0 6A@k\" 3 \0  (\xA0$T 6  (\xA0$A!5 (\xA0$\"A\0L\r\0 ,\0%\" lA\vtÁ!\fA\0! AG@ Aq Aþÿÿÿ\x07q!\bA\0!5@ At\" 6A j\"	j\" .\0Av  6j.\0 \flAvj;\0 	 Ar\"j\" .\0Av  6j.\0 \flAvj;\0 Aj! 5Aj\"5 \bG\r\0\vA!5E\r\v At\" 6A jj\" .\0Av  6j.\0 \flAvj;\0\v A%j!, (Ô$!. 6A j! (´$! ,\0%!A\0!#\0Ak\"7$\0@ AI@ \0 .($ ..q 7 ./\0AtAjAðÿqk\"$\0 \0! .(\b!	 .(\f!\r ..\0!\v@ ..\"AqE@ \vA\0J@ AH!\f@A\0!A\0!\x07 ! \fE@@ \x07  Ak\"At\"\0j/\0  	j-\0\0A\x07tkÁ \0 \rj.\0l\"\b Auk\"\0 \0Au\"\0s \0kj  Ak\"\0At\"j/\0 \0 	j-\0\0A\x07tkÁ  \rj.\0l\" \bAuk\" Au\"s kj!\x07 AK \0!\r\0\v\v  Atj \x076\0  	j!	 \r Atj!\r Aj\" \vG\r\0\v\v\f\vAáî\0Aü1A1\0\v  AtAjApq\"k\"+\"\0$\0  + ..\0 r \0 k\"1\"\0$\0 \0 Atk\"$\0 A\0J@ Av!$ AtAu! @ + At\")j(\0!* ..\"\fA\0J@ \f *l\"\0 .(\bj!\x07 .(\f \0Atj!\bA\0!	@ 	At\" 7AÐ\0jj \b j.\0\"  j/\0 \x07 	j-\0\0A\x07tkÁlAv;\0  j.\0\"  Au\"\0s \0kg\"Akt\"Aÿÿÿÿ  l\"\0 \0g\"Akt\"\0AumÁ\"\v AÿÿqlAu Au \vlj\"¬ \0¬~B§Axqk\"\0Au \vl j \0Aÿÿq \vlAuj!\v 7A0j j  k\"\0AwL@Aÿÿÿÿ\x07Ax \0k\"v\" \vAx \0Ajt\"\0 \0 \vH\x1B  \vH\x1B t\f\v \v \0A\bjuA\0 \0AH\x1B\v;\0 	Aj\"	 \fG\r\0\v\v 7 7A j\"- . *3  Atj!2 7AÐ\0j!/ 7A0j!# .( !\" ..!	 ..! !\0 ..!A\0!#\0AÀk\"$\0Av!\x07@ \x07A\nt!@ \x07A\0J@ A\x07r! Aæ\0k!\f\v A\bj!A\x07!@@ \x07Aj\0\vAæø! !\f\v Aæ\0r! Aæ\0r!\v  \x07AtA(j\"\rj 	 ÁlAu6\0 AÐ\0j \rj 	 ÁlAu6\0 \x07Aj\"\x07A\nG\r\0\v A\0;à A\x006ÀA\x07AAAAA A\0LA\0 \0Á!! !\0A!@ !\v \" 7 \0\"Ak\"\0At\"j.\0j!% Aðj \0j!0 \0 -j-\0\0!  #j.\0!\x1B  /j/\0!(A\0!\x07@ 0 \x07AtjA	Av ( Aàj\" \x07Atj\".\0 lA\bu\"	kÁ lAu\"& &AvL\x1B\" A	N\x1B\"\r:\0\0  	 \rAtA(j\" AÐ\0jj(\0j\"\f;\0  \x07 \vj\"\bAtj  j(\0 	j\"	;\0 AÀj\" \x07Atj\" (\0\" &AN@ &AF@A!\r %-\0\x07\f\v \rA+l\"Aj!\r Aì\0j\f\v &A|L@ &A|F@ \r %j-\0!\rA\f\v \rAUl\"AÁ\0j!\r Aì\0j\f\v \r %j\"-\0!\r -\0\v !lj ( \fkÁ\" l \x1Blj6\0 \bAt j  \r !lj ( 	kÁ\" l \x1Blj6\0 \x07Aj\"\x07 \vG\r\0\v@ \vAM@A\0!\x07@ \vAG@ \vAq \vAq!A\0!@ Aðj \x07Atj \0j\"\b \vAt\"j \b-\0\0Aj:\0\0 \bAj j \b-\0Aj:\0\0 \x07Aj!\x07 Aj\" G\r\0\vE\r\v Aðj \x07Atj \0j\" \vAtj -\0\0Aj:\0\0\vA! \vAF\rA\0! \vAt\"!\x07A  AM\x1B\"\b k\"	AjAq\"@@ 0 \x07Atj 0 \x07 kAtj-\0\0:\0\0 \x07Aj!\x07 Aj\" G\r\0\v\v 	AI\r@ 0 \x07Atj 0 \x07 kAtj-\0\0:\0\0 0 \x07Aj\"Atj 0  kAtj-\0\0:\0\0 0 \x07Aj\"Atj 0  kAtj-\0\0:\0\0 0 \x07Aj\"Atj 0  kAtj-\0\0:\0\0 \x07Aj!\x07  \bG\r\0\v\f\vA\0!\x07@ (À\" (Ð\"L@ !	 !\f\v  6Ð  6À /à!  /è;à  ;èA!\x07 !	\v  6°  	6\xA0  \x076°A!@ (Ä\" (Ô\"\x07L@ \x07!\r !\x07\f\v  6Ô  \x076Ä /â!  /ê;â  ;êA! !\r\v  \x076´  \r6¤  6´A!@ (È\" (Ø\"L@ !\b !\f\v  6Ø  6È /ä!  /ì;ä  ;ìA! !\b\v  6¸  \b6¨  6¸A!(@ (Ì\"\f (Ü\"L@ ! \f!\f\v  \f6Ü  6Ì /æ!  /î;æ  ;îA\x07!( \f!\v  (6¼  6¼  6¬ 	 \r 	 \rH\x1B\"( \b \b (J\x1B\"\x1B   \x1BJ\x1B A\0 A\0J\x1B\" \x07 \x07 H\x1B\"\f   \fH\x1B\"%   %H\x1BH@@AA \x07 J  \fJ\x1B  %J\x1B\"\fAt\"\x07 A°j\"r AA 	 \rJ \b (H\x1B  \x1BH\x1B\"	At\"r(\0As6\0 AÀj\" \x07r  	Ar\"Atj(\x006\0 A°j \x07rA\x006\0 Aàj\" \fAtr At r/\0;\0 A\xA0j rAÿÿÿÿ\x076\0 Aðj\" \fAtj\" 	At j\")\x007\0  )\b7\b (\xA0\"	 (¤\"\r 	 \rH\x1B\"( (¨\"\b \b (J\x1B\"\x1B (¬\"  \x1BJ\x1B (°\"A\0 A\0J\x1B\" (´\"\x07 \x07 H\x1B\"\f (¸\"  \fH\x1B\"% (¼\"  %H\x1BH\r\0\v\v 0 0-\0\0 (°Avj:\0\0 0 0-\0 (´Avj:\0 0 0-\0  (¸Avj:\0  0 0-\x000 (¼Avj:\x000 \v!\v AJ\r\0\v (Ü!\x07 (Ø! (Ô! (Ð!	 (Ì!\r (È!\0 (Ä! (À\v\" J    H\x1B\" \0J\x1B  \0 \0 J\x1B\"\0 \rJ\x1B \0 \r \0 \rH\x1B\"\0 	J\x1B \0 	 \0 	H\x1B\"\0 J\x1B \0  \0 H\x1B\"\0 J\x1B \0  \0 H\x1B\" \x07J\x1B!\0@ A\0L\r\0 E\r\0 2 Aðj \0AqAtj ü\n\0\0\v 2 2-\0\0 \0Avj:\0\0 AÀj$\0 .( $ ..\0lj!	 ) 1jA  * 	 *j\"	Ak-\0\0A\v 	-\0\0k\nAtkAu  l  \x07  \x07H\x1Bj6\0 Aj\" G\r\0\v\v 1 7Aü\0j Ar , + 7(|\"Atj(\0:\0\0 ..\"\0@ ,Aj  Atj \0ü\n\0\0\v  , .o 1(\0 7Aj$\0\f\vAÚØ\0Aü+A?\0\v (ä' A j\"  (\xA0$!@ 5@ 6A@k\"\0 3  ,\0% (\xA0$T (ä'  \0 (\xA0$!\f\v (\xA0$\"\0AN\r \0At\"\0E\r\0   \0ü\n\0\0\v 6Aà\0j$\0\f\vAô\0A¡#A3\0\vA¸è\0A¡#A?\0\vAÀ\0A¡#Aè\0\0\v@ (\xA0$\"\fA\0L\r\0 \fAq!A\0!%A\0!\r@ \fAO@ \fAüÿÿÿ\x07q!A\0!@ ' \rAtj  \rAtj.\0²C\0\098\0 ' \rAr\"\0Atj  \0Atj.\0²C\0\098\0 ' \rAr\"\0Atj  \0Atj.\0²C\0\098\0 ' \rAr\"\0Atj  \0Atj.\0²C\0\098\0 \rAj!\r Aj\" G\r\0\v E\r\v@ ' \rAtj  \rAtj.\0²C\0\098\0 \rAj!\r %Aj\"% G\r\0\v\v \fAq!	 'A@k!\x07 A j!\bA\0!A\0!\r \fAO@ \fAüÿÿÿ\x07q!A\0!@ \x07 \rAtj \b \rAtj.\0²C\0\098\0 \x07 \rAr\"\0Atj \b \0Atj.\0²C\0\098\0 \x07 \rAr\"\0Atj \b \0Atj.\0²C\0\098\0 \x07 \rAr\"\0Atj \b \0Atj.\0²C\0\098\0 \rAj!\r Aj\" G\r\0\v 	E\r\v@ \x07 \rAtj \b \rAtj.\0²C\0\098\0 \rAj!\r Aj\" 	G\r\0\v\v A@k$\0 (ì#!\x07 (ä# (\xA0$!\b#\0Ak\"	$\0 	 '  \x07 \bj\"\0At\" \b9 *\0!@  	 \bAtj\" \x07\r @ @»¢¶8È *!@   \0Atj\"\0 \x07\r @ @»¢¶8ÌAF@ 	 'A@k  Atj  \b9 *\b!@   \x07\r @ @»¢¶8Ð *\f!@  \0 \x07\r @ @»¢¶8Ô\v 	Aj$\0  )\f7¬#  )\f7¤#  )\f7#  )\f7# Aj$\0A\0!\0A\0!\bA\0!	#\0Ak\"\f$\0@ \n\"\v-\0%AG@ \v(ä#!\x07\f\v *ÄC\0\0@ÁC\0\0¾»!M \v(ä#\"\x07A\0L\r\0D\0\0\0\0\0\0ð? MD\0\0\0\0\0\0ð?\xA0£¶C\0\0\0¿C\0\0?!@ \x07Aq! \x07AO@ \x07Aüÿÿÿ\x07q!@  \0Atj\" @ *\08\0  @ *8  @ *\b8\b  @ *\f8\f \0Aj!\0 \bAj\"\b G\r\0\v E\r\v@  \0Atj\" @ *\08\0 \0Aj!\0 	Aj\"	 G\r\0\v\v \v(ì#!\0 \v(ì$²C\0\0\0¼C\0\0¨ACÃõ¨>»O!M@ \x07A\0L\r\0 M \0·£¶!A AÈj!	A\0!\0@ \x07AG@ \x07Aq \x07Aþÿÿÿ\x07q!A\0!\b@  \0At\"j\" *\0\"@ @  	j*\0 A\"@C\0þÿF @C\0þÿF]\x1B8\0  Ar\"j\" *\0\"@ @  	j*\0 A\"@C\0þÿF @C\0þÿF]\x1B8\0 \0Aj!\0 \bAj\"\b G\r\0\vE\r\v  \0At\"j\"\0 \0*\0\"@ @  	j*\0 A\"@C\0þÿF @C\0þÿF]\x1B8\0\v \x07Aq!A\0!	A\0!\0 \x07AO@ \x07Aüÿÿÿ\x07q!A\0!\b@ \f \0At\"\nj \n j*\0C\0\0Gü\x006\0 \f \nAr\"j  j*\0C\0\0Gü\x006\0 \f \nA\br\"j  j*\0C\0\0Gü\x006\0 \f \nA\fr\"j  j*\0C\0\0Gü\x006\0 \0Aj!\0 \bAj\"\b G\r\0\v E\r\v@ \f \0At\"j  j*\0C\0\0Gü\x006\0 \0Aj!\0 	Aj\"	 G\r\0\v\v \x07At\"\0@ AØj \f \0ü\n\0\0\vA{ ? \x1B! \vA%j\"\0!$  \v-\0à8:\0è \0 \f \vAà8j AF \v(ä#u@ \v(ä#\"A\0L\r\0 Aq!\nA\0!	A\0!\0 AO@ Aüÿÿÿ\x07q!A\0!\b@  \0At\"\x07j \x07 \fj(\0²C\0\078\0  \x07Ar\"j  \fj(\0²C\0\078\0  \x07A\br\"j  \fj(\0²C\0\078\0  \x07A\fr\"j  \fj(\0²C\0\078\0 \0Aj!\0 \bAj\"\b G\r\0\v \nE\r\v@  \0At\"j  \fj(\0²C\0\078\0 \0Aj!\0 	Aj\"	 \nG\r\0\v\v@ \v-\0%\"AG@ \v,\0%!\0\f\v \v \v(è$²C\0\0\x008 *ÄC\0\0?^E\"\0:\0%\v  ÀAtA|qAj \0Atj.\0²C\0\0:CÍÌL? *¼CÍÌL¾ *¸CÍÌÌ½ \v(´#²CÍÌL¾C\0\0; \v($²CÍÌL½C?8´ \fAj$\0@ \v(¬0E\r\0 \v(´#AÎ\0H\r\0 \vAô$j\" \v(ô,\"\0AtjA6\0 A\nj \vAjA\"ü\n\0\0 \v \0A$ljA´0j\"\f $( 6  \f $)7 \f $)7 \f $)\b7\b \f $)\x007\0 \v(ä#\"At\"\0@ AðÎ\0j  \0ü\n\0\0\v@ \v(ô,\"\0@  \0AtjAk(\0\r\v \v \v-\0à8:\0¼# \fA? \f-\0\0 \v-\0°0jÀ\"\0 \0A?N\x1B:\0\0\v  \f \vA¼#j AF t@ \v(ä#\"A\0L\r\0 Aq!\nA\0!\0A\0!\x07 AO@ Aüÿÿÿ\x07q!A\0!@ \x07At\"\b A¤ä\0j\"	j \b j(\0²C\0\078\0 	 \bAr\"j  j(\0²C\0\078\0 	 \bA\br\"j  j(\0²C\0\078\0 	 \bA\fr\"j  j(\0²C\0\078\0 \x07Aj!\x07 Aj\" G\r\0\v \nE\r\v@ \x07At\" A¤ä\0jj  j(\0²C\0\078\0 \x07Aj!\x07 \0Aj\"\0 \nG\r\0\v\v \v A¤ä\0j\" \f A\nj \v \v(ô,AÀljA\xA01j 4 \v(ä#At\"\0E\r\0  AðÎ\0j \0ü\n\0\0\v $ \v(ä#s!\n  )(7O  ) 7O  )7O  )7O  )\b7øN  )\x007ðN A\nj \vAj\")A\"ü\n\0\0 AF!  j! \vAà8j!/ \vA¤%j!  \v(-! \v/-! \v-\0¢%! Aüé\0j! A,j!A!\fA!\bA\0!A\0!A!	A\0!@@ \b \nF\"@ !\0\f\v 	 \nF@ !\0\f\v 9@  )O7(  )O7   )O7  )O7  )øN7\b  )ðN7\0 ) A\njA\"ü\n\0\0 \v ;- \v :\0¢% \v 6-\v \v A¤ä\0j $ )   4 :E 9AFq\"\x07@  )7èN  )\b7àN  )\x007ØN (!8  )$7ÈN  (,6ÐN  )7ÀN\v \v  \v(ô,A\0 ,  \v,\0% \v,\0%   \v(è#+ \x07 ( (gjA k\"\0 Jq@  )èN7  )àN7\b  )ØN7\0  86  (ÐN6,  )ÈN7$  )ÀN7 \v -\0j\"\0:\0à8@ \v(ä#\"\x07A\0L\r\0 \x07E\r\0 $A \x07ü\v\0\v E@ $ \0:\0\0\v \v 6- \v ;-@ \v(è#\"\0A\0L\r\0 \0E\r\0  A\0 \0ü\v\0\v \v  \v(ô,A\0 ,  \v,\0% \v,\0%   \v(è#+ ( (gjA k!\0\v  9r\r\0 \0 L\r\v@@@@@ 9AF@ :E\r\b  \0 JrE\r\b  )èN7  )àN7\b  )ØN7\0  86  (ÐN6,  )ÈN7$  )ÀN7 8Aü	O\r 8@ (\0  8ü\n\0\0\v ) A\"ü\n\0\0 / :\0\0\f\b\v@@ \0 J@ :\r 9AI\r  *ØiC\0\0À?\"@C\0\0À? @C\0\0À?^\x1B8ØiA\0!= \vA\0:\0%A!\n !\0\f\v \0 N\r	 E@  )7èN  )\b7àN  )\x007ØN (!8  )$7ÈN  (,6ÐN  )7ÀN 8Aü	O\r 8@  (\0 8ü\n\0\0\v  )A\"ü\n\0\0 /-\0\0!\v \fÁ!< =E\r \0! \n!\b\f\v \fÁ!>A!= :E\r \0! \n!	\f\vAÀ\0 <AtAm\" AÀ\0L\x1B!\fA\0!=A!: \0! \n!\b\f\vAîÑ\0AÊ8A\0\vAÃÑ\0AÊ8A£\0\vA!: > <k\"\0  kl  km <j\"\x07Á\"\n \0Au\"\0 <j\"\fJ\r > \0k\"\0 \x07 \0 \nJ\x1B!\f\f\v \v(ä#\"\rA\0J@ \v(ì#!\"A\0!@ Aj!	A\0! \"A\0J@ 	 \"l!  \"l!\x07@  \x07  j,\0\0\" Au\"s kj! \x07Aj\"\x07 H\r\0\v\v@@ 9@  At\"\x07 AÎ\0jj(\0N\r A\xA0Î\0j \x07j(\0\r\v AÎ\0j Atj \f;\0 AÎ\0j Atj 6\0\f\v A\xA0Î\0j \x07jA6\0\v 	\" \rG\r\0\v\vA\b \fÁAlAm\" A\bN\x1B!\f \0! \n!	\vA\0!\x07 \v(ä#\"A\0J@@ \x07At\" A\xA0Î\0jj(\0 AÎ\0j \x07Atj/\0 \f\v!\0 A°Î\0j jAþÿÿ\x07A| \0Á\"\n  j(\0\"\0AÿÿqlAu \0Au \nlj\"\0 \0A|L\x1BA\bt \0AÿÿÿJ\x1B6\0 \x07Aj\"\x07 G\r\0\v\v \v -\0j:\0à8 $ A°Î\0j /  u $ \v(ä#s!\n@ \v(ä#\"A\0L\r\0 Aq!\rA\0!\0A\0!\x07 AO@ Aüÿÿÿ\x07q!A\0!@ \x07At\"- A¤ä\0j\"#j A°Î\0j\"\" -j(\0²C\0\078\0 # -Ar\"j  \"j(\0²C\0\078\0 # -A\br\"j  \"j(\0²C\0\078\0 # -A\fr\"j  \"j(\0²C\0\078\0 \x07Aj!\x07 Aj\" G\r\0\v \rE\r\v@ \x07At\" A¤ä\0jj A°Î\0j j(\0²C\0\078\0 \x07Aj!\x07 \0Aj\"\0 \rG\r\0\v\v 9Aj!9\f\0\v\0\v \0(ð# \bAljAt\"\0@ ; ; \nAtj \0ü\n\0\0\vA\0\f\v \v(È$! \v(ð# \v(à#AljAt\"\0@ ; ; \v(è#Atj \0ü\n\0\0\vA\0 \r\0 \v(ä#At jAæ\0j(\0!\0 \vA\x006¸$ \v \v-\0%:\0½# \v \x006À# ( (gjAkAu\v6\0 Aê\0j$\0A\0\v\x1B \0Aê'j!\b#\0A0k\"	$\0@ \0(è#\"AÁH@ A\x07qE@ 	A\x006\0 	 Au\" Au\"j\"6 	  j\"\x076\b 	  \x07j\"\n6\f 	 \n Au\"\fjAtAjApqk\"$\0 \b \0A$j   \nAtj \0(è#=  \0A,j   \x07Atj \f=  \0A4j   Atj =  Ak\"Atj\" .\0Au\";\0@ AH\r\0 Aq@  Atj\"Ak\"\x07 \x07.\0Au\"\x07;\0  /\0 \x07k;\0 Ak!\v AF\r\0@  Atj\"Ak\" .\0Au\";\0  /\0 Ak\".\0Au\"\x07k;\0  \x07 k;\0 AJ Ak!\r\0\v\v  /\0 \0/\\k;\0 \0 ;\\ \0A<j!@ At\" 	A jj  j\"(\0!\b@ \0(è#AA k\" AO\x1Bu\"Au\"\x07A\0J@ \x07Aq!\n   	j\"\f(\0Atj!\rA\0!A\0!A\0!@ \x07AI\"E@ \x07Aüÿÿÿ\x07q!A\0!@ \r Atj\"\v.Au\" l  \v.\0Au\" lj \v.Au\" lj \v.Au\" ljj! Aj! Aj\" G\r\0\v \nE\r\v@  \r Atj.\0Au\" lj! Aj! Aj\" \nG\r\0\v\vAÿÿÿÿ\x07  \bj\" A\0H\x1B!\r  \f(\0Atj \x07Atj!\vA\0!A\0!A\0!@ E@ \x07Aüÿÿÿ\x07q!A\0!@ \v Atj\"\b.Au\" l  \b.\0Au\" lj \b.Au\" lj \b.Au\" ljj! Aj! Aj\" G\r\0\v \nE\r\v@  \v Atj.\0Au\" lj! Aj! Aj\" \nG\r\0\v\vAÿÿÿÿ\x07  \rj\" A\0H\x1B!\r  \f(\0Atj A|qj!\vA\0!A\0!A\0!@ E@ \x07Aüÿÿÿ\x07q!A\0!@ \v Atj\"\b.Au\" l  \b.\0Au\" lj \b.Au\" lj \b.Au\" ljj! Aj! Aj\" G\r\0\v \nE\r\v@  \v Atj.\0Au\" lj! Aj! Aj\" \nG\r\0\v\vAÿÿÿÿ\x07  \rj\" A\0H\x1B!\b  \f(\0Atj \x07Alj!\fA\0!A\0!A\0! E@ \x07Aüÿÿÿ\x07q!A\0!@ \f Atj\"\x07.Au\"\v \vl  \x07.\0Au\"\v \vlj \x07.Au\" lj \x07.Au\" ljj! Aj! Aj\" G\r\0\v \nE\r\v@  \f Atj.\0Au\" lj! Aj! Aj\" \nG\r\0\v\f\vAÿÿÿÿ\x07 \b \bA\0H\x1B!\bA\0!\vAÿÿÿÿ\x07 \b Avj\" A\0H\x1B6\0  6\0 Aj\"AG\r\0\vA\0! \0(\"Aç\x07L@ \0 Aj6Aÿÿ AuAjm!\vAÿÿÿÿ\x07Aÿÿÿÿ\x07 	( \"\f \0(j\" A\0H\x1B\"n!A! \0A  \0(`\"AtJ\r\0A\b  J\r\0 Á\" Avl  AuAjAulj Aÿÿq lAuj\"AuApq AvAÿqr\v\"   H\x1BÁ\"  \0(p\"k\"Aul j Aÿÿq lAuj\"6p \0Aÿÿÿ\x07Aÿÿÿÿ\x07 m\" Aÿÿÿ\x07N\x1B6`Aÿÿÿÿ\x07Aÿÿÿÿ\x07 	($\" \0(j\" A\0H\x1B\"n!@  \0(d\"AtJ\r\0A\b!  J\r\0 Á\" Avl  AuAjAulj Aÿÿq lAuj\"AuApq AvAÿqr!\v \0    H\x1BÁ\"  \0(t\"k\"Aul j Aÿÿq lAuj\"6t \0Aÿÿÿ\x07Aÿÿÿÿ\x07 m\" Aÿÿÿ\x07N\x1B6dAÿÿÿÿ\x07Aÿÿÿÿ\x07 	((\"\v \0(j\" A\0H\x1B\"n!A! \0A  \0(h\"AtJ\r\0A\b  J\r\0 Á\" Avl  AuAjAulj Aÿÿq lAuj\"AuApq AvAÿqr\v\"   H\x1BÁ\"  \0(x\"k\"Aul j Aÿÿq lAuj\"6x \0Aÿÿÿ\x07Aÿÿÿÿ\x07 m\" Aÿÿÿ\x07N\x1B6hAÿÿÿÿ\x07Aÿÿÿÿ\x07 	(,\"\r \0(j\" A\0H\x1B\"n!@  \0(l\"AtJ\r\0A\b!  J\r\0 Á\" Avl  AuAjAulj Aÿÿq lAuj\"AuApq AvAÿqr!\v \0Aà\0j! \0    H\x1BÁ\"  \0(|\"k\"Aul j Aÿÿq lAuj\"6| \0Aÿÿÿ\x07Aÿÿÿÿ\x07 m\" Aÿÿÿ\x07N\x1B6lA\0!A\0!A\0!@@ At\"\n 	A jj(\0\" \n j(\0\"\x07k\"A\0J@ 	Aj \nj A\bt  AI\"\x1B \x07 \x07A\bu \x1BAjm\"6\0 \nAtA kAu\" l j! Aÿÿ?M@@ g\"\x07AF@A\v!\bA§!\f\vAAé \x07Aq\x1B \x07Avv\"\bAÕl! Aÿ\0M@  \x07Akt!\f\v  \x07A\bjt A \x07kvj!\v  Aÿ\0qlAv \bjAtAÀÿq lAu!\v \n(àÎ\"Au l j Aÿÿq lAuj!\f\v 	Aj \njA6\0\v Aj\"AG\r\0\v Am! AN@ g\"AF\r\0 AÿM@  Akt!\f\v  A\bjt A kvj!\vAAé Aq\x1B Avv\" Aÿ\0qlAÕlAv jA\flAuAÈßlAuAkA\v! \0 AtAk6è$@  \0(dkAuA~q \f \0(`kAuj \v \0(hkAuAlj \r \0(lkAuA|qj \0(è#\" \0(à#\"AlFu\"A\0L@ Au!\f\v Aÿÿ\0K\r\0 ÁAAé At\"g\"Aq\x1B Avv\"  A kvAÿ\0qlAÕlAvjAjlAu!\v \0Aÿ A\x07u\" AÿN\x1B6´# \0 Á Aÿÿql  AvlAtjAA  A\nlF\x1Bu\" 	( \0(L\"k\"Aul j Aÿÿq lAuj\"6L \0 \nAlA(kAu6Ø$ \0 	( \0(P\"k\"Au l j Aÿÿq lAuj\"6P \0 \nAlA(kAu6Ü$ \0 	( \0(T\"k\"Au l j Aÿÿq lAuj\"6T \0 \nAlA(kAu6à$ \0 	( \0(X\"k\"Au l j Aÿÿq lAuj\"6X \0 \nAlA(kAu6ä$ 	A0j$\0\f\vAÁó\0A<Aê\0\0\vAÃA<Aè\0\0\v \0(´#!@@@ E@ A\rH\r \0A\f6´#\f\v A\fJ\r\vA\0! \0A\0:\0% \0 \0(¤0\"Aj6¤0 A\nN@ AI\r \0A\n6¤0\v \0A\x006\xA00\f\v \0B\x007\xA00A! \0A:\0%\v \0 \0(ô,jAð$j :\0\0\væ\r\b|}#\0Aà\x07k\"\b$\0  l\"\x07AH@  \x07\r! \bA\xA0jA\0AÀü\v\0 A\0J@@A! A\0J@   	lAtj!\n@ At \bj\"\x07 \n \n Atj  k\" \x07+\xA09  G Aj!\r\0\v\v 	Aj\"	 G\r\0\v\v \bAàj \bA\xA0jAÀü\n\0\0 \b D\0\0\0µøä>¢ \xA0D\0\0\0à\v.>\xA0\"9À \b 9|@ A\0L@D\0\0\0\0\0\0ð?!\f\v »!A\0!\nA!A!D\0\0\0\0\0\0ð?!@ \n!	 A\0J@A\0!\n  	kAt!@   \nlAtj\"\v 	Atj\"\f*\0\"\x1B»! \v j\"\rAk*\0\"»!A\0! 	@@ At\" \bA\xA0jj\"\x07 \x07+\0 \x1B \f AsAtj*\0\"»¡9\0 \bAàj j\"\x07 \x07+\0  \r Atj*\0\"»¡9\0 » \b j+\0\"¢ \xA0! » ¢ \xA0! Aj\" 	G\r\0\v\v ! !A\0!@ At\"\f \bAjj\"\x07  \v 	 kAtj*\0»¢ \x07+\0\xA09\0 \bAÀj \fj\"\x07  \r AtjAk*\0»¢ \x07+\0\xA09\0 Aj\" G\r\0\v \nAj\"\n G\r\0\v\v 	At\" \bAàjj+\0! \bA\xA0j j+\0!@ 	E\r\0A\0! 	AG@ 	Aq 	Aþÿÿÿ\x07q!A\0!\v@ 	 AþÿÿÿsjAt\" \bA\xA0j\"\fj+\0 \b Atj\"\x07+\b\"¢ \f 	 AsjAt\"\nj+\0 \x07+\0\"¢ \xA0\xA0!  \bAàj\"\x07j+\0 ¢ \x07 \nj+\0 ¢ \xA0\xA0! Aj! \vAj\"\v G\r\0\vE\r\v 	 AsjAt\"\x07 \bA\xA0jj+\0 \b Atj+\0\"¢ \xA0! \bAàj \x07j+\0 ¢ \xA0!\v 	Aj\"\nAt\"\x07 \bAjj 9\0 \bAÀj \x07j 9\0A\0! \b+! \b+À! 	@@ Aj\"\x07At\" \bAjj+\0 \b Atj+\0\"¢ \xA0!  \bAÀj\"\fj+\0 ¢ \xA0! 	 kAt \fj+\0 ¢ \xA0! \x07\" 	G\r\0\v\v D\0\0\0\0\0\0ð? D\0\0\0\0\0\0\0À¢  \xA0£\" ¢¡¢\" e\"|D\0\0\0\0\0\0ð?  £¡\"  D\0\0\0\0\0\0\0\0d\x1B!  \v!@ 	E\r\0 \b j!\vA\0! Av\"\x07AG@ \x07Aþÿÿÿ\x07q!\fA\0!@ \b Atj\"\r  \v AsAtj\"\x07+\0\"¢ \r+\0\"\xA09\0 \x07   ¢\xA09\0 \r  \v AþÿÿÿsAtj\"\x07+\0\"¢ \r+\b\"\xA09\b \x07   ¢\xA09\0 Aj! Aj\" \fG\r\0\v AqE\r\v \b Atj\"\f  \v AsAtj\"\x07+\0\"¢ \f+\0\"\xA09\0 \x07   ¢\xA09\0\v \b j 9\0@ E@ A~q!\r Aq!A\0!A\0!\v@ 	 kAt \bj\"  \bAj\"\f Atj\"\x07+\0\"¢ +È\"\xA09È \x07   ¢\xA09\0 Ar\"\x07At \fj\"\f  	 \x07kAt \bj\"\x07+È\"¢ \f+\0\"\xA09\0 \x07   ¢\xA09È Aj! \vAj\"\v \rG\r\0\v\f\v@  \nL\r\0 At 	At\"\nkA\bk\"\x07E\r\0 \b \njA\bjA\0 \x07ü\v\0\v Aq!\fA\0!\vA\0!@ AO@ Aüÿÿÿ\x07q!	A\0!\n@ \0 Atj \b Atj+\0¶8\0 \0 Ar\"\x07Atj \b \x07Atj+\0¶8\0 \0 Ar\"\x07Atj \b \x07Atj+\0¶8\0 \0 Ar\"\x07Atj \b \x07Atj+\0¶8\0 Aj! \nAj\"\n 	G\r\0\v \fE\r\v@ \0 Atj \b Atj+\0¶8\0 Aj! \vAj\"\v \fG\r\0\v\vA\0! A\0J@@    lAtj \r¡! Aj\" G\r\0\v\v  ¢\f\v @ 	 kAt \bj\"	  \bAj Atj\"\x07+\0\"¢ 	+È\"\xA09È \x07   ¢\xA09\0\v Aj! Aj!  \nG\r\0\v \b+!@ AF@A\0!D\0\0\0\0\0\0ð?!\f\v Aq Aþÿÿÿ\x07q!A\0!D\0\0\0\0\0\0ð?!A\0!\v@ Ar\"At\" \bAj\"j+\0! \0 Atj \b Atj+\0\"¶8\0 Aj\"At j+\0 \0 Atj  \bj+\0\"¶8\0 ¢  ¢ \xA0\xA0!  ¢  ¢ \xA0\xA0! \vAj\"\v G\r\0\vE\r\v At\" \bAjj+\b \0 Atj  \bj+\0\"¶8\0 ¢ \xA0!  ¢ \xA0!\v D\0\0\0µøä¾¢ ¢ \xA0\v \bAà\x07j$\0¶\vAÊ\0A\xA09A8\0\vxd#\0Að\x07k\"$\0@ \0(ä#\"A\0J@ Aôj!\v \0($\"Aþÿÿÿ\x07q!\n Aq!\x07@@ A\0L\r\0 \bAl!\fA\0!A\0! AG@@ A0j\"	  \fj\"\rAtj \v \rAtj*\0C\0\0\0Fü\0;\0 	 \rAj\"	Atj \v 	Atj*\0C\0\0\0Fü\0;\0 Aj! Aj\" \nG\r\0\v \x07E\r\v A0j  \fj\"	Atj \v 	Atj*\0C\0\0\0Fü\0;\0\v \bAj\"\b G\r\0\v A¤j!\f Aj!\r Aôj!\n Aj!\x07A\0!\v@ \x07 \vAt\"j*\0C\0\0Fü\0!	 A j j \n j*\0C\0\0Fü\0Aÿÿq 	Atr6\0 Aj j \r j*\0C\0\0Fü\x006\0  j \f j*\0C\0\0Fü\x006\0 \vAj\"\v G\r\0\vA Al\"\n \nAL\x1B\"\x07Aq!\r Aj!A\0! *´C\0\0Dü\0!	A\0! \nAN@ \x07Aüÿÿÿ\x07q!\nA\0!\b@ Aðj\"\f Atj  Atj*\0C\0\0Fü\0;\0 Ar\"\x07At \fj  \x07Atj*\0C\0\0Fü\0;\0 Ar\"\x07At \fj  \x07Atj*\0C\0\0Fü\0;\0 \f Ar\"\x07Atj  \x07Atj*\0C\0\0Fü\0;\0 Aj! \bAj\"\b \nG\r\0\v \rE\r\v@ Aðj Atj  Atj*\0C\0\0Fü\0;\0 Aj! Aj\" \rG\r\0\v\f\v *´C\0\0Dü\0!	\v@ \0(\xA0$\"\vA\0L\r\0 Aj! \vAq!\rA\0!A\0!@ \vAO@ \vAüÿÿÿ\x07q!\nA\0!\b@ A\xA0j\"\f Atj  Atj*\0C\0\0Eü\0;\0 Ar\"\x07At \fj  \x07Atj*\0C\0\0Eü\0;\0 Ar\"\x07At \fj  \x07Atj*\0C\0\0Eü\0;\0 \f Ar\"\x07Atj  \x07Atj*\0C\0\0Eü\0;\0 Aj! \bAj\"\b \nG\r\0\v \rE\r\v@ A\xA0j Atj  Atj*\0C\0\0Eü\0;\0 Aj! Aj\" \rG\r\0\v\v \vAq!\r AÐ\0j! AÀj!\fA\0!\bA\0! \vAO@ \vAüÿÿÿ\x07q!\nA\0!\v@ \f Atj  Atj*\0C\0\0Eü\0;\0 \f Ar\"\x07Atj  \x07Atj*\0C\0\0Eü\0;\0 \f Ar\"\x07Atj  \x07Atj*\0C\0\0Eü\0;\0 \f Ar\"\x07Atj  \x07Atj*\0C\0\0Eü\0;\0 Aj! \vAj\"\v \nG\r\0\v \rE\r\v@ \f Atj  Atj*\0C\0\0Eü\0;\0 Aj! \bAj\"\b \rG\r\0\v\v@ A\0L\r\0 Aq!\rA\0!A\0! AO@ Aüÿÿÿ\x07q!\nA\0!\b@ At\" Aàj\"\fj  j*\0C\0\0Gü\x006\0 \f Ar\"\x07j  \x07j*\0C\0\0Gü\x006\0 \f A\br\"\x07j  \x07j*\0C\0\0Gü\x006\0 \f A\fr\"\x07j  \x07j*\0C\0\0Gü\x006\0 Aj! \bAj\"\b \nG\r\0\v \rE\r\v@ At\"\x07 Aàjj  \x07j*\0C\0\0Gü\x006\0 Aj! Aj\" \rG\r\0\v\vA\0!\b -\0AF@ ,\0!AtAj.\0!\b\v@ \0(è#\"\x07A\0L\r\0 \x07Aq!\rA\0!\vA\0! \x07AO@ \x07Aüÿÿÿ\x07q!\nA\0!@ Aðj\"\f Atj  Atj*\0ü\0;\0 Ar\"\x07At \fj  \x07Atj*\0ü\0;\0 Ar\"\x07At \fj  \x07Atj*\0ü\0;\0 \f Ar\"\x07Atj  \x07Atj*\0ü\0;\0 Aj! Aj\" \nG\r\0\v \rE\r\v@ Aðj Atj  Atj*\0ü\0;\0 Aj! \vAj\"\v \rG\r\0\v\v@@ \0($AL@ \0(À$A\0L\r\v ! Aðj!A A\xA0j!B Aðj!J A0j!K Aj!L A j!M Aàj!W Aäj!C 	! \b!A\0!\n#\0A°k\"!! $\0 \"(è!!4  \0\"($\"A\nlAjApqk\"$\0 A\nl\"\0@ A\0 \0ü\v\0\v A\0J@ A!j!\x07 Aj!\r  (ð#AtjAü	j(\0!	 (ä!! (à!! -\0\"!@  \nA\nlj\"\fA\x006\n \f  \njAq\"\x006\n \f \x006\n \f 6\n \f 6\n \f 	6\b \f \r)\x007\0 \f \r)\b7\b \f \r)7 \f \r)7 \f \r) 7  \f \r)(7( \f \r)070 \f \r)878 \fA\xA0	j \x07Aà\0ü\n\0\0 \nAj\"\n G\r\0\v\v -\0! ,\0!\0 !A\x006¬ ÀAtA|qAj \0AtjA( (ì#\"\n \nA(N\x1B!@ AF@ (ä#\"\0A\0L\r \0Aq!\x07@ \0AI@A\0!\f\v \0Aüÿÿÿ\x07q!A\0!@  C Atj\"\r(\0Ak\"\0 \0 J\x1B\" \r(Ak\"\0 \0 J\x1B\" \r(\bAk\"\0 \0 J\x1B\" \r(\fAk\"\0 \0 J\x1B! Aj! \x1BAj\"\x1B G\r\0\v \x07E\r\v@  C Atj(\0Ak\"\0 \0 J\x1B! Aj! Aj\" \x07G\r\0\v\f\v 4A\0L\r\0  4Ak\"\0 \0 J\x1B!\v.\0! -\0!  (ð#\"	 (è#j\"AtAjApqk\";\"\0$\0 \0 AtAjApqk\"N\"\0$\0 \0 \nAtAjApqk\"O$\0  	6ì!  	6ð!  	Atj!@@ (ä#\"\0A\0J@AA AF\"P\x1B!Q A\nj! Á!%@  (At\"\0\"j(\0! A\x006ü!A!\v B (Av PrAtj!@ -\0\"\nAG\r\0A!\n \0 Cj(\0!4 ( Qq\r\0@ (AG\r\0@@@@ ($\"\bAN@ \bAk\"\0Aq! (\n!\nA\0!A! \bAkAO\rA\0!\f\vA\0! \bAF\r\f\v \0A|q!\vA\0!A\0!\x1B@  A\nlj\"\0(Ì(\"\f \0(¸\"\r \0(¤\" \0(\n\"\0 \n \0 \nH\"\x07\x1B\"\0 \0 J\"	\x1B\"\0 \0 \rJ\"\x1B\"\0 \0 \fJ\"\0\x1B!\n Aj Aj Aj   \x07\x1B 	\x1B \x1B \0\x1B! Aj! \x1BAj\"\x1B \vG\r\0\v E\r\v@  A\nlj(\n\"\0 \n \0 \nH\"\0\x1B!\n   \0\x1B! Aj! Aj\" G\r\0\v\vA\0! \bAG@ \bAq \bA~q!A\0!\n@  G@  A\nlj\"\0 \0(\nAÿÿÿ?j6\n\v  Ar\"\0G@  \0A\nlj\"\0 \0(\nAÿÿÿ?j6\n\v Aj! \nAj\"\n G\r\0\vE\r\v  F\r\0  A\nlj\"\0 \0(\nAÿÿÿ?j6\n\v A\0L@A\0!D\f\v !(¬ j!  A\nlj\"\0A\bj!\x07 \0AÀj!	 \0A\xA0j!A\0!DA\0!@   k\"\0j  AkA(o\"A(j  A\0H\x1B\"At\"\rj(\0A	vAjAv:\0\0  \0AtjAÿÿA~ W(\"Á\"\0 	 \rj(\0\"\nAÿÿqlAu \0 \nAulj AuAjAu \nljA\ruAjAu\"\0 \0A~L\x1B\"\0 \0AÿÿN\x1B;\0  (ð! kAtj Atj \x07 \rj(\x006\0 Aj\" G\r\0\v\v (ð#\" 4 (\xA0$\"jk\"\0AL\r (ä' N \0Ak\"At\"\0j \0 j (ì# (lAtj   k 6 (ð#!\0 A6ü!  \x006ì! -\0!\nA\0!\v\vA\0A  Wj\"\f(\0\" AL\x1B\"\0 \0g\"Akt\"\0AÿÿqAÿÿÿÿ \0Au\"\0m\"Á\"lAu \0 ljAtk\"\0 AuAjAul Atj \0Au lj \0Aøÿq lAuj!  Cj(\0!\x1B ($!  Aÿÿ\x07L@Aÿÿÿÿ\x07 Ak\"v\" Ax u\"\0 \0 H\x1B  H\x1B t\f\v  Asu\v!@ (ì#\"\0A\0L\r\0 AuAj\"AtAu!\b AuAjAu!A\0! \0AG@ \0Aq \0Aþÿÿÿ\x07q!\x07A\0!@ O Atj A Atj/\0\"	Á\"Au \bl  lj \b 	lAuj6\0 O Ar\"Atj A Atj/\0\"	Á\"Au \bl  lj \b 	lAuj6\0 Aj! Aj\" \x07G\r\0\vE\r\v O Atj A Atj/\0\"Á\"Au \bl  lj  \blAuj6\0\v@ \v\r\0 (E@ Au %l Aÿÿq %lAujAt!\v (ì!\"\x07 \x1Bk\"	Ak\" \x07N\r\0 Aÿÿq!\r Au! \x1BAq@ ; Atj \r N Atj.\0\"lAu  lj6\0 	Ak!\v \x1BAF\r\0@ ; Atj \r N Atj.\0\"lAu  lj6\0 ; Aj\"Atj \r N Atj.\0\"lAu  lj6\0 Aj\" \x07G\r\0\v\v \nÀ!\b (ø!\" G@   Au\"\0s \0kg\"Akt\"Aÿÿÿÿ   Au\"\0s \0kg\"Akt\"\0AumÁ\"	 AÿÿqlAu 	 Aulj\"¬ \0¬~B§Axqk\"\0Au 	l j \0Aÿÿq 	lAuj!	  k\"\0ArL@Aÿÿÿÿ\x07As \0k\"v\" 	Ax u\"\0 \0 	H\x1B  	H\x1B t\f\v 	 \0A\rjuA\0 \0AH\x1B\v!\v (ð#\"\0A\0J@ \vAÿÿq!	 \vAu! (ð! \0k!@  Atj\"\0 \0(\0\"Á\"\0 	lAu \0 lj AuAjAu \vlj6\0 Aj\" (ð!H\r\0\v\v@ \nAÿqAG\r\0 (ü!\r\0 (ì!\"\0 \x1BkAk\" \0 k\"\x07N\r\0 \vAÿÿq!	 \vAu!@ ; Atj\"\0 \0(\0\"Á\"\0 	lAu \0 lj AuAjAu \vlj6\0 Aj\" \x07G\r\0\v\v  A\0J@ \vAÿÿq!\r \vAu!\x07A\0!\n@  \nA\nlj\" (\n\"Á\"\0 \rlAu \0 \x07lj AuAjAu \vlj6\n  (\n\"Á\"\0 \rlAu \0 \x07lj AuAjAu \vlj6\nA\0!@  Atj\"\0 \0(\0\"Á\"\0 \rlAu \0 \x07lj AuAjAu \vlj6\0 Aj\"AG\r\0\v A\xA0	j!A\0!@  Atj\"\0 \0(\0\"Á\"\0 \rlAu \0 \x07lj AuAjAu \vlj6\0 Aj\"AG\r\0\v A\bj!	 Aàj!A\0!@  At\"j\"\0 \0(\0\"Á\"\0 \rlAu \0 \x07lj AuAjAu \vlj6\0  	j\"\0 \0(\0\"Á\"\0 \rlAu \0 \x07lj AuAjAu \vlj6\0 Aj\"A(G\r\0\v \nAj\"\n  G\r\0\v\v  \f(\0\"6ø! ($!  (ì#!\0\v !\v J (A\nlj!E K (A0lj!R AtA|q Aur!\n  Lj(\0!  Mj(\0! \0! ($!F (\xA0$!\" (À$!A\0!G#\0\"\0!S@@  A\0J@ \0  A8lAjApqk\"#$\0 A\0J@ Au!*  Aþÿÿÿ\x07q!X  Aq!Y  Ak!& AÐ\0k!Z AÐ\0j![ A°\x07k!\f Au!) FAu!\\ FAq!] \"Au!^ \nAu!+  Ak\"TA~q!_ TAq!` TA|q!a TAq!,  Á\"<l!A Av\"\0k!b \0Ak!c A°\x07j\"\x07Á <l!	 R FAk\"dAtj!eAÀ AtkAu <l!\r A\nj\"f (ð! 4kAtjAj!H ; (ì! 4kAtjA\bj!5 Á!- Á!. Á!/ \nÁ!0 \bAG!g AH!h DA\0J!i@@ g@A\0!U\f\v E.\0\" 5(\0\"\0Aul \0Aÿÿq lAuj E.\" 5Ak(\0\"\0Aulj \0Aÿÿq lAuj E.\" 5A\bk(\0\"\0Aulj \0Aÿÿq lAuj E.\" 5A\fk(\0\"\0Aulj \0Aÿÿq lAuj E.\b\" 5Ak(\0\"\0Aulj \0Aÿÿq lAujAtAj!U 5Aj!5\vA\0!V@ 4A\0L@A\0!1\f\v HA\bk(\0\" H(\0\"\0j\"A\0N@ AvA~ \0 qA\0N\"\x1B!\0 Ax \x1B\f\vAÿÿ Au \0 rA\0N\"\x1B!\0Aÿÿÿÿ\x07  \x1B\v! U \0 0l Aÿÿq 0lAuj HAk(\0\"\0Au +lj \0Aÿÿq +lAujAtk!1 HAj!H\v O GAt\"Ij!\x1B .!6 .!7 .!8 .\f!9 .\n!: .\b!2 .!= .!> .!? .\0!@@  VA\nlj\" (\nAµÎÝ\0lAëÆå°j6\n  Ij\"(<\"\0Au @l ^j \0Aÿÿq @lAuj (8\"\0Au ?lj \0Aÿÿq ?lAuj (4\"\0Au >lj \0Aÿÿq >lAuj (0\"\0Au =lj \0Aÿÿq =lAuj (,\"\0Au 2lj \0Aÿÿq 2lAuj ((\"\0Au :lj \0Aÿÿq :lAuj ($\"\0Au 9lj \0Aÿÿq 9lAuj ( \"\0Au 8lj \0Aÿÿq 8lAuj (\"\0Au 7lj \0Aÿÿq 7lAuj (\"\0Au 6lj \0Aÿÿq 6lAuj! \"AF@  .\" (\"\0Aulj \0Aÿÿq lAuj .\" (\"\0Aulj \0Aÿÿq lAuj .\" (\f\"\0Aulj \0Aÿÿq lAuj .\" (\b\"\0Aulj \0Aÿÿq lAuj .\" (\"\0Aulj \0Aÿÿq lAuj .\" (\0\"\0Aulj \0Aÿÿq lAuj!\v ]\r  (\n (\xA0	\"Au /lj Aÿÿq /lAuj\"6\xA0	 R.\0\"\0 Aul \\j Aÿÿq \0lAuj!  (¤	 k\"\0Au /lj \0Aÿÿq /lAuj! A\xA0	j!A!\0 FAN@@  \0Ak\"\nAtj\"(\0!  \0Atj\"(\0!\b  6\0 R \nAtj.\0!\n   \b k\"Au /lj Aÿÿq /lAuj\"6\0 \n Aul j \n AÿÿqlAuj R \0Atj.\0\" Aulj Aÿÿq lAuj! \b ( k\"Au /lj Aÿÿq /lAuj! \0Aj\"\0 FH\r\0\v\v  dAtj 6\0 # VA8lj!$@@@@AðA~A\0 \x1B(\0\"AxAøÿÿÿ\x07 At\"' 1j\" (\n\"\0Aÿÿq\" )lAu \0Au\" )lj  !(¬\"\bAtjA\bj(\0\"\0Au -lj \0Aÿÿq -lAujAt\"3  e.\0\"\0 Aulj Aÿÿq \0lAujAt  .l  .lAujAtj\"j\"\0A\0N@Ax \0  3qA}H\x1B\f\vAÿÿÿÿ\x07 \0  3rA\0N\x1B\v\"k\"\0A\0N\"\x1B \0   \x1BAs   \x1BqA\0H\x1BAuAjAuk\"\0k \0 (\nA\0H\"\x1B\"\0 \0A~L\x1B\"\0 \0AðN\x1B\" k\"\nA\nu h\r\0 \n ckA\nv \n cJ\r\0 \n bN\r \n cjA\nu\v\"\nA\0J@ Z \nA\ntj\"Á <l! A\bj\"Á <l!\0\f\v ! 	!\0 ! \x07! \nAj\v ! 	!\0 ! \x07! \nA\0N\r\v \r! !\0 \f! !\f\v [ \nA\ntj\"A\bj!A` At\"kAu <l!\0A\0 kAu <l!\v (\n! $     kÁ\"\n \nljA\nu\" \0  kÁ\" ljA\nu\"H\"\x1B\"\n6 $   \x1B\"\x006\0 $     H\x1Bj6  $    \x1Bj6 $A\0 \0At\"\0k \0 \x1B Uj\" 'j\" At\"k\"\x006 \0 k\" 3k\"\0A\0N@Ax \0  3AsqA\0H\x1B\f\vAÿÿÿÿ\x07 \0 Axs 3qA}H\x1B\v!\0 $ 6 $ 6\f $ \x006 $ 6\b $A\0 \nAt\"\0k \0 \x1B Uj\" 'j\" k\"\x006, \0 k\" 3k\"\0A\0N@Ax \0  3AsqA\0H\x1B\f\vAÿÿÿÿ\x07 \0 Axs 3qA}H\x1B\v!\0 $ 64 $ 6( $ \x0060 $ 6$ VAj\"V  G\r\0\vA\0!\0 ! \bAkA(o\"A(j  A\0H\x1B\"6¬  jA(oA\0!@  AF\"\r\0 #(!A\0!\bA!A\0!A\0!\n &AO@@ # A8lj\"(¬\" (t\" (<\"\n (\"   H\"\x1B\x1B\"  \nJ\"\x1B\"  J\"\n\x1B\"  J\"\x1B! Aj Aj Aj   \x1B\x1B \x1B \n\x1B \x1B! Aj! Aj\" aG\r\0\v !\n ,E\r\v \n!@ # A8lj(\"   H\"\x1B!   \x1B! Aj! \bAj\"\b ,G\r\0\v\vAt\"'  A\nljj\"(!A\0!@ T@@   \0A\nlj 'j(G@ # \0A8lj\" (Aÿÿÿ?j6  ( Aÿÿÿ?j6 \v   \0Ar\"A\nlj 'j(G@ # A8lj\" (Aÿÿÿ?j6  ( Aÿÿÿ?j6 \v \0Aj!\0 Aj\" XG\r\0\v YE\r\v  \0A\nlj 'j( F\r\0 # \0A8lj\"\0 \0(Aÿÿÿ?j6 \0 \0( Aÿÿÿ?j6 \v #( ! #(!\nA\0!\b@ @A\0!\f\vA\0!A!A\0!A\0!\0 &@@ # A8lj\"(X\" ( \"\0  \0 H\"\x1B\"\0 \0 J\"\x1B\x1B! (<\" (\"\0 \n \0 \nJ\"\x1B\"\0 \0 H\"\x1B!\n Aj\"\0   \x1B \x1B\x1B! \0  \b \x1B \x1B!\b Aj! Aj\" _G\r\0\v \b!\0 `E\r\v # A8lj\"\b( \"   H\"\x1B! \b(\" \n  \nJ\"\x1B!\n   \x1B!  \0 \x1B!\b\v  \nH@A\n Ik\"\0@  \bA\nlj Ij  A\nlj Ij \0ü\n\0\0\v # \bA8lj\" # A8lj\"\0(46  \0),7  \0)$7\b  \0)7\0\v iE  GJqE@ \v G k\"\0j (\xA0A	vAjAv:\0\0  \0AtjAÿÿA~ ! 'j(\0\"Á\"\0 (À\"AÿÿqlAu \0 Aulj AuAjAu ljA\x07uAjAu\"\0 \0A~L\x1B\"\0 \0AÿÿN\x1B;\0 f (ð! kAtj A\bj(\x006\0 ; (ì! kAtj (à6\0\v  (ð!Aj6ð!  (ì!Aj6ì!A\0!@  A\nlj\" # A8lj\"(\f6\n  (6\n  Ij (\b\"\x006@  !(¬Atj \x006À  !(¬Atj (\0\"\x006\xA0  !(¬Atj (At6à  !(¬AtjA\bj (6\0  (\n \0A	uAjAuj\"\x006\n  !(¬Atj \x006  (6\n Aj\"  G\r\0\v ! !(¬Atj *6\0 GAj\"G G\r\0\v\v  Aq!A\0!A\0!@  AO@  Aüÿÿÿ\x07q!\0 At!A\0!\n@  A\nlj\"\x07  \x07j\"	)878 \x07 	)070 \x07 	)(7( \x07 	) 7  \x07 	)7 \x07 	)7 \x07 	)\b7\b \x07 	)\x007\0 \x07 \x07A\nj j\"	)\x007\n \x07 	)\b7\n \x07 	)7¤\n \x07 	)7¬\n \x07 	) 7´\n \x07 	)(7¼\n \x07 	)07Ä\n \x07 	)87Ì\n \x07 \x07A¨j j\"	)\x007¨ \x07 	)\b7° \x07 	)7¸ \x07 	)7À \x07 	) 7È \x07 	)(7Ð \x07 	)07Ø \x07 	)87à \x07 \x07A¼j j\"	)87ô \x07 	)07ì \x07 	)(7ä \x07 	) 7Ü \x07 	)7Ô \x07 	)7Ì \x07 	)\b7Ä \x07 	)\x007¼ Aj! \nAj\"\n \0G\r\0\v E\r\v At!\0@  A\nlj\"	 \0 	j\")878 	 )070 	 )(7( 	 ) 7  	 )7 	 )7 	 )\b7\b 	 )\x007\0 Aj! Aj\" G\r\0\v\v S$\0\f\vA¹æ\0A0Aé\0\vA¯ï\0A0A£\0\v DAj!D \v (ì#\"\nj!  \nAt\"\0j! \0 Aj!A (Aj\"( (ä#\"\0H\r\0\v ($!\vA\0!@ AH\r\0 Ak\"Aq! (\n!A\0!\x1B@ AkAI@A!\f\v A|q!\vA!A\0!@  A\nlj\"(Ì(\"\f (¸\"\r (¤\" (\n\"   H\"\x07\x1B\"  J\"	\x1B\"  \rJ\"\x1B\"  \fJ\"\x1B! Aj Aj Aj   \x07\x1B 	\x1B \x1B \x1B! Aj! Aj\" \vG\r\0\v E\r\v@  A\nlj(\n\"   H\"\x1B!   \x1B! Aj! \x1BAj\"\x1B G\r\0\v\v   A\nlj\"\f(\n:\0\"  \f A\0J A\nj!\x07 \fA\bj!	 \fAÀj! \fA\xA0j! !(¬ j! W \0AtjAk(\0\"\0A\ntAu!\r \0AuAjAu!A\0!@   k\"\0j  AkA(o\"\nA(j \n \nA\0H\x1B\"At\"\nj(\0A	vAjAv:\0\0  \0AtjAÿÿA~  \nj(\0\"\0Au \rl \0 lj \0Aÿÿq \rlAujA\x07uAjAu\"\0 \0A~L\x1B\"\0 \0AÿÿN\x1B;\0 \x07 (ð! kAtj Atj 	 \nj(\x006\0 Aj\" G\r\0\v (ì# \n\vAtj\"\0)87¸  \0)07°  \0)(7¨  \0) 7\xA0  \0)7  \0)7  \0)\b7  \0)\x007 A!j \fA\xA0	jAà\0ü\n\0\0  \f(\n6à!  \f(\n6ä!  C (ä#AtjAk(\x006è! (ð#At\"\0@   (è#Atj \0ü\n\0\0\v (ð#At\"@ A\nj\"\0 \0 (è#Atj ü\n\0\0\v !A°j$\0\f\vAÿå\0A0Aú\0\v\f\v Aðj!. ! A\xA0j!X Aðj!Y A0j!Z Aj![ A j!\\ Aàj!] Aäj!= 	!\v#\0\"!^ \" \",\0\"6ô! (è!!+ -\0!	 ,\0! ,\0!  \0\"(è#\" \0(ð#\"j\"AtAjApqk\",\"\0$\0 \0 AtAjApqk\"6\"\0$\0 \0 (ì#\"AtAjApqk\"7$\0  6ì!  6ð!@@@@ (ä#\"\0A\0J@AA 	AF\"_\x1B!` AtA|qAj Atj.\0\"AÐ\0k!a AÐ\0j!b A°\x07k!\f A¼j!\r A!j!8 Aj!% A\nj!9 \vÁ\"- l!A \vAv\"\0k!d \0Ak!>  Atj!? A°\x07j\"\x07Á -l!	AÀ AtkAu -l!\n \bÁ!J \vAH!e@  &At\"\0\"*j(\0!\x1B A\x006ü!A!\" X &Av _rAtj!@ -\0\"\vAG\r\0A!\v \0 =j(\0!+ & `q\r\0 (ð#\"\v + (\xA0$\"jk\"\0AL\r (ä' 6 \0Ak\"At\"\0j \0 j  &lAtj  \v k 6 A6ü!  (ð#6ì! -\0!\vA\0!\"\vA\0A * ]j\"(\0\" AL\x1B\"\0 \0g\"Akt\"\0AÿÿqAÿÿÿÿ \0Au\"\0m\"Á\"\blAu \0 \bljAtk\"\0 AuAjAul Atj \0Au \blj \0Aøÿq \blAuj!\b * =j(\0! Aÿÿ\x07L@Aÿÿÿÿ\x07 Ak\"v\" \bAx u\"\0 \0 \bH\x1B  \bH\x1B t\f\v \b Asu\v!@ (ì#\")A\0L\r\0 AuAj\"\0AtAu! \0AuAjAu!A\0! )AG@ )Aq )Aþÿÿÿ\x07q!\bA\0!@ 7 Atj . Atj/\0\"Á\"\0Au l \0 lj  lAuj6\0 7 Ar\"\0Atj . \0Atj/\0\"Á\"\0Au l \0 lj  lAuj6\0 Aj! Aj\" \bG\r\0\vE\r\v 7 Atj . Atj/\0\"Á\"\0Au l \0 lj  lAuj6\0\v@ \"\r\0 &E@ Au Jl Aÿÿq JlAujAt!\v (ì!\"\b k\"Ak\" \bN\r\0 Aÿÿq! Au! Aq@ , Atj  6 Atj.\0\"\0lAu \0 lj6\0 Ak!\v AF\r\0@ , Atj  6 Atj.\0\"\0lAu \0 lj6\0 , Aj\"\0Atj  6 \0Atj.\0\"\0lAu \0 lj6\0 Aj\" \bG\r\0\v\v (ø!\" G@   Au\"\0s \0kg\"Akt\"Aÿÿÿÿ   Au\"\0s \0kg\"Akt\"\0AumÁ\"\b AÿÿqlAu \b Aulj\"¬ \0¬~B§Axqk\"\0Au \bl j \0Aÿÿq \blAuj!\b  k\"\0ArL@Aÿÿÿÿ\x07As \0k\"v\" \bAx u\"\0 \0 \bH\x1B  \bH\x1B t\f\v \b \0A\rjuA\0 \0AH\x1B\v! (ð#\"\0A\0J@ Aÿÿq!\b Au! (ð! \0k!@ 9 Atj\"\0 \0(\0\"Á\"\0 \blAu \0 lj AuAjAu lj6\0 Aj\" (ð!H\r\0\v\v@ \vAG\r\0 (ü!\r\0 (ì!\" kAk\" N\r\0 Aÿÿq!\b Au!@ , Atj\"\0 \0(\0\"Á\"\0 \blAu \0 lj AuAjAu lj6\0 Aj\" G\r\0\v\v  (à!\"Á\"\0 Aÿÿq\"lAu \0 Au\"\blj AuAjAu lj6à!  (ä!\"Á\"\0 lAu \0 \blj AuAjAu lj6ä!A\0!A\0!\0@ % \0Atj\" (\0\"Á\" lAu  \blj AuAjAu lj6\0 \0Aj\"\0AG\r\0\v@ 8 Atj\"\0 \0(\0\"Á\"\0 lAu \0 \blj AuAjAu lj6\0 Aj\"AG\r\0\v  (\0\"6ø! (ì#!)\v )A\0J@ Y &A\nlj!0A\0! \vAG\"f +A\0Jr!g \x1BAu\" \x1BAtrAu!K ($\":Au!h :Aq!i A\ntAu!L (\xA0$\"'Au! AuAjAu! Z &A0lj\"@ :Ak\"\0Atj! 8 \0Atj!\x1B * \\j(\0\"\0Au!M 9 (ð! +kAtjAj!1 , (ì! +kAtjA\bj!\" * [j.\0!P \0Á!Q (ô!! Á!S \r!\v@  AµÎÝ\0lAëÆå°j6ô! .\0\" \v(\0\"\0Aul j \0Aÿÿq lAuj .\" \vAk(\0\"\0Aulj \0Aÿÿq lAuj .\" \vA\bk(\0\"\0Aulj \0Aÿÿq lAuj .\" \vA\fk(\0\"\0Aulj \0Aÿÿq lAuj .\b\" \vAk(\0\"\0Aulj \0Aÿÿq lAuj .\n\" \vAk(\0\"\0Aulj \0Aÿÿq lAuj .\f\" \vAk(\0\"\0Aulj \0Aÿÿq lAuj .\" \vAk(\0\"\0Aulj \0Aÿÿq lAuj .\" \vA k(\0\"\0Aulj \0Aÿÿq lAuj .\" \vA$k(\0\"\0Aulj \0Aÿÿq lAuj!2 'AF@ .\" \vA(k(\0\"\0Aul 2j \0Aÿÿq lAuj .\" \vA,k(\0\"\0Aulj \0Aÿÿq lAuj .\" \vA0k(\0\"\0Aulj \0Aÿÿq lAuj .\" \vA4k(\0\"\0Aulj \0Aÿÿq lAuj .\" \vA8k(\0\"\0Aulj \0Aÿÿq lAuj .\" \vA<k(\0\"\0Aulj \0Aÿÿq lAuj!2\vA\0!B fE@ 0.\0\" \"(\0\"\0Aul \0Aÿÿq lAuj 0.\" \"Ak(\0\"\0Aulj \0Aÿÿq lAuj 0.\" \"A\bk(\0\"\0Aulj \0Aÿÿq lAuj 0.\" \"A\fk(\0\"\0Aulj \0Aÿÿq lAuj 0.\b\" \"Ak(\0\"\0Aulj \0Aÿÿq lAujAj!B \"Aj!\"\v i\r (!!\0  (ä!\"6! @.\0\" Aul hj Aÿÿq lAuj!A! :AN@@ 8 Ak\"Atj\"(\0!  \x006\0 8 Atj\"\b(\0 @ Atj.\0! \b 6\0  \0Aul j  \0AÿÿqlAuj @ Atj.\0\"\0 Aulj Aÿÿq \0lAuj!!\0 Aj\" :H\r\0\v\v \x1B \x006\0 gE\r 2At (à!\"Aÿÿq\"\b PlAu Au\" Plj  .\0\" \0Aulj \0Aÿÿq lAujAtj\"  Ml \b MlAuj 9 (ð!AtjAk(\0\"\0Au Qlj \0Aÿÿq QlAuj\"jk!@ +A\0J@ 1A\bk(\0\" 1(\0\"\0j\"\bA\0N@ \bAvA~ \0 qA\0N\"\0\x1B! \bAx \0\x1B\f\vAÿÿ \bAu \0 rA\0N\"\0\x1B!Aÿÿÿÿ\x07 \b \0\x1B\v!\0 At Bj  Sl \0Aÿÿq SlAuj 1Ak(\0\"\0Au Klj \0Aÿÿq KlAujAtkAu! 1Aj!1\f\v Au!\v@@@@AðA~A\0 7 Atj(\0\" AjAuk\"\0k \0 (ô!A\0H\x1B\"\0 \0A~L\x1B\"\0 \0AðN\x1B\"* k\"\bA\nu e\r\0 \b >kA\nv \b >J\r\0 \b dN\r \b >jA\nu\v\"\bA\0J@ a \bA\ntj\"Á -l! A\bj\"\0Á -l!\f\v ! \x07!\0 ! 	! \bAj\v ! \x07!\0 ! 	! \bA\0N\r\v \f! !\0 \n! !\f\v b \bA\ntj\"A\bj!\0A` At\"kAu -l!A\0 kAu -l!\v  j\"\b \0  * \0kÁ\"\0 \0l j * kÁ\"\0 \0l jH\x1B\"\0A	vAjAv:\0\0 ? AtjAÿÿA~ BAtA\0 \0At\"\0k \0 (ô!A\0H\x1Bj\" 2Atj\"Au Ll  lj Aþÿq LlAujA\x07uAjAu\"\0 \0A~L\x1B\"\0 \0AÿÿN\x1B;\0 \v 6   Atk\" Atk\"\x006à!  6ä! 9 (ð!Atj \0 Atk6\0 , (ì!\"\0Atj At6\0  \0Aj6ì!  (ð!Aj6ð!  (ô! \b,\0\0j\"6ô! \vAj!\v Aj\" )G\r\0\v\v % % )Atj\"\0)878 % \0)070 % \0)(7( % \0) 7  % \0)7 % \0)7 % \0)\b7\b % \0)\x007\0  (ì#\"j! ? At\"\0j!? \0 .j!. &Aj\"& (ä#\"\0H\r\0\v (è#! (ð#!\v  = \0AtjAk(\x006è! At\"\0@   Atj \0ü\n\0\0\v (ð#At\"@ A\nj\"\0 \0 (è#Atj ü\n\0\0\v ^$\0\f\vAÿå\0AÃ2A\0\vA¯ï\0AÃ2Aú\0\vAÌ\0AÃ2A\0\v\v Að\x07j$\0\vÿ	#\0A@j\"\f$\0@ A\0L\r\0 Aq!\b AO@ Aüÿÿÿ\x07q!@ \f 	At\"j  j*\0C\0\0Gü\x006\0 \f Ar\"j  j*\0C\0\0Gü\x006\0 \f A\br\"j  j*\0C\0\0Gü\x006\0 \f A\fr\"j  j*\0C\0\0Gü\x006\0 	Aj!	 Aj\" G\r\0\v \bE\r\v@ \f 	At\"j  j*\0C\0\0Gü\x006\0 	Aj!	 \x07Aj\"\x07 \bG\r\0\v\v \0!#\0Ak\"\r$\0 \r \rAj\"\x006\f \r \rAÐ\0j\"6\b \f  \0 \"Au\"\n A\xA0ö\0.\0\"	 \n\"A\0H@ A\0;\0A! \0\" 	 \n!\v@A!A\0! 	!@@@ A\0L  AtA\xA0ö\0j.\0\"\0 \n\"\x07 Nq\r\0 \x07A\0 kL A\0Nq\r\0 Aÿ\0L@@@ \x07A\0L  Aj\"AtA\xA0ö\0j.\0\" \n\"\bA\0NqE@ \x07A\0H\r \bA\0J\r\v \0! \x07! ! !\0 \b!\x07\f\v Aÿ\0H !\0 \b!\x07 !\r\0\v\v AO@A!\x07 A Ajm\";\0 AH\r Ak\"\0Aq! /\0! AkAO@ \0A|q!A\0!\0@  \x07Atj\"\b  j\";\0 \b  j\" j\"; \b ; \b  j\"; \x07Aj!\x07 \0Aj\"\0 G\r\0\v E\r\vA\0!@  \x07Atj  j\";\0 \x07Aj!\x07 Aj\" G\r\0\v\f\v \f A~ tAj; \f \rAÐ\0j\" \rAj\"\0 \nA\0! Aj!  	 \n\"A\0N\r A\0;\0A! \0\" 	 \n!\f\vA~!\v  \0 j\"Au Aqj\" \n!@@ A\0J\r\0 A\0H\r\0 !\0\f\v@ A\0H\r\0 A\0J\r\0 !\0\f\vA!\v ! ! \x07!\v@@ A\0L  \0 j\"Au Aqj\" \n\"\bA\0Nq\r\0 \bA\0L A\0Nq\r\0 \vAÀ\0r!\v ! \b!\f\v !\0 \b!\v  \0 j\"\0Au \0Aqj \n!\0@@ A\0J\r\0 \0A\0H\r\0 \0!\f\v@ A\0H\r\0 \0A\0J\r\0 \0!\f\v \vA j!\v \0!\v@ AÿÿjAþÿ\x07M@  F\r At  k\"\0Auj \0m \vj!\v\f\v   kAum \vj!\v\v  AtjAÿÿ \v A\btj\"\0 \0AÿÿN\x1B;\0 Aj\" N\r\0 \x07E!A  A\ftAÀ\0qk! AtAö\0j.\0! \rA\bj AqAtj(\0!\f\v\v\v \rAj$\0 \fA@k$\0\vÄ@ A\0J@A! Aq\r \0AÿÿA\bA . .\0\"k\" AL\x1Bn\"A\bA  AL\x1Bnj\" AÿÿO\x1B;\0 Ak! AO@@ \0 At\"jAÿÿ A\bA  Aj\"j\".\0  j.\0k\" AL\x1Bn\"j\"\x07 \x07AÿÿO\x1B;\0 \0 jAÿÿ A\bA  Aj\"Atj.\0 .\0k\" AL\x1Bn\"j\" AÿÿO\x1B;\0  J\r\0\v\v \0 At\"jAÿÿA\bA  j.\0kn j\"\0 \0AÿÿO\x1B;\0\vA\xA0è\0AÌ0A3\0\vAÞï\0AÌ0A4\0\v\x07\b  At\"jA6\0  jA6\0@ A\0L\r\0 \0 j!\0A\0!@  At\"jA\0 \0 AsAtj\"(\0 \0 j\"\n(\0jk6\0  j \n(\0 (\0k6\0 Aj\" G\r\0\v \"Aq@  Ak\"At\"\0j\" (\0  At\"j(\0k6\0 \0 j\"\0 \0(\0  j(\0j6\0\v AF\r\0@  At\"\0Ak\"j\" (\0 \0 j(\0k6\0  j\" (\0 \0 j(\0j6\0  Ak\"\0At\"\nj\"\b \b(\0 (\0k6\0  \nj\" (\0 (\0j6\0 AJ \0!\r\0\v AF\r\0 Ak!\n As!\bA\0!A!@@  \"L\r\0A\0!\0 ! \b kAq\"\x07@@  Atj\"	A\bk\"\v \v(\0 	(\0k6\0 Ak! \0Aj\"\0 \x07G\r\0\v\v \n kAI\r\0@  Atj\"\0A\bk\"\x07 \x07(\0 \0(\0k\"\x076\0 \0A\fk\"	 	(\0 \0Ak(\0k\"	6\0 \0Ak\"\v \v(\0 \x07k6\0 \0Ak\"\0 \0(\0 	k6\0 Ak\" J\r\0\v\v  Atj\"\0A\bk\" (\0 \0(\0Atk6\0 Aj! Aj!  G\r\0\v Ak! As!\nA\0!A!@@  \"L\r\0A\0!\0 ! \n kAq\"\b@@  Atj\"\x07A\bk\"	 	(\0 \x07(\0k6\0 Ak! \0Aj\"\0 \bG\r\0\v\v  kAI\r\0@  Atj\"\0A\bk\"\b \b(\0 \0(\0k\"\b6\0 \0A\fk\"\x07 \x07(\0 \0Ak(\0k\"\x076\0 \0Ak\"	 	(\0 \bk6\0 \0Ak\"\0 \0(\0 \x07k6\0 Ak\" J\r\0\v\v  Atj\"\0A\bk\" (\0 \0(\0Atk6\0 Aj! Aj!  G\r\0\v\v\v²@ Aüÿq\"E@A\0!\f\v@ Ak\"E@A\0!\f\v AvAjAþÿÿÿ\x07q!\x07A\0!@ \0 Atj\"  *\08\0   *8   *\b8\b   *\f8\f   *8   *8   *8   *8 A\bj! Aj\" \x07G\r\0\v Aq\r\v \0 Atj\"  *\08\0   *8   *\b8\b   *\f8\f Aj!\v@  L\r\0 !  kAq\"@A\0!@ \0 Atj\"\x07  \x07*\08\0 Aj! Aj\" G\r\0\v\v  kA|K\r\0@ \0 Atj\"  *\08\0   *8   *\b8\b   *\f8\f Aj\" G\r\0\v\v\v°	}A! A\0J@@  At\"	j*\0!\f@ E\r\0 \0 	j!\x07A\0! Av\"AG@ Aþÿÿÿ\x07q!\vA\0!\n@ \0 Atj\" \x07 AsAtj\"\b*\0\"\r \f *\0\"8\0 \b \r  \f8\0  \x07 AþÿÿÿsAtj\"\b*\0\"\r \f *\"8 \b \r  \f8\0 Aj! \nAj\"\n \vG\r\0\v AqE\r\v \0 Atj\" \x07 AsAtj\"*\0\"\r \f *\0\"8\0  \r  \f8\0\v \0 	j \f8\0 Aj! Aj\" G\r\0\v\v\vh \0D\0\0\0\0\0\0\0\0\0@Aß(\0A\x1BAA \0AF\x1B \0AF\x1B\"\0Ak\"vAq@A¤ßA¤ß(\0A tr6\0\f\v \0At(Ø\"@ \0 \b\0\v\v\v\r\0 \0Aj\0\v\0\0\v\0\vÌ\x07#\0A k\"$\0  \0(\"6 \0(!  6  6   k\"6  j!A! Aj!@@@@ \0(<   A\fj\"A\xA0Û 6\0AA\0\vE@  (\f\"\x07F\r \x07A\0N\r\f\v AG\r\v \0 \0(,\"6 \0 6 \0  \0(0j6 \f\v A\bA\0 \x07 (\"\bK\"	\x1Bj\" \x07 \bA\0 	\x1Bk\"\b (\0j6\0 A\fA 	\x1Bj\" (\0 \bk6\0  \x07k!  	k! !\f\v\v \0A\x006 \0B\x007 \0 \0(\0A r6\0A\0 AF\r\0  (k\v A j$\0\v\0\0\v\0AÏÛ\0\v\0 \0AkAxOAö\0 \0Atk(\0AÝ\v\vº\x07#\0Ak\"$\0A{!@@ AÂk\r\0\0\v  6\0#\0A@j\"$\0 \0(! \0(\0!  6< \0 j!A{!@@@@@@@@@@@@@@@@ A©k3\0\b	\x07\n\v\f\r\v  (<\"Aj6< (\0\"E@A!\f\v  \0(@6\0\f\r\v  (<\"Aj6< (\0\"A\nK@A!\f\v \0 60  6\0 Aª \v\f\f\v  (<\"Aj6< (\0\"E@A!\f\r\v  \0(06\0\f\v\v  (<\"Aj6< (\0\"E@A!\f\f\v  \0(`6\0\f\n\v \0B\x007\\ \0B\x007T \0B\x007L \0B\x007D \0B\x007<A\0! A¼A\0\v \0 jE \0 \0(\b6< \0 \0(\fAm6L\f\n\v  (<\"Aj6< (\0\"E@A!\f\n\v  \0(\f6\0\f\b\v  (<\"Aj6< (\0\"E@A!\f	\v \0(HAê\x07F@  6 AÁ Aj\v!\f	\v  \0($6\0\f\x07\v  (<\"Aj6< (\0\"E@A!\f\b\v  \0(,6\0\f\v  (<\"Aj6< (\0\"AkA|I@A!\f\x07\v \0 6,\f\v  (<\"Aj6< (\0\"E@A!\f\v  \0(T6\0\f\v  (<\"\0Aj6< \0(\0\"\0AK@A!\f\v  \x006  AÎ A j\v!\f\v  (<\"\0Aj6< \0(\0\"\0E@A!\f\v  \x0060 AÏ A0j\v!\f\v  (<\"Aj6< (\0\"AK@A!\f\v \0 64\f\v  (<\"Aj6< (\0\"E@A!\f\v  \0(46\0\vA\0!\v A@k$\0\v Aj$\0 \v#\0A´k\"$\0A|!@AA \0-\0\0Aq\x1B\"AkA~I\r\0 A\x006´   A´j]! (´\"\r\0 E\r\0 A\0A´ü\v\0  \0   Aè\x07mAø\0lA\0\\! '\v A´j$\0 \v]#\0AÀk\"$\0 A\0:\0¿ Að\0j\"A\0AÀü\v\0 Aj\"A\0Aà\0ü\v\0 A\x006\f \0  A¿j   A\fjA\0A\0? AÀj$\0\v\b\0 \0 $\v`A!A A\0L\r\0@@@ \0-\0\0Aq\0\0\0\vA!\f\vA| AF\r \0-\0A?q!\vA| \0 $ l\"\0 \0Al AlJ\x1B\v\v\b\0 \0 [\v\0AA \0-\0\0Aq\x1B\vT \0,\0\0\"Aÿq!\0 A\0H@ \0AvAq\"\0AÎ\bjAÍ\b \0\x1B\f\vAÑ\bAÐ\b \0Aq\x1B \0Aà\0qAà\0F\r\0 \0AvAÍ\bj\v\v\0 A\0LA \0     A\0-\v\v\0 \0     \\\v\n\0 \0  ]\v>#\0Ak\"$\0 A\x006\f  A\fj6\0 \0AÑ 7!\0 (\f! Aj$\0 \0  \0\x1B\v>#\0Ak\"$\0 A\x006\f  A\fj6\0 \0A» 7!\0 (\f! Aj$\0 \0  \0\x1B\v>#\0Ak\"$\0 A\x006\f  A\fj6\0 \0A£ 7!\0 (\f! Aj$\0 \0  \0\x1B\vT#\0Ak\"$\0A{!@ A\xA0kAw\"AK\r\0Aÿ»Ð vAqE\r\0  6\0 \0 At(½ 7!\v Aj$\0 \vü\x07A!	@  \0(\"Am\"\nH\r\0 \0(p!\v ! \0(\xA0\"\bA'G@ \bA'k\"\x07A\bK\r  \bA'M \n \x07t \bA'k lA2m\v\"H\r\v@ Al F\r\0 AÈl F\r\0 Aä\0l F\r\0 A2l\"\x07 F\r\0 Al F\r\0 \x07 AlF\r\0 \x07 AtF\r\0 \x07 AlF\r\0 \x07 AlG\r\vA   Aä\0mH\x1B  \vAF\x1B!	\v \0  	  A   \0(tA\v¢\n#\0!A!\v@  \0(\"Am\"\fH\r\0 \0(p !\x07 \0(\xA0\"	A'G@ 	A'k\"A\bK\r \x07 	A'M \f t 	A'k lA2m\v\"\x07H\r\v@ \x07Al F\r\0 \x07AÈl F\r\0 \x07Aä\0l F\r\0 \x07A2l\" F\r\0 \x07Al F\r\0  AlF\r\0  AtF\r\0  AlF\r\0  AlG\r\v \x07A\0L\r\0AF Aä\0m \x07JA\0\v\r\0  \0(t\" \x07lAtAjApqk\"\n$\0@  \x07l\"A\0L\r\0 Aq!	A\0!\v AO@ Aüÿÿÿ\x07q!\rA\0!\f@ \n \bAtj  \bAtj.\0²C\0\0\x0088\0 \n \bAr\"Atj  Atj.\0²C\0\0\x0088\0 \n \bAr\"Atj  Atj.\0²C\0\0\x0088\0 \n \bAr\"Atj  Atj.\0²C\0\0\x0088\0 \bAj!\b \fAj\"\f \rG\r\0\v 	E\r\v@ \n \bAtj  \bAtj.\0²C\0\0\x0088\0 \bAj!\b \vAj\"\v 	G\r\0\v\v \0 \n \x07  A   A!\v\v $\0 \v\vû\n\b !A\0!#\0Ak\"	$\0@@@@ \0Aÿü\0L@ \0AÀ>F\r \0AàÝ\0F\r\f\v \0Aý\0F\r\0 \0A÷F\r\0 \0AÀ»G\r\v AkA~I\r\0 Ak\"AK\r\0 AG\r\v E\r A6\0\f\v@@@ \0Aÿü\0L@ \0AÀ>F\r \0AàÝ\0F\r\f\v \0Aý\0F\r\0 \0A÷F\r\0 \0AÀ»G\r\v Ak\"AK\r\0 AF\r\0 	AÐ\0A¸ AF\"\x1B6\f 	 	(\fAjA|qA\0 AG\x1B6\fAäï\0!@ AF\r\0 A¬«(\0AtA°«(\0AtjA jlAôj! AqAF\r\0Aäþ\0Aä \x1B!\v 	(\f  jj\"A\0J\r\vA\0! E\r A}6\0\f\v N\"E@A\0! E\r Ay6\0\f\v#\0A k\"\x07$\0A!@@ \0Aÿü\0L@ \0AÀ>F\r \0AàÝ\0F\r\f\v \0Aý\0F\r\0 \0A÷F\r\0 \0AÀ»G\r\v AkA~I\r\0 Ak\"AK\r\0 AF\r\0 \x07AÐ\0A¸ AF\"\x1B6A\0! \x07 \x07(AjA|qA\0 AG\x1B6Aäï\0!\b@ AF\r\0 A¬«(\0AtA°«(\0AtjA jlAôj! AqAF\r\0Aäþ\0Aä \x1B!\b\v \x07( \bj\" j! E\r\0 @ A\0 ü\v\0\v  6øn  6t  6\0  \b6 A\x006¸  \x006 \0! AG@  \bj A\0 A\bjS@A}!\f\v (!\vA\0! A\x006P B\x007< A\x0064 B	7, B¨Ã7$ BýÀ7 Býè\x077  6  6\f  6\b AG@  (\0j! (¸!\vA!\b@ AK\r\0Ay!\b E\r\0A\0!\bA¬«(\0AtA°«(\0AtjA j lAôj\"\n@ A\0 \nü\v\0\v B7  6\b  6 A¨«6\0A´«(\0!\n  \v6H  \n6$ B70 Bÿÿÿÿ7( A6< A6 B7\f A¼A\0	  \0}6\v \b@A}!\f\v \x07A\x006 A\xA0Î\0 \x07Aj	 \x07 (,6\0 Aª \x07	\v B7 Bøÿÿ7  6p Bx7 Bøÿÿ7| Bøÿÿ7¨ A'6\xA0 Aü6o A;ün  \0 lA¸j6¤  (\"\0Aúm6x  \0Aä\0mA\0 AI\x1B6°A<\n!\0 A6´o AÑ\b6¨o Aé\x076o  \0A\bt6o AÄj\"\0 (6\b \0A\x006\0 \0A\fjA\0A¨í\0ü\v\0  (p6È\v \x07A j$\0 @  6\0\v E\r\0 'A\0!\v 	Aj$\0 \vï@@ A\0J@ \0 Atj!\x07@@ Ak\"	E@A\0!\f\v Aq Aþÿÿÿ\x07q!\nA\0!@  Atj \x07  j lAtj.\0²8\0  Ar\"\fAtj \x07  \fj lAtj.\0²8\0 Aj! \bAj\"\b \nG\r\0\vE\r\v  Atj \x07  j lAtj.\0²8\0\v A\0H\r \0 Atj!\0@ 	E@A\0!\f\v Aq Aþÿÿÿ\x07q!A\0!A\0!\b@  Atj\"\x07 \x07*\0 \0  j lAtj.\0²8\0  Ar\"\x07Atj\"	 	*\0 \0  \x07j lAtj.\0²8\0 Aj! \bAj\"\b G\r\0\vE\r\v  Atj\" *\0 \0  j lAtj.\0²8\0\v A\0N\r\v A~G\r\0 AH\r\0 Aþÿÿÿ\x07q!	 Aq!\vA!@@ A\0L\r\0 \0 Atj!\x07A\0!A\0!\b AG@@  Atj\"\n \n*\0 \x07  j lAtj.\0²8\0  Ar\"\nAtj\"\f \f*\0 \x07  \nj lAtj.\0²8\0 Aj! \bAj\"\b 	G\r\0\v \vE\r\v  Atj\"\b \b*\0 \x07  j lAtj.\0²8\0\v Aj\" G\r\0\v\v\vª\x07}@@@ A\0J@ \0 Atj!	@@ Ak\"\nE@A\0!\f\v Aq Aþÿÿÿ\x07q!\fA\0!@  Atj 	  j lAtj*\0C\0\0\0G8\0  Ar\"\rAtj 	  \rj lAtj*\0C\0\0\0G8\0 Aj! \bAj\"\b \fG\r\0\vE\r\v  Atj 	  j lAtj*\0C\0\0\0G8\0\v A\0H\r \0 Atj!\0@ \nE@A\0!\f\v Aq Aþÿÿÿ\x07q!	A\0!A\0!\b@  Atj\"\n \0  j lAtj*\0C\0\0\0G \n*\08\0  Ar\"\nAtj\"\v \0  \nj lAtj*\0C\0\0\0G \v*\08\0 Aj! \bAj\"\b 	G\r\0\vE\r\v  Atj\" \0  j lAtj*\0C\0\0\0G *\08\0\f\v A\0N\r\v@ A~G\r\0 AH\r\0 Aþÿÿÿ\x07q!\n Aq!\vA!@@ A\0L\r\0 \0 Atj!	A\0!A\0!\b AG@@  Atj\"\f 	  j lAtj*\0C\0\0\0G \f*\08\0  Ar\"\fAtj\"\r 	  \fj lAtj*\0C\0\0\0G \r*\08\0 Aj! \bAj\"\b \nG\r\0\v \vE\r\v  Atj\"\b 	  j lAtj*\0C\0\0\0G \b*\08\0\v Aj\" G\r\0\v\v A\0L\r\vA\0! AG@ Aq A~q!A\0!@@}C\0\0Ç  Atj\"\0*\0\"\x07C\0\0Ç]\r\0C\0\0G \x07C\0\0G^\r\0 \x07 \x07[\rC\0\0\0\0\v!\x07 \0 \x078\0\v@ \0}C\0\0Ç \0*\"\x07C\0\0Ç]\r\0C\0\0G \x07C\0\0G^\r\0 \x07 \x07[\rC\0\0\0\0\v8\v Aj! Aj\" G\r\0\vE\r\v}C\0\0Ç  Atj\"\0*\0\"\x07C\0\0Ç]\r\0C\0\0G \x07C\0\0G^\r\0 \x07 \x07[\rC\0\0\0\0\v!\x07 \0 \x078\0\v\v\0\v\vòÇN\0A\b\v§massertion failed: encControl->nChannelsInternal == 1 || psEnc->state_Fxx[ 0 ].sCmn.fs_kHz == psEnc->state_Fxx[ 1 ].sCmn.fs_kHz\0assertion failed: inLen >= S->Fs_in_kHz\0assertion failed: S->inputDelay <= S->Fs_in_kHz\0assertion failed: target_ptr + sf_length_8kHz <= frame_4kHz + frame_length_4kHz\0assertion failed: basis_ptr + sf_length_8kHz <= frame_4kHz + frame_length_4kHz\0assertion failed: basis_ptr >= frame_4kHz\0assertion failed: len > 2*delay\0assertion failed: x != y\0-+   0X0x\0assertion failed: codedBands > start\0invalid argument\0assertion failed: !ret\0success\0assertion failed: written == nb_extensions\0assertion failed: N>1\nalg_unquant() needs at least two dimensions\0assertion failed: N>1\nalg_quant() needs at least two dimensions\0assertion failed: st->DecControl.nChannelsAPI == st->channels\0assertion failed: st->DecControl.API_sampleRate == st->Fs\0unknown error\0internal error\0assertion failed: psDec->psNLSF_CB->order == psDec->LPC_order\0assertion failed: psEncC->psNLSF_CB->order == psEncC->predictLPCOrder\0assertion failed: ret == ext_len\0assertion failed: iter->curr_data - iter->data == iter->len - iter->curr_len\0assertion failed: d <= len\0assertion failed: fl<=fm\0corrupted stream\0buffer too small\0assertion failed: encControl->nChannelsAPI >= encControl->nChannelsInternal && encControl->nChannelsAPI >= psEnc->nChannelsInternal\0assertion failed: buf_len >= psEnc->sCmn.pitch_LPC_win_length\0assertion failed: psDec->ltp_mem_length >= psDec->frame_length\0assertion failed: MAX_FRAME_LENGTH >= psEncC->frame_length\0assertion failed: ( psEnc->sCmn.subfr_length * psEnc->sCmn.nb_subfr ) == psEnc->sCmn.frame_length\0assertion failed: encControl->nChannelsInternal == 1 || psEnc->state_Fxx[ 1 ].sCmn.inputBufIx == psEnc->state_Fxx[ 1 ].sCmn.frame_length\0assertion failed: psEnc->state_Fxx[ 0 ].sCmn.inputBufIx == psEnc->state_Fxx[ 0 ].sCmn.frame_length\0assertion failed: Order <= length\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/pitch.h\0assertion failed: extensions[frame_repeat_idx[g]].frame == g\0assertion failed: ret==packet_frame_size\0assertion failed: ret==frame_size-packet_frame_size\0assertion failed: pcm_count == frame_size\0assertion failed: _this->offs+_this->end_offs<=_size\0invalid state\0assertion failed: K>0\nalg_unquant() needs at least one pulse\0assertion failed: K>0\nalg_quant() needs at least one pulse\0assertion failed: st->start < st->end\0assertion failed: start <= end\0assertion failed: fin != fout\nIn-place FFT not supported\0request not implemented\0memory allocation failed\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/check_control_input.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/sort.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/celt.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/kiss_fft.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/cwrs.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/src/extensions.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/src/analysis.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/decoder_set_fs.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/encode_pulses.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/decode_pulses.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/encode_indices.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/decode_indices.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/bands.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/process_NLSFs.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/src/repacketizer.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/LPC_analysis_filter.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/resampler.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/celt_encoder.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/src/opus_encoder.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/celt_decoder.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/src/opus_decoder.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/vq.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/decode_pitch.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/pitch.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/rate.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/interpolate.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/decode_core.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/decode_frame.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/NLSF_encode.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/laplace.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/stereo_encode_pred.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/celt_lpc.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/entenc.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/celt/entdec.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/control_codec.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/NSQ_del_dec.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/NLSF_VQ_weights_laroia.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/resampler_private_down_FIR.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/NLSF_VQ.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/NSQ.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/apply_sine_window_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/sort_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/find_pitch_lags_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/find_pred_coefs_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/schur_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/LPC_analysis_filter_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/warped_autocorrelation_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/pitch_analysis_core_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/encode_frame_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/burg_modified_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/float/find_LPC_FLP.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/enc_API.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/dec_API.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/CNG.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/VAD.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/PLC.c\0/Users/steipete/Projects/libopus-wasm/.cache/opus-1.6.1/silk/NLSF2A.c\0assertion failed: C*ebits[j]<<BITRES == bits[j]\0assertion failed: complexity <= SILK_PE_MAX_COMPLEX\0assertion failed: complexity >= SILK_PE_MIN_COMPLEX\0assertion failed: st->last_pitch_index <= PLC_PITCH_LAG_MAX\0assertion failed: _nbits<=EC_SYM_BITS\0assertion failed: ix[ n ][ 1 ] < STEREO_QUANT_SUB_STEPS\0assertion failed: psEncC->predictLPCOrder <= MAX_LPC_ORDER\0assertion failed: nb_extensions != NULL\0assertion failed: encControl != NULL\0assertion failed: celt_enc != NULL\0assertion failed: st->arch <= OPUS_ARCHMASK\0assertion failed: (opus_custom_decoder_ctl(celt_dec, 4028)) == OPUS_OK\0assertion failed: (opus_custom_decoder_ctl(celt_dec, 10008, (((void)((st->stream_channels) == (opus_int32)0)), (opus_int32)(st->stream_channels)))) == OPUS_OK\0assertion failed: (opus_custom_decoder_ctl(celt_dec, 10012, (((void)((endband) == (opus_int32)0)), (opus_int32)(endband)))) == OPUS_OK\0assertion failed: (opus_custom_decoder_ctl(celt_dec, 10010, (((void)((start_band) == (opus_int32)0)), (opus_int32)(start_band)))) == OPUS_OK\0assertion failed: (opus_custom_decoder_ctl(celt_dec, 10010, (((void)((0) == (opus_int32)0)), (opus_int32)(0)))) == OPUS_OK\0assertion failed: (opus_custom_decoder_ctl(celt_dec, 4031, ((&redundant_rng) + ((&redundant_rng) - (opus_uint32*)(&redundant_rng))))) == OPUS_OK\0assertion failed: (opus_custom_decoder_ctl(celt_dec, 10015, ((&celt_mode) + ((&celt_mode) - (const OpusCustomMode**)(&celt_mode))))) == OPUS_OK\0assertion failed: st->application != OPUS_APPLICATION_RESTRICTED_SILK\0assertion failed: L >= K\0assertion failed: L > 0 && L <= MAX_FRAME_LENGTH\0assertion failed: subfr_length * nb_subfr <= MAX_FRAME_SIZE\0assertion failed: st->postfilter_period < MAX_PERIOD\0assertion failed: st->postfilter_period_old < MAX_PERIOD\0assertion failed: st->mode == MODE_HYBRID || curr_bandwidth == OPUS_BANDWIDTH_WIDEBAND\0assertion failed: lag > 0 || signalType != TYPE_VOICED\0assertion failed: order >= 0 && order <= SILK_MAX_ORDER_LPC\0assertion failed: fl+fs<=32768\0assertion failed: fl<32768\0assertion failed: nb_frames >= 0 && nb_frames <= 48\0assertion failed: Fs_kHz == 8\0assertion failed: ext->id >= 3 && ext->id <= 127\0assertion failed: st->start == 0 || st->start == 17\0assertion failed: qn <= 256\0assertion failed: d==10 || d==16\0assertion failed: fs_kHz == 8 || fs_kHz == 12 || fs_kHz == 16\0assertion failed: Fs_kHz == 8 || Fs_kHz == 12 || Fs_kHz == 16\0assertion failed: psDec->LPC_order == 10 || psDec->LPC_order == 16\0assertion failed: d >= 6\0assertion failed: typeOffset >= 0 && typeOffset < 6\0assertion failed: psRangeEnc->offs <= 1275\0assertion failed: sRangeEnc_copy2.offs <= 1275\0assertion failed: n < 25\0assertion failed: m==4\0assertion failed: psEnc->sCmn.nb_subfr == 2 || psEnc->sCmn.nb_subfr == 4\0assertion failed: ifact_Q2 <= 4\0assertion failed: len>=3\0assertion failed: ix[ n ][ 0 ] < 3\0assertion failed: _n>=2\0assertion failed: psDec->nb_subfr == MAX_NB_SUBFR || psDec->nb_subfr == MAX_NB_SUBFR/2\0assertion failed: encode_LBRR == 0 || typeOffset >= 2\0assertion failed: st->stream_channels == 1 || st->stream_channels == 2\0assertion failed: st->channels == 1 || st->channels == 2\0assertion failed: decControl->nChannelsInternal == 1 || decControl->nChannelsInternal == 2\0assertion failed: st->DecControl.nChannelsInternal == 0 || st->DecControl.nChannelsInternal == 1 || st->DecControl.nChannelsInternal == 2\0assertion failed: win_type == 1 || win_type == 2\0assertion failed: st->postfilter_tapset <= 2\0assertion failed: signalType >= 0 && signalType <= 2\0assertion failed: psDec->prevSignalType >= 0 && psDec->prevSignalType <= 2\0assertion failed: st->postfilter_tapset_old <= 2\0assertion failed: psEnc->sCmn.ltp_mem_length - psEnc->sCmn.predictLPCOrder >= psEncCtrl->pitchL[ 0 ] + LTP_ORDER / 2\0assertion failed: _ft>1\0assertion failed: _n>1\0assertion failed: st->end <= 21\0libopus 1.6.1\0assertion failed: nb_subfr == PE_MAX_NB_SUBFR >> 1\0assertion failed: encControl->nChannelsAPI == 1 && encControl->nChannelsInternal == 1\0assertion failed: count>0\0assertion failed: _bits>0\0assertion failed: fs>0\0assertion failed: nbBands>0\0assertion failed: len>0\0assertion failed: n>0\0assertion failed: _k>0\0assertion failed: max_pitch>0\0assertion failed: stride>0\0assertion failed: end>0\0assertion failed: cbr_bytes>=0\0assertion failed: overlap>=0\0assertion failed: sum>=0\0assertion failed: itheta>=0\0assertion failed: st->signalling==0\0assertion failed: (ord&3)==0\0assertion failed: st->DecControl.payloadSize_ms == 0 || st->DecControl.payloadSize_ms == 10 || st->DecControl.payloadSize_ms == 20 || st->DecControl.payloadSize_ms == 40 || st->DecControl.payloadSize_ms == 60\0assertion failed: st->overlap == 120\0assertion failed: psDec->LPC_order >= 10\0assertion failed: Complexity >= 0 && Complexity <= 10\0assertion failed: frame_length == 12 * 10\0assertion failed: st->Fs == 48000 || st->Fs == 24000 || st->Fs == 16000 || st->Fs == 12000 || st->Fs == 8000\0assertion failed: st->DecControl.internalSampleRate == 0 || st->DecControl.internalSampleRate == 16000 || st->DecControl.internalSampleRate == 12000 || st->DecControl.internalSampleRate == 8000\0assertion failed: st->silk_mode.internalSampleRate == 16000\0assertion failed: start_idx > 0\0assertion failed: idx > 0\0assertion failed: nStatesDelayedDecision > 0\0assertion failed: length_d_srch > 0\0assertion failed: iter->repeat_frame > 0\0assertion failed: st->downsample > 0\0assertion failed: N > 0\0assertion failed: L > 0\0assertion failed: K > 0\0assertion failed: D > 0\0assertion failed: NLSF_mu_Q20 > 0\0assertion failed: *lagIndex >= 0\0assertion failed: st->postfilter_tapset >= 0\0assertion failed: iter->src_len >= 0\0assertion failed: len >= 0\0assertion failed: st->arch >= 0\0assertion failed: st->postfilter_tapset_old >= 0\0assertion failed: ebits[j] >= 0\0assertion failed: bits[j] >= 0\0assertion failed: ifact_Q2 >= 0\0assertion failed: st->last_pitch_index >= PLC_PITCH_LAG_MIN || st->last_pitch_index == 0\0assertion failed: extensions != NULL || *nb_extensions == 0\0assertion failed: data != NULL || len == 0\0assertion failed: st->postfilter_period >= COMBFILTER_MINPERIOD || st->postfilter_period == 0\0assertion failed: st->postfilter_period_old >= COMBFILTER_MINPERIOD || st->postfilter_period_old == 0\0assertion failed: (d & 1) == 0\0assertion failed: ( length & 3 ) == 0\0assertion failed: ( LPC_order & 1 ) == 0\0assertion failed: ( order & 1 ) == 0\0assertion failed: ( shapingLPCOrder & 1 ) == 0\0assertion failed: ( D & 1 ) == 0\0assertion failed: 0\0assertion failed: !celt_isnan(norm)\0(null)\0assertion failed: !celt_isnan(tmp[0])\0assertion failed: st->mode == opus_custom_mode_create(48000, 960, NULL)\0assertion failed: fm<IMIN(fl+fs,32768)\0assertion failed: !celt_isnan(freq[0]) && (C==1 || !celt_isnan(freq[N]))\0assertion failed: psEncC->indices.NLSFInterpCoef_Q2 == 4 || ( psEncC->useInterpolatedNLSFs && !psEncC->first_frame_after_reset && psEncC->nb_subfr == MAX_NB_SUBFR )\0assertion failed: psEncC->frame_length == 8 * silk_RSHIFT( psEncC->frame_length, 3 )\0assertion failed: psEncC->useInterpolatedNLSFs == 1 || psEncC->indices.NLSFInterpCoef_Q2 == ( 1 << 2 )\0Fatal (internal) error in %s, line %d: %s\n\0A²õ\0\v>\0@^>\0À>\0í>\0@>\0\0\0\0\0ÀL?\0\0Í=\0Aáõ\0\vÁÿ\0ÿ\0ÿ\0ÿ\0ÿ\0þ\0ÿ\0þ\0ý\0ÿ\0þ\0ý\0ÿ0\0\0\b\0\0±\b\0\0k\x07\0\0\xA0\b\0\0°\r\0\0¬\f\0\0È\r\0\0\0 þöêØÂ¨b:\nØ\xA0b\"ÜBî:Ø\x1Br\x1B\n\x1B*´:¼<¶.\xA0~èN°nÈtÆd®\rø\f@\f\vÈ\n\n\nJ	\bÆ\x07\x07>x²ê\"ZÊ\0\0\x006ÿnþ¦ýÞüüNûúÂùþø:øv÷¶ööõ8õ|ôÀó\bóRòñêð:ðïâî8îíðìPì²ëëêðé`éÒèJèÄçDçÆæLæÖådåöää(äÆãjãã¾âpâ$âÞáá`á(áöàÆààxàXà>à(àà\nàà\0à\0A±ø\0\v%\b\x07\v\f\r\n	\0	\b\x07¸~yyff¸~3s\0Aàø\0\v¤*¯ÕÉÏÿ@\0\0cÿaþ£\0'+½VÙÿ\0[\0Vÿº\0\0üÀØMíÿÜÿf\0§ÿèÿHIü\b\n%>\0\0\0\0\0\0Ç=É@\0\0ÿ$\x006\0ýH3$EE\f\0\0\0rÿ ÿü\x1B{8\0\0\0\0\0\0\0\0h\rÈöÿ'\0:\0Òÿ¬ÿx\0¸\0Åþãý@#\0\0\0\0æ>ÆÄóÿ\0\0\0\0\0áÿÕÿüÿA\0Z\0\x07\0cÿ\bÿÔÿQ/4\nÇ\f\0\0\0\0\0\0\0\0äWÅ\0òÿìÿñÿ\0\0%\0\0ðÿ¹ÿÿ±ÿ2\0$oÖ\b¸\0\0\0\0\0\0\0\0kgÄ\0\f\0\b\0\0öÿêÿâÿàÿêÿ\0,\0d\0¨\0ó\0=}­ÇõæYó)T \0Aû\0\vr½\0¨ýigwu\0aÿÒû\bt4\0Ý\0¨ötnüÿêòåfÐÿöð¥]°ÿuïSÿÌïfGÿÇð';ÿaò®.¥ÿÏô^\"¹ÿc¡÷Òÿ©¡ú´\v\0\0\x07\0\n\0\n\f\0\0,\0Aü\0\v\0\0\0\0\0	\x07\0\f\x07\x07\x07\0A°ü\0\v4ýúôéÔ¶xnbUH<1( \r\v	\b\x07\0ÒÐÎËÇÁ·¨hJ4%\x1B\n\0Aðü\0\vÒ\bßÉ·§|obXOF>82,'#\x1B\f\n\b\0¼°waC+\n\0¥wP=/#\x1B	\0q?\0\0\0\0\0\f#<Sl´Îä 7Me}¯Éá*BYr¢¸Ñæ\f2Hax¬Èß,EZr´Íá\r5Pj´Íä,@Zs¨ÄÞ>Rdx¨¾Ö2OgxªËã-Aj|«Äà1Kay¥ºÑå4F]t¦ÀÛ\">Kav§ÂÙ!8F[q¥Äß\"3Hau«ÄÞ2CZu¨ÅÝ0B_u¨ÄÞ!3Mt´ÈàFWj|ªÂÙ!5@Su­Ìá\x1B\"A_l®ÒáHcq°ÈÛ\"+=N]r±Íå6a|£³Ñå&8Yv²Èç1?Uo£ÁÞ\x1B0Mg³Ä×è/Jc|°ÆÜí!*=L]y®Ïá5Wpª¼Ðã4T¦ºËå%0@Thv±ÉæQ\v\n	\n	\n	ï\bï\b\n	ü\b	ï\bH\v\nZ	?	\n	â\bâ\bâ\bâ\b\b·	$	$	\n	\n	\n	$	$	?	2	\fÎ\n$	$	\n	â\b­\b\bÕ\b\b	ª	?	Z	Z	Z	Z	?	g	\n	\rð\vO\b\bâ\bâ\bâ\bï\b\n	Õ\bÒ\fE\f\nZ	Ç\b­\b\b\b\bB\b\0­\b<\n<\ng	\n	Z	?	\bj\f¬\f?	­\bù		$	\n	w\b­\b\n\r\xA0\r¦\n\bÕ\b	2	?	\b5\b2	t		?	Z	t	t	t		?	Ã-	ß	?	â\bâ\bü\b\b\0\b¶\f\f\n\v		ü\bü\bâ\bO\b¿\fä\fÁ\nö\n	Õ\bÕ\bÇ\bO\b5\b9\v¥\vI\n?	g	2	\bÇ\bÇ\bB\b\f}\fI\n\nâ\b\bÇ\b­\b­\b]\bj\fî\f´\ng	â\bâ\bâ\bï\b\bB\bE\fÈ\f	\r\bï\bÄ	?	·		\b³\rÒ\f\n	\nW\nª	?	Z	$	O\b_\rÏ\rÞ\vð\vü\b\x07­\bâ\bâ\bâ\bL\r&\r'\b\n9\v2	t	â\bª	ì	°\xA0\r\x07d\nQ\vß	Z	?		Õ\bÔ\vÈ\f´\nH\v´\nj\bO\bï\bº\bÇ\boIé\x07±\x07d\n\n\nÄ		?	\fU\r2	\bH\vH\v$	·	Ç\bw\b\n\r&\r\vÜ\n	j\bâ\bï\bB\b\r\b	ü\b\bw\b\b?	I\n\n\nù	g		­\bÕ\b­\b­\b$	t	/\n\nÞ\v¬\fö\nH\vª	\bü\b\n	2	L	­\bj\bO\bï\bÄ	é\né\n<\n\n?	\\º\b.\x07\bÁ\n¦\nq\nÑ	\bé\nX\f¦\nù	\vÑ	\bZ	­\b\bÔ²l`UROM=;98310-*)(&$\"\f\n\0ÿõôìéáÙË¾°¯¡}rf[QG<4+#\f\v\0³£tCR;\\HdY\\\0AÐ\vç\0\0\0\0cB$$\"$\"\"\"\"SE$4\"tfFDD°fDD\"AUDT$tª»¸Øù¨¹hfdDD²Ú¹¹ªôØ»»ªô»»Ûg¸¹t·Ù¸¸ª¤Ù«ô©¸¹ª¤ØßÚÖ¼Ú¨ôª¨ÜÛ¤ÛÊØ¨ºö¹t¹Û¹dddf\"DDdD¨ËÝÚ¨§hF¤ö«ÚÛÿþýî\0ÿþüÚ#\0ÿþúÐ;\0ÿþöÂG\n\0ÿüì·R\b\0ÿüë´Z\0ÿøà«a\0ÿþì­_%\x07\0AÀ\vî\rÿÿÿÿÿÿÿÿì]`ÿÿÿÿÿÂSGÝÿÿÿÿ¢I\"B¢ÿÿÿÒ~I+9­ÿÿÿÉ}G0:ÿÿÿ¦nI9>hÒÿÿû{A7Dd«ÿ\0\0\0\0\0\0\0\0ú\0\0\0\0\0\0\0\0\0\0Í\0\0 \0\n\0.d°>\0\0ð?\0\0pB\0\0°B\0\0ÐB\0\0pC\0\0ÀC\0\0D\0\0\x07&6EUdt¢²ÁÐßï\r)7ESbp«»ËÜì\"3=N\\j~§¹Íáð\n$2?O_n~­½ÍÝí%3;NYk{¤¸Íàð\n 3CQ`p­½ÌÜì\b%3AObq~¨³ÀÑÚ\f\"7?NWlv§¹ËÛì $8O[lv«ºÌÜí\v+:JYix¥´ÄÓâñ!.<K\\k{©¹ÇÖá\v,9JYiy©ºÊÚê\f.9GXdx¥¶ÇØé#.8M\\j{§¹ÌÞí-5?KYks«¼ÎÝð	(8GXgw«½ÍÞí$09LWiv§¹ÊÚì\f6GQ^h~¤¶ÉÝí/>Oas¨´ÂÐßî\b->N^o¯ÀÏßï1>O\\kw\xA0®¾ÌÜë$-=L[ly¬½ÍÞî\f-<L[k{«»ÌÝì\r+5FSgr§¹ËÜí#*:N]n}ª¼Îàð\b\"2CScs¢²ÁÑàï\r)BIV_o£·Îáñ%4?K\\fw\xA0¯¿Ôç1ASdu¡®»ÈÕãò4DXgu~£±ÀÏßï/=LZjw¡°ÁÑàð#2=IVanw¯ÆÚíIm\vm\vm\vm\vm\vm\vm\vm\vm\vm\vm\v\v\vm\v\v\f\r\f\vð\vð\vÂ\vÂ\vÂ\v\v\vÂ\v\vH\v\v\v¦\nP®¥\v\f\fv\vð\v\v2\f¬\fm\v\v<\nù	Ü\nm\v¼\r}\fÂ\v\fË\vH\vm\vm\vm\vm\vH\vH\vH\vH\vH\vÁ\n¾¾v\võ\r9\rð\v\r\fé\nX\fX\f\v\vÑ	ì	Á\nH\vL5\nÁ\n\vÂ\vm\v\v¥\vË\vm\vm\vm\vm\vH\v¦\n$Ë\v\vð\vð\v9\vö\nð\v\fç\v¥\vÛ\fÛ\f¥\vî\f¯\vkì	\n\rÆ\r9\r}\f\f0\r¥\v\nW\n\né\n\vq\nÙ6\x07L	Q\vç\v\fa\f\n´\nH\v\vé\n\v\n2\fH\v\vm\vm\vm\vm\v\v\v\v\vm\vm\v\v\v\vj\f¥\v\fÂ\vH\vH\vm\v\v9\vd\vË\v\vÂ\v}\f9\v°°¬\f\f¥\vH\vm\vH\v\vv\vé\né\n\vH\vH\vd\n®\f2\f¬\fv\vç\v\v\v\r\f\vé\né\né\né\n\nð\r¼\r\f´\nÂ\vv\v2\f\r\f\v\vW\nW\n\vö\n\x1B\fq\ra\fQ\vU\r{\r\n\nq\n´\n\vö\nÁ\n\rÍÛ\fX\fm\vH\vH\vm\vé\n´\né\n´\né\n\vH\vö\nÙ¾ç\vÙ\r¬\fð\v\r\f\v\fQ\v´\n´\n´\n\vé\n<\nÕÕ,\vß	\f0\r0\r\f\f0\rð\v\vW\n\n¦\nÁ\nð\vd\vö\nH\v´\n\nQ\v\fN\fN\f\fa\fð\vÂ\v\v\v*m\vH\v\vH\v\v\vH\vH\vH\v\vH\vm\vH\v\v¥\vd\vd\v¥\v¥\vð\v2\f\fN\fð\vÂ\v\v\v\vm\v´\n5î\f\rm\v\vH\v¥\v¥\v\vé\n´\n\v\v\vé\nð®\fÂ\vm\vm\vm\vH\vm\vm\v\v\v\vé\nH\vÜ\n\x07ßa\fq\r\f¥\vQ\vÞ\v2\f´\n\n\n\n´\né\n\n5­ÍI¦\nÜ\nH\vH\vÂ\v\vm\v\v\n\né\nH\vwâ\rÁ\n\v\vH\vH\vH\vm\vm\vH\vm\vm\vm\v\vH\v69Õ\bh\rÍ\r\r\vî\f\rN\fQ\v	·	Á\nm\v{\re2\f}\f\rç\v\f\f¥\v\f\r\fm\vm\v\nì		¥\vÂ\vé\né\n´\né\n\v\vð\v\fN\fN\fN\f\fÂ\vÂ\v\v9\v\n¦\nÜ\nÂ\vh\rÙ\r\r¬\fð\vÂ\v\vm\vH\v\vË\v\vQ\vÂ\vÂ\v\vË\v\fð\vð\vÂ\vH\v\vm\vm\vH\vPÂ\v}\f\r\fÛ\fÛ\f\rxq\r¦\n\b	\n/\náÌÉ¸·¯wsqnmcb_OD420-+ \x1B\n\0ÿûëæÔÉÄ¶§¦£|nhZNLFE9-\"\v\0¯\xA0°²­®¤±®Ä¶ÆÀ¶D>B<HuUZv\xA0\0A·\vÀdffDD$\"`¤k¹´¹f@B$\"\"\0 Ð¿¹h`«h¦fff\0\0\0\0\0PmNk¹geÐÔ­{g$\0\0\0\0\0\00\0\0\0\0\0\0 D{wwgEbDgxvvfGb¸¶Ð¨øK½yk 1\"\"\"\0Òë{¹ibh¶d·«dFDFBB\"@¦fD$\0¦fD\"\"BÔökkWfdÛ}zvgri«j2\"¤Ö¹ygÀ\"\0\0\0\0\0ÐmJ»ùfnvWewe\0\0$$BD#`¤fd$\0!§®fdTdkxw$Å\0ÿþýô\f\0ÿþüà&\0ÿþûÑ9\0ÿþôÃE\0ÿûè¸T\x07\0ÿþðºV\0ÿþï²[\0ÿøã±d\0A\v·ÿÿÿÿÿÿÿÿãf\\ÿÿÿÿÿÕSHìÿÿÿÿL!?Öÿÿÿ¾yM+7¹ÿÿÿõG+;ÿÿÿÿB2BkÂÿÿ¦tL75}ÿÿ\0\0\0\0\0\0\0\0d\0\0(\0\0\0\0\0\0\0\n\0\v\0\0\b\0	\0\x07\0\0[\0\0 \0\0f&«PD\0\0PF\0\0PJ\0\0J\0\0°J\0\0°K\0\0\0L\0\0PL\0\0\0\0\0\0\\Ê¾Ø¶ßâæxìzôÌü4\vdfJ B'¤5ù÷öõôêÒÊÉÈÅ®R;876.\f\v\n	\x07\0@\0Ë\0×Ã¦}nR\0\0\0\0ÛL\0\0ÞL\0\0x\0@\0è\n\0æ\0óÝÀµ\0d\0ð\0 \0d\0Í<\x000\0 «U\0À@\0Íf3\0Õ«U+\0àÀ\xA0`@ \0d(\x07\0\0\ngòVÍä\ngòuR\fYuR\fF1\níbF1\nÚ×\x07ùÆ­Ú×\x07\"¶RÚú¤\n\"¶R\0\0\0\0Fó.+ãKf,\nÚaHíôì0\vã¥í¤\nßk\0\0\0\0\0\0\0\0àp,\0þíÀF\0ÿüâ=\v\0AÀ\v3úõêËG2*&#!\x1B\r\f\v\n	\b\x07\0³c\0G8+\f\0A\vDÇ¥|m`TG=3* \b\0ñáÓÇ»¯¤{ri`XPH@92,&!\f	\0ìM\0\0\0N\0\0N\0\0­­\0AÐ\vôE]sv\xA0¦\xA0\xA0\xA0\xA0\xA0¦¦­­¶À¶ÀÀÀÍÀÍà<N\0\0PN\0\0`N\0\0\0\0\0\0\x07\0\0\0\0\f)\rü÷*þ>)÷ö%AüúB\x07ø&ý!\0\0\0\0\0\0\0\0\r'\fÿ$@\x1Búù\n7+\bõJ5÷ô7Lô\bý]\x1Bü';ø\0M\v	ø,ú\x07(		ùeùø*\0ñ!Dþ7.þÿ)ú\x1B='õ*Xþ<AüÿûI8÷^÷\0\fc\bíf.ó\r	ëTHîõ.hê\b&0\0ðFSë\võuøúuôø_öM<ñÿ|ü&Tç\r*\rü8.ÿÿ#OóùAX÷òQ1ã\0Kï÷,\\øýEú_)ô'Cü\0úx7Üó,zèQ\v\x07\0	\nXN\0\0ÀN\0\0O\0\0.ZW][Rb\0AÐ\vCmxv\fqsuwc;Wo?opP~|}|y~~zevw~V|x{wª­km¼O\0\0ÐO\0\0àO\0\0\b \b\n\f\0A\xA0\xA0\v³}3\f\v\n	\b\x07\0Æi-\f\v\n	\b\x07\0Õ¢tS;+ \f	\x07\0ï»t;\v\n	\b\x07\0úå¼V3\r\n\b\0ùëÕ¹gSB5*!\r\n\0þùëÎ¤vM.\x1B\n\x07\0ÿýùïÜ¿wU9%\n\0ÿýûöíßË³|bK7(\0ÿþý÷Ü¢jC*\f	\0Aà¡\v¢9k\xA0ÍÍÿÿÿÿÿÿÿÿÿÿÿÿE/Co¦ÍÿÿÿÿÿÿÿÿÿÿÿÿRJO_m\xA0­ÍÍÍàÿÿàÿà}J;Ea¶ÿÿÿÿÿÿÿÿÿÿÿ­sUIL\\s­Íààÿÿÿÿÿÿ¦qfefkv}¦¶ÀÀÍà¶eSOUax­ÍàÿÿÿÿÿÿàÀxe\\Y]fv\xA0¶Ààààÿàà¶vmhfjov\xA0­\0A£\vñ¾²WJ)\0ßÁj9'\0A°£\vJOP_h_c[}]L{s{\0AÐ£\v\0Ö*\0ë\0ô¸H\v\0øÖ*\x07\0øáªP\0ûìÆ~6\0úîÓR#\0úçË¨X5\0üîØ¹lG(\0ýóáÇ¦Z9\r\0þöéÔ·mI,\n\0ÿúðßÆ¦Z:!\0ÿûôçÒµnK.\f\0ÿýøîÝÄ¤\\<#\b\0ÿýùòåÐ´nL0\x1B\x07\0Að¤\v\0Ï2\0ì\0õ¹H\n\0ùÕ*\0úâ©W\x1B\0ûéÂ>\0úìÏ\xA0c/\0ÿðÙ¶Q)\v\0ÿþéÉk=\0ÿùéÎªV2\x07\0ÿúîÙºlF'\0ÿüóâÈ¦Z8\r\0ÿüõçÑ´nL/\v\0ÿýøíÛÂ£]>%\b\0ÿþúñâÍ±oO3\0A¦\v\0Ë6\0ê\0õ¸I\n\0ú×)\0üè­V\0ýðÈ8\0ýôÙ¤^&\n\0ýõâ½G\x1B\x07\0ýöçËi8\0ÿøëÕ³U/\0ÿþóÝÂuF%\f\0ÿþøêÐ«U0\b\0ÿþúðÜ½kC$\0ÿþûóãÉ¦Z7\r\0ÿþüöêÕ·mI+\n\0A°§\v\0È:\0ç\0ô¸L\f\0ùÖ+\0üè­W\0ýñË8\0þöÝ§^#\b\0þùèÁA\0ÿûïÓ¢c-\0ÿûóßºJ!\v\0ÿüõæÊi9\b\0ÿý÷ëÖ³T,\x07\0ÿþúðßÄpE$\0ÿþýõçÑ°]7\x1B\v\0ÿþýüïÝÂuL*\0AÒ¨\v	\x1B#,6AMZhw\0Að¨\v¢þ1CMR]cÆ\v$-ÿ.BNW^hÐ *3Bÿ^hmpsvø5EPX_f\0\0\0\0\0\0ÿÿþþý\0\0ÿÿþþý\x07þ\x07\0\0\0\0\0ÿÿÿ\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0ÿ\0\0\0ÿÿ\0\0\0\0\0\0ÿ\0ÿ\0ÿþþþýýüüûúûù\b÷\0\0\0\0\0\0\0\0\0ÿ\0\0ÿ\0ÿÿÿÿþþþý\0\0\0\0\0\0\0\0\0\0ÿ\0\0ÿÿÿÿÿþþþ\0\0\0\0ÿÿÿþþþýýüüû\búûù	\0\0\0\0\0\0\0\0û\bÿÿü\nú\nþÿû\n÷\fý\x07þ\x07ù\r\"\0\0\0\0\0\0\0\0\0\0»\0\0x\0\0\0\0\0\0\0\0\0\0Y?\0\0\0\0\0\0?\0\0? V\0\0\0\0\0\b\0\0\0x\0\0\0\v\0\0\0PV\0\0@W\0\0pW\0\0\x07\0\0\0\0\0PY\0\0p\0\0\xA0\0\0X\0\0Y\0\0\0\0°u\0\0v\0\0 x\0A¢¬\v)\0\0\0\0\0\0\x07\0\b\0\n\0\f\0\0\0\0\0\0\"\0(\x000\0<\0N\0d\0Aå¬\vÒZPKE?81(\"\n\0\0\0\0\0\0\0\0ndZTNGA:3-' \f\0\0\0\0\0\0vng]VPKFA;5/(\0\0\0\0~wph_YSNHB<6/' \f\0\0xrga[UNHB<6/)#\n|qke_XRLF@93-'!{uoib\\VPJC=71+$¢yslf`ZTMGA;5.¬¥}vpjd^WQKE?8-ÈÈÈÈÈÈÈÈÆÁ¼·²­¨£h\0AÐ®\v\b\0\b\0\b\0\b\0\0\0\0\0\0\0\0\"\0$\0\0\0\0\0\0\0j8R»:\biÜ:íW;c²;*<0Ü9<´>w<£<ÑòÅ<þñ<«=­*=ÂF=Sæd===Ë²¥=Ñ¾¸=:¿Ì=T¯á=÷=%\x07>Ùô>_1>h×+>ã8>0RF>T>¿Gb>Æp>°>R[>`>å>yÛ>pî¦>Ø\x1B¯>û`·>»¿>F'È>·¢Ð>x*Ù>»á>\fSê>Þíò>û>¾?Z?$\n?PÞ?+?AE?%j\x1B?s?Î#?æ'?t|+??Z/?&3?çÞ6?:?3>?ÅA?wïD?:H?'mK?ÎN?åQ?ñlT?8W?iéY?E\\?úù^?sYa?¯c?ÁÆe?ÏÔg?Èi?Ò\xA0k?n_m?Po?ôp?ær?½]s?¡t?¿Íu?Wäv?°åw?Òx?ã«y?srz?''{?çÊ{?^|?5ã|?Y}?½Â}?~?Þp~?«·~?Ïô~?&)?U?¾z??Ì²?Ç?×?ã?Ýì?¶ó?ø?Èû?Öý?\x07ÿ?¥ÿ?èÿ?ýÿ?\0\0?à\0\0\b;ÿÿÿÿ\0`\0\0 \0\0\b\0\0\0\0\0Aü²\vÐx\0\0|\0A³\vÉ8ÿÿ?ÿ?jþ?ü?\x07ú?Èö?Öò?0î?Öè?Èâ?\x07Ü?Ô?jÌ?Ã?\0º?½¯?Ç¤??À?°?íq?vc?KT?nD?Þ3?\"?£?úý~?ê~?Ö~?ËÁ~?V¬~?.~?S~?Æg~?O~?6~?ï~?~?ç}?ÓË}?f¯}?F}?tt}?ñU}?¼6}?Õ}?<ö|?òÔ|?ö²|?I|?ël|?ÛH|?\x1B$|?©þ{?Ø{?´±{?0{?üa{?9{?{?=åz?Hºz?¢z?Mbz?I5z?\x07z?0Ùy?ªy?Zzy?éIy?Èy?ùæx?{´x?Nx?sMx?êx?²ãw?Í­w?:ww?ù?w?\n\bw?nÏv?%v?/\\v?!v?<æu?@ªu?mu?B0u?Aòt?³t?;tt?74t?ós?,²s?'ps?v-s?êr?¦r?dar?\nr?Öq?Wq?\0Hq?ÿÿp?U·p?np?$p?bÙo?o? Bo?õn??¨n?TZn?À\vn?¼m?¥lm?m?ïÊl?\x1Byl?\xA0&l?Ók?»k?P+k?@Öj?j?2*j?5Ói?{i?N#i?dÊh?Øph?¨h?Õ»g?``g?Hg?§f?3Jf?6ìe?e?W.e?wÎd?õmd?Ô\fd?«c?±Hc?°åb?b?Ñb?ó¸a?wSa?]í`?¤`?O`?[·_?ËN_?å^?Õ{^?p^?o¦]?Ò:]?Î\\?Ça\\?Yô[?Q[?®[?s¨Z?8Z?/ÈY?'WY?åX?OsX?\0X?W?W?¤V?V/V?¹U?:CU?KÌT?ÇTT?®ÜS?dS?¿êR?épR?öQ?{Q?òÿP?ÏP?\x07P?ÓO?ú\vO?N?N?	M?íM?AL?\rL?;K?á\bK?ùJ?J?~I?îùH?ÐtH?$ïG?íhG?*âF?ÛZF?\0ÓE?JE?¬ÁD?28D?/®C?£#C?B?ï\fB?ÈA?ô@?åf@?(Ù??åJ??\x1B¼>?Ì,>?÷=?\f=?¿{<?\\ê;?uX;?\vÆ:?3:?­9?»\v9?Gw8?Qâ7?ÚL7?ã¶6?l 6?t5?ýñ4?\bZ4?Á3?¡(3?02?Cõ1?ØZ1?ñ¿0?$0?°/?Vì.?O.?2²-?i-?'v,?l×+?88+?*?hø)?ÌW)?º¶(?2(?4s'?ÀÐ&?×-&?y%?§æ$?bB$?©#?}ø\"?ßR\"?Ï¬!?N!?[_ ?ø·?%?âg?1¿??l?Â\x1B?\x1B?Dm?\0Â?Q?7j?±½?Á?gc?¤µ?w\x07?âX?ä©?ú?³J??çé?è8??¼Õ?#?þp\r?\n¾\f?³\n\f?úV\v?ß¢\n?cî	?9	?I\b?¬Î\x07?°\x07?Ub?«?ô?=?>?Í??¡[?b¢\0?Ñÿ>¨]þ>éü>Ãsû>Çýù>ø>Â÷>»õ>\x07ô>¨¥ò>+ñ>í°ï>5î>¹ì>é<ë>¿é>ªAè>Ãæ>àCå>	Äã>Câ>|Âà>É@ß>y¾Ý>;Ü>\x07¸Ú>ç3Ù>/¯×>à)Ö>ú£Ô>Ó>oÑ>ÍÐ>Î>ÓýÌ>~tË>êÉ>(`È>*ÕÆ>\xA0IÅ>½Ã>í0Â>Ç£À>¿>ç½>.ù»>òiº>3Ú¸>òI·>0¹µ>ï'´>0²>ó±>:q¯>Þ­>WJ¬>0¶ª>!©>{§>ðö¥>ñ`¤>}Ê¢>3¡>A>{>El>¢Ó>:>¡>1\x07>âl>+Ò>\f7>>ÿ>Rc>£Æ>)>!>Qî>#P>±>²>áæ~>¬§{>Ægx>1'u>ñåq>\x07¤n>uak>>h>dÚd>êa>ÑP^>\v[>ÎÄW>è}T>n6Q>_îM>Á¥J>\\G>ÜD>È@>Ñ}=>2:>±æ6>_3>M0>E\0->²)>Dd&>#>qÆ>Þv>Ý&>pÖ>>^4>½â\v>º\b>W>>ë>ö0ý=\fö=vâï=7:é=Vâ=ÕçÛ=¹=Õ=\bÎ=ÆçÇ=÷;Á=¡º=Èâ³=q5­=\xA0¦=[Ù=¥*={=ûË==×|=Rvo=hb=á±T=ÄNG=\x1Bë9=ð,=L\"=8½=½W=Ìãí<wÓ<J¸<#}<I¯<(ÂO<,%<É;U¨;;OwÖ¹Fq»LÞã»v'¼R)]¼Éb¼0¤¼Õý¾¼ÊÙ¼Èô¼%±\x07½½{\"½\x07à/½D=½§J½\nX½òle½²Îr½ä½È½çw½V'½\\Ö½÷¡½ 3¨½Óà®½\vµ½Ã:¼½øæÂ½¤É½Â=Ð½OèÖ½CÝ½;ä½Xäê½kñ½×3ø½Úþ½OÀ¾ø¾De	¾.·\f¾·\b¾ÚY¾ª¾çú¾ÍJ¾D ¾Jé#¾Þ7'¾ü*¾£Ó-¾Ð 1¾m4¾±¹7¾b;¾P>¾7A¾XåD¾í.H¾÷wK¾qÀN¾Z\bR¾°OU¾pX¾Ü[¾&\"_¾gb¾j«e¾\x1Bïh¾)2l¾to¾Q¶r¾f÷u¾Ï7y¾w|¾¶¾tz¾D¾¸·¾ÎU¾ó¾à¾Ø-¾nÊ¾¢f¾r¾Ý¾â8¾Ó¾´m¾\x07¾à\xA0¾Õ9¾]Ò¾wj¾\"\xA0¾\\¡¾%0£¾{Æ¤¾^\\¦¾Ìñ§¾Ä©¾E\x1B«¾N¯¬¾ÞB®¾ôÕ¯¾h±¾¬ú²¾K´¾m¶¾®·¾/>¹¾ÍÍº¾é\\¼¾ë½¾y¿¾\x07Á¾\"Â¾ Ä¾¬Å¾ö7Ç¾ÒÂÈ¾ MÊ¾àÖË¾`Í¾³èÎ¾ÃpÐ¾AøÑ¾+Ó¾Õ¾BÖ¾kØ¾ýÙ¾÷Û¾WÜ¾Þ¾E¡ß¾Ñ\"á¾¿£â¾$ä¾½£å¾Ë\"ç¾6¡è¾þê¾\"ë¾\xA0í¾yî¾©ð¾2ñ¾ó¾D}ô¾Íõõ¾©m÷¾×äø¾W[ú¾&Ñû¾FFý¾³ºþ¾7\0¿ºÐ\0¿ã¿±B¿$û¿:³¿õj¿R\"¿RÙ¿ô¿8F\x07¿ü\x07¿¡±\b¿Çf	¿\x1B\n¿ïÏ\n¿ò\v¿7\f¿Ðê\f¿«\r¿#P¿7¿ç³¿2e¿¿Æ¿°v¿b&¿­Õ¿¿\f3¿á¿È¿\x07<¿Ýè¿G¿GA¿Ûì¿¿¿B\x1B¿í\x1B¿ï¿b@¿gé¿þ¿$:¿Üá¿\" ¿ù/!¿^Ö!¿Q|\"¿Ó!#¿âÆ#¿~k$¿§%¿[³%¿V&¿hù&¿¾'¿=(¿\nß(¿þ)¿| *¿À*¿`+¿&ÿ+¿Ã,¿ç;-¿Ù-¿Âv.¿x/¿³¯/¿sK0¿·æ0¿1¿Ê\x1B2¿µ2¿éN3¿¼ç3¿4¿ç5¿>¯5¿F6¿mÜ6¿Dr7¿\x078¿p8¿Ä09¿Ä9¿åW:¿²ê:¿û|;¿Á<¿\xA0<¿À0=¿ùÀ=¿¬P>¿Úß>¿n?¿¤ü?¿?@¿SA¿ß£A¿ã/B¿_»B¿RFC¿½ÐC¿ZD¿õãD¿ÂlE¿õE¿»|F¿èG¿G¿H¿$H¿\x1BI¿I¿n#J¿Á¦J¿)K¿»«K¿b-L¿y®L¿/M¿ù®M¿a.N¿8­N¿~+O¿2©O¿U&P¿å¢P¿ãQ¿OQ¿'R¿lR¿	S¿:S¿ÃúS¿¶rT¿êT¿Þ`U¿×U¿¯LV¿¶ÁV¿&6W¿ÿ©W¿AX¿ëX¿þY¿wsY¿YäY¿¡TZ¿PÄZ¿f3[¿á¡[¿Ã\\¿\n}\\¿¶é\\¿ÈU]¿=Á]¿,^¿V^¿øÿ^¿þh_¿gÑ_¿39`¿a\xA0`¿òa¿åla¿9Òa¿ð6b¿\x07b¿þb¿Xac¿Ãc¿+%d¿%d¿~æd¿6Fe¿N¥e¿Äf¿af¿Ì¾f¿]\x1Bg¿Mwg¿Òg¿C-h¿Jh¿®àh¿n9i¿i¿éi¿Ø?j¿\bj¿ëj¿z@k¿¼k¿Xèk¿O;l¿\xA0l¿Jßl¿O0m¿­m¿dÐm¿un¿Þmn¿\xA0»n¿»\bo¿-Uo¿ø\xA0o¿\x1Bìo¿6p¿fp¿Ép¿q¿åYq¿¡q¿çq¿p-r¿\xA0rr¿&·r¿ûr¿2>s¿¸s¿Âs¿Ãt¿HDt¿\"t¿OÃt¿Òu¿¨?u¿Ò|u¿O¹u¿ õu¿E0v¿½jv¿¤v¿¦Ýv¿w¿ÙMw¿ïw¿W»w¿ñw¿&x¿zZx¿)x¿+Áx¿}óx¿!%y¿Vy¿[y¿òµy¿Úäy¿z¿@z¿smz¿z¿Åz¿ßïz¿ø{¿aC{¿l{¿\"{¿y»{¿ â{¿\b|¿\\-|¿ðQ|¿Óu|¿|¿»|¿UÝ|¿sþ|¿ß}¿>}¿¢]}¿ù{}¿}¿¶}¿ÓÒ}¿bî}¿?	~¿i#~¿á<~¿§U~¿ºm~¿\x1B~¿É~¿Ä±~¿\fÇ~¿¢Û~¿ï~¿µ¿2¿ü&¿8¿vH¿'X¿$g¿nu¿¿è¿¿§¿^²¿t¼¿×Å¿Î¿Ö¿ÈÝ¿]ä¿=ê¿jï¿ãó¿©÷¿»ú¿ý¿Äþ¿»ÿ¿úÿ?9þ?©ù?Kò?è?\"Û?YË?Á¸?[£?(?'p?ZR?¿1?X?%è~?&¿~?\\~?Èd~?i3~?Aÿ}?OÈ}?}?R}?Ë}?¼Ð|?ç|?MD|?ïù{?Í¬{?é\\{?C\n{?Ý´z?¶\\z?Ñz?.¤y?ÎCy?³àx?Üzx?Lx?§w?9w?OÈv?äTv?ÆÞu?öeu?uêt?Dlt?eës?Úgs?£ár?ÂXr?9Íq?	?q?4®p?»p?\xA0o?äën?Pn?²m?m?Õnl?Ék?· k?Êuj?JÈi?9i?eh?p°g?ºøf?|>f?¸e?oÂd?¥\0d?Z<c?ub?L¬a?à`?Y`?®A_?n^?]?\bÁ\\?\xA0æ[?Ï	[?*Z?ûHY?ýdX?\xA0~W?åV?ÐªU?c½T?¡ÍS?ÛR?'çQ?uðP?y÷O?4üN?«þM?ßþL?ÔüK?øJ?\nòI?RéH?eÞG?GÑF?ûÁE?°D?åC?!B?:oA?5U@?9??Ù>?ú<?&Ø;?´³:?69?¯d8?#:7?\r6?ß4?|®3?ù{2?G1?0?ÂØ.?-?Vb,?I$+?[ä)?¢(?ë^'?q&?%Ò$?\n#?#>\"?vñ ?£?ÒR?ä\0?=­\x1B?áW?Ô\0?¨?´M?ªñ?ý?²4?ÍÓ?Qq?B\r?¥§\f?|@\v?Í×	?m\b?é\x07?½?&?¶?~D?£ÿ>oºü>ûÎù>Ëàö>åïó>Rüð>\x1Bî>H\rë>àè>îå>xâ>ß>%\vÜ>XÙ>+ùÕ>¥ìÒ>ÎÝÏ>°ÌÌ>S¹É>À£Æ>ÿÃ>rÀ>V½>8º>á·>¾õ³>£Ñ°>«­>£ª>ÐY§>(.¤>³\0¡>zÑ>\xA0>àm>9>¡>\x1BÌ>>lX>W>ÏÞ>¸?{>¿t>¾;n>Ìµg>P-a>\\¢Z>T>SM>eóF>H_@>É9>Ì03>,>tú%>\\>Õ¼>y\x1B>x\v>Ô>!\\ü=x\rï=/¼á=khÔ=TÇ=\rº¹=¾_¬==¥=\rF=Êm=S=>8=¯u=\x07«=â½Ï<m#<I<\"¨»;NwVº«Eñ»ãÜc¼9§¼)$Ý¼×]	½($½ð>½æ¶Y½Þzt½½<ý½ÂZ¢½¶¯½Q½½hÊ½½×½¾å½caò½`¯ÿ½G}¾e!\r¾÷Ã¾êd¾+!¾¨¡'¾O=.¾\r×4¾Ïn;¾B¾H¾v)O¾¸U¾SE\\¾«Ïb¾Wi¾ÒÜo¾}_v¾tß|¾S®¾ë¾7'¾pa¾\"¾CÑ¾Ì¾²:¾ìl¾r¾;Ì¡¾>ù¤¾q$¨¾ÍM«¾Gu®¾Ø±¾w¾´¾à·¾¸ÿº¾I¾¾Æ8Á¾#RÄ¾YiÇ¾`~Ê¾.Í¾»¡Ð¾þ¯Ó¾ï»Ö¾ÅÙ¾¸ÌÜ¾Ñß¾ÑÓâ¾§Óå¾øÐè¾»Ëë¾èÃî¾w¹ñ¾_¬ô¾÷¾ú¾Ýtý¾l.\0¿¡¿,¿æ¿+ð¿ú\\\x07¿KÈ\b¿2\n¿k\v¿1\r¿kf¿Ê¿,,¿¬¿ë¿ÔH¿u¤¿pþ¿¿V¿a­¿P¿U¿	§¿Ëö¿ÌD!¿\b\"¿|Û#¿#$%¿üj&¿°'¿/ó(¿4*¿ùs+¿±,¿>í-¿'/¿â^0¿Ï1¿ÉÈ2¿Îú3¿Ù*5¿çX6¿ö7¿¯8¿\x07×9¿ý:¿ð <¿ÏB=¿b>¿N?¿é@¿gµA¿ÅÌB¿âC¿õD¿F¿ÃG¿U!H¿µ+I¿à3J¿Ô9K¿=L¿\b?M¿D>N¿<;O¿ï5P¿Y.Q¿x$R¿IS¿É	T¿öøT¿ÍåU¿LÐV¿p¸W¿6X¿Y¿bZ¿=A[¿t\\¿A÷\\¿¡Î]¿£^¿v_¿!F`¿¹a¿ÙÞa¿§b¿¨mc¿S1d¿~òd¿%±e¿Hmf¿ä&g¿÷Ýg¿h¿{Di¿çói¿Ã\xA0j¿\fKk¿Àòk¿Þl¿d:m¿OÚm¿wn¿Ro¿fªo¿Ø?p¿¨Òp¿Ôbq¿[ðq¿:{r¿ps¿ýs¿Ý\vt¿t¿	u¿ku¿üu¿\0rv¿½äv¿ÅTw¿Âw¿²,x¿x¿»ùx¿(\\y¿Ù»y¿Ìz¿sz¿xÊz¿/{¿$q{¿XÀ{¿É\f|¿vV|¿_|¿á|¿à\"}¿wa}¿G}¿OÖ}¿\f~¿@~¿°p~¿~¿©É~¿õñ~¿u¿):¿Z¿+w¿x¿ø¨¿ª½¿Ï¿¥Þ¿íê¿fô¿û¿íþ¿êÿ?åø?¦æ?-É?|\xA0?l?y-?,ã~?±~?\v-~??Á}?RJ}?HÈ|?(;|?÷¢{?½ÿz?Qz?Hy?Ôx?	x?+w?FFv?¬Vu?N\\t?8Ws?vGr?-q?\bp?Øn?¥m?@Zl?~\vk?k²i?Oh?áf?òie?>èc?\\b?êÆ`?m'_?&~]?(Ë[?Z?SHX?£xV?T? ½R?vÑP?£ÜN?½ÞL?Û×J?ÈH?|¯F?/D?BdB?Î1@?ìö=?µ³;?Bh9?­7?¹4?U2?)ê/?w-?eü*?5z(?¡ð%?Æ_#?ÀÇ ?­(?©\x1B?ÔÕ?J\"?*h?§?¤à\r?|\v?9@\b?ýf?ç?.Fÿ>[qù>ó>%§í>F²ç>=³á>MªÛ>»Õ>Ê{Ï>¿VÉ>à(Ã>qò¼>¸³¶>ül°>ª>È£>tk>m\x07>Æ>È+>º´>Êoz>$km>\\`>+CS>\0!F>#ö8>)Ã+>§>0G>Zÿ>scí=È½Ò=ß¸=ãW==Ç¬O=q=°\nÉ<Y§;<IwÖºþCq¼?×ã¼@'½]½J½T¤½g»¾½hÙ½H\vô½àQ\x07¾,¾ô×!¾¢/¾£A<¾ajI¾JV¾É\xA0c¾M­p¾A¯}¾\vS¾È¾\v8¾¡¾d¾¾^¥¾×²«¾hÿ±¾*D¸¾Ö¾¾(µÄ¾ÙàÊ¾£Ñ¾C×¾s-Ý¾ï3ã¾t0é¾¾\"ï¾\nõ¾çú¾Ó\\\0¿7@¿Ú¿õ\b¿YÇ\v¿÷¿SX¿O¿ÌÏ¿«¿Ï,¿Ñ¿ln!¿ª$¿¶&¿t\x1B)¿Æ+¿.¿»0¿%ï2¿¶P5¿Tª7¿ãû9¿IE<¿m>¿6¿@¿ïB¿RE¿t6G¿ÙLI¿jZK¿_M¿²ZO¿=MQ¿6S¿²U¿ríV¿ÄºX¿~Z¿Ï8\\¿bé]¿8_¿@-a¿gÀb¿Id¿ÍÈe¿ê=g¿ã¨h¿§	j¿&`k¿S¬l¿îm¿y%o¿WRp¿ªtq¿fr¿~s¿çt¿u¿}v¿bw¿Ô9x¿/y¿Çy¿~z¿){¿\fÊ{¿z_|¿Õé|¿i}¿>Ý}¿@F~¿¤~¿Ìö~¿M>¿z¿¶«¿Ñ¿Cì¿´û¿¦ÿ?ã??Ì$?8~?ý²}??·|?*{?ó:z?Ôºx?w?ö7u?Õ5s?\b	q?ñ±n?ù0l?i?/³f?S·c?`?NH]?EÖY?>V?,R?eN?^J?ÌkF?jB?ù®=?A9?\rm4?2/?¬*?ë%?@t ?n-\x1B?bË?O?h¹\n?l\v?/þ>ÞÔò>ñòæ>èÚ>§·Î>bÂ>Oëµ>+T©>R>þÎ>oå>ÑÉk>eQ>2P7>Öà>óU>fhÏ=\0=/ûH=2¤»<6wV»K=ñ¼¯Àc½a]§½\r½Ü½ÿú\b¾p#¾1ç=¾\xA0-X¾\"Nr¾\"¾¾2Ï¾Ô|¬¾2\f¹¾{Å¾YÇÑ¾ÌîÝ¾Nïé¾ÅÆõ¾¹\0¿%y¿$!\f¿°¿e&¿¹¿Á!¿å&¿Jë+¿UÓ0¿Z5¿E:¿üÍ>¿ü4C¿¼yG¿|K¿O¿sS¿\xA0'W¿b¶Z¿Å^¿/`a¿zd¿Økg¿\x075j¿Õl¿¨Ko¿6q¿aºs¿É±u¿~w¿öy¿!z¿UÝ{¿Yú|¿úê}¿¯~¿tF¿±¿Îî¿ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ\0\0\0\0\0\0\0\0)\0)\0)\0R\0R\0{\0¤\0È\0Þ\0Aêë\v)\0)\0)\0)\0{\0{\0{\0¤\0¤\0ð\0\n\x1B')\0)\0)\0)\0)\0)\0)\0)\0{\0{\0{\0{\0ð\0ð\0ð\0\n\n1>HP{\0{\0{\0{\0{\0{\0{\0{\0ð\0ð\0ð\0ð\x00111>>W_flð\0ð\0ð\0ð\0ð\0ð\0ð\0ð\x001111WWW__rx~\0Aí\v¸(\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07\x07(\"$&')*+,-.//123456779:;<=>??ABCDEFGG(!)059=@BEGIKLNPRUWY[\\^`begiklnpruwy{|~('3<CIOSW[^adfikosvy|~£¦©¬®±³#1ANYckrx~¥«°´¹½ÀÇÍÓØÜáåèïõû!:Oap}¦®¶½ÃÉÏÙãëóû#?Vj{¥±»ÅÎÖÞæíú7K[iu¡¨®´¹¾ÈÐ×Þåëðõÿ$AYn­¹ÄÏÙâêòú\v)Jg¬¿Ñáñÿ	+On£ºÏãö\f'Gc{¤¶ÆÖäñý	,Qq¨ÀÖëÿ\x071Z\xA0¿Ü÷3_ªËê\x07/W{¸Ôí4a®Ðð9jÀç;oÊó7g»à<q¡ÎøAz¯àC¶ê\0\0\0\0\0\0\0\0àààààààà\xA0\xA0\xA0\xA0¹¹¹²²¨=%ààààààààððððÏÏÏÆÆ·B(\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0¹¹¹¹ÁÁÁ··¬@&ððððððððÏÏÏÏÌÌÌÁÁ´B(¹¹¹¹¹¹¹¹ÁÁÁÁÁÁÁ··¬A'ÏÏÏÏÏÏÏÏÌÌÌÌÉÉÉ¼¼°B(ÁÁÁÁÁÁÁÁÁÁÁÁÂÂÂ¸¸­A'ÌÌÌÌÌÌÌÌÉÉÉÉÆÆÆ»»¯B(\0AÒñ\v¹)`\0À\0  \0\0à\0@\xA0@\0\xA0\0\0`À\b\0h\0È\0((\0\0è\0H¨H\0¨\0\bhÈ\0p\0Ð\x0000\0\0ð\0P°P\0°\0pÐ\0x\0Ø\x0088\0\0ø\0X¸X\0¸\0xØ\0d\0Ä\0$$\0\0ä\0D¤D\0¤\0dÄ\f\0l\0Ì\0,,\0\0ì\0L¬L\0¬\0\flÌ\0t\0Ô\x0044\0\0ô\0T´T\0´\0tÔ\0|\0Ü\0<<\0\0ü\0\\¼\\\0¼\0|Ü\0a\0Á\0!!\0\0á\0A¡A\0¡\0aÁ	\0i\0É\0))\0\0é\0I©I\0©\0	iÉ\0q\0Ñ\x0011\0\0ñ\0Q±Q\0±\0qÑ\0y\0Ù\x0099\0\0ù\0Y¹Y\0¹\0yÙ\0e\0Å\0%%\0\0å\0E¥E\0¥\0eÅ\r\0m\0Í\0--\0\0í\0M­M\0­\0\rmÍ\0u\0Õ\x0055\0\0õ\0UµU\0µ\0uÕ\0}\0Ý\0==\0\0ý\0]½]\0½\0}Ý\0b\0Â\0\"\"\0\0â\0B¢B\0¢\0bÂ\n\0j\0Ê\0**\0\0ê\0JªJ\0ª\0\njÊ\0r\0Ò\x0022\0\0ò\0R²R\0²\0rÒ\0z\0Ú\0::\0\0ú\0ZºZ\0º\0zÚ\0f\0Æ\0&&\0\0æ\0F¦F\0¦\0fÆ\0n\0Î\0..\0\0î\0N®N\0®\0nÎ\0v\0Ö\x0066\0\0ö\0V¶V\0¶\0vÖ\0~\0Þ\0>>\0\0þ\0^¾^\0¾\0~Þ\0c\0Ã\0##\0\0ã\0C£C\0£\0cÃ\v\0k\0Ë\0++\0\0ë\0K«K\0«\0\vkË\0s\0Ó\x0033\0\0ó\0S³S\0³\0sÓ\x1B\0{\0Û\0;;\0\0û\0[»[\0»\0\x1B{Û\x07\0g\0Ç\0''\0\0ç\0G§G\0§\0\x07gÇ\0o\0Ï\0//\0\0ï\0O¯O\0¯\0oÏ\0w\0×\x0077\0\0÷\0W·W\0·\0w×\0\0ß\0??\0\0ÿ\0_¿_\0¿\0ß\0\0?\0\0\0cú?¿uV¼é?\nqÖ¼yÍ?çÎ ½/¦?:^V½¯s?ò½ù5?*¯\xA0½í~?3e»½ý~?Ö½¼9~?s·ð½UÏ}?¨¨¾ËY}?»ï¾%Ù|?\\0 ¾gM|?õi-¾¶{?ó:¾¾{?ÂÅG¾âgz?ÍæT¾	°y?þa¾<íx?M\fo¾x?|¾êFw?î¾wcv?>ú¾6uu?uj¾0|t?LÔ¾qxs?z7¾jr?·¤¾ôPq?¼èª¾O-p?A6±¾!ÿn?|·¾vÆm?´¹½¾^l?ïÃ¾ç5k?Þ\x1BÊ¾Þi?É?Ð¾|h?ZÖ¾Ôg?ókÜ¾te?ªsâ¾d?qqè¾b?\x07eî¾(ú`?'Nô¾æ[_?,ú¾×³]?\0\0\0¿\\?\x1Bä¿\xA0FZ?wÂ¿X?ö\b¿³V?wm\v¿1ÛT?Ú9¿ïùR?\0\0¿lQ?Ê¿¿½\x1BO?y¿øM?Í+¿4K?Ê×\x1B¿\nI?ñ|¿\nóF?$\x1B!¿ÑÒD?F²#¿÷©B?:B&¿x@?ãÊ(¿½>>?%L+¿ü;?ãÅ-¿\"²9?80¿_7?e¢2¿ó5?ó5¿e¢2?_7¿80?\"²9¿ãÅ-?ü;¿%L+?½>>¿ãÊ(?x@¿:B&?÷©B¿F²#?ÑÒD¿$\x1B!?\nóF¿ñ|?\nI¿Ê×\x1B?4K¿Í+?øM¿y?½\x1BO¿Ê¿?lQ¿\0\0?ïùR¿Ú9?1ÛT¿wm\v?³V¿ö\b?X¿wÂ?\xA0FZ¿\x1Bä?\\¿\0\0\0?×³]¿,ú>æ[_¿'Nô>(ú`¿\x07eî>b¿qqè>d¿ªsâ>te¿ókÜ>Ôg¿ZÖ>|h¿É?Ð>Þi¿Þ\x1BÊ>ç5k¿ïÃ>^l¿´¹½>vÆm¿|·>!ÿn¿A6±>O-p¿¼èª>ôPq¿·¤>jr¿z7>qxs¿LÔ>0|t¿uj>6uu¿>ú>wcv¿î>êFw¿|>x¿M\fo><íx¿þa>	°y¿ÍæT>âgz¿ÂÅG>¾{¿ó:>¶{¿õi->gM|¿\\0 >%Ù|¿»ï>ËY}¿¨¨>UÏ}¿s·ð=¼9~¿Ö=ý~¿3e»=í~¿*¯\xA0=ù5¿ò=¯s¿:^V=/¦¿çÎ =yÍ¿\nqÖ<é¿¿uV<cú¿21$\0\0¿¿uV¼cú¿\nqÖ¼é¿çÎ ½yÍ¿:^V½/¦¿ò½¯s¿*¯\xA0½ù5¿3e»½í~¿Ö½ý~¿s·ð½¼9~¿¨¨¾UÏ}¿»ï¾ËY}¿\\0 ¾%Ù|¿õi-¾gM|¿ó:¾¶{¿ÂÅG¾¾{¿ÍæT¾âgz¿þa¾	°y¿M\fo¾<íx¿|¾x¿î¾êFw¿>ú¾wcv¿uj¾6uu¿LÔ¾0|t¿z7¾qxs¿·¤¾jr¿¼èª¾ôPq¿A6±¾O-p¿|·¾!ÿn¿´¹½¾vÆm¿ïÃ¾^l¿Þ\x1BÊ¾ç5k¿É?Ð¾Þi¿ZÖ¾|h¿ókÜ¾Ôg¿ªsâ¾te¿qqè¾d¿\x07eî¾b¿'Nô¾(ú`¿,ú¾æ[_¿\0\0\0¿×³]¿\x1Bä¿\\¿wÂ¿\xA0FZ¿ö\b¿X¿wm\v¿³V¿Ú9¿1ÛT¿\0\0¿ïùR¿Ê¿¿lQ¿y¿½\x1BO¿Í+¿øM¿Ê×\x1B¿4K¿ñ|¿\nI¿$\x1B!¿\nóF¿F²#¿ÑÒD¿:B&¿÷©B¿ãÊ(¿x@¿%L+¿½>>¿ãÅ-¿ü;¿80¿\"²9¿e¢2¿_7¿ó5¿ó5¿_7¿e¢2¿\"²9¿80¿ü;¿ãÅ-¿½>>¿%L+¿x@¿ãÊ(¿÷©B¿:B&¿ÑÒD¿F²#¿\nóF¿$\x1B!¿\nI¿ñ|¿4K¿Ê×\x1B¿øM¿Í+¿½\x1BO¿y¿lQ¿Ê¿¿ïùR¿\0\0¿1ÛT¿Ú9¿³V¿wm\v¿X¿ö\b¿\xA0FZ¿wÂ¿\\¿\x1Bä¿×³]¿\0\0\0¿æ[_¿,ú¾(ú`¿'Nô¾b¿\x07eî¾d¿qqè¾te¿ªsâ¾Ôg¿ókÜ¾|h¿ZÖ¾Þi¿É?Ð¾ç5k¿Þ\x1BÊ¾^l¿ïÃ¾vÆm¿´¹½¾!ÿn¿|·¾O-p¿A6±¾ôPq¿¼èª¾jr¿·¤¾qxs¿z7¾0|t¿LÔ¾6uu¿uj¾wcv¿>ú¾êFw¿î¾x¿|¾<íx¿M\fo¾	°y¿þa¾âgz¿ÍæT¾¾{¿ÂÅG¾¶{¿ó:¾gM|¿õi-¾%Ù|¿\\0 ¾ËY}¿»ï¾UÏ}¿¨¨¾¼9~¿s·ð½ý~¿Ö½í~¿3e»½ù5¿*¯\xA0½¯s¿ò½/¦¿:^V½yÍ¿çÎ ½é¿\nqÖ¼cú¿¿uV¼\0\0¿21\r¥cú¿¿uV<é¿\nqÖ<yÍ¿çÎ =/¦¿:^V=¯s¿ò=ù5¿*¯\xA0=í~¿3e»=ý~¿Ö=¼9~¿s·ð=UÏ}¿¨¨>ËY}¿»ï>%Ù|¿\\0 >gM|¿õi->¶{¿ó:>¾{¿ÂÅG>âgz¿ÍæT>	°y¿þa><íx¿M\fo>x¿|>êFw¿î>wcv¿>ú>6uu¿uj>0|t¿LÔ>qxs¿z7>jr¿·¤>ôPq¿¼èª>O-p¿A6±>!ÿn¿|·>vÆm¿´¹½>^l¿ïÃ>ç5k¿Þ\x1BÊ>Þi¿É?Ð>|h¿ZÖ>Ôg¿ókÜ>te¿ªsâ>d¿qqè>b¿\x07eî>(ú`¿'Nô>æ[_¿,ú>×³]¿\0\0\0?\\¿\x1Bä?\xA0FZ¿wÂ?X¿ö\b?³V¿wm\v?1ÛT¿Ú9?ïùR¿\0\0?lQ¿Ê¿?½\x1BO¿y?øM¿Í+?4K¿Ê×\x1B?\nI¿ñ|?\nóF¿$\x1B!?ÑÒD¿F²#?÷©B¿:B&?x@¿ãÊ(?½>>¿%L+?ü;¿ãÅ-?\"²9¿80?_7¿e¢2?ó5¿ó5?e¢2¿_7?80¿\"²9?ãÅ-¿ü;?%L+¿½>>?ãÊ(¿x@?:B&¿÷©B?F²#¿ÑÒD?$\x1B!¿\nóF?ñ|¿\nI?Ê×\x1B¿4K?Í+¿øM?y¿½\x1BO?Ê¿¿lQ?\0\0¿ïùR?Ú9¿1ÛT?wm\v¿³V?ö\b¿X?wÂ¿\xA0FZ?\x1Bä¿\\?\0\0\0¿×³]?,ú¾æ[_?'Nô¾(ú`?\x07eî¾b?qqè¾d?ªsâ¾te?ókÜ¾Ôg?ZÖ¾|h?É?Ð¾Þi?Þ\x1BÊ¾ç5k?ïÃ¾^l?´¹½¾vÆm?|·¾!ÿn?A6±¾O-p?¼èª¾ôPq?·¤¾jr?z7¾qxs?LÔ¾0|t?uj¾6uu?>ú¾wcv?î¾êFw?|¾x?M\fo¾<íx?þa¾	°y?ÍæT¾âgz?ÂÅG¾¾{?ó:¾¶{?õi-¾gM|?\\0 ¾%Ù|?»ï¾ËY}?¨¨¾UÏ}?s·ð½¼9~?Ö½ý~?3e»½í~?*¯\xA0½ù5?ò½¯s?:^V½/¦?çÎ ½yÍ?\nqÖ¼é?¿uV¼cú?ÊÉS¥\0\0?¿uV<cú?\nqÖ<é?çÎ =yÍ?:^V=/¦?ò=¯s?*¯\xA0=ù5?3e»=í~?Ö=ý~?s·ð=¼9~?¨¨>UÏ}?»ï>ËY}?\\0 >%Ù|?õi->gM|?ó:>¶{?ÂÅG>¾{?ÍæT>âgz?þa>	°y?M\fo><íx?|>x?î>êFw?>ú>wcv?uj>6uu?LÔ>0|t?z7>qxs?·¤>jr?¼èª>ôPq?A6±>O-p?|·>!ÿn?´¹½>vÆm?ïÃ>^l?Þ\x1BÊ>ç5k?É?Ð>Þi?ZÖ>|h?ókÜ>Ôg?ªsâ>te?qqè>d?\x07eî>b?'Nô>(ú`?,ú>æ[_?\0\0\0?×³]?\x1Bä?\\?wÂ?\xA0FZ?ö\b?X?wm\v?³V?Ú9?1ÛT?\0\0?ïùR?Ê¿?lQ?y?½\x1BO?Í+?øM?Ê×\x1B?4K?ñ|?\nI?$\x1B!?\nóF?F²#?ÑÒD?:B&?÷©B?ãÊ(?x@?%L+?½>>?ãÅ-?ü;?80?\"²9?e¢2?_7?ó5?ó5?_7?e¢2?\"²9?80?ü;?ãÅ-?½>>?%L+?x@?ãÊ(?÷©B?:B&?ÑÒD?F²#?\nóF?$\x1B!?\nI?ñ|?4K?Ê×\x1B?øM?Í+?½\x1BO?y?lQ?Ê¿?ïùR?\0\0?1ÛT?Ú9?³V?wm\v?X?ö\b?\xA0FZ?wÂ?\\?\x1Bä?×³]?\0\0\0?æ[_?,ú>(ú`?'Nô>b?\x07eî>d?qqè>te?ªsâ>Ôg?ókÜ>|h?ZÖ>Þi?É?Ð>ç5k?Þ\x1BÊ>^l?ïÃ>vÆm?´¹½>!ÿn?|·>O-p?A6±>ôPq?¼èª>jr?·¤>qxs?z7>0|t?LÔ>6uu?uj>wcv?>ú>êFw?î>x?|><íx?M\fo>	°y?þa>âgz?ÍæT>¾{?ÂÅG>¶{?ó:>gM|?õi->%Ù|?\\0 >ËY}?»ï>UÏ}?¨¨>¼9~?s·ð=ý~?Ö=í~?3e»=ù5?*¯\xA0=¯s?ò=/¦?:^V=yÍ?çÎ =é?\nqÖ<cú?¿uV<\0\x000\0`\0\0À\0\0@\0p\0\xA0\0Ð\0 \0P\0\0°\0à\0\x004\0d\0\0Ä\0\0D\0t\0¤\0Ô\0$\0T\0\0´\0ä\0\b\x008\0h\0\0È\0\0H\0x\0¨\0Ø\0(\0X\0\0¸\0è\0\f\0<\0l\0\0Ì\0\0L\0|\0¬\0Ü\0,\0\\\0\0¼\0ì\0\x001\0a\0\0Á\0\0A\0q\0¡\0Ñ\0!\0Q\0\0±\0á\0\x005\0e\0\0Å\0\0E\0u\0¥\0Õ\0%\0U\0\0µ\0å\0	\x009\0i\0\0É\0\0I\0y\0©\0Ù\0)\0Y\0\0¹\0é\0\r\0=\0m\0\0Í\0\0M\0}\0­\0Ý\0-\0]\0\0½\0í\0\x002\0b\0\0Â\0\0B\0r\0¢\0Ò\0\"\0R\0\0²\0â\0\x006\0f\0\0Æ\0\0F\0v\0¦\0Ö\0&\0V\0\0¶\0æ\0\n\0:\0j\0\0Ê\0\0J\0z\0ª\0Ú\0*\0Z\0\0º\0ê\0\0>\0n\0\0Î\0\0N\0~\0®\0Þ\0.\0^\0\0¾\0î\0\x003\0c\0\0Ã\0\0C\0s\0£\0Ó\0#\0S\0\0³\0ã\0\x07\x007\0g\0\0Ç\0\0G\0w\0§\0×\0'\0W\0\0·\0ç\0\v\0;\0k\0\0Ë\0\x1B\0K\0{\0«\0Û\0+\0[\0\0»\0ë\0\0?\0o\0\0Ï\0\0O\0\0¯\0ß\0/\0_\0\0¿\0ï\0ð\0\0\0;\0\0\0\x000\0\0\0\0\0\0\0A\v\0\0|\0A²\v\x000\0H\0`\0\b\0 \x008\0P\0h\0\0(\0@\0X\0p\0\0\x004\0L\0d\0\f\0$\0<\0T\0l\0\0,\0D\0\\\0t\0\0\x001\0I\0a\0	\0!\x009\0Q\0i\0\0)\0A\0Y\0q\0\0\x005\0M\0e\0\r\0%\0=\0U\0m\0\0-\0E\0]\0u\0\0\x002\0J\0b\0\n\0\"\0:\0R\0j\0\0*\0B\0Z\0r\0\0\x006\0N\0f\0\0&\0>\0V\0n\0\0.\0F\0^\0v\0\0\x1B\x003\0K\0c\0\v\0#\0;\0S\0k\0\0+\0C\0[\0s\0\x07\0\x007\0O\0g\0\0'\0?\0W\0o\0\0/\0G\0_\0w\0x\0\0\0\b<\0\0\0\0\0\0\b\0\0\0\0\0AÌ\v°\0\0|\0Aâ\v\f\0\0$\x000\0\0\0\0(\x004\0\b\0\0 \0,\x008\0\0\r\0\0%\x001\0\0\0\0)\x005\0	\0\0!\0-\x009\0\0\0\0&\x002\0\0\0\0*\x006\0\n\0\0\"\0.\0:\0\0\0\x1B\0'\x003\0\x07\0\0\0+\x007\0\v\0\0#\0/\0;\0<\0\0\0<\0\0\0\0\f\0\0\0\0\0A\và\0\0|\0\0\0\0\0\0\0\x007\0\0ÿ¥\0\0µ\0\0gÅ\0\0E×\0\0Áê\0\0ÿÿ\0\0\0\0Î@\0\0È@\0\0¸@\0\0ª@\0\0¢@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0@\0\0p@\0\0p@\0\0p@\0\0p@\0\0p@\0A\xA0\xA0\vòHABA@>@@\\N\\O\\NZOt)s(r(¡\f°\n±\v³0665877=rF`JXKXWJYB[Cd;l2x(z%a+N2SNTQXKVJWGZI]J]Jm(r$u\"u\"¢\f¥\n²\x07½¾\b±	²6s?fBbEcJYG[I[NYVP\\B]@f;g<h<u4{,#a&M-=Z]<i*k)n-t&q&p&|\x1Bª\r±\n»\bÀ¯	\n²;nGVKUTS[BXIWH\\KbHi:k6s4r7p83(!b#M**y`Bl+o(u,{ x$w!!\"¦­¸\r¸\n\r²?rJRTS\\Rg>`H`CeIkHq7v4}4v4u71' a!M(\0\0f?\0\0L?\0\0&?\0\0\0?\0k?\0.?\0p½>\0ÐL>\0A¡£\v\b\r\x1B  !\"\"#$$%%\0AÁ£\v@\0\0À\0\0|\0\x004\0\0è\0\0\0\0D¢\0\0¬£\0\0h¤\0\0Ü¤\0\0(¥\0\0`¥\0\0¥\0\0¥\0\0¤¥\0\0\0\0\0\0\0AÄ©\vÁ#\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\x07\0\0\0	\0\0\0\v\0\0\0\r\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\x1B\0\0\0\0\0\0\0\0\0!\0\0\0#\0\0\0%\0\0\0'\0\0\0)\0\0\0+\0\0\0-\0\0\0/\0\0\x001\0\0\x003\0\0\x005\0\0\x007\0\0\x009\0\0\0;\0\0\0=\0\0\0?\0\0\0A\0\0\0C\0\0\0E\0\0\0G\0\0\0I\0\0\0K\0\0\0M\0\0\0O\0\0\0Q\0\0\0S\0\0\0U\0\0\0W\0\0\0Y\0\0\0[\0\0\0]\0\0\0_\0\0\0a\0\0\0c\0\0\0e\0\0\0g\0\0\0i\0\0\0k\0\0\0m\0\0\0o\0\0\0q\0\0\0s\0\0\0u\0\0\0w\0\0\0y\0\0\0{\0\0\0}\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0¡\0\0\0£\0\0\0¥\0\0\0§\0\0\0©\0\0\0«\0\0\0­\0\0\0¯\0\0\0±\0\0\0³\0\0\0µ\0\0\0·\0\0\0¹\0\0\0»\0\0\0½\0\0\0¿\0\0\0Á\0\0\0Ã\0\0\0Å\0\0\0Ç\0\0\0É\0\0\0Ë\0\0\0Í\0\0\0Ï\0\0\0Ñ\0\0\0Ó\0\0\0Õ\0\0\0×\0\0\0Ù\0\0\0Û\0\0\0Ý\0\0\0ß\0\0\0á\0\0\0ã\0\0\0å\0\0\0ç\0\0\0é\0\0\0ë\0\0\0í\0\0\0ï\0\0\0ñ\0\0\0ó\0\0\0õ\0\0\0÷\0\0\0ù\0\0\0û\0\0\0ý\0\0\0ÿ\0\0\0\0\0\0\0\0\0\x07\0\0	\0\0\v\0\0\r\0\0\0\0\0\0\0\0\0\0\0\0\0\0\x1B\0\0\0\0\0\0!\0\0#\0\0%\0\0'\0\0)\0\0+\0\0-\0\0/\0\x001\0\x003\0\x005\0\x007\0\x009\0\0;\0\0=\0\0?\0\0A\0\0C\0\0E\0\0G\0\0I\0\0K\0\0M\0\0O\0\0Q\0\0S\0\0U\0\0W\0\0Y\0\0[\0\0]\0\0_\0\0\r\0\0\0\0\0\0)\0\0\0=\0\0\0U\0\0\0q\0\0\0\0\0\0µ\0\0\0Ý\0\0\0	\0\x009\0\0m\0\0¥\0\0á\0\0!\0\0e\0\0­\0\0ù\0\0I\0\0\0\0õ\0\0Q\0\0±\0\0\0\0}\0\0é\0\0Y\0\0Í\0\0E\x07\0\0Á\x07\0\0A\b\0\0Å\b\0\0M	\0\0Ù	\0\0i\n\0\0ý\n\0\0\v\0\x001\f\0\0Ñ\f\0\0u\r\0\0\0\0É\0\0y\0\0-\0\0å\0\0¡\0\0a\0\0%\0\0í\0\0¹\0\0\0\0]\0\x005\0\0\0\0ñ\0\0Õ\0\0½\0\0©\x1B\0\0\0\0\0\0\0\0\0\0 \0\0!\0\0\"\0\0#\0\0©$\0\0½%\0\0Õ&\0\0ñ'\0\0)\0\x005*\0\0]+\0\0,\0\0¹-\0\0í.\0\0%0\0\0a1\0\0¡2\0\0å3\0\0-5\0\0y6\0\0É7\0\09\0\0u:\0\0Ñ;\0\x001=\0\0>\0\0ý?\0\0iA\0\0ÙB\0\0MD\0\0ÅE\0\0AG\0\0ÁH\0\0EJ\0\0ÍK\0\0YM\0\0éN\0\0}P\0\0R\0\0±S\0\0QU\0\0õV\0\0X\0\0IZ\0\0ù[\0\0­]\0\0e_\0\0!a\0\0áb\0\0¥d\0\0mf\0\x009h\0\0	j\0\0Ýk\0\0µm\0\0o\0\0qq\0\0Us\0\0=u\0\0)w\0\0y\0\0\r{\0\0}\0\0\0\0\0\0\0\0\r\0\0\0\0)\0\0=\0\0U\0\0q\0\0\0\0µ\0\0Ý\0\0	\0\x009\0\0m\0\0¥\0\0á\xA0\0\0!£\0\0e¥\0\0­§\0\0ù©\0\0I¬\0\0®\0\0õ°\0\0Q³\0\0±µ\0\0¸\0\0}º\0\0é¼\0\0Y¿\0\0ÍÁ\0\0EÄ\0\0ÁÆ\0\0AÉ\0\0ÅË\0\0MÎ\0\0ÙÐ\0\0iÓ\0\0ýÕ\0\0Ø\0\x001Û\0\0ÑÝ\0\0uà\0\0ã\0\0Éå\0\0yè\0\0-ë\0\0åí\0\0¡ð\0\0?\0\0\0\0\0\0ç\0\0\0y\0\0?\0\0A\0\0\0\0\0\0ÿ\x07\0\0A\n\0\0ç\f\0\0ù\0\0\0\0\0\0\x07\0\0!\0\0¿&\0\0-\0\0ç3\0\0y;\0\0¿C\0\0ÁL\0\0V\0\0a\0\0l\0\0Áx\0\0ç\0\0ù\0\0ÿ¢\0\0³\0\0\x07Ä\0\0Ö\0\0?é\0\0ý\0\0ç\0y)\0?A\0AZ\0t\0\0ÿ¬\0AË\0çê\0ù\v\0.\0R\0\x07x\0\0¿Ç\0ò\0ç\0yK\0¿z\0Á«\0Þ\0\0I\0Á\0ç»\0ù÷\0ÿ5\0v\0\x07¸\0ü\0?B\0\0çÔ\0y!\x07\0?p\x07\0AÁ\x07\0\b\0j\b\0ÿÁ\b\0A	\0çx	\0ù×	\09\n\0\n\0\x07\v\0m\v\0¿Ø\v\0G\f\0ç·\f\0y+\r\0¿¡\r\0Á\0\0\0\0Á\0ç¡\0ù+\0ÿ¸\0I\0\x07Ü\0r\0?\v\0§\0çF\0yé\0?\0A8\0ä\0\0ÿF\0Aý\0ç¶\0ùs\x1B\04\0ø\0\x07À\0\0¿Y\0, \0ç!\0yÛ!\0¿¸\"\0Á#\0~$\0g%\0S&\0ÁC'\0ç7(\0ù/)\0ÿ+*\0,+\0\x070,\08-\0?D.\0T/\0çh0\0y1\0?2\0A¿3\0ä4\06\0ÿ;7\0An8\0ç¤9\0ùß:\0<\0c=\0\x07¬>\0ù?\0¿JA\0¡B\0çûC\0y[E\0¿¿F\0Á(H\0I\0	K\0L\0ÁüM\0ç}O\0ùQ\0ÿR\0T\0\x07´U\0NW\0?íX\0Z\0ç:\\\0yé]\0?_\0AVa\0c\0Ød\0ÿ\xA0f\0Aoh\0çBj\0ù\x1Bl\0úm\0A\0\0©\0\0	\0\0Á\b\0\0A\0\0	\0\0© \0\0Á.\0\0A\0\0)X\0\0	u\0\0\0\0Ã\0\0	÷\0\0)4\0|\0ÁÏ\0©0\0	\xA0\0A\0Á¯\0	S\0©\n\0AØ\0½\0)¼\x07\0	Ö\b\0\r\n\0c\v\0	Ú\f\0)t\03\0A\0©*\0	g\0ÁÑ\0Am\x1B\0	<\0©@!\0Á}$\0ö'\0)¬+\0	£/\0Ý3\0^8\0	)=\0)@B\0§G\0Á`M\0©pS\0	ÚY\0A\xA0`\0ÁÆg\0	Qo\0©Bw\0A\0j\0)¨\0	\\\0¥\06°\0	d»\0)Ç\0VÓ\0A#à\0©í\0	yû\0Á\n\nA<	)©9Á¼J\\)0o	i«	\vÁ)|×ÂîÁá©à	Ä9ATÁMp	ÿ©ªªAVÉ\x07é)Ä		+wNyr	)ì½iåA©\n8	;cÁ³A{½	ì©ÁëN0)ä¶	í·$ä]	)èÔÍ\x07ÁRR\x07©\x07	^Ö\x07Aò\bÁDa\b	]©\b©Bó\bAý>		)Ü		x-\nÔ\n,Ö\n	-\v)ð\vlâ\vA@\f©Â\f	­\rÁÌe\rA*Ì\r	Î4©ÀÁ\n\rµ|)Èî	McLÚÏS	ßÏ)NÈÏÁ³S©PÚ	¨cAÃïÁ«~	k©\n¥A<×)t	¡¸O_	\"	\x1B)$¶\x1B_fAÞ©ªÐ	ÏÁUHAI	 	´Í ©\xA0!Áa\"*0#)Ü$	;Ù$Q³%\0\0E\0\0\0\03\0\0[W\0\0\r\0\0wÝ\0\x009M\0cæ\0³\0Á\0!\0«×\0Ý	\0\x07³\v\0Éþ\x003ÿ\0åÏ\0/\x001^$\0û`,\0­¾5\0¡@\0Y7M\0±[\x005Cl\0?&\0A\0KÓ¬\0}!È\0'Éæ\0é	Ó[/íYO&Qe½÷M6·I|y½È£_Õ®w_/ÛakGëò¼\\<GCÆ	K[sü%g©\x07oác\bqH,	;`\níóé\n×Õà\vßè\fCòuö/ÜpÆ62½²´g!O)AÐÅ<¹\x1BÀ¾\x07âÛU$\"ø$÷E\v'¹²)ãh~,p/-2¡)Ë5+79]%Ð<c@I\x07D³É²Hen\fM¯ÃQ±¢_V{ï\\[-`\bfÙ÷ºkÃ­qµãw¿\"]~#\0\0qM\0\0\0\0ý&\0e\f\0éw\0¢\x005Ö\b\0-p\r\0áä\0!Ã\0í·(\0u8\0YHM\0)úg\0%ø\0=Ç´\0Q&ê\0±,ÝÒ|òÞÉRU¹+ãM\bTÁq?A.SÍ\x07		9w¸\nIW¨\fÊà]j1'MÑ²½&H\x1B¥Àu©($Ùm)õ¹R/mÈæ5¡¦9=aA\\E­`NµîYX\\ci~oåÕ|ÿ½\0\0¨\0k\0ñ\0?#\f\0Á=\0¶#\0ñü9\0ÿQ[\0ú\0uÑ\0q¿2?¸ÁÜmÏ_qÿ{=¶S\bü\nñaX?§Á%Åe4ñ&ÿû§/:;b\"IqÀY?mÁXã\0!	\0,\0Aî%\0AOG\0C\0÷Ý\0FsZ¸5¼A§\bAÎ\f²v%L\x074WG¬`A¦#Q\0Å2\0¹k\0öØ\0k\xA0\rÄþP!Ù	3l0Õ¢¤§g\b')ý}<{µç[w¯\xA0-É­{\0æ9^=Øµcw	á(Æ!4 uH8}WW`¿[¯Ø'÷^\réþ­\x1Bë6·åhÁÁ\fÿ9j\"îKx+3á	T\0\0\0\n\0\0\0\0\0\0\0\0\0\0\0\0\f03<?ÀÃÌÏðóüÿ\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\x07\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\b\0\0\0\x07\0\0\0\f\0\0\0\0\0\0\v\0\0\0\0\0\0\0\0\0\0\0\0	\0\0\0\0\0\0\r\0\0\0\0\0\0\n\0\0\0\0AÍ\v`@ÊE\x1BLÿRZ³b¢k`u\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0~|wmW)	\0AÎ\v@\0\0l\"\0\0B\0\0\0\0M\0\0Û\0A\xA0Î\ví\0\0\0\0\0\0I\0\0\0\0\0\0\f\0\0\0\x07\0AÁÎ\v@\0\0]\0\0½p\0\0íy\0\0²}\0\0$\0AàÎ\vå0u\0\0p\0\0 Ñÿÿ Ñÿÿ\0'4=DJOTX\\_cfiloruwz|~\xA0¢£¥§¨ª«­®°±³´¶·¹º»½¾ÀÁÂÄÅÇÈÉËÌÍÏÐÑÓÔÕ×ØÙÛÜÝßàáãäæçèêëìîïñòóõöøùúüýÿ\0\0\0\0\0\0\0+4;AFJNQUWZ]_bdfikmoqstvxz{}\xA0¢£¤¥¦§¨©«¬­®¯°±²³´µ¶·¸¹º»¼¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËËÌÍÎÏÐÑÒÓÔÕÖÖ×ØÙÚÛÜÝÞßààáâãäåæçèéêëììíîïðñòóôõö÷øùúûüýþÿ\0\0\0\0\0\0\0\0\b)18>BFJMPSVX[]_acegiklnpqstvwyz{}~\xA0¡¢£¤¥¦§¨©ª««¬­®¯°±±²³´µµ¶·¸¹¹º»¼½½¾¿ÀÀÁÂÃÃÄÅÆÆÇÈÈÉÊËËÌÍÎÎÏÐÑÑÒÓÓÔÕÖÖ×ØØÙÚÛÛÜÝÝÞßààáââãäååæçèèéêêëìííîïððñòóóôõöö÷øùùúûüýÿ\0\0AÒÒ\vR?\0\0\0@\0\0@@\0\0@\0\0\xA0@\0\0À@\0\0à@\0\0\0A\0\0A\0\0ÀA\0\0B\0\x000B\0\0HB\0\0`B\0\0xB\0\0B\0\0B\0\0B\0\0°B\0\0ÔB\0\0C\0A²Ó\vÄ?\0\0?\0\0?\0\0?\0\0?\0\0?\0\0?\0\0\0@\0\0\0@\0\0\0@\0\0\0@\0\0\0@\0\0\0@\0\0\0@\0\0@@\0\0@@\0\0@\0\0\xA0@\0\0À@\0\0\0A\0\0\0A~|wmW)	\0\0ÿÿnVF;3-(%!\r\r\f\f\f\f\v\v\v\n\n\n						\b\b\b\b\b\x07\x07\x07\x07\x07\x07(#\0\0¼\0\0(#\0\0¼\0\0¼4\0\0è\0\0°6\0\0Ð\x07\0\0(#\0\0¼\0\0(#\0\0¼\0\0ø*\0\0è\0\0à.\0\0Ð\x07\0\0à.\0\0è\0\0°6\0\0è\0\0>\0\0è\0\0 N\0\0è\0\0ðU\0\0è\0AÖ\v	à.\0\0'\0\0'\0\0ø*\0\0ø*\0\0>\0\0¼4\0\0¼4\0\0:\0\0:\0\0 N\0\0>\0\0>\0\0PF\0\0PF\0\0À]\0\0PF\0\0PF\0\0\bR\0\0\bR\0\0\0}\0\0ðU\0\0ðU\0\0`m\0\0`m\0\0\0ú\0\0p\0\0p\0\0PÃ\0\0PÃ\0\0\r\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0æZ48wN39ÓÙÉ93:Ì`:aûÉ:~	;Ë3;Õ%c;w.;¨©;E¸É;¦ì;è.	<®f<÷3<ÿI<OXb<^|<.<½Ç<\\¬¨<ó<¸<yÈ<î_Ù<9ðê<c*ý<5\x07\b=Ì=Íä\x1B=aP&=Ë1=\0<=þG=Æ4S=?8_=ik=E.x=i={0=à÷=å={ù=±3¥=!¬=P´=3Â»=OÃ=Ë=Ó=ÖÛ=×3ä=¯´ì=!Xõ=¨þ=¡>ò\b>Ç\f>Ý@>4ö>E»>>Tt$>Ëg)>3j.>{3>R8>ÅÉ=>C>YPH>z¨M>·\rS>RX>\b\0^>Tc>ò$i>%Ên>${t>¬7z>\0\0>«é>ùØ>Í>PÇ>7Æ>÷É>³Ò>&à>ò>l\b>#¡>ÿA¤>Ðd§>±ª>¶­>Tä°>Ó´>ºJ·>èº>ù½½>\rüÀ>â<Ä>VÇ>GÆÊ>Î>ûXÑ>z¥Ô>ñó×>DÛ>ÙÞ>\béá>§=å>Sè>\fêë>¯Aï>ò>óõ>Lù>\"¦ü>\0\0\0?ï¬?¼Y?y?ò²?)_\b?ú\n\n?V¶\v?,a\r?|\v?µ?ò]?\b?C­?S?¶ø?Ü?Õ??á?ù?!!?¾\"?£Z$?õ%?Ö'?ò$)?(º*?M,?ß-?rn/?Êû0?ù2?í4?§5?\x1B7?å8?X:?=;?=?*>?\0\0@?rA?7áB?wMD?Ã¶E?ëG?þH?ìßI?<K?áL?êëM?y>O?P?+ÙQ?!S?seT?\r¦U?ëâV?ü\x1BX?/QY?sZ?É¯[?Ù\\?Cþ]?X_?K<`?üTa?jib?yc?<d?\xA0e?~f?Ög?ºh?ö|i?mj?Yk?Ñ@l?O#m?n?ñÙn?ó­o?}p?IGq?|\fr?´Ìr?ðs?>t?ït?úu?³Av??ãv?w?­x?~¨x?5y?4¼y?>z?ºz?Â1{?w£{?»|?v|?Ø|?ô3}?e}?DÛ}?³&~?l~?ë¬~?£ç~?Ú?L?v??Ð¹?Ó?Åæ?Ëô?/ý?\0\0?\0\0\0\b\0\0\0\f\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0 \0\0\0(\0\0\x000\0\0\x008\0\0\0@\0\0\0P\0\0\0`\0\0\0p\0\0\0\0\0\0\xA0\0\0\0À\0\0\0ð\0A²ß\vË\n>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>\0\0>Ð%´>9­>	¥>úí>Í¬e>ø©*>40Ò=Zñ\r=Zñ\r½40Ò½ø©*¾Í¬e¾úí¾	¥¾9­¾Ð%´¾±>\x1B>`#I>ÄB=ÄB½`#I¾\x1B¾±¾±¾\x1B¾`#I¾ÄB½ÄB=`#I>\x1B>±>9­>Í¬e>Zñ\r=ø©*¾	¥¾Ð%´¾úí¾40Ò½40Ò=úí>Ð%´>	¥>ø©*>Zñ\r½Í¬e¾9­¾}=§>Ò\n>Ò\n¾}=§¾}=§¾Ò\n¾Ò\n>}=§>}=§>Ò\n>Ò\n¾}=§¾}=§¾Ò\n¾Ò\n>}=§>	¥>Zñ\r=úí¾9­¾40Ò½Í¬e>Ð%´>ø©*>ø©*¾Ð%´¾Í¬e¾40Ò=9­>úí>Zñ\r½	¥¾\x1B>ÄB½±¾`#I¾`#I>±>ÄB=\x1B¾\x1B¾ÄB=±>`#I>`#I¾±¾ÄB½\x1B>úí>ø©*¾9­¾Zñ\r=Ð%´>40Ò=	¥¾Í¬e¾Í¬e>	¥>40Ò½Ð%´¾Zñ\r½9­>ø©*>úí¾3ð\rûúðù\vújòã\x07îïï÷çýÞ0\vóáìâ÷ôÿ\b		\bóïÞûõ\0ü\n\nøÿ\0\rýðû\x07äó$ýÄïä\x07õâùÖëýê!÷\x07âòõìîûô\fÏÎÏ	Ûÿ	\"óáá\f,Ö÷\bîú	$\v\r\fëäô!ò\v¢Ùôõñù14\nÕ	9\búñ,ø\x07âóþ÷þõÌå\x1B\nö\x07+è)\nîå\n	\nïöú7#°$èÜ	íX@ÍÝ\0ù)ð\x1Bÿð/ÙÊø\rçìfîû,\väGÍû­÷ã\bË:Ûù\r&	\"ÿ×èÜßë Kþ¼ÿ/ã \f¿©ô(\x07æïþÛâ÷ Ù\0áåêú³#Ã Ûè\rõÿØýù\r\v;í\nî\0\rúé\vï\rÿ°(ËEãÊ\0ü!çþ&#$ñ.óðøø\fè÷Éû÷ \v\x07\fîöªÚ6%çÕ\x07ååÊ\r	F#ùñÔú\x07¾« (í÷ù\fñ\x07Ý\v\0\f#îýÿ\x07øòýýíùÿçåæþ!êåç÷\x07â\n÷ì\v\x1B\nîüïûù÷óöðö#$ùêÔÿõ øùöììÞ\füúó\nû¼ÿ	èÀ\x1BæKÓ)'Ö\bâç\"\bÚýáü÷	&à\0Ó\0úó\vçàêèõõüüÞ	ç\x1Bûãúî6Òòá$×è\n\v\x07$àóÌïÛÜÿ	Ú#0ÿ-\n'Ú\r\bð\b\v\x07ãõ\x07âÚÓîä÷A=ËÚð$.Ù ÃúúÜßîä8e-\väéãÃÑ0\x1Bï(Í##5Ãã\fúë\nìçú\výöÌ~zl\f0ÜY£®}A®&¶QX¨O3ÑæS¨#bÐÓ.SÄ±-ì×	46]ö\r{^»òá\n\f5±õëþÔ¸\\AÇ8ÚÈVuµíÐrvuïúyR6ßdÙé²Þãÿâæ~\x1Bé±HB\x07¾È°±\0\0Ð±\0\0\0\0\0 \0Aê\v¦ Ö\0i<<\r>\"O7v_üW\fò\bÿø%\r$\r%!\bðõûáýû\0:ùÿðó\nþò\vüõ\0\0\0\0\0\0\0\0ÿù\x07åáïó!,ø\v!Nþè1$òõÐßÖÚô7Û6ø$\x003;\x07ô5 ò0öðøðÈèúþ.úö#ÔñÏ$ù±½\fFý±Ê«è/ê!Eÿ\vððêäõ\v×æßíü\x1B ÎöÚêø#á×ñõ,ï×ééæóóïáç	í'øÿÓõä¤Òñvê-Í\vììñ\rëãàéÖ^ø?ýÒæ Ø¶æüóìâçòáÓÕÄÐôÞ\r\v.÷ÉðÇ&ÎþÔõø4åÚù/Å\0/.Á#ï!DíððÝ/ÙÄéÌót/ç(ê\fåîö\x1Bø¾\fæäó\ræÍ%ë/\r×åøü´ß\n	Ò¶6ÉD&èàD\vÿcþ¶(æ!ÿ¼ú	<=\x07ù\0è\x07Mÿù\rñíáèð%\r\nâ\v\vö<-ýØÂû	àåÊû%Õõ%í/Àå¾;.ýô©÷ÜN9æÚ³öµõ!Ò\rëßìúýõüå&\b×þßæãêüòÉõ°ý\v\"Z3\v+$àg	\x1B\r@8Fòô\n%\fêö.\nè	\x07\"ûùòÈ\vîøïùöØ\nßàÕ	\vü\n2ôû.	\x07\v[ï\x07Îâ\0ï\böçâ»ÂréeûÊúê\x07È'ã\0.\b±ëà>ôøôÆàè	üí-òåü×Ü\f2\x1BÔ»÷íÐø\fú\ríâÜ%ÿýâÖòöìÊåÔIæZ »ãðgï%éá!ÛÀ\r¯äà\x1BÝéêù	é\x1Bó+ãú	Øßßà	\vÐøéÌ.êÖ#ñ×\"Öíõ7\x07ÙYõßò ïú\"7ë¦ø\x1B\rãßÍ÷õðîüü0\x07òôð#\b\0ùþ	\bú5àëÎcÄûË\ná\fû\x07P$á	b$ÁÝóäèóÿîÞ\n\x07\vù$-ð#úõè\rÿ\x1B'0õüó\váîãþìðôäý]ðãÊÛýýÑýÜÉý)ö/þ*ù¹åSÀ\x07è\bï\fâÚóßÈïâûúáòÛ\0\nâ%ïÜàóÃÌ»,âüçQøéÅ4wà-ÀÇòIóó	¼ùÌÙ,ñ\x1B÷äõÞþúé\rêóöî,óèø+·úù°ùùä»ÚûÝ±îå¾Û\bêÙ0ó÷\vãÏ ò/îü,Ì¶+ò\0åù\nü\nð\vîþûõ\0ìü&J;'@öýØ¼âÍ\bíåÒ346$Z\\\rû\0Â\vÑÛúû6Ç *ú>÷	öü!2\rñÝÐõï½ó&Ô$ðöà\bÈñà(+.ù\xA05æÐ®=&«äÞÿ?ûû''Ú ôä(ø\fÝóç\bó÷ìó%ö!ðèúúíû\n\vüÙÿ1)ñÇÂM»ó\0¶ùÚø?ÌR?\r-ß,Ì¿ëÒÏ@ï DÙðûæÃä\vôß	ÛýäÛô\0îþ\b÷þ+ïþ¾á8Ø©ÜþüÖÓÿÕñ\x1B?õ öß\x1BíæÞüÙ¿ìëïÜ\r;/Úß\rÛøÛùú´áôÒ\x07ëâò	ôó/åçÿÙ\0÷\x07\x07'2ùìFä×\nðûäþÛ î>õìÎ$ÂôÈ420,×çý\0!ú\x1B\"ç	õ$þ\fÌ-þö.îCäó%*÷\vK\x07ÀØö9é5³ïû/ÉÝÜó4Ë¹4éæäÕ7í+í6ôßÔÙíöáö&Çìç\bú2\fçâú	%üê$\x07Þ°$öþûÜ1ºÜÒÍ$ÆÐØö7G/\nÿÒ¼\r\0¶ãIÌîõ\x07Ô®àºäÿÙ¼ú×\fêð(õç3÷Þ\x07²ÚâþÔ \0@¸þòöðøç\ffÆ%öé1\x07ùìà-ú0!ÿúAïJ%æöè¾öáÿî÷\v%ü-)Æ)Í\b+öÿ- Àßçýå¼\fõóÛØëô éíL)éèÔ¿ÿñG?ýéàþ\x1B.ûÙûÝîØö\fþê(ú<$å\nÊ'#èÛ¥üëåÙú\f&ð¡ãRþ#\f\bê\nPÑç·±âà¾0ÓõÑåïùÔòÔæàéùäúæ\ròéò.ßëïÖ,ÛÙTÒ\n\rÔHæ äô­\nâÔöä5-A\0ç9$ß,Ë\vþå# 1&$\n3Ùù%Ý\vÑîÝ*ë×ô\vÓ\x07Õñû&ØÎâë	\r\fKÈùýüÿÞ\fÏ\vîäï!\rò(¸Û\núúôâò\n(é\fýñ\rÈüâýï\x1B2û@Üí\x07	ðÆ»ØÃ¹ò*]\vúÆõFÌ	âß\vÛÑëêØ\n/é0)Ð\n\"éþÑàóöææü&ò\0ôùù,ÿàåðúîã\x07ùõìÓÜT\"Åâ~\bDOï¼%?1¦U+\x07	ÓÇÕ9\véõã<æ\0\x07*è\nç\bùØï#\x1BÙ¥\x1BÜ\"è\x07ë\nêâ	ïÃæ!:ÍòEÚ\x07Pü¿úå5ô/ÿñ<f±ü\f	%øü%ýñðõûúÕçî\nå\0äåõ\nîþüðú\x07ú5þã	âúüú8F\0ßìï÷è.û/ÒÍË¯ÿùKûë¿\fÌÎô16L¯\n-×ÅíáËû\fTé\x07\nà'þô÷\0öõ	øþÿ\nûØùùüå# á+÷à(ÂÌ$&$\xA0öéÏßîý\0)íÙéú/8J\0ÑòÜê\r\fû\róñÞæ\f \x1B\r½\x1B\b\nïï9ÀîÔÒðçè'\b7çÞ'ð	GHáÉ\nç «ëø\fåùëþû0ðêæá\x1BúñëòÜC\f)ç1Ô#Qn/\"¾òÄ\"·\n)#Y\x07Ý\x07\x1Bìú8B!É5ëD7;\0÷×ûô*é\nQåËâÂ(_üøñã®ÇýÃãã1É»ÏÍç\fY,ß)ÛÛäÐ×âÇÝÙÿóÈû21)üü!êÿ!\"(Ö\fúþ',\vAÄÓ\n[	Âõ\bE%âåäBø¹\",:²í9Ä\fýÿØ\vû\fHO\x07Î\rõìM¢9Í$5ÿá( õÞÜÅ:Êé(.\0\f6\xA0ÅwÚ27\fðC\0\"#'#ÿE\x1BâÝüºÔùú÷<,ëö%+ðýñ¿ÉL@îù¼ö&\x1BÄ$!\"ÙÛ\f5ÊæÏóûêõ«7øÍõßöá´×,ØÊéñ\x1B:Ä\bß0÷õ5äã½$\f\x077ëXÿëï) öòûÇC9þå·èxÝ*ùÓçLÞ2\vÊ¥ìû/Ñ\x1Býæù\n\x07JØ@ùûèÏèýö\x1Bïøýå!\r'ùÚ,7ý	óÇ++\0£ïÈôç%«ó!ï8G°üõî/Ì	0ý\nðüÃîÎö\fG\vý\0ùØ&Þ&\bÞ{àæ+Þÿ÷%ðïÂD\vµ!°>÷µL$×øØõ¹(Ù>Ï¯÷Ì4=åöøÊÇðÌ$\nû\bãíÛ\bËÛ&ï0\n\0Q.Fãe\v,Ôý\v÷\vÓ\r.ýÇD,?bäé ö5úþ÷úõõä;9ê&*S\x1Bâ\fëó&ë:ööñþû\v\f·äÚçIÌôÉ Á3!4æ7ææ9àüÌÃß¥ÍE¦ËÚÔ\f´ìMÓùV+ßØö\0¸-ÍµÏÚÿÂÿÔòö½(öÞ.Ààó!àûåç]DØ9ýëÆÙïê§\vÒ\x1B.=WÜ/é/ènzd\0`ô2,óI7õñ1*úÝ:&*Hë\v	Û\x07ï\rÎé3ðûèL\nËäù¿J(ðã ðÏÝý;\xA0ÎÕÕÃñøÜÞßò\výÙõÏëÈ+Á(öæòñÝÝõ Ô½\x07÷âÍäê\"çÌÊøú\bðïÔ\x1BûÐÿýt\vGáÑm2êôÇ B\bç£Êö´Þa0ÜîâÙæô\fôá&\nØÃ@'!(ÃÏ]ö!õåî'Âúú>\vø&½\f\x1B'å{îú¿SÀõ!8N\x07ñ6÷s\xA023#\"\x1B%Øõ\bÜ*Óé\0Cø÷ó2òå\0øò÷	Ú%ø2Ò6)õøõæ'-æïåE&'bB\0*{í­uà8\n\f¨OË8?_Â	$ó±ð%Ò#ÞÊù\x07?8\x1B´çæÁ½Ì+Ñº(ô(¾Û\0#%ËïÍ\vÞüÖ\x07\f%'ÙíAÄÎþR'éÕê½ÝÞ fQ$CÓ½Ìü#GVÝ÷­Þ\f	éé\x07ç-\x07Û\0í(åðë`É4íòú2ÞVË&ÌÜó<« \x07ôFù¢&´áìä\x07(5X&øêé3%÷\ràë\x1B÷óèó'õãÜ\b\x1B¢ÿê1BÿýØî\f!Å><ÐZÿl	þ\x1BM¿RÐÚíõ2Bóê<Ú(òæó&C9!$&ï\x1Bä\fÀßå\ræ #ûÐò\\+Ñò(\v3BÁðÃä\x1BßâëãËØ+üíCdð£NúîÌÛ÷Báøêþó\x1B\0\bîçëèù£\x07µE2ûñï<Ö7ü\n.ó-ùöÔ1ñÀô¸ ÚÓ\nÊ\róåÜÀ:ÂXª¹Ù÷ ü6ðÙæÜ.0Àöó\"ø2<êúõâ2 8\0D\vã-÷ôÏ\0ÚíZ#3\bÐ`ÿô÷àÁ¿ù&Y«äéç8OÜcúÛ\x07ó»Òã@ë*¾Pàö&\x1BWÇç\vHëû\vó¾N$ý)ë\bßI9çûêÑÇ¸!5¹ëýlGòR=Ð	ÍìçýßýÞ\fíÚðáK,áB÷êêÔ\x1B:ò\n·Ö7çÃHÿÆç?ÐØâ<\bïÿîì+ìüäF@å'ßû¨ØÌ,ïÏ÷øV1ÕÄ\n-$Ëü!&0¸¿ûÂ\x1BçúÓÙÒ÷ßîý!ûæêÁïÅ=¶\x07ÑÆ½ð\f	ÐØ+ØðÚúêäðÅêû\vô¾Ø\x1BÂÔí&ý'ø(è\r2Äê5ãúÅ\0Ùsµ\0\0`µ\0\0`¾\0\0 \0\0\0\0\0\0u\0AÀ\v¸¨ÃUÝvÃïh÷!-ST«Ó0Ë.ï}u×¥¼ÿ§° j\x074Å\0\0@Å\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0þ+eGg@\0\0\0\0\0\x008C\0\0úþB.v¿:;¼÷\f½½ýÿÿÿÿß?<TUUUUÅ?+ÏUU¥?Ð¤g?\0\0\0\0\0\0ÈBï9úþB.æ?$Äÿ½¿Î?µô\f×\bk¬?ÌPFÒ«²?:Nà×U?\0A\v´1ð?n¿O;<53û©=öï?]ÜØ`q¼aw>ìï?Ñfz^¼nèãï?ög5RÒ<tÓ°Ùï?úù#Î¼ÞöÝ)kÐï?aÈæaN÷`<ÈuEÇï?Ó3[ä£<óÆÊ>¾ï?m{]¦<ùlXµï?üïýµ<÷Gr+¬ï?Ñ/p=¾><¢ÑÓ2ì£ï?\vn4j¼\x1BÓþ¯fï?½/*RV¼Q[Ðï?UêNïP¼Ì1lÀ½ï?ôÕ¹#É¼à-©®ï?¯U\\éãÓ<Q¥Èzï?H¥ê\x1B¼{Q}<¸rï?=2ÞUð¼ê8ùjï?¿S?<uËoë[cï?&ëvÙ¼Ô\\à[ï?`/:>÷ì<ª¹h1Tï?8Ëç¼Ùü\"PMï?Ã¦DAo<Öb;Fï?}ä°z<Ü}I?ï?¨¨ãý<8bunz8ï?}Htò^<?¦²OÎ1ï?òç+G<Ý|âeE+ï?^\bq?{¸¼cõáß$ï?1«	má÷<áÞõï?ú¿o!=¼ÙÚÐï?´\n\fr7<\vä¦ï?ËÎn<V/>©¯\fï?¶«°MuM<·1\nþï?Lt¬âB<1ØLüpï?JøÓ]9Ý<ÿd²\büî?[;£¼ñ_Åöî?hPKÌíJ¼Ë©:7§ñî?-Q\x1Bø\x07¼fØm®ìî?Ò6>èÑq¼÷å4Ûçî?\x1BÎ³¼å¨Ã-ãî?mL*§H<\"4L¦Þî?i(z`¼¬EÚî?[H§X¼*.÷!\nÖî?\x1BIg,|¼¨PÙõÑî?¬Â`ícC<-a`\bÎî?ïd;	f<W\0íAÊî?y¡ÚáÌn<Ð<Áµ¢Æî?0?ÿ<ÞÓ×ð*Ãî?°¯z»Îv<'*6ÕÚ¿î?wàTë½<\rÝý²¼î?£q\x004¼§,v²¹î?I£ÜÌÞ¼BfÏ¢Ú¶î?_8½ÆÞx¼OV+´î?ö\\{ìF¼]Ê¤±î?×ý5<Ú'µ6G¯î?/·{<ýÇÔ­î?	Tâác<)THÝ\x07«î?êÆPÇ4<·FY&©î?5Àd+æ2<H!­o§î?vaJä¼	Üv¹á¥î?¨Mï;Å3¼U:°~¤î?®é+xS¼ ÃÌ4F£î?XXVxÝÎ¼%\"U8¢î?d~ªW<s©LÔU¡î?(\"^¿ï³¼Í;f\xA0î?¹4­j¼¿Ú\vu\xA0î?î©m¸ïgc¼/e<²î?QàT=Ü¼Qù}î?Ï>Z~dx¼t_ìèuî?°}ÀJî¼t¥Hî?æU2¼ÉgBVëî?ÓÔ	^Ë<?]ÞOi\xA0î?¥M¹Ü2{¼ës¡î?kÀgTýì<2Á0í¡î?UlÖ«áëe<bNÏ6ó¢î?BÏ³/Å¡¼>T'¤î?47;ñ¶i¼ÎL¥î?ÿ:^¼­Ç#F§î?nWrØPÔ¼íDÙ¨î?\0[g­<fÙÇªî?´êðÁ/·<Û\xA0*Bå¬î?ÿçÅ`¶e¼Dµ2¯î?D_óYö{<6w®±î?=§	¼Æÿ\v[´î?)l¸©]¼åÅÍ°7·î?Y¹|ù#l¼RÈËDºî?ªùô\"CC¼PNÞ½î?Kf×lÊ¼º\x07ÊpñÀî?'Î+ü¯q<ð£Äî?»s\ná5Òm<##ãcÈî?c\"b\"Å¼eå]{fÌî?Õ1âã<3-JìÐî?»¼ÓÑ»¼]%>²Õî?Ò1î1Ì<X³0Ùî?³Zsni<¿ýyUkÞî?´Íß¼zóÓ¿kãî?3Ëw<­ÓZèî?úÙÑJ{¼f¶)\x07îî?º®ÜVÙÃU¼ûO¸¢óî?@ö¦=¤¼:Yårùî?4­8ôÖh¼G^ûòvÿî?5Xkâî¼J¡0°ï?ÍÝ_\n×ÿt<ÒÁK\fï?¬úû½¼	×[Âï?³\f¯0®ns<RÝï?ý\\2ã<zÐÿ_« ï?¬Y	Ñà<KÑW.ñ'ï?gN8¯Íc<µçm/ï?hl,kg<iïÜ 7ï?ÒµÌ¼úÃ]U\v?ï?oúÿ?]­¼|\x07J-Gï?I©u8®\r¼ò\r\bOï?§\x07=¦£t<¤ûÜXï?\"@ ¼Éã`ï?¬ÁÕPZ<2Ûæiï?Kk¬Y:<`´ó!sï?>´\x07!Õ¼_{3|ï?É\rG;¹*¼)¡õFï?Ó:`¶t<ö?ç.ï?qrQìÅ<LÇûQï?ðÓ÷¼Ú¤¢¯¤ï?}t#â®¼ñg-H¯ï?\b ªA¼Ã<'Zaî\x1Bºï?2ë©Ã+<ºk7+Åï?îÑ1©d<@En[vÐï?íã;äº7¼¾­ýÛï?ÍM;w<ØÁçï?Ì`AÁS<ñq+Âóï?\x008úþB.æ?0gÇWó.=\0\0\0\0\0à¿[0QUUUÕ?EëÿÿÿÏ¿ñ$³É?ÈåuUÅ¿\0\0\0\0\0\0à¿wUUUUUÕ?ËýÿÿÿÿÏ¿\fÝÉ?§EgUUUÅ¿0ÞD£$IÂ?e=B¤ÿÿ¿¿ÊÖ*(q¼?ÿh°Cë¹¿Ð¯÷·?ÍEÑuRµ¿ÞàÃð4÷?\0æyÌ×¿é,jx÷?\0\0\rÂîo×¿\xA0µú\b`òö?\0àQã×¿}¦Ñö?\0x(8[¸Ö¿Ñ´Å\vI±ö?\0xU]Ö¿º\f/3Gö?\0\0vÐÖ¿#B\"qö?\0Ê¨Õ¿Ù¥ORö?\0PVCOÕ¿Ä$ªV3ö?\0@kÃ7öÔ¿Ük³ö?\0P¨ý§Ô¿L\\ÆRdöõ?\0¨9EÔ¿O,µgØõ?\0¸°9ôíÓ¿Þ[Ë¼ºõ?\0pDÎÓ¿xÙòaõ?\0\xA0½@Ó¿VFVõ?\0FïâéÒ¿ÓkçÎcõ?\0à08\x1BÒ¿§â%Gõ?\0ÚÅ>Ò¿EBÿ*õ?\0')áéÑ¿ß½²Û\"õ?\0øH+mÑ¿×Þ4Góô?\0ø¹gAÑ¿@(ÞÏCØô?\0ïÐíÐ¿È£xÀ>½ô?\0Û¥Ð¿%àÃ¢ô?\0¸cRæGÐ¿4Ô$ô?\0ðE\"ëÏ¿\v-\x1BÎmô?\0°uJGÏ¿T9ÓÙSô?\x000=D¤Î¿Z´D':ô?\0°éD\rÎ¿ûøAµ ô?\0ðw)¢`Í¿±ô>Ú\x07ô?\0ÀÌ¿þW]îó?\0V) Ì¿éL\v\xA0ÙÕó?\0Ë¿+ÁÀ`½ó?\0ÐÓÌÉâÊ¿¸Úu+$¥ó?\0.@EÊ¿ÐÍ\"ó?\0ðhw¨É¿zÅ[uó?\x000Him\fÉ¿â6­IÎ]ó?\0ÀE¦ qÈ¿@ÔMyFó?\x000´ÖÇ¿$ËÿÎ\\/ó?\0pb<¸<Ç¿I\r¡uwó?\0`7£Æ¿9>7Èó?\0\xA0·T1\vÆ¿Aø»Nëò?\x000$v}sÅ¿Ñ©\nÕò?\x000Â{ÜÄ¿*ý·¨ù¾ò?\0\0ÒQ,FÄ¿«\x1B\fz©ò?\0\0¼°Ã¿0µ`rò?\0\0Ik\x1BÃ¿õ¡WWú}ò?\0@¤TÂ¿¿;³hò?\0\xA0yø¹óÁ¿½õSò?\0\xA0,%È`Á¿;\bÉª·>ò?\0 ÷WÎÀ¿¶@©+*ò?\0\xA0þIÜ<À¿2AÌyò?\0K¼½W¿¿üÒ ò?\0@@\b7¾¿\vHMIôìñ?\0@ù>½¿ieRõØñ?\0\xA0ØNgù»¿|~W#Åñ?\0`/ yÜº¿é&Ët|±ñ?\0(çÃÀ¹¿¶,\fñ?\0Àr³F¦¸¿½p¶{°ñ?\0\0¬³·¿¶¼ï%wñ?\0\x008Eñt¶¿Ú1L5dñ?\0m^µ¿Ý_'¹Qñ?\0à¡Þ\\H´¿LÒ2¤?ñ?\0\xA0jMÙ3³¿Úùr,ñ?\0`Åøy ²¿1µì(0ñ?\0 bF±¿¯4Úû\x07ñ?\0\0Òjlú¯¿³kNîõð?\0@wJÚ­¿Î*]äð?\0\0äì¼«¿!¥,cDÒð?\0À@¡©¿â|§Àð?\0À3X§¿Ñ6Æ/¯ð?\0Ög^q¥¿9\xA0Ûð?\0eI\\£¿ßçR¯«ð?\0@dãI¡¿û(N/{ð?\0ëÀr¿5µjð?\0RRñU¿,ùì¥îYð?\0Ïb=¿,ÑÍIIð?\0\0ªû(¿©­ðÆÆ8ð?\0\0ù {1¿©2ye(ð?\0\0ª]5¿Hsê'$ð?\0\0ìÂx¿±\bð?\0\0$y	`¿ú&÷àï?\0\0óïo?têaÂ¡ï?\0\0=5AÜ?.°cï?\0ÂÄ£Î?Í­î<ö%ï?\0\0Á?çÈéî?\0\0ÎØ°¡?«±Ëx®î?\0ÀÐ[¥?\f¢tî?\0Ø@\\©?µ\n:î?\0Wïj'­?V`	àî?\0Àåu°?»wåÊí?\0 \rãõS²?|\vòí?\0\x008Ý.´?Î\\ûf¬\\í?\0ÀWY¶?Þ^ª,'í?\0\0j5vÚ·?Í,k>nòì?\0`NC«¹?y§¢m¾ì?\0`\r»Çx»?m\b7m&ì?\0 ç2C½?X]½Xì?\0`Þq1\n¿?»3µ&ì?\0@+gÀ??çìîõë?\0°GÁ?ÁÛuýÄë?\x000ÊÍn&Â?(J\fë?\0PÅ¦×Ã?,>ïÅâeë?\03<ÃßÃ?ÉgH7ë?\0zk6ºÄ?J0!K	ë?\0ðÑ(9Å?~ïòèÛê?\0ð$ÍjÆ?¢=`1¯ê?\0fìø@Ç?§XÓ?æê?\0ðõÀÈ?s	ï@Wê?\0öT)éÈ?'K«*,ê?\0@ø6»É?Ñò\xA0ê?\0\0,íÊ?\x1B<Û$×é?\0Ð\\Q[Ë?±Ç%®é?\0À¼Ìg)Ì?/Îò.é?\0`HÕ5öÌ?uK¤îº\\é?\0ÀF4½ÁÍ?8HçÆ4é?\0àÏ¸Î?æRg/O\ré?\0À	UÏ?×ÿRæè?\0¸lÐ?|\0ÌÎ¿è?\0Ð¸qÐ?Ã¾ÚÀè?\0pkÔÐ?û#ª'tè?\0ÐK36Ñ?\b³¬\0Oè?\0H#g\rÑ?U>eèI*è?\0ÌàÿøÑ?`ôè?\0hc×_YÒ?)£àc%âç?\0¨	0¹Ò?­µÜw³¾ç?\0`CrÓ?Â%gªç?\0ìm&wÓ?Wò\x07yç?\x000¯ûOÕÓ?\fÖÛÊVç?\0à/ãî2Ô?k¶O\0æ?<[Bl~<´M\x000æ?A]\0Hê¿<xÔ\r\0Pæ?·¥Ö§<­oN\x07\0pæ?L%Tkêüa<®ßþÿæ?ýYL'~|¼¼Åc\x07\0°æ?ÚÜHhÁ¼öÁ\\\0Ðæ?I?<>öëÿïæ?S-â~¼\0ç?Ry	qfÿ{<égüÿ/ç?$½&â\0<jßÿOç?Òñnn¼g\0pç?tTÍqüg¼5È~úÿç?õÁ¾<æÂ þÿ¯ç?edÌ)~p¼\0É?íÿÏç?{\br¼v&éÿïç?®ùm(À<è£\0è?3LåQÒ<,\x000è?ó0¶éþ¼s3\0Pè?¼5ek¿¿<ÆB \0pè?u{óe¿¼yõëÿè?WË=¢n\0¼ß¼\"\0°è?\nKà8ß\0}¼\x1B\fåÿÏè?ÿFq\0¼Cüÿïè?8pzÐ{<Ç_ú\0é?´ßv><¹{F\x000é?vKN<o\x07îæÿOé?.bÿÙð~¼Ñ<Þÿoé?º8&ªp¼\rEôÿé?ï¨d\x1B¼>.Ýÿ¯é?7Zà@¼fûIíÿÏé?\0àÁ\bÎ?<Qñ \0ðé?\n['ª?¼°E\0ê?VÚXHÿt<úö»\x07\x000ê?m+«¾<y\0Pê?0yxÝÊþ<H.õ\0pê?Û«Ø=vA¼R3Y\0ê?vÂ¿¼K>O*\0°ê?_?ÿ<ýi¼Ñ®×ÿÏê?´pç>¼xQîÿïê?£Þà>j<[\reÛÿë?¹\n8ÈZ<WÊªþÿ/ë?<#ty¼ÜºÙÿOë?*hÿy¼e$\0pë?>OÐEÿ<@ùÿë?ùÃÂwþ|<OËÒÿ¯ë?Ä+òî'ÿc¼E\\AÒÿÏë?!ê;î·ÿl¼ß	cøÿïë?\\\v.A¼Svµáÿì?j·dÁ<ãWúñÿ/ì?íÆ0ïþd¼$ä¿ÜÿOì?uGì¼h?¼÷¹Tíÿoì?ìàSð£~<Õëÿì?ñùs<!%!\0°ì?dýh¼FÝÿÏì?rêÇ¾~<vÄýêÿïì?þ­9¾<+ø\0í?qZ¹¨}u<÷\r\x000í?ÚÇpiÁ<ÄyêÿOí?\fþXÅ7X¼åÜ.\0pí?DÁMÖ¼ªÜ!\0í?\\\\ý|t¼kØÿ¯í?~a!Å<9Gl)\0Ðí?S±ÿ²<õDåÿïí?ÌRÆÒ\0n<ö«Íÿî?Òi- @¼ÝÈRÛÿ/î?d\b\x1BÊÁ\0{<ïBòÿOî?Q«°¨ÿr<^èÿoî?Y¾ï±söW¼\rÿ\0î?È\v^¼D¥ßÿ¯î?µ CÕ\0x<¡\0Ðî?\\V`øP¼Ä¼º\x07\0ðî?æ5]D@¼zõÿï?ï91ûO¼Çå\x000ï?Usò¬<4õÿOï?CÇ×ÔA?<kL©üÿoï?uxôb¼AÄùáÿï?KçwôÑ}w<~ãàÒÿ¯ï?1£|o¼äw\0Ðï?±¬ÎKîq<1Ãà÷ÿïï?Zp7n¼n`eôÿð?Ú\nI­~¼Xzóÿ/ð?à²üÃi¼\rüýÿOð?[Ë4þ¿<MÍ\0pð?ËVäÀ\0<èËòùÿð?u7¾ßÿm¼eÚ\f\0°ð?ë&æ®?¼8Ó¤\0Ðð?÷Hyú}<ýýÚúÿïð?ÀkÖpw¼ýº\v\0ñ?b\vmÔ<]ôåúÿ/ñ?ï6ýdú¿<ÙÕ\r\0Pñ?®Ppw\0<U!\0pñ?îÞãâùý<&T'üÿñ?sr;Ü0\0<Y<=\0°ñ?y<·)øÿÏñ?g«2ùe¼\0Ôôÿïñ?ë[§¿<¤\f\0ò?\"[ýk<C\x000ò?3¿ëÂÿ<ö¼ÿÿOò?r..~çv<Ù!)õÿoò?a\fv»ü<<:\0ò?+A<Êr¼cU\0°ò?ò3¼;RþëÿÏò?òÜO8~ÿ¼­¸\v\0ðò?ÅA0PQÿ¼¯âzûÿó?(^q\0¼_¬þÿ/ó?··?]ÿ¼Vg¦\f\0Pó?½\"<!÷û\0pó?ÌÕ\rÄº\0<¹/Yùÿó?Q§²-?¼BÒÝ\0°ó?á8vpk<WÉ²õÿÏó?1¿:z<´°êÿïó?°R±fm<ô¯2\0ô?$_7øg<)G\x000ô?CQÜræ<c´çÿOô?Z²¸iÿ<àuèÿoô?TòÂ±À¼çÁoïÿô?r*:ò	@<§¾åÿ¯ô?E}\r¿·ÿ¼Þ'\0Ðô?=jÜqdÀ¼â>ð\0ðô?S\v<ÑKÜ\0õ?6¤fqe`<z'\x000õ?	2#ÎÎ¿¼LpÛìÿOõ?×¡r¼©T_ïÿoõ?dÉæ¿<æ\0õ?ï¯Å~<>É\0°õ?À\f¿\n\bA¼¼I\0Ðõ?)G%û*¼z¸çÿïõ?ií·~¼\xA0\0\0¢\0\0¤\0\0¦\0\0¨\0\0ª\0\0¬\0\0®\0\0°\0\0\0\0\0\0´\0\0¶\0\0¸\0AÐ½\vÄ\0\0\0\0\0\0È\0\0Ê\0\0\0\0\0\0Î\0Að½\v×\0\0\0\0\0\0\0\0\0\0\0\0ù¢\0DNn\0ü)\0ÑW'\0Ý4õ\0bÛÀ\0<\0AC\0cQþ\0»Þ«\0·aÅ\0:n$\0ÒMB\0Ià\0	ê.\0Ñ\0ëþ\0)±\0è>§\0õ5\0D».\0é\0´&p\0A~_\0Ö9\0S9\0ô9\0_\0(ù½\0ø;\0Þÿ\0\0/ï\0\nZ\0mm\0Ï~6\0	Ë'\0FO·\0f?\0-ê_\0º'u\0åëÇ\0={ñ\0÷9\x07\0R\0ûkê\0±_\0\b]\x000V\0{üF\0ð«k\0 ¼Ï\x006ô\0ã©\0^a\0\b\x1Bæ\0e\0\xA0_\0@h\0Øÿ\0'sM\01\0ÊV\0É¨s\0{â`\0kÀ\0ÄG\0ÍgÃ\0	èÜ\0Y*\0vÄ\0¦\0D¯Ý\0WÑ\0¥>\0\x07ÿ\x003~?\0Â2è\0OÞ\0»}2\0&=Ã\0kï\0ø^\x005:\0òÊ\0ñ\0|!\0j$|\0Õnú\x000-w\0;C\0µÆ\0Ã\0­ÄÂ\0,MA\0\f\0]\0}F\0ãq-\0Æ\x003b\0\0´Ò|\0´§\x007UÕ\0×>ö\0£\0Mvü\0d*\0p×«\0c|ø\0z°W\0ç\0ÀIV\0;ÖÙ\0§8\0$#Ë\0Öw\0ZT#\0\0¹\0ñ\n\x1B\0Îß\01ÿ\0fj\0Wa\0¬ûG\0~Ø\0\"e·\x002è\0æ¿`\0ïÄÍ\0l6	\0]?Ô\0Þ×\0X;Þ\0Þ\0Ò\"(\0(è\0âXM\0ÆÊ2\0\bã\0à}Ë\0ÀP\0ó§\0à[\0.4\0b\0H\0õ[\0­°\0éò\0HJC\0gÓ\0ªÝØ\0®_B\0jaÎ\0\n(¤\0Ó´\0¦ò\0\\w\0£Â\0a<\0sx\0¯Z\0o×½\0-¦c\0ô¿Ë\0ï\0&Ág\0UÊE\0ÊÙ6\0(¨Ò\0Âa\0Éw\0&\0F\0ÄYÄ\0ÈÅD\0M²\0\0ó\0ÔC­\0)Iå\0ýÕ\0\0¾ü\0Ì\0pÎî\0>õ\0ìñ\0³çÃ\0Çø(\0\0Áq>\0.	³\0\vEó\0\0« {\0.µ\0GÂ\0{2/\0\fUm\0r§\0kç\x001Ë\0yJ\0Ayâ\0ôß\0è\0âæ\01\0ík\0__6\0»ý\0H´\0g¤l\0qrB\0]2\0¸\0¼å	\01%\0÷t9\x000\0\r\f\0K\bh\0,îX\0Gª\0tç\0½Ö$\0÷}¦\0nHr\0ï\0¦\0´ö\0ÑSQ\0Ï\nò\0 3\0õK~\0²ch\0Ý>_\0@]\0\0UR)\x007dÀ\0mØ\x002H2\0[Lu\0NqÔ\0ETn\0\v	Á\0*õi\0fÕ\0'\x07\0]P\0´;Û\0êvÅ\0ù\0Ik}\0'º\0i)\0ÆÌ¬\0­T\0âj\0Ù\0,rP\0¤¾\0w\x07\0ó0p\0\0ü'\0êq¨\0fÂI\0dà=\0Ý\0£?\0Cý\0\r\x001AÞ\09\0Ýp\0·ç\0\bß;\07+\0\\\xA0\0Z\0\0èØ\0l¯\0ÛÿK\x008\0Yv\0b¥\0aË»\0Ç¹\0@½\0Òò\0Iu'\0ë¶ö\0Û\"»\0\nª\0&/\0dv\0	;3\0\0Q:ª\0£Â\0¯í®\0\\&\0mÂM\0-z\0ÀV\0?\0	ðö\0+@\0m1\x009´\x07\0\f \0ØÃ[\0õÄ\0Æ­K\0NÊ¥\0§7Í\0æ©6\0«\0ÝBh\0cÞ\0vï\0hR\0üÛ7\0®¡«\0ß1\0\0®¡\0\fûÚ\0dMf\0í·\0)e0\0WV¿\0Gÿ:\0jù¹\0u¾ó\0(ß\0«0\0fö\0Ë\0ú\"\0Ùä\0=³¤\0W\x1B\x006Í	\0NBé\0¾¤\x003#µ\0ðª\0Oe¨\0ÒÁ¥\0\v?\0[xÍ\0#ùv\0{\0r\0Æ¦S\0onâ\0ïë\0\0JX\0ÄÚ·\0ªfº\0vÏÏ\0Ñ\0±ñ-\0Á\0Ã­w\0HÚ\0÷]\xA0\0Æô\0¬ð/\0Ýì\0?\\¼\0ÐÞm\0Ç\0*Û¶\0£%:\0\0¯\0­S\0¶W\0)-´\0K~\0Ú\x07§\0vª\0{Y¡\0*\0Ü·-\0úåý\0Ûþ\0¾ý\0ävl\0©ü\0>p\0n\0ýÿ\0(>\x07\0ag3\0*\0M½ê\0³ç¯\0mn\0g9\x001¿[\0×H\x000ß\0Ç-C\0%a5\0ÉpÎ\x000Ë¸\0¿lý\0¤\0¢\0lä\0ZÝ\xA0\0!oG\0bÒ\0¹\\\0paI\0kVà\0R\0PU7\0Õ·\x003ñÄ\0n_\0]0ä\0.©\0²Ã\0¡26\0\b·¤\0ê±Ô\0÷!\0iä\0'ÿw\0\f\0@-\0OÍ\xA0\0 ¥\0³¢Ó\0/]\n\0´ùB\0ÚË\0}¾Ð\0ÛÁ\0«½\0Ê¢\0\bj\\\0.U\0'\0U\0ð\0á\x07\0\vd\0A\0¾Þ\0Úý*\0k%¶\0{4\0óþ\0¹¿\0hjO\0J*¨\0OÄZ\0-ø¼\0×Z\0ôÇ\0\rM\0 :¦\0¤W_\0?±\08\0Ì \0qÝ\0ÉÞ¶\0¿`õ\0Me\0\x07k\0°¬\0²ÀÐ\0QUH\0û\0rÃ\0£;\0À@5\0Ü{\0àEÌ\0N)ú\0ÖÊÈ\0èóA\0|dÞ\0dØ\0Ù¾1\0¤Ã\0wXÔ\0iãÅ\0ðÚ\0º:<\0FF\0Uu_\0Ò½õ\0nÆ\0¬.]\0Dí\0>B\0aÄ\0)ýé\0çÖó\0\"|Ê\0o5\0\bàÅ\0ÿ×\0njâ\0°ýÆ\0\bÁ\0|]t\0k­²\0Ín\0>r{\0Æj\0÷Ï©\0)sß\0µÉº\0·\0Q\0â²\r\0tº$\0å}`\0tØ\0\r,\0\f\0~f\0)\0zv\0ýý¾\0VEï\0Ù~6\0ìÙ\0º¹\0Äü\x001¨'\0ñnÃ\0Å6\0Ø¨V\0´¨µ\0ÏÌ\0-\0oW4\0,V\0Îã\0Ö ¹\0k^ª\0>*\0_Ì\0ý\vJ\0áôû\0;m\0â,\0éÔ\0ü´©\0ïîÑ\0.5É\0/9a\x008!D\0\x1BÙÈ\0ü\n\0ûJj\0/Ø\0S´\0N\0T\"Ì\0*UÜ\0ÀÆÖ\0\v\0p¸\0id\0&Z`\0?Rî\0\0ôµ\0üËõ\x004¼-\x004¼î\0è]Ì\0Ý^`\0g\03ï\0É¸\0aX\0áW¼\0QÆ\0Ø>\0ÝqH\0-Ý\0¯¡\0!,F\0Yó×\0Ùz\0TÀ\0Oú\0Vü\0åy®\0\"6\x008­\"\0gÜ\0Uèª\0&8\0Êç\0Q\r¤\03±\0©×\0iH\0e²ð\0§\0L\0ùÑ6\0!³\0{J\0Ï!\0@Ü\0ÜGU\0át:\0gëB\0þß\0^Ô_\0{g¤\0º¬z\0Uö¢\0+#\0AºU\0Yn\b\0!*\x009G\0ãæ\0åÔ\0Iû@\0ÿVé\0Ê\0ÅY\0ú+\0ÓÁÅ\0ÅÏ\0ÛZ®\0GÅ\0Cb\0!;\0,y\0a\0*L{\0,\0C¿\0&\0x<\0¨Ää\0åÛ{\0Ä:Â\0&ôê\0÷g\0\r¿\0e£+\0=±\0½|\v\0¤QÜ\0'Ýc\0iáÝ\0\0¨)\0hÎ(\0	í´\0D \0NÊ\0pc\0~|#\0¹2\0§õ\0Vç\0!ñ\b\0µ*\0o~M\0¥Q\0µù«\0ßÖ\0Ýa\06\0Ä:\0¢¡\0rím\x009z\0¸©\0k2\\\0F'[\0\x004í\0Ò\0w\0üôU\0YM\0àq\0AÓÓ\v?@û!ù?\0\0\0\0-Dt>\0\0\0Fø<\0\0\0`QÌx;\0\0\0\x1Bð9\0\0\0@ %z8\0\0\0\"ã6\0\0\0\0ói5í\0A\xA0Ô\vA\0\v\0\0\0\0\0\0\0\0\0\0\0	\0\0\0\0\v\0\0\0\0\0\0\0\0\0\n\n\n\x07\0\0	\v\0\0	\v\0\0\v\0\0\0\0\0AñÔ\v!\0\0\0\0\0\0\0\0\0\v\r\0\r\0\0\0	\0\0\0	\0\0\0\0A«Õ\v\f\0A·Õ\v\0\0\0\0\0\0\0\0	\f\0\0\0\0\0\f\0\0\f\0AåÕ\v\0AñÕ\v\0\0\0\0\0\0\0	\0\0\0\0\0\0\0\0AÖ\v\0A«Ö\v\0\0\0\0\0\0\0\0	\0\0\0\0\0\0\0\0\0\0\0\0\0AâÖ\v\0\0\0\0\0\0\0\0\0	\0A×\v\0A×\v\0\0\0\0\0\0\0\0	\0\0\0\0\0\0\0\0AÍ×\v\0AÙ×\vd\0\0\0\0\0\0\0\0	\0\0\0\0\0\0\0\0\x000123456789ABCDEF\0\0\0\0\0\0\0\0\0\0\x07\0\0\0\x07\0\0\0\x07\0\0\0\x07\0\0\0\x07\0\0\0\x07\0\0\0\0\0\0\0\0\0\x07\0\0\0\0\0\0\0\0\0\0\0\0\0AàØ\v\x07\0\0\0\x07\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\x07\0AÚ\v	°ï\0\0\0\0\0\0AÚ\v\0A´Ú\v\n\0\0\0\0\0\0ï\0AÌÚ\v\0AÜÚ\v\bÿÿÿÿÿÿÿÿ");
	}
	function getBinarySync(file) {
		return file;
	}
	async function getWasmBinary(binaryFile) {
		return getBinarySync(binaryFile);
	}
	async function instantiateArrayBuffer(binaryFile, imports) {
		try {
			var binary = await getWasmBinary(binaryFile);
			return await WebAssembly.instantiate(binary, imports);
		} catch (reason) {
			err(`failed to asynchronously prepare wasm: ${reason}`);
			abort(reason);
		}
	}
	async function instantiateAsync(binary, binaryFile, imports) {
		return instantiateArrayBuffer(binaryFile, imports);
	}
	function getWasmImports() {
		return { a: wasmImports };
	}
	async function createWasm() {
		function receiveInstance(instance, module) {
			wasmExports = instance.exports;
			assignWasmExports(wasmExports);
			updateMemoryViews();
			return wasmExports;
		}
		function receiveInstantiationResult(result) {
			return receiveInstance(result["instance"]);
		}
		var info = getWasmImports();
		if (Module["instantiateWasm"]) return new Promise((resolve, reject) => {
			Module["instantiateWasm"](info, (inst, mod) => {
				resolve(receiveInstance(inst, mod));
			});
		});
		wasmBinaryFile ??= findWasmBinary();
		return receiveInstantiationResult(await instantiateAsync(wasmBinary, wasmBinaryFile, info));
	}
	class ExitStatus {
		name = "ExitStatus";
		constructor(status) {
			this.message = `Program terminated with exit(${status})`;
			this.status = status;
		}
	}
	var HEAP16;
	var HEAP32;
	var HEAP64;
	var HEAP8;
	var HEAPF32;
	var HEAPF64;
	var HEAPU16;
	var HEAPU32;
	var HEAPU64;
	var HEAPU8;
	var callRuntimeCallbacks = (callbacks) => {
		while (callbacks.length > 0) callbacks.shift()(Module);
	};
	var onPostRuns = [];
	var addOnPostRun = (cb) => onPostRuns.push(cb);
	var onPreRuns = [];
	var addOnPreRun = (cb) => onPreRuns.push(cb);
	var noExitRuntime = true;
	var __abort_js = () => abort("");
	var runtimeKeepaliveCounter = 0;
	var __emscripten_runtime_keepalive_clear = () => {
		noExitRuntime = false;
		runtimeKeepaliveCounter = 0;
	};
	var timers = {};
	var handleException = (e) => {
		if (e instanceof ExitStatus || e == "unwind") return EXITSTATUS;
		quit_(1, e);
	};
	var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
	var _proc_exit = (code) => {
		EXITSTATUS = code;
		if (!keepRuntimeAlive()) {
			Module["onExit"]?.(code);
			ABORT = true;
		}
		quit_(code, new ExitStatus(code));
	};
	var exitJS = (status, implicit) => {
		EXITSTATUS = status;
		_proc_exit(status);
	};
	var _exit = exitJS;
	var maybeExit = () => {
		if (!keepRuntimeAlive()) try {
			_exit(EXITSTATUS);
		} catch (e) {
			handleException(e);
		}
	};
	var callUserCallback = (func) => {
		if (ABORT) return;
		try {
			return func();
		} catch (e) {
			handleException(e);
		} finally {
			maybeExit();
		}
	};
	var _emscripten_get_now = () => performance.now();
	var __setitimer_js = (which, timeout_ms) => {
		if (timers[which]) {
			clearTimeout(timers[which].id);
			delete timers[which];
		}
		if (!timeout_ms) return 0;
		timers[which] = {
			id: setTimeout(() => {
				delete timers[which];
				callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()));
			}, timeout_ms),
			timeout_ms
		};
		return 0;
	};
	var getHeapMax = () => 2147483648;
	var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
	var growMemory = (size) => {
		var pages = (size - wasmMemory.buffer.byteLength + 65535) / 65536 | 0;
		try {
			wasmMemory.grow(pages);
			updateMemoryViews();
			return 1;
		} catch (e) {}
	};
	var _emscripten_resize_heap = (requestedSize) => {
		var oldSize = HEAPU8.length;
		requestedSize >>>= 0;
		var maxHeapSize = getHeapMax();
		if (requestedSize > maxHeapSize) return false;
		for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
			var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
			overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
			if (growMemory(Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536)))) return true;
		}
		return false;
	};
	var printCharBuffers = [
		null,
		[],
		[]
	];
	var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
	var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
		var maxIdx = idx + maxBytesToRead;
		if (ignoreNul) return maxIdx;
		while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
		return idx;
	};
	var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
		var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
		if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
		var str = "";
		while (idx < endPtr) {
			var u0 = heapOrArray[idx++];
			if (!(u0 & 128)) {
				str += String.fromCharCode(u0);
				continue;
			}
			var u1 = heapOrArray[idx++] & 63;
			if ((u0 & 224) == 192) {
				str += String.fromCharCode((u0 & 31) << 6 | u1);
				continue;
			}
			var u2 = heapOrArray[idx++] & 63;
			if ((u0 & 240) == 224) u0 = (u0 & 15) << 12 | u1 << 6 | u2;
			else u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
			if (u0 < 65536) str += String.fromCharCode(u0);
			else {
				var ch = u0 - 65536;
				str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
			}
		}
		return str;
	};
	var printChar = (stream, curr) => {
		var buffer = printCharBuffers[stream];
		if (curr === 0 || curr === 10) {
			(stream === 1 ? out : err)(UTF8ArrayToString(buffer));
			buffer.length = 0;
		} else buffer.push(curr);
	};
	var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "";
	var _fd_write = (fd, iov, iovcnt, pnum) => {
		var num = 0;
		for (var i = 0; i < iovcnt; i++) {
			var ptr = HEAPU32[iov >> 2];
			var len = HEAPU32[iov + 4 >> 2];
			iov += 8;
			for (var j = 0; j < len; j++) printChar(fd, HEAPU8[ptr + j]);
			num += len;
		}
		HEAPU32[pnum >> 2] = num;
		return 0;
	};
	if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
	if (Module["print"]) out = Module["print"];
	if (Module["printErr"]) err = Module["printErr"];
	if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
	if (Module["arguments"]) Module["arguments"];
	if (Module["thisProgram"]) Module["thisProgram"];
	if (Module["preInit"]) {
		if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
		while (Module["preInit"].length > 0) Module["preInit"].shift()();
	}
	Module["UTF8ToString"] = UTF8ToString;
	var __emscripten_timeout, wasmMemory;
	function assignWasmExports(wasmExports) {
		Module["_oc_create_encoder"] = wasmExports["i"];
		Module["_oc_destroy_encoder"] = wasmExports["j"];
		Module["_oc_encode"] = wasmExports["k"];
		Module["_oc_encode_float"] = wasmExports["l"];
		Module["_oc_encoder_ctl"] = wasmExports["m"];
		Module["_oc_encoder_ctl_get_bitrate"] = wasmExports["n"];
		Module["_oc_encoder_ctl_get_lookahead"] = wasmExports["o"];
		Module["_oc_encoder_ctl_get_in_dtx"] = wasmExports["p"];
		Module["_oc_create_decoder"] = wasmExports["q"];
		Module["_oc_destroy_decoder"] = wasmExports["r"];
		Module["_oc_decode"] = wasmExports["s"];
		Module["_oc_decode_float"] = wasmExports["t"];
		Module["_oc_packet_get_bandwidth"] = wasmExports["u"];
		Module["_oc_packet_get_nb_channels"] = wasmExports["v"];
		Module["_oc_packet_get_nb_frames"] = wasmExports["w"];
		Module["_oc_packet_get_nb_samples"] = wasmExports["x"];
		Module["_oc_packet_get_samples_per_frame"] = wasmExports["y"];
		Module["_oc_packet_parse"] = wasmExports["z"];
		Module["_oc_packet_validate_decode"] = wasmExports["A"];
		Module["_oc_decoder_ctl"] = wasmExports["B"];
		Module["_oc_strerror"] = wasmExports["C"];
		Module["_oc_get_version_string"] = wasmExports["D"];
		Module["_malloc"] = wasmExports["E"];
		Module["_free"] = wasmExports["F"];
		__emscripten_timeout = wasmExports["G"];
		wasmMemory = wasmExports["g"];
		wasmExports["__indirect_function_table"];
	}
	var wasmImports = {
		f: __abort_js,
		d: __emscripten_runtime_keepalive_clear,
		a: __setitimer_js,
		b: _emscripten_resize_heap,
		e: _fd_write,
		c: _proc_exit
	};
	function run() {
		preRun();
		function doRun() {
			Module["calledRun"] = true;
			if (ABORT) return;
			initRuntime();
			readyPromiseResolve?.(Module);
			Module["onRuntimeInitialized"]?.();
			postRun();
		}
		if (Module["setStatus"]) {
			Module["setStatus"]("Running...");
			setTimeout(() => {
				setTimeout(() => Module["setStatus"](""), 1);
				doRun();
			}, 1);
		} else doRun();
	}
	var wasmExports = await createWasm();
	run();
	if (runtimeInitialized) moduleRtn = Module;
	else moduleRtn = new Promise((resolve, reject) => {
		readyPromiseResolve = resolve;
		readyPromiseReject = reject;
	});
	return moduleRtn;
}
//#endregion
//#region node_modules/libopus-wasm/dist/index.js
const Application = {
	Voip: 2048,
	Audio: 2049,
	RestrictedLowDelay: 2051
};
const Signal = {
	Auto: -1e3,
	Voice: 3001,
	Music: 3002
};
const Bitrate = {
	Auto: -1e3,
	Max: -1
};
const Bandwidth = {
	Narrowband: 1101,
	Mediumband: 1102,
	Wideband: 1103,
	Superwideband: 1104,
	Fullband: 1105
};
const EncoderCtl = {
	SetApplication: 4e3,
	SetBitrate: 4002,
	SetMaxBandwidth: 4004,
	SetVbr: 4006,
	SetBandwidth: 4008,
	SetComplexity: 4010,
	SetInBandFec: 4012,
	SetPacketLossPercent: 4014,
	SetDtx: 4016,
	SetVbrConstraint: 4020,
	SetForceChannels: 4022,
	SetSignal: 4024,
	SetLsbDepth: 4036,
	SetExpertFrameDuration: 4040,
	SetPredictionDisabled: 4042,
	SetPhaseInversionDisabled: 4046
};
const DecoderCtl = {
	SetGain: 4034,
	SetPhaseInversionDisabled: 4046
};
const DEFAULT_CHANNELS = 2;
const DEFAULT_FRAME_DURATION_MS = 20;
const MAX_PACKET_DURATION_MS = 120;
const DEFAULT_MAX_PACKET_BYTES = 4e3;
const DEFAULT_SAMPLE_RATE = 48e3;
const DECODER_INTEGER_CTL_REQUESTS = new Set(Object.values(DecoderCtl));
const ENCODER_INTEGER_CTL_REQUESTS = new Set(Object.values(EncoderCtl));
const ENCODE_FRAME_DURATIONS_MS = [
	2.5,
	5,
	10,
	20,
	40,
	60
];
const VALID_SAMPLE_RATES = [
	8e3,
	12e3,
	16e3,
	24e3,
	48e3
];
let modulePromise;
async function createEncoder(options = {}) {
	return new WasmOpusEncoder(await getModule(), normalizeEncoderOptions(options));
}
async function createDecoder(options = {}) {
	return new WasmOpusDecoder(await getModule(), normalizeDecoderOptions(options));
}
var WasmOpusEncoder = class {
	application;
	channels;
	frameSize;
	sampleRate;
	#freed = false;
	#module;
	#packetBytes = 0;
	#packetPtr = 0;
	#pcmBytes = 0;
	#pcmPtr = 0;
	#ptr;
	constructor(module, options) {
		this.#module = module;
		this.application = options.application;
		this.channels = options.channels;
		this.frameSize = options.frameSize;
		this.sampleRate = options.sampleRate;
		const errorPtr = module._malloc(4);
		try {
			const ptr = module._oc_create_encoder(options.sampleRate, options.channels, options.application, errorPtr);
			const error = module.HEAP32[errorPtr >> 2] ?? 0;
			if (!ptr || error !== 0) throw createOpusError(module, error, "createEncoder");
			this.#ptr = ptr;
		} finally {
			module._free(errorPtr);
		}
		this.setBitrate(options.bitrate);
		this.setComplexity(options.complexity);
		this.setDtx(options.dtx);
		this.setFec(options.fec);
		if (options.maxBandwidth !== void 0) this.setMaxBandwidth(options.maxBandwidth);
		this.setPacketLossPercent(options.packetLossPercent);
		this.setSignal(options.signal);
		if (options.vbr !== void 0) this.setVbr(options.vbr);
		if (options.vbrConstraint !== void 0) this.setVbrConstraint(options.vbrConstraint);
	}
	encode(pcm, options = {}) {
		this.#assertLive();
		const frameSize = options.frameSize ?? this.frameSize;
		validateEncodeFrameSize(frameSize, this.sampleRate, "frameSize");
		const pcmBytes = toUint8Array(pcm);
		const expectedBytes = frameSize * this.channels * 2;
		if (pcmBytes.byteLength !== expectedBytes) throw new RangeError(`PCM frame has ${pcmBytes.byteLength} bytes; expected ${expectedBytes} for ${frameSize} samples and ${this.channels} channel(s)`);
		const maxPacketBytes = options.maxPacketBytes ?? DEFAULT_MAX_PACKET_BYTES;
		validatePositiveInteger(maxPacketBytes, "maxPacketBytes");
		const pcmPtr = this.#ensurePcmBytes(pcmBytes.byteLength);
		const packetPtr = this.#ensurePacketBytes(maxPacketBytes);
		this.#module.HEAPU8.set(pcmBytes, pcmPtr);
		const encodedBytes = this.#module._oc_encode(this.#ptr, pcmPtr, frameSize, packetPtr, maxPacketBytes);
		if (encodedBytes < 0) throw createOpusError(this.#module, encodedBytes, "encode");
		return this.#module.HEAPU8.slice(packetPtr, packetPtr + encodedBytes);
	}
	encodeFloat(pcm, options = {}) {
		this.#assertLive();
		const frameSize = options.frameSize ?? this.frameSize;
		validateEncodeFrameSize(frameSize, this.sampleRate, "frameSize");
		const expectedSamples = frameSize * this.channels;
		if (pcm.length !== expectedSamples) throw new RangeError(`Float32 PCM frame has ${pcm.length} samples; expected ${expectedSamples} for ${frameSize} samples and ${this.channels} channel(s)`);
		const maxPacketBytes = options.maxPacketBytes ?? DEFAULT_MAX_PACKET_BYTES;
		validatePositiveInteger(maxPacketBytes, "maxPacketBytes");
		const pcmPtr = this.#ensurePcmBytes(pcm.byteLength);
		const packetPtr = this.#ensurePacketBytes(maxPacketBytes);
		this.#module.HEAPF32.set(pcm, pcmPtr >> 2);
		const encodedBytes = this.#module._oc_encode_float(this.#ptr, pcmPtr, frameSize, packetPtr, maxPacketBytes);
		if (encodedBytes < 0) throw createOpusError(this.#module, encodedBytes, "encodeFloat");
		return this.#module.HEAPU8.slice(packetPtr, packetPtr + encodedBytes);
	}
	encodeFrames(frames, options = {}) {
		return frames.map((frame) => this.encode(frame, options));
	}
	encodeFloatFrames(frames, options = {}) {
		return frames.map((frame) => this.encodeFloat(frame, options));
	}
	encoderCtl(request, value) {
		this.#assertLive();
		validateInteger(request, "request");
		validateInteger(value, "value");
		if (!ENCODER_INTEGER_CTL_REQUESTS.has(request)) throw new RangeError("encoderCtl only supports integer setter requests");
		this.#check(this.#module._oc_encoder_ctl(this.#ptr, request, value), "encoderCtl");
	}
	setBitrate(bitrate) {
		this.encoderCtl(EncoderCtl.SetBitrate, normalizeBitrate(bitrate));
	}
	getBitrate() {
		this.#assertLive();
		const bitrate = this.#module._oc_encoder_ctl_get_bitrate(this.#ptr);
		if (bitrate < 0) throw createOpusError(this.#module, bitrate, "getBitrate");
		return bitrate;
	}
	getLookahead() {
		this.#assertLive();
		const lookahead = this.#module._oc_encoder_ctl_get_lookahead(this.#ptr);
		if (lookahead < 0) throw createOpusError(this.#module, lookahead, "getLookahead");
		return lookahead;
	}
	getInDtx() {
		this.#assertLive();
		const inDtx = this.#module._oc_encoder_ctl_get_in_dtx(this.#ptr);
		if (inDtx < 0) throw createOpusError(this.#module, inDtx, "getInDtx");
		return inDtx !== 0;
	}
	setComplexity(complexity) {
		validateIntegerRange(complexity, 0, 10, "complexity");
		this.encoderCtl(EncoderCtl.SetComplexity, complexity);
	}
	setDtx(enabled) {
		this.encoderCtl(EncoderCtl.SetDtx, enabled ? 1 : 0);
	}
	setFec(enabled) {
		this.encoderCtl(EncoderCtl.SetInBandFec, enabled ? 1 : 0);
	}
	setMaxBandwidth(bandwidth) {
		validateBandwidth(bandwidth, "maxBandwidth");
		this.encoderCtl(EncoderCtl.SetMaxBandwidth, bandwidth);
	}
	setPacketLossPercent(percentage) {
		validateIntegerRange(percentage, 0, 100, "packetLossPercent");
		this.encoderCtl(EncoderCtl.SetPacketLossPercent, percentage);
	}
	setSignal(signal) {
		if (!Object.values(Signal).includes(signal)) throw new RangeError("signal must be Signal.Auto, Signal.Voice, or Signal.Music");
		this.encoderCtl(EncoderCtl.SetSignal, signal);
	}
	setVbr(enabled) {
		this.encoderCtl(EncoderCtl.SetVbr, enabled ? 1 : 0);
	}
	setVbrConstraint(enabled) {
		this.encoderCtl(EncoderCtl.SetVbrConstraint, enabled ? 1 : 0);
	}
	free() {
		if (this.#freed) return;
		this.#freeScratch();
		this.#module._oc_destroy_encoder(this.#ptr);
		this.#freed = true;
	}
	[Symbol.dispose]() {
		this.free();
	}
	#assertLive() {
		if (this.#freed) throw new Error("OpusEncoder has been freed");
	}
	#check(code, operation) {
		if (code < 0) throw createOpusError(this.#module, code, operation);
	}
	#ensurePacketBytes(requiredBytes) {
		if (this.#packetPtr !== 0 && this.#packetBytes >= requiredBytes) return this.#packetPtr;
		const nextPtr = checkedMalloc(this.#module, requiredBytes);
		if (this.#packetPtr !== 0) this.#module._free(this.#packetPtr);
		this.#packetPtr = nextPtr;
		this.#packetBytes = requiredBytes;
		return this.#packetPtr;
	}
	#ensurePcmBytes(requiredBytes) {
		if (this.#pcmPtr !== 0 && this.#pcmBytes >= requiredBytes) return this.#pcmPtr;
		const nextPtr = checkedMalloc(this.#module, requiredBytes);
		if (this.#pcmPtr !== 0) this.#module._free(this.#pcmPtr);
		this.#pcmPtr = nextPtr;
		this.#pcmBytes = requiredBytes;
		return this.#pcmPtr;
	}
	#freeScratch() {
		if (this.#packetPtr !== 0) this.#module._free(this.#packetPtr);
		if (this.#pcmPtr !== 0) this.#module._free(this.#pcmPtr);
		this.#packetPtr = 0;
		this.#packetBytes = 0;
		this.#pcmPtr = 0;
		this.#pcmBytes = 0;
	}
};
var WasmOpusDecoder = class {
	channels;
	maxFrameSize;
	sampleRate;
	#freed = false;
	#module;
	#packetBytes = 0;
	#packetPtr = 0;
	#pcmBytes = 0;
	#pcmPtr = 0;
	#ptr;
	constructor(module, options) {
		this.#module = module;
		this.channels = options.channels;
		this.maxFrameSize = options.maxFrameSize;
		this.sampleRate = options.sampleRate;
		const errorPtr = module._malloc(4);
		try {
			const ptr = module._oc_create_decoder(options.sampleRate, options.channels, errorPtr);
			const error = module.HEAP32[errorPtr >> 2] ?? 0;
			if (!ptr || error !== 0) throw createOpusError(module, error, "createDecoder");
			this.#ptr = ptr;
		} finally {
			module._free(errorPtr);
		}
	}
	decode(packet, options = {}) {
		this.#assertLive();
		const frameSize = this.#resolveDecodeFrameSize(packet, options);
		const pcmBytes = frameSize * this.channels * 2;
		const pcmPtr = this.#ensurePcmBytes(pcmBytes);
		const { packetLength, packetPtr } = this.#copyPacket(packet, options.decodeFec);
		const decodedSamples = this.#module._oc_decode(this.#ptr, packetPtr, packetLength, pcmPtr, frameSize, options.decodeFec ? 1 : 0);
		if (decodedSamples < 0) throw createOpusError(this.#module, decodedSamples, packet === null ? "decodePacketLoss" : "decode");
		const sampleCount = decodedSamples * this.channels;
		return this.#module.HEAP16.slice(pcmPtr >> 1, (pcmPtr >> 1) + sampleCount);
	}
	decodeFloat(packet, options = {}) {
		this.#assertLive();
		const frameSize = this.#resolveDecodeFrameSize(packet, options);
		const pcmBytes = frameSize * this.channels * 4;
		const pcmPtr = this.#ensurePcmBytes(pcmBytes);
		const { packetLength, packetPtr } = this.#copyPacket(packet, options.decodeFec);
		const decodedSamples = this.#module._oc_decode_float(this.#ptr, packetPtr, packetLength, pcmPtr, frameSize, options.decodeFec ? 1 : 0);
		if (decodedSamples < 0) throw createOpusError(this.#module, decodedSamples, packet === null ? "decodePacketLossFloat" : "decodeFloat");
		const sampleCount = decodedSamples * this.channels;
		return this.#module.HEAPF32.slice(pcmPtr >> 2, (pcmPtr >> 2) + sampleCount);
	}
	decodeFrames(packets, options = {}) {
		return packets.map((packet) => this.decode(packet, options));
	}
	decodeFloatFrames(packets, options = {}) {
		return packets.map((packet) => this.decodeFloat(packet, options));
	}
	decodePacketLoss(frameSize = samplesForDuration(this.sampleRate, DEFAULT_FRAME_DURATION_MS)) {
		return this.decode(null, { frameSize });
	}
	decodePacketLossFloat(frameSize = samplesForDuration(this.sampleRate, DEFAULT_FRAME_DURATION_MS)) {
		return this.decodeFloat(null, { frameSize });
	}
	decoderCtl(request, value) {
		this.#assertLive();
		validateInteger(request, "request");
		validateInteger(value, "value");
		if (!DECODER_INTEGER_CTL_REQUESTS.has(request)) throw new RangeError("decoderCtl only supports integer setter requests");
		const code = this.#module._oc_decoder_ctl(this.#ptr, request, value);
		if (code < 0) throw createOpusError(this.#module, code, "decoderCtl");
	}
	free() {
		if (this.#freed) return;
		this.#freeScratch();
		this.#module._oc_destroy_decoder(this.#ptr);
		this.#freed = true;
	}
	[Symbol.dispose]() {
		this.free();
	}
	#assertLive() {
		if (this.#freed) throw new Error("OpusDecoder has been freed");
	}
	#copyPacket(packet, decodeFec) {
		if (packet === null) {
			if (decodeFec) throw new RangeError("decodeFec requires a packet");
			return {
				packetLength: 0,
				packetPtr: 0
			};
		}
		if (packet.byteLength === 0) throw new RangeError("packet must not be empty; use null or decodePacketLoss() for PLC");
		const packetPtr = this.#ensurePacketBytes(packet.byteLength);
		this.#module.HEAPU8.set(packet, packetPtr);
		return {
			packetLength: packet.byteLength,
			packetPtr
		};
	}
	#ensurePacketBytes(requiredBytes) {
		if (this.#packetPtr !== 0 && this.#packetBytes >= requiredBytes) return this.#packetPtr;
		const nextPtr = checkedMalloc(this.#module, requiredBytes);
		if (this.#packetPtr !== 0) this.#module._free(this.#packetPtr);
		this.#packetPtr = nextPtr;
		this.#packetBytes = requiredBytes;
		return this.#packetPtr;
	}
	#ensurePcmBytes(requiredBytes) {
		if (this.#pcmPtr !== 0 && this.#pcmBytes >= requiredBytes) return this.#pcmPtr;
		const nextPtr = checkedMalloc(this.#module, requiredBytes);
		if (this.#pcmPtr !== 0) this.#module._free(this.#pcmPtr);
		this.#pcmPtr = nextPtr;
		this.#pcmBytes = requiredBytes;
		return this.#pcmPtr;
	}
	#freeScratch() {
		if (this.#packetPtr !== 0) this.#module._free(this.#packetPtr);
		if (this.#pcmPtr !== 0) this.#module._free(this.#pcmPtr);
		this.#packetPtr = 0;
		this.#packetBytes = 0;
		this.#pcmPtr = 0;
		this.#pcmBytes = 0;
	}
	#resolveDecodeFrameSize(packet, options) {
		const frameSize = packet === null || options.decodeFec ? options.frameSize ?? options.maxFrameSize ?? samplesForDuration(this.sampleRate, DEFAULT_FRAME_DURATION_MS) : options.maxFrameSize ?? this.maxFrameSize;
		if (packet === null || options.decodeFec) {
			validatePlcFrameSize(frameSize, this.sampleRate, "frameSize");
			return frameSize;
		}
		validateDecodeCapacity(frameSize, this.sampleRate, "maxFrameSize");
		return frameSize;
	}
};
var OpusError = class extends Error {
	code;
	operation;
	constructor(code, message, operation) {
		super(message);
		this.name = "OpusError";
		this.code = code;
		this.operation = operation;
	}
};
async function getModule() {
	modulePromise ??= Module$1();
	return await modulePromise;
}
function createOpusError(module, code, operation) {
	return new OpusError(code, `libopus ${operation} failed (${code}): ${module.UTF8ToString(module._oc_strerror(code))}`, operation);
}
function toUint8Array(input) {
	return input instanceof Uint8Array ? input : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
}
function normalizeEncoderOptions(options) {
	const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;
	const channels = options.channels ?? DEFAULT_CHANNELS;
	validateCodecOptions({
		channels,
		sampleRate
	});
	const frameSize = options.frameSize ?? samplesForDuration(sampleRate, DEFAULT_FRAME_DURATION_MS);
	validateEncodeFrameSize(frameSize, sampleRate, "frameSize");
	if (options.maxBandwidth !== void 0) validateBandwidth(options.maxBandwidth, "maxBandwidth");
	return {
		application: options.application ?? Application.Audio,
		bitrate: normalizeBitrate(options.bitrate ?? 64e3),
		channels,
		complexity: options.complexity ?? 10,
		dtx: options.dtx ?? false,
		fec: options.fec ?? false,
		frameSize,
		maxBandwidth: options.maxBandwidth,
		packetLossPercent: options.packetLossPercent ?? 0,
		sampleRate,
		signal: options.signal ?? Signal.Auto,
		vbr: options.vbr,
		vbrConstraint: options.vbrConstraint
	};
}
function normalizeDecoderOptions(options) {
	const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;
	const channels = options.channels ?? DEFAULT_CHANNELS;
	validateCodecOptions({
		channels,
		sampleRate
	});
	const maxFrameSize = options.maxFrameSize ?? samplesForDuration(sampleRate, MAX_PACKET_DURATION_MS);
	validateDecodeCapacity(maxFrameSize, sampleRate, "maxFrameSize");
	return {
		channels,
		maxFrameSize,
		sampleRate
	};
}
function samplesForDuration(sampleRate, durationMs) {
	return sampleRate / 1e3 * durationMs;
}
function validateCodecOptions(options) {
	if (!VALID_SAMPLE_RATES.includes(options.sampleRate)) throw new RangeError("sampleRate must be 8000, 12000, 16000, 24000, or 48000");
	if (options.channels !== 1 && options.channels !== 2) throw new RangeError("channels must be 1 or 2");
}
function normalizeBitrate(bitrate) {
	if (bitrate === "auto") return Bitrate.Auto;
	if (bitrate === "max") return Bitrate.Max;
	if (bitrate === Bitrate.Auto || bitrate === Bitrate.Max) return bitrate;
	validatePositiveInteger(bitrate, "bitrate");
	return bitrate;
}
function validateBandwidth(bandwidth, name) {
	if (!Object.values(Bandwidth).includes(bandwidth)) throw new RangeError(`${name} must be Bandwidth.Narrowband, Bandwidth.Mediumband, Bandwidth.Wideband, Bandwidth.Superwideband, or Bandwidth.Fullband`);
}
function validateEncodeFrameSize(frameSize, sampleRate, name) {
	validateFrameSizeForDurations(frameSize, sampleRate, name, ENCODE_FRAME_DURATIONS_MS);
}
function validateDecodeCapacity(frameSize, sampleRate, name) {
	const maxFrameSize = samplesForDuration(sampleRate, MAX_PACKET_DURATION_MS);
	if (!Number.isInteger(frameSize) || frameSize <= 0 || frameSize > maxFrameSize) throw new RangeError(`${name} must be an integer from 1 to ${maxFrameSize} samples at ${sampleRate} Hz`);
}
function validatePlcFrameSize(frameSize, sampleRate, name) {
	const minFrameSize = samplesForDuration(sampleRate, 2.5);
	const maxFrameSize = samplesForDuration(sampleRate, MAX_PACKET_DURATION_MS);
	if (!Number.isInteger(frameSize) || frameSize < minFrameSize || frameSize > maxFrameSize || frameSize % minFrameSize !== 0) throw new RangeError(`${name} must be a multiple of ${minFrameSize} samples from ${minFrameSize} to ${maxFrameSize} at ${sampleRate} Hz`);
}
function validateFrameSizeForDurations(frameSize, sampleRate, name, durationsMs) {
	const validFrameSizes = durationsMs.map((durationMs) => samplesForDuration(sampleRate, durationMs));
	if (!Number.isInteger(frameSize) || !validFrameSizes.includes(frameSize)) throw new RangeError(`${name} must be one of ${validFrameSizes.join(", ")} samples at ${sampleRate} Hz`);
}
function validateInteger(value, name) {
	if (!Number.isInteger(value)) throw new RangeError(`${name} must be an integer`);
}
function validatePositiveInteger(value, name) {
	if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer`);
}
function validateIntegerRange(value, min, max, name) {
	if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(`${name} must be an integer from ${min} to ${max}`);
}
function checkedMalloc(module, bytes) {
	const ptr = module._malloc(bytes);
	if (ptr === 0) throw new Error(`WASM malloc failed for ${bytes} bytes`);
	return ptr;
}
//#endregion
//#region extensions/discord/src/voice/audio.ts
const SAMPLE_RATE = 48e3;
const CHANNELS = 2;
const BIT_DEPTH = 16;
const FFMPEG_ERROR_OUTPUT_BYTES = 8192;
const DISCORD_OPUS_FRAME_SIZE = 960;
const DISCORD_OPUS_FRAME_BYTES = DISCORD_OPUS_FRAME_SIZE * CHANNELS * (BIT_DEPTH / 8);
const FFMPEG_PCM_ARGUMENTS = [
	"-analyzeduration",
	"0",
	"-loglevel",
	"error",
	"-vn",
	"-sn",
	"-dn",
	"-f",
	"s16le",
	"-ar",
	String(SAMPLE_RATE),
	"-ac",
	String(CHANNELS)
];
let warnedOpusMissing = false;
function buildWavBuffer(pcm) {
	const blockAlign = CHANNELS * BIT_DEPTH / 8;
	const byteRate = SAMPLE_RATE * blockAlign;
	const header = Buffer.alloc(44);
	header.write("RIFF", 0);
	header.writeUInt32LE(36 + pcm.length, 4);
	header.write("WAVE", 8);
	header.write("fmt ", 12);
	header.writeUInt32LE(16, 16);
	header.writeUInt16LE(1, 20);
	header.writeUInt16LE(CHANNELS, 22);
	header.writeUInt32LE(SAMPLE_RATE, 24);
	header.writeUInt32LE(byteRate, 28);
	header.writeUInt16LE(blockAlign, 32);
	header.writeUInt16LE(BIT_DEPTH, 34);
	header.write("data", 36);
	header.writeUInt32LE(pcm.length, 40);
	return Buffer.concat([header, pcm]);
}
async function createOpusDecoder(params) {
	let decoder;
	try {
		decoder = await createDecoder({
			channels: CHANNELS,
			sampleRate: SAMPLE_RATE
		});
	} catch (err) {
		const failure = formatErrorMessage(err);
		if (!warnedOpusMissing) {
			warnedOpusMissing = true;
			params.onWarn(`discord voice: no usable opus decoder available (libopus-wasm: ${failure}); cannot decode voice audio`);
		}
		return null;
	}
	return {
		name: "libopus-wasm",
		decoder: {
			decode: (buffer) => pcmInt16ToBuffer(decoder.decode(buffer, { maxFrameSize: DISCORD_OPUS_FRAME_SIZE })),
			free: () => decoder.free()
		}
	};
}
function createDiscordOpusEncodeStream() {
	return new DiscordOpusEncodeStream();
}
function createDiscordOpusPlaybackStream(input) {
	const inputSource = typeof input === "string" ? input : "pipe:0";
	const ffmpeg = spawn(resolveFfmpegBin(), [
		"-i",
		inputSource,
		...FFMPEG_PCM_ARGUMENTS,
		"pipe:1"
	], {
		stdio: [
			"pipe",
			"pipe",
			"pipe"
		],
		windowsHide: true
	});
	const opusStream = createDiscordOpusEncodeStream();
	let stderr = "";
	let ffmpegClosed = false;
	ffmpeg.stderr.setEncoding("utf8");
	ffmpeg.stderr.on("data", (chunk) => {
		if (stderr.length < FFMPEG_ERROR_OUTPUT_BYTES) stderr = `${stderr}${chunk}`.slice(0, FFMPEG_ERROR_OUTPUT_BYTES);
	});
	ffmpeg.once("error", (err) => {
		opusStream.destroy(err);
	});
	ffmpeg.once("close", (code, signal) => {
		ffmpegClosed = true;
		if (code && code !== 0) {
			const suffix = stderr.trim() ? `: ${stderr.trim()}` : "";
			opusStream.destroy(/* @__PURE__ */ new Error(`ffmpeg exited with code ${code}${suffix}`));
			return;
		}
		if (signal) opusStream.destroy(/* @__PURE__ */ new Error(`ffmpeg exited with signal ${signal}`));
	});
	ffmpeg.stdout.on("error", (err) => opusStream.destroy(err));
	ffmpeg.stdin.on("error", (err) => {
		if (err.code !== "EPIPE") opusStream.destroy(err);
	});
	ffmpeg.stdout.pipe(opusStream);
	opusStream.once("close", () => {
		if (!ffmpegClosed && !opusStream.readableEnded) ffmpeg.kill();
	});
	if (typeof input !== "string") {
		input.on("error", (err) => {
			ffmpeg.stdin.destroy(err);
			opusStream.destroy(err);
		});
		input.pipe(ffmpeg.stdin);
	} else ffmpeg.stdin.end();
	return opusStream;
}
var DiscordOpusEncodeStream = class extends Transform {
	#buffer = Buffer.alloc(0);
	#encoder = null;
	#encoderPromise = null;
	constructor() {
		super({ readableObjectMode: true });
	}
	async #getEncoder() {
		if (!this.#encoderPromise) this.#encoderPromise = createEncoder({
			application: Application.Audio,
			channels: CHANNELS,
			sampleRate: SAMPLE_RATE
		});
		if (!this.#encoder) this.#encoder = await this.#encoderPromise;
		return this.#encoder;
	}
	async _transform(chunk, _encoding, done) {
		try {
			const encoder = await this.#getEncoder();
			this.#buffer = this.#buffer.length > 0 ? Buffer.concat([this.#buffer, chunk]) : Buffer.from(chunk);
			while (this.#buffer.length >= DISCORD_OPUS_FRAME_BYTES) {
				const frame = this.#buffer.subarray(0, DISCORD_OPUS_FRAME_BYTES);
				this.#buffer = this.#buffer.subarray(DISCORD_OPUS_FRAME_BYTES);
				this.push(Buffer.from(encoder.encode(frame, { frameSize: DISCORD_OPUS_FRAME_SIZE })));
			}
			done();
		} catch (err) {
			done(err instanceof Error ? err : new Error(formatErrorMessage(err)));
		}
	}
	async _final(done) {
		try {
			if (this.#buffer.length > 0) {
				const encoder = await this.#getEncoder();
				const frame = Buffer.alloc(DISCORD_OPUS_FRAME_BYTES);
				this.#buffer.copy(frame);
				this.#buffer = Buffer.alloc(0);
				this.push(Buffer.from(encoder.encode(frame, { frameSize: DISCORD_OPUS_FRAME_SIZE })));
			}
			this.#freeEncoder();
			done();
		} catch (err) {
			done(err instanceof Error ? err : new Error(formatErrorMessage(err)));
		}
	}
	_destroy(err, done) {
		this.#freeEncoder();
		done(err);
	}
	#freeEncoder() {
		this.#encoder?.free();
		this.#encoder = null;
	}
};
function pcmInt16ToBuffer(pcm) {
	return Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
}
async function decodeOpusStream(stream, params) {
	const selected = await createOpusDecoder({ onWarn: params.onWarn });
	if (!selected) return Buffer.alloc(0);
	params.onVerbose(`opus decoder: ${selected.name}`);
	const chunks = [];
	try {
		for await (const chunk of stream) {
			if (!chunk || !(chunk instanceof Buffer) || chunk.length === 0) continue;
			const decoded = await selected.decoder.decode(chunk);
			if (decoded && decoded.length > 0) chunks.push(Buffer.from(decoded));
		}
	} catch (err) {
		params.onError?.(err);
		if (shouldLogVerbose()) logVerbose(`discord voice: opus decode failed: ${formatErrorMessage(err)}`);
	} finally {
		await selected.decoder.free?.();
	}
	return chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0);
}
async function decodeOpusStreamChunks(stream, params) {
	const selected = await createOpusDecoder({ onWarn: params.onWarn });
	if (!selected) return;
	params.onVerbose(`opus decoder: ${selected.name}`);
	try {
		for await (const chunk of stream) {
			if (!chunk || !(chunk instanceof Buffer) || chunk.length === 0) continue;
			const decoded = await selected.decoder.decode(chunk);
			if (decoded && decoded.length > 0) params.onChunk(Buffer.from(decoded));
		}
	} catch (err) {
		params.onError?.(err);
		if (shouldLogVerbose()) logVerbose(`discord voice: opus decode failed: ${formatErrorMessage(err)}`);
	} finally {
		await selected.decoder.free?.();
	}
}
function convertDiscordPcm48kStereoToRealtimePcm24kMono(pcm) {
	const frameCount = Math.floor(pcm.length / 4);
	if (frameCount === 0) return Buffer.alloc(0);
	const mono48k = Buffer.alloc(frameCount * 2);
	for (let frame = 0; frame < frameCount; frame += 1) {
		const offset = frame * 4;
		const left = pcm.readInt16LE(offset);
		const right = pcm.readInt16LE(offset + 2);
		mono48k.writeInt16LE(Math.round((left + right) / 2), frame * 2);
	}
	return resamplePcm(mono48k, SAMPLE_RATE, 24e3);
}
function convertRealtimePcm24kMonoToDiscordPcm48kStereo(pcm) {
	const mono48k = resamplePcm(pcm, 24e3, SAMPLE_RATE);
	const sampleCount = Math.floor(mono48k.length / 2);
	if (sampleCount === 0) return Buffer.alloc(0);
	const stereo = Buffer.alloc(sampleCount * 4);
	for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
		const sample = mono48k.readInt16LE(sampleIndex * 2);
		const offset = sampleIndex * 4;
		stereo.writeInt16LE(sample, offset);
		stereo.writeInt16LE(sample, offset + 2);
	}
	return stereo;
}
function estimateDurationSeconds(pcm) {
	const bytesPerSample = BIT_DEPTH / 8 * CHANNELS;
	return pcm.length / (bytesPerSample * SAMPLE_RATE);
}
async function writeVoiceWavFile(pcm) {
	const workspace = await tempWorkspace({
		rootDir: resolvePreferredOpenClawTmpDir(),
		prefix: "discord-voice-"
	});
	const wav = buildWavBuffer(pcm);
	const filePath = await workspace.write("segment.wav", wav);
	scheduleTempCleanup(workspace.dir);
	return {
		path: filePath,
		durationSeconds: estimateDurationSeconds(pcm)
	};
}
function scheduleTempCleanup(tempDir, delayMs = 1800 * 1e3) {
	setTimeout(() => {
		fs.rm(tempDir, {
			recursive: true,
			force: true
		}).catch((err) => {
			if (shouldLogVerbose()) logVerbose(`discord voice: temp cleanup failed for ${tempDir}: ${formatErrorMessage(err)}`);
		});
	}, delayMs).unref();
}
//#endregion
//#region extensions/discord/src/voice/capture-state.ts
function createVoiceCaptureState() {
	return {
		activeSpeakers: /* @__PURE__ */ new Set(),
		activeCaptureStreams: /* @__PURE__ */ new Map(),
		captureFinalizeTimers: /* @__PURE__ */ new Map(),
		captureGenerations: /* @__PURE__ */ new Map()
	};
}
function stopVoiceCaptureState(state) {
	for (const { timer } of state.captureFinalizeTimers.values()) clearTimeout(timer);
	state.captureFinalizeTimers.clear();
	for (const { stream } of state.activeCaptureStreams.values()) stream.destroy();
	state.activeCaptureStreams.clear();
	state.captureGenerations.clear();
	state.activeSpeakers.clear();
}
function getActiveVoiceCapture(state, userId) {
	return state.activeCaptureStreams.get(userId);
}
function isVoiceCaptureActive(state, userId) {
	return state.activeSpeakers.has(userId);
}
function clearVoiceCaptureFinalizeTimer(state, userId, generation) {
	const scheduled = state.captureFinalizeTimers.get(userId);
	if (!scheduled || generation !== void 0 && scheduled.generation !== generation) return false;
	clearTimeout(scheduled.timer);
	state.captureFinalizeTimers.delete(userId);
	return true;
}
function beginVoiceCapture(state, userId, stream) {
	const generation = (state.captureGenerations.get(userId) ?? 0) + 1;
	state.captureGenerations.set(userId, generation);
	state.activeSpeakers.add(userId);
	state.activeCaptureStreams.set(userId, {
		generation,
		stream
	});
	clearVoiceCaptureFinalizeTimer(state, userId, generation);
	return generation;
}
function finishVoiceCapture(state, userId, generation) {
	clearVoiceCaptureFinalizeTimer(state, userId, generation);
	if (state.activeCaptureStreams.get(userId)?.generation !== generation) return false;
	state.activeCaptureStreams.delete(userId);
	state.activeSpeakers.delete(userId);
	return true;
}
function scheduleVoiceCaptureFinalize(params) {
	const { state, userId, delayMs, onFinalize } = params;
	const capture = state.activeCaptureStreams.get(userId);
	if (!capture) return false;
	clearVoiceCaptureFinalizeTimer(state, userId, capture.generation);
	const timer = setTimeout(() => {
		const activeCapture = state.activeCaptureStreams.get(userId);
		if (!activeCapture || activeCapture.generation !== capture.generation) return;
		state.captureFinalizeTimers.delete(userId);
		state.activeCaptureStreams.delete(userId);
		state.activeSpeakers.delete(userId);
		onFinalize?.(activeCapture);
		activeCapture.stream.destroy();
	}, delayMs);
	state.captureFinalizeTimers.set(userId, {
		generation: capture.generation,
		timer
	});
	return true;
}
const logger$3 = createSubsystemLogger("discord/voice");
function summarizeAgentTurnPayloads(payloads) {
	let textPayloads = 0;
	let nonEmptyTextPayloads = 0;
	let reasoningPayloads = 0;
	let errorPayloads = 0;
	let mediaPayloads = 0;
	for (const payload of payloads) {
		if (!payload || typeof payload !== "object") continue;
		const record = payload;
		const text = record.text;
		if (typeof text === "string") {
			textPayloads += 1;
			if (text.trim()) nonEmptyTextPayloads += 1;
		}
		if (record.isReasoning === true) reasoningPayloads += 1;
		if (record.isError === true) errorPayloads += 1;
		if (typeof record.mediaUrl === "string" || Array.isArray(record.mediaUrls) && record.mediaUrls.length > 0) mediaPayloads += 1;
	}
	return `payloadCount=${payloads.length} textPayloads=${textPayloads} nonEmptyTextPayloads=${nonEmptyTextPayloads} reasoningPayloads=${reasoningPayloads} errorPayloads=${errorPayloads} mediaPayloads=${mediaPayloads}`;
}
async function resolveDiscordVoiceIngressContext(params) {
	const { entry, userId } = params;
	if (!entry.guildName) entry.guildName = await params.fetchGuildName(entry.guildId);
	const speaker = await params.speakerContext.resolveContext(entry.guildId, userId);
	const speakerIdentity = await params.speakerContext.resolveIdentity(entry.guildId, userId);
	const access = await authorizeDiscordVoiceIngress({
		cfg: params.cfg,
		discordConfig: params.discordConfig,
		guildName: entry.guildName,
		guildId: entry.guildId,
		channelId: entry.channelId,
		channelName: entry.channelName,
		channelSlug: entry.channelName ? normalizeDiscordSlug(entry.channelName) : "",
		channelLabel: formatMention({ channelId: entry.channelId }),
		memberRoleIds: speakerIdentity.memberRoleIds,
		ownerAllowFrom: params.ownerAllowFrom,
		sender: {
			id: speakerIdentity.id,
			name: speakerIdentity.name,
			tag: speakerIdentity.tag
		}
	});
	if (!access.ok) return null;
	return {
		extraSystemPrompt: buildDiscordGroupSystemPrompt(access.channelConfig),
		senderIsOwner: speaker.senderIsOwner,
		speakerLabel: speaker.label
	};
}
async function runDiscordVoiceAgentTurn(params) {
	const context = params.context ?? await resolveDiscordVoiceIngressContext({
		entry: params.entry,
		userId: params.userId,
		cfg: params.cfg,
		discordConfig: params.discordConfig,
		ownerAllowFrom: params.ownerAllowFrom,
		fetchGuildName: params.fetchGuildName,
		speakerContext: params.speakerContext
	});
	if (!context) return null;
	const voiceModel = normalizeOptionalString(params.discordConfig.voice?.model);
	const payloads = (await agentCommandFromIngress({
		message: params.message,
		sessionKey: params.entry.route.sessionKey,
		agentId: params.entry.route.agentId,
		messageChannel: "discord",
		messageProvider: "discord-voice",
		extraSystemPrompt: context.extraSystemPrompt,
		allowModelOverride: Boolean(voiceModel),
		model: voiceModel,
		toolsAllow: params.toolsAllow,
		deliver: false
	}, params.runtime)).payloads ?? [];
	const text = payloads.map((payload) => payload.text).filter((entry) => typeof entry === "string" && entry.trim()).join("\n").trim();
	if (!text) logger$3.info(`discord voice: agent turn produced no speakable payloads guild=${params.entry.guildId} channel=${params.entry.channelId} voiceSession=${params.entry.voiceSessionKey} supervisorSession=${params.entry.route.sessionKey} agent=${params.entry.route.agentId} user=${params.userId} ${summarizeAgentTurnPayloads(payloads)}`);
	return {
		context,
		text
	};
}
async function resolveDiscordVoiceRealtimeBootstrapContext(params) {
	const files = (params.discordConfig.voice?.realtime)?.bootstrapContextFiles;
	if (files?.length === 0) return;
	try {
		return await resolveRealtimeBootstrapContextInstructions({
			config: params.cfg,
			agentId: params.entry.route.agentId,
			sessionKey: params.entry.route.sessionKey,
			files,
			warn: (message) => logger$3.warn(`discord voice: realtime bootstrap context: ${message}`)
		});
	} catch (error) {
		logger$3.warn(`discord voice: realtime bootstrap context unavailable: ${error instanceof Error ? error.message : String(error)}`);
		return;
	}
}
//#endregion
//#region extensions/discord/src/voice/agent-control.ts
async function maybeControlDiscordVoiceAgentRun(params) {
	if (!shouldAutoControlRealtimeVoiceAgentText(params.text)) return { handled: false };
	const result = await controlRealtimeVoiceAgentRun({
		sessionKey: params.entry.route.sessionKey,
		text: params.text
	});
	if (!result.active) return {
		handled: false,
		result
	};
	return {
		handled: true,
		result,
		...result.speak && !result.suppress ? { speakText: result.message } : {}
	};
}
//#endregion
//#region extensions/discord/src/voice/prompt.ts
const DISCORD_VOICE_SPOKEN_OUTPUT_CONTRACT = [
	"You are OpenClaw's Discord voice interface in a live voice channel.",
	"Discord voice reply requirements:",
	"- Return only the concise text that should be spoken aloud in the voice channel.",
	"- Treat the transcript as speech-to-text from a live conversation; repair obvious transcription artifacts and ignore repeated partial fragments caused by voice buffering.",
	"- If the transcript is garbled, incomplete, or missing the user's intent, ask one brief clarifying question instead of guessing.",
	"- If the request needs deeper reasoning, current information, or tools, use the available tools before answering.",
	"- Do not call the tts tool; Discord voice will synthesize and play the returned text.",
	"- Do not reply with NO_REPLY unless no spoken response is appropriate.",
	"- Keep the response brief, natural, and conversational. Prefer one to three short sentences.",
	"- Avoid markdown tables, code fences, citations, and visual formatting unless the user explicitly asks for something that cannot be spoken naturally."
].join("\n");
function formatVoiceIngressPrompt(transcript, speakerLabel) {
	const cleanedTranscript = transcript.trim();
	const cleanedLabel = speakerLabel?.trim();
	return [DISCORD_VOICE_SPOKEN_OUTPUT_CONTRACT, cleanedLabel ? [`Voice transcript from speaker "${cleanedLabel}":`, cleanedTranscript].join("\n") : cleanedTranscript].join("\n\n");
}
//#endregion
//#region extensions/discord/src/voice/sdk-runtime.ts
let cachedDiscordVoiceSdk = null;
function loadDiscordVoiceSdk() {
	if (cachedDiscordVoiceSdk) return cachedDiscordVoiceSdk;
	cachedDiscordVoiceSdk = createRequire(import.meta.url)("@discordjs/voice");
	return cachedDiscordVoiceSdk;
}
const CAPTURE_FINALIZE_GRACE_MS = 2e3;
const VOICE_CONNECT_READY_TIMEOUT_MS = 3e4;
const VOICE_RECONNECT_GRACE_MS = 15e3;
const PLAYBACK_READY_TIMEOUT_MS = 6e4;
const SPEAKING_READY_TIMEOUT_MS = 6e4;
function resolveVoiceTimeoutMs(value, fallbackMs) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallbackMs;
	return Math.floor(value);
}
function logVoiceVerbose(message) {
	logVerbose(`discord voice: ${message}`);
}
function isVoiceChannel(type) {
	return type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice;
}
//#endregion
//#region extensions/discord/src/voice/realtime.ts
const logger$2 = createSubsystemLogger("discord/voice");
function resolveDiscordRealtimeVoiceAgentConsultTools(policy) {
	const tools = resolveRealtimeVoiceAgentConsultTools(policy);
	if (policy !== "none" && !tools.some((tool) => tool.name === REALTIME_VOICE_AGENT_CONTROL_TOOL.name)) return [...tools, REALTIME_VOICE_AGENT_CONTROL_TOOL];
	return tools;
}
const DISCORD_REALTIME_TALKBACK_DEBOUNCE_MS = 350;
const DISCORD_REALTIME_FALLBACK_TEXT = "I hit an error while checking that. Please try again.";
const DISCORD_REALTIME_PENDING_SPEAKER_CONTEXT_LIMIT = 32;
const DISCORD_REALTIME_RECENT_AGENT_PROXY_CONSULT_LIMIT = 16;
const DISCORD_REALTIME_RECENT_AGENT_PROXY_CONSULT_TTL_MS = 15e3;
const DISCORD_REALTIME_IGNORED_WAKE_NAME_CONTEXT_TTL_MS = 1e4;
const DISCORD_REALTIME_WAKE_NAME_FOLLOWUP_TTL_MS = 1e4;
const DISCORD_REALTIME_LOG_PREVIEW_CHARS = 500;
const DISCORD_REALTIME_DEFAULT_MIN_BARGE_IN_AUDIO_END_MS = 250;
const DISCORD_REALTIME_FORCED_CONSULT_FALLBACK_DELAY_MS = 200;
const DISCORD_REALTIME_DUPLICATE_ERROR_SUPPRESS_MS = 6e4;
const DISCORD_REALTIME_CONTROL_SPEECH_DEDUPE_MS = 5e3;
const DISCORD_REALTIME_OUTPUT_PLAYBACK_WATCHDOG_MARGIN_MS = 1500;
const DISCORD_REALTIME_WAKE_ACKS = [
	"Yeah.",
	"Mm-hmm.",
	"Got it.",
	"One sec."
];
const REALTIME_PCM16_BYTES_PER_SAMPLE = 2;
const DISCORD_RAW_PCM_FRAME_BYTES = 3840;
const DISCORD_REALTIME_OUTPUT_PREROLL_FRAMES = 25;
const DISCORD_REALTIME_TRAILING_SILENCE_MIN_MS = 700;
const DISCORD_REALTIME_TRAILING_SILENCE_MAX_MS = 3e3;
const DISCORD_REALTIME_FORCED_CONSULT_REASON = "provider_final_transcript_without_openclaw_agent_consult";
const DISCORD_REALTIME_VERBOSE_OMITTED_EVENTS = new Set([
	"conversation.output_audio.delta",
	"input_audio_buffer.append",
	"response.audio.delta",
	"response.output_audio.delta"
]);
function formatRealtimeLogPreview(text) {
	const oneLine = text.replace(/\s+/g, " ").trim();
	if (oneLine.length <= DISCORD_REALTIME_LOG_PREVIEW_CHARS) return oneLine;
	return `${oneLine.slice(0, DISCORD_REALTIME_LOG_PREVIEW_CHARS)}...`;
}
function formatRealtimeInterruptionLog(event) {
	const detail = event.detail ? ` ${event.detail}` : "";
	if (event.direction === "client") {
		if (event.type === "response.cancel") return `discord voice: realtime model interrupt requested ${event.direction}:${event.type}${detail}`;
		if (event.type === "conversation.item.truncate.skipped") return `discord voice: realtime model interrupt ignored ${event.direction}:${event.type}${detail}`;
		if (event.type === "conversation.item.truncate") return `discord voice: realtime model audio truncated ${event.direction}:${event.type}${detail}`;
	}
	if (event.direction === "server") {
		if (event.type === "response.cancelled") return `discord voice: realtime model interrupt confirmed ${event.direction}:${event.type}${detail}`;
		if (event.type === "response.done" && event.detail?.includes("status=cancelled")) return `discord voice: realtime model interrupt confirmed ${event.direction}:${event.type}${detail}`;
		if (event.type === "error" && event.detail === "Cancellation failed: no active response found") return `discord voice: realtime model interrupt raced ${event.direction}:${event.type}${detail}`;
	}
}
function formatRealtimeLifecycleLog(event) {
	if (!event.type.startsWith("session.")) return;
	const detail = event.detail ? ` ${event.detail}` : "";
	return `discord voice: realtime lifecycle ${event.direction}:${event.type}${detail}`;
}
function isRealtimeResponseCancelled(event) {
	return event.direction === "server" && (event.type === "response.cancelled" || event.type === "response.done" && event.detail?.includes("status=cancelled") === true);
}
function shouldLogRealtimeVerboseEvent(event) {
	return !DISCORD_REALTIME_VERBOSE_OMITTED_EVENTS.has(event.type);
}
function readProviderConfigString(config, key) {
	const value = config[key];
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function readProviderConfigBoolean(config, key) {
	return asBoolean(config?.[key]);
}
function resolveDiscordVoiceMode(voice) {
	const mode = voice?.mode;
	if (mode === "stt-tts" || mode === "bidi") return mode;
	return "agent-proxy";
}
function isDiscordRealtimeVoiceMode(mode) {
	return mode === "agent-proxy" || mode === "bidi";
}
function isDiscordAgentProxyVoiceMode(mode) {
	return mode === "agent-proxy";
}
function resolveDiscordRealtimeInterruptResponseOnInputAudio(params) {
	const providerConfig = params.realtimeConfig?.providers?.[params.providerId];
	return readProviderConfigBoolean(providerConfig, "interruptResponseOnInputAudio") ?? true;
}
function resolveDiscordRealtimeBargeIn(params) {
	const configured = params.realtimeConfig?.bargeIn;
	if (typeof configured === "boolean") return configured;
	return resolveDiscordRealtimeInterruptResponseOnInputAudio(params);
}
function buildDiscordSpeakExactUserMessage(text) {
	return [
		"Internal OpenClaw voice playback result.",
		"Do not call openclaw_agent_consult or any other tool for this message.",
		"Speak this exact OpenClaw answer to the Discord voice channel, without adding, removing, or rephrasing words.",
		`Answer: ${JSON.stringify(text)}`
	].join("\n");
}
function isEscapedQuote(text, quoteIndex) {
	let backslashes = 0;
	for (let index = quoteIndex - 1; index >= 0 && text[index] === "\\"; index -= 1) backslashes += 1;
	return backslashes % 2 === 1;
}
function readJsonStringAfterLabel(text, label) {
	const labelIndex = text.indexOf(label);
	if (labelIndex < 0) return;
	const quoteIndex = text.indexOf("\"", labelIndex + label.length);
	if (quoteIndex < 0) return;
	for (let index = quoteIndex + 1; index < text.length; index += 1) {
		if (text[index] !== "\"" || isEscapedQuote(text, index)) continue;
		try {
			const parsed = JSON.parse(text.slice(quoteIndex, index + 1));
			return typeof parsed === "string" ? parsed : void 0;
		} catch {
			return;
		}
	}
}
function collectRealtimeConsultArgStrings(args) {
	if (!args || typeof args !== "object") return typeof args === "string" ? [args] : [];
	const values = [];
	for (const key of [
		"question",
		"prompt",
		"query",
		"task",
		"context",
		"responseStyle"
	]) {
		const value = args[key];
		if (typeof value === "string") values.push(value);
	}
	return values;
}
function extractDiscordExactSpeechConsultText(args) {
	const message = collectRealtimeConsultArgStrings(args).join("\n");
	if (!message.includes("Speak this exact OpenClaw answer") && !message.includes("Speak the provided exact answer verbatim")) return;
	return readJsonStringAfterLabel(message, "Answer:") ?? readJsonStringAfterLabel(message, "Provided answer text:");
}
function normalizeControlSpeechText(text) {
	return text.toLowerCase().replace(/\s+/g, " ").trim();
}
function mergeRealtimePartialTranscript(previous, next) {
	const trimmed = next.trim();
	if (!trimmed) return previous;
	return (trimmed.startsWith(previous) ? trimmed : `${previous}${next}`).slice(-240);
}
function resolveDiscordRealtimeWakeNames(params) {
	const rawConfigured = params.config?.wakeNames;
	if (rawConfigured) return sortRealtimeVoiceActivationNames(uniqueStrings(rawConfigured.map((name) => normalizeSupportedRealtimeVoiceActivationName(name)).filter((name) => Boolean(name))));
	const agent = params.cfg.agents?.list?.find((candidate) => candidate.id === params.agentId);
	const configuredAgentNames = [agent?.name, agent?.identity?.name].map((name) => normalizeSupportedRealtimeVoiceActivationName(name)).filter((name) => Boolean(name));
	const productWakeNames = [normalizeSupportedRealtimeVoiceActivationName("OpenClaw")].filter((name) => Boolean(name));
	return sortRealtimeVoiceActivationNames(uniqueStrings(configuredAgentNames.length > 0 ? [...configuredAgentNames, ...productWakeNames] : [normalizeSupportedRealtimeVoiceActivationName(params.agentId), ...productWakeNames].filter((name) => Boolean(name))));
}
function matchesPendingAgentProxyQuestion(consultMessage, question) {
	return matchRealtimeVoiceConsultQuestions(consultMessage, question);
}
var DiscordRealtimeVoiceSession = class {
	constructor(params) {
		this.params = params;
		this.bridge = null;
		this.outputStream = null;
		this.stopped = false;
		this.consultToolPolicy = "safe-read-only";
		this.consultPolicy = "auto";
		this.requireWakeName = false;
		this.wakeNames = [];
		this.forcedConsults = createRealtimeVoiceForcedConsultCoordinator({
			limit: DISCORD_REALTIME_RECENT_AGENT_PROXY_CONSULT_LIMIT,
			nativeDedupeMs: DISCORD_REALTIME_RECENT_AGENT_PROXY_CONSULT_TTL_MS,
			questionsMatch: matchesPendingAgentProxyQuestion
		});
		this.speakerTurns = createRealtimeVoiceTurnContextTracker({
			limit: DISCORD_REALTIME_PENDING_SPEAKER_CONTEXT_LIMIT,
			ignoredContextTtlMs: DISCORD_REALTIME_IGNORED_WAKE_NAME_CONTEXT_TTL_MS,
			deferUntilAudio: true
		});
		this.outputActivity = createRealtimeVoiceOutputActivityTracker();
		this.outputPacedBuffer = Buffer.alloc(0);
		this.queuedExactSpeechMessages = [];
		this.exactSpeechResponseActive = false;
		this.exactSpeechAudioStarted = false;
		this.partialUserTranscript = "";
		this.wakeNameAckedForTurn = false;
		this.wakeNameAckIndex = 0;
		this.playerIdleHandler = () => {
			this.resetOutputStream("player-idle");
			this.completeExactSpeechResponse("player-idle");
		};
		this.talkback = createRealtimeVoiceAgentTalkbackQueue({
			debounceMs: this.realtimeConfig?.debounceMs ?? DISCORD_REALTIME_TALKBACK_DEBOUNCE_MS,
			isStopped: () => this.stopped,
			logger: logger$2,
			logPrefix: "[discord] realtime agent",
			responseStyle: "Brief, natural spoken answer for a Discord voice channel.",
			fallbackText: DISCORD_REALTIME_FALLBACK_TEXT,
			consult: async ({ question, responseStyle, metadata }) => {
				const context = isDiscordRealtimeSpeakerContext(metadata) ? metadata : void 0;
				return { text: await this.runAgentTurn({
					context,
					message: formatVoiceIngressPrompt([question, responseStyle ? `Spoken style: ${responseStyle}` : void 0].filter(Boolean).join("\n\n"), context?.speakerLabel ?? "Discord voice speaker")
				}) };
			},
			deliver: (text) => this.enqueueExactSpeechMessage(text)
		});
	}
	async connect() {
		const resolved = resolveConfiguredRealtimeVoiceProvider({
			configuredProviderId: this.realtimeConfig?.provider,
			providerConfigs: buildProviderConfigs(this.realtimeConfig),
			providerConfigOverrides: buildProviderConfigOverrides(this.realtimeConfig),
			cfg: this.params.cfg,
			defaultModel: this.realtimeConfig?.model,
			noRegisteredProviderMessage: "No configured realtime voice provider registered"
		});
		this.realtimeProviderId = resolved.provider.id;
		const isAgentProxy = isDiscordAgentProxyVoiceMode(this.params.mode);
		const defaultToolPolicy = isAgentProxy ? "owner" : "safe-read-only";
		const toolPolicy = resolveRealtimeVoiceAgentConsultToolPolicy(this.realtimeConfig?.toolPolicy, defaultToolPolicy);
		this.consultToolPolicy = toolPolicy;
		this.consultToolsAllow = resolveRealtimeVoiceAgentConsultToolsAllow(toolPolicy);
		const consultPolicy = this.realtimeConfig?.consultPolicy ?? (isAgentProxy ? "always" : "auto");
		this.consultPolicy = consultPolicy;
		const supportsWakeNameGate = resolved.provider.id === "openai";
		this.requireWakeName = this.realtimeConfig?.requireWakeName === true && isAgentProxy && supportsWakeNameGate;
		this.wakeNames = this.requireWakeName ? resolveDiscordRealtimeWakeNames({
			config: this.realtimeConfig,
			cfg: this.params.cfg,
			agentId: this.params.entry.route.agentId
		}) : [];
		const usesRealtimeAgentHandoff = this.params.mode === "bidi" || toolPolicy !== "none";
		const autoRespondToAudio = !this.requireWakeName && (!isAgentProxy || consultPolicy !== "always");
		const interruptResponseOnInputAudio = !this.requireWakeName && resolveDiscordRealtimeInterruptResponseOnInputAudio({
			realtimeConfig: this.realtimeConfig,
			providerId: resolved.provider.id
		});
		const instructions = buildDiscordRealtimeInstructions({
			mode: this.params.mode,
			instructions: this.realtimeConfig?.instructions,
			bootstrapContextInstructions: this.params.bootstrapContextInstructions,
			toolPolicy,
			consultPolicy
		});
		this.bridge = createRealtimeVoiceBridgeSession({
			provider: resolved.provider,
			providerConfig: resolved.providerConfig,
			audioFormat: REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ,
			instructions,
			autoRespondToAudio,
			interruptResponseOnInputAudio,
			markStrategy: "ack-immediately",
			tools: usesRealtimeAgentHandoff ? resolveDiscordRealtimeVoiceAgentConsultTools(toolPolicy) : [],
			audioSink: {
				isOpen: () => !this.stopped,
				sendAudio: (audio) => this.sendOutputAudio(audio),
				clearAudio: () => this.clearOutputAudio("provider-clear-audio")
			},
			onTranscript: (role, text, isFinal) => {
				if (isFinal && text.trim()) logger$2.info(`discord voice: realtime ${role} transcript (${text.length} chars): ${formatRealtimeLogPreview(text)}`);
				if (isFinal && role === "assistant") this.suppressDuplicateControlSpeech(text);
				if (role !== "user") return;
				if (!isFinal) {
					this.handlePartialUserTranscript(text);
					return;
				}
				this.handleFinalUserTranscript(text, { usesRealtimeAgentHandoff });
			},
			onToolCall: (event, session) => this.handleToolCall(event, session),
			onEvent: (event) => {
				const detail = event.detail ? ` ${event.detail}` : "";
				if (event.direction === "server" && event.type === "input_audio_buffer.speech_started") this.resetPartialWakeNameTracking();
				if (shouldLogRealtimeVerboseEvent(event)) logVoiceVerbose(`realtime ${event.direction}:${event.type}${detail}`);
				if (event.direction === "server" && (event.type === "response.done" || event.type === "response.cancelled")) {
					if (this.exactSpeechResponseActive && !this.exactSpeechAudioStarted) this.completeExactSpeechResponse(event.type);
					this.finishOutputAudioStream(event.type, { playBuffered: !isRealtimeResponseCancelled(event) });
				}
				const interruptionLog = formatRealtimeInterruptionLog(event);
				if (interruptionLog) logger$2.info(interruptionLog);
				const lifecycleLog = formatRealtimeLifecycleLog(event);
				if (lifecycleLog) logger$2.info(lifecycleLog);
			},
			onError: (error) => this.logRealtimeError(formatErrorMessage(error)),
			onClose: (reason) => {
				this.flushSuppressedRealtimeErrors();
				logVoiceVerbose(`realtime closed: ${reason}`);
			}
		});
		const resolvedModel = readProviderConfigString(resolved.providerConfig, "model") ?? resolved.provider.defaultModel;
		const resolvedVoice = readProviderConfigString(resolved.providerConfig, "voice");
		logger$2.info(`discord voice: realtime bridge starting mode=${this.params.mode} provider=${resolved.provider.id} model=${resolvedModel ?? "default"} voice=${resolvedVoice ?? "default"} consultPolicy=${consultPolicy} toolPolicy=${toolPolicy} autoRespond=${autoRespondToAudio} requireWakeName=${this.requireWakeName} wakeNames=${this.wakeNames.join(",") || "none"} interruptResponse=${interruptResponseOnInputAudio} bargeIn=${resolveDiscordRealtimeBargeIn({
			realtimeConfig: this.realtimeConfig,
			providerId: resolved.provider.id
		})} minBargeInAudioEndMs=${resolveDiscordRealtimeMinBargeInAudioEndMs(this.realtimeConfig)}`);
		const voiceSdk = loadDiscordVoiceSdk();
		this.params.entry.player.on(voiceSdk.AudioPlayerStatus.Idle, this.playerIdleHandler);
		await this.bridge.connect();
		logger$2.info(`discord voice: realtime bridge ready mode=${this.params.mode} provider=${resolved.provider.id} model=${resolvedModel ?? "default"} voice=${resolvedVoice ?? "default"}`);
	}
	close() {
		this.stopped = true;
		this.flushSuppressedRealtimeErrors();
		this.talkback.close();
		this.forcedConsults.clear();
		this.speakerTurns.clear();
		this.queuedExactSpeechMessages = [];
		this.exactSpeechResponseActive = false;
		this.exactSpeechAudioStarted = false;
		this.resetPartialWakeNameTracking();
		this.pendingWakeNameFollowup = void 0;
		this.clearOutputAudio("session-close");
		this.bridge?.close();
		this.bridge = null;
		this.realtimeProviderId = void 0;
		const voiceSdk = loadDiscordVoiceSdk();
		this.params.entry.player.off(voiceSdk.AudioPlayerStatus.Idle, this.playerIdleHandler);
	}
	logRealtimeError(message) {
		const now = Date.now();
		if (this.lastRealtimeError?.message === message && now - this.lastRealtimeError.lastLoggedAt < DISCORD_REALTIME_DUPLICATE_ERROR_SUPPRESS_MS) {
			this.lastRealtimeError.suppressed += 1;
			return;
		}
		this.flushSuppressedRealtimeErrors();
		this.lastRealtimeError = {
			message,
			suppressed: 0,
			lastLoggedAt: now
		};
		logger$2.warn(`discord voice: realtime error: ${message}`);
	}
	flushSuppressedRealtimeErrors() {
		if (!this.lastRealtimeError || this.lastRealtimeError.suppressed === 0) return;
		logger$2.warn(`discord voice: suppressed ${this.lastRealtimeError.suppressed} duplicate realtime errors: ${this.lastRealtimeError.message}`);
		this.lastRealtimeError.suppressed = 0;
	}
	beginSpeakerTurn(context, userId) {
		this.resetPartialWakeNameTracking();
		const turn = this.speakerTurns.open({
			...context,
			userId
		}, {
			inputDiscordBytes: 0,
			inputRealtimeBytes: 0,
			inputChunks: 0,
			interruptedPlayback: false
		});
		return {
			sendInputAudio: (discordPcm48kStereo) => this.sendInputAudioForTurn(turn, discordPcm48kStereo),
			close: () => {
				this.sendRealtimeTrailingSilenceForTurn(turn);
				this.logSpeakerTurnClosed(turn);
				this.speakerTurns.close(turn);
			}
		};
	}
	sendInputAudioForTurn(turn, discordPcm48kStereo) {
		if (!this.bridge || this.stopped) return;
		const realtimePcm = convertDiscordPcm48kStereoToRealtimePcm24kMono(discordPcm48kStereo);
		if (realtimePcm.length > 0) {
			this.registerSpeakerTurnAudioStarted(turn);
			turn.inputDiscordBytes += discordPcm48kStereo.length;
			turn.inputRealtimeBytes += realtimePcm.length;
			turn.inputChunks += 1;
			if (turn.inputChunks === 1) logger$2.info(`discord voice: realtime input audio started guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} user=${turn.context.userId} speaker=${turn.context.speakerLabel} discordBytes=${discordPcm48kStereo.length} realtimeBytes=${realtimePcm.length} outputAudioMs=${this.outputAudioMs()} outputActive=${this.isOutputAudioActive()}`);
			const outputActive = this.hasInterruptibleOutputAudio();
			if (!turn.interruptedPlayback && this.isBargeInEnabled() && outputActive) {
				turn.interruptedPlayback = true;
				logVoiceVerbose(`realtime barge-in from active speaker audio: guild ${this.params.entry.guildId} channel ${this.params.entry.channelId} user ${turn.context.userId}`);
				logger$2.info(`discord voice: realtime barge-in detected source=active-speaker-audio guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} user=${turn.context.userId} speaker=${turn.context.speakerLabel} outputAudioMs=${this.outputAudioMs()} outputActive=${this.isOutputAudioActive()} discordBytes=${discordPcm48kStereo.length} realtimeBytes=${realtimePcm.length}`);
				this.handleBargeIn("active-speaker-audio");
			}
			this.bridge.sendAudio(realtimePcm);
		}
	}
	registerSpeakerTurnAudioStarted(turn) {
		if (turn.hasAudio) return;
		this.speakerTurns.markAudio(turn);
		logger$2.info(`discord voice: realtime speaker turn opened guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} user=${turn.context.userId} speaker=${turn.context.speakerLabel} owner=${turn.context.senderIsOwner} pendingTurns=${this.speakerTurns.size()}`);
	}
	handleBargeIn(reason = "barge-in") {
		if (!this.isBargeInEnabled()) {
			logger$2.info(`discord voice: realtime barge-in ignored reason=${reason} bargeIn=false guild=${this.params.entry.guildId} channel=${this.params.entry.channelId}`);
			return;
		}
		if (!this.hasInterruptibleOutputAudio()) {
			logger$2.info(`discord voice: realtime barge-in ignored reason=${reason} outputActive=false guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} playbackChunks=${this.outputAudioChunks()}`);
			return;
		}
		logger$2.info(`discord voice: realtime barge-in requested reason=${reason} guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} outputAudioMs=${this.outputAudioMs()} outputActive=${this.isOutputAudioActive()} playbackChunks=${this.outputAudioChunks()}`);
		this.bridge?.handleBargeIn({ audioPlaybackActive: true });
	}
	isBargeInEnabled() {
		if (this.requireWakeName) return false;
		const providerId = this.realtimeProviderId ?? this.realtimeConfig?.provider ?? "openai";
		return resolveDiscordRealtimeBargeIn({
			realtimeConfig: this.realtimeConfig,
			providerId
		});
	}
	hasInterruptibleOutputAudio() {
		this.syncOutputAudioTimestamp();
		return this.outputActivity.isInterruptible(this.isOutputStreamActive());
	}
	get realtimeConfig() {
		return this.params.discordConfig.voice?.realtime;
	}
	sendOutputAudio(realtimePcm24kMono) {
		const discordPcm = convertRealtimePcm24kMonoToDiscordPcm48kStereo(realtimePcm24kMono);
		if (discordPcm.length === 0) return;
		this.syncOutputAudioTimestamp();
		if (this.outputActivity.snapshot().streamEnding) {
			logVoiceVerbose(`realtime output audio ignored after stream ending: guild ${this.params.entry.guildId} channel ${this.params.entry.channelId}`);
			return;
		}
		const stream = this.ensureOutputStream();
		if (this.exactSpeechResponseActive) this.exactSpeechAudioStarted = true;
		this.outputActivity.markAudio({
			audioMs: pcm16MonoDurationMs(realtimePcm24kMono, REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ.sampleRateHz),
			sourceAudioBytes: realtimePcm24kMono.length,
			sinkAudioBytes: discordPcm.length
		});
		this.queueOutputAudio(stream, discordPcm);
	}
	ensureOutputStream() {
		if (this.outputStream && !this.outputStream.destroyed && !this.outputStream.writableEnded) return this.outputStream;
		const stream = new PassThrough({ highWaterMark: DISCORD_RAW_PCM_FRAME_BYTES * 128 });
		this.outputStream = stream;
		this.outputPacedBuffer = Buffer.alloc(0);
		this.outputActivity.markStreamOpened();
		stream.once("close", () => {
			if (this.outputActivity.snapshot().playbackStarted) return;
			this.handleOutputStreamClosed(stream, "stream-close");
		});
		return stream;
	}
	handleOutputStreamClosed(stream, reason) {
		if (this.outputStream !== stream) return;
		this.logOutputAudioStopped(reason);
		this.outputStream = null;
		this.resetOutputAudioStats();
		this.completeExactSpeechResponse(reason, { drain: false });
	}
	queueOutputAudio(stream, discordPcm) {
		if (this.outputActivity.snapshot().playbackStarted) {
			stream.write(discordPcm);
			return;
		}
		this.outputPacedBuffer = this.outputPacedBuffer.length > 0 ? Buffer.concat([this.outputPacedBuffer, discordPcm]) : discordPcm;
		if (this.outputPacedBuffer.length >= DISCORD_RAW_PCM_FRAME_BYTES * DISCORD_REALTIME_OUTPUT_PREROLL_FRAMES) this.startOutputPlayback(stream);
	}
	startOutputPlayback(stream) {
		if (this.outputActivity.snapshot().playbackStarted || stream.destroyed) return;
		const voiceSdk = loadDiscordVoiceSdk();
		const opusStream = createDiscordOpusEncodeStream();
		opusStream.on("error", (err) => {
			logger$2.warn(`discord voice: realtime opus encode failed guild=${this.params.entry.guildId} channel=${this.params.entry.channelId}: ${formatErrorMessage(err)}`);
			this.resetOutputStream("opus-encode-error");
		});
		opusStream.once("close", () => this.handleOutputStreamClosed(stream, "stream-close"));
		stream.pipe(opusStream);
		if (this.outputPacedBuffer.length > 0) {
			stream.write(this.outputPacedBuffer);
			this.outputPacedBuffer = Buffer.alloc(0);
		}
		const resource = voiceSdk.createAudioResource(opusStream, { inputType: voiceSdk.StreamType.Opus });
		this.params.entry.player.play(resource);
		this.outputActivity.markPlaybackStarted();
		const realtimeConfig = this.realtimeConfig;
		logger$2.info(`discord voice: realtime audio playback started guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} mode=${this.params.mode} model=${realtimeConfig?.model ?? "provider-default"} voice=${realtimeConfig?.voice ?? "provider-default"}`);
	}
	clearOutputAudio(reason = "clear") {
		this.resetOutputStream(reason);
		this.params.entry.player.stop(true);
	}
	resetOutputStream(reason = "reset") {
		const stream = this.outputStream;
		this.clearOutputPlaybackWatchdog();
		this.logOutputAudioStopped(reason);
		this.outputStream = null;
		this.outputPacedBuffer = Buffer.alloc(0);
		this.resetOutputAudioStats();
		stream?.end();
		stream?.destroy();
	}
	finishOutputAudioStream(reason, { playBuffered = true } = {}) {
		const stream = this.outputStream;
		if (!stream || stream.destroyed || this.outputActivity.snapshot().streamEnding) return;
		this.outputActivity.markStreamEnding();
		logger$2.info(`discord voice: realtime audio playback finishing reason=${reason} guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} audioMs=${this.outputAudioMs()} chunks=${this.outputAudioChunks()}`);
		if (playBuffered) {
			this.startOutputPlayback(stream);
			this.scheduleOutputPlaybackWatchdog(reason, stream);
		} else {
			this.resetOutputStream(reason);
			this.params.entry.player.stop(true);
			this.completeExactSpeechResponse(reason);
			return;
		}
		stream.end();
	}
	scheduleOutputPlaybackWatchdog(reason, stream) {
		this.clearOutputPlaybackWatchdog();
		const timeoutMs = this.outputActivity.playbackWatchdogDelayMs({ marginMs: DISCORD_REALTIME_OUTPUT_PLAYBACK_WATCHDOG_MARGIN_MS });
		if (timeoutMs === void 0) return;
		this.outputPlaybackWatchdog = setTimeout(() => {
			this.outputPlaybackWatchdog = void 0;
			if (this.outputStream && this.outputStream !== stream) return;
			if (!this.outputStream && !this.isOutputAudioActive()) {
				this.completeExactSpeechResponse("playback-watchdog");
				return;
			}
			logger$2.warn(`discord voice: realtime audio playback watchdog fired reason=${reason} guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} audioMs=${this.outputAudioMs()} elapsedMs=${this.outputActivity.elapsedPlaybackMs()}`);
			this.clearOutputAudio("playback-watchdog");
			this.completeExactSpeechResponse("playback-watchdog");
		}, timeoutMs);
	}
	clearOutputPlaybackWatchdog() {
		if (!this.outputPlaybackWatchdog) return;
		clearTimeout(this.outputPlaybackWatchdog);
		this.outputPlaybackWatchdog = void 0;
	}
	enqueueExactSpeechMessage(text) {
		if (this.stopped || !text.trim()) return;
		if (this.exactSpeechResponseActive || this.hasInterruptibleOutputAudio()) {
			this.queuedExactSpeechMessages.push(text);
			logger$2.info(`discord voice: realtime exact speech queued guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} queued=${this.queuedExactSpeechMessages.length} outputAudioMs=${this.outputAudioMs()} outputActive=${this.isOutputAudioActive()}`);
			return;
		}
		this.sendExactSpeechMessage(text);
	}
	sendExactSpeechMessage(text) {
		if (this.stopped || !text.trim()) return;
		this.exactSpeechResponseActive = true;
		this.exactSpeechAudioStarted = false;
		this.bridge?.sendUserMessage(buildDiscordSpeakExactUserMessage(text));
	}
	sendWakeNameAck(result) {
		if (!result.allowed || this.stopped || this.exactSpeechResponseActive) return;
		if (this.hasInterruptibleOutputAudio()) {
			logger$2.info(`discord voice: realtime wake-name ack skipped outputActive=true voiceSession=${this.params.entry.voiceSessionKey} agent=${this.params.entry.route.agentId}`);
			return;
		}
		const ack = DISCORD_REALTIME_WAKE_ACKS[this.wakeNameAckIndex % DISCORD_REALTIME_WAKE_ACKS.length];
		this.wakeNameAckIndex += 1;
		logger$2.info(`discord voice: realtime wake-name ack canonical=${result.activationName} heard=${result.heardName} match=${result.match} voiceSession=${this.params.entry.voiceSessionKey} agent=${this.params.entry.route.agentId}`);
		this.sendExactSpeechMessage(ack ?? "Yeah.");
	}
	speakControlResult(text) {
		const trimmed = text.trim();
		if (this.stopped || !trimmed) return;
		this.queuedExactSpeechMessages = [];
		this.completeExactSpeechResponse("active-run-control", { drain: false });
		this.bridge?.handleBargeIn?.({
			audioPlaybackActive: true,
			force: true
		});
		this.clearOutputAudio("active-run-control");
		this.lastControlSpeech = {
			normalizedText: normalizeControlSpeechText(trimmed),
			sentAt: Date.now(),
			assistantTranscriptCount: 0
		};
		this.sendExactSpeechMessage(trimmed);
	}
	suppressDuplicateControlSpeech(text) {
		const recent = this.lastControlSpeech;
		if (!recent) return;
		if (Date.now() - recent.sentAt > DISCORD_REALTIME_CONTROL_SPEECH_DEDUPE_MS) {
			this.lastControlSpeech = void 0;
			return;
		}
		if (normalizeControlSpeechText(text) !== recent.normalizedText) return;
		recent.assistantTranscriptCount += 1;
		if (recent.assistantTranscriptCount <= 1) return;
		logger$2.info(`discord voice: realtime duplicate active-run control speech suppressed guild=${this.params.entry.guildId} channel=${this.params.entry.channelId}`);
		this.bridge?.handleBargeIn?.({
			audioPlaybackActive: true,
			force: true
		});
		this.clearOutputAudio("duplicate-active-run-control");
	}
	completeExactSpeechResponse(reason, options) {
		if (!this.exactSpeechResponseActive && this.queuedExactSpeechMessages.length === 0) return;
		this.exactSpeechResponseActive = false;
		this.exactSpeechAudioStarted = false;
		if (options?.drain === false) return;
		this.drainQueuedExactSpeechMessages(reason);
	}
	drainQueuedExactSpeechMessages(reason) {
		if (this.stopped || this.exactSpeechResponseActive || this.queuedExactSpeechMessages.length === 0 || this.hasInterruptibleOutputAudio()) return;
		const next = this.queuedExactSpeechMessages.shift();
		if (!next) return;
		logger$2.info(`discord voice: realtime exact speech dequeued reason=${reason} guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} queued=${this.queuedExactSpeechMessages.length}`);
		this.sendExactSpeechMessage(next);
	}
	logOutputAudioStopped(reason) {
		const activity = this.outputActivity.snapshot();
		const audioMs = Math.floor(activity.audioMs);
		const chunks = activity.chunks;
		const discordBytes = activity.sinkAudioBytes;
		const realtimeBytes = activity.sourceAudioBytes;
		const elapsedMs = this.outputActivity.elapsedPlaybackMs();
		if (this.outputStream || chunks > 0 || audioMs > 0) logger$2.info(`discord voice: realtime audio playback stopped reason=${reason} guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} audioMs=${audioMs} elapsedMs=${elapsedMs} chunks=${chunks} discordBytes=${discordBytes} realtimeBytes=${realtimeBytes}`);
	}
	resetOutputAudioStats() {
		this.outputPacedBuffer = Buffer.alloc(0);
		this.outputActivity.reset();
	}
	syncOutputAudioTimestamp() {
		this.bridge?.setMediaTimestamp(this.outputAudioMs());
	}
	outputAudioMs() {
		return Math.floor(this.outputActivity.snapshot().audioMs);
	}
	outputAudioChunks() {
		return this.outputActivity.snapshot().chunks;
	}
	isOutputStreamActive() {
		return Boolean(this.outputStream && !this.outputStream.destroyed);
	}
	isOutputAudioActive() {
		return this.outputActivity.isActive(this.isOutputStreamActive());
	}
	logSpeakerTurnClosed(turn) {
		if (turn.closed || !turn.hasAudio) return;
		const elapsedMs = Date.now() - turn.startedAt;
		const sinceLastAudioMs = turn.lastAudioAt ? Date.now() - turn.lastAudioAt : void 0;
		logger$2.info(`discord voice: realtime speaker turn closed guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} user=${turn.context.userId} speaker=${turn.context.speakerLabel} owner=${turn.context.senderIsOwner} hasAudio=${turn.hasAudio} chunks=${turn.inputChunks} discordBytes=${turn.inputDiscordBytes} realtimeBytes=${turn.inputRealtimeBytes} elapsedMs=${elapsedMs}${sinceLastAudioMs === void 0 ? "" : ` sinceLastAudioMs=${sinceLastAudioMs}`} interruptedPlayback=${turn.interruptedPlayback}`);
	}
	sendRealtimeTrailingSilenceForTurn(turn) {
		if (!this.bridge || this.stopped || turn.closed || !turn.hasAudio) return;
		const providerId = this.realtimeProviderId ?? this.realtimeConfig?.provider ?? "openai";
		const rawSilenceDurationMs = (this.realtimeConfig?.providers?.[providerId])?.silenceDurationMs;
		const silenceMs = Math.min(DISCORD_REALTIME_TRAILING_SILENCE_MAX_MS, Math.max(DISCORD_REALTIME_TRAILING_SILENCE_MIN_MS, typeof rawSilenceDurationMs === "number" && Number.isFinite(rawSilenceDurationMs) ? rawSilenceDurationMs : 0));
		const silenceBytes = Math.ceil(REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ.sampleRateHz * silenceMs / 1e3) * REALTIME_PCM16_BYTES_PER_SAMPLE;
		const silence = Buffer.alloc(silenceBytes);
		this.bridge.sendAudio(silence);
		logger$2.info(`discord voice: realtime trailing silence sent guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} user=${turn.context.userId} speaker=${turn.context.speakerLabel} silenceMs=${silenceMs} realtimeBytes=${silence.length}`);
	}
	handleToolCall(event, session) {
		const callId = event.callId || event.itemId || "unknown";
		if (event.name === "openclaw_agent_control") {
			this.handleAgentControlToolCall(event, session, callId);
			return;
		}
		if (event.name !== "openclaw_agent_consult") {
			session.submitToolResult(callId, { error: `Tool "${event.name}" not available` });
			return;
		}
		if (this.consultToolPolicy === "none") {
			session.submitToolResult(callId, { error: `Tool "${event.name}" not available` });
			return;
		}
		const exactSpeechText = extractDiscordExactSpeechConsultText(event.args);
		if (exactSpeechText !== void 0) {
			logger$2.info(`discord voice: realtime exact speech consult bypassed call=${callId || "unknown"} answerChars=${exactSpeechText.length}`);
			session.submitToolResult(callId, { text: exactSpeechText });
			return;
		}
		const consultMessage = buildRealtimeVoiceAgentConsultChatMessage(event.args);
		logger$2.info(`discord voice: realtime consult requested call=${callId || "unknown"} voiceSession=${this.params.entry.voiceSessionKey} supervisorSession=${this.params.entry.route.sessionKey} agent=${this.params.entry.route.agentId} question=${formatRealtimeLogPreview(consultMessage)}`);
		const nativeConsult = this.forcedConsults.recordNativeConsult(event.args, callId);
		const pendingConsult = nativeConsult.kind === "pending" ? nativeConsult.handle : void 0;
		if (pendingConsult) this.forcedConsults.rememberQuestion(pendingConsult, consultMessage);
		let context = pendingConsult?.context?.speaker;
		let recent = pendingConsult;
		if (!context) {
			const recentConsult = nativeConsult.kind === "in_flight" || nativeConsult.kind === "already_delivered" ? nativeConsult.handle : this.findRecentAgentProxyConsultContext(consultMessage);
			if (recentConsult) {
				const recentSpeaker = recentConsult.context?.speaker;
				if (this.hasPendingSpeakerAudioContext()) {
					logger$2.info(`discord voice: realtime consult matched recent agent result but newer speaker audio is pending call=${callId} speaker=${recentSpeaker?.speakerLabel ?? "unknown"} owner=${recentSpeaker?.senderIsOwner ?? false}`);
					session.submitToolResult(callId, { error: "Discord speaker context changed before this realtime consult completed" });
					return;
				}
				if (this.submitRecentAgentProxyConsultResult(callId, recentConsult, session)) return;
			}
		}
		if (!context) {
			context = this.consumePendingSpeakerContext();
			if (context) recent = this.rememberRecentAgentProxyConsultContext(consultMessage, context, {
				...callId === "unknown" ? {} : { id: `native-consult:${callId}` },
				started: true
			});
		}
		if (!context) {
			logger$2.warn(`discord voice: realtime consult has no speaker context call=${callId || "unknown"}`);
			session.submitToolResult(callId, { error: "No Discord speaker context available" });
			return;
		}
		const promise = this.runAgentTurn({
			context,
			message: consultMessage
		});
		if (recent) this.setRecentAgentProxyConsultPromise(recent, promise);
		promise.then((text) => {
			logger$2.info(`discord voice: realtime consult answer (${text.length} chars) voiceSession=${this.params.entry.voiceSessionKey} supervisorSession=${this.params.entry.route.sessionKey} agent=${this.params.entry.route.agentId} speaker=${context.speakerLabel} owner=${context.senderIsOwner}: ${formatRealtimeLogPreview(text)}`);
			session.submitToolResult(callId, { text });
		}).catch((error) => {
			logger$2.warn(`discord voice: realtime consult failed call=${callId || "unknown"}: ${formatErrorMessage(error)}`);
			session.submitToolResult(callId, { error: formatErrorMessage(error) });
		});
	}
	async handleAgentControlToolCall(event, session, callId) {
		try {
			const parsed = parseRealtimeVoiceAgentControlToolArgs(event.args);
			const result = await controlRealtimeVoiceAgentRun({
				sessionKey: this.params.entry.route.sessionKey,
				text: parsed.text,
				mode: parsed.mode
			});
			this.logAgentControlResult(result);
			session.submitToolResult(callId, result);
		} catch (error) {
			session.submitToolResult(callId, { error: formatErrorMessage(error) });
		}
	}
	async runAgentTurn(params) {
		const context = params.context;
		if (!context) return "";
		return this.params.runAgentTurn({
			context,
			message: params.message,
			toolsAllow: this.consultToolsAllow,
			userId: context.userId
		});
	}
	async handleFinalUserTranscript(text, params) {
		const trimmed = text.trim();
		if (!trimmed) return;
		this.partialUserTranscript = "";
		const transcriptsTurn = this.peekPendingSpeakerTurn();
		let transcriptAttribution = this.transcriptAttributionFromTurn(transcriptsTurn);
		const wakeNameResult = this.resolveWakeNameTranscript(trimmed);
		let forcedSpeakerContext;
		if (!wakeNameResult.allowed) {
			const pendingWakeNameFollowup = this.consumePendingWakeNameFollowup();
			transcriptAttribution ??= pendingWakeNameFollowup;
			if (!pendingWakeNameFollowup) {
				this.recordTranscriptUtterance(trimmed, transcriptAttribution);
				this.rememberIgnoredWakeNameSpeakerContext(this.consumePendingSpeakerContext());
				logger$2.info(`discord voice: realtime wake-name gate ignored transcript chars=${trimmed.length} voiceSession=${this.params.entry.voiceSessionKey} agent=${this.params.entry.route.agentId} wakeNames=${this.wakeNames.join(",") || "none"}`);
				return;
			}
			forcedSpeakerContext = pendingWakeNameFollowup.context;
			logger$2.info(`discord voice: realtime wake-name follow-up accepted chars=${trimmed.length} speaker=${forcedSpeakerContext.speakerLabel} voiceSession=${this.params.entry.voiceSessionKey} agent=${this.params.entry.route.agentId}`);
		}
		this.recordTranscriptUtterance(trimmed, transcriptAttribution);
		const acceptedText = wakeNameResult.allowed ? wakeNameResult.text || trimmed : trimmed;
		if (wakeNameResult.allowed && !wakeNameResult.text.trim()) {
			this.armWakeNameFollowup();
			return;
		}
		if (wakeNameResult.allowed) this.pendingWakeNameFollowup = void 0;
		const usesAgentProxy = isDiscordAgentProxyVoiceMode(this.params.mode);
		const pendingForcedConsult = usesAgentProxy && params.usesRealtimeAgentHandoff ? this.prepareForcedAgentProxyConsult(acceptedText, forcedSpeakerContext) : void 0;
		const control = await maybeControlDiscordVoiceAgentRun({
			entry: this.params.entry,
			text: acceptedText
		}).catch((error) => {
			logger$2.warn(`discord voice: realtime active-run control failed; falling back to normal transcript handling: ${formatErrorMessage(error)}`);
		});
		if (control?.handled) {
			if (pendingForcedConsult) this.forcedConsults.remove(pendingForcedConsult);
			this.logAgentControlResult(control.result);
			if (control.speakText) this.speakControlResult(control.speakText);
			return;
		}
		if (!usesAgentProxy) return;
		if (params.usesRealtimeAgentHandoff) {
			if (pendingForcedConsult) this.schedulePreparedForcedAgentProxyConsult(pendingForcedConsult);
			return;
		}
		this.talkback.enqueue(acceptedText, forcedSpeakerContext ?? this.consumePendingSpeakerContext());
	}
	handlePartialUserTranscript(text) {
		if (!this.requireWakeName || this.wakeNameAckedForTurn) return;
		this.partialUserTranscript = mergeRealtimePartialTranscript(this.partialUserTranscript, text);
		const wakeNameResult = matchRealtimeVoiceActivationName(this.partialUserTranscript, this.wakeNames);
		if (!wakeNameResult || wakeNameResult.edge !== "leading") return;
		this.wakeNameAckedForTurn = true;
		this.sendWakeNameAck(wakeNameResult);
	}
	resetPartialWakeNameTracking() {
		this.partialUserTranscript = "";
		this.wakeNameAckedForTurn = false;
	}
	resolveWakeNameTranscript(text) {
		if (!this.requireWakeName) return {
			allowed: true,
			text,
			activationName: "",
			heardName: "",
			match: "exact",
			edge: "leading"
		};
		const wakeNameResult = matchRealtimeVoiceActivationName(text, this.wakeNames);
		if (wakeNameResult) {
			logger$2.info(`discord voice: realtime wake-name gate matched canonical=${wakeNameResult.activationName} heard=${wakeNameResult.heardName} match=${wakeNameResult.match} voiceSession=${this.params.entry.voiceSessionKey} agent=${this.params.entry.route.agentId}`);
			return wakeNameResult;
		}
		return {
			allowed: false,
			text
		};
	}
	transcriptAttributionFromTurn(turn) {
		return turn ? {
			context: turn.context,
			startedAt: turn.startedAt
		} : void 0;
	}
	recordTranscriptUtterance(text, attribution) {
		const transcripts = this.params.entry.transcripts;
		if (!transcripts || !attribution) return;
		const context = attribution.context;
		const utterance = {
			sessionId: transcripts.sessionId,
			startedAt: new Date(attribution.startedAt).toISOString(),
			final: true,
			speaker: {
				id: context.userId,
				label: context.speakerLabel
			},
			text,
			metadata: {
				channel: "discord",
				guildId: this.params.entry.guildId,
				channelId: this.params.entry.channelId,
				voiceSessionKey: this.params.entry.voiceSessionKey
			}
		};
		Promise.resolve().then(() => transcripts.onUtterance(utterance)).catch((error) => {
			logger$2.warn(`discord voice: realtime transcripts utterance failed: ${formatErrorMessage(error)}`);
		});
	}
	logAgentControlResult(result) {
		logger$2.info(`discord voice: realtime active-run control handled mode=${result.mode} ok=${result.ok} active=${result.active} reason=${result.reason ?? "none"} voiceSession=${this.params.entry.voiceSessionKey} supervisorSession=${this.params.entry.route.sessionKey} agent=${this.params.entry.route.agentId}`);
	}
	prepareForcedAgentProxyConsult(transcript, speakerContext) {
		if (this.consultPolicy !== "always" && !this.requireWakeName) return;
		const question = transcript.trim();
		if (!question) return;
		const skipReason = classifySkippableRealtimeVoiceConsultTranscript(question);
		if (skipReason) {
			const context = this.consumePendingSpeakerContext();
			logger$2.info(`discord voice: realtime forced agent consult skipped reason=${skipReason} chars=${question.length} speaker=${context?.speakerLabel ?? "unknown"} transcript=${formatRealtimeLogPreview(question)}`);
			return;
		}
		let context = speakerContext ?? this.consumePendingSpeakerContext();
		if (!context) context = this.consumeRecentIgnoredWakeNameSpeakerContext();
		if (!context) {
			const recent = this.findRecentAgentProxyConsultContext(question);
			if (recent) {
				logVoiceVerbose(`realtime forced agent consult skipped (already delegated): guild ${this.params.entry.guildId} channel ${this.params.entry.channelId} speaker ${recent.context?.speaker.userId ?? "unknown"}`);
				return;
			}
			logger$2.warn("discord voice: realtime forced agent consult has no speaker context");
			return;
		}
		return this.forcedConsults.prepare(question, { context: { speaker: context } });
	}
	schedulePreparedForcedAgentProxyConsult(pending) {
		this.forcedConsults.schedule(pending, DISCORD_REALTIME_FORCED_CONSULT_FALLBACK_DELAY_MS, (handle) => void this.runForcedAgentProxyConsult(handle));
	}
	async runForcedAgentProxyConsult(pending) {
		this.forcedConsults.markStarted(pending);
		const state = pending.context;
		if (!state) {
			this.forcedConsults.markCancelled(pending);
			return;
		}
		const context = state.speaker;
		const { question } = pending;
		if (this.stopped) {
			this.forcedConsults.markCancelled(pending);
			return;
		}
		const startedAt = Date.now();
		logger$2.info(`discord voice: realtime forced agent consult starting chars=${question.length} voiceSession=${this.params.entry.voiceSessionKey} supervisorSession=${this.params.entry.route.sessionKey} agent=${this.params.entry.route.agentId} speaker=${context.speakerLabel} owner=${context.senderIsOwner}`);
		logger$2.debug(`discord voice: realtime forced agent consult reason=${DISCORD_REALTIME_FORCED_CONSULT_REASON} consultPolicy=${this.consultPolicy} requireWakeName=${this.requireWakeName} voiceSession=${this.params.entry.voiceSessionKey} supervisorSession=${this.params.entry.route.sessionKey} agent=${this.params.entry.route.agentId} speaker=${context.speakerLabel}`);
		if (this.hasInterruptibleOutputAudio()) logger$2.info(`discord voice: realtime forced agent consult preserving active playback guild=${this.params.entry.guildId} channel=${this.params.entry.channelId} outputAudioMs=${this.outputAudioMs()} outputActive=${this.isOutputAudioActive()} playbackChunks=${this.outputAudioChunks()}`);
		state.handledByForcedPlayback = true;
		try {
			const promise = this.runAgentTurn({
				context,
				message: question
			});
			this.setRecentAgentProxyConsultPromise(pending, promise);
			const text = await promise;
			logger$2.info(`discord voice: realtime forced agent consult answer (${text.length} chars) elapsedMs=${Date.now() - startedAt} voiceSession=${this.params.entry.voiceSessionKey} supervisorSession=${this.params.entry.route.sessionKey} agent=${this.params.entry.route.agentId}: ${formatRealtimeLogPreview(text)}`);
			if (text.trim()) this.enqueueExactSpeechMessage(text);
		} catch (error) {
			logger$2.warn(`discord voice: realtime forced agent consult failed elapsedMs=${Date.now() - startedAt}: ${formatErrorMessage(error)}`);
			this.enqueueExactSpeechMessage(DISCORD_REALTIME_FALLBACK_TEXT);
		}
	}
	consumePendingSpeakerContext() {
		return this.speakerTurns.consumeAudioContext();
	}
	armWakeNameFollowup() {
		const turn = this.peekPendingSpeakerTurn();
		const context = this.consumePendingSpeakerContext();
		if (!context) {
			logger$2.warn(`discord voice: realtime wake-name follow-up has no speaker context voiceSession=${this.params.entry.voiceSessionKey} agent=${this.params.entry.route.agentId}`);
			return;
		}
		this.pendingWakeNameFollowup = {
			context,
			startedAt: turn?.startedAt ?? Date.now(),
			expiresAt: Date.now() + DISCORD_REALTIME_WAKE_NAME_FOLLOWUP_TTL_MS
		};
		logger$2.info(`discord voice: realtime wake-name follow-up armed speaker=${context.speakerLabel} voiceSession=${this.params.entry.voiceSessionKey} agent=${this.params.entry.route.agentId}`);
	}
	consumePendingWakeNameFollowup() {
		const pending = this.pendingWakeNameFollowup;
		this.pendingWakeNameFollowup = void 0;
		if (!pending || Date.now() > pending.expiresAt) return;
		const currentTurn = this.peekPendingSpeakerTurn();
		if (currentTurn && currentTurn.context.userId !== pending.context.userId) return;
		if (currentTurn) this.consumePendingSpeakerContext();
		return {
			context: pending.context,
			startedAt: pending.startedAt
		};
	}
	rememberIgnoredWakeNameSpeakerContext(context) {
		this.speakerTurns.rememberIgnoredContext(context);
	}
	consumeRecentIgnoredWakeNameSpeakerContext() {
		return this.speakerTurns.consumeIgnoredContext();
	}
	peekPendingSpeakerTurn() {
		return this.speakerTurns.peekAudioTurn();
	}
	hasPendingSpeakerAudioContext() {
		return this.speakerTurns.hasAudioContext();
	}
	rememberRecentAgentProxyConsultContext(question, context, options = {}) {
		const handle = this.forcedConsults.prepare(question, {
			context: { speaker: context },
			...options.id ? { id: options.id } : {}
		});
		if (!handle) throw new Error("Discord realtime consult context requires a non-empty question");
		if (options.started) this.forcedConsults.markStarted(handle);
		return handle;
	}
	setRecentAgentProxyConsultPromise(recent, promise) {
		const state = recent.context;
		if (!state) return;
		this.forcedConsults.markStarted(recent);
		state.promise = promise;
		promise.then((text) => {
			state.result = {
				status: "fulfilled",
				text
			};
			this.forcedConsults.markDelivered(recent);
		}).catch((error) => {
			state.result = {
				status: "rejected",
				error: formatErrorMessage(error)
			};
			this.forcedConsults.markDelivered(recent);
		});
	}
	findRecentAgentProxyConsultContext(consultMessage) {
		return this.forcedConsults.findRecent(consultMessage);
	}
	submitRecentAgentProxyConsultResult(callId, recent, session) {
		const state = recent.context;
		if (!state) return false;
		const submitAlreadyDelivered = () => {
			session.submitToolResult(callId, {
				status: "already_delivered",
				message: "OpenClaw already delivered this answer to Discord voice."
			}, { suppressResponse: true });
		};
		const submitResult = (result) => {
			if (state.handledByForcedPlayback) {
				submitAlreadyDelivered();
				return;
			}
			if (result.status === "fulfilled") {
				session.submitToolResult(callId, { text: result.text });
				return;
			}
			session.submitToolResult(callId, { error: result.error });
		};
		if (state.result) {
			logger$2.info(`discord voice: realtime consult reused recent agent result call=${callId || "unknown"} speaker=${state.speaker.speakerLabel} owner=${state.speaker.senderIsOwner}`);
			submitResult(state.result);
			return true;
		}
		if (!state.promise) return false;
		logger$2.info(`discord voice: realtime consult joined in-flight agent result call=${callId || "unknown"} speaker=${state.speaker.speakerLabel} owner=${state.speaker.senderIsOwner}`);
		if (state.handledByForcedPlayback) {
			state.promise.then(submitAlreadyDelivered, submitAlreadyDelivered);
			return true;
		}
		state.promise.then((text) => session.submitToolResult(callId, { text })).catch((error) => session.submitToolResult(callId, { error: formatErrorMessage(error) }));
		return true;
	}
};
function isDiscordRealtimeSpeakerContext(value) {
	return Boolean(value) && typeof value === "object" && typeof value.userId === "string" && typeof value.senderIsOwner === "boolean" && typeof value.speakerLabel === "string";
}
function pcm16MonoDurationMs(audio, sampleRate) {
	if (audio.length === 0 || sampleRate <= 0) return 0;
	return audio.length / REALTIME_PCM16_BYTES_PER_SAMPLE * 1e3 / sampleRate;
}
function buildProviderConfigs(realtimeConfig) {
	const configs = realtimeConfig?.providers;
	return configs && Object.keys(configs).length > 0 ? { ...configs } : void 0;
}
function buildProviderConfigOverrides(realtimeConfig) {
	const overrides = {
		...realtimeConfig?.model ? { model: realtimeConfig.model } : {},
		...realtimeConfig?.voice ? { voice: realtimeConfig.voice } : {},
		...typeof realtimeConfig?.minBargeInAudioEndMs === "number" ? { minBargeInAudioEndMs: realtimeConfig.minBargeInAudioEndMs } : {}
	};
	return Object.keys(overrides).length > 0 ? overrides : void 0;
}
function resolveDiscordRealtimeMinBargeInAudioEndMs(realtimeConfig) {
	return typeof realtimeConfig?.minBargeInAudioEndMs === "number" ? realtimeConfig.minBargeInAudioEndMs : DISCORD_REALTIME_DEFAULT_MIN_BARGE_IN_AUDIO_END_MS;
}
function buildDiscordRealtimeInstructions(params) {
	const base = params.instructions ?? ["You are OpenClaw's Discord voice interface.", "Keep spoken replies concise, natural, and suitable for a live Discord voice channel."].join("\n");
	if (isDiscordAgentProxyVoiceMode(params.mode)) return [
		base,
		params.bootstrapContextInstructions?.trim(),
		"Mode: OpenClaw agent proxy.",
		"You are the realtime voice surface for the same OpenClaw agent the user can message directly.",
		"Do not mention a backend, supervisor, helper, or separate system. Present the result as your own work.",
		"Delegate substantive requests, actions, tool work, current facts, memory, workspace context, and user-specific context with openclaw_agent_consult.",
		"Do not block, refuse, or downscope at the voice layer. Delegate to OpenClaw and treat its result as authoritative.",
		"Answer directly only for greetings, acknowledgements, brief latency tests, or filler while waiting.",
		"While waiting for OpenClaw data or tool results, use at most one short natural backchannel such as \"yeah\", \"mm-hmm\", \"got it\", or \"one sec\"; vary it and do not treat it as the final answer.",
		"When OpenClaw sends an internal exact answer to speak, do not call tools. Say only that answer.",
		buildRealtimeVoiceAgentConsultPolicyInstructions({
			toolPolicy: params.toolPolicy,
			consultPolicy: params.consultPolicy
		})
	].join("\n\n");
	return [
		base,
		params.bootstrapContextInstructions?.trim(),
		"While waiting for OpenClaw data or tool results, use at most one short natural backchannel such as \"yeah\", \"mm-hmm\", \"got it\", or \"one sec\"; vary it and do not treat it as the final answer.",
		buildRealtimeVoiceAgentConsultPolicyInstructions({
			toolPolicy: params.toolPolicy,
			consultPolicy: params.consultPolicy
		})
	].filter(Boolean).join("\n\n");
}
//#endregion
//#region extensions/discord/src/voice/receive-recovery.ts
const DECRYPT_FAILURE_WINDOW_MS = 3e4;
const DECRYPT_FAILURE_RECONNECT_THRESHOLD = 3;
const DECRYPT_FAILURE_MARKER = "DecryptionFailed(";
const DAVE_PASSTHROUGH_DISABLED_MARKER = "UnencryptedWhenPassthroughDisabled";
const WASM_MEMORY_ACCESS_MARKER = "memory access out of bounds";
function createVoiceReceiveRecoveryState() {
	return {
		decryptFailureCount: 0,
		lastDecryptFailureAt: 0,
		decryptRecoveryInFlight: false
	};
}
function isAbortLikeReceiveError(err) {
	if (!err || typeof err !== "object") return false;
	const name = "name" in err && typeof err.name === "string" ? err.name : "";
	const message = "message" in err && typeof err.message === "string" ? err.message : "";
	return name === "AbortError" || message === "Premature close" || message.includes("The operation was aborted") || message.includes("aborted");
}
function analyzeVoiceReceiveError(err) {
	const message = formatErrorMessage(err);
	const shouldAttemptPassthrough = message.includes(DAVE_PASSTHROUGH_DISABLED_MARKER);
	const isWasmMemoryAccessFailure = message.toLowerCase().includes(WASM_MEMORY_ACCESS_MARKER);
	return {
		message,
		isAbortLike: isAbortLikeReceiveError(err),
		shouldAttemptPassthrough,
		countsAsDecryptFailure: message.includes(DECRYPT_FAILURE_MARKER) || shouldAttemptPassthrough || isWasmMemoryAccessFailure
	};
}
function noteVoiceDecryptFailure(state, now = Date.now()) {
	if (now - state.lastDecryptFailureAt > DECRYPT_FAILURE_WINDOW_MS) state.decryptFailureCount = 0;
	state.lastDecryptFailureAt = now;
	state.decryptFailureCount += 1;
	const firstFailure = state.decryptFailureCount === 1;
	if (state.decryptFailureCount < DECRYPT_FAILURE_RECONNECT_THRESHOLD || state.decryptRecoveryInFlight) return {
		firstFailure,
		shouldRecover: false
	};
	state.decryptRecoveryInFlight = true;
	resetVoiceReceiveRecoveryState(state);
	return {
		firstFailure,
		shouldRecover: true
	};
}
function resetVoiceReceiveRecoveryState(state) {
	state.decryptFailureCount = 0;
	state.lastDecryptFailureAt = 0;
}
function finishVoiceDecryptRecovery(state) {
	state.decryptRecoveryInFlight = false;
}
function enableDaveReceivePassthrough(params) {
	const { target, sdk, reason, expirySeconds, onVerbose, onWarn } = params;
	const networkingState = target.connection.state.networking?.state;
	if (target.connection.state.status !== sdk.VoiceConnectionStatus.Ready || !networkingState || networkingState.code !== sdk.NetworkingStatusCode.Ready && networkingState.code !== sdk.NetworkingStatusCode.Resuming) return false;
	const daveSession = networkingState.dave?.session;
	if (!daveSession) return false;
	try {
		daveSession.setPassthroughMode(true, expirySeconds);
		onVerbose(`enabled DAVE receive passthrough: guild ${target.guildId} channel ${target.channelId} expiry=${expirySeconds}s reason=${reason}`);
		return true;
	} catch (err) {
		onWarn(`discord voice: failed to enable DAVE passthrough guild=${target.guildId} channel=${target.channelId} reason=${reason}: ${formatErrorMessage(err)}`);
		return false;
	}
}
//#endregion
//#region extensions/discord/src/voice/sanitize.ts
const SPEECH_EMOJI_RE = /(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D|\p{Extended_Pictographic}|\p{Emoji_Modifier})*)+/gu;
function stripEmojiForSpeech(text) {
	return text.replace(SPEECH_EMOJI_RE, " ").replace(/\s+([?!.,:;])/g, "$1").replace(/[ \t]{2,}/g, " ").replace(/ *\n */g, "\n").trim();
}
function sanitizeVoiceReplyTextForSpeech(text, speakerLabel) {
	let cleaned = stripInlineDirectiveTagsForDisplay(text).text.trim();
	if (!cleaned) return "";
	const label = speakerLabel?.trim();
	if (label) {
		const prefix = new RegExp(`^${escapeRegExp(label)}\\s*:\\s*`, "i");
		cleaned = cleaned.replace(prefix, "").trim();
	}
	return stripEmojiForSpeech(cleaned);
}
//#endregion
//#region extensions/discord/src/voice/tts.ts
function mergeTtsConfig(base, override) {
	if (!override) return base;
	const baseProviders = base.providers ?? {};
	const overrideProviders = override.providers ?? {};
	const mergedProviders = Object.fromEntries(uniqueStrings([...Object.keys(baseProviders), ...Object.keys(overrideProviders)]).map((providerId) => {
		const baseProvider = baseProviders[providerId] ?? {};
		const overrideProvider = overrideProviders[providerId] ?? {};
		return [providerId, {
			...baseProvider,
			...overrideProvider
		}];
	}));
	return {
		...base,
		...override,
		modelOverrides: {
			...base.modelOverrides,
			...override.modelOverrides
		},
		...Object.keys(mergedProviders).length === 0 ? {} : { providers: mergedProviders }
	};
}
function resolveVoiceTtsConfig(params) {
	if (!params.override) return {
		cfg: params.cfg,
		resolved: resolveTtsConfig(params.cfg)
	};
	const merged = mergeTtsConfig(params.cfg.messages?.tts ?? {}, params.override);
	const messages = params.cfg.messages ?? {};
	const cfg = {
		...params.cfg,
		messages: {
			...messages,
			tts: merged
		}
	};
	return {
		cfg,
		resolved: resolveTtsConfig(cfg)
	};
}
async function transcribeVoiceAudio(params) {
	return normalizeOptionalString((await getDiscordRuntime().mediaUnderstanding.transcribeAudioFile({
		filePath: params.filePath,
		cfg: params.cfg,
		agentDir: resolveAgentDir(params.cfg, params.agentId),
		mime: "audio/wav"
	})).text);
}
async function synthesizeVoiceReplyAudio(params) {
	const { cfg: ttsCfg, resolved: ttsConfig } = resolveVoiceTtsConfig({
		cfg: params.cfg,
		override: params.override
	});
	const directive = parseTtsDirectives(params.replyText, ttsConfig.modelOverrides, {
		cfg: ttsCfg,
		providerConfigs: ttsConfig.providerConfigs,
		preferredProviderId: getTtsProvider(ttsConfig, resolveTtsPrefsPath(ttsConfig))
	});
	const speakText = sanitizeVoiceReplyTextForSpeech(directive.overrides.ttsText ?? directive.cleanedText.trim(), params.speakerLabel);
	if (!speakText) return { status: "empty" };
	const runtime = getDiscordRuntime();
	const streamResult = await runtime.tts.textToSpeechStream?.({
		text: speakText,
		cfg: ttsCfg,
		channel: "discord",
		overrides: directive.overrides,
		disableFallback: true
	});
	if (streamResult?.success && streamResult.audioStream) return {
		status: "ok",
		mode: "stream",
		audioStream: streamResult.audioStream,
		release: streamResult.release,
		speakText
	};
	const result = await runtime.tts.textToSpeech({
		text: speakText,
		cfg: ttsCfg,
		channel: "discord",
		overrides: directive.overrides
	});
	if (!result.success || !result.audioPath) return {
		status: "failed",
		error: result.error ?? "unknown error"
	};
	return {
		status: "ok",
		mode: "file",
		audioPath: result.audioPath,
		speakText
	};
}
//#endregion
//#region extensions/discord/src/voice/segment.ts
const VOICE_TRANSCRIPT_LOG_PREVIEW_CHARS = 500;
const logger$1 = createSubsystemLogger("discord/voice");
function formatVoiceTranscriptLogPreview(text) {
	const oneLine = text.replace(/\s+/g, " ").trim();
	if (oneLine.length <= VOICE_TRANSCRIPT_LOG_PREVIEW_CHARS) return oneLine;
	return `${oneLine.slice(0, VOICE_TRANSCRIPT_LOG_PREVIEW_CHARS)}...`;
}
async function processDiscordVoiceSegment(params) {
	const { entry, wavPath, userId, durationSeconds } = params;
	logVoiceVerbose(`segment processing (${durationSeconds.toFixed(2)}s): guild ${entry.guildId} channel ${entry.channelId}`);
	const ingress = await resolveDiscordVoiceIngressContext({
		entry,
		userId,
		cfg: params.cfg,
		discordConfig: params.discordConfig,
		ownerAllowFrom: params.ownerAllowFrom,
		fetchGuildName: params.fetchGuildName,
		speakerContext: params.speakerContext
	});
	if (!ingress) {
		logVoiceVerbose(`segment unauthorized: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
		return;
	}
	const transcript = await transcribeVoiceAudio({
		cfg: params.cfg,
		agentId: entry.route.agentId,
		filePath: wavPath
	});
	if (!transcript) {
		logVoiceVerbose(`transcription empty: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
		return;
	}
	logVoiceVerbose(`transcription ok (${transcript.length} chars): guild ${entry.guildId} channel ${entry.channelId}`);
	logVoiceVerbose(`transcript from ${ingress.speakerLabel} (${userId}) in guild ${entry.guildId} channel ${entry.channelId}: ${formatVoiceTranscriptLogPreview(transcript)}`);
	if (params.transcripts) {
		await params.transcripts.onUtterance({
			sessionId: params.transcripts.sessionId,
			startedAt: (/* @__PURE__ */ new Date()).toISOString(),
			final: true,
			speaker: {
				id: userId,
				label: ingress.speakerLabel
			},
			text: transcript,
			metadata: {
				channel: "discord",
				guildId: entry.guildId,
				channelId: entry.channelId,
				voiceSessionKey: entry.voiceSessionKey
			}
		});
		return;
	}
	let replyText;
	const control = await maybeControlDiscordVoiceAgentRun({
		entry,
		text: transcript
	}).catch((error) => {
		logger$1.warn(`discord voice: active-run control failed; falling back to normal segment handling: ${formatErrorMessage(error)}`);
	});
	if (control?.handled) {
		logger$1.info(`discord voice: active-run control handled mode=${control.result.mode} ok=${control.result.ok} active=${control.result.active} reason=${control.result.reason ?? "none"} session=${entry.route.sessionKey}`);
		replyText = control.speakText ?? "";
	} else {
		const turn = await runDiscordVoiceAgentTurn({
			entry,
			userId,
			message: formatVoiceIngressPrompt(transcript, ingress.speakerLabel),
			cfg: params.cfg,
			discordConfig: params.discordConfig,
			runtime: params.runtime,
			context: ingress,
			ownerAllowFrom: params.ownerAllowFrom,
			fetchGuildName: params.fetchGuildName,
			speakerContext: params.speakerContext
		});
		if (!turn) {
			logVoiceVerbose(`segment unauthorized before agent turn: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
			return;
		}
		replyText = turn.text;
	}
	if (!replyText) {
		logVoiceVerbose(`reply empty: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
		return;
	}
	logVoiceVerbose(`reply ok (${replyText.length} chars): guild ${entry.guildId} channel ${entry.channelId}`);
	const voiceReplyAudio = await synthesizeVoiceReplyAudio({
		cfg: params.cfg,
		override: params.discordConfig.voice?.tts,
		replyText,
		speakerLabel: ingress.speakerLabel
	});
	if (voiceReplyAudio.status === "empty") {
		logVoiceVerbose(`tts skipped (empty): guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
		return;
	}
	if (voiceReplyAudio.status === "failed") {
		logger$1.warn(`discord voice: TTS failed: ${voiceReplyAudio.error ?? "unknown error"}`);
		return;
	}
	logVoiceVerbose(`tts ok (${voiceReplyAudio.speakText.length} chars): guild ${entry.guildId} channel ${entry.channelId}`);
	params.enqueuePlayback(entry, async () => {
		const voiceSdk = loadDiscordVoiceSdk();
		const releaseAudioStream = voiceReplyAudio.mode === "stream" ? voiceReplyAudio.release : void 0;
		try {
			if (voiceReplyAudio.mode === "stream") {
				logVoiceVerbose(`playback start: guild ${entry.guildId} channel ${entry.channelId} stream`);
				const nodeStream = Readable.fromWeb(voiceReplyAudio.audioStream);
				const resource = voiceSdk.createAudioResource(createDiscordOpusPlaybackStream(nodeStream), { inputType: voiceSdk.StreamType.Opus });
				entry.player.play(resource);
			} else {
				logVoiceVerbose(`playback start: guild ${entry.guildId} channel ${entry.channelId} file ${path.basename(voiceReplyAudio.audioPath)}`);
				const resource = voiceSdk.createAudioResource(createDiscordOpusPlaybackStream(voiceReplyAudio.audioPath), { inputType: voiceSdk.StreamType.Opus });
				entry.player.play(resource);
			}
			await voiceSdk.entersState(entry.player, voiceSdk.AudioPlayerStatus.Playing, PLAYBACK_READY_TIMEOUT_MS).catch(() => void 0);
			await voiceSdk.entersState(entry.player, voiceSdk.AudioPlayerStatus.Idle, SPEAKING_READY_TIMEOUT_MS).catch(() => void 0);
			logVoiceVerbose(`playback done: guild ${entry.guildId} channel ${entry.channelId}`);
		} finally {
			await releaseAudioStream?.();
		}
	});
}
//#endregion
//#region extensions/discord/src/voice/speaker-context.ts
const SPEAKER_CONTEXT_CACHE_TTL_MS = 6e4;
var DiscordVoiceSpeakerContextResolver = class {
	constructor(params) {
		this.params = params;
		this.cache = /* @__PURE__ */ new Map();
	}
	async resolveContext(guildId, userId) {
		const cached = this.getCachedContext(guildId, userId);
		if (cached) return cached;
		const identity = await this.resolveIdentity(guildId, userId);
		const context = {
			id: identity.id,
			label: identity.label,
			name: identity.name,
			tag: identity.tag,
			senderIsOwner: this.resolveIsOwner(identity)
		};
		this.setCachedContext(guildId, userId, context);
		return context;
	}
	async resolveIdentity(guildId, userId) {
		try {
			const member = await this.params.client.fetchMember(guildId, userId);
			const username = member.user?.username ?? void 0;
			return {
				id: userId,
				label: member.nickname ?? member.user?.globalName ?? username ?? userId,
				name: username,
				tag: member.user ? formatDiscordUserTag(member.user) : void 0,
				memberRoleIds: Array.isArray(member.roles) ? member.roles.map((role) => typeof role === "string" ? role : typeof role?.id === "string" ? role.id : "").filter(Boolean) : []
			};
		} catch {
			try {
				const user = await this.params.client.fetchUser(userId);
				const username = user.username ?? void 0;
				return {
					id: userId,
					label: user.globalName ?? username ?? userId,
					name: username,
					tag: formatDiscordUserTag(user),
					memberRoleIds: []
				};
			} catch {
				return {
					id: userId,
					label: userId,
					memberRoleIds: []
				};
			}
		}
	}
	resolveIsOwner(identity) {
		return resolveDiscordOwnerAccess({
			allowFrom: this.params.ownerAllowFrom,
			sender: {
				id: identity.id,
				name: identity.name,
				tag: identity.tag
			},
			allowNameMatching: false
		}).ownerAllowed;
	}
	resolveCacheKey(guildId, userId) {
		return `${guildId}:${userId}`;
	}
	getCachedContext(guildId, userId) {
		const key = this.resolveCacheKey(guildId, userId);
		const cached = this.cache.get(key);
		if (!cached) return;
		if (cached.expiresAt <= Date.now()) {
			this.cache.delete(key);
			return;
		}
		return {
			id: cached.id,
			label: cached.label,
			name: cached.name,
			tag: cached.tag,
			senderIsOwner: cached.senderIsOwner
		};
	}
	setCachedContext(guildId, userId, context) {
		const key = this.resolveCacheKey(guildId, userId);
		this.cache.set(key, {
			...context,
			expiresAt: Date.now() + SPEAKER_CONTEXT_CACHE_TTL_MS
		});
	}
};
//#endregion
//#region extensions/discord/src/voice/manager.ts
const logger = createSubsystemLogger("discord/voice");
const VOICE_LOG_PREVIEW_CHARS = 500;
const FOLLOW_USERS_RECONCILE_INTERVAL_MS = 1e4;
const FOLLOW_USERS_RECONCILE_MAX_GUILDS_PER_RUN = 4;
const FOLLOW_USERS_RECONCILE_MAX_REST_LOOKUPS_PER_RUN = 32;
const DISCORD_VOICE_FATAL_AUTOJOIN_ERROR_PATTERNS = [
	"api key missing",
	"incorrect api key",
	"invalid api key",
	"unauthorized",
	"authentication",
	"permission denied",
	"forbidden"
];
function logFollowUserReconcileVerbose(reason, message) {
	if (reason === "interval") {
		logger.trace(`discord voice: ${message}`);
		return;
	}
	logVoiceVerbose(message);
}
function formatVoiceLogPreview(text) {
	const oneLine = text.replace(/\s+/g, " ").trim();
	if (oneLine.length <= VOICE_LOG_PREVIEW_CHARS) return oneLine;
	return `${oneLine.slice(0, VOICE_LOG_PREVIEW_CHARS)}...`;
}
function isVoiceConnectionDestroyed(connection, voiceSdk) {
	return connection.state.status === voiceSdk.VoiceConnectionStatus.Destroyed;
}
function destroyVoiceConnectionSafely(params) {
	if (isVoiceConnectionDestroyed(params.connection, params.voiceSdk)) {
		logVoiceVerbose(`destroy skipped: ${params.reason}; connection already destroyed`);
		return;
	}
	try {
		params.connection.destroy();
	} catch (err) {
		const message = formatErrorMessage(err);
		if (message.includes("already been destroyed")) {
			logVoiceVerbose(`destroy skipped: ${params.reason}; ${message}`);
			return;
		}
		logger.warn(`discord voice: destroy failed: ${params.reason}: ${message}`);
	}
}
function isRetryableVoiceJoinReadyError(error) {
	return formatErrorMessage(error).toLowerCase().includes("operation was aborted");
}
function normalizeVoiceChannelResidencies(entries) {
	const normalized = [];
	for (const entry of entries ?? []) {
		const guildId = entry.guildId?.trim();
		const channelId = entry.channelId?.trim();
		if (guildId && channelId) normalized.push({
			guildId,
			channelId
		});
	}
	return normalized;
}
function normalizeDiscordUserId(value) {
	const trimmed = value.trim();
	const withoutDiscordPrefix = trimmed.startsWith("discord:") ? trimmed.slice(8) : trimmed;
	return (withoutDiscordPrefix.startsWith("user:") ? withoutDiscordPrefix.slice(5) : withoutDiscordPrefix).trim() || void 0;
}
function normalizeDiscordUserIds(entries) {
	const ids = /* @__PURE__ */ new Set();
	for (const entry of entries ?? []) {
		const id = normalizeDiscordUserId(entry);
		if (id) ids.add(id);
	}
	return ids;
}
function resolveFollowUsersEnabled(voiceConfig) {
	return voiceConfig?.followUsersEnabled !== false;
}
function isVoiceChannelAllowed(params) {
	return params.allowedChannels === null || params.allowedChannels.some((entry) => entry.guildId === params.guildId && entry.channelId === params.channelId);
}
function formatAutoJoinFailureKey(entry) {
	return `${entry.guildId}:${entry.channelId}`;
}
function isFatalAutoJoinFailure(message) {
	const normalized = message.toLowerCase();
	return DISCORD_VOICE_FATAL_AUTOJOIN_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}
function isUnknownDiscordVoiceStateError(err) {
	return (err && typeof err === "object" && "status" in err && typeof err.status === "number" ? err.status : void 0) === 404 || /unknown voice state/i.test(formatErrorMessage(err));
}
function startAutoJoin(manager) {
	manager.autoJoin().catch((err) => logger.warn(`discord voice: autoJoin failed: ${formatErrorMessage(err)}`));
}
function resolveDiscordVoiceAgentRoute(params) {
	const voiceRoute = resolveAgentRoute({
		cfg: params.cfg,
		channel: "discord",
		accountId: params.accountId,
		guildId: params.guildId,
		peer: {
			kind: "channel",
			id: params.sessionChannelId
		}
	});
	const agentSession = params.voiceConfig?.agentSession;
	if (agentSession?.mode !== "target") return {
		route: voiceRoute,
		voiceRoute,
		agentSessionMode: "voice",
		agentSessionTarget: void 0
	};
	const target = agentSession.target?.trim();
	if (!target) throw new Error("channels.discord.voice.agentSession.target is required when mode is \"target\"");
	const parsed = parseDiscordTarget(target, { defaultKind: "channel" });
	if (!parsed) throw new Error(`Invalid Discord voice agent session target "${target}"`);
	return {
		route: resolveAgentRoute({
			cfg: params.cfg,
			channel: "discord",
			accountId: params.accountId,
			guildId: params.guildId,
			peer: {
				kind: parsed.kind === "user" ? "direct" : "channel",
				id: parsed.id
			}
		}),
		voiceRoute,
		agentSessionMode: "target",
		agentSessionTarget: parsed.normalized
	};
}
var DiscordVoiceManager$1 = class {
	constructor(params) {
		this.params = params;
		this.sessions = /* @__PURE__ */ new Map();
		this.joinTasks = /* @__PURE__ */ new Map();
		this.autoJoinTask = null;
		this.fatalAutoJoinFailures = /* @__PURE__ */ new Map();
		this.followedUserChannels = /* @__PURE__ */ new Map();
		this.followedVoiceGuilds = /* @__PURE__ */ new Set();
		this.followUsersReconcileTimer = null;
		this.followUsersReconcileTask = null;
		this.followUsersReconcileGuildCursor = 0;
		this.followUsersReconcileBotGuildCursor = 0;
		this.followUsersReconcileUserCursors = /* @__PURE__ */ new Map();
		this.destroyed = false;
		this.botUserId = params.botUserId;
		this.voiceEnabled = resolveDiscordVoiceEnabled(params.discordConfig.voice);
		this.ownerAllowFrom = resolveDiscordAccountAllowFrom({
			cfg: params.cfg,
			accountId: params.accountId
		}) ?? params.discordConfig.allowFrom ?? params.discordConfig.dm?.allowFrom ?? [];
		this.allowedChannels = params.discordConfig.voice?.allowedChannels === void 0 ? null : normalizeVoiceChannelResidencies(params.discordConfig.voice.allowedChannels);
		this.followUserIds = resolveFollowUsersEnabled(params.discordConfig.voice) ? normalizeDiscordUserIds(params.discordConfig.voice?.followUsers) : /* @__PURE__ */ new Set();
		this.speakerContext = new DiscordVoiceSpeakerContextResolver({
			client: params.client,
			ownerAllowFrom: this.ownerAllowFrom
		});
	}
	setBotUserId(id) {
		if (id) this.botUserId = id;
	}
	isEnabled() {
		return this.voiceEnabled;
	}
	async autoJoin() {
		if (!this.voiceEnabled || this.destroyed) return;
		if (this.autoJoinTask) return this.autoJoinTask;
		this.autoJoinTask = (async () => {
			const entries = this.params.discordConfig.voice?.autoJoin ?? [];
			const entriesByGuild = /* @__PURE__ */ new Map();
			const duplicateGuilds = /* @__PURE__ */ new Set();
			for (const entry of entries) {
				const guildId = entry.guildId.trim();
				const channelId = entry.channelId.trim();
				if (!guildId || !channelId) continue;
				if (entriesByGuild.has(guildId)) duplicateGuilds.add(guildId);
				entriesByGuild.set(guildId, {
					guildId,
					channelId
				});
			}
			logVoiceVerbose(`autoJoin: ${entries.length} entries, ${entriesByGuild.size} guilds`);
			for (const guildId of duplicateGuilds) {
				const selected = entriesByGuild.get(guildId);
				if (selected) logger.warn(`discord voice: autoJoin has multiple entries for guild ${guildId}; using channel ${selected.channelId}`);
			}
			for (const entry of entriesByGuild.values()) {
				const failureKey = formatAutoJoinFailureKey(entry);
				const fatalFailure = this.fatalAutoJoinFailures.get(failureKey);
				if (fatalFailure) {
					if (!fatalFailure.skipLogged) {
						logger.warn(`discord voice: autoJoin suppressed guild=${entry.guildId} channel=${entry.channelId} after fatal startup failure; retry with /vc join or reload config after fixing credentials: ${fatalFailure.message}`);
						fatalFailure.skipLogged = true;
					}
					continue;
				}
				logVoiceVerbose(`autoJoin: joining guild ${entry.guildId} channel ${entry.channelId}`);
				const result = await this.join({
					guildId: entry.guildId,
					channelId: entry.channelId
				});
				if (!result.ok) {
					logger.warn(`discord voice: autoJoin skipped guild=${entry.guildId} channel=${entry.channelId}: ${result.message}`);
					if (isFatalAutoJoinFailure(result.message)) this.fatalAutoJoinFailures.set(failureKey, {
						message: result.message,
						skipLogged: false
					});
				}
			}
			this.ensureFollowUsersReconcileTimer();
			await this.reconcileFollowedUsers("startup");
		})().finally(() => {
			this.autoJoinTask = null;
		});
		return this.autoJoinTask;
	}
	status() {
		return Array.from(this.sessions.values()).map((session) => ({
			ok: true,
			message: `connected: guild ${session.guildId} channel ${session.channelId}`,
			guildId: session.guildId,
			channelId: session.channelId
		}));
	}
	isAllowedVoiceChannel(params) {
		return isVoiceChannelAllowed({
			allowedChannels: this.allowedChannels,
			guildId: params.guildId.trim(),
			channelId: params.channelId.trim()
		});
	}
	async join(params, options) {
		if (this.destroyed) return {
			ok: false,
			message: "Discord voice manager is stopped."
		};
		if (!this.voiceEnabled) return {
			ok: false,
			message: "Discord voice is disabled (channels.discord.voice.enabled)."
		};
		const guildId = params.guildId.trim();
		const channelId = params.channelId.trim();
		if (!guildId || !channelId) return {
			ok: false,
			message: "Missing guildId or channelId."
		};
		if (!this.isAllowedVoiceChannel({
			guildId,
			channelId
		})) {
			logger.warn(`discord voice: join rejected for non-allowed channel guild=${guildId} channel=${channelId}`);
			return {
				ok: false,
				message: `${formatMention({ channelId })} is not allowed by channels.discord.voice.allowedChannels.`,
				guildId,
				channelId
			};
		}
		logVoiceVerbose(`join requested: guild ${guildId} channel ${channelId}`);
		while (true) {
			const activeJoinTask = this.joinTasks.get(guildId);
			if (!activeJoinTask) break;
			logVoiceVerbose(`join: waiting for active guild join guild ${guildId} channel ${channelId}`);
			await activeJoinTask.catch(() => void 0);
			if (this.destroyed) return {
				ok: false,
				message: "Discord voice manager is stopped.",
				guildId,
				channelId
			};
		}
		const joinTask = this.joinUnlocked({
			guildId,
			channelId
		}, options);
		this.joinTasks.set(guildId, joinTask);
		try {
			return await joinTask;
		} finally {
			if (this.joinTasks.get(guildId) === joinTask) this.joinTasks.delete(guildId);
		}
	}
	async joinUnlocked(params, options) {
		const { guildId, channelId } = params;
		const voiceConfig = this.params.discordConfig.voice;
		const voiceMode = resolveDiscordVoiceMode(voiceConfig);
		const existing = this.sessions.get(guildId);
		if (existing && existing.channelId === channelId) {
			if (options?.transcripts) existing.transcripts = options.transcripts;
			if (!options?.transcripts && isDiscordRealtimeVoiceMode(voiceMode) && !existing.realtime) {
				const realtimeResult = await this.attachRealtimeSession(existing, voiceMode, { requireLiveEntry: true });
				if (!realtimeResult.ok) return {
					ok: false,
					message: realtimeResult.message,
					guildId,
					channelId
				};
			}
			logVoiceVerbose(`join: already connected to guild ${guildId} channel ${channelId}`);
			return {
				ok: true,
				message: `Already connected to ${formatMention({ channelId })}.`,
				guildId,
				channelId
			};
		}
		if (existing) {
			logVoiceVerbose(`join: replacing existing session for guild ${guildId}`);
			await this.leave({ guildId }, { preserveFollowState: options?.preserveFollowState });
		}
		const channelInfo = await this.params.client.fetchChannel(channelId).catch(() => null);
		if (!channelInfo || "type" in channelInfo && !isVoiceChannel(channelInfo.type)) return {
			ok: false,
			message: `Channel ${channelId} is not a voice channel.`
		};
		const channelGuildId = "guildId" in channelInfo ? channelInfo.guildId : void 0;
		if (channelGuildId && channelGuildId !== guildId) return {
			ok: false,
			message: "Voice channel is not in this guild."
		};
		const voicePlugin = this.params.client.getPlugin("voice");
		if (!voicePlugin) return {
			ok: false,
			message: "Discord voice plugin is not available."
		};
		const adapterCreator = voicePlugin.getGatewayAdapterCreator(guildId);
		const daveEncryption = voiceConfig?.daveEncryption;
		const decryptionFailureTolerance = voiceConfig?.decryptionFailureTolerance;
		const connectReadyTimeoutMs = resolveVoiceTimeoutMs(voiceConfig?.connectTimeoutMs, VOICE_CONNECT_READY_TIMEOUT_MS);
		const reconnectGraceMs = resolveVoiceTimeoutMs(voiceConfig?.reconnectGraceMs, VOICE_RECONNECT_GRACE_MS);
		logVoiceVerbose(`join: DAVE settings encryption=${daveEncryption === false ? "off" : "on"} tolerance=${decryptionFailureTolerance ?? "default"} connectTimeout=${connectReadyTimeoutMs}ms reconnectGrace=${reconnectGraceMs}ms`);
		const voiceSdk = loadDiscordVoiceSdk();
		const existingEntry = this.sessions.get(guildId);
		if (existingEntry) {
			existingEntry.stop();
			this.sessions.delete(guildId);
		}
		const staleConnection = voiceSdk.getVoiceConnection(guildId);
		if (staleConnection) destroyVoiceConnectionSafely({
			connection: staleConnection,
			voiceSdk,
			reason: `stale connection before join guild ${guildId}`
		});
		let connection;
		const connectReadyDeadlineMs = Date.now() + connectReadyTimeoutMs;
		for (let attempt = 1; attempt <= 2; attempt += 1) {
			const joinedConnection = voiceSdk.joinVoiceChannel({
				channelId,
				guildId,
				adapterCreator,
				selfDeaf: false,
				selfMute: false,
				daveEncryption,
				decryptionFailureTolerance
			});
			const remainingConnectReadyTimeoutMs = Math.max(1, connectReadyDeadlineMs - Date.now());
			try {
				await voiceSdk.entersState(joinedConnection, voiceSdk.VoiceConnectionStatus.Ready, remainingConnectReadyTimeoutMs);
				connection = joinedConnection;
				logVoiceVerbose(`join: connected to guild ${guildId} channel ${channelId}`);
				break;
			} catch (err) {
				destroyVoiceConnectionSafely({
					connection: joinedConnection,
					voiceSdk,
					reason: `failed join cleanup guild ${guildId} channel ${channelId}`
				});
				if (attempt === 1 && isRetryableVoiceJoinReadyError(err) && !this.destroyed && connectReadyDeadlineMs > Date.now()) {
					logVoiceVerbose(`join: retrying aborted ready wait guild ${guildId} channel ${channelId}`);
					continue;
				}
				logger.warn(`discord voice: join failed before ready: guild ${guildId} channel ${channelId} timeout=${connectReadyTimeoutMs}ms error=${formatErrorMessage(err)}`);
				return {
					ok: false,
					message: `Failed to join voice channel: ${formatErrorMessage(err)}`
				};
			}
		}
		if (!connection) return {
			ok: false,
			message: "Failed to join voice channel."
		};
		if (this.destroyed) {
			destroyVoiceConnectionSafely({
				connection,
				voiceSdk,
				reason: `manager stopped during join guild ${guildId} channel ${channelId}`
			});
			return {
				ok: false,
				message: "Discord voice manager is stopped.",
				guildId,
				channelId
			};
		}
		const sessionChannelId = channelInfo?.id ?? channelId;
		if (sessionChannelId !== channelId) logVoiceVerbose(`join: using session channel ${sessionChannelId} for voice channel ${channelId}`);
		let routeInfo;
		try {
			routeInfo = resolveDiscordVoiceAgentRoute({
				cfg: this.params.cfg,
				accountId: this.params.accountId,
				guildId,
				sessionChannelId,
				voiceConfig
			});
		} catch (err) {
			destroyVoiceConnectionSafely({
				connection,
				voiceSdk,
				reason: `voice agent session route failed guild ${guildId} channel ${channelId}`
			});
			return {
				ok: false,
				message: `Failed to resolve Discord voice agent session: ${formatErrorMessage(err)}`,
				guildId,
				channelId
			};
		}
		const { route, voiceRoute, agentSessionMode, agentSessionTarget } = routeInfo;
		logger.info(`discord voice: joining guild=${guildId} channel=${channelId} mode=${voiceMode} agent=${route.agentId} voiceSession=${voiceRoute.sessionKey} supervisorSession=${route.sessionKey} agentSessionMode=${agentSessionMode}${agentSessionTarget ? ` agentSessionTarget=${agentSessionTarget}` : ""} voiceModel=${voiceConfig?.model ?? "route-default"} realtimeProvider=${voiceConfig?.realtime?.provider ?? "auto"} realtimeModel=${voiceConfig?.realtime?.model ?? "provider-default"} realtimeVoice=${voiceConfig?.realtime?.voice ?? "provider-default"}`);
		const player = voiceSdk.createAudioPlayer();
		connection.subscribe(player);
		let speakingHandler;
		let speakingEndHandler;
		let disconnectedHandler;
		let destroyedHandler;
		let playerErrorHandler;
		let stopped = false;
		const clearSessionIfCurrent = () => {
			if (this.sessions.get(guildId)?.connection === connection) this.sessions.delete(guildId);
		};
		const stopEntry = (entry, options) => {
			if (stopped) return;
			stopped = true;
			if (speakingHandler) connection.receiver.speaking.off("start", speakingHandler);
			if (speakingEndHandler) connection.receiver.speaking.off("end", speakingEndHandler);
			stopVoiceCaptureState(entry.capture);
			if (disconnectedHandler) connection.off(voiceSdk.VoiceConnectionStatus.Disconnected, disconnectedHandler);
			if (destroyedHandler) connection.off(voiceSdk.VoiceConnectionStatus.Destroyed, destroyedHandler);
			if (playerErrorHandler) player.off("error", playerErrorHandler);
			entry.pendingRealtime?.close();
			entry.pendingRealtime = void 0;
			entry.realtime?.close();
			entry.realtime = void 0;
			player.stop();
			if (options.destroyConnection) destroyVoiceConnectionSafely({
				connection,
				voiceSdk,
				reason: options.reason
			});
		};
		const entry = {
			guildId,
			guildName: channelInfo && "guild" in channelInfo && channelInfo.guild && typeof channelInfo.guild.name === "string" ? channelInfo.guild.name : void 0,
			channelId,
			channelName: channelInfo && "name" in channelInfo && typeof channelInfo.name === "string" ? channelInfo.name : void 0,
			sessionChannelId,
			voiceSessionKey: voiceRoute.sessionKey,
			route,
			connection,
			player,
			playbackQueue: Promise.resolve(),
			processingQueue: Promise.resolve(),
			capture: createVoiceCaptureState(),
			transcripts: options?.transcripts,
			receiveRecovery: createVoiceReceiveRecoveryState(),
			isStopped: () => stopped,
			stop: () => {
				stopEntry(entry, {
					destroyConnection: true,
					reason: `stop guild ${guildId} channel ${channelId}`
				});
			}
		};
		if (!options?.transcripts && isDiscordRealtimeVoiceMode(voiceMode)) {
			const realtimeResult = await this.attachRealtimeSession(entry, voiceMode);
			if (!realtimeResult.ok) {
				destroyVoiceConnectionSafely({
					connection,
					voiceSdk,
					reason: `realtime setup failed guild ${guildId} channel ${channelId}`
				});
				return {
					ok: false,
					message: realtimeResult.message,
					guildId,
					channelId
				};
			}
		}
		if (this.destroyed) {
			stopEntry(entry, {
				destroyConnection: true,
				reason: `manager stopped during setup guild ${guildId} channel ${channelId}`
			});
			return {
				ok: false,
				message: "Discord voice manager is stopped.",
				guildId,
				channelId
			};
		}
		speakingHandler = (userId) => {
			this.handleSpeakingStart(entry, userId).catch((err) => {
				logger.warn(`discord voice: capture failed: ${formatErrorMessage(err)}`);
			});
		};
		speakingEndHandler = (userId) => {
			this.scheduleCaptureFinalize(entry, userId, "speaker end");
		};
		disconnectedHandler = async () => {
			try {
				logVoiceVerbose(`disconnected: attempting recovery guild ${guildId} channel ${channelId} grace=${reconnectGraceMs}ms`);
				await Promise.race([voiceSdk.entersState(connection, voiceSdk.VoiceConnectionStatus.Signalling, reconnectGraceMs), voiceSdk.entersState(connection, voiceSdk.VoiceConnectionStatus.Connecting, reconnectGraceMs)]);
				logVoiceVerbose(`disconnected: recovery started guild ${guildId} channel ${channelId}`);
			} catch (err) {
				logger.warn(`discord voice: disconnect recovery failed: guild ${guildId} channel ${channelId} timeout=${reconnectGraceMs}ms error=${formatErrorMessage(err)}; destroying connection`);
				clearSessionIfCurrent();
				stopEntry(entry, {
					destroyConnection: true,
					reason: `disconnect recovery failed guild ${guildId} channel ${channelId}`
				});
			}
		};
		destroyedHandler = () => {
			clearSessionIfCurrent();
			stopEntry(entry, {
				destroyConnection: false,
				reason: `destroyed guild ${guildId} channel ${channelId}`
			});
		};
		playerErrorHandler = (err) => {
			logger.warn(`discord voice: playback error: ${formatErrorMessage(err)}`);
		};
		this.enableDaveReceivePassthrough(entry, "post-join warmup", 30);
		connection.receiver.speaking.on("start", speakingHandler);
		connection.receiver.speaking.on("end", speakingEndHandler);
		connection.on(voiceSdk.VoiceConnectionStatus.Disconnected, disconnectedHandler);
		connection.on(voiceSdk.VoiceConnectionStatus.Destroyed, destroyedHandler);
		player.on("error", playerErrorHandler);
		this.sessions.set(guildId, entry);
		this.fatalAutoJoinFailures.delete(formatAutoJoinFailureKey({
			guildId,
			channelId
		}));
		logger.info(`discord voice: joined guild=${guildId} channel=${channelId} mode=${voiceMode} agent=${route.agentId} voiceSession=${voiceRoute.sessionKey} supervisorSession=${route.sessionKey} voiceModel=${voiceConfig?.model ?? "route-default"}`);
		return {
			ok: true,
			message: `Joined ${formatMention({ channelId })}.`,
			guildId,
			channelId
		};
	}
	async attachRealtimeSession(entry, voiceMode, options) {
		const bootstrapContextInstructions = await resolveDiscordVoiceRealtimeBootstrapContext({
			entry,
			cfg: this.params.cfg,
			discordConfig: this.params.discordConfig
		});
		if (entry.isStopped() || options?.requireLiveEntry === true && this.sessions.get(entry.guildId) !== entry) return {
			ok: false,
			message: "Discord realtime voice session stopped before startup completed."
		};
		const realtime = new DiscordRealtimeVoiceSession({
			bootstrapContextInstructions,
			cfg: this.params.cfg,
			discordConfig: this.params.discordConfig,
			entry,
			mode: voiceMode,
			runAgentTurn: ({ context, message, toolsAllow, userId }) => this.runDiscordRealtimeAgentTurn({
				context,
				entry,
				message,
				toolsAllow,
				userId
			})
		});
		entry.pendingRealtime = realtime;
		try {
			await realtime.connect();
			if (entry.pendingRealtime !== realtime || entry.isStopped() || options?.requireLiveEntry === true && this.sessions.get(entry.guildId) !== entry) {
				realtime.close();
				return {
					ok: false,
					message: "Discord realtime voice session stopped before startup completed."
				};
			}
			entry.pendingRealtime = void 0;
			entry.realtime = realtime;
			return { ok: true };
		} catch (err) {
			if (entry.pendingRealtime === realtime) entry.pendingRealtime = void 0;
			realtime.close();
			return {
				ok: false,
				message: `Failed to start Discord realtime voice: ${formatErrorMessage(err)}`
			};
		}
	}
	async leave(params, options) {
		const guildId = params.guildId.trim();
		logVoiceVerbose(`leave requested: guild ${guildId} channel ${params.channelId ?? "current"}`);
		const entry = this.sessions.get(guildId);
		if (!entry) return {
			ok: false,
			message: "Not connected to a voice channel."
		};
		if (params.channelId && params.channelId !== entry.channelId) return {
			ok: false,
			message: "Not connected to that voice channel."
		};
		if (options?.transcriptsSessionId) {
			if (!entry.transcripts || entry.transcripts.sessionId !== options.transcriptsSessionId) return {
				ok: false,
				message: "Transcripts session is not active in this voice channel.",
				guildId,
				channelId: entry.channelId
			};
			if (entry.realtime || entry.pendingRealtime) {
				entry.transcripts = void 0;
				return {
					ok: true,
					message: `Stopped transcripts for ${formatMention({ channelId: entry.channelId })}.`,
					guildId,
					channelId: entry.channelId
				};
			}
		}
		entry.stop();
		this.sessions.delete(guildId);
		if (!options?.preserveFollowState) {
			this.followedVoiceGuilds.delete(guildId);
			this.deleteFollowedUserChannelsForGuild(guildId);
		}
		logVoiceVerbose(`leave: disconnected from guild ${guildId} channel ${entry.channelId}`);
		return {
			ok: true,
			message: `Left ${formatMention({ channelId: entry.channelId })}.`,
			guildId,
			channelId: entry.channelId
		};
	}
	async handleVoiceStateUpdate(data) {
		const guildId = data.guild_id?.trim();
		const userId = data.user_id?.trim();
		const channelId = data.channel_id?.trim();
		if (!guildId || !userId) return;
		if (this.botUserId && userId === this.botUserId) {
			await this.handleBotVoiceStateUpdate({
				guildId,
				channelId
			});
			return;
		}
		if (this.followUserIds.has(userId)) await this.handleFollowedUserVoiceStateUpdate({
			guildId,
			channelId,
			userId
		});
	}
	async handleBotVoiceStateUpdate(params) {
		const { guildId, channelId } = params;
		if (!channelId) return;
		const existing = this.sessions.get(guildId);
		if (this.isAllowedVoiceChannel({
			guildId,
			channelId
		})) {
			if (existing && existing.channelId !== channelId) {
				logger.warn(`discord voice: bot moved to allowed channel guild=${guildId} from=${existing.channelId} to=${channelId}; rebuilding voice session`);
				await this.join({
					guildId,
					channelId
				}, { preserveFollowState: this.isFollowOwnedGuild(guildId) });
			}
			return;
		}
		logger.warn(`discord voice: bot moved to non-allowed channel guild=${guildId} channel=${channelId}; leaving`);
		if (existing) await this.leave({ guildId });
		else {
			const voiceSdk = loadDiscordVoiceSdk();
			const connection = voiceSdk.getVoiceConnection(guildId);
			if (connection) destroyVoiceConnectionSafely({
				connection,
				voiceSdk,
				reason: `non-allowed voice state guild ${guildId} channel ${channelId}`
			});
		}
		const target = this.resolveVoiceResidencyTarget(guildId);
		if (target) {
			logger.warn(`discord voice: rejoining allowed voice channel guild=${guildId} channel=${target.channelId}`);
			await this.join(target);
		}
	}
	async handleFollowedUserVoiceStateUpdate(params) {
		if (!this.voiceEnabled || this.destroyed) return;
		const { guildId, channelId, userId } = params;
		const followKey = this.formatFollowedUserKey({
			guildId,
			userId
		});
		const existing = this.sessions.get(guildId);
		const wasFollowedVoiceSession = this.followedUserChannels.has(followKey) || this.followedVoiceGuilds.has(guildId);
		if (!channelId) {
			this.followedUserChannels.delete(followKey);
			if (existing && wasFollowedVoiceSession && !this.hasFollowedUserInChannel(existing)) await this.handoffToAnotherFollowedUserOrLeave({
				guildId,
				userId,
				existing,
				reason: "disconnected"
			});
			return;
		}
		if (!this.isAllowedVoiceChannel({
			guildId,
			channelId
		})) {
			this.followedUserChannels.delete(followKey);
			logger.warn(`discord voice: followed user joined non-allowed channel guild=${guildId} user=${userId} channel=${channelId}; ignoring`);
			if (existing && wasFollowedVoiceSession && !this.hasFollowedUserInChannel(existing)) await this.handoffToAnotherFollowedUserOrLeave({
				guildId,
				userId,
				existing,
				reason: "joined non-allowed channel"
			});
			return;
		}
		this.followedUserChannels.set(followKey, {
			guildId,
			channelId
		});
		if (existing?.channelId === channelId) {
			this.followedVoiceGuilds.add(guildId);
			return;
		}
		logger.info(`discord voice: following user guild=${guildId} user=${userId} channel=${channelId}`);
		const result = await this.join({
			guildId,
			channelId
		}, { preserveFollowState: true });
		if (!result.ok) {
			if (this.sessions.get(guildId)?.channelId === channelId) this.followedVoiceGuilds.add(guildId);
			else this.followedUserChannels.delete(followKey);
			logger.warn(`discord voice: failed to follow user guild=${guildId} user=${userId} channel=${channelId}: ${result.message}`);
			return;
		}
		this.followedVoiceGuilds.add(guildId);
	}
	async destroy() {
		this.destroyed = true;
		if (this.followUsersReconcileTimer) {
			clearInterval(this.followUsersReconcileTimer);
			this.followUsersReconcileTimer = null;
		}
		for (const entry of this.sessions.values()) entry.stop();
		this.sessions.clear();
		this.followedUserChannels.clear();
		this.followedVoiceGuilds.clear();
	}
	resolveFollowGuildIds() {
		const guildIds = /* @__PURE__ */ new Set();
		for (const guildId of Object.keys(this.params.discordConfig.guilds ?? {})) {
			const normalized = guildId.trim();
			if (normalized) guildIds.add(normalized);
		}
		for (const entry of normalizeVoiceChannelResidencies(this.params.discordConfig.voice?.autoJoin)) guildIds.add(entry.guildId);
		for (const entry of this.allowedChannels ?? []) guildIds.add(entry.guildId);
		for (const entry of this.sessions.values()) guildIds.add(entry.guildId);
		return Array.from(guildIds);
	}
	ensureFollowUsersReconcileTimer() {
		if (this.followUserIds.size === 0) return;
		if (this.followUsersReconcileTimer) return;
		this.followUsersReconcileTimer = setInterval(() => {
			this.reconcileFollowedUsers("interval").catch((err) => {
				logger.warn(`discord voice: follow user reconciliation failed: ${formatErrorMessage(err)}`);
			});
		}, FOLLOW_USERS_RECONCILE_INTERVAL_MS);
		this.followUsersReconcileTimer.unref?.();
	}
	async reconcileFollowedUsers(reason) {
		if (this.followUserIds.size === 0 || this.destroyed) return;
		if (this.followUsersReconcileTask) return this.followUsersReconcileTask;
		this.followUsersReconcileTask = this.runFollowedUsersReconcile(reason).finally(() => {
			this.followUsersReconcileTask = null;
		});
		return this.followUsersReconcileTask;
	}
	async runFollowedUsersReconcile(reason) {
		if (this.destroyed) return;
		const guildIds = this.resolveFollowGuildIds();
		if (guildIds.length === 0) {
			logVoiceVerbose(`follow user reconcile skipped reason=${reason}: no Discord guild ids are configured`);
			return;
		}
		logFollowUserReconcileVerbose(reason, `follow user reconcile reason=${reason}: ${this.followUserIds.size} users across ${guildIds.length} guilds`);
		const plans = this.selectFollowUserReconcilePlans(guildIds, reason);
		for (const plan of plans) {
			for (const userId of plan.userIds) {
				const voiceState = await getGuildVoiceState(this.params.client.rest, plan.guildId, userId).catch((err) => {
					if (!isUnknownDiscordVoiceStateError(err)) {
						logger.warn(`discord voice: follow user reconcile skipped transient voice state error guild=${plan.guildId} user=${userId} reason=${reason}: ${formatErrorMessage(err)}`);
						return "transient-error";
					}
					logFollowUserReconcileVerbose(reason, `follow user reconcile reason=${reason}: no voice state guild ${plan.guildId} user ${userId}: ${formatErrorMessage(err)}`);
				});
				if (this.destroyed) return;
				if (voiceState === "transient-error") continue;
				const channelId = voiceState?.channel_id?.trim();
				await this.handleFollowedUserVoiceStateUpdate({
					guildId: plan.guildId,
					channelId,
					userId
				});
			}
			if (plan.checkBotVoiceState) {
				if (this.destroyed) return;
				await this.disconnectStaleFollowedBotVoiceState({
					guildId: plan.guildId,
					reason
				});
			}
		}
	}
	selectFollowUserReconcilePlans(guildIds, reason) {
		const followedUserIds = Array.from(this.followUserIds);
		if (followedUserIds.length === 0) return [];
		let remainingLookups = FOLLOW_USERS_RECONCILE_MAX_REST_LOOKUPS_PER_RUN;
		const guildLimit = Math.min(guildIds.length, FOLLOW_USERS_RECONCILE_MAX_GUILDS_PER_RUN);
		const start = this.followUsersReconcileGuildCursor % guildIds.length;
		const plans = [];
		for (let offset = 0; offset < guildLimit && remainingLookups > 0; offset += 1) {
			if (this.botUserId && remainingLookups === 1) break;
			const guildId = guildIds[(start + offset) % guildIds.length];
			const userLimit = this.resolveFollowUserReconcileUserLookupLimit(followedUserIds.length, remainingLookups);
			if (userLimit <= 0) break;
			const selection = this.selectFollowUserReconcileUserIds(guildId, followedUserIds, userLimit);
			plans.push({
				guildId,
				userIds: selection.userIds,
				checkedAllUsers: selection.completedCycle,
				checkBotVoiceState: false
			});
			remainingLookups -= selection.userIds.length;
		}
		this.followUsersReconcileGuildCursor = (start + plans.length) % guildIds.length;
		this.assignFollowUserReconcileBotChecks(guildIds, plans, remainingLookups);
		if (plans.length < guildIds.length || plans.some((plan) => plan.userIds.length < followedUserIds.length)) logVoiceVerbose(`follow user reconcile reason=${reason}: sampling ${plans.length}/${guildIds.length} guilds and up to ${FOLLOW_USERS_RECONCILE_MAX_REST_LOOKUPS_PER_RUN} REST lookups`);
		return plans;
	}
	assignFollowUserReconcileBotChecks(guildIds, plans, remainingLookups) {
		if (!this.botUserId || remainingLookups <= 0 || plans.length === 0) return;
		const plansByGuild = new Map(plans.map((plan) => [plan.guildId, plan]));
		const start = this.followUsersReconcileBotGuildCursor % guildIds.length;
		let scanned = 0;
		let assigned = 0;
		for (; scanned < guildIds.length && assigned < remainingLookups; scanned += 1) {
			const guildId = guildIds[(start + scanned) % guildIds.length];
			const plan = plansByGuild.get(guildId);
			if (!plan?.checkedAllUsers) continue;
			plan.checkBotVoiceState = true;
			assigned += 1;
		}
		this.followUsersReconcileBotGuildCursor = (start + scanned) % guildIds.length;
	}
	resolveFollowUserReconcileUserLookupLimit(followedUserCount, remainingLookups) {
		const userLimit = Math.min(followedUserCount, remainingLookups);
		if (this.botUserId && followedUserCount > userLimit && remainingLookups > 1) return remainingLookups - 1;
		return userLimit;
	}
	selectFollowUserReconcileUserIds(guildId, followedUserIds, limit) {
		if (followedUserIds.length <= limit) {
			this.followUsersReconcileUserCursors.set(guildId, 0);
			return {
				userIds: followedUserIds,
				completedCycle: true
			};
		}
		const start = this.followUsersReconcileUserCursors.get(guildId) ?? 0;
		const selected = Array.from({ length: limit }, (_, offset) => followedUserIds[(start + offset) % followedUserIds.length]);
		const completedCycle = start + selected.length >= followedUserIds.length;
		this.followUsersReconcileUserCursors.set(guildId, (start + selected.length) % followedUserIds.length);
		return {
			userIds: selected,
			completedCycle
		};
	}
	formatFollowedUserKey(params) {
		return `${params.guildId}:${params.userId}`;
	}
	hasFollowedUserInChannel(entry) {
		return Array.from(this.followedUserChannels.values()).some((candidate) => candidate.guildId === entry.guildId && candidate.channelId === entry.channelId);
	}
	resolveFollowedUserHandoffTarget(guildId, currentChannelId) {
		for (const entry of this.followedUserChannels.values()) if (entry.guildId === guildId && entry.channelId !== currentChannelId && this.isAllowedVoiceChannel(entry)) return entry;
		return null;
	}
	async handoffToAnotherFollowedUserOrLeave(params) {
		const target = this.resolveFollowedUserHandoffTarget(params.guildId, params.existing.channelId);
		if (target) {
			logger.info(`discord voice: followed user ${params.reason} guild=${params.guildId} user=${params.userId}; moving to remaining followed user channel=${target.channelId}`);
			const result = await this.join(target, { preserveFollowState: true });
			if (result.ok) this.followedVoiceGuilds.add(params.guildId);
			else {
				logger.warn(`discord voice: failed to hand off followed user session guild=${params.guildId} channel=${target.channelId}: ${result.message}`);
				this.followedVoiceGuilds.delete(params.guildId);
				this.deleteFollowedUserChannelsForGuild(params.guildId);
				await this.leave({ guildId: params.guildId });
			}
			return;
		}
		logger.info(`discord voice: followed user ${params.reason} guild=${params.guildId} user=${params.userId}; leaving channel=${params.existing.channelId}`);
		await this.leave({ guildId: params.guildId });
	}
	isFollowOwnedGuild(guildId) {
		return this.followedVoiceGuilds.has(guildId) || Array.from(this.followedUserChannels.values()).some((entry) => entry.guildId === guildId);
	}
	deleteFollowedUserChannelsForGuild(guildId) {
		for (const [key, entry] of this.followedUserChannels.entries()) if (entry.guildId === guildId) this.followedUserChannels.delete(key);
	}
	async disconnectStaleFollowedBotVoiceState(params) {
		if (this.destroyed) return;
		const { guildId, reason } = params;
		if (Array.from(this.followedUserChannels.values()).some((entry) => entry.guildId === guildId)) return;
		const existing = this.sessions.get(guildId);
		if (existing) {
			if (this.followedVoiceGuilds.has(guildId)) {
				logger.info(`discord voice: follow reconcile leaving local session guild=${guildId} channel=${existing.channelId} reason=${reason}`);
				await this.leave({ guildId });
			}
			return;
		}
		if (!this.botUserId) return;
		const botVoiceState = await getGuildVoiceState(this.params.client.rest, guildId, this.botUserId).catch((err) => {
			if (!isUnknownDiscordVoiceStateError(err)) {
				logger.warn(`discord voice: follow reconcile skipped transient bot voice state error guild=${guildId} reason=${reason}: ${formatErrorMessage(err)}`);
				return "transient-error";
			}
			logFollowUserReconcileVerbose(reason, `follow user reconcile reason=${reason}: no bot voice state guild ${guildId}: ${formatErrorMessage(err)}`);
		});
		if (this.destroyed || botVoiceState === "transient-error") return;
		const botChannelId = botVoiceState?.channel_id?.trim();
		if (!botChannelId) return;
		const gateway = this.params.client.getPlugin("voice")?.getGateway(guildId);
		if (!gateway) {
			logger.warn(`discord voice: follow reconcile cannot disconnect stale bot voice state guild=${guildId} channel=${botChannelId}; gateway unavailable`);
			return;
		}
		logger.info(`discord voice: follow reconcile disconnecting stale bot voice state guild=${guildId} channel=${botChannelId} reason=${reason}`);
		gateway.updateVoiceState({
			guild_id: guildId,
			channel_id: null,
			self_mute: false,
			self_deaf: false
		});
	}
	resolveVoiceResidencyTarget(guildId) {
		const autoJoinTarget = normalizeVoiceChannelResidencies(this.params.discordConfig.voice?.autoJoin).toReversed().find((entry) => entry.guildId === guildId);
		if (autoJoinTarget && this.isAllowedVoiceChannel(autoJoinTarget)) return autoJoinTarget;
		if (this.allowedChannels === null) return null;
		const guildAllowed = this.allowedChannels.filter((entry) => entry.guildId === guildId);
		return guildAllowed.length === 1 ? guildAllowed[0] : null;
	}
	enqueueProcessing(entry, task) {
		entry.processingQueue = entry.processingQueue.then(task).catch((err) => logger.warn(`discord voice: processing failed: ${formatErrorMessage(err)}`));
	}
	enqueuePlayback(entry, task) {
		entry.playbackQueue = entry.playbackQueue.then(task).catch((err) => logger.warn(`discord voice: playback failed: ${formatErrorMessage(err)}`));
	}
	clearCaptureFinalizeTimer(entry, userId, generation) {
		return clearVoiceCaptureFinalizeTimer(entry.capture, userId, generation);
	}
	scheduleCaptureFinalize(entry, userId, reason) {
		const graceMs = resolveVoiceTimeoutMs(this.params.discordConfig.voice?.captureSilenceGraceMs, CAPTURE_FINALIZE_GRACE_MS);
		scheduleVoiceCaptureFinalize({
			state: entry.capture,
			userId,
			delayMs: graceMs,
			onFinalize: () => {
				logVoiceVerbose(`capture finalize: guild ${entry.guildId} channel ${entry.channelId} user ${userId} reason=${reason} grace=${graceMs}ms`);
			}
		});
	}
	async handleSpeakingStart(entry, userId) {
		if (!userId) return;
		if (this.botUserId && userId === this.botUserId) return;
		if (isVoiceCaptureActive(entry.capture, userId)) {
			const activeCapture = getActiveVoiceCapture(entry.capture, userId);
			const extended = activeCapture ? this.clearCaptureFinalizeTimer(entry, userId, activeCapture.generation) : false;
			logVoiceVerbose(`capture start ignored (already active): guild ${entry.guildId} channel ${entry.channelId} user ${userId}${extended ? " (finalize canceled)" : ""}`);
			return;
		}
		logVoiceVerbose(`capture start: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
		const voiceSdk = loadDiscordVoiceSdk();
		const voiceMode = resolveDiscordVoiceMode(this.params.discordConfig.voice);
		const realtime = entry.realtime && isDiscordRealtimeVoiceMode(voiceMode) ? entry.realtime : void 0;
		if (entry.player.state.status === voiceSdk.AudioPlayerStatus.Playing && !realtime) {
			logVoiceVerbose(`capture ignored during playback: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
			return;
		}
		const realtimeIngress = realtime ? await this.resolveDiscordVoiceIngressContext(entry, userId) : void 0;
		if (realtime && !realtimeIngress) {
			logVoiceVerbose(`realtime capture unauthorized: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
			return;
		}
		if (entry.player.state.status === voiceSdk.AudioPlayerStatus.Playing && realtime) {
			if (!realtime.isBargeInEnabled()) {
				logger.info(`discord voice: realtime capture ignored during playback (barge-in disabled): guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
				return;
			}
			logVoiceVerbose(`realtime barge-in: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
			logger.info(`discord voice: realtime barge-in detected source=speaker-start guild=${entry.guildId} channel=${entry.channelId} user=${userId} playerStatus=${entry.player.state.status}`);
			realtime.handleBargeIn("speaker-start");
		}
		this.enableDaveReceivePassthrough(entry, `speaker ${userId} start`, 15);
		const stream = entry.connection.receiver.subscribe(userId, { end: { behavior: voiceSdk.EndBehaviorType.Manual } });
		const generation = beginVoiceCapture(entry.capture, userId, stream);
		let streamAborted = false;
		let receiveFailureHandled = false;
		let receiveStreamEndHandled = false;
		const handleStreamError = (err) => {
			const analysis = analyzeVoiceReceiveError(err);
			if (analysis.isAbortLike && !analysis.countsAsDecryptFailure) {
				if (receiveStreamEndHandled) return;
				receiveStreamEndHandled = true;
				streamAborted = true;
				this.handleReceiveError(entry, err);
				return;
			}
			if (receiveFailureHandled) return;
			receiveFailureHandled = true;
			this.handleReceiveError(entry, err);
		};
		stream.on("error", handleStreamError);
		try {
			if (realtime && realtimeIngress) {
				const turn = realtime.beginSpeakerTurn(realtimeIngress, userId);
				try {
					await this.processRealtimeAudioCapture({
						entry,
						onReceiveError: handleStreamError,
						stream,
						turn
					});
				} finally {
					turn.close();
				}
				return;
			}
			const pcm = await decodeOpusStream(stream, {
				onError: handleStreamError,
				onVerbose: logVoiceVerbose,
				onWarn: (message) => logger.warn(message)
			});
			if (receiveFailureHandled) return;
			if (pcm.length === 0) {
				logVoiceVerbose(`capture empty: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
				return;
			}
			this.resetDecryptFailureState(entry);
			const { path: wavPath, durationSeconds } = await writeVoiceWavFile(pcm);
			if (durationSeconds < (streamAborted ? .2 : .35)) {
				logVoiceVerbose(`capture too short (${durationSeconds.toFixed(2)}s): guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
				return;
			}
			logVoiceVerbose(`capture ready (${durationSeconds.toFixed(2)}s): guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
			this.enqueueProcessing(entry, async () => {
				await this.processSegment({
					entry,
					wavPath,
					userId,
					durationSeconds
				});
			});
		} catch (err) {
			if (!receiveFailureHandled) this.handleReceiveError(entry, err);
			throw err;
		} finally {
			stream.off?.("error", handleStreamError);
			if (finishVoiceCapture(entry.capture, userId, generation) && !stream.destroyed) stream.destroy();
		}
	}
	async processRealtimeAudioCapture(params) {
		const { entry, onReceiveError, stream, turn } = params;
		let resetReceiveRecovery = false;
		await decodeOpusStreamChunks(stream, {
			onChunk: (pcm) => {
				if (!resetReceiveRecovery && pcm.length > 0) {
					resetReceiveRecovery = true;
					this.resetDecryptFailureState(entry);
				}
				turn.sendInputAudio(pcm);
			},
			onError: onReceiveError,
			onVerbose: logVoiceVerbose,
			onWarn: (message) => logger.warn(message)
		});
	}
	async resolveDiscordVoiceIngressContext(entry, userId) {
		return await resolveDiscordVoiceIngressContext({
			entry,
			userId,
			cfg: this.params.cfg,
			discordConfig: this.params.discordConfig,
			ownerAllowFrom: this.ownerAllowFrom,
			fetchGuildName: async (guildId) => {
				const guild = await this.params.client.fetchGuild(guildId).catch(() => null);
				return guild && typeof guild.name === "string" && guild.name.trim() ? guild.name : void 0;
			},
			speakerContext: this.speakerContext
		});
	}
	async runDiscordRealtimeAgentTurn(params) {
		const { context, entry, message, toolsAllow, userId } = params;
		logger.info(`discord voice: agent turn start guild=${entry.guildId} channel=${entry.channelId} voiceSession=${entry.voiceSessionKey} supervisorSession=${entry.route.sessionKey} agent=${entry.route.agentId} user=${userId} speaker=${context.speakerLabel} owner=${context.senderIsOwner} model=${this.params.discordConfig.voice?.model ?? "route-default"} message=${formatVoiceLogPreview(message)}`);
		const turn = await runDiscordVoiceAgentTurn({
			entry,
			userId,
			message,
			cfg: this.params.cfg,
			discordConfig: this.params.discordConfig,
			runtime: this.params.runtime,
			context,
			toolsAllow,
			ownerAllowFrom: this.ownerAllowFrom,
			fetchGuildName: async (guildId) => {
				const guild = await this.params.client.fetchGuild(guildId).catch(() => null);
				return guild && typeof guild.name === "string" && guild.name.trim() ? guild.name : void 0;
			},
			speakerContext: this.speakerContext
		});
		if (!turn) {
			logVoiceVerbose(`realtime agent unauthorized: guild ${entry.guildId} channel ${entry.channelId} user ${userId}`);
			return "";
		}
		logger.info(`discord voice: agent turn answer (${turn.text.length} chars) guild=${entry.guildId} channel=${entry.channelId} voiceSession=${entry.voiceSessionKey} supervisorSession=${entry.route.sessionKey} agent=${entry.route.agentId}: ${formatVoiceLogPreview(turn.text)}`);
		return turn.text;
	}
	async processSegment(params) {
		await processDiscordVoiceSegment({
			...params,
			cfg: this.params.cfg,
			discordConfig: this.params.discordConfig,
			ownerAllowFrom: this.ownerAllowFrom,
			runtime: this.params.runtime,
			speakerContext: this.speakerContext,
			transcripts: params.entry.transcripts,
			fetchGuildName: async (guildId) => {
				const guild = await this.params.client.fetchGuild(guildId).catch(() => null);
				return guild && typeof guild.name === "string" && guild.name.trim() ? guild.name : void 0;
			},
			enqueuePlayback: (entry, task) => {
				this.enqueuePlayback(entry, task);
			}
		});
	}
	handleReceiveError(entry, err) {
		const analysis = analyzeVoiceReceiveError(err);
		if (analysis.isAbortLike && !analysis.countsAsDecryptFailure) {
			logVoiceVerbose(`receive stream ended: ${analysis.message}`);
			return;
		}
		logger.warn(`discord voice: receive error: ${analysis.message}`);
		if (analysis.shouldAttemptPassthrough) this.enableDaveReceivePassthrough(entry, "receive decrypt error", 15);
		if (!analysis.countsAsDecryptFailure) return;
		const decryptFailure = noteVoiceDecryptFailure(entry.receiveRecovery);
		if (decryptFailure.firstFailure) logger.warn("discord voice: DAVE decrypt failures detected; voice receive may be unstable (upstream: discordjs/discord.js#11419)");
		if (!decryptFailure.shouldRecover) return;
		this.recoverFromDecryptFailures(entry).catch((recoverErr) => logger.warn(`discord voice: decrypt recovery failed: ${formatErrorMessage(recoverErr)}`)).finally(() => {
			finishVoiceDecryptRecovery(entry.receiveRecovery);
		});
	}
	enableDaveReceivePassthrough(entry, reason, expirySeconds) {
		const voiceSdk = loadDiscordVoiceSdk();
		return enableDaveReceivePassthrough({
			target: {
				guildId: entry.guildId,
				channelId: entry.channelId,
				connection: entry.connection
			},
			sdk: {
				VoiceConnectionStatus: { Ready: voiceSdk.VoiceConnectionStatus.Ready },
				NetworkingStatusCode: {
					Ready: voiceSdk.NetworkingStatusCode.Ready,
					Resuming: voiceSdk.NetworkingStatusCode.Resuming
				}
			},
			reason,
			expirySeconds,
			onVerbose: logVoiceVerbose,
			onWarn: (message) => logger.warn(message)
		});
	}
	resetDecryptFailureState(entry) {
		resetVoiceReceiveRecoveryState(entry.receiveRecovery);
	}
	async recoverFromDecryptFailures(entry) {
		const active = this.sessions.get(entry.guildId);
		if (!active || active.connection !== entry.connection) return;
		const preserveFollowState = this.isFollowOwnedGuild(entry.guildId);
		logger.warn(`discord voice: repeated decrypt failures; attempting rejoin for guild ${entry.guildId} channel ${entry.channelId}`);
		const leaveResult = await this.leave({ guildId: entry.guildId }, { preserveFollowState });
		if (!leaveResult.ok) {
			logger.warn(`discord voice: decrypt recovery leave failed: ${leaveResult.message}`);
			return;
		}
		const result = await this.join({
			guildId: entry.guildId,
			channelId: entry.channelId
		}, { preserveFollowState });
		if (!result.ok) logger.warn(`discord voice: rejoin after decrypt failures failed: ${result.message}`);
	}
};
var DiscordVoiceReadyListener$1 = class extends ReadyListener {
	constructor(manager) {
		super();
		this.manager = manager;
	}
	async handle(_data, _client) {
		startAutoJoin(this.manager);
	}
};
var DiscordVoiceResumedListener$1 = class extends ResumedListener {
	constructor(manager) {
		super();
		this.manager = manager;
	}
	async handle(_data, _client) {
		startAutoJoin(this.manager);
	}
};
var DiscordVoiceStateUpdateListener$1 = class extends VoiceStateUpdateListener {
	constructor(manager) {
		super();
		this.manager = manager;
	}
	async handle(data, _client) {
		await this.manager.handleVoiceStateUpdate(data);
	}
};
//#endregion
//#region extensions/discord/src/voice/manager.runtime.ts
var DiscordVoiceManager = class extends DiscordVoiceManager$1 {};
var DiscordVoiceReadyListener = class extends DiscordVoiceReadyListener$1 {};
var DiscordVoiceResumedListener = class extends DiscordVoiceResumedListener$1 {};
var DiscordVoiceStateUpdateListener = class extends DiscordVoiceStateUpdateListener$1 {};
//#endregion
export { DiscordVoiceManager, DiscordVoiceReadyListener, DiscordVoiceResumedListener, DiscordVoiceStateUpdateListener };
