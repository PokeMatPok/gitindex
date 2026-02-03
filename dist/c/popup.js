"use strict";
(() => {
  // src/popup.ts
  function registerDiv() {
    console.log("created div");
    const popup = document.createElement("div");
    popup.style.position = "absolute";
    popup.style.zIndex = "999999";
    popup.style.padding = "6px 10px";
    popup.style.background = "#24292f";
    popup.style.color = "#fff";
    popup.style.borderRadius = "6px";
    popup.style.fontSize = "12px";
    popup.style.pointerEvents = "none";
    popup.style.whiteSpace = "nowrap";
    popup.style.display = "none";
    popup.style.transition = "opacity 0.15s ease";
    popup.textContent = "Hello World!";
    document.body.appendChild(popup);
    return popup;
  }
  function showDiv(popup, link) {
    console.log("hover");
    link.style.color = "red";
    popup.style.display = "block";
    const rect = link.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    let left = rect.left + window.scrollX;
    if (left + popup.offsetWidth > window.innerWidth) {
      left = window.innerWidth - popup.offsetWidth - 6;
    }
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
  }

  // src/index.ts
  var searchRegex = /^https?:\/\/(.*\.)?github\.com\/.+\/.+/;
  var onsiteRegex = /^\/.+\/.+/;
  var div = null;
  console.log("init");
  div = registerDiv();
  var links = document.querySelectorAll("a");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
    const url = new URL(href, window.location.href);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const isRepo = pathSegments.length === 2 && !["topics", "sponsors", "settings"].includes(pathSegments[0] ?? "");
    if (isRepo && (searchRegex.test(url.href) || url.hostname === "github.com" && onsiteRegex.test(url.pathname))) {
      link.addEventListener("mouseenter", () => {
        if (div) showDiv(div, link);
      });
      link.addEventListener("mouseleave", () => {
        if (div) div.style.display = "none";
      });
    }
  });
})();
