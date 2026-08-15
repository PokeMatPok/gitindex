import { LOG } from "../../config";
import type { loaderData } from "../../types/general";
import { DOMWatcher } from "../utils";

export const quickActionsModule: loaderData = {
  mounted: false,
  mount: () => {
    if (quickActionsModule.mounted) {
      LOG.warn("Quick Actions module is already mounted.");
      return;
    }

    DOMWatcher.appendCallback("quickActionsWatcher", (mutations) => {
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
        DOMWatcher.runSilent(() => injectEventListeners()); // pause wraps the actual DOM work
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

    document.querySelectorAll(".react-directory-row").forEach((row) => {
      const handler = eventHandlers.get(row);
      if (handler) {
        row.removeEventListener("mouseenter", handler);
        row.removeEventListener(
          "mouseleave",
          removeHandlers.get(row) as EventListener,
        );
        eventHandlers.delete(row);
        removeHandlers.delete(row);
      }
    });

    DOMWatcher.runSilent(() => {
      document
        .querySelectorAll(".gitindex-quick-actions-container")
        .forEach((el) => el.remove());
    });

    DOMWatcher.removeCallback("quickActionsWatcher");

    quickActionsModule.mounted = false;
  },
};
