"use strict";(()=>{var u=class{url;constructor(t,i){this.url=`https://api.github.com/repos/${t}/${i}`}async fetch(){let t=await fetch(this.url,{headers:{Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}});if(!t.ok)throw new Error(`GitHub API error: ${t.status}`);return t.json()}};function R(){let e=document.createElement("div");return e.className="gitindex-main-popup-view",e.innerHTML=`
        <div class="gitindex-popup-header">
            <img id="gitindex-repo-owner-avatar" src="#" class="gitindex-avatar" alt="Owner Avatar">
            <div class="gitindex-header-text">
                <h3 id="gitindex-repo-name"></h3>
                <p class="gitindex-description" id="gitindex-repo-description"></p>
                <span class="gitindex-user-tag" id="gitindex-repo-owner"></span>
            </div>
        </div>
        <div class="gitindex-popup-body">
            ${E()}
            <hr>
            ${H()}
        </div>
    `,e}function E(){return`
        <div class="gitindex-stats-row">
            ${g(chrome.runtime.getURL("assets/star.svg"),"Stars","gitindex-stat-stars")}
            ${g(chrome.runtime.getURL("assets/git-fork.svg"),"Forks","gitindex-stat-forks")}
            ${g(chrome.runtime.getURL("assets/circle-alert.svg"),"Open Issues","gitindex-stat-issues")}
        </div>
    `}function g(e,t,i){return`
        <div class="gitindex-stat-item" id="${i}">
            <img src="${e}" alt="${t}">
            <span class="gitindex-stat-label">${t}</span>
            <span class="gitindex-stat-value"></span>
        </div>
    `}function H(){return`
        <div class="gitindex-info-grid">
            ${l(chrome.runtime.getURL("assets/calendar.svg"),"Created","gitindex-item-created")}
            ${l(chrome.runtime.getURL("assets/calendar-sync.svg"),"Updated","gitindex-item-updated")}
            ${l(chrome.runtime.getURL("assets/eye.svg"),"Watchers","gitindex-item-watchers")}
            ${l(chrome.runtime.getURL("assets/file.svg"),"Size","gitindex-item-size")}
            ${l(chrome.runtime.getURL("assets/scale.svg"),"License","gitindex-item-license")}
            ${y("Unknown","gitindex-language-dot","gitindex-item-language")}
        </div>
    `}function l(e,t,i){return`
        <div class="gitindex-info-item" id="${i}">
            <img src="${e}" alt="">
            <div>
                <span class="gitindex-info-label">${t}</span>
                <span class="gitindex-info-value"></span>
            </div>
        </div>
    `}function y(e,t,i){return`
        <div class="gitindex-info-item" id="${i}">
            <span class="gitindex-language-dot" id="${t}"></span>
            <div>
                <span class="gitindex-info-label">Language</span>
                <span class="gitindex-info-value">${e}</span>
            </div>
        </div>
    `}function p(){let e=R();return document.body.appendChild(e),e.style.display="none",{element:e,fields:{repoOwnerAvatar:e.querySelector("#gitindex-repo-owner-avatar"),repoName:e.querySelector("#gitindex-repo-name"),repoDescription:e.querySelector("#gitindex-repo-description"),repoOwner:e.querySelector("#gitindex-repo-owner"),statStars:e.querySelector("#gitindex-stat-stars .gitindex-stat-value"),statForks:e.querySelector("#gitindex-stat-forks .gitindex-stat-value"),statIssues:e.querySelector("#gitindex-stat-issues .gitindex-stat-value"),itemCreated:e.querySelector("#gitindex-item-created .gitindex-info-value"),itemUpdated:e.querySelector("#gitindex-item-updated .gitindex-info-value"),itemWatchers:e.querySelector("#gitindex-item-watchers .gitindex-info-value"),itemSize:e.querySelector("#gitindex-item-size .gitindex-info-value"),itemLicense:e.querySelector("#gitindex-item-license .gitindex-info-value"),itemLanguage:e.querySelector("#gitindex-item-language .gitindex-info-value"),itemLanguageColor:e.querySelector("#gitindex-language-dot")}}}function f(e,t,i){i.then(n=>{if(!n||!n)return;e.fields.repoOwnerAvatar.src=n.owner.avatar_url,e.fields.repoName.textContent=n.full_name,e.fields.repoDescription.textContent=n.description||"No description",e.fields.repoOwner.textContent=n.owner.login,e.fields.statStars.textContent=n.stargazers_count.toString(),e.fields.statForks.textContent=n.forks_count.toString(),e.fields.statIssues.textContent=n.open_issues_count.toString(),e.fields.itemCreated.textContent=new Date(n.created_at).toLocaleDateString(),e.fields.itemUpdated.textContent=new Date(n.updated_at).toLocaleDateString(),e.fields.itemWatchers.textContent=(n.subscribers_count??0).toString(),e.fields.itemSize.textContent=n.formatted_size||"Unknown",e.fields.itemLicense.textContent=n.license?n.license.name:"No license",e.fields.itemLanguage.textContent=n.language||"Unknown",e.fields.itemLanguageColor.style.backgroundColor=n.language_color||"transparent";let r=t.getBoundingClientRect();e.element.style.top=`${r.bottom+window.scrollY+8}px`,e.element.style.left=`${r.left+window.scrollX}px`,e.element.style.display="block"})}function h(){let e=document.querySelector(".gitindex-main-popup-view");e&&(e.style.display="none")}var M=/^https?:\/\/(.*\.)?github\.com\/.+\/.+/,T=/^\/.+\/.+/,b=200,c=null,x=0,d=new Map,v=new Map;fetch(chrome.runtime.getURL("assets/languages.json")).then(e=>e.json()).then(e=>{for(let[t,i]of Object.entries(e))v.set(t,{color:i.color})});var m=p();document.addEventListener("pointerenter",S,!0);function S(e){let t=e.target?.closest("a");t&&(c!==null&&(clearTimeout(c),c=null),c=window.setTimeout(()=>{if(c=null,!t.matches(":hover"))return;let i=++x,n=t.getAttribute("href");if(!n||n.startsWith("#")||n.startsWith("javascript:")||n.startsWith("mailto:"))return;let r=new URL(n,window.location.href),o=r.pathname.split("/").filter(Boolean);if(o.length===2&&!["topics","sponsors","settings"].includes(o[0]??"")&&(M.test(r.href)||r.hostname==="github.com"&&T.test(r.pathname))){let L=new Promise(a=>{if(d.has(o.join("/"))){a(d.get(o.join("/"))??null);return}new u(o[0]??"",o[1]??"").fetch().then(s=>{s.size<1024?s.formatted_size=`${s.size} KB`:s.size<1048576?s.formatted_size=`${(s.size/1024).toFixed(2)} MB`:s.formatted_size=`${(s.size/1048576).toFixed(2)} GB`,s.language_color=v.get(s.language??"")?.color??null,d.set(o.join("/"),s),a(s)}).catch(()=>{a(null)})});if(i!==x)return;if(m){let a=function(w){m&&h(),t?.removeEventListener("mouseout",a)};var C=a;f(m,t,L),t.addEventListener("mouseout",a)}}},b))}})();
