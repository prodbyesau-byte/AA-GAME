# AA Game Mechanics Rules

Dette dokument er spillets gameplay-kontrakt. Nye features skal følge reglerne her, før de implementeres i kode.

## Arbejdsgang

1. En mechanic beskrives først i denne fil.
2. Konkrete tal og keybinds lægges i `src/data/gameRules.ts`.
3. Levelplaceringer, zoner og spawns lægges i Tiled-mapfilen `public/assets/maps/andersen-auto-service.json`.
4. Koden må kun hardcode fallback-værdier, ikke primære level-regler.
5. E2E-tests skal bruge `/?test=1`, så vi tester mekanik uden lange ventetider.

## Input

- Bevægelse: `WASD` og piletaster.
- Interaktion med vinduer: hold `E`.
- Stige: `F`.
- Hop: `Space`, når den mechanic bliver implementeret.
- Character page: `I`, når den mechanic bliver implementeret.

## Player States

Spilleren skal altid være i én tydelig state.

- `idle`: står stille.
- `walking`: bevæger sig på jorden.
- `soaping`: sæber vinduet ind.
- `squeegee`: trækker sæbe af vinduet.
- `ladder-idle`: står stille på stigen.
- `ladder-climbing`: kravler på stigen.

Nye mechanics skal tilføje nye states før animation og input kobles på.

## Vinduespudsning

- Et vindue har tre faser: `dirty`, `soaped`, `clean`.
- Spilleren skal holde `E` gennem sæbe-fasen.
- Spilleren skal slippe `E` og holde `E` igen gennem squeegee-fasen.
- Nederste vinduer kan kun pudses fra jorden, når spilleren står foran vinduet.
- Øverste vinduer kan kun pudses fra en placeret stige, når spilleren er højt nok oppe.

## Stige

- Stigen starter på taget af varevognen.
- Spilleren kan tage stigen med `F` inde i zonen `van-ladder-pickup`.
- Når spilleren bærer stigen, er movement-speed 50%.
- Stigen kan kun sættes op med `F` inde i zonen `ladder-wall`.
- Når stigen sættes op, snapper den til nærmeste øverste beskidte vindue inden for den fastsatte snap-distance.
- Spilleren kan kravle op/ned med `W/S` eller piletaster, når han står ved foden af stigen.

## Leveldata

Level editoren og spillet arbejder på samme Tiled JSON-format.

Obligatoriske layers:

- `windows`
- `spawns`
- `zones`

Obligatoriske spawns:

- `player`
- `van`
- `cleaning-kit`
- `ronny`
- `ladder-roof`

Obligatoriske zones:

- `player-lane`
- `van-ladder-pickup`
- `ladder-wall`

## Definition Of Done

En gameplay-ændring er ikke færdig før:

- Reglen er beskrevet her eller i `gameRules.ts`.
- Eventuelle leveldata er flyttet til Tiled-mapfilen.
- `npm run build` er grøn.
- Relevant Playwright-test er grøn i `/?test=1`.
- Normal mode ændrer ikke timing eller gameplay uden at det er bevidst.
