/**
 * Solarized, by Ethan Schoonover.
 *
 * The base tones are the canonical ones — base03 to base3 — and the hues are the canonical
 * accents, darkened in light mode and lifted in dark mode just enough to clear the contrast
 * floors this package enforces. That adjustment is the one place this is not Solarized
 * exactly: base00 on base3 is 4.13:1, and base01 is 4.99, so the body ink is base01 and the
 * muted ink is a shade darker than base00. Solarized is a deliberately low-contrast palette;
 * a faithful copy of it fails WCAG AA for body text.
 *
 * Light and dark are the two official variants, not a light mode invented for this app.
 */
export const solarized = {
    format: "suite.theme",
    contractVersion: 1,
    id: "solarized",
    name: "Solarized",
    description: "Schoonover's warm, low-glare palette, in its two official variants.",
    light: {
        canvas: "#f2ecda",
        surface: "#fdf6e3",
        "surface-sunk": "#eee7d3",
        "surface-strong": "#fdf6e3",
        accent: "#1a6ea8",
        "accent-strong": "#155a8a",
        danger: "#bd2a27",
        success: "#5c6b00",
        warning: "#8a6700",
        ink: "#4a5f66",
        "ink-muted": "#556a71",
        "ink-faint": "#7b8b90",
        hairline: "#ded6bd",
        "border-strong": "#828282",
        focus: "#1a6ea8",
        "on-accent": "#fdf6e3",
        "on-danger": "#fdf6e3",
        "on-success": "#fdf6e3",
        "on-warning": "#fdf6e3",
        "hue-slate": "#5a6b80",
        "hue-blue": "#1a6ea8",
        "hue-green": "#5c6b00",
        "hue-amber": "#8a6700",
        "hue-rose": "#b02a5a",
        "hue-violet": "#5a5fa8",
        "chart-1": "#1a6ea8",
        "chart-2": "#5c6b00",
        "chart-3": "#8a6700",
        "chart-4": "#5a5fa8",
        "chart-5": "#b02a5a",
    },
    dark: {
        canvas: "#002b36",
        surface: "#073642",
        "surface-sunk": "#00252e",
        "surface-strong": "#0a3944",
        accent: "#4aa8e0",
        "accent-strong": "#6fbceb",
        danger: "#e8695f",
        success: "#9fb800",
        warning: "#d4ac2c",
        ink: "#a3b1b1",
        "ink-muted": "#8fa0a2",
        "ink-faint": "#6f8286",
        hairline: "#1b4a56",
        "border-strong": "#7d7d7d",
        focus: "#4aa8e0",
        "on-accent": "#002b36",
        "on-danger": "#002b36",
        "on-success": "#002b36",
        "on-warning": "#002b36",
        "hue-slate": "#7d8f9c",
        "hue-blue": "#4aa8e0",
        "hue-green": "#9fb800",
        "hue-amber": "#d4ac2c",
        "hue-rose": "#e05a8a",
        "hue-violet": "#8f94d6",
        "chart-1": "#4aa8e0",
        "chart-2": "#9fb800",
        "chart-3": "#d4ac2c",
        "chart-4": "#8f94d6",
        "chart-5": "#e05a8a",
    },
};
//# sourceMappingURL=solarized.js.map