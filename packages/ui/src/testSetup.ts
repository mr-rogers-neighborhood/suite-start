/**
 * What every component test needs.
 *
 * `jest-dom` adds the assertions worth having here — `toBeInTheDocument`, `toHaveFocus`,
 * `toHaveAccessibleDescription` — and the last of those is the one that makes the ARIA wiring
 * testable rather than merely present. React 19 also wants the environment to say it is a test
 * environment, and Testing Library wants the DOM cleaned between tests. All of it in one place,
 * so a new test file does not have to remember any of it.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => cleanup());
