# GitIndex

A browser extension that enhances GitHub's UI with quality-of-life features, not aiming to fix everything, but do the things that it does right.

## Features

- **File hover actions** — Copy relative path, copy URL, copy raw URL, and open in new tab directly from the file list

![Action button preview](/demo/feature_preview_action_buttons.gif)
- **Edit with IDE** — Open any repository in GitHub.dev, VS Code, or GitPod with a single click

![Edit button](/demo/feature_preview_edit_button.gif)
- **Repository preview card** — Hover over any repository in search results to instantly see stars, forks, open issues, size, license, language, and more — without leaving the page

![Search hover card](/demo/feature_preview_search_hover.gif)
- **Language donut chart** — A visual upgrade to GitHub's language breakdown in the sidebar

![Piechart demo](/demo/feature_preview_pie_chart.gif)

## Install

1. Download the latest `.crx` file from [Releases](../../releases)
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Drag and drop the `.crx` file onto the page

## Build

**Requirements:** Node.js, npm

```bash
git clone https://github.com/PokeMatPok/gitindex.git
cd gitindex
npm install
npm run build
```

The extension compiles to a single `dist/content.js` file via esbuild.

To load the unpacked build in Chrome:
1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

## Architecture

GitIndex is built on a custom SPA content script framework written in TypeScript and bundled with esbuild.

Chrome content scripts don't handle SPA navigation natively — when GitHub updates the page without a full reload, standard content scripts miss it. GitIndex solves this with a **content controller** that listens to GitHub's SPA routing and loads the right feature modules for the current page automatically.

The framework is fully modular: each page (e.g. repository view, search results) has its own module, and each module is composed of independent feature submodules. Everything compiles down to a single JS file that figures out what to load on its own.

## Roadmap

- Config via Action widow at the top
- Favorites selection for File quick actions
- User-configurable preferred IDE (one-click open)
- More file quick actions
- GitLab/Bitbucket support

## Contributing

Pull requests are welcome! If you'd like to add support for a new platform or feature, feel free to open an issue first to discuss.

## License

MIT
