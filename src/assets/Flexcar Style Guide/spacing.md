# Spacing

## Overview

Flexcar follows an **8-point grid** system. All spacing values are multiples of 4px, with a preference for 8px increments. Spacing is applied via Tailwind utility classes (`p-4`, `gap-6`, `m-8`, etc.) which map to `0.25rem` increments.

## Scale

| Token          | Value  | Tailwind | Common Usage                        |
|----------------|--------|----------|--------------------------------------|
| `space-0`      | `0px`  | `0`      | No spacing                           |
| `space-0.5`    | `2px`  | `0.5`    | Hairline gaps, icon offsets          |
| `space-1`      | `4px`  | `1`      | Tight internal padding               |
| `space-1.5`    | `6px`  | `1.5`    | Small insets                         |
| `space-2`      | `8px`  | `2`      | Default component gap, small padding |
| `space-3`      | `12px` | `3`      | Medium internal spacing              |
| `space-4`      | `16px` | `4`      | **Standard padding**, card padding   |
| `space-5`      | `20px` | `5`      | Medium gaps                          |
| `space-6`      | `24px` | `6`      | Section padding, large gaps          |
| `space-8`      | `32px` | `8`      | Major section gaps                   |
| `space-10`     | `40px` | `10`     | Large section dividers               |
| `space-12`     | `48px` | `12`     | Extra-large spacing                  |
| `space-16`     | `64px` | `16`     | Page-level vertical spacing          |
| `space-20`     | `80px` | `20`     | Section spacing (desktop)            |
| `space-24`     | `96px` | `24`     | Hero/major section margins           |
| `space-32`     | `128px`| `32`     | Maximum page spacing                 |

## Semantic Spacing Aliases

| Alias              | Maps To      | Usage                           |
|--------------------|--------------|---------------------------------|
| `--space-xs`       | `space-1`    | Tight internal gaps (4px)       |
| `--space-sm`       | `space-2`    | Small gaps, icon-to-text (8px)  |
| `--space-md`       | `space-4`    | Default padding (16px)          |
| `--space-lg`       | `space-6`    | Section-level spacing (24px)    |
| `--space-xl`       | `space-8`    | Major section gaps (32px)       |
| `--space-2xl`      | `space-12`   | Large blocks (48px)             |
| `--space-3xl`      | `space-16`   | Page-level spacing (64px)       |
| `--space-section`  | `space-20`   | Section dividers (80px)         |

## Usage Rules

1. **Use Tailwind spacing utilities** (`p-4`, `m-2`, `gap-3`) — never write raw pixel values.
2. **Component internal padding:** default to `space-4` (16px).
3. **Gap between elements in a flex/grid layout:** default to `space-2` (8px) or `space-3` (12px).
4. **Section vertical spacing:** use `space-8` to `space-16` depending on density.
5. **Responsive adjustments:** Mobile tends to use one step smaller than desktop.

## Files

- CSS variables: `app/styles/tokens.css`
- Tailwind uses its default spacing scale (0.25rem = 4px per unit)
