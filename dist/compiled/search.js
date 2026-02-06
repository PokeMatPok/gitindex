"use strict";
(() => {
  // src/api.ts
  var GithubRepoRequest = class {
    url;
    constructor(user, repo) {
      this.url = `https://api.github.com/repos/${user}/${repo}`;
    }
    async fetch() {
      const res = await fetch(this.url, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      });
      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }
      return res.json();
    }
  };

  // src/popup.ts
  function createPopup() {
    const popup = document.createElement("div");
    popup.className = "gitindex-main-popup-view";
    popup.innerHTML = `
        <div class="gitindex-popup-header">
            <img id="gitindex-repo-owner-avatar" src="#" class="gitindex-avatar" alt="Owner Avatar">
            <div class="gitindex-header-text">
                <h3 id="gitindex-repo-name"></h3>
                <p class="gitindex-description" id="gitindex-repo-description"></p>
                <span class="gitindex-user-tag" id="gitindex-repo-owner"></span>
            </div>
        </div>
        <div class="gitindex-popup-body">
            ${createStatsRow()}
            <hr>
            ${createInfoGrid()}
        </div>
    `;
    return popup;
  }
  function createStatsRow() {
    return `
        <div class="gitindex-stats-row">
            ${createStatItem(chrome.runtime.getURL("assets/star.svg"), "Stars", "gitindex-stat-stars")}
            ${createStatItem(chrome.runtime.getURL("assets/git-fork.svg"), "Forks", "gitindex-stat-forks")}
            ${createStatItem(chrome.runtime.getURL("assets/circle-alert.svg"), "Open Issues", "gitindex-stat-issues")}
        </div>
    `;
  }
  function createStatItem(icon, label, id) {
    return `
        <div class="gitindex-stat-item" id="${id}">
            <img src="${icon}" alt="${label}">
            <span class="gitindex-stat-label">${label}</span>
            <span class="gitindex-stat-value"></span>
        </div>
    `;
  }
  function createInfoGrid() {
    return `
        <div class="gitindex-info-grid">
            ${createInfoItem(chrome.runtime.getURL("assets/calendar.svg"), "Created", "gitindex-item-created")}
            ${createInfoItem(chrome.runtime.getURL("assets/calendar-sync.svg"), "Updated", "gitindex-item-updated")}
            ${createInfoItem(chrome.runtime.getURL("assets/eye.svg"), "Watchers", "gitindex-item-watchers")}
            ${createInfoItem(chrome.runtime.getURL("assets/file.svg"), "Size", "gitindex-item-size")}
            ${createInfoItem(chrome.runtime.getURL("assets/scale.svg"), "License", "gitindex-item-license")}
            ${createLanguageItem("Unknown", "gitindex-language-dot", "gitindex-item-language")}
        </div>
    `;
  }
  function createInfoItem(icon, label, id) {
    return `
        <div class="gitindex-info-item" id="${id}">
            <img src="${icon}" alt="">
            <div>
                <span class="gitindex-info-label">${label}</span>
                <span class="gitindex-info-value"></span>
            </div>
        </div>
    `;
  }
  function createLanguageItem(language, color_id, id) {
    return `
        <div class="gitindex-info-item" id="${id}">
            <span class="gitindex-language-dot" id="${color_id}"></span>
            <div>
                <span class="gitindex-info-label">Language</span>
                <span class="gitindex-info-value">${language}</span>
            </div>
        </div>
    `;
  }
  function registerPopupDiv() {
    const popup = createPopup();
    document.body.appendChild(popup);
    popup.style.display = "none";
    return {
      element: popup,
      fields: {
        repoOwnerAvatar: popup.querySelector("#gitindex-repo-owner-avatar"),
        repoName: popup.querySelector("#gitindex-repo-name"),
        repoDescription: popup.querySelector("#gitindex-repo-description"),
        repoOwner: popup.querySelector("#gitindex-repo-owner"),
        statStars: popup.querySelector("#gitindex-stat-stars .gitindex-stat-value"),
        statForks: popup.querySelector("#gitindex-stat-forks .gitindex-stat-value"),
        statIssues: popup.querySelector("#gitindex-stat-issues .gitindex-stat-value"),
        itemCreated: popup.querySelector("#gitindex-item-created .gitindex-info-value"),
        itemUpdated: popup.querySelector("#gitindex-item-updated .gitindex-info-value"),
        itemWatchers: popup.querySelector("#gitindex-item-watchers .gitindex-info-value"),
        itemSize: popup.querySelector("#gitindex-item-size .gitindex-info-value"),
        itemLicense: popup.querySelector("#gitindex-item-license .gitindex-info-value"),
        itemLanguage: popup.querySelector("#gitindex-item-language .gitindex-info-value"),
        itemLanguageColor: popup.querySelector("#gitindex-language-dot")
      }
    };
  }
  function populatePopup(popup, link, data) {
    data.then((repoData) => {
      if (!repoData) {
        return;
      }
      if (!repoData) return;
      popup.fields.repoOwnerAvatar.src = repoData.owner.avatar_url;
      popup.fields.repoName.textContent = repoData.full_name;
      popup.fields.repoDescription.textContent = repoData.description || "No description";
      popup.fields.repoOwner.textContent = repoData.owner.login;
      popup.fields.statStars.textContent = repoData.stargazers_count.toString();
      popup.fields.statForks.textContent = repoData.forks_count.toString();
      popup.fields.statIssues.textContent = repoData.open_issues_count.toString();
      popup.fields.itemCreated.textContent = new Date(repoData.created_at).toLocaleDateString();
      popup.fields.itemUpdated.textContent = new Date(repoData.updated_at).toLocaleDateString();
      popup.fields.itemWatchers.textContent = (repoData.subscribers_count ?? 0).toString();
      popup.fields.itemSize.textContent = repoData.formatted_size || "Unknown";
      popup.fields.itemLicense.textContent = repoData.license ? repoData.license.name : "No license";
      popup.fields.itemLanguage.textContent = repoData.language || "Unknown";
      popup.fields.itemLanguageColor.style.backgroundColor = repoData.language_color || "transparent";
      const rect = link.getBoundingClientRect();
      popup.element.style.top = `${rect.bottom + window.scrollY + 8}px`;
      popup.element.style.left = `${rect.left + window.scrollX}px`;
      popup.element.style.display = "block";
    });
  }
  function hidePopup() {
    const popup = document.querySelector(".gitindex-main-popup-view");
    if (popup) {
      popup.style.display = "none";
    }
  }

  // src/search.ts
  var searchRegex = /^https?:\/\/(.*\.)?github\.com\/.+\/.+/;
  var onsiteRegex = /^\/.+\/.+/;
  var debounceTime = 200;
  var hoverTimer = null;
  var currentHoverToken = 0;
  var dataCache = /* @__PURE__ */ new Map();
  var languages = /* @__PURE__ */ new Map();
  fetch(chrome.runtime.getURL("assets/languages.json")).then((response) => response.json()).then((data) => {
    for (const [key, value] of Object.entries(data)) {
      languages.set(key, { color: value.color });
    }
  });
  var popupDiv = registerPopupDiv();
  document.addEventListener("pointerenter", handleHover, true);
  function handleHover(event) {
    let target;
    try {
      target = event.target?.closest("a");
    } catch (e) {
      console.log("%cGitIndex: %c %s %c\nNote: This Issue does not affect the extension's functionality.", "color: #F2C94C; font-weight: bold;", "color: red;", e, "color: white;");
      return;
    }
    if (!target) return;
    if (hoverTimer !== null) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    hoverTimer = window.setTimeout(() => {
      hoverTimer = null;
      const token = ++currentHoverToken;
      const href = target.getAttribute("href");
      if (!href) return;
      if (!target.matches(":hover")) return;
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return;
      const url = new URL(href, window.location.href);
      const pathSegments = url.pathname.split("/").filter(Boolean);
      const isRepo = pathSegments.length === 2 && !["topics", "sponsors", "settings"].includes(pathSegments[0] ?? "");
      if (isRepo && (searchRegex.test(url.href) || url.hostname === "github.com" && onsiteRegex.test(url.pathname))) {
        const res = new Promise((resolve) => {
          if (dataCache.has(pathSegments.join("/"))) {
            resolve(dataCache.get(pathSegments.join("/")) ?? null);
            return;
          }
          const request = new GithubRepoRequest(pathSegments[0] ?? "", pathSegments[1] ?? "");
          request.fetch().then((data) => {
            if (data.size < 1024) {
              data.formatted_size = `~${data.size} KB`;
            } else if (data.size < 1024 * 1024) {
              data.formatted_size = `~${(data.size / 1024).toFixed(2)} MB`;
            } else {
              data.formatted_size = `~${(data.size / (1024 * 1024)).toFixed(2)} GB`;
            }
            data.language_color = languages.get(data.language ?? "")?.color ?? null;
            dataCache.set(pathSegments.join("/"), data);
            resolve(data);
          }).catch(() => {
            resolve(null);
          });
        });
        if (token !== currentHoverToken) return;
        if (popupDiv) {
          let mouseOutListener2 = function(_) {
            if (popupDiv) {
              hidePopup();
            }
            target?.removeEventListener("mouseout", mouseOutListener2);
          };
          var mouseOutListener = mouseOutListener2;
          populatePopup(popupDiv, target, res);
          target.addEventListener("mouseout", mouseOutListener2);
        }
      }
      ;
    }, debounceTime);
  }
  var observer = new MutationObserver(() => {
    hidePopup();
    currentHoverToken++;
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
