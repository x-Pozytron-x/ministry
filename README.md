# CongrArk

🌍 Languages: [EN](README.md) | [RU](README.ru.md) | [CZ](README.cs.md)

CongrArk is an offline-first encrypted data manager for working with sensitive structured information.

## Purpose

The application is designed for secure local handling of data such as:

- reports and records
- structured notes
- attendance and lists
- internal administrative data

The main idea: **your data never leaves your device in decrypted form.**

---

## Security Model

CongrArk is built on a strict privacy-first principle:

> Data exists in decrypted form only in memory and is never stored in plaintext.

Key properties:

- AES-256-GCM encryption
- Key derived from user password (PBKDF2)
- No backend, no cloud sync
- No analytics, no external requests
- No plaintext persistence

---

## How it works

1. Open encrypted file
2. Enter password
3. Data is decrypted into memory
4. Edit data locally
5. Export new encrypted file

---

## Limitations

CongrArk is NOT:

- a cloud service
- a multi-user system
- a real-time sync tool
- a backup system

User is responsible for storing encrypted files.

---

## Security priorities

1. Data confidentiality
2. Local-only execution
3. Minimal attack surface
4. No network dependencies
5. User-controlled storage

---

## Tech concept

- PWA (installable app)
- Web Crypto API
- Client-side encryption
- File-based persistence

---

## License

TBD