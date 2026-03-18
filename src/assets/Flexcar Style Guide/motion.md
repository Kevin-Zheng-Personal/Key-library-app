# Motion & Transitions

## Overview

Flexcar uses purposeful motion to communicate state changes and create a responsive feel. Durations and easing curves are defined as Tailwind extensions and in CSS vendor files. The system balances snappy interactions (100-200ms) with smoother reveals (300-500ms).

## Duration Scale

| Token                    | Value    | Tailwind           | Usage                                |
|--------------------------|----------|--------------------|--------------------------------------|
| `--fc-duration-instant`  | `0ms`    | `duration-0`       | No transition (immediate)            |
| `--fc-duration-fast`     | `100ms`  | `duration-100`     | Micro-interactions, color changes    |
| `--fc-duration-normal`   | `200ms`  | `duration-200`     | **Default**: hover, focus, toggle    |
| `--fc-duration-moderate` | `300ms`  | `duration-300`     | Accordion expand, card enter         |
| `--fc-duration-slow`     | `350ms`  | `duration-350`     | Panel transitions                    |
| `--fc-duration-slower`   | `400ms`  | `duration-400`     | Complex state changes                |
| `--fc-duration-drawer`   | `500ms`  | `duration-500`     | Drawer open/close, overlays          |
| `--fc-duration-gentle`   | `800ms`  | `duration-800`     | Slow reveals, page transitions       |
| `--fc-duration-skeleton` | `2000ms` | `duration-2000`    | Skeleton loading shimmer loop        |

## Easing Curves

| Token              | Value                              | Usage                       |
|--------------------|------------------------------------|-----------------------------|
| `--fc-ease-default`| `cubic-bezier(0.4, 0, 0.2, 1)`    | General transitions         |
| `--fc-ease-in`     | `cubic-bezier(0.4, 0, 1, 1)`      | Elements leaving view       |
| `--fc-ease-out`    | `cubic-bezier(0, 0, 0.2, 1)`      | Elements entering view      |
| `--fc-ease-bounce` | `cubic-bezier(0.56, 0, 0.58, 1)`  | Bouncy micro-animations     |
| `--fc-ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)`  | Drawer/sheet slide          |

## Semantic Motion Aliases

| Alias              | Duration + Easing                          | Usage                    |
|--------------------|--------------------------------------------|--------------------------|
| `--motion-fast`    | 100ms + ease-default                       | Color, opacity shifts    |
| `--motion-normal`  | 200ms + ease-default                       | Default hover/focus      |
| `--motion-slow`    | 350ms + ease-default                       | Panel/accordion          |
| `--motion-drawer`  | 500ms + ease-drawer                        | Drawers, sheets          |
| `--motion-skeleton`| 2000ms + linear                            | Loading shimmer          |

## Named Animations

| Animation Name            | Duration | Easing        | Usage                        |
|---------------------------|----------|---------------|------------------------------|
| `accordion-down`          | 200ms    | ease-out      | Accordion content expand     |
| `accordion-up`            | 200ms    | ease-out      | Accordion content collapse   |
| `skeleton` (shine)        | 2000ms   | linear        | Skeleton loading shimmer     |
| `ellipse-bounce`          | 1400ms   | bounce        | Loading indicator bounce     |
| `rotate-in`               | 1400ms   | bounce        | Text rotation enter          |
| `rotate-out`              | 1400ms   | bounce        | Text rotation exit           |
| `membership-card-enter`   | 300ms    | ease-out      | Membership card fade-in      |
| `membership-card-slide-in`| 1500ms   | custom        | Membership card 3D slide     |
| `membership-logo-reveal`  | 650ms    | ease-out      | Logo scale-up with delay     |

## Vendor Animations

| Source File              | Duration | Easing                    | Usage                   |
|--------------------------|----------|---------------------------|-------------------------|
| `vaul-styles.css`        | 500ms    | `cubic-bezier(0.32,0.72,0,1)` | Drawer slide in/out |
| `react-day-picker.css`   | 100ms    | `cubic-bezier(0.4,0,0.2,1)`   | Calendar hover/focus |

## Usage Rules

1. **Prefer Tailwind transition utilities**: `transition-colors duration-200`, `transition-all duration-300`.
2. **Never hardcode `transition: all 0.3s ease`** — use token-derived values.
3. **Hover/focus states:** 100-200ms with `ease-default`.
4. **Accordion/expand:** 200ms with `ease-out`.
5. **Drawers/sheets:** 500ms with `ease-drawer`.
6. **Loading skeletons:** 2000ms linear infinite.
7. **Respect `prefers-reduced-motion`** — animations should degrade gracefully.

## Files

- Animation keyframes: `tailwind.config.ts` → `keyframes`, `animation`
- Transition durations: `tailwind.config.ts` → `transitionDuration`
- Drawer animations: `app/styles/vaul-styles.css`
- Calendar animations: `app/styles/react-day-picker.css`
- CSS variables: `app/styles/tokens.css`
