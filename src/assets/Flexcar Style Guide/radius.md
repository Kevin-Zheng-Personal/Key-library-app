# Border Radius

## Overview

Flexcar uses a consistent set of border radius values to create visual hierarchy. Larger radii are used for prominent containers (cards, dialogs); smaller radii for interactive elements (inputs, buttons).

## Scale

| Token             | Value    | Tailwind        | Usage                            |
|-------------------|----------|-----------------|----------------------------------|
| `--fc-radius-none`| `0px`    | `rounded-none`  | Sharp corners                    |
| `--fc-radius-sm`  | `4px`    | `rounded-sm`    | Tags, small badges               |
| `--fc-radius-md`  | `6px`    | `rounded-md`    | Inputs, dropdowns                |
| `--fc-radius-lg`  | `8px`    | `rounded-lg`    | **Default**: buttons, inputs     |
| `--fc-radius-xl`  | `12px`   | `rounded-xl`    | Cards, panels                    |
| `--fc-radius-2xl` | `16px`   | `rounded-2xl`   | Dialogs, drawers                 |
| `--fc-radius-3xl` | `24px`   | `rounded-3xl`   | Large marketing sections         |
| `--fc-radius-full`| `9999px` | `rounded-full`  | Avatars, pills, circular badges  |

## Semantic Aliases

| Alias             | Maps To        | Usage                |
|-------------------|----------------|----------------------|
| `--radius-button` | `radius-lg`    | All button variants  |
| `--radius-card`   | `radius-xl`    | Cards and panels     |
| `--radius-input`  | `radius-lg`    | Form inputs          |
| `--radius-dialog` | `radius-2xl`   | Modals and dialogs   |
| `--radius-badge`  | `radius-full`  | Badges and pills     |

## shadcn/ui Radius

The shadcn/ui layer uses `--radius: 0.5rem` (8px) with derivations:
- `rounded-lg` = `var(--radius)` = 8px
- `rounded-md` = `calc(var(--radius) - 2px)` = 6px
- `rounded-sm` = `calc(var(--radius) - 4px)` = 4px

## Usage Rules

1. **Use Tailwind rounded utilities** — never hardcode pixel border-radius values.
2. **Buttons and inputs:** `rounded-lg` (8px).
3. **Cards:** `rounded-xl` (12px).
4. **Dialogs/Drawers:** `rounded-2xl` (16px).
5. **Pills/Badges:** `rounded-full`.

## Files

- CSS variables: `app/styles/tokens.css`
- shadcn/ui radius: `tailwind.config.ts` → `borderRadius` extension
