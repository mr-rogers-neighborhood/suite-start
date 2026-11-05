import type { SuiteAppEntry } from "@suite/contracts";
import { describe, expect, it } from "vitest";
import {
  type DocumentsFolder,
  INDEX_LIMIT,
  type IndexFileSystem,
  indexDocuments,
  isInsideDocuments,
} from "./fileIndex.js";

const CANVAS: SuiteAppEntry = {
  id: "canvas",
  name: "Canvas",
  folder: "Canvas",
  extension: "canvas",
};
const BUDGET: SuiteAppEntry = {
  id: "budget",
  name: "Budget",
  folder: "Budget",
  extension: "budget",
};

function folders(): readonly DocumentsFolder[] {
  return [
    { app: CANVAS, path: "/home/me/Documents/Suite/Canvas" },
    { app: BUDGET, path: "/home/me/Documents/Suite/Budget" },
  ];
}

function fileSystem(
  listing: Readonly<Record<string, readonly string[]>>,
  times: Readonly<Record<string, number>> = {},
): IndexFileSystem {
  return {
    async listFiles(path) {
      const names = listing[path];
      if (names === undefined) throw new Error(`no folder ${path}`);
      return names;
    },
    async modifiedAt(path) {
      return times[path] ?? 0;
    },
  };
}

describe("indexDocuments", () => {
  it("lists a file under the app that claims its extension", async () => {
    const files = await indexDocuments(
      folders(),
      fileSystem({
        "/home/me/Documents/Suite/Canvas": ["Research.canvas", "notes.txt"],
        "/home/me/Documents/Suite/Budget": ["Q4.budget"],
      }),
      new Set(["canvas"]),
    );

    expect(files.map((file) => file.name)).toEqual(["Research.canvas", "Q4.budget"]);
    expect(files[0]).toMatchObject({ appId: "canvas", appName: "Canvas", installed: true });
    // The budget app is not installed, and the row says so instead of vanishing.
    expect(files[1]).toMatchObject({ appId: "budget", installed: false });
  });

  it("sorts newest first", async () => {
    const files = await indexDocuments(
      folders(),
      fileSystem(
        { "/home/me/Documents/Suite/Canvas": ["Old.canvas", "New.canvas"] },
        {
          "/home/me/Documents/Suite/Canvas/Old.canvas": 1_000,
          "/home/me/Documents/Suite/Canvas/New.canvas": 2_000,
        },
      ),
      new Set(["canvas"]),
    );
    expect(files.map((file) => file.name)).toEqual(["New.canvas", "Old.canvas"]);
  });

  it("skips a folder that does not exist yet", async () => {
    const files = await indexDocuments(
      folders(),
      fileSystem({ "/home/me/Documents/Suite/Canvas": ["Research.canvas"] }),
      new Set(["canvas"]),
    );
    expect(files).toHaveLength(1);
  });

  it("skips a file that vanished between the listing and the stat", async () => {
    const flaky: IndexFileSystem = {
      async listFiles() {
        return ["Gone.canvas"];
      },
      async modifiedAt() {
        throw new Error("ENOENT");
      },
    };
    expect(await indexDocuments(folders(), flaky, new Set(["canvas"]))).toEqual([]);
  });

  it("caps the list rather than rendering an unbounded number of rows", async () => {
    const names = Array.from({ length: INDEX_LIMIT + 10 }, (_value, index) => `${index}.canvas`);
    const files = await indexDocuments(
      [{ app: CANVAS, path: "/box" }],
      fileSystem({ "/box": names }),
      new Set(["canvas"]),
    );
    expect(files).toHaveLength(INDEX_LIMIT);
  });
});

describe("isInsideDocuments", () => {
  const roots = ["/home/me/Documents/Suite/Canvas", "/home/me/Documents/Suite/Budget/"];

  it("accepts a path under an indexed folder", () => {
    expect(isInsideDocuments("/home/me/Documents/Suite/Canvas/Research.canvas", roots)).toBe(true);
    expect(isInsideDocuments("/home/me/Documents/Suite/Budget/Q4.budget", roots)).toBe(true);
  });

  it("refuses a path outside them, a climb out, and a relative path", () => {
    expect(isInsideDocuments("/home/me/.ssh/id_rsa", roots)).toBe(false);
    expect(isInsideDocuments("/home/me/Documents/Suite/Canvas/../Budget/x.canvas", roots)).toBe(
      false,
    );
    expect(isInsideDocuments("Research.canvas", roots)).toBe(false);
    expect(isInsideDocuments("/home/me/Documents/Suite/CanvasExtra/x.canvas", roots)).toBe(false);
  });

  it("reads a Windows path with either separator", () => {
    const windows = ["C:\\Users\\me\\Documents\\Suite\\Canvas"];
    expect(isInsideDocuments("C:\\Users\\me\\Documents\\Suite\\Canvas\\a.canvas", windows)).toBe(
      true,
    );
    expect(
      isInsideDocuments("C:\\Users\\me\\Documents\\Suite\\Canvas\\..\\b.canvas", windows),
    ).toBe(false);
  });
});
