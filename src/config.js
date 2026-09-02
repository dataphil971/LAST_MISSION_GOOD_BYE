// Point de configuration unique du build public.
//
// DOCTRINE DE SECURITE (docs/SECURITY.md) : ce fichier, comme tout le
// depot, ne doit contenir AUCUN nom de projet interne, table, hostname,
// workspace/report ID, URL interne, token, environnement, ni nom de
// collaborateur. Les douze missions portent des noms de code fictifs et les
// PNJ des identifiants anonymises (BI_xx, DE_xx, PO_xx).

export const CONFIG = {
  // -- Contacts de l ecran final -------------------------------------
  // Remplacer LINKEDIN_URL avant diffusion : c est le seul champ manquant.
  contacts: [
    {
      id: 'linkedin',
      label: 'LINKEDIN',
      sub: 'Garder contact',
      url: 'LINKEDIN_URL',
      accent: 'accent_orange',
    },
    {
      id: 'github',
      label: 'GITHUB',
      sub: 'Mes projets',
      url: 'https://github.com/dataphil971',
      accent: 'shirt_light',
    },
    {
      id: 'github_perso',
      label: 'GITHUB / PERSO',
      sub: 'Mon labo',
      url: 'https://github.com/filou337',
      accent: 'success',
    },
    {
      id: 'email',
      label: 'E-MAIL',
      sub: "M'écrire",
      url: 'mailto:roumbophilippe1@gmail.com'
        + '?subject=' + encodeURIComponent("À propos de ton jeu d'au revoir"),
      accent: 'sunset_gold',
    },
  ],

  // -- Rendu ---------------------------------------------------------
  width: 384,          // canvas logique impose par la Bible d art
  height: 216,         // 384x216 x5 = 1920x1080, facteur entier exact
  maxScale: 6,
  targetFps: 60,

  // -- Rythme --------------------------------------------------------
  // Mode rapide : le joueur ne doit jamais etre prisonnier des cinematiques.
  textSpeed: 34,       // caracteres par seconde
  textSpeedFast: 140,
  autoAdvance: false,

  // -- Divers --------------------------------------------------------
  saveKey: 'last_mission_goodbye.v1',
  debug: false,        // F1 en jeu : grille, hitbox, compteur de frames
};

/** Un lien de contact est-il pret pour la diffusion publique ? */
export function contactReady(contact) {
  return !!contact.url && !contact.url.endsWith('_URL');
}
