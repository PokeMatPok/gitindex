import { LOG } from "../../config";
import type { loaderData } from "../../types/general";
import { DOMWatcher } from "../utils";

let globHeaderIntersectionObserver: IntersectionObserver | null = null;
let globHeaderResizeObserver: ResizeObserver | null = null;

function findHeader(): HTMLElement | null {
  const header = document.querySelector(
    "tr:has(> td > div.LatestCommit-module__Box__B25ZT)",
  );

  if (header) {
    return header as HTMLElement;
  }

  return null;
}

function prepareInjection() {
  LOG.log("mounting sticky header module");
  const header = findHeader();

  if (!header) {
    return LOG.warn("Header not found");
  }

  if (header.classList.contains("gitindex-ready-sticky-header")) {
    return LOG.log("already observed");
  }

  header.classList.add("gitindex-ready-sticky-header");

  globHeaderIntersectionObserver?.disconnect();

  globHeaderResizeObserver?.disconnect();

  const el = header.querySelector("td");

  if (!el) {
    return LOG.log("header sub element not found");
  }

  globHeaderIntersectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry!.isIntersecting) {
        el.classList.remove("gitindex-sticky-header");
      } else {
        el.classList.add("gitindex-sticky-header");
        el.style.width = `${header.getBoundingClientRect().width}px`;
      }
    },
    { threshold: 0 },
  );

  globHeaderIntersectionObserver.observe(header);

  globHeaderResizeObserver = new ResizeObserver(() => {
    if (el.classList.contains("gitindex-sticky-header")) {
      el.style.width = `${header.getBoundingClientRect().width}px`;
    }
  });

  globHeaderResizeObserver.observe(header);
}

export const stickyHeaderModule: loaderData = {
  mounted: false,
  mount: (languagesGlobalIn: Map<string, { color: string }>) => {
    if (stickyHeaderModule.mounted) {
      LOG.warn("Sticky Header module is already mounted.");
      return;
    }

    DOMWatcher.runSilent(() => prepareInjection());

    DOMWatcher.appendCallback("stickyHeaderWatcher", () => prepareInjection());

    stickyHeaderModule.mounted = true;
  },
  unmount: () => {
    if (!stickyHeaderModule.mounted) {
      LOG.warn("Sticky header module is not mounted.");
      return;
    }

    DOMWatcher.removeCallback("stickyHeaderWatcher");

    globHeaderIntersectionObserver?.disconnect();
    globHeaderResizeObserver?.disconnect();

    stickyHeaderModule.mounted = false;
  },
};
