import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast } from "./Toast.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Toast", () => {
  it("renders nothing without a notice", () => {
    render(<Toast notice={null} onDismiss={() => {}} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("announces a success politely", () => {
    render(<Toast notice={{ message: "Saved" }} onDismiss={() => {}} />);
    // `status` is announced when the reader pauses; it does not interrupt.
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("announces a failure as an alert", () => {
    render(<Toast notice={{ message: "Could not save", tone: "error" }} onDismiss={() => {}} />);
    // `alert` interrupts, which is right for a failure and wrong for anything else. Getting
    // this pair the wrong way round is how a success message becomes an interruption.
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
  });

  it("dismisses itself after its duration", () => {
    const onDismiss = vi.fn();
    render(<Toast notice={{ message: "Saved" }} onDismiss={onDismiss} duration={1000} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("stays put when its duration is zero", () => {
    const onDismiss = vi.fn();
    render(<Toast notice={{ message: "Could not save" }} onDismiss={onDismiss} duration={0} />);
    act(() => vi.advanceTimersByTime(60_000));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("can be dismissed by hand", () => {
    const onDismiss = vi.fn();
    render(<Toast notice={{ message: "Saved" }} onDismiss={onDismiss} duration={0} />);
    act(() => screen.getByRole("button", { name: "Dismiss" }).click());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
