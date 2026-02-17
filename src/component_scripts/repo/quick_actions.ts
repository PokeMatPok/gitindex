import { LOG } from "../../config";
import { type loaderData } from "../../types/general"
import { DOMWatcher } from "../utils";

// unimplemented
//let favorites: string[] = [];

interface Action {
    id: string;
    name: string;
    description: string;
    icon: string;
    onClick: (filePath: string) => boolean | Promise<boolean> | void;
}

const fileActions: Action[] = [
    {
        "id": "copy_relative_path",
        "name": "Copy Relative Path",
        "description": "Copy the file's path relative to the repository root.",
        "icon": chrome.runtime.getURL("assets/icons/tree.svg"),
        "onClick": async (filePath: string) => {
            const relativePath = filePath.split(/blob\/.+?\//)[1] || filePath;

            const success = await copy(relativePath);
            return success;
        }
    },
    {
        "id": "copy_url",
        "name": "Copy URL",
        "description": "Copy the GitHub URL for this file.",
        "icon": chrome.runtime.getURL("assets/icons/link.svg"),
        "onClick": async (filePath: string) => {
            let fullUrl: string = filePath.startsWith("/") ? `https://github.com${filePath}` : filePath;

            const success = await copy(fullUrl);
            return success;
        }
    },
    {
        "id": "copy_raw_url",
        "name": "Copy Raw URL",
        "description": "Copy the URL to the raw file content.",
        "icon": chrome.runtime.getURL("assets/icons/link-raw.svg"),
        "onClick": async (filePath: string) => {
            const rawPath = filePath.replace("/blob/", "/");
            const rawUrl = `https://raw.githubusercontent.com${rawPath}`;
            const success = await copy(rawUrl);
            return success;
        }
    },
    {
        "id": "open_in_new_tab",
        "name": "Open in New Tab",
        "description": "Open the file in a new browser tab.",
        "icon": chrome.runtime.getURL("assets/icons/new-tab.svg"),
        "onClick": (filePath: string) => {
            const url = filePath.startsWith("/") ? `https://github.com${filePath}` : filePath;
            window.open(url, "_blank");

            return true;
        }
    },
    {
        "id": "view_history",
        "name": "View History",
        "description": "View the commit history for this file.",
        "icon": chrome.runtime.getURL("assets/icons/file-history.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "copy_content",
        "name": "Copy Content",
        "description": "Copy the content of the file to clipboard (only for small files).",
        "icon": chrome.runtime.getURL("assets/icons/content.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "download",
        "name": "Download",
        "description": "Download the file to your computer.",
        "icon": chrome.runtime.getURL("assets/icons/file-down.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "blame",
        "name": "Blame",
        "description": "View the blame information for this file.",
        "icon": chrome.runtime.getURL("assets/icons/blame.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "edit_in_github",
        "name": "Edit in GitHub",
        "description": "Open the file in GitHub's web editor (requires permissions).",
        "icon": chrome.runtime.getURL("assets/icons/github-iconlike.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "view_pr",
        "name": "View related PRs",
        "description": "View pull requests that have modified this file.",
        "icon": chrome.runtime.getURL("assets/icons/pull-request.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "view_issues",
        "name": "View related Issues",
        "description": "View issues that mention this file.",
        "icon": chrome.runtime.getURL("assets/circle-alert.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "configure_favorites",
        "name": "Configure Favorites",
        "description": "Mark certain actions as favorites for quicker access.",
        "icon": chrome.runtime.getURL("assets/icons/favorite-star.svg"),
        "onClick": (filePath: string) => { }
    }
]

const folderActions: Action[] = [
    {
        "id": "copy_relative_path",
        "name": "Copy Relative Path",
        "description": "Copy the folder's path relative to the repository root.",
        "icon": chrome.runtime.getURL("assets/icons/tree.svg"),
        "onClick": async (filePath: string) => {
            const relativePath = filePath.split(/tree\/.+?\//)[1] || filePath;

            const success = await copy(relativePath);
            return success;
        }
    },
    {
        "id": "copy_url",
        "name": "Copy URL",
        "description": "Copy the GitHub URL for this folder.",
        "icon": chrome.runtime.getURL("assets/icons/link.svg"),
        "onClick": async (filePath: string) => {
            const url = filePath.startsWith("/") ? `https://github.com${filePath}` : filePath;
            const success = await copy(url);
            return success;
        }
    },
    {
        "id": "open_in_new_tab",
        "name": "Open in New Tab",
        "description": "Open the folder in a new browser tab.",
        "icon": chrome.runtime.getURL("assets/icons/new-tab.svg"),
        "onClick": async (filePath: string) => {
            const url = filePath.startsWith("/") ? `https://github.com${filePath}` : filePath;
            window.open(url, "_blank");

            return true;
        }
    },
    {
        "id": "view_history",
        "name": "View History",
        "description": "View the commit history for this folder.",
        "icon": chrome.runtime.getURL("assets/icons/file-history.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "download",
        "name": "Download",
        "description": "Download the folder as a ZIP file.",
        "icon": chrome.runtime.getURL("assets/icons/folder-down.svg"),
        "onClick": (filePath: string) => { }
    },
    {
        "id": "configure_favorites",
        "name": "Configure Favorites",
        "description": "Mark certain actions as favorites for quicker access.",
        "icon": chrome.runtime.getURL("assets/icons/favorite-star.svg"),
        "onClick": (filePath: string) => { }
    }
]


// uninmplemented
/*chrome.storage.sync.get("quickActionsFavorites", (data: Record<string, any>) => {
    LOG.log("Loaded quick actions favorites:", data.quickActionsFavorites);
    favorites = data.quickActionsFavorites || [];
});*/

const eventHandlers = new WeakMap<Element, EventListener>();
const removeHandlers = new WeakMap<Element, EventListener>();

function isFolder(fileRow: HTMLElement): boolean {
    const href = fileRow.querySelector("a.Link--primary")?.getAttribute("href") ?? "";
    return !href.includes("/blob/");
}

function showSuccessFeedback(button: HTMLElement, icon: HTMLImageElement) {
    const originalSrc = icon.src;
    icon.src = chrome.runtime.getURL("assets/icons/success.svg");
    setTimeout(() => {
        icon.src = originalSrc;
    }, 1200);
}

function findInjectPoints(fileRow: HTMLElement): HTMLElement[] | null {
    const injectionPoint = fileRow.querySelector(".react-directory-filename-column")?.children[0];
    if (!injectionPoint) {
        return null;
    }

    const wideScreenInjectionPoint = fileRow.querySelector(".react-directory-row-name-cell-large-screen")?.children[0];
    if (!wideScreenInjectionPoint) {
        return null;
    }

    return [injectionPoint as HTMLElement, wideScreenInjectionPoint as HTMLElement];
}

async function copy(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        LOG.log("Successfully copied to clipboard:", text);
        return true;
    } catch (error) {
        LOG.error("Failed to copy text to clipboard:", error);
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            LOG.log("Successfully copied using fallback method");
            return true;
        } catch (fallbackError) {
            LOG.error("Fallback copy also failed:", fallbackError);
            return false;
        }
    }
}

function createQuickActionsContainer(fileRow: HTMLElement): HTMLElement {
    const container = document.createElement("div");
    container.className = "gitindex-quick-actions-container";

    /* TODO: Add logic to prioritize favorite actions and limit the number of visible buttons, with the rest accessible via the menu button. For now, we show just the first 3 actions to avoid UI clutter. */
    const MVP_FILE_ACTIONS = ["copy_relative_path", "copy_url", "copy_raw_url", "open_in_new_tab"];
    const MVP_FOLDER_ACTIONS = ["copy_relative_path", "copy_url", "open_in_new_tab"];

    const rowIsFolder = isFolder(fileRow);
    const MVP_ACTIONS = rowIsFolder ? folderActions.filter(a => MVP_FOLDER_ACTIONS.includes(a.id)) : fileActions.filter(a => MVP_FILE_ACTIONS.includes(a.id));

    for (const action of MVP_ACTIONS) {
        const button = document.createElement("button");
        button.className = "gitindex-quick-action-button";
        button.title = action.description;

        const icon = document.createElement("img");
        icon.src = action.icon;
        icon.className = "gitindex-quick-action-icon";

        button.appendChild(icon);
        container.appendChild(button);

        button.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const success = await action.onClick(fileRow.querySelector("a.Link--primary")?.getAttribute("href") || "");
            if (success) {
                showSuccessFeedback(button, icon);
            } else {
                LOG.warn(`Action "${action.name}" did not report success.`);
            }
        });
    }

    /* unimplemented: menu for additional actions beyond the MVP set
    const menuAction = document.createElement("button");
    menuAction.className = "gitindex-quick-action-button gitindex-quick-action-menu-button";
    menuAction.title = "More Actions";


    const menuIcon = document.createElement("img");
    menuIcon.src = chrome.runtime.getURL("assets/icons/ellipsis.svg");
    menuIcon.className = "gitindex-quick-action-icon";

    menuAction.appendChild(menuIcon);
    container.appendChild(menuAction);*/

    return container;
}

function removeExistingContainers(event: MouseEvent) {
    const row = event.currentTarget as HTMLElement;
    row.querySelectorAll(".gitindex-quick-actions-container").forEach(el => {
        (el as HTMLElement).style.opacity = "0";
    });
}

function handleRenderRequest(fileRow: Element, event: MouseEvent) {
    LOG.log("Mouse entered file row:", fileRow);
    const injectionPoints = findInjectPoints(fileRow as HTMLElement);
    if (!injectionPoints) {
        LOG.warn("No valid injection point found for quick actions.");
        return;
    }

    LOG.log("Injection point found:", injectionPoints);

    injectionPoints.forEach((point, index) => {
        if (!point.querySelector(".gitindex-quick-actions-container")) {
            LOG.log(`Injection point ${index} is clear for injection.`);
            const container = createQuickActionsContainer(fileRow as HTMLElement);

            DOMWatcher.runSilent(() => {
                point.appendChild(container);
            });

            requestAnimationFrame(() => {
                container.style.opacity = "1";
            });
        } else {
            LOG.log(`Injection point ${index} already has a container, skipping injection.`);

            const existingContainer = point.querySelector(".gitindex-quick-actions-container") as HTMLElement;
            existingContainer.style.opacity = "1"; // Ensure it's visible if it already exists
        }
    })
}

function injectEventListeners() {
    const fileRows = document.querySelectorAll(".react-directory-row");

    LOG.log("Found file rows:", fileRows.length);
    if (fileRows.length === 0) {
        return LOG.log("No file rows found");
    }

    fileRows.forEach(row => {
        if (eventHandlers.has(row)) {
            LOG.log("Row already has handler, skipping");
            return;
        }

        const handler: EventListener = (event) => handleRenderRequest(row, event as MouseEvent);
        const removeHandler: EventListener = (event) => removeExistingContainers(event as MouseEvent);
        eventHandlers.set(row, handler);
        removeHandlers.set(row, removeHandler);
        row.addEventListener("mouseenter", handler);
        row.addEventListener("mouseleave", removeHandler);
        LOG.log("Added listener to row:", row);
    });
}

export const quickActionsModule: loaderData = {
    mounted: false,
    mount: () => {
        if (quickActionsModule.mounted) {
            LOG.warn("Quick Actions module is already mounted.");
            return;
        }

        DOMWatcher.appendCallback("quickActionsWatcher", (mutations) => {
            const relevant = mutations.some(m =>
                [...m.addedNodes].some(n => {
                    const el = n as HTMLElement;
                    return el.classList?.contains("react-directory-row") || el.querySelector?.(".react-directory-row");
                })
            );
            if (!relevant) return;

            setTimeout(() => {
                DOMWatcher.runSilent(() => injectEventListeners());  // pause wraps the actual DOM work
            }, 100);
        });

        injectEventListeners();

        quickActionsModule.mounted = true;
    },
    unmount: () => {
        if (!quickActionsModule.mounted) {
            LOG.warn("Quick Actions module is not mounted.");
            return;
        }

        document.querySelectorAll(".react-directory-row").forEach(row => {
            const handler = eventHandlers.get(row);
            if (handler) {
                row.removeEventListener("mouseenter", handler);
                row.removeEventListener("mouseleave", removeHandlers.get(row) as EventListener);
                eventHandlers.delete(row);
                removeHandlers.delete(row);
            }
        });

        DOMWatcher.runSilent(() => {
            document.querySelectorAll(".gitindex-quick-actions-container").forEach(el => el.remove());
        });

        DOMWatcher.removeCallback("quickActionsWatcher");

        quickActionsModule.mounted = false;
    }
};