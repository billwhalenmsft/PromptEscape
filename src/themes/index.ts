import { Theme, ThemeId } from '../types';
import { indianaJones } from './indianaJones';
import { harryPotter } from './harryPotter';
import { clippyLand } from './clippyLand';

const themes: Record<ThemeId, Theme> = {
  'indiana-jones': indianaJones,
  'harry-potter': harryPotter,
  'clippyland': clippyLand,
};

export function getTheme(id: string): Theme | undefined {
  return themes[id as ThemeId];
}

export function getAllThemes(): Theme[] {
  return Object.values(themes);
}
