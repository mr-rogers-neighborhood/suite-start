import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { StartHost } from "./host.js";

async function folder(): Promise<string> {
  return mkdtemp(join(tmpdir(), "suite-start-host-"));
}

describe("the host Start runs", () => {
  it("is stopped until it is started, and says where it listens", async () => {
    const host = new StartHost({ dataDir: await folder(), port: 0 });
    expect(host.state()).toMatchObject({ running: false, address: null, scope: "loopback" });

    const started = await host.start();
    expect(started.running).toBe(true);
    expect(started.address).toBe(`ws://127.0.0.1:${started.port}/sync`);

    await host.stop();
    expect(host.state().running).toBe(false);
  });

  it("listens on loopback by default", async () => {
    const host = new StartHost({ dataDir: await folder(), port: 0 });
    const started = await host.start();
    expect(started.scope).toBe("loopback");
    expect(started.address).toContain("127.0.0.1");
    await host.stop();
  });

  it("reopens the socket when the scope changes, rather than pretending", async () => {
    const host = new StartHost({ dataDir: await folder(), port: 0 });
    await host.start();

    const widened = await host.setScope("network");
    expect(widened.scope).toBe("network");
    expect(widened.running).toBe(true);
    expect(widened.address).toContain("0.0.0.0");

    const narrowed = await host.setScope("loopback");
    expect(narrowed.address).toContain("127.0.0.1");

    await host.stop();
  });

  it("changes scope without starting a socket that was stopped", async () => {
    const host = new StartHost({ dataDir: await folder(), port: 0 });
    const state = await host.setScope("network");
    expect(state).toMatchObject({ running: false, scope: "network" });
  });

  it("reports no workspaces until one is joined, and holds nothing readable", async () => {
    const dataDir = await folder();
    const host = new StartHost({ dataDir, port: 0 });
    const state = await host.start();
    expect(state.workspaces).toEqual([]);
    await host.stop();
  });
});
