import { deviceIdFromPublicKey } from "@suite/host";
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
export declare class StartHost {
    private server;
    private scope;
    private readonly registry;
    private readonly dataDir;
    private readonly port;
    private readonly now;
    constructor(options: StartHostOptions);
    start(): Promise<HostState>;
    stop(): Promise<HostState>;
    /**
     * Change where the listener is reachable from.
     *
     * A socket cannot be narrowed without being reopened, so this stops and starts: the
     * alternative is a host that claims to be loopback while still answering the network.
     */
    setScope(scope: HostScope): Promise<HostState>;
    state(): HostState;
    private workspaces;
}
/** The id a device id must equal, given the key it presented. */
export { deviceIdFromPublicKey };
//# sourceMappingURL=host.d.ts.map