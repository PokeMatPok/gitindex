import type { GithubRepoResponse } from "../../types/repo";

function createPopup(): HTMLDivElement {
    const popup = document.createElement('div');
    popup.className = 'gitindex-main-popup-view';

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

function createStatsRow(): string {
    return `
        <div class="gitindex-stats-row">
            ${createStatItem(chrome.runtime.getURL('assets/star.svg'), 'Stars', 'gitindex-stat-stars')}
            ${createStatItem(chrome.runtime.getURL('assets/git-fork.svg'), 'Forks', 'gitindex-stat-forks')}
            ${createStatItem(chrome.runtime.getURL('assets/circle-alert.svg'), 'Open Issues', 'gitindex-stat-issues')}
        </div>
    `;
}

function createStatItem(icon: string, label: string, id: string): string {
    return `
        <div class="gitindex-stat-item" id="${id}">
            <img src="${icon}" alt="${label}">
            <span class="gitindex-stat-label">${label}</span>
            <span class="gitindex-stat-value"></span>
        </div>
    `;
}

function createInfoGrid(): string {
    return `
        <div class="gitindex-info-grid">
            ${createInfoItem(chrome.runtime.getURL('assets/calendar.svg'), 'Created', 'gitindex-item-created')}
            ${createInfoItem(chrome.runtime.getURL('assets/calendar-sync.svg'), 'Updated', 'gitindex-item-updated')}
            ${createInfoItem(chrome.runtime.getURL('assets/eye.svg'), 'Watchers', 'gitindex-item-watchers')}
            ${createInfoItem(chrome.runtime.getURL('assets/file.svg'), 'Size', 'gitindex-item-size')}
            ${createInfoItem(chrome.runtime.getURL('assets/scale.svg'), 'License', 'gitindex-item-license')}
            ${createLanguageItem('Unknown', "gitindex-language-dot", 'gitindex-item-language')}
        </div>
    `;
}

function createInfoItem(icon: string, label: string, id: string): string {
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

function createLanguageItem(language: string, color_id: string, id: string): string {
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

export interface PopupFields {
    repoOwnerAvatar: HTMLImageElement,
    repoName: HTMLElement,
    repoDescription: HTMLElement,
    repoOwner: HTMLElement,
    statStars: HTMLElement,
    statForks: HTMLElement,
    statIssues: HTMLElement,
    itemCreated: HTMLElement,
    itemUpdated: HTMLElement,
    itemWatchers: HTMLElement,
    itemSize: HTMLElement,
    itemLicense: HTMLElement,
    itemLanguage: HTMLElement,
    itemLanguageColor: HTMLElement
}

function registerPopupDiv(): {
    element: HTMLDivElement,
    fields: PopupFields
} {

    const popup = createPopup();
    document.body.appendChild(popup);
    popup.style.display = 'none';

    return {
        element: popup, fields: {
            repoOwnerAvatar: popup.querySelector('#gitindex-repo-owner-avatar') as HTMLImageElement,
            repoName: popup.querySelector('#gitindex-repo-name') as HTMLElement,
            repoDescription: popup.querySelector('#gitindex-repo-description') as HTMLElement,
            repoOwner: popup.querySelector('#gitindex-repo-owner') as HTMLElement,
            statStars: popup.querySelector('#gitindex-stat-stars .gitindex-stat-value') as HTMLElement,
            statForks: popup.querySelector('#gitindex-stat-forks .gitindex-stat-value') as HTMLElement,
            statIssues: popup.querySelector('#gitindex-stat-issues .gitindex-stat-value') as HTMLElement,
            itemCreated: popup.querySelector('#gitindex-item-created .gitindex-info-value') as HTMLElement,
            itemUpdated: popup.querySelector('#gitindex-item-updated .gitindex-info-value') as HTMLElement,
            itemWatchers: popup.querySelector('#gitindex-item-watchers .gitindex-info-value') as HTMLElement,
            itemSize: popup.querySelector('#gitindex-item-size .gitindex-info-value') as HTMLElement,
            itemLicense: popup.querySelector('#gitindex-item-license .gitindex-info-value') as HTMLElement,
            itemLanguage: popup.querySelector('#gitindex-item-language .gitindex-info-value') as HTMLElement,
            itemLanguageColor: popup.querySelector('#gitindex-language-dot') as HTMLElement
        }
    };
}


function populatePopup(popup: { element: HTMLDivElement, fields: PopupFields }, link: HTMLElement, data: Promise<GithubRepoResponse | null>) {
    data.then((repoData) => {
        if (!repoData) {
            return;
        }
        if (!repoData) return;

        // Populate popup fields
        popup.fields.repoOwnerAvatar.src = repoData.owner.avatar_url;
        popup.fields.repoName.textContent = repoData.full_name;
        popup.fields.repoDescription.textContent = repoData.description || 'No description';
        popup.fields.repoOwner.textContent = repoData.owner.login;
        popup.fields.statStars.textContent = repoData.stargazers_count.toString();
        popup.fields.statForks.textContent = repoData.forks_count.toString();
        popup.fields.statIssues.textContent = repoData.open_issues_count.toString();
        popup.fields.itemCreated.textContent = new Date(repoData.created_at).toLocaleDateString();
        popup.fields.itemUpdated.textContent = new Date(repoData.updated_at).toLocaleDateString();
        popup.fields.itemWatchers.textContent =
            (repoData.subscribers_count ?? 0).toString();
        popup.fields.itemSize.textContent = repoData.formatted_size || 'Unknown';
        popup.fields.itemLicense.textContent = repoData.license ? repoData.license.name : 'No license';
        popup.fields.itemLanguage.textContent = repoData.language || 'Unknown';
        popup.fields.itemLanguageColor.style.backgroundColor = repoData.language_color || 'transparent';


        const rect = link.getBoundingClientRect();
        popup.element.style.top = `${rect.bottom + window.scrollY + 8}px`;
        popup.element.style.left = `${rect.left + window.scrollX}px`;
        popup.element.style.display = 'block';
    });
}

function hidePopup() {
    const popup = document.querySelector('.gitindex-main-popup-view') as HTMLDivElement;
    if (popup) {
        popup.style.display = 'none';
    }
}

export {
    registerPopupDiv,
    populatePopup,
    hidePopup
}