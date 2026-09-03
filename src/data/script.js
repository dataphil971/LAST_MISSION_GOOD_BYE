// Texte du jeu, séparé de la mise en scène.
//
// Écrire ici, mettre en scène dans src/scenes/. Aucun nom réel de projet,
// de système ou de collaborateur : les missions portent des noms de code
// fictifs et les PNJ des identifiants anonymisés (docs/SECURITY.md).
//
// Tonalité visée : 60 % chaleureux, 25 % humour de bureau, 15 % valorisation.
// On rit AVEC Philippe, jamais DE Philippe.

export const T = {
  title: {
    name: 'LAST MISSION',
    sub: 'GOOD BYE',
    tagline: 'La dernière journée d\'un Data Analyst',
    duration: 'environ 5 minutes',
    start: 'JOUER',
    fast: 'MODE RAPIDE',
    end: 'ALLER À LA FIN',
    hint: 'CLIC ou ESPACE pour avancer  ·  ÉCHAP pour le menu',
  },

  exterior: {
    clock: '08:43',
    day: 'DERNIER JOUR',
    thought: '...dernière fois.',
  },

  lobby: {
    hello_hero: 'Bonjour !',
    hello_desk: 'Bonjour Philippe !',
    evening_desk: 'Bonne soirée !',
    evening_hero: 'Merci. Et bonne continuation.',
  },

  elevator: {
    floor: 'PREMIER ÉTAGE',
  },

  floor: {
    banner: 'ZONE DÉCOUVERTE',
    bannerSub: 'LE PLATEAU',
    tutor_hello: 'Alors, prêt pour ta dernière journée ?',
    hero_reply: 'Je crois.',
    sit_hint: 'Un vieux tableau de bord est resté ouvert sur ton écran.',
    archive: 'ARCHIVE TROUVÉE',
    archiveSub: 'MISSION 01',
  },

  // -- Mission 01 : ATLAS ------------------------------------------------
  atlas: {
    id: 'ATLAS',
    number: 'MISSION 01',
    title: 'Trop de choses à l\'écran',
    goal: 'Comprendre que la BI, c\'est aussi de l\'UX.',
    instruction: 'Clique un bloc, puis la zone où il doit aller.',
    blocks: ['KPI', 'FILTRES', 'GRAPHIQUES', 'TABLEAU', 'NAVIGATION'],
    wrong: 'Pas ici.',
    solved: 'Le rapport respire enfin.',
    bug: 'Et là, le signet ne veut plus rien savoir.',
    // Clin d'oeil au doublage français des Simpson : Homer dit « Oh pinaise ! »
    heroDoh: 'Oh pinaise !',
    heroPanic: 'Bon. J\'ai cliqué partout. Vraiment partout.',
    npcArrive: 'T\'as essayé... ça ?',
    afterPress: '...c\'était ça ?',
    npcYes: 'Oui.',
    heroCamera: 'Très bien.',
    skillBanner: 'COMPÉTENCE DÉBLOQUÉE',
    skillName: 'HIÉRARCHIE VISUELLE',
    xp: '+150 XP',
    done: 'MISSION ARCHIVÉE',
    doneSub: 'TERMINÉE  ·  Souvenir ajouté.',
  },

  // -- Mission 11 : SENTINEL ---------------------------------------------
  // L'agent de gouvernance et les bonnes pratiques. C'est aussi la
  // quatrième et dernière occurrence du bouton magique : Philippe transmet.
  sentinel: {
    id: 'SENTINEL',
    number: 'MISSION 11',
    title: 'L\'apprenti devient mentor',
    goal: 'Un agent qui vérifie les règles pendant que tu dors.',
    instruction: 'Clique les objets qui enfreignent une règle.',
    agent: 'AGENT DE GOUVERNANCE',
    rulesTitle: 'RÈGLES SURVEILLÉES',
    // Les bonnes pratiques, telles qu'on se les fait rappeler en vrai.
    rules: [
      'DEV avant PROD',
      'Nom métier attendu',
      'Description obligatoire',
      'Granularité vérifiée',
      'Source unique de vérité',
    ],
    // Quatre violations, deux objets conformes : le piège est de tout
    // signaler. Un faux positif coûte aussi cher qu'un oubli.
    cards: [
      { name: 'Report Orion', note: 'publié direct en PROD', rule: 'DEV avant PROD' },
      { name: 'CA_2024_v2_final', note: 'nom technique côté métier', rule: 'Nom métier' },
      { name: 'dim_client', note: 'aucune description', rule: 'Description' },
      { name: 'Campaign 07', note: 'mesure au mauvais grain', rule: 'Granularité' },
      { name: 'Workspace North', note: 'conforme au catalogue', rule: null },
      { name: 'Dataset A', note: 'relation au bon niveau', rule: null },
    ],
    falsePositive: 'Celui-là est conforme.',
    missed: 'violations',
    ready: 'AGENT PRÊT',
    solved: 'L\'agent tourne. Il tournera encore lundi.',
    // Le bouton magique, occurrence n°4 : cette fois, c'est lui qui aide.
    peerStuck: 'RULE CHECK FAILED',
    peerCall: 'Il refuse de passer et je ne vois pas pourquoi.',
    peerAsk: 'Comment t\'as su ?',
    heroAnswer: 'L\'expérience.',
    heroOffscreen: '...je crois.',
    skillBanner: 'COMPÉTENCE DÉBLOQUÉE',
    skillName: 'GOUVERNANCE',
    xp: '+300 XP',
    done: 'MISSION ARCHIVÉE',
    doneSub: 'TERMINÉE  ·  Souvenir ajouté.',
  },

  // -- Montage : le reste du stage passe en accéléré ---------------------
  montage: {
    banner: 'ARCHIVES DU STAGE',
    note: 'PROTOTYPE  ·  missions 02 à 10 et 12 à produire',
    missions: [
      ['02', 'IRIS', 'Mais cette colonne veut dire quoi ?'],
      ['03', 'ECHO', 'Qui est qui ?'],
      ['04', 'LEDGER', 'Il en manque un'],
      ['05', 'BRIDGE', 'Deux IDs entrent dans un bar...'],
      ['06', 'VERDANT', 'Changer sans casser'],
      ['07', 'HORIZON', 'Une étoile, mais pas dans le ciel'],
      ['08', 'PULSE', 'Le mini-boss'],
      ['09', 'SAFEPATH', 'Suis la donnée'],
      ['10', 'BEACON', '48 heures'],
      ['11', 'SENTINEL', 'L\'apprenti devient mentor'],
      ['12', 'RELAY', 'Faire en sorte que ça continue sans moi'],
    ],
    end: 'MISSION 12',
    endSub: 'TERMINÉE',
    internship: 'STAGE',
    internshipSub: 'TERMINÉ',
  },

  // -- Écran de bilan, à la fin du stage --------------------------------
  recap: {
    title: 'STAGE CDS — COMPLETED',
    stats: [
      ['Data analysée', 'beaucoup trop'],
      ['Bugs résolus', 'on ne compte plus'],
      ['Power BI', '+100 XP'],
      ['Cafés', '████████████ 99+'],
      ['Collègues sollicités', '👀'],
      ['Survie au stage', '100 %'],
    ],
    reward: 'RÉCOMPENSE : +1 Data Analyst',
    hint: 'CLIC pour continuer',
  },

  // -- Départ ------------------------------------------------------------
  departure: {
    // Produits du commerce, jamais un nom d'instance ou d'environnement.
    apps: ['Azure DevOps', 'Power BI', 'IntelliJ', 'OneNote',
      'Databricks', 'la VM', 'Outlook', 'Teams'],
    closing: 'Fermeture...',
    path: ['BUREAU', 'PLATEAU', 'COULOIR', 'ASCENSEUR', 'RDC', 'ACCUEIL', 'EXTÉRIEUR'],
  },

  // -- Coucher de soleil : le discours ----------------------------------
  sunset: {
    speech: [
      'Après plusieurs mois passés ici, cette aventure touche à sa fin.',
      'Merci à toutes celles et ceux qui m\'ont accueilli, accompagné,'
        + ' conseillé et fait confiance.',
      'Je repars avec beaucoup plus que de nouvelles compétences.',
      'J\'ai appris à observer la donnée avant de vouloir la représenter,'
        + ' à comprendre le besoin avant de chercher une solution, et à'
        + ' regarder ce qui se cache derrière un graphique plutôt que de'
        + ' m\'arrêter à ce qu\'il affiche.',
      'Mais surtout, j\'ai appris qu\'avancer, c\'est aussi savoir demander'
        + ' de l\'aide plutôt que de rester bloqué seul face à un problème.',
      'Merci pour votre disponibilité, vos conseils et tous les moments'
        + ' partagés.',
      'Je garderai un très bon souvenir de mon passage ici et de toutes les'
        + ' personnes que j\'ai eu la chance de rencontrer.',
      'Je vous souhaite à toutes et à tous une excellente continuation.',
      'Et au plaisir de vous recroiser.',
    ],
    thanks: 'MERCI POUR CETTE AVENTURE.',
  },

  // -- Faux générique et quête bonus ------------------------------------
  credits: {
    title: 'UN JEU D\'AU REVOIR',
    // ATTENTION : ces deux lignes nomment des personnes réelles.
    // Leur accord est requis avant toute diffusion (docs/SECURITY.md).
    roles: [
      ['RÉALISATION', 'PHILIPPE ROUMBO'],
      ['TUTEUR', 'MARIN WYATT'],
      ['MANAGER', 'AMAURY'],
      ['AVEC', 'LES ÉQUIPES BI ET DATA ENG'],
    ],
    footer: 'écrit, dessiné et codé pour dire merci',
    route: 'ITINÉRAIRE VERS DOMICILE',
    time: '2 h 03',
    questBanner: 'QUÊTE BONUS',
    questName: 'RENTRER CHEZ MOI',
    questDiff: 'Difficulté : ★★★★★',
    questDur: 'Durée estimée : 2 h 03',
    questReward: 'Récompense : mon lit',
    heroSilence: '...',
    heroOk: 'Bon.',
  },

  // -- Écran final -------------------------------------------------------
  outro: {
    thanks: 'MERCI D\'AVOIR JOUÉ',
    contact: 'ON GARDE CONTACT ?',
    replay: 'REJOUER',
    note: 'Missions, systèmes et personnes : noms fictifs ou anonymisés.',
  },
};

// Locuteurs. Les PNJ gardent leur identifiant anonymisé comme nom affiché :
// c'est un choix assumé, pas un oubli (doctrine de sécurité).
export const CAST = {
  philippe: { name: 'Philippe', color: '#F1B55F' },
  reception: { name: 'Accueil', color: '#D2C5A6' },
  tutor: { name: 'Tuteur · PO_01', color: '#8B8FA8' },
  bi07: { name: 'BI_07', color: '#93A86D' },
  peer: { name: 'DE_04', color: '#C08A79' },
  narrator: { name: '', color: '#D2C5A6' },
};
