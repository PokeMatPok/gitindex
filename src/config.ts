// config.ts

// this is a configuration file no logic should be implemented here, only constants and helper functions

export const CONFIG = {
    logging: {
        enabled: process.env.NODE_ENV === "development",
        prefix: "GitIndex",
        prefix_color: "#F2C94C"
    },

    navigation: {
        backupPolling: {
            enabled: true,
            intervalMs: 5000
        },
        debounceMs: 50
    },

    routes: {
        reserved: ["topics", "sponsors", "settings"],
        repoSubroutes: ["tree", "blob", "pull", "issues", "commit"]
    },

    features: {
        hoverPopups: true,
        languageCharts: true,
        fileActions: true,
        themes: true
    }
} as const;


type LogLevel = "log" | "info" | "warn" | "error";

function write(level: LogLevel, args: any[]) {
    if (!CONFIG.logging.enabled) return;

    console[level](
        "%c%s: %c",
        `color: ${CONFIG.logging.prefix_color}; font-weight: bold;`,
        CONFIG.logging.prefix,
        "color: white;",
        ...args
    );
}

export const LOG = {
    log: (...args: any[]) => write("log", args),
    info: (...args: any[]) => write("info", args),
    warn: (...args: any[]) => write("warn", args),
    error: (...args: any[]) => write("error", args),
};
