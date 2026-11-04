# Specification tools

Run from the documentation repository with an available Python 3:

```text
python scripts/validate_spec_pack.py
python scripts/package_spec_pack.py
```

Validation checks local document links, JSON duplicate keys, 24-task identities/references, three fictional offers, knowledge length, requirement trace IDs and prescribed contrast pairs. It does not implement or test the website.

The four local skills can also be checked with the bundled skill-creator quick_validate.py tool.

The capture script requires Node, the bundled Playwright path and headless Chrome on the original Windows host. It reads public URLs only; paths in that research helper are host-specific. Captures remain usable without running it.

Packaging excludes app node_modules, credentials, runtime state and temporary render files.

## Current application source package

The application packer enumerates the complete current `asha-saath-lovable/` tree, rather than only the original imported filenames. It includes the added backend, session UI, local launcher, npm lockfile and original SVG favicon. It preserves the manifest's imported revision and original `files` inventory, adding a current packaged inventory with per-file SHA256 hashes.

```text
python scripts/package_application_snapshot.py
python scripts/verify_application_package.py --node <path-to-Node-24>
```

Outputs are `output/asha-saath-website-source.zip`, its `.zip.sha256` checksum, updated `output/lovable-source-manifest.json` and `output/website-source-packaging.json`. The archive is CRC-checked and each entry is matched to the captured source bytes/hash. The external checksum identifies the complete ZIP without a self-referential checksum inside that ZIP.

Excluded categories include dependencies/caches, Git/build output, `.env`/`.env.*` and credential artifacts, database/WAL/session files, backend generated runtime, logs and temporary test data. Links/junctions are skipped, paths are checked against the source root, and credential-like private content causes packaging to stop without printing the matched value.

The clean-package verifier extracts into a checked temporary directory within `output/`, starts only the packaged Node 24 backend with in-memory SQLite and an ephemeral localhost port, checks health/24-task synthetic initialization, and confirms all backend runtime modules were regenerated from included source. No database or generated runtime is required in the ZIP. This packaging smoke check does not rerun frontend installation/build or replace the application tests.

Rerun packaging and its clean check after final source/document changes. The ZIP's hashes describe its captured bytes, not subsequent workspace edits. The separate specification pack supplies parent context documents linked by application docs.
