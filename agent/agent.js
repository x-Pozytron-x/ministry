import fetch from "node-fetch";
import readline from "readline";
import { CONFIG } from "./config.js";
import { tools } from "./tools.js";

// -------------------- SAFE PARSER --------------------

function safeParse(raw) {
  raw = raw.trim();
  raw = raw.replace(/```json/g, "");
  raw = raw.replace(/```/g, "");

  try {
    return JSON.parse(raw);
  } catch (e) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw e;
    return JSON.parse(match[0]);
  }
}

// -------------------- SYSTEM PROMPT --------------------

const SYSTEM_PROMPT = `
Ты локальный coding agent.

ЖЁСТКИЕ ПРАВИЛА:
- НЕЛЬЗЯ отвечать текстом
- ВСЕГДА сначала tool
- НЕЛЬЗЯ использовать знания без readFile
- НЕЛЬЗЯ пропускать инструменты

ФОРМАТ:

TOOL:
{"tool":"readFile","args":{}}

ИЛИ FINAL:
{"final":"..."}

TOOLS:
- readFile(path)
- writeFile(path, content)
- applyPatch(path, search, replace)
- listFiles(dir)
- search(query)

ПРАВИЛО:
Если задача про код → readFile ОБЯЗАТЕЛЬНО

If user gives only filename (e.g. Attendance.tsx):
→ you MUST call findFile first

If multiple results:
→ ask or pick best match

Never guess paths

NEVER assume file path.
Always use findFile or listFiles first.

`;

// -------------------- LLM CALL --------------------

async function callLLM(messages, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages,
          temperature: 0.2,
        }),
      });

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

// -------------------- AGENT RUN --------------------

async function runTask(input) {
  let messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: input },
  ];

  let usedTool = false;

  for (let i = 0; i < 30; i++) {
    const raw = await callLLM(messages);

    let msg;
    try {
      msg = safeParse(raw);
    } catch (e) {
      messages.push({
        role: "system",
        content: "INVALID JSON. RETURN STRICT JSON ONLY.",
      });
      continue;
    }

    // TOOL
    if (msg.tool) {
      usedTool = true;

      const fn = tools[msg.tool];

      let result;
      if (!fn) {
        result = { error: "UNKNOWN_TOOL" };
      } else {
        result = fn(msg.args || {});
      }

      messages.push({ role: "assistant", content: raw });
      messages.push({ role: "tool", content: JSON.stringify(result) });

      continue;
    }

    // FINAL GUARD
    if (msg.final) {
      if (!usedTool) {
        console.log("⛔ BLOCKED FINAL WITHOUT TOOL");
        return;
      }

      console.log("\nFINAL:\n", msg.final);
      return;
    }
  }

  console.log("⛔ MAX STEPS REACHED");
}

// -------------------- REPL (NEVER EXIT) --------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function loop() {
  rl.question("\nagent> ", async (input) => {
    if (input.trim() === "exit") {
      rl.close();
      return;
    }

    await runTask(input);
    loop();
  });
}

loop();