# DSA Space curated catalog

This is the first reviewable release: 50 complete, independently authored exercises, 100 worked examples, 56 approaches and 81 related practice links. It covers 21 primary topics and links to six platforms. It is not a completed 6,000-question dataset. The goal is approximately 6,000 useful, distinct interview exercises after this content format is reviewed.

## Files and responsibilities

- `supabase/schema.sql`: the single commented source for database structure, RLS, migration and admin functions. Run the whole file; it is about 50 KB. It does not contain a giant question seed.
- `catalog/interview-pilot.json`: versioned question content and release manifest. It contains actual descriptions, formats, constraints, examples, progressive hints, prerequisites, approaches, per-approach complexities and source references.
- `scripts/catalog-reference.mjs`: independently written reference implementations, not a browser code runner.
- `scripts/catalog-validate.mjs`: checks completeness, duplicate source URLs and every published example against its reference implementation.
- `scripts/verify-catalog.mjs`: additional differential tests using independent brute-force oracles and boundary cases.
- `scripts/catalog-import.mjs`: validates, generates bounded SQL batches, resumes direct admin imports and exports shared data. It is local admin tooling, never frontend code.

## One-time application

1. Run the new `supabase/schema.sql` in Supabase SQL Editor. Stop using the retired catalog-expansion import.
2. From the repository terminal, run `node scripts/verify-catalog.mjs` and `node scripts/catalog-import.mjs --sql`.
3. Run generated files in `catalog-import-sql` in numeric order. Five batches of ten questions are followed by publication. The copy helper provides the exact same steps without requiring a local terminal.
4. Replace the listed frontend files and commit/push together. Existing Vercel public Supabase variables stay the same. No new browser key or dependency is needed.
5. Open Catalog. Essential has 38 available exercises, Start here has 20 and Interview practice has 50. Counts overlap because one question can belong to several paths.
6. Open a preview, add it to My Questions, then open its Question tab. Refresh and verify Cloud saved. Remove it from My Questions and verify the catalog still contains it.

The complete catalog switches only after the expected question count has been imported. Retried identical batches are safe. Previously imported personal questions and independent notes are preserved. Old catalog entries outside this pilot are retired from browsing, not deleted from users' private libraries. They do not gain a description automatically.

## Direct resumable import (optional, local machine only)

Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the terminal environment, then run:

```text
node scripts/catalog-import.mjs --apply
```

Use the Supabase server secret/service-role key only in your local terminal environment. Do not put it in a VITE_ variable, Vercel frontend environment variable, source file or browser. The SQL Editor route requires no new key at all. The tool prints counts and error codes, not credentials.

## Future content releases

Add complete original or explicitly permitted content with checked examples and a reference implementation. Avoid repetitive exercises added only to reach a target number. Keep different constraints/tie rules as meaningful variations when they change the exercise. The pilot's related practice links explicitly disclose that platform formats may differ.

To change existing saved content, increment that question's version and choose a new release ID. An existing version cannot be replaced through the importer. Include the full desired visible catalog in each release manifest; publication retires entries absent from it. Do not reuse a published release ID to roll back a newer release.

Private imports pin the saved content version. A later catalog release does not replace notes, attempts, solutions or that pin. The Question tab offers an explicit update when a newer version is available. Old pinned content stays readable by its owner even after the question is retired from browsing.

The 150/500/1,500 path sizes and approximately 6,000 full-library size are editorial targets, not claims about the pilot's current counts. List queries fetch only metadata; opening a question fetches one detailed document from Supabase. External practice sites are not required to render it. This does not make the app usable without an internet connection to Supabase.

## Backup and provenance

`node scripts/catalog-import.mjs --export catalog-backup.json` exports the shared tables, all saved content versions, approaches, links, collections and release manifests using the local admin environment above. It excludes private user questions. The resulting JSON is a data backup; restoration requires a deliberate admin import/restore, not the personal backup button. Generated batches and local catalog backups are ignored by Git. Personal progress continues to use the existing account-specific backup.

Stored exercise text, examples, hints and explanations in this pilot were independently authored for DSA Space and are labelled CC BY 4.0 with attribution. Related platform questions are links, not archived copies of restricted statements. Original source-metadata attribution remains on the catalog metadata. Do not scrape or mirror restricted full statements to expand this dataset.
