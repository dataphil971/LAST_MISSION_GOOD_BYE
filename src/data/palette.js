// Palette projet verrouillee. Toute couleur du jeu DOIT venir d ici.
// Elle est identique a celle de tools/rig.py : si l une bouge, l autre suit.
// Regle heritee de la Bible d art : rampes locales de 3 a 4 tons, aucun
// contour #000000, tres peu de nuances proches.

export const C = {
  outline_deep: '#211820',
  outline_warm: '#35252A',

  helmet_light: '#FFE76A',
  helmet_base: '#F0C94F',
  helmet_shadow: '#C99231',
  helmet_deep: '#73501F',

  skin_light: '#F0BB96',
  skin_base: '#CE896A',
  skin_shadow: '#925543',

  shirt_light: '#6E8996',
  shirt_base: '#435D6B',
  shirt_shadow: '#293D49',

  trouser_base: '#333A46',
  trouser_shadow: '#222832',
  shoe: '#3B302C',

  ui_panel: '#2E1F2A',
  ui_shadow: '#241820',
  ui_border: '#6C4034',
  ui_cell: '#6F6255',
  ui_cell_dark: '#51483F',

  text_cream: '#F2E9CF',
  text_muted: '#D2C5A6',

  accent_orange: '#D38437',
  sunset_gold: '#F1B55F',
  sunset_coral: '#D57A62',
  sunset_mauve: '#76546B',
  night_blue: '#31415E',

  success: '#80A66D',
  error: '#B85F58',
};

// Tons de decor derives de la meme famille chromatique : les fonds sont
// peints, les personnages sont des sprites (cf. docs/ART_BIBLE.md).
export const D = {
  sky_dawn_high: '#5E6E8C',
  sky_dawn_mid: '#8E8AA0',
  sky_dawn_low: '#C79A87',
  facade_light: '#7A6A6A',
  facade_base: '#5D5054',
  facade_shadow: '#463C42',
  facade_deep: '#332B31',
  window_lit: '#F1B55F',
  window_cold: '#6E8996',
  window_dark: '#3A3440',
  ground_light: '#5A5158',
  ground_base: '#453E45',
  ground_deep: '#332E36',
  wall_light: '#7C6357',
  wall_base: '#5E4A44',
  wall_shadow: '#453733',
  floor_light: '#6F6255',
  floor_base: '#51483F',
  floor_shadow: '#3B342E',
  desk_light: '#8A6A4C',
  desk_base: '#6B5039',
  desk_shadow: '#4C382A',
  screen_on: '#8FB8C9',
  screen_dim: '#4A6572',
  plant: '#5C7A52',
  plant_dark: '#3E5638',
};
