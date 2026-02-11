import { LOG } from "../config";

let modalElement: HTMLElement | null = null;
let onCloseCallback: (() => void) | null = null;

function createModal(): HTMLElement {

    LOG.log("creating Modal element");

    if (modalElement) return modalElement;

    // outer
    const modalOuterElement = document.createElement("div");
    modalOuterElement.className = "gitindex-modal-backdrop gitindex-modal-hidden";

    //inner
    const modalInnerElement = document.createElement("div");
    modalInnerElement.className = "gitindex-modal";

    //header
    const modalHeader = document.createElement("div");
    modalHeader.className = "gitindex-modal-header";

    const modalTitle = document.createElement("h2");
    modalTitle.className = "gitindex-modal-title";
    modalTitle.textContent = "";

    const closeButton = document.createElement("button");
    closeButton.className = "gitindex-modal-close-button";
    closeButton.textContent = "×";
    closeButton.onclick = () => Modal.hide();

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    // content
    const modalContent = document.createElement("div");
    modalContent.className = "gitindex-modal-content";
    modalContent.textContent = "";

    modalInnerElement.appendChild(modalHeader);
    modalInnerElement.appendChild(modalContent);

    modalOuterElement.appendChild(modalInnerElement);

    modalElement = modalOuterElement;

    document.body.appendChild(modalElement);

    return modalElement;
}

interface ModalOptions {
    title: string;
    content: string | HTMLElement;
    onClose?: () => void;
}
interface Modal {
    createModal: () => HTMLElement;
    show: () => void;
    hide: () => void;
    setContent: (content: string | HTMLElement) => void;
    setTitle: (title: string) => void;
    setModalOptions: (options: ModalOptions) => void;
    destroy: () => void;
}

export const Modal: Modal = {
    createModal,
    show() {
        if (modalElement) {
            modalElement.classList.remove("gitindex-modal-hidden");
        }
    },
    hide() {
        if (modalElement) {
            onCloseCallback?.();
            modalElement.classList.add("gitindex-modal-hidden");
        }
    },
    setContent(content: string | HTMLElement) {
        if (!modalElement) return;

        const contentContainer = modalElement.querySelector(".gitindex-modal-content");
        if (!contentContainer) return;

        if (typeof content === "string") {
            contentContainer.textContent = content;
        } else {
            contentContainer.innerHTML = "";
            contentContainer.appendChild(content);
        }
    },
    setTitle(title: string) {
        if (!modalElement) return;

        const titleElement = modalElement.querySelector(".gitindex-modal-title");
        if (!titleElement) return;

        titleElement.textContent = title;
    },
    setModalOptions(options: ModalOptions) {
        if (options.title) {
            this.setTitle(options.title);
        }
        if (options.content) {
            this.setContent(options.content);
        }
        if (options.onClose) {
            onCloseCallback = options.onClose;
        }
    },
    destroy() {
        if (modalElement) {
            modalElement.remove();
            modalElement = null;
            onCloseCallback = null;
        }
    }
}