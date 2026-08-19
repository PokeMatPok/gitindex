import { LOG } from "../../config";
import { type loaderData } from "../../types/general";
import { DOMWatcher } from "../utils";
import { getFolderIcon, getIcon } from "./icons/icons";
import map from "./icons/icon-map.json";

const REMOTE_BASE = "https://pokematpok.github.io/gitindex-icons";

// Icons available in the local bundle
const localIcons = new Set(map.local);

function getIconUrl(filename: string, folder: boolean): string {
  if (folder) {
    const icon = getFolderIcon(filename);
    const file = `${icon}.svg`;
    return localIcons.has(icon)
      ? chrome.runtime.getURL(`assets/icons/vscode/${file}`)
      : `${REMOTE_BASE}/${file}`;
  }

  const icon = getIcon(filename);
  const file = `file_type_${icon}.svg`;
  return localIcons.has(icon)
    ? chrome.runtime.getURL(`assets/icons/vscode/${file}`)
    : `${REMOTE_BASE}/${file}`;
}

function getFilename(fileRow: HTMLElement): string {
  return fileRow.querySelector("a.Link--primary")?.textContent?.trim() ?? "";
}

function injectIcon(fileRow: HTMLElement) {
  const folder = isFolder(fileRow);
  const filename = getFilename(fileRow);
  if (!filename) return;

  const iconUrl = getIconUrl(filename, folder);

  // Target both narrow and wide screen icon elements — same structure quickActions uses
  const selectors = [
    ".react-directory-filename-column svg",
    ".react-directory-row-name-cell-large-screen svg",
  ];

  selectors.forEach((selector) => {
    const svg = fileRow.querySelector(selector);
    if (!svg) return;

    // Don't re-inject if already done
    if (svg.previousElementSibling?.classList.contains("gitindex-file-icon")) return;

    const img = document.createElement("img");
    img.className = "gitindex-file-icon";
    img.src = iconUrl;
    img.width = 16;
    img.height = 16;
    img.style.flexShrink = "0";

    DOMWatcher.runSilent(() => {
      svg.replaceWith(img);
    });
  });
}

function injectIcons() {
  const fileRows = document.querySelectorAll(".react-directory-row");
  if (fileRows.length === 0) return LOG.log("[icons] No file rows found");

  LOG.log(`[icons] Injecting icons into ${fileRows.length} rows`);
  fileRows.forEach((row) => injectIcon(row as HTMLElement));
}

function isFolder(fileRow: HTMLElement): boolean {
  const href = fileRow.querySelector("a.Link--primary")?.getAttribute("href") ?? "";
  return !href.includes("/blob/");
}

export const fileIconsModule: loaderData = {
  mounted: false,
  mount: () => {
    if (fileIconsModule.mounted) {
      LOG.warn("[icons] Module already mounted.");
      return;
    }

    console.log("public: " + getFolderIcon("public")); // what icon name?
    console.log("public local: " + localIcons.has(getFolderIcon("public")));

    DOMWatcher.appendCallback("fileIconsWatcher", (mutations) => {
      const relevant = mutations.some((m) =>
        [...m.addedNodes].some((n) => {
          const el = n as HTMLElement;
          return (
            el.classList?.contains("react-directory-row") ||
            el.querySelector?.(".react-directory-row")
          );
        }),
      );
      if (!relevant) return;

      setTimeout(() => {
        DOMWatcher.runSilent(() => injectIcons());
      }, 100);
    });

    injectIcons();
    fileIconsModule.mounted = true;
  },

  unmount: () => {
    if (!fileIconsModule.mounted) {
      LOG.warn("[icons] Module not mounted.");
      return;
    }

    DOMWatcher.runSilent(() => {
      document.querySelectorAll(".gitindex-file-icon").forEach((el) => el.remove());
    });

    DOMWatcher.removeCallback("fileIconsWatcher");
    fileIconsModule.mounted = false;
  },
};
