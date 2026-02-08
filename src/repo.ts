import { GithubLanguagesRequest } from "./api";
import { LOG } from "./config";

/* ──────────────────────────────
 * Constants
 * ────────────────────────────── */

const BG_COLOR = "#0d1117";
const DEFAULT_LANG_COLOR = "#ededed";
const CANVAS_SIZE = 1000;
const CENTER = CANVAS_SIZE / 2;

/* ──────────────────────────────
 * State
 * ────────────────────────────── */

let displayedLangs: {
    name: string;
    percent: number;
    color: string;
}[] = [];

let animationProgress = 0;
let animationFinished = false;

/* ──────────────────────────────
 * Inject CSS once
 * ────────────────────────────── */

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

/* ──────────────────────────────
 * Utilities
 * ────────────────────────────── */

const degreeToRadiant = (deg: number) => (deg * Math.PI) / 180;

const getRepoPath = () =>
    new URL(window.location.href).pathname.split("/").filter(Boolean);

/* ──────────────────────────────
 * Find GitHub Languages section safely
 * ────────────────────────────── */


function findLanguagesSection(): HTMLElement | null {
    const headers = document.querySelectorAll(
        "#repo-content-pjax-container h2"
    );

    for (const h of headers) {
        if (h.textContent?.trim() === "Languages") {
            return h.parentElement!;
        }
    }
    return null;
}

/* ──────────────────────────────
 * Toggle view
 * ────────────────────────────── */

function toggleLangView() {
    const langDiv = document.getElementById("gitindex-lang-div");
    const icon = document.getElementById("gitindex-lang-icon") as HTMLImageElement;
    const section = findLanguagesSection();

    if (!langDiv || !icon || !section) return;

    const barGraphic = section.querySelector<HTMLDivElement>("div.mb-2");
    const barList = section.querySelector<HTMLUListElement>("ul.list-style-none");

    if (!barGraphic || !barList) return;

    const pieHidden = langDiv.classList.contains("gitindex-hidden");

    langDiv.classList.toggle("gitindex-hidden", !pieHidden);
    barGraphic.classList.toggle("gitindex-hidden", pieHidden);
    barList.classList.toggle("gitindex-hidden", pieHidden);

    icon.src = chrome.runtime.getURL(
        pieHidden ? "assets/chart-bar.svg" : "assets/chart-pie.svg"
    );
}

/* ──────────────────────────────
 * Render UI
 * ────────────────────────────── */

function renderUI(owner: string, repo: string) {
    const section = findLanguagesSection();
    if (!section) return;

    // Cleanup previous injection
    section.querySelector("#gitindex-lang-div")?.remove();
    section.querySelector("#gitindex-lang-button")?.remove();

    const header = section.querySelector("h2");
    if (!header) return;

    /* Toggle button */
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

    /* Pie container */
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
            marginRight: "8px",
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

/* ──────────────────────────────
 * Canvas animation
 * ────────────────────────────── */

function renderCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!;
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

/* ──────────────────────────────
 * Init (PJAX safe)
 * ────────────────────────────── */

async function init(languageColors: Map<string, { color: string }>) {
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
        let percent = (bytes / total) * 100;
        percent = i === entries.length - 1
            ? 100 - acc
            : Number(percent.toFixed(3));

        acc += percent;

        displayedLangs.push({
            name,
            percent,
            color: langColors.get(name)?.color ?? DEFAULT_LANG_COLOR,
        });
    });

    renderUI(owner, repo);
}

/* ──────────────────────────────
 * Exported for contentController
 * ────────────────────────────── */

interface exportData {
    mounted: boolean;
    mount: (languagesGlobalIn: Map<string, { color: string }>) => void;
    unmount: () => void;
}

export const repoModule: exportData = {
    mounted: false,
    mount: (languagesGlobalIn: Map<string, { color: string }>) => {
        if (repoModule.mounted) {
            LOG.warn("Repo module is already mounted.");
            return;
        }

        init(languagesGlobalIn);
        repoModule.mounted = true;
    },
    unmount: () => {
        if (!repoModule.mounted) {
            LOG.warn("Repo module is not mounted.");
            return;
        }

        // prepare for unmounting
        displayedLangs = [];
        animationProgress = 0;
        animationFinished = false;

        document.querySelector("#gitindex-lang-div")?.remove();
        document.querySelector("#gitindex-lang-button")?.remove();

            repoModule.mounted = false;
    }
}



/*                                   _                _
                                    '-.          ,-'
                                         '.      ,'
                                           \    /
                                           _|__|_
                                          (,\--/,)
                                          /\Y  Y/
                                        ."  `><'
                                      ."    /|
                                     /  /  // .-"'y".
                                  _."  /  // / -//-//
                               _."l   /| || / ,// //
                            _."  / ',/ | |," ,// //
                .-.      _."   ."  ."  | `  ,//-//
               //'.'. _."   _."/ |/    "._."// //
              //  _\ \  _,-" _|  Y          ^  ^
             //_."  \'\" /  / \  \._
            //"    _.\ \|  /   "----|====-.
         _.//   _." \_\___/        ||     \\
      .-" //_.-" \_."              ||      \\
   _."   //" \__,"                 ||       \\
 ."   __//>.-"                     ||        "----
"---"" //                           \           */