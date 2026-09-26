# Akatsuki: The Shadow Archive

A React 19 + TypeScript landing page built with Vite, Three.js, GSAP, and Lucide React. Fonts and character portraits are bundled locally; there are no runtime API requests.

## Run

From this folder, using a current Node.js LTS release supported by Vite 8:

```sh
npm install
npm run dev -- --host 127.0.0.1
```

```sh
npm run build
npm run preview
```

## Character Chapters

The opening is a character-led Akatsuki assembly, replacing the original shiny cloud. Itachi stands in front of depth-layered Kisame, Konan, the Six Paths of Pain, and masked Obito. The lineup approaches on entrance, responds to pointer perspective, and has accessible member-selection buttons and chapter links. This is a 2.5D composition of transparent artwork in Three.js, not a rigged walking animation. A static cutout lineup remains visible until the first WebGL frame is ready, and is also used if WebGL fails.

Every archived member has a dedicated chapter before the member archive: Itachi, Pain/Nagato, Tobi/Obito, Orochimaru, Konan, Kisame, Deidara, Sasori, Hidan, Kakuzu, Zetsu, and Yahiko. Itachi retains the opening character chapter and exclusive genjutsu capture.

- **Itachi:** a pointer-reactive fractured portrait and two Tsukuyomi modes. Entering the section automatically triggers a 1.6-second capture; clicking **Enter Tsukuyomi** starts a persistent capture with no time limit. Escape and the visible return button always exit immediately, restoring focus and page controls.
- **Pain:** six Rinnegan rings, floating debris, and an Almighty Push action that expands the gravitational field.
- **Obito:** a transparent full-body masked figure replaces the chapter photograph. A subdivided textured plane twists and contracts toward the mask's eye during Kamui; the chapter background never scales or rotates. The alpha channel remains intact throughout, and the figure reforms after the effect. Reduced motion leaves it still.
- **Orochimaru:** an ivory serpent with textured scales, jade surroundings, and a rebirth action that releases a translucent wireframe skin.
- **Konan:** individually folded paper wings that react to the pointer, disperse into sheets, and reassemble around an origami flower.
- **Kisame:** a modeled Samehada with raised scales and wrapped handle, swimming chakra sharks, and a rising Water Prison surface.
- **Deidara:** a winged clay sculpture that breaks into hundreds of fragments and reforms.
- **Sasori:** an articulated marionette connected to chakra strings. Pointer movement controls its joints; the ability calls a surrounding puppet theatre.
- **Hidan:** a three-bladed scythe and a progressively drawn Jashin sigil. The scene is symbolic and non-graphic.
- **Kakuzu:** five stylized chakra-nature masks connected by animated threads. A five-nature selector highlights a mask; the ability separates them.
- **Zetsu:** a black-and-white face enclosed by hinged, toothed plant leaves. Mayfly retracts the figure into the earth.
- **Yahiko:** a rain-country skyline, wind-driven banner, and Water Release surge, inspired by his original Akatsuki leadership.

The shared chapter scenes mount near the viewport and release their canvas contexts when distant, rather than keeping eleven WebGL contexts alive. Visible scenes are capped at 30 fps; paused scenes redraw only for state changes. Each scene cleans up geometry, materials, observers, and listeners on unmount. Reduced-motion preferences and the header motion control disable animated effects. Ambient audio is opt-in. Ability actions reset after 2.4 seconds, subject to normal browser scheduling.

The new models are stylized interpretations of the members' techniques, not licensed production character models. Artwork and models occupy separate areas so the character faces remain unobscured.

## React Structure

- `src/App.tsx`: page composition, header, Itachi, motion/audio state, and genjutsu lifecycle.
- `src/Hero.tsx`, `src/assembly.ts`, and `src/hero.css`: the character-led opening, cutout assembly, and responsive layout.
- `src/MemberArchive.tsx`: searchable member cards and accessible native dossier dialogs.
- `src/CharacterChapter.tsx`: data-driven character chapters and React-managed ability controls.
- `src/abilities.ts`: shared Three.js lifecycle plus the gravity, Kamui, and serpent scenes.
- `src/memberScenes.ts`: the eight additional ability-specific models and their animations.
- `src/memberChapters.ts`: chapter content, navigation order, and verified portrait dimensions.
- `src/members.css`: the eight member themes and responsive portrait/model layouts.
- `src/portrait.ts`: Itachi portrait renderer. The original `src/scene.ts` cloud is retained but is no longer imported or shown.
- `src/members.ts`: twelve member biographies and techniques.

## Browser Tests

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright runs desktop and mobile projects and checks the archive, focus restoration, genjutsu, every chapter, ability resets, real canvas pixels and motion, reduced motion, header controls, image resolution, context recycling, Kakuzu's selector, and responsive layout. A controlled-clock test checks the 2.4-second reset independently of GPU-heavy visual checks. It starts a local Vite server if one is not already running. Full chapter screenshots are written under the ignored `test-results/` folder.

## Artwork

The existing local portraits were visually reviewed and dimension-checked. No artificial upscaling was used. The eight added chapter portraits are 1440 x 1080, except Kisame and Yahiko at 1440 x 1076 and Sasori at 1460 x 1197. Their actual intrinsic dimensions are supplied to the image elements. The new chapter layouts preserve the complete portrait framing with `object-fit: contain`.

The hero and Obito chapter use matching transparent promotional renders from the official [Storm Connections character gallery](https://naruto-game-sc.bn-ent.net/character/). These were downloaded, trimmed only in empty margins, and converted to WebP with alpha preserved; no artificial upscaling or background-removal model was used. Alpha-channel coverage is tested automatically.

| Local Cutout | Native Output | Source |
| --- | --- | --- |
| `public/cutouts/itachi.webp` | 650 x 1142 | [Itachi](https://naruto-game-sc.bn-ent.net/images/character/detail/chara079/ill.png) |
| `public/cutouts/kisame.webp` | 562 x 1125 | [Kisame](https://naruto-game-sc.bn-ent.net/images/character/detail/chara080/ill.png) |
| `public/cutouts/konan.webp` | 445 x 1121 | [Konan](https://naruto-game-sc.bn-ent.net/images/character/detail/chara086/ill.png) |
| `public/cutouts/pain.webp` | 633 x 1057 | [Six Paths of Pain](https://naruto-game-sc.bn-ent.net/images/character/detail/chara085/ill_sp.png) |
| `public/cutouts/tobi.webp` | 592 x 1133 | [Masked Obito](https://naruto-game-sc.bn-ent.net/images/character/detail/chara088/ill.png) |

This is an unofficial fan experiment, not an official Naruto product. Naruto characters and source artwork belong to their respective rights holders. Portraits were sourced from Narutopedia image assets using character metadata from the Dattebayo API. The custom 3D geometry and page layout are original to this experiment. Do not assume that a credit grants permission for commercial reuse; obtain appropriate rights before publishing or redistributing the artwork.

The page contains character-history spoilers. It does not embed or copy the supplied Minato reference video.