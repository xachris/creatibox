# Horse Brown V1 source asset

`horse-brown-v1-generated-master.png` is the approved generated master for the first Oblique runtime participant asset.

The master is arranged as four directional rows and five animation columns:

| Row | Direction |
| --- | --- |
| 0 | front-right |
| 1 | right |
| 2 | back-right |
| 3 | back |

| Column | Animation frame |
| --- | --- |
| 0 | idle |
| 1–4 | run loop |

The runtime atlas under `public/assets/participants/horse/` normalizes this source into fixed 320 × 320 cells. Runtime code should use the JSON frame map rather than depending on the generated master's uneven spacing.

Generation mode: built-in ImageGen with the original CreatiBox participant concept sheet as a style reference. No source pixels were cropped from the concept sheet.
