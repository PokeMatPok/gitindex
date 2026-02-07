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
  var GithubLanguagesRequest = class {
    url;
    constructor(user, repo) {
      this.url = `https://api.github.com/repos/${user}/${repo}/languages`;
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

  // src/repo.ts
  var BG_COLOR = "#0d1117";
  var DEFAULT_LANG_COLOR = "#ededed";
  var CANVAS_SIZE = 1e3;
  var CENTER = CANVAS_SIZE / 2;
  var displayedLangs = [];
  var animationProgress = 0;
  var animationFinished = false;
  function injectCSS() {
    if (document.getElementById("gitindex-style")) return;
    document.head.insertAdjacentHTML("beforeend", `
        <style id="gitindex-style">
            .gitindex-hidden {
                display: none !important;
            }

            .gitindex-lang-hover:hover > * {
                color: #4493f8 !important;
            }
        </style>
    `);
  }
  var degreeToRadiant = (deg) => deg * Math.PI / 180;
  var getRepoPath = () => new URL(window.location.href).pathname.split("/").filter(Boolean);
  function findLanguagesSection() {
    const headers = document.querySelectorAll(
      "#repo-content-pjax-container h2"
    );
    for (const h of headers) {
      if (h.textContent?.trim() === "Languages") {
        return h.parentElement;
      }
    }
    return null;
  }
  function toggleLangView() {
    const langDiv = document.getElementById("gitindex-lang-div");
    const icon = document.getElementById("gitindex-lang-icon");
    const section = findLanguagesSection();
    if (!langDiv || !icon || !section) return;
    const barGraphic = section.querySelector("div.mb-2");
    const barList = section.querySelector("ul.list-style-none");
    if (!barGraphic || !barList) return;
    const pieHidden = langDiv.classList.contains("gitindex-hidden");
    langDiv.classList.toggle("gitindex-hidden", !pieHidden);
    barGraphic.classList.toggle("gitindex-hidden", pieHidden);
    barList.classList.toggle("gitindex-hidden", pieHidden);
    icon.src = chrome.runtime.getURL(
      pieHidden ? "assets/chart-bar.svg" : "assets/chart-pie.svg"
    );
  }
  function renderUI(owner, repo) {
    const section = findLanguagesSection();
    if (!section) return;
    section.querySelector("#gitindex-lang-div")?.remove();
    section.querySelector("#gitindex-lang-button")?.remove();
    const header = section.querySelector("h2");
    if (!header) return;
    const button = document.createElement("button");
    button.id = "gitindex-lang-button";
    button.style.background = "none";
    button.style.border = "none";
    button.style.cursor = "pointer";
    button.onclick = toggleLangView;
    const icon = document.createElement("img");
    icon.id = "gitindex-lang-icon";
    icon.src = chrome.runtime.getURL("assets/chart-pie.svg");
    icon.style.width = "24px";
    icon.style.height = "24px";
    icon.style.marginLeft = "8px";
    button.appendChild(icon);
    header.appendChild(button);
    const langDiv = document.createElement("div");
    langDiv.id = "gitindex-lang-div";
    langDiv.className = "d-flex flex-items-center gitindex-hidden";
    langDiv.style.marginTop = "8px";
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    canvas.style.width = "100px";
    canvas.style.height = "100px";
    const list = document.createElement("ul");
    list.style.listStyle = "none";
    list.style.margin = "0 0 0 16px";
    list.style.padding = "0";
    for (const lang of displayedLangs) {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      const dot = document.createElement("span");
      Object.assign(dot.style, {
        width: "12px",
        height: "12px",
        backgroundColor: lang.color,
        borderRadius: "50%",
        marginRight: "8px"
      });
      const link = document.createElement("a");
      link.href = `https://github.com/${owner}/${repo}/search?l=${encodeURIComponent(lang.name)}`;
      link.className = "gitindex-lang-hover";
      link.style.textDecoration = "none";
      link.innerHTML = `
            <span style="color:#f0f6fc;font-size:.75rem;font-weight:600">
                ${lang.name}
            </span>
            <span style="color:#9198a1;font-size:.75rem;margin-left:6px">
                ${lang.percent.toFixed(1)}%
            </span>
        `;
      li.append(dot, link);
      list.appendChild(li);
    }
    langDiv.append(canvas, list);
    header.after(langDiv);
    renderCanvas(canvas);
  }
  function renderCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    animationProgress = 0;
    animationFinished = false;
    function frame() {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      let angle = 0;
      for (const lang of displayedLangs) {
        const slice = degreeToRadiant(lang.percent * 3.6);
        ctx.fillStyle = lang.color;
        ctx.beginPath();
        ctx.moveTo(CENTER, CENTER);
        ctx.arc(CENTER, CENTER, 480, angle, angle + slice);
        ctx.fill();
        angle += slice;
      }
      ctx.fillStyle = BG_COLOR;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 290, 0, Math.PI * 2);
      ctx.fill();
      if (animationProgress < 100) {
        animationProgress += 2;
        requestAnimationFrame(frame);
      }
    }
    frame();
  }
  async function init(languageColors) {
    injectCSS();
    displayedLangs = [];
    const [owner, repo] = getRepoPath();
    if (!owner || !repo) return;
    const [langColors, repoLangs] = await Promise.all([
      Promise.resolve(languageColors),
      new GithubLanguagesRequest(owner, repo).fetch()
    ]);
    if (!repoLangs) return;
    const entries = Object.entries(repoLangs);
    const total = entries.reduce((a, [, b]) => a + b, 0);
    let acc = 0;
    entries.forEach(([name, bytes], i) => {
      let percent = bytes / total * 100;
      percent = i === entries.length - 1 ? 100 - acc : Number(percent.toFixed(3));
      acc += percent;
      displayedLangs.push({
        name,
        percent,
        color: langColors.get(name)?.color ?? DEFAULT_LANG_COLOR
      });
    });
    renderUI(owner, repo);
  }
  var repoModule = {
    mounted: false,
    mount: (languagesGlobalIn) => {
      if (repoModule.mounted) {
        console.warn("GitIndex: Repo module is already mounted.");
        return;
      }
      init(languagesGlobalIn);
      repoModule.mounted = true;
    },
    unmount: () => {
      if (!repoModule.mounted) {
        console.warn("GitIndex: Repo module is not mounted.");
        return;
      }
      displayedLangs = [];
      animationProgress = 0;
      animationFinished = false;
      document.querySelector("#gitindex-lang-div")?.remove();
      document.querySelector("#gitindex-lang-button")?.remove();
      repoModule.mounted = false;
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
  var popupDiv = null;
  var debounceTime = 200;
  var hoverTimer = null;
  var currentHoverToken = 0;
  var dataCache = /* @__PURE__ */ new Map();
  var languages = /* @__PURE__ */ new Map();
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
  var searchModule = {
    mounted: false,
    mount: (languagesGlobalIn) => {
      languages = languagesGlobalIn;
      if (searchModule.mounted) {
        console.warn("GitIndex: Search module is already mounted.");
        return;
      }
      const observer = new MutationObserver(() => {
        hidePopup();
        currentHoverToken++;
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      if (!document.body) {
        document.addEventListener("DOMContentLoaded", () => {
          console.debug("GitIndex: DOMContentLoaded fired, registering popupDiv");
          popupDiv = registerPopupDiv();
        }, { once: true });
      } else {
        popupDiv = registerPopupDiv();
      }
      document.addEventListener("pointerenter", handleHover, true);
      searchModule.mounted = true;
    },
    unmount: () => {
      if (!searchModule.mounted) {
        console.warn("GitIndex: Search module is not mounted.");
        return;
      }
      document.removeEventListener("pointerenter", handleHover, true);
      if (popupDiv) {
        popupDiv.element.remove();
        popupDiv = null;
      }
      searchModule.mounted = false;
    }
  };

  // src/contentController.ts
  var currentRoute = "";
  var languagesGlobal = /* @__PURE__ */ new Map();
  var mountedModule = null;
  function loadLanguageColors() {
    if (languagesGlobal.size > 0) {
      return Promise.resolve(languagesGlobal);
    } else {
      return fetch(chrome.runtime.getURL("assets/languages.json")).then((r) => r.json()).then((data) => {
        const map = /* @__PURE__ */ new Map();
        for (const [lang, meta] of Object.entries(data)) {
          map.set(lang, { color: meta.color });
        }
        languagesGlobal = map;
        return map;
      });
    }
  }
  function checkForNavigationChange() {
    if (location.href !== currentRoute) {
      currentRoute = location.href;
      loadLanguageColors().then((languages2) => {
        const loader = matchURLLoader();
        if (loader) {
          if (mountedModule && mountedModule !== loader) {
            console.log("GitIndex: Mounting module for current route...");
            mountedModule.unmount();
            loader.mount(languages2);
            mountedModule = loader;
          }
        }
      });
    }
  }
  function matchURLLoader() {
    const pathSegments = new URL(window.location.href).pathname.split("/").filter(Boolean);
    if (pathSegments.length === 1 && pathSegments[0] === "search") {
      return searchModule;
    } else if (pathSegments.length === 2 && !["topics", "sponsors", "settings"].includes(pathSegments[0] ?? "")) {
      return repoModule;
    }
    return null;
  }
  function init2() {
    console.log("GitIndex: Initializing content script...");
    loadLanguageColors().then((languages2) => {
      const loader = matchURLLoader();
      currentRoute = location.href;
      if (loader) {
        if (mountedModule === null || mountedModule !== loader) {
          console.log("GitIndex: Mounting initial module for current route...");
          mountedModule?.unmount();
          loader.mount(languages2);
          mountedModule = loader;
        }
      }
      setInterval(checkForNavigationChange, 1e3);
    });
  }
  init2();
})();
