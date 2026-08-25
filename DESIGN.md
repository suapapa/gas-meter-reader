---
name: MQVision
description: Utility gas-meter monitoring dashboard - precision dials, calibrated dual theme, quiet teal patina status
colors:
  light:
    bg: "#f7fbfa"
    surface: "#ffffff"
    fg: "#141b24"
    muted: "#454e58"
    border: "#d7e0de"
    primary: "#158374"
    accent: "#158374"
    accent-soft: "#daf6ef"
    danger: "#c53637"
    chart: "#037465"
  dark:
    bg: "#0e1318"
    surface: "#141c23"
    fg: "#f1f5f9"
    muted: "#94a3b8"
    border: "#263542"
    primary: "#2dd4bf"
    accent: "#2dd4bf"
    accent-soft: "#133835"
    danger: "#f87171"
    chart: "#2dd4bf"
typography:
  display:
    fontFamily: "Fira Code, ui-monospace, monospace"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Fira Sans, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Fira Sans, IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "Fira Code, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
---

## Overview

**North star:** Precision IoT telemetry station - calibrated gas meter dials, verified camera proof, and interactive historical trends with dual light/dark theme support.

MQVision is a specialized IoT monitoring dashboard: glance at the real-time gas meter digits, inspect camera proof in high resolution, and analyze consumption trends. Design is **restrained**: calibrated surfaces, dual light/dark modes, one teal accent for live and healthy states, danger red only for faults. Density and tabular numbers beat decoration.

Canonical tokens live as OKLCH CSS variables in `web/src/index.css`.

## Colors

| Role | OKLCH (Canonical Light) | OKLCH (Canonical Dark) | Use |
|------|-------------------------|------------------------|-----|
| bg | `oklch(0.985 0.005 180)` | `oklch(0.14 0.015 240)` | Page ground |
| surface | `oklch(1 0 0)` | `oklch(0.18 0.02 240)` | Cards, panels, modals |
| fg | `oklch(0.18 0.02 250)` | `oklch(0.95 0.01 240)` | Primary typography |
| muted | `oklch(0.44 0.02 250)` | `oklch(0.68 0.02 240)` | Secondary labels |
| primary / accent | `oklch(0.52 0.11 180)` | `oklch(0.72 0.14 178)` | Brand and healthy indicators |
| danger | `oklch(0.55 0.19 25)` | `oklch(0.68 0.20 25)` | Faults and alerts |
| chart | `oklch(0.48 0.11 180)` | `oklch(0.74 0.14 178)` | Trend line and gradient |

## Typography

- **UI / labels:** Fira Sans with `word-break: keep-all` and `line-break: strict` for Korean readability.
- **Data / times / readings:** Fira Code with `font-variant-numeric: tabular-nums`.
- **Odometer dials:** Mechanical gas meter counter simulation with integer digits and 3-decimal precision drums.

## Components

- **Topbar:** Station logo, live status badges (App / MQTT), sync clock, theme segmented toggle (System / Light / Dark), and tactile refresh button (`R` shortcut).
- **Latest Reading Card:** Gas meter digit drums, 직전 검침 대비 증감량 (delta), one-click clean copy with check feedback, and 4-tile metadata grid.
- **Camera Frame Card:** Verification viewfinder with status badge, hover inspection cue, lightbox modal with zoom, and JPEG download.
- **History Trend Section:** Range filter (24h / 3d / 7d / all), 4-metric summary ribbon (consumption, daily rate, min/max), Recharts AreaChart with custom gradient, and foldable CSV-exportable data table.
