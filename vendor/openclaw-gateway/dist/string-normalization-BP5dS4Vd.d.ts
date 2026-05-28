//#region src/shared/string-normalization.d.ts
declare function normalizeStringEntries(list?: ReadonlyArray<unknown>): string[];
declare function normalizeStringEntriesLower(list?: ReadonlyArray<unknown>): string[];
declare function uniqueValues<T>(values: Iterable<T>): T[];
declare function uniqueStrings(values: Iterable<string>): string[];
declare function sortUniqueStrings(values: Iterable<string>): string[];
declare function normalizeUniqueStringEntries(values?: Iterable<unknown>): string[];
declare function normalizeUniqueStringEntriesLower(values?: Iterable<unknown>): string[];
declare function normalizeSortedUniqueStringEntries(values?: Iterable<unknown>): string[];
declare function normalizeTrimmedStringList(value: unknown): string[];
declare function normalizeUniqueTrimmedStringList(value: unknown): string[];
declare function normalizeSortedUniqueTrimmedStringList(value: unknown): string[];
declare function normalizeOptionalTrimmedStringList(value: unknown): string[] | undefined;
declare function normalizeArrayBackedTrimmedStringList(value: unknown): string[] | undefined;
declare function normalizeSingleOrTrimmedStringList(value: unknown): string[];
declare function normalizeUniqueSingleOrTrimmedStringList(value: unknown): string[];
declare function normalizeCsvOrLooseStringList(value: unknown): string[];
declare function normalizeHyphenSlug(raw?: string | null): string;
declare function normalizeAtHashSlug(raw?: string | null): string;
//#endregion
export { uniqueStrings as _, normalizeOptionalTrimmedStringList as a, normalizeSortedUniqueTrimmedStringList as c, normalizeTrimmedStringList as d, normalizeUniqueSingleOrTrimmedStringList as f, sortUniqueStrings as g, normalizeUniqueTrimmedStringList as h, normalizeHyphenSlug as i, normalizeStringEntries as l, normalizeUniqueStringEntriesLower as m, normalizeAtHashSlug as n, normalizeSingleOrTrimmedStringList as o, normalizeUniqueStringEntries as p, normalizeCsvOrLooseStringList as r, normalizeSortedUniqueStringEntries as s, normalizeArrayBackedTrimmedStringList as t, normalizeStringEntriesLower as u, uniqueValues as v };