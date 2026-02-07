import { repoModule } from "./repo";
import { searchModule } from "./search";

let currentRoute: string = "";
let languagesGlobal: Map<string, { color: string }> = new Map();
let mountedModule: Loader | null = null;

interface Loader {
    mounted: boolean;
    mount: (languagesGlobalIn: Map<string, { color: string }>) => void;
    unmount: () => void;
}

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
                if (mountedModule && mountedModule !== loader) {
                    console.log("GitIndex: Mounting module for current route...");
                    mountedModule.unmount();
                    loader.mount(languages);
                    mountedModule = loader;
                }
            }
        });
    }
}

function matchURLLoader(): Loader | null {
    const pathSegments = new URL(window.location.href).pathname.split("/").filter(Boolean);

    if (pathSegments.length === 1 && pathSegments[0] === "search") {
        return searchModule;
    } else if (
        pathSegments.length === 2 &&
        !["topics", "sponsors", "settings"].includes(pathSegments[0] ?? "")
    ) {
        return repoModule;
    }


    return null;
}


function init() {
    console.log("GitIndex: Initializing content script...");
    loadLanguageColors().then((languages) => {
        const loader = matchURLLoader();

        currentRoute = location.href;

        if (loader) {
            if (mountedModule === null || mountedModule !== loader) {
                console.log("GitIndex: Mounting initial module for current route...");
                mountedModule?.unmount();
                loader.mount(languages);
                mountedModule = loader;
            }
        }

        setInterval(checkForNavigationChange, 1000);
    });
};

init();