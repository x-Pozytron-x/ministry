import fs from "fs";
import path from "path";
import { CONFIG } from "./config.js";

function abs(p) {
  return path.join(CONFIG.WORKSPACE, p);
}

// ---------- FILE TOOLS ----------

export function readFile({ path: filePath }) {
  const full = abs(filePath);
  if (!fs.existsSync(full)) {
    return { error: "FILE_NOT_FOUND", path: filePath };
  }
  return fs.readFileSync(full, "utf-8");
}

export function writeFile({ path: filePath, content }) {
  const full = abs(filePath);
  fs.writeFileSync(full, content, "utf-8");
  return { ok: true };
}

// ---------- PATCH TOOL (NEW) ----------
// безопасная замена куска кода
export function applyPatch({ path: filePath, search, replace }) {
  const full = abs(filePath);

  if (!fs.existsSync(full)) {
    return { error: "FILE_NOT_FOUND" };
  }

  let content = fs.readFileSync(full, "utf-8");

  if (!content.includes(search)) {
    return { error: "SEARCH_NOT_FOUND" };
  }

  content = content.replace(search, replace);

  fs.writeFileSync(full, content, "utf-8");

  return { ok: true };
}

// ---------- FILE SYSTEM ----------

export function listFiles({ dir = "." }) {
  const full = abs(dir);
  if (!fs.existsSync(full)) return { error: "DIR_NOT_FOUND" };
  return fs.readdirSync(full);
}

// ---------- SEARCH (simple grep) ----------

export function search({ query }) {
  const root = path.join(CONFIG.WORKSPACE, "src"); // 👈 ЖЁСТКО src

  const results = [];

  function walk(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const full = path.join(dir, item);

      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else {
        const txt = fs.readFileSync(full, "utf-8");
        if (txt.includes(query)) {
          results.push(full.replace(CONFIG.WORKSPACE, ""));
        }
      }
    }
  }

  walk(root);
  return results;
}

export function findFile({ name }) {
  const root = CONFIG.WORKSPACE;
  const results = [];

  function walk(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const full = path.join(dir, item);

      if (fs.statSync(full).isDirectory()) {
        walk(full);
      } else {
        if (item === name) {
          results.push(full.replace(root, ""));
        }
      }
    }
  }

  walk(root);
  return results;
}

export const tools = {
  readFile,
  writeFile,
  applyPatch,
  listFiles,
  search,
  findFile, // 👈
};