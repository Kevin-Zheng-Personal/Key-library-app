# Color

## Overview

Flexcar uses a structured color palette built around neutrals and a blue-purple brand family. Colors are defined as primitives in `@/theme/colors.ts` and exposed as Tailwind utilities via the `flexcar-{name}` prefix.

## Palette

### Neutrals

| Token              | Hex       | Usage                              |
|--------------------|-----------|-------------------------------------|
| `neutral-0`        | `#000000` | True black, rare use               |
| `neutral-1`        | `#0B0C0E` | Primary text on light backgrounds  |
| `neutral-5`        | `#0B0E15` | Dark background, icon default      |
| `neutral-10`       | `#22252A` | Default body text, headings        |
| `neutral-20`       | `#2E3238` | Secondary dark surfaces            |
| `neutral-30`       | `#3A3F46` | Active states on dark elements     |
| `neutral-40`       | `#515862` | Strong borders, muted icons        |
| `neutral-50`       | `#737982` | Subdued text, captions, footers    |
| `neutral-60`       | `#9B9FA6` | Tertiary text, dashed link default |
| `neutral-70`       | `#B8BCC2` | Disabled text, muted borders       |
| `neutral-80`       | `#DDDFE4` | Default borders, input borders     |
| `neutral-85`       | `#F3F3F4` | Tertiary backgrounds               |
| `neutral-90`       | `#F4F5F6` | Secondary backgrounds, muted fills |
| `neutral-95`       | `#F9FAFA` | Sunken surfaces                    |
| `neutral-100`      | `#FFFFFF` | Primary background, inverse text   |

### Blues (Brand)

| Token       | Hex       | Usage                                  |
|-------------|-----------|----------------------------------------|
| `blue-10`   | `#0D0033` | Deepest brand, dark surfaces           |
| `blue-20`   | `#1A0066` | Active link state, deep accents        |
| `blue-30`   | `#2A00A5` | **Primary brand**: links, focus rings  |
| `blue-40`   | `#3A00E5` | Hover state for brand elements         |
| `blue-50`   | `#4249FF` | Bright accent                          |
| `blue-60`   | `#5C6CFF` | Light accent highlights                |
| `blue-70`   | `#8A95FF` | Soft accent                            |
| `blue-80`   | `#EBEFFF` | Brand-tinted background                |
| `blue-90`   | `#F6F9FE` | Lightest brand background              |

### Semantic Colors

| Token        | Hex       | Role       | Usage                        |
|--------------|-----------|------------|-------------------------------|
| `red-40`     | `#AB173B` | Error dark | Destructive dark-mode/active  |
| `red-50`     | `#E43660` | Error      | Error text, destructive       |
| `red-70`     | `#F8CED8` | Error bg   | Error badge background        |
| `red-80`     | `#FCE8F0` | Error bg   | Error banner background       |
| `green-30`   | `#197355` | Success dk | Success text                  |
| `green-40`   | `#24A87C` | Success    | Success border, icons         |
| `green-80`   | `#E7F8F3` | Success bg | Success banner background     |
| `yellow-40`  | `#C5B207` | Warning    | Warning text                  |
| `yellow-80`  | `#FCF7DE` | Warning bg | Warning banner background     |
| `aqua-40`    | `#25BCB6` | Accent     | Logo, EV badges               |

## Usage Rules

1. **Never use raw hex values in components.** Use Tailwind color utilities (`text-flexcar-neutral10`, `bg-flexcar-blue30`) or CSS variables from `tokens.css`.
2. **Text on light backgrounds:** Use `neutral-10` for body, `neutral-50` for secondary/caption text.
3. **Links:** Default `blue-30`, hover `blue-40`, active `blue-20`.
4. **Borders:** Default `neutral-80`. Brand borders use `blue-30`.
5. **Error/Success/Warning:** Always pair semantic text with its matching subtle background (e.g., `red-50` text on `red-80` background).

## Semantic Token Reference

See `tokens.css` Layer 2 for the full map of `--color-text-*`, `--color-bg-*`, `--color-border-*`, `--color-link-*`, and `--color-interactive-*` aliases.

## Files

- Primitive definitions: `@/theme/colors.ts`
- CSS variables: `app/styles/tokens.css`
- Tailwind integration: `tailwind.config.ts` (extends `colors` with `flexcar-*` prefix)
- shadcn/ui variables: `app/styles/tailwind.css` (`:root` block)
