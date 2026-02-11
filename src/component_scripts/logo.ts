import { LOG } from "../config";
import type { loaderData } from "../types/general";

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

    if (logo.parentElement) {
        logo.parentElement.style.width = "auto";
        logo.parentElement.style.borderRadius = "30px";
    }

    const GitIndexLogo = document.createElement("div");
    fetchGitIndexLogoSVG().then(svgText => {
        if (svgText) {
            GitIndexLogo.innerHTML = svgText;
        }
        GitIndexLogo.className = "gitindex-logo";
        logo.after(GitIndexLogo);
    });

}

export const logoModule: loaderData = {
    mounted: false,
    mount: () => {
        if (logoModule.mounted) {
            LOG.warn("Logo module is already mounted.");
            return;
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

        logoModule.mounted = false;
    }
};