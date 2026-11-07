import { networkInterfaces } from "node:os";
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
    /**
     * The address a device would be given.
     *
     * Not the one the listener is bound to. A host on `0.0.0.0` is reachable at one of this
     * machine's interface addresses and only the machine knows which, so reporting the bind
     * address would hand a person a link that works nowhere.
     */
    advertised() {
        if (this.server === null)
            return null;
        const port = this.server.port;
        if (this.scope === "loopback")
            return `ws://127.0.0.1:${port}/sync`;
        // No interface address on a machine that is off the network. Loopback is then a true
        // answer for this machine, and the invitation it produces simply will not travel.
        return `ws://${firstLanAddress() ?? "127.0.0.1"}:${port}/sync`;
    }
    state() {
        const running = this.server !== null;
        return {
            running,
            scope: this.scope,
            address: this.advertised(),
            port: running ? (this.server?.port ?? this.port) : this.port,
            workspaces: running ? this.workspaces() : [],
        };
    }
    workspaces() {
        return this.registry.list().map((room) => ({
            workspaceId: room.workspaceId,
            frames: room.log.length,
            newestEpoch: room.log.newestEpoch,
            members: [...room.keys.entries()]
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([deviceId, key]) => ({
                deviceId,
                name: key.name,
                role: room.roles.roles[deviceId] ?? null,
            })),
        }));
    }
}
/** The first address another machine on this network could reach, if there is one. */
function firstLanAddress() {
    for (const entries of Object.values(networkInterfaces())) {
        for (const entry of entries ?? []) {
            if (entry.family === "IPv4" && !entry.internal)
                return entry.address;
        }
    }
    return null;
}
/** The id a device id must equal, given the key it presented. */
export { deviceIdFromPublicKey };
//# sourceMappingURL=host.js.map