import path from "path";

export const CONFIG = {
  API_URL: "http://127.0.0.1:1234/v1/chat/completions",
  MODEL: "qwen2.5-coder-14b-instruct",
  WORKSPACE: path.resolve(process.cwd(), "../src"),
};