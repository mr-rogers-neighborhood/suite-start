import { describe, expect, it } from "vitest";
import { hubReportPath, parseHubState } from "./hub";

const report = {
  format: "suite.hub",
  running: true,
  scope: "network",
  port: 8787,
  address: "ws://192.168.1.9:8787/sync",
  startedAt: "2026-11-06T12:00:00.000Z",
  updatedAt: "2026-11-06T12:05:00.000Z",
};

describe("the hub's report about itself", () => {
  it("parses what the hub writes", () => {
    const parsed = parseHubState(report);
    expect(parsed.ok && parsed.value.address).toBe("ws://192.168.1.9:8787/sync");
  });

  it("reads a stopped hub as a hub with no address, not as a broken file", () => {
    const parsed = parseHubState({ ...report, running: false, address: null, startedAt: null });
    expect(parsed.ok && parsed.value.running).toBe(false);
  });

  it("refuses anything that is not a hub report", () => {
    expect(parseHubState({ format: "something.else" }).ok).toBe(false);
    expect(parseHubState(null).ok).toBe(false);
  });

  it("finds the file in the hub's own data directory, on every platform", () => {
    const linux = hubReportPath({ platform: "linux", home: "/home/me" });
    expect(linux).toBe("/home/me/.local/share/suite/start/hub.json");

    const mac = hubReportPath({ platform: "darwin", home: "/Users/me" });
    expect(mac).toBe("/Users/me/Library/Application Support/Suite Start/hub.json");

    const windows = hubReportPath({ platform: "win32", home: "C:\\Users\\me" });
    expect(windows).toBe("C:\\Users\\me\\AppData\\Roaming\\Suite Start\\hub.json");
  });
});
