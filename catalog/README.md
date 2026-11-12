# DSA Space curated catalog

The current release contains 150 complete, independently authored exercises, 300 worked examples, 164 approaches and 215 related practice links. It covers 22 primary topics and all 11 source platforms. This adds 100 exercises to the original pilot while preserving every original content version. Approximately 6,000 carefully selected exercises remain the longer-term editorial target.

## Files and responsibilities

- `supabase/schema.sql`: the single commented source for database structure, RLS, migration and admin functions. Run the whole file; it is about 50 KB. It does not contain a giant question seed.
- `catalog/interview-pilot.json`: versioned question content and release manifest. The existing filename is retained for compatibility; it now contains all 150 questions, not only the first 50. It contains actual descriptions, formats, constraints, examples, progressive hints, prerequisites, approaches, per-approach complexities and source references.
- `scripts/catalog-reference.mjs`: the original 50 references and the combined reference registry.
- `scripts/catalog-core-reference.mjs`: references for the 100 added exercises.
- `scripts/verify-core-catalog.mjs`: differential and boundary checks for the new references. These files are local validation tooling, not a browser code runner.
- `scripts/catalog-validate.mjs`: checks completeness, duplicate source URLs and every published example against its reference implementation.
- `scripts/verify-catalog.mjs`: additional differential tests using independent brute-force oracles and boundary cases.
- `scripts/catalog-import.mjs`: validates, generates bounded SQL batches, resumes direct admin imports and exports shared data. It is local admin tooling, never frontend code.

## One-time application

1. Run the new `supabase/schema.sql` in Supabase SQL Editor. Stop using the retired catalog-expansion import.
2. From the repository terminal, run `node scripts/verify-catalog.mjs` and `node scripts/catalog-import.mjs --sql`.
3. Run generated files inside `catalog-import-sql/interview-core-2026-11-04` in numeric order. Six batches of 25 questions are followed by publication. Each release has its own folder under catalog-import-sql, so stale files from a previous release cannot be mixed in. The copy helper provides the exact same steps without requiring a local terminal.
4. Replace the listed frontend files and commit/push together. Existing Vercel public Supabase variables stay the same. No new browser key or dependency is needed.
5. Open Catalog. Start here has 50 available exercises, Essential has 131 and Interview practice has all 150. Counts overlap because one question can belong to several paths.
6. Open a preview, add it to My Questions, then open its Question tab. Refresh and verify Cloud saved. Remove it from My Questions and verify the catalog still contains it.

The complete catalog switches only after the expected question count has been imported. Retried identical batches are safe. Previously imported personal questions and independent notes are preserved. Old catalog entries outside this pilot are retired from browsing, not deleted from users' private libraries. They do not gain a description automatically.

## Direct resumable import (optional, local machine only)

Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the terminal environment, then run:

```text
node scripts/catalog-import.mjs --apply
```

Use the Supabase server secret/service-role key only in your local terminal environment. Do not put it in a VITE_ variable, Vercel frontend environment variable, source file or browser. The SQL Editor route requires no new key at all. The tool prints counts and error codes, not credentials.

## Future content releases

Add complete original or explicitly permitted content with checked examples and a reference implementation. Avoid repetitive exercises added only to reach a target number. Keep different constraints/tie rules as meaningful variations when they change the exercise. The catalog's related practice links explicitly disclose that platform formats may differ.

To change existing saved content, increment that question's version and choose a new release ID. An existing version cannot be replaced through the importer. Include the full desired visible catalog in each release manifest; publication retires entries absent from it. Do not reuse a published release ID to roll back a newer release.

Private imports pin the saved content version. A later catalog release does not replace notes, attempts, solutions or that pin. The Question tab offers an explicit update when a newer version is available. Old pinned content stays readable by its owner even after the question is retired from browsing.

The 150/500/1,500 path sizes and approximately 6,000 full-library size are editorial targets. The current release has 150 total questions, with overlapping path membership. List queries fetch only metadata; opening a question fetches one detailed document from Supabase. External practice sites are not required to render it. This does not make the app usable without an internet connection to Supabase.

## Backup and provenance

`node scripts/catalog-import.mjs --export catalog-backup.json` exports the shared tables, all saved content versions, approaches, links, collections and release manifests using the local admin environment above. It excludes private user questions. The resulting JSON is a data backup; restoration requires a deliberate admin import/restore, not the personal backup button. Generated batches and local catalog backups are ignored by Git. Personal progress continues to use the existing account-specific backup.

Stored exercise text, examples, hints and explanations in this catalog were independently authored for DSA Space and are labelled CC BY 4.0 with attribution. Related platform questions are links, not archived copies of restricted statements. Original source-metadata attribution remains on the catalog metadata. Do not scrape or mirror restricted full statements to expand this dataset.

## Core expansion validation

All 300 published example outputs match their reference implementations. The verification scripts additionally run 2,207 original differential/boundary checks and 6,917 checks for the core expansion. These checks catch implementation and example errors; they are not a formal proof of all constraints or complexity analyses.

The release is `interview-core-2026-11-04`. Importing it does not require changing credentials or application dependencies. Keep the original 50 records in the manifest: publication is a complete-set switch, not an additive append. The database importer reuses existing immutable content safely.

Source links cover LeetCode, GeeksforGeeks, HackerRank, InterviewBit, Code360, CSES, AtCoder, CodeChef, SPOJ, HackerEarth and Codeforces. This is a curated selection, not a mirror of those sites. No unsupported company-frequency or popularity claims are attached to the questions. Some source links may require a platform subscription or become unavailable; the stored DSA Space exercise remains usable through Supabase.
