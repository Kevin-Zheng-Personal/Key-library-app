# Elevation & Shadows

## Overview

Flexcar uses a layered shadow system to communicate depth and hierarchy. Shadows use a combination of blue-tinted and neutral spreads to match the brand. Shadows are defined in `tailwind.config.ts` via the `boxShadows` object and exposed as `shadow-{name}` Tailwind utilities.

## Scale

| Token               | Tailwind Class         | Usage                                    |
|---------------------|------------------------|------------------------------------------|
| `--fc-shadow-input` | `shadow-inputShadow`   | Input fields                             |
| `--fc-shadow-button`| `shadow-buttonShadow`  | Elevated buttons                         |
| `--fc-shadow-0`     | `shadow-shadow0`       | Subtle border-like shadow                |
| `--fc-shadow-2`     | `shadow-shadow2`       | Light lift (cards at rest)               |
| `--fc-shadow-10`    | `shadow-shadow10`      | Moderate elevation (hovered cards)       |
| `--fc-shadow-20`    | `shadow-shadow20`      | Strong elevation (floating panels)       |
| `--fc-shadow-25`    | `shadow-shadow25`      | High elevation (sticky bars, popovers)   |
| `--fc-shadow-30`    | `shadow-shadow30`      | Maximum elevation (modals, drawers)      |
| `--fc-shadow-selected` | `shadow-boxSelected`| Selected state (radio cards, plan tiles) |
| `--fc-shadow-pill`  | `shadow-pillShadow`    | Floating pills                           |
| `--fc-shadow-sticky-bar` | `shadow-stickyBarShadow` | Sticky bottom bar (PDP)         |
| `--fc-shadow-modal-footer` | `shadow-modalFooterShadow` | Modal/drawer footer          |

## Semantic Aliases

| Alias                  | Maps To             | Usage                  |
|------------------------|---------------------|------------------------|
| `--elevation-none`     | `none`              | Flat / no shadow       |
| `--elevation-xs`       | `shadow-0`          | Subtle definition      |
| `--elevation-sm`       | `shadow-2`          | Resting cards          |
| `--elevation-md`       | `shadow-10`         | Hovered cards          |
| `--elevation-lg`       | `shadow-20`         | Floating panels        |
| `--elevation-xl`       | `shadow-25`         | Popovers, sticky bars  |
| `--elevation-2xl`      | `shadow-30`         | Modals, drawers        |
| `--elevation-input`    | `shadow-input`      | Form inputs            |
| `--elevation-button`   | `shadow-button`     | Buttons                |
| `--elevation-selected` | `shadow-selected`   | Selected state         |
| `--elevation-sticky`   | `shadow-sticky-bar` | Sticky navigation      |

## Usage Rules

1. **Use Tailwind shadow utilities** (`shadow-shadow10`, etc.) — never write raw box-shadow values.
2. **Cards at rest:** `shadow-2` (light lift).
3. **Cards on hover:** Transition to `shadow-10` or `shadow-20`.
4. **Modals/Drawers:** `shadow-30`.
5. **Selected interactive elements:** `shadow-boxSelected`.
6. **Sticky bars:** `shadow-stickyBarShadow`.

## Files

- Shadow definitions: `tailwind.config.ts` → `boxShadows` object
- Alpha color helpers: `@/theme/colors.ts` → `colorsAlpha`
- CSS variables: `app/styles/tokens.css`
