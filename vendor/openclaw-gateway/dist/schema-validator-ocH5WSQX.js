import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { t as PluginLruCache } from "./plugin-cache-primitives-DcK62VYf.js";
import { t as sanitizeTerminalText } from "./safe-text-J_0sTthZ.js";
import { n as findJsonSchemaShapeError, r as normalizeJsonSchemaForTypeBox, t as applyJsonSchemaDefaults } from "./json-schema-defaults-Culxgo98.js";
import { Compile } from "typebox/compile";
import { Format } from "typebox/format";
//#region src/config/allowed-values.ts
const MAX_ALLOWED_VALUES_HINT = 12;
const MAX_ALLOWED_VALUE_CHARS = 160;
function truncateHintText(text, limit) {
	if (text.length <= limit) return text;
	return `${text.slice(0, limit)}... (+${text.length - limit} chars)`;
}
function safeStringify(value) {
	try {
		const serialized = JSON.stringify(value);
		if (serialized !== void 0) return serialized;
	} catch {}
	return String(value);
}
function toAllowedValueLabel(value) {
	if (typeof value === "string") return JSON.stringify(truncateHintText(value, MAX_ALLOWED_VALUE_CHARS));
	return truncateHintText(safeStringify(value), MAX_ALLOWED_VALUE_CHARS);
}
function toAllowedValueValue(value) {
	if (typeof value === "string") return value;
	return safeStringify(value);
}
function toAllowedValueDedupKey(value) {
	if (value === null) return "null:null";
	const kind = typeof value;
	if (kind === "string") return `string:${value}`;
	return `${kind}:${safeStringify(value)}`;
}
function summarizeAllowedValues(values) {
	if (values.length === 0) return null;
	const deduped = [];
	const seenValues = /* @__PURE__ */ new Set();
	for (const item of values) {
		const dedupeKey = toAllowedValueDedupKey(item);
		if (seenValues.has(dedupeKey)) continue;
		seenValues.add(dedupeKey);
		deduped.push({
			value: toAllowedValueValue(item),
			label: toAllowedValueLabel(item)
		});
	}
	const shown = deduped.slice(0, MAX_ALLOWED_VALUES_HINT);
	const hiddenCount = deduped.length - shown.length;
	const formattedCore = shown.map((entry) => entry.label).join(", ");
	const formatted = hiddenCount > 0 ? `${formattedCore}, ... (+${hiddenCount} more)` : formattedCore;
	return {
		values: shown.map((entry) => entry.value),
		hiddenCount,
		formatted
	};
}
function messageAlreadyIncludesAllowedValues(message) {
	const lower = normalizeLowercaseStringOrEmpty(message);
	return lower.includes("(allowed:") || lower.includes("expected one of");
}
function appendAllowedValuesHint(message, summary) {
	if (messageAlreadyIncludesAllowedValues(message)) return message;
	return `${message} (allowed: ${summary.formatted})`;
}
//#endregion
//#region src/plugins/schema-validator.ts
const schemaCache = new PluginLruCache(512);
const annotationOnlyFormats = [
	"date-time",
	"date",
	"duration",
	"email",
	"hostname",
	"idn-email",
	"idn-hostname",
	"ipv4",
	"ipv6",
	"iri-reference",
	"iri",
	"json-pointer-uri-fragment",
	"json-pointer",
	"regex",
	"relative-json-pointer",
	"time",
	"uri-reference",
	"uri-template",
	"url",
	"uuid"
];
function fingerprintSchema(schema) {
	return JSON.stringify(schema);
}
function schemaHasDefaults(schema) {
	if (!schema || typeof schema !== "object") return false;
	if (Array.isArray(schema)) return schema.some((item) => schemaHasDefaults(item));
	const record = schema;
	if (Object.prototype.hasOwnProperty.call(record, "default")) return true;
	return Object.values(record).some((value) => schemaHasDefaults(value));
}
function cloneValidationValue(value) {
	if (value === void 0 || value === null) return value;
	return structuredClone(value);
}
function compileSchema(schema) {
	return Compile(normalizeJsonSchemaForTypeBox(schema));
}
function relaxConditionalRequiredKeywords(schema, insideConditionalBranch = false) {
	if (Array.isArray(schema)) return schema.map((entry) => relaxConditionalRequiredKeywords(entry, insideConditionalBranch));
	if (!schema || typeof schema !== "object") return schema;
	return Object.fromEntries(Object.entries(schema).filter(([key]) => !(insideConditionalBranch && key === "required")).map(([key, value]) => [key, typeof value === "boolean" || value && typeof value === "object" ? relaxConditionalRequiredKeywords(value, insideConditionalBranch || key === "then" || key === "else") : value]));
}
function withPluginFormatSemantics(callback) {
	const previousFormats = Format.Entries();
	Format.Set("uri", (value) => URL.canParse(value));
	for (const format of annotationOnlyFormats) Format.Set(format, () => true);
	try {
		return callback();
	} finally {
		Format.Clear();
		for (const [format, check] of previousFormats) Format.Set(format, check);
	}
}
function checkSchema(validate, value) {
	return withPluginFormatSemantics(() => {
		if (validate.Check(value)) return null;
		return [...validate.Errors(value)];
	});
}
function applyDefaultsWithPluginFormatSemantics(schema, value) {
	return withPluginFormatSemantics(() => applyJsonSchemaDefaults(schema, value));
}
function isDefaultActivatedConditionalFailure(params) {
	if (checkSchema(compileSchema(relaxConditionalRequiredKeywords(params.schema)), params.defaultedValue)) return false;
	return checkSchema(compileSchema(params.schema), params.originalValue) === null;
}
function normalizeErrorPath(instancePath) {
	const path = instancePath?.replace(/^\//, "").replace(/\//g, ".");
	return path && path.length > 0 ? path : "<root>";
}
function appendPathSegment(path, segment) {
	const trimmed = segment.trim();
	if (!trimmed) return path;
	if (path === "<root>") return trimmed;
	return `${path}.${trimmed}`;
}
function firstStringParam(value) {
	if (typeof value === "string" && value.trim()) return value;
	if (Array.isArray(value)) return value.find((entry) => typeof entry === "string" && entry.trim().length > 0) ?? null;
	return null;
}
function resolveMissingProperty(error) {
	if (error.keyword !== "required" && error.keyword !== "dependentRequired" && error.keyword !== "dependencies") return null;
	return firstStringParam(error.params?.missingProperty) ?? firstStringParam(error.params?.requiredProperties) ?? firstStringParam(error.params?.dependencies);
}
function resolveValidationErrorPath(error) {
	const basePath = normalizeErrorPath(error.instancePath);
	const missingProperty = resolveMissingProperty(error);
	if (!missingProperty) return basePath;
	return appendPathSegment(basePath, missingProperty);
}
function extractAllowedValues(error) {
	if (error.keyword === "enum") {
		const allowedValues = error.params?.allowedValues;
		return Array.isArray(allowedValues) ? allowedValues : null;
	}
	if (error.keyword === "const") {
		const params = error.params;
		if (!params || !Object.prototype.hasOwnProperty.call(params, "allowedValue")) return null;
		return [params.allowedValue];
	}
	return null;
}
function getAllowedValuesSummary(error) {
	const allowedValues = extractAllowedValues(error);
	if (!allowedValues) return null;
	return summarizeAllowedValues(allowedValues);
}
function resolveAdditionalProperty(error) {
	if (error.keyword !== "additionalProperties") return;
	return firstStringParam(error.params?.additionalProperty) ?? void 0;
}
function resolveAdditionalProperties(error) {
	if (error.keyword !== "additionalProperties") return [];
	const additionalProperties = error.params?.additionalProperties;
	if (Array.isArray(additionalProperties)) return additionalProperties.filter((entry) => typeof entry === "string");
	const additionalProperty = error.params?.additionalProperty;
	return typeof additionalProperty === "string" ? [additionalProperty] : [];
}
function formatRequiredMessage(error) {
	const missingProperty = resolveMissingProperty(error);
	if (!missingProperty) return null;
	return `must have required property '${missingProperty}'`;
}
function formatAdditionalPropertiesMessage(error) {
	const additionalProperties = resolveAdditionalProperties(error);
	if (additionalProperties.length === 0) return null;
	return `must not have additional properties: ${additionalProperties.map((entry) => `"${entry}"`).join(", ")}`;
}
function formatValidationErrorMessage(error) {
	return formatRequiredMessage(error) ?? formatAdditionalPropertiesMessage(error) ?? error.message ?? "invalid";
}
function formatValidationErrors(errors) {
	if (!errors || errors.length === 0) return [{
		path: "<root>",
		message: "invalid config",
		text: "<root>: invalid config"
	}];
	return errors.map((error) => {
		const path = resolveValidationErrorPath(error);
		const baseMessage = formatValidationErrorMessage(error);
		const allowedValuesSummary = getAllowedValuesSummary(error);
		const additionalProperty = resolveAdditionalProperty(error);
		const message = allowedValuesSummary ? appendAllowedValuesHint(baseMessage, allowedValuesSummary) : baseMessage;
		return {
			path,
			message,
			text: `${sanitizeTerminalText(path)}: ${sanitizeTerminalText(message)}`,
			...additionalProperty ? { additionalProperty } : {},
			...allowedValuesSummary ? {
				allowedValues: allowedValuesSummary.values,
				allowedValuesHiddenCount: allowedValuesSummary.hiddenCount
			} : {}
		};
	});
}
function validateJsonSchemaValue(params) {
	const schemaError = findJsonSchemaShapeError(params.schema);
	if (schemaError) throw new Error(sanitizeTerminalText(`invalid schema: ${schemaError}`));
	if (!(params.cache !== false)) {
		const validate = compileSchema(params.schema);
		const value = params.applyDefaults && schemaHasDefaults(params.schema) ? applyDefaultsWithPluginFormatSemantics(params.schema, cloneValidationValue(params.value)) : params.value;
		const errors = checkSchema(validate, value);
		if (!errors) return {
			ok: true,
			value
		};
		if (params.applyDefaults && value !== params.value && isDefaultActivatedConditionalFailure({
			schema: params.schema,
			originalValue: params.value,
			defaultedValue: value
		})) return {
			ok: true,
			value
		};
		return {
			ok: false,
			errors: formatValidationErrors(errors)
		};
	}
	const cacheKey = params.applyDefaults ? `${params.cacheKey}::defaults` : params.cacheKey;
	let cached = schemaCache.get(cacheKey);
	const schemaFingerprint = !cached || cached.schema !== params.schema ? fingerprintSchema(params.schema) : void 0;
	if (!cached || cached.schema !== params.schema && cached.schemaFingerprint !== schemaFingerprint) {
		const validate = compileSchema(params.schema);
		cached = {
			hasDefaults: params.applyDefaults ? schemaHasDefaults(params.schema) : false,
			validate,
			schema: params.schema,
			schemaFingerprint: schemaFingerprint ?? fingerprintSchema(params.schema)
		};
		schemaCache.set(cacheKey, cached);
	} else if (cached.schema !== params.schema) cached.schema = params.schema;
	const value = params.applyDefaults && cached.hasDefaults ? applyDefaultsWithPluginFormatSemantics(params.schema, cloneValidationValue(params.value)) : params.value;
	const errors = checkSchema(cached.validate, value);
	if (!errors) return {
		ok: true,
		value
	};
	if (params.applyDefaults && value !== params.value && isDefaultActivatedConditionalFailure({
		schema: params.schema,
		originalValue: params.value,
		defaultedValue: value
	})) return {
		ok: true,
		value
	};
	return {
		ok: false,
		errors: formatValidationErrors(errors)
	};
}
//#endregion
export { appendAllowedValuesHint as n, summarizeAllowedValues as r, validateJsonSchemaValue as t };
