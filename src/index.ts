import { registerDiv, showDiv } from "./popup.js";

const searchRegex = /^https?:\/\/(.*\.)?github\.com\/.+\/.+/;
const onsiteRegex = /^\/.+\/.+/;

let div: HTMLDivElement | null = null;


console.log("init")
div = registerDiv();
const links = document.querySelectorAll("a");

links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;

    const url = new URL(href, window.location.href);
    const pathSegments = url.pathname.split("/").filter(Boolean);

    const isRepo =
        pathSegments.length === 2 &&
        !["topics", "sponsors", "settings"].includes(pathSegments[0] ?? "");

    if (isRepo && (searchRegex.test(url.href) || (url.hostname === "github.com" && onsiteRegex.test(url.pathname)))) {
        link.addEventListener("mouseenter", () => {
            if (div) showDiv(div, link);
        });

        link.addEventListener("mouseleave", () => {
            if (div) div.style.display = "none";
        });
    }
});
