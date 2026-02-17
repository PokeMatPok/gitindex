import { CONFIG, LOG } from "./config";
import { repoModule } from "./component_scripts/repo";
import { searchModule } from "./component_scripts/search";
import type { loaderData } from "./types/general";
import { logoModule } from "./component_scripts/logo";
import { Modal } from "./component_scripts/modal";
import { DOMWatcher } from "./component_scripts/utils";

let currentRoute: string = "";
let languagesGlobal: Map<string, { color: string }> = new Map();
let mountedModule: loaderData | null = null;

function loadLanguageColors(): Promise<Map<string, { color: string }>> {
    if (languagesGlobal.size > 0) {
        return Promise.resolve(languagesGlobal);
    } else {
        return fetch(chrome.runtime.getURL("assets/languages.json"))
            .then(r => r.json())
            .then((data: Record<string, { color: string }>) => {
                const map = new Map<string, { color: string }>();
                for (const [lang, meta] of Object.entries(data)) {
                    map.set(lang, { color: meta.color });
                }

                languagesGlobal = map;

                return map;
            });
    }
}

function checkForNavigationChange() {
    if (location.href !== currentRoute) {
        currentRoute = location.href;
        loadLanguageColors().then((languages) => {
            const loader = matchURLLoader();
            if (loader) {
                // remount even if the same module, as vDom might have changed
                LOG.log("Route change detected, remounting module...");
                mountedModule?.unmount();
                loader.module.mount(languages, CONFIG.features[loader.featureSet as keyof typeof CONFIG.features] ?? undefined);
                mountedModule = loader.module;
            } else if (mountedModule) {
                mountedModule.unmount();
                mountedModule = null;
            }

        });
    }
}

function matchURLLoader(): {module: loaderData, featureSet: string} | null {
    const pathSegments = new URL(window.location.href).pathname.split("/").filter(Boolean);

    const RESERVED_ROUTES = CONFIG.routes.reserved as readonly string[];

    if (pathSegments.length === 1 && pathSegments[0] === "search") {
        return {module: searchModule, featureSet: "search"};
    } else if (
        pathSegments.length >= 2 &&
        !RESERVED_ROUTES.includes(pathSegments[0] ?? "")
    ) {
        return {module: repoModule, featureSet: "repo"};
    }


    return null;
}


function init() {
    LOG.log("Initializing content script...");
    LOG.log("Logging is enabled. To disable, set CONFIG.logging.enabled = false in config.ts.");
    loadLanguageColors().then((languages) => {
        checkForNavigationChange();

        DOMWatcher.appendCallback("routeChangeWatcher", () => {
            checkForNavigationChange();
        });

        // Listen for URL changes (for SPA navigation)
        if (!(history as any).__gitIndexPatched) {
            const originalPush = history.pushState;
            history.pushState = function (...args) {
                originalPush.apply(this, args);
                checkForNavigationChange();
            };
            (history as any).__gitIndexPatched = true;
        }

        logoModule.mount(languages);
        Modal.createModal();

        window.addEventListener("popstate", checkForNavigationChange);
        window.addEventListener("pjax:end", checkForNavigationChange);
        document.addEventListener("turbo:load", checkForNavigationChange);

        // polling fallback for any navigation changes that might be missed
        if (CONFIG.navigation.backupPolling.enabled) {
            LOG.log(`Backup polling enabled. Polling every ${CONFIG.navigation.backupPolling.intervalMs} ms.`);
            setInterval(checkForNavigationChange, CONFIG.navigation.backupPolling.intervalMs);
        }
    });
};

init();