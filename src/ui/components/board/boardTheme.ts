export type BoardStyle = 'atlas' | 'classic';

export interface BoardThemeColors {
  sea: string;
  seaDeep?: string;
  land: string;
  landCoast?: string;
  outOfPlay: string;
  outOfPlayBorder: string;
  coastline: string;
  inlandBorder: string;
  waterBorder: string;
  selection: string;
  selectionStroke: string;
  origin: string;
  originStroke: string;
  highlight: string;
  highlightStroke: string;
  fontSerif: string;
}

export const ATLAS_THEME: BoardThemeColors = {
  sea: '#122c3a',
  seaDeep: '#0b1d27',
  land: '#ede3cd',
  landCoast: '#e4d8bf',
  outOfPlay: '#1e2227',
  outOfPlayBorder: '#3b434d',
  coastline: '#3a2b1c',
  inlandBorder: '#998060',
  waterBorder: '#1c4257',
  selection: 'rgba(255, 255, 255, 0.28)',
  selectionStroke: '#ffffff',
  origin: 'rgba(238, 186, 44, 0.32)',
  originStroke: '#eeba2c',
  highlight: 'rgba(238, 186, 44, 0.22)',
  highlightStroke: '#eeba2c',
  fontSerif: "'Palatino Linotype', 'Book Antiqua', Palatino, 'Georgia', serif",
};

export const CLASSIC_THEME: BoardThemeColors = {
  sea: '#14506a',
  land: '#c8a86a',
  outOfPlay: '#59564c',
  outOfPlayBorder: '#44423a',
  coastline: '#9c7d3e',
  inlandBorder: '#9c7d3e',
  waterBorder: '#123f52',
  selection: 'rgba(255, 255, 255, 0.2)',
  selectionStroke: '#ffffff',
  origin: 'rgba(255, 210, 63, 0.2)',
  originStroke: '#ffd23f',
  highlight: 'rgba(255, 210, 63, 0.28)',
  highlightStroke: '#ffd23f',
  fontSerif: 'sans-serif',
};

export function getStoredBoardStyle(): BoardStyle {
  try {
    const s = localStorage.getItem('advciv-board-style');
    return s === 'classic' ? 'classic' : 'atlas';
  } catch {
    return 'atlas';
  }
}

export function setStoredBoardStyle(style: BoardStyle) {
  try {
    localStorage.setItem('advciv-board-style', style);
  } catch {
    /* ignore */
  }
}
