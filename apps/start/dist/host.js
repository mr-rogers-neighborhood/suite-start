import { join } from "node:path";
import { createSyncServer, deviceIdFromPublicKey, ed25519Verifier, FileHostStore, HostRegistry, } from "@suite/host";
const DEFAULT_PORT = 8787;
export class StartHost {
    server = null;
    scope;
    registry = new HostRegistry();
    dataDir;
    port;
    now;
    constructor(options) {
        this.dataDir = join(options.dataDir, "sync");
        this.port = options.port ?? DEFAULT_PORT;
        this.scope = options.scope ?? "loopback";
        this.now = options.now ?? (() => new Date());
    }
    async start() {
        if (this.server !== null)
            return this.state();
        this.server = await createSyncServer({
            registry: this.registry,
            host: this.scope === "network" ? "0.0.0.0" : "127.0.0.1",
            port: this.port,
            store: new FileHostStore(this.dataDir),
            verifyFrame: ed25519Verifier,
            verifyRole: ed25519Verifier,
            now: this.now,
        });
        return this.state();
    }
    async stop() {
        if (this.server !== null) {
            await this.server.close();
            this.server = null;
        }
        return this.state();
    }
    /**
     * Change where the listener is reachable from.
     *
     * A socket cannot be narrowed without being reopened, so this stops and starts: the
     * alternative is a host that claims to be loopback while still answering the network.
     */
    async setScope(scope) {
        if (scope === this.scope)
            return this.state();
        const wasRunning = this.server !== null;
        await this.stop();
        this.scope = scope;
        return wasRunning ? this.start() : this.state();
    }
    state() {
        const running = this.server !== null;
        return {
            running,
            scope: this.scope,
            address: running ? (this.server?.url ?? null) : null,
            port: running ? (this.server?.port ?? this.port) : this.port,
            workspaces: running ? this.workspaces() : [],
        };
    }
    workspaces() {
        return this.registry.list().map((room) => ({
            workspaceId: room.workspaceId,
            frames: room.log.length,
            newestEpoch: room.log.newestEpoch,
            members: [...room.keys.keys()]
                .sort()
                .map((deviceId) => ({ deviceId, role: room.roles.roles[deviceId] ?? null })),
        }));
    }
}
/** The id a device id must equal, given the key it presented. */
export { deviceIdFromPublicKey };
//# sourceMappingURL=host.js.map