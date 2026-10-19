# Project Rules & Guidelines

## 🚫 Code Quality & Standards
- **NEVER** use `any` in TypeScript. Preserve strict type safety at all costs.
- If a type mismatch occurs, write a mapper function instead of casting to `any`.
- Follow the existing code style. Do not introduce new libraries without permission.

## 🔄 Workflow & Process
1. **Always** read the full file before making any edits.
2. If you need to understand a function signature, read the actual definition. Do not guess.
3. After making changes, **always** run `npm run build` to verify the project compiles.
4. In your final response, **always** list the files you have changed.

## 🧠 Reasoning & Problem Solving
- Do not stop at the first error. Investigate the root cause.
- If you are blocked, explicitly ask for the missing information (e.g., "Please provide the signature of `addPublisher`").