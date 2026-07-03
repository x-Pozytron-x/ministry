# CongrArk

🌍 Jazyky: [EN](README.md) | [RU](README.ru.md) | [CZ](README.cs.md)

CongrArk je offline aplikace pro práci se zašifrovanými strukturovanými daty.

## Účel

Aplikace slouží pro bezpečnou práci s citlivými daty:

- záznamy a reporty
- poznámky
- seznamy a statistiky
- interní administrativní data

Hlavní myšlenka: **data nikdy neopouštějí zařízení v nešifrované podobě.**

---

## Bezpečnostní model

CongrArk funguje podle principu:

> data existují v dešifrované podobě pouze v paměti zařízení

Vlastnosti:

- šifrování AES-256-GCM
- klíč odvozený z hesla uživatele (PBKDF2)
- žádný server ani cloud
- žádná analytika
- žádné ukládání otevřených dat

---

## Jak to funguje

1. Otevření šifrovaného souboru
2. Zadání hesla
3. Dešifrování dat do paměti
4. Úprava dat
5. Export nového šifrovaného souboru

---

## Omezení

CongrArk NENÍ:

- cloudová služba
- systém synchronizace
- multiuživatelská platforma
- zálohovací systém

Uživatel je odpovědný za ukládání souborů.

---

## Priorita

1. důvěrnost dat
2. lokální provoz bez internetu
3. jednoduchost
4. minimální závislosti
5. kontrola uživatele

---

## Technologie

- PWA aplikace
- Web Crypto API
- klientské šifrování
- práce se soubory

---

## Licence

Bude doplněna později