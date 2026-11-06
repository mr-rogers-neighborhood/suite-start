import { join } from "node:path";
import {
  createSyncServer,
  deviceIdFromPublicKey,
  ed25519Verifier,
  FileHostStore,
  HostRegistry,
  type SyncServer,
} from "@suite/host";

/**
 * The sync host, as Start runs it.
 *
 * One listener per machine, loopback unless somebody says otherwise, with its store under
 * the app's own data directory. Start does not join a group and holds no member key: it is
 * the mailbox, and a mailbox that could read the letters would not be one.
 */

/** Where the listener may be reached from. */
export type HostScope = "loopback" | "network";

export interface HostMember {
  readonly deviceId: string;
  /** What the device called itself. A fingerprint is not something a person can weigh. */
  readonly name: string;
  readonly role: "owner" | "editor" | "viewer" | null;
}

export interface HostWorkspace {
  readonly workspaceId: string;
  readonly frames: number;
  readonly newestEpoch: number | null;
  readonly members: readonly HostMember[];
}

export interface HostState {
  readonly running: boolean;
  readonly scope: HostScope;
  /** The address a device would be given, or null while stopped. */
  readonly address: string | null;
  readonly port: number;
  readonly workspaces: readonly HostWorkspace[];
}

export interface StartHostOptions {
  /** Where frames, roles and pinned keys live. */
  readonly dataDir: string;
  readonly port?: number;
  readonly scope?: HostScope;
  readonly now?: () => Date;
}

const DEFAULT_PORT = 8787;

export class StartHost {
  private server: SyncServer | null = null;
  private scope: HostScope;
  private readonly registry = new HostRegistry();
  private readonly dataDir: string;
  private readonly port: number;
  private readonly now: () => Date;

  constructor(options: StartHostOptions) {
    this.dataDir = join(options.dataDir, "sync");
    this.port = options.port ?? DEFAULT_PORT;
    this.scope = options.scope ?? "loopback";
    this.now = options.now ?? (() => new Date());
  }

  async start(): Promise<HostState> {
    if (this.server !== null) return this.state();
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

  async stop(): Promise<HostState> {
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
  async setScope(scope: HostScope): Promise<HostState> {
    if (scope === this.scope) return this.state();
    const wasRunning = this.server !== null;
    await this.stop();
    this.scope = scope;
    return wasRunning ? this.start() : this.state();
  }

  state(): HostState {
    const running = this.server !== null;
    return {
      running,
      scope: this.scope,
      address: running ? (this.server?.url ?? null) : null,
      port: running ? (this.server?.port ?? this.port) : this.port,
      workspaces: running ? this.workspaces() : [],
    };
  }

  private workspaces(): readonly HostWorkspace[] {
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

/** The id a device id must equal, given the key it presented. */
export { deviceIdFromPublicKey };
