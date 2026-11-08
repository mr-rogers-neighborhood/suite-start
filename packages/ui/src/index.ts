/**
 * `@suite/ui` — the primitives the suite shares.
 *
 * Ten exports, chosen because the apps already had most of them separately and had already
 * drifted: two `Button`s with different variants and different hardcoded ink on a themed paint.
 *
 * Every colour is `var(--role)` from `@suite/theme`, never a Tailwind theme name and never a
 * hex. That is what lets one `Button` work in three apps that extend Tailwind differently and
 * in a fourth that has no Tailwind at all.
 *
 * ## Consuming this
 *
 * 1. Add the package at a tag, like `@suite/contracts`.
 * 2. Teach Tailwind to scan it, or every class compiles to nothing:
 *
 *    ```css
 *    @source "../../node_modules/@suite/ui/dist";
 *    ```
 *
 * 3. React 19 is a peer, not a dependency.
 */
export { AppMark, type AppMarkProps, type AppMarkSize } from "./AppMark.js";
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from "./Button.js";
export { type ClassValue, cx } from "./cx.js";
export { Dialog, type DialogProps } from "./Dialog.js";
export { EmptyState, type EmptyStateProps } from "./EmptyState.js";
export { Field, type FieldProps } from "./Field.js";
export { IconButton, type IconButtonProps, type IconButtonSize } from "./IconButton.js";
export { ImportMenu, type ImportMenuProps, type ImportOption } from "./ImportMenu.js";
export {
  Launch,
  type LaunchProps,
  type LaunchRecent,
} from "./Launch.js";
export { Modal, type ModalProps } from "./Modal.js";
export { PRIVACY_SENTENCE, PrivacyLine, type PrivacyLineProps } from "./PrivacyLine.js";
export { Toast, type ToastNotice, type ToastProps } from "./Toast.js";
export { EDGE, FOCUS_RING, INK, INK_ON, PRESSABLE, SURFACE } from "./tokens.js";
