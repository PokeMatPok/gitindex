import { LOG } from "../../config";
import type { loaderData } from "../../types/general";
import { Modal } from "../modal";
import { DOMWatcher } from "../utils";

let ModalInitialized = false;
let observing: boolean = false;

function findInjectPoint(): HTMLElement[] | null {
    const spans = document.querySelectorAll("span");
    const filteredSpans = Array.from(spans).filter(span => span.textContent.trim() === "Go to file");

    if (filteredSpans.length === 0) {
        LOG.warn("Could not find 'Go to file' span for edit button injection.");
        return null;
    }

    const injectionPoints = filteredSpans.map(span => {
        const injectionPoint = span?.closest('[class*="OverviewContent-module__Box"]');
        if (!injectionPoint) {
            return null;
        }
        return injectionPoint;
    });

    return injectionPoints.filter(Boolean).length > 0 ? injectionPoints.filter(Boolean) as HTMLElement[] : null;
}

function createModalContent(): HTMLElement {
    const content = document.createElement("div");
    content.className = "gitindex-edit-modal-content";

    interface EditOption {
        name: string;
        displayName: string;
        icon: string;
        action: () => void;
    }

    const optionsData: EditOption[] = [{
        name: "githubdev",
        displayName: "GitHub.dev",
        icon: "githubdev.svg",
        action: () => {
            LOG.log("GitHub.dev option clicked. Redirecting...");

            window.open(window.location.href.replace('github.com', 'github.dev'));

            Modal.hide();
        }
    }, {
        name: "vscode",
        displayName: "VS Code",
        icon: "vscode.svg",
        action: () => {
            LOG.log("VS Code option clicked. Redirecting...");

            window.open(`vscode://vscode.git/clone?url=${window.location.href}.git`);

            Modal.hide();
        }
    }, {
        name: "gitpod",
        displayName: "GitPod",
        icon: "gitpod.svg",
        action: () => {
            LOG.log("GitPod option clicked. Redirecting...");

            window.open(`https://gitpod.io/#${window.location.href}`);

            Modal.hide();
        }
    }];

    const options: HTMLElement[] = optionsData.map((optionData): HTMLElement => {
        const option = document.createElement("div");
        option.className = "gitindex-edit-option";

        const icon = document.createElement("img");
        icon.src = chrome.runtime.getURL(`assets/logos/${optionData.icon}`);
        icon.alt = optionData.displayName;

        icon.className = "gitindex-edit-option-icon";

        const label = document.createElement("h3");
        label.textContent = optionData.displayName;
        label.className = "gitindex-edit-option-label";

        option.appendChild(icon);
        option.appendChild(label);

        option.onclick = () => {
            LOG.log(`${optionData.displayName} option clicked. Redirecting...`);

            optionData.action();
        };
        return option;
    });

    options.forEach(opt => content.appendChild(opt));

    return content;
}

function injectRepoButton() {
    const injectionPoints = findInjectPoint();
    if (!injectionPoints) {
        LOG.warn("Edit button injection failed due to missing injection point.");
        return;
    }

    if (document.querySelector(".gitindex-edit-button")) {
        return;
    }


    const editButton = document.createElement("button");
    editButton.className = "gitindex-edit-button";
    editButton.onclick = (e: MouseEvent) => handleEditClick(e);

    const ButtonText = document.createElement("span");
    ButtonText.textContent = "Edit with IDE";
    editButton.appendChild(ButtonText);

    DOMWatcher.runSilent(() => {
        injectionPoints[0]?.after(editButton);
    });
}

const handleEditClick = (e: MouseEvent) => {
    LOG.log("Edit button clicked. Showing modal...");

    if (!ModalInitialized) {
        Modal.createModal();

        Modal.setModalOptions({
            title: "Edit with...",
            content: createModalContent(),
            onClose: () => {
                LOG.log("Modal closed.");
            }
        });

        ModalInitialized = true;
    }

    Modal.show();
};


export const editButtonModule: loaderData = {
    mounted: false,
    mount: (languagesGlobalIn: Map<string, { color: string }>) => {
        if (editButtonModule.mounted) {
            LOG.warn("Edit button module is already mounted.");
            return;
        }

        if (!observing) {
            DOMWatcher.appendCallback("editButtonWatcher", (mutations) => {
                const buttonExists = document.querySelector(".gitindex-edit-button");
                const injectionPointExists = findInjectPoint();

                if (!buttonExists && injectionPointExists) {
                    LOG.log("Edit button removed by GitHub, reinjecting...");
                    setTimeout(() => {
                        injectRepoButton();
                    }, 100);
                }
            });

            observing = true;
        }

        injectRepoButton();

        editButtonModule.mounted = true;
    },
    unmount: () => {
        if (!editButtonModule.mounted) {
            LOG.warn("Edit button module is not mounted.");
            return;
        }

        DOMWatcher.removeCallback("editButtonWatcher");

        DOMWatcher.runSilent(() => {
            const button = document.querySelector(".gitindex-edit-button");
            button?.remove();
        });

        DOMWatcher.removeCallback("editButtonWatcher");
        observing = false;

        Modal.destroy();
        ModalInitialized = false;

        editButtonModule.mounted = false;
    }
}