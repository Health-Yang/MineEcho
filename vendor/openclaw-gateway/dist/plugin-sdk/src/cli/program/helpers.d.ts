import { type Command } from "commander";
export declare function collectOption(value: string, previous?: string[]): string[];
export declare function parsePositiveIntOrUndefined(value: unknown): number | undefined;
export declare function parseStrictPositiveIntOrUndefined(value: unknown): number | undefined;
export declare function parseStrictPositiveIntOption(value: string, flag: string): number;
export declare function resolveActionArgs(actionCommand?: Command): string[];
export declare function resolveCommandOptionArgs(command?: Command): string[];
