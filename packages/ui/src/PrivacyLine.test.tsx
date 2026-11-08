import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PRIVACY_SENTENCE, PrivacyLine } from "./PrivacyLine.js";

describe("PrivacyLine", () => {
  it("says the one sentence every app shares", () => {
    render(<PrivacyLine />);
    expect(screen.getByText(PRIVACY_SENTENCE)).toBeInTheDocument();
  });

  it("names where the file is, when there is somewhere to name", () => {
    render(<PrivacyLine where="/home/person/Documents/Suite/Budget/x.budget" />);
    expect(screen.getByTitle(/x\.budget/u)).toBeInTheDocument();
  });

  it("can show only the location", () => {
    render(<PrivacyLine where="Local workspace" sentence={false} />);
    expect(screen.queryByText(PRIVACY_SENTENCE)).toBeNull();
    expect(screen.getByText("Local workspace")).toBeInTheDocument();
  });

  it("claims nothing it cannot keep", () => {
    // No "encrypted", no "anonymous", no "private by design": each of those is a claim that
    // needs a caveat, and a caveat is what makes a privacy line read as a defence.
    expect(PRIVACY_SENTENCE).not.toMatch(/encrypt|anonymous|private by design/iu);
  });
});
