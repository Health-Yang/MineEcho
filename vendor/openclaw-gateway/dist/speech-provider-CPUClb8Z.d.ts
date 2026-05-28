import { L as SpeechVoiceOption } from "./tts-runtime.types-CB2-60c5.js";
import { Kn as SpeechProviderPlugin } from "./types-qwKXExVW.js";
//#region extensions/microsoft/speech-provider.d.ts
declare function isCjkDominant(text: string): boolean;
declare function listMicrosoftVoices(): Promise<SpeechVoiceOption[]>;
declare function buildMicrosoftSpeechProvider(): SpeechProviderPlugin;
//#endregion
export { isCjkDominant as n, listMicrosoftVoices as r, buildMicrosoftSpeechProvider as t };