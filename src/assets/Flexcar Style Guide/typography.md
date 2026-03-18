# Typography

## Overview

Flexcar's type system is built on **Inter** (primary body) and **Inter Tight** (display/headings). Typography classes are defined as Tailwind component plugins in `tailwind.config.ts`. Each class bundles font-family, size, weight, line-height, letter-spacing, and default color.

## Font Families

| Token               | Family                          | Usage                      |
|---------------------|---------------------------------|----------------------------|
| `--fc-font-sans`    | Inter, Arial, sans-serif        | Body text, UI elements     |
| `--fc-font-sans-tight` | Inter Tight, Arial, sans-serif | Display, headings, tight layouts |
| `--fc-font-mono`    | IBM Plex Mono, Menlo, ...       | Code, data, monospaced     |

## Type Scale

### Headings (Base styles applied to HTML elements)

| Element | Family     | Size   | Weight | Line Height | Letter Spacing | Color       |
|---------|------------|--------|--------|-------------|----------------|-------------|
| `h1`    | sans       | 28px   | 700    | 40px        | -1px           | neutral-10  |
| `h2`    | sans       | 22px   | 600    | 28px        | -0.22px        | neutral-10  |
| `h3`    | sans       | 18px   | 600    | 24px        | -0.18px        | neutral-10  |

### Display Headings (Component classes)

| Class                        | Family     | Size   | Weight | Line Height |
|------------------------------|------------|--------|--------|-------------|
| `h1.hero-display`            | sans-tight | 48px   | 600    | normal      |
| `h1.header-sans-tight`       | sans-tight | 62px   | 600    | normal      |
| `h2.hero-display`            | sans-tight | 40px   | 600    | 48px        |
| `h3.header-sans-tight`       | sans-tight | 32px   | 600    | normal      |
| `h4.header-sans-tight`       | sans-tight | 22px   | 600    | 32px        |
| `.pdp-header`                | sans-tight | 40px   | 600    | 48px        |
| `.homepage-subhead1`         | sans-tight | 24px   | 350    | 32px        |

### Body Text

| Class             | Size   | Weight | Line Height | Letter Spacing | Color       |
|-------------------|--------|--------|-------------|----------------|-------------|
| `.body`           | 16px   | 400    | 24px        | -0.08px        | neutral-10  |
| `.body-strong`    | 16px   | 600    | 24px        | -0.08px        | neutral-10  |
| `.body-tight`     | 16px   | 400    | 24px        | —              | neutral-10  |
| `.body2`          | 14px   | 400    | 20px        | —              | neutral-10  |
| `.body2-strong`   | 14px   | 600    | 20px        | —              | neutral-10  |
| `.body3`          | 12px   | 400    | 16px        | 0.12px         | neutral-10  |
| `.body3-strong`   | 12px   | 600    | 16px        | 0.12px         | neutral-10  |
| `.body4`          | 10px   | 400    | 20px        | —              | neutral-10  |

### Labels & Captions

| Class              | Size   | Weight | Line Height | Letter Spacing | Color       |
|--------------------|--------|--------|-------------|----------------|-------------|
| `.sub`             | 14px   | 400    | 20px        | —              | neutral-50  |
| `.caption-regular` | 12px   | 700    | 16px        | 0.24px         | neutral-50  |
| `.subhead-tight`   | 18px   | 400    | 24px        | —              | neutral-100 |

### Buttons

| Class             | Family     | Size   | Weight | Line Height |
|-------------------|------------|--------|--------|-------------|
| `.button1`        | sans       | 16px   | 400    | 24px        |
| `.button1-tight`  | sans-tight | 16px   | 400    | 24px        |

### Links

| Class               | Size | Weight | Color    | Hover        | Active     |
|---------------------|------|--------|----------|--------------|------------|
| `.link-body`        | 16px | 600    | blue-30  | blue-30 + underline | — |
| `.link-body2`       | 14px | 600    | blue-30  | blue-30 + underline | — |
| `.link-body3`       | 12px | 500    | neutral-1 | blue-30 + underline | — |
| `.link-nav-light`   | —    | —      | blue-30  | blue-40      | blue-20    |
| `.link-nav-dark`    | —    | —      | white    | neutral-80   | neutral-70 |
| `.link-dashed-body` | 16px | 400    | neutral-50 | neutral-1 + dashed underline | — |
| `.link-dashed-body2`| 14px | 400    | neutral-50 | neutral-1 + dashed underline | — |
| `.link-dashed-body3`| 12px | 500    | neutral-50 | neutral-1 + dashed underline | — |

## Font Weights

| Token                  | Value | Usage                    |
|------------------------|-------|--------------------------|
| `--fc-weight-light`    | 350   | Display subheads         |
| `--fc-weight-regular`  | 400   | Body text, labels        |
| `--fc-weight-medium`   | 500   | Navigation, footer       |
| `--fc-weight-semibold` | 600   | Strong body, headings    |
| `--fc-weight-bold`     | 700   | H1, captions             |

## Usage Rules

1. **Use the predefined typography classes** (`.body`, `.body2`, `.link-body`, etc.) — they bundle all properties together.
2. **Never set raw `font-size` or `font-weight`** in component code. Use a typography class or Tailwind text utility that maps to a token.
3. **Body text default:** `.body` (16px/24px, regular weight, neutral-10).
4. **Secondary info:** `.sub` or `.body2` (14px, neutral-50).
5. **Display headings:** Use `header-sans-tight` or `hero-display` variants for marketing/hero sections.

## Files

- Typography plugins: `tailwind.config.ts` (paragraphPlugin, headerBasePlugin, headerComponentPlugin, linkPlugin)
- Custom fonts: `app/styles/fonts-custom.css`
- CSS variables: `app/styles/tokens.css`
