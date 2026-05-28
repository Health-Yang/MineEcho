import { z } from "zod";
export declare const GoogleChatDmSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    policy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        allowlist: "allowlist";
        disabled: "disabled";
        open: "open";
        pairing: "pairing";
    }>>>;
    allowFrom: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
}, z.core.$strict>;
export declare const GoogleChatGroupSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    requireMention: z.ZodOptional<z.ZodBoolean>;
    botLoopProtection: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        maxEventsPerWindow: z.ZodOptional<z.ZodNumber>;
        windowSeconds: z.ZodOptional<z.ZodNumber>;
        cooldownSeconds: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    users: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    systemPrompt: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const GoogleChatAccountSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    configWrites: z.ZodOptional<z.ZodBoolean>;
    allowBots: z.ZodOptional<z.ZodBoolean>;
    botLoopProtection: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        maxEventsPerWindow: z.ZodOptional<z.ZodNumber>;
        windowSeconds: z.ZodOptional<z.ZodNumber>;
        cooldownSeconds: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    dangerouslyAllowNameMatching: z.ZodOptional<z.ZodBoolean>;
    requireMention: z.ZodOptional<z.ZodBoolean>;
    groupPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        allowlist: "allowlist";
        disabled: "disabled";
        open: "open";
    }>>>;
    groupAllowFrom: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    groups: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        requireMention: z.ZodOptional<z.ZodBoolean>;
        botLoopProtection: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            maxEventsPerWindow: z.ZodOptional<z.ZodNumber>;
            windowSeconds: z.ZodOptional<z.ZodNumber>;
            cooldownSeconds: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
        users: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        systemPrompt: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>>;
    defaultTo: z.ZodOptional<z.ZodString>;
    serviceAccount: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodDiscriminatedUnion<[z.ZodObject<{
        source: z.ZodLiteral<"env">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        source: z.ZodLiteral<"file">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        source: z.ZodLiteral<"exec">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>], "source">]>>;
    serviceAccountRef: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        source: z.ZodLiteral<"env">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        source: z.ZodLiteral<"file">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        source: z.ZodLiteral<"exec">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>], "source">>;
    serviceAccountFile: z.ZodOptional<z.ZodString>;
    audienceType: z.ZodOptional<z.ZodEnum<{
        "app-url": "app-url";
        "project-number": "project-number";
    }>>;
    audience: z.ZodOptional<z.ZodString>;
    appPrincipal: z.ZodOptional<z.ZodString>;
    webhookPath: z.ZodOptional<z.ZodString>;
    webhookUrl: z.ZodOptional<z.ZodString>;
    botUser: z.ZodOptional<z.ZodString>;
    historyLimit: z.ZodOptional<z.ZodNumber>;
    dmHistoryLimit: z.ZodOptional<z.ZodNumber>;
    dms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        historyLimit: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>>>;
    textChunkLimit: z.ZodOptional<z.ZodNumber>;
    chunkMode: z.ZodOptional<z.ZodEnum<{
        length: "length";
        newline: "newline";
    }>>;
    blockStreaming: z.ZodOptional<z.ZodBoolean>;
    blockStreamingCoalesce: z.ZodOptional<z.ZodObject<{
        minChars: z.ZodOptional<z.ZodNumber>;
        maxChars: z.ZodOptional<z.ZodNumber>;
        idleMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    mediaMaxMb: z.ZodOptional<z.ZodNumber>;
    replyToMode: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"off">, z.ZodLiteral<"first">, z.ZodLiteral<"all">, z.ZodLiteral<"batched">]>>;
    actions: z.ZodOptional<z.ZodObject<{
        reactions: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    dm: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        policy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            allowlist: "allowlist";
            disabled: "disabled";
            open: "open";
            pairing: "pairing";
        }>>>;
        allowFrom: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    }, z.core.$strict>>;
    healthMonitor: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    typingIndicator: z.ZodOptional<z.ZodEnum<{
        message: "message";
        none: "none";
        reaction: "reaction";
    }>>;
    responsePrefix: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const GoogleChatConfigSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    configWrites: z.ZodOptional<z.ZodBoolean>;
    allowBots: z.ZodOptional<z.ZodBoolean>;
    botLoopProtection: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        maxEventsPerWindow: z.ZodOptional<z.ZodNumber>;
        windowSeconds: z.ZodOptional<z.ZodNumber>;
        cooldownSeconds: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    dangerouslyAllowNameMatching: z.ZodOptional<z.ZodBoolean>;
    requireMention: z.ZodOptional<z.ZodBoolean>;
    groupPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        allowlist: "allowlist";
        disabled: "disabled";
        open: "open";
    }>>>;
    groupAllowFrom: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    groups: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        requireMention: z.ZodOptional<z.ZodBoolean>;
        botLoopProtection: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            maxEventsPerWindow: z.ZodOptional<z.ZodNumber>;
            windowSeconds: z.ZodOptional<z.ZodNumber>;
            cooldownSeconds: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
        users: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        systemPrompt: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>>;
    defaultTo: z.ZodOptional<z.ZodString>;
    serviceAccount: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodDiscriminatedUnion<[z.ZodObject<{
        source: z.ZodLiteral<"env">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        source: z.ZodLiteral<"file">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        source: z.ZodLiteral<"exec">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>], "source">]>>;
    serviceAccountRef: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        source: z.ZodLiteral<"env">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        source: z.ZodLiteral<"file">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        source: z.ZodLiteral<"exec">;
        provider: z.ZodString;
        id: z.ZodString;
    }, z.core.$strict>], "source">>;
    serviceAccountFile: z.ZodOptional<z.ZodString>;
    audienceType: z.ZodOptional<z.ZodEnum<{
        "app-url": "app-url";
        "project-number": "project-number";
    }>>;
    audience: z.ZodOptional<z.ZodString>;
    appPrincipal: z.ZodOptional<z.ZodString>;
    webhookPath: z.ZodOptional<z.ZodString>;
    webhookUrl: z.ZodOptional<z.ZodString>;
    botUser: z.ZodOptional<z.ZodString>;
    historyLimit: z.ZodOptional<z.ZodNumber>;
    dmHistoryLimit: z.ZodOptional<z.ZodNumber>;
    dms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        historyLimit: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>>>;
    textChunkLimit: z.ZodOptional<z.ZodNumber>;
    chunkMode: z.ZodOptional<z.ZodEnum<{
        length: "length";
        newline: "newline";
    }>>;
    blockStreaming: z.ZodOptional<z.ZodBoolean>;
    blockStreamingCoalesce: z.ZodOptional<z.ZodObject<{
        minChars: z.ZodOptional<z.ZodNumber>;
        maxChars: z.ZodOptional<z.ZodNumber>;
        idleMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    mediaMaxMb: z.ZodOptional<z.ZodNumber>;
    replyToMode: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"off">, z.ZodLiteral<"first">, z.ZodLiteral<"all">, z.ZodLiteral<"batched">]>>;
    actions: z.ZodOptional<z.ZodObject<{
        reactions: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    dm: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        policy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            allowlist: "allowlist";
            disabled: "disabled";
            open: "open";
            pairing: "pairing";
        }>>>;
        allowFrom: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
    }, z.core.$strict>>;
    healthMonitor: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strict>>;
    typingIndicator: z.ZodOptional<z.ZodEnum<{
        message: "message";
        none: "none";
        reaction: "reaction";
    }>>;
    responsePrefix: z.ZodOptional<z.ZodString>;
    accounts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        configWrites: z.ZodOptional<z.ZodBoolean>;
        allowBots: z.ZodOptional<z.ZodBoolean>;
        botLoopProtection: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            maxEventsPerWindow: z.ZodOptional<z.ZodNumber>;
            windowSeconds: z.ZodOptional<z.ZodNumber>;
            cooldownSeconds: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
        dangerouslyAllowNameMatching: z.ZodOptional<z.ZodBoolean>;
        requireMention: z.ZodOptional<z.ZodBoolean>;
        groupPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            allowlist: "allowlist";
            disabled: "disabled";
            open: "open";
        }>>>;
        groupAllowFrom: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        groups: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            requireMention: z.ZodOptional<z.ZodBoolean>;
            botLoopProtection: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodOptional<z.ZodBoolean>;
                maxEventsPerWindow: z.ZodOptional<z.ZodNumber>;
                windowSeconds: z.ZodOptional<z.ZodNumber>;
                cooldownSeconds: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strict>>;
            users: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
            systemPrompt: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>>;
        defaultTo: z.ZodOptional<z.ZodString>;
        serviceAccount: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>, z.ZodDiscriminatedUnion<[z.ZodObject<{
            source: z.ZodLiteral<"env">;
            provider: z.ZodString;
            id: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            source: z.ZodLiteral<"file">;
            provider: z.ZodString;
            id: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            source: z.ZodLiteral<"exec">;
            provider: z.ZodString;
            id: z.ZodString;
        }, z.core.$strict>], "source">]>>;
        serviceAccountRef: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
            source: z.ZodLiteral<"env">;
            provider: z.ZodString;
            id: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            source: z.ZodLiteral<"file">;
            provider: z.ZodString;
            id: z.ZodString;
        }, z.core.$strict>, z.ZodObject<{
            source: z.ZodLiteral<"exec">;
            provider: z.ZodString;
            id: z.ZodString;
        }, z.core.$strict>], "source">>;
        serviceAccountFile: z.ZodOptional<z.ZodString>;
        audienceType: z.ZodOptional<z.ZodEnum<{
            "app-url": "app-url";
            "project-number": "project-number";
        }>>;
        audience: z.ZodOptional<z.ZodString>;
        appPrincipal: z.ZodOptional<z.ZodString>;
        webhookPath: z.ZodOptional<z.ZodString>;
        webhookUrl: z.ZodOptional<z.ZodString>;
        botUser: z.ZodOptional<z.ZodString>;
        historyLimit: z.ZodOptional<z.ZodNumber>;
        dmHistoryLimit: z.ZodOptional<z.ZodNumber>;
        dms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
            historyLimit: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>>>;
        textChunkLimit: z.ZodOptional<z.ZodNumber>;
        chunkMode: z.ZodOptional<z.ZodEnum<{
            length: "length";
            newline: "newline";
        }>>;
        blockStreaming: z.ZodOptional<z.ZodBoolean>;
        blockStreamingCoalesce: z.ZodOptional<z.ZodObject<{
            minChars: z.ZodOptional<z.ZodNumber>;
            maxChars: z.ZodOptional<z.ZodNumber>;
            idleMs: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
        mediaMaxMb: z.ZodOptional<z.ZodNumber>;
        replyToMode: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"off">, z.ZodLiteral<"first">, z.ZodLiteral<"all">, z.ZodLiteral<"batched">]>>;
        actions: z.ZodOptional<z.ZodObject<{
            reactions: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        dm: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            policy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                allowlist: "allowlist";
                disabled: "disabled";
                open: "open";
                pairing: "pairing";
            }>>>;
            allowFrom: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        }, z.core.$strict>>;
        healthMonitor: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
        typingIndicator: z.ZodOptional<z.ZodEnum<{
            message: "message";
            none: "none";
            reaction: "reaction";
        }>>;
        responsePrefix: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>>;
    defaultAccount: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
