#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { launchPlan } from "./launch.js";
import { defaultRoots, nodeRegistryFileSystem } from "./nodeFileSystem.js";
import { discoverApps, type InstallRecord } from "./registry.js";
import { describeRouteRejection, routeLaunch, spawnCommand } from "./route.js";

/**
 * The launcher, as a command.
 *
 * This is the same core the desktop shell calls: discovery over the install
 * roots, then one routed launch. It exists so the rules can be exercised
 * without a window, and so a headless machine or a test can answer "what would
 * Start do with this argument?".
 */

const REGISTRY_FILENAME = "installs.json";
const USAGE = `suite-start — Suite's launcher

  suite-start list                 installed apps and anything refused
  suite-start open <target>        open a file path or a suite:// link
  suite-start open --dry-run <t>   print the command instead of running it
`;

function registryPath(): string {
  return process.env.SUITE_START_REGISTRY ?? join(homedir(), ".config", "suite", REGISTRY_FILENAME);
}

const ABSOLUTE_PATH = /^(?:\/|[A-Za-z]:[\\/])/u;

function readRecords(value: unknown): readonly InstallRecord[] {
  if (typeof value !== "object" || value === null) return [];
  const apps: unknown = (value as { apps?: unknown }).apps;
  if (!Array.isArray(apps)) return [];

  return apps.flatMap((entry): InstallRecord[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const id: unknown = (entry as { id?: unknown }).id;
    const executable: unknown = (entry as { executable?: unknown }).executable;
    const installedAt: unknown = (entry as { installedAt?: unknown }).installedAt;
    if (typeof id !== "string" || typeof executable !== "string") return [];
    if (!ABSOLUTE_PATH.test(executable)) return [];
    return [
      {
        id,
        executable,
        ...(typeof installedAt === "string" ? { installedAt } : {}),
      },
    ];
  });
}

async function loadRecords(): Promise<readonly InstallRecord[]> {
  try {
    return readRecords(JSON.parse(await readFile(registryPath(), "utf8")));
  } catch {
    // No registry yet, or one that does not parse: the launcher reports an empty
    // install rather than refusing to start.
    return [];
  }
}

async function main(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv;
  if (command === undefined || command === "--help" || command === "-h") {
    process.stdout.write(USAGE);
    return 0;
  }

  const discovery = await discoverApps({
    roots: defaultRoots(homedir(), process.platform),
    records: await loadRecords(),
    fileSystem: nodeRegistryFileSystem(),
  });

  if (command === "list") {
    if (discovery.apps.length === 0) process.stdout.write("No Suite apps installed.\n");
    for (const app of discovery.apps) {
      process.stdout.write(`${app.manifest.id}\t${app.manifest.version}\t${app.executable}\n`);
    }
    for (const entry of discovery.rejected) {
      process.stdout.write(`refused\t${entry.path}\t${entry.reason}\n`);
    }
    return 0;
  }

  if (command === "open") {
    const dryRun = rest.includes("--dry-run");
    const target = rest.find((argument) => argument !== "--dry-run");
    if (target === undefined) {
      process.stderr.write("open needs a path or a suite:// link\n");
      return 2;
    }

    const routed = routeLaunch(target, discovery.apps);
    if (!routed.ok) {
      process.stderr.write(`${describeRouteRejection(routed.reason)}\n`);
      return 2;
    }

    const { command: executable, args } = spawnCommand(routed.plan);
    if (dryRun) {
      process.stdout.write(`${[executable, ...args].join(" ")}\n`);
      return 0;
    }

    launchPlan(routed.plan);
    return 0;
  }

  process.stderr.write(`unknown command: ${command}\n${USAGE}`);
  return 2;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  },
);
