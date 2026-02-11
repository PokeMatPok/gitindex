import { GithubRepoRequest } from "./../api";
import { CONFIG, LOG } from "./../config";
import { hidePopup, populatePopup, registerPopupDiv, type PopupFields } from "./search/popup";
import type { loaderData } from "./../types/general";
import type { GithubRepoResponse } from "./../types/repo";

// Regex to identify GitHub repository URLs 

const searchRegex = /^https?:\/\/(.*\.)?github\.com\/.+\/.+/;
const onsiteRegex = /^\/.+\/.+/;

let popupDiv: {
    element: HTMLDivElement;
    fields: PopupFields;
} | null = null;

// Debounce/Cache settings

let debounceTime: number = 200; // MS
let hoverTimer: number | null = null;
let currentHoverToken: number = 0;
let dataCache = new Map<string, GithubRepoResponse>();

// Load languages.json for language colors
let languages = new Map<string, {
    color: string;
}>();

// Main hover handler

function handleHover(event: MouseEvent) {
    let target: HTMLAnchorElement | null | undefined;
    try {
        target = (event.target as Element | null)?.closest("a");
    } catch (e) {
        LOG.warn("Error in handleHover:", e);
        LOG.log("Note: This Issue likely does not affect the extension's functionality.");
        return;
    }

    if (!target) return;

    if (hoverTimer !== null) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
    }

    hoverTimer = window.setTimeout(() => {

        hoverTimer = null;

        const token = ++currentHoverToken;

        const href = target.getAttribute("href");

        if (!href) return;
        if (!target.matches(":hover")) return;
        if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;

        const url = new URL(href, window.location.href);
        const pathSegments = url.pathname.split("/").filter(Boolean);

        const isRepo =
            pathSegments.length === 2 &&
            !(CONFIG.routes.reserved as readonly string[]).includes(pathSegments[0] ?? "");

        if (isRepo && (searchRegex.test(url.href) || (url.hostname === "github.com" && onsiteRegex.test(url.pathname)))) {
            const res: Promise<GithubRepoResponse | null> = new Promise((resolve) => {
                if (dataCache.has(pathSegments.join("/"))) {
                    resolve(dataCache.get(pathSegments.join("/")) ?? null);
                    return;
                }
                const request = new GithubRepoRequest(pathSegments[0] ?? "", pathSegments[1] ?? "");
                request.fetch().then((data) => {
                    if (data.size < 1024) {
                        data.formatted_size = `~${data.size} KB`;
                    } else if (data.size < 1024 * 1024) {
                        data.formatted_size = `~${(data.size / 1024).toFixed(2)} MB`;
                    } else {
                        data.formatted_size = `~${(data.size / (1024 * 1024)).toFixed(2)} GB`;
                    }

                    data.language_color = languages.get(data.language ?? "")?.color ?? null;

                    dataCache.set(pathSegments.join("/"), data as unknown as GithubRepoResponse);

                    resolve(data as unknown as GithubRepoResponse);
                }).catch(() => {
                    resolve(null);
                });
            });

            if (token !== currentHoverToken) return;

            if (popupDiv) {
                populatePopup(popupDiv, target, res);

                function mouseOutListener(_: MouseEvent) {
                    if (popupDiv) {
                        hidePopup();
                    }
                    target?.removeEventListener("mouseout", mouseOutListener);
                }

                target.addEventListener("mouseout", mouseOutListener);
            }
        };
    }, debounceTime);
}

export const searchModule: loaderData = {
    mounted: false,
    mount: (languagesGlobalIn: Map<string, { color: string }>) => {
        languages = languagesGlobalIn;


        if (searchModule.mounted) {
            LOG.warn("Search module is already mounted.");
            return;
        }

        // Observe mutations to identify navigation events (cuz GitHub is SPA)

        const observer = new MutationObserver(() => {
            hidePopup();
            currentHoverToken++;
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Register popup div to populate later

        if (!document.body) {
            document.addEventListener("DOMContentLoaded", () => {
                LOG.log("DOMContenLoaded fired, registering popupDiv");
                popupDiv = registerPopupDiv();
            }, { once: true });
        } else {
            popupDiv = registerPopupDiv();
        }


        // Event listener for pointerenter to trigger hover

        document.addEventListener("pointerenter", handleHover, true);

        searchModule.mounted = true;
    },
    unmount: () => {

        if (!searchModule.mounted) {
            LOG.warn("Search module is not mounted.");
            return;
        }

        // prepare for unmounting
        document.removeEventListener("pointerenter", handleHover, true);

        if (popupDiv) {
            popupDiv.element.remove();
            popupDiv = null;
        }
        searchModule.mounted = false;
    },
};



/*                                   _                _
                                      '-.          ,-'
                                         '.      ,'
                                           \    /
                                           _|__|_
                                          (,\--/,)
                                          /\Y  Y/
                                        ."  `><'
                                      ."    /|
                                     /  /  // .-"'y".
                                  _."  /  // / -//-//
                               _."l   /| || / ,// //
                            _."  / ',/ | |," ,// //
                .-.      _."   ."  ."  | `  ,//-//
               //'.'. _."   _."/ |/    "._."// //
              //  _\ \  _,-" _|  Y          ^  ^
             //_."  \'\" /  / \  \._
            //"    _.\ \|  /   "----|====-.
         _.//   _." \_\___/        ||     \\
      .-" //_.-" \_."              ||      \\
   _."   //" \__,"                 ||       \\
 ."   __//>.-"                     ||        "----
"---"" //                           \           */