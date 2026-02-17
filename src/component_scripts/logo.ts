import { LOG } from "../config";
import type { loaderData } from "../types/general";
import { DOMWatcher } from "./utils";

let observing: boolean = false;

function findGitHubLogo(): HTMLElement | null {
    const GHlogo = document.getElementsByClassName("octicon-mark-github")[0];
    if (!GHlogo) {
        LOG.warn("GitHub logo element not found.");
        return null;
    }

    return GHlogo as HTMLElement;
}

function fetchGitIndexLogoSVG(): Promise<string | void> {
    return fetch(chrome.runtime.getURL("assets/mascot.svg"))
        .then(response => response.text())
        .catch(err => {
            LOG.error("Failed to fetch GitIndex logo SVG:", err);
            return "";
        });
}

function injectLogo() {
    const logo = findGitHubLogo();
    if (!logo) {
        LOG.warn("Logo injection failed due to missing GitHub logo element.");
        return;
    }

    if (document.querySelector(".gitindex-logo")) {
        return;
    }

    const GitIndexLogo = document.createElement("div");
    GitIndexLogo.className = "gitindex-logo";

    DOMWatcher.runSilent(() => {
        if (logo.parentElement) {
            logo.parentElement.style.width = "auto";
            logo.parentElement.style.borderRadius = "30px";
        }
        logo.after(GitIndexLogo);
    });

    fetchGitIndexLogoSVG().then(svgText => {
        if (svgText) {
            DOMWatcher.runSilent(() => {
                GitIndexLogo.innerHTML = svgText;
            });
        }
    });

}

export const logoModule: loaderData = {
    mounted: false,
    mount: () => {
        if (logoModule.mounted) {
            LOG.warn("Logo module is already mounted.");
            return;
        }

        if (!observing) {
            DOMWatcher.appendCallback("logoWatcher", () => {
                if (!document.querySelector(".gitindex-logo")) {
                    injectLogo();
                }
            });
            observing = true;
        }

        injectLogo();

        logoModule.mounted = true;
    },
    unmount: () => {
        if (!logoModule.mounted) {
            LOG.warn("Logo module is not mounted.");
            return;
        }

        document.querySelectorAll(".gitindex-logo").forEach(el => el.remove());

        DOMWatcher.removeCallback("logoWatcher");
        observing = false;

        logoModule.mounted = false;
    }
};