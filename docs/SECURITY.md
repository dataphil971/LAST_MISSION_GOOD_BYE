# Doctrine d'anonymisation

Ce jeu raconte un stage réel dans une entreprise réelle. Il est destiné à être
publié et partagé. **Aucun élément permettant d'identifier l'entreprise, ses
systèmes ou ses collaborateurs ne doit se retrouver dans le dépôt ni dans le
build distribué.**

## Interdits absolus

Ni dans le code, ni dans les assets, ni dans les commits, ni dans les captures :

- nom réel de projet interne ;
- nom de table, de schéma ou de dataset ;
- hostname, adresse de serveur, chemin réseau ;
- identifiant de workspace, de rapport, de tenant, de tableau de bord ;
- URL interne (y compris une URL cloud d'entreprise) ;
- token, clé, secret, chaîne de connexion ;
- nom d'environnement précis ;
- nom, prénom, trigramme ou adresse d'un collaborateur sans accord écrit ;
- adresse interne, donnée RH, identifiant utilisateur ;
- capture d'écran d'un outil contenant de vraies données.

## Ce qu'on met à la place

| Réel | Publié |
| --- | --- |
| nom du projet | nom de code fictif : ATLAS, IRIS, ECHO, LEDGER, BRIDGE, VERDANT, HORIZON, PULSE, SAFEPATH, BEACON, SENTINEL, RELAY |
| collaborateur | identifiant anonymisé : `BI_01`…`BI_07`, `DE_01`…`DE_06`, `PO_01`…`PO_05` |
| utilisateur | `User_042` |
| espace de travail | `Workspace North` |
| jeu de données | `Dataset A` |
| campagne | `Campaign 07` |
| rapport | `Report Orion` |

Aucun tableau de correspondance « nom réel → pseudonyme » ne doit être
publié, ni dans le dépôt, ni dans un commit, ni dans une issue.

Les prénoms réels peuvent éventuellement apparaître dans une **build privée**
après accord explicite des personnes concernées. La build publique reste
pseudonymisée.

## Décor

Reproduire la structure émotionnelle des lieux, pas un plan architectural.

```
Hall → Ascenseur → 1er étage → Plateau à droite
```

C'est suffisant. Il n'est pas utile de publier des informations plus précises
sur l'implantation réelle.

## Données affichées à l'écran

Toutes les valeurs visibles dans le jeu sont inventées : les KPI du puzzle
ATLAS (`1 240`, `318`, `62 %`, `+4`), les libellés de filtres, les lignes de
tableau. Elles sont choisies pour être plausibles et inoffensives.

## Contacts

`src/config.js` est le seul endroit où figurent des données personnelles :
profils publics et adresse e-mail. Deux règles :

1. utiliser une adresse **durable et publique**, jamais une adresse interne
   ou temporaire ;
2. les liens externes s'ouvrent avec `noopener,noreferrer`, ce qui limite ce
   que la page cible peut faire de la page d'origine et la provenance
   transmise. L'e-mail passe par un `mailto:`.

## Checklist avant publication

À dérouler avant chaque diffusion (mail, réseau social, GitHub Pages) :

- [ ] `git log -p` relu : aucun secret ni nom réel dans l'historique, pas
      seulement dans l'état courant.
- [ ] Recherche dans tout le dépôt des motifs sensibles (nom de l'entreprise,
      domaine, `http://` interne, `.local`, noms de collègues).
- [ ] `docs/screens/` : aucune capture ne montre de donnée réelle.
- [ ] `docs/moodboard/` : aucune image sous filigrane ou sous licence
      incompatible n'est intégrée au jeu.
- [ ] `src/config.js` : `LINKEDIN_URL` remplacé, adresse e-mail correcte.
- [ ] Le build distribué (`dist/`) est régénéré depuis la version relue.
- [ ] Personne identifiable dans un sprite ou un dialogue ? Accord obtenu.

En cas de fuite déjà commitée, réécrire l'historique ne suffit pas si le dépôt
a été poussé : considérer la donnée comme compromise et la faire tourner
(token, clé) ou en informer la personne concernée.
