# `@suite/ui`

The suite's shared primitives. Eight exports, each one a thing the apps had built separately
and had already let drift.

## Why it exists

Planner and Budget each wrote a `Button`, named their variants differently, and both hardcoded
the ink on a filled paint — `text-white` and `text-[#07130d]`. Measured against presets neither
had considered, that is **2.53:1** and **3.47:1** against a floor of 4.5.

A shared primitive is where `on-accent` gets _enforced_ rather than remembered.

## Consuming it

```jsonc
// package.json — pinned at a tag, like @suite/contracts
"@suite/ui": "git+https://github.com/mr-rogers-neighborhood/suite-start.git#v0.9.0&path:/packages/ui"
```

**Then teach Tailwind to scan it.** Tailwind 4 does not read `node_modules`, so without this
every class in a primitive compiles to nothing — and the symptom is an unstyled button, which
looks like a styling bug and is a build-configuration one. The path is relative to the
stylesheet that declares it:

```css
@source "../../../../node_modules/@suite/ui/dist";
```

React 19 is a peer dependency. Everything else is a CSS variable.

## The rule that makes one component work in four apps

Every colour is `var(--role)` from `@suite/theme`. Never a Tailwind theme name, never a hex.

Three apps extend Tailwind's `@theme` with their own vocabulary (`bg-panel`, `bg-raised`,
`text-faint`) and Start has no Tailwind at all — so anything but a CSS variable would compile in
two apps and silently do nothing in the third.

## What is here

| Export       | What it is                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| `Button`     | `primary · secondary · ghost · danger`, `sm · md`. One background class per variant, never two.        |
| `IconButton` | A glyph with a **required** accessible name.                                                           |
| `Field`      | Label, hint and error wired to the input, so `aria-describedby` and `aria-invalid` cannot be left out. |
| `Modal`      | Focus in, focus back on close, Tab wraps, Escape closes, backdrop is a real button.                    |
| `Toast`      | `role` follows the tone: `alert` for a failure, `status` otherwise.                                    |
| `EmptyState` | The "nothing here yet" panel.                                                                          |
| `Dialog`     | `Modal` plus a title, a body and an action row.                                                        |
| `Launch`     | The no-document-open screen. Everything app-specific is a child.                                       |

Plus `cx` (six lines, so the package has no runtime dependency), and the class vocabulary in
`tokens.ts` — `SURFACE`, `INK_ON`, `EDGE`, `INK`, `FOCUS_RING`, `PRESSABLE`.

## When not to use this

Being honest about the three places an app should keep its own:

- **A richer component wins.** Canvas's toast is a _stack_ with pause-on-hover, remaining-time
  tracking and reduced-motion support. Sharing one notice would be a downgrade, so Canvas keeps
  its own.
- **A stack-aware Escape wins.** Canvas's `Dialog` closes through its global escape layer, so
  Escape closes the topmost thing rather than every open surface. `Modal` here uses a plain
  document listener, which would fire under a menu. Canvas keeps its own until this one grows a
  stack.
- **A mature library wins.** Budget's modal is Radix Dialog, which already does the focus trap
  and ARIA properly. Replacing it with a newer implementation of the same thing is churn with
  negative value.

The test is whether the _job_ is identical, not whether the _shape_ is similar.

## The contrast test

`src/contrast.test.ts` parses the roles out of the class strings, so a component that stops using
a role fails to parse rather than quietly passing, then checks every pairing against every preset
in both modes. It found Solarized dark's `danger` at 4.10:1 as text on its own surface — the role
is both a fill and an ink, and only one of those had been checked.
