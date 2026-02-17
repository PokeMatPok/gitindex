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
        logo: new Map([
            ["gitindex-logo-header", {
                displayName: "GitIndex Logo in Header",
                description: "Injects the GitIndex mascot into the GitHub header for branding.",
                enabled: true
            }]
        ]),
        repo: new Map([
            ["pie_chart_lang_display", {
                displayName: "Pie Chart Language Display",
                description: "Adds additional pie chart visualization for repository languages.",
                enabled: true
            }],
            ["edit_button", {
                displayName: "Edit Button",
                description: "Adds an edit button to repository pages for quick access to editing.",
                enabled: true
            }], 
            ["file_hover_quick_actions", {
                displayName: "File Hover Quick Actions",
                description: "Adds quick action buttons when hovering over files in repository pages.",
                enabled: true
            }]
        ])
    }
};


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
