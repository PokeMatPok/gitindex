import map from './icon-map.json';

type IconMap = typeof map;

export { map };

export function getIcon(filename: string): string {
  if (!filename) return map.defaults.file;

  const bare = filename.startsWith('.') && !filename.slice(1).includes('.')
    ? filename.slice(1)
    : null;
  if (bare) return map.extensions[bare as keyof typeof map.extensions] ?? map.defaults.file;

  if (filename in map.filenames) return map.filenames[filename as keyof typeof map.filenames];
  const lower = filename.toLowerCase();
  if (lower in map.filenames) return map.filenames[lower as keyof typeof map.filenames];

  if (lower in map.extensions) return map.extensions[lower as keyof typeof map.extensions];

  const parts = filename.split('.');

  if (parts.length > 2) {
    const compound = parts.slice(1).join('.');
    if (compound in map.extensions) return map.extensions[compound as keyof typeof map.extensions];
  }

  if (parts.length > 1) {
    const ext = parts.at(-1)!.toLowerCase();
    if (ext in map.extensions) return map.extensions[ext as keyof typeof map.extensions];
  }

  return map.defaults.file;
}

export function getIconPath(filename: string, opts: { prefix?: string } = {}): string {
  const prefix = opts.prefix ?? 'icons/';
  const icon = getIcon(filename);
  if (icon === map.defaults.file) return `${prefix}${icon}.svg`;
  return `${prefix}${map.iconPrefix.file}${icon}${map.iconSuffix}`;
}

export function getFolderIcon(folderName: string, opts: { open?: boolean } = {}): string {
  if (!folderName) return opts.open ? map.defaults.folderOpen : map.defaults.folder;
  const key = folderName.replace(/^\./, '').toLowerCase();
  if (opts.open) return map.foldersOpen[key as keyof typeof map.foldersOpen] ?? map.defaults.folderOpen;
  return map.folders[key as keyof typeof map.folders] ?? map.defaults.folder;
}

export function getFolderIconPath(folderName: string, opts: { open?: boolean; prefix?: string } = {}): string {
  const prefix = opts.prefix ?? 'icons/';
  const icon = getFolderIcon(folderName, opts);
  return `${prefix}${icon}.svg`;
}
