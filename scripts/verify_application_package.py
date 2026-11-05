"""Verify packaged bytes, then start its backend from a clean extraction.

No installed frontend dependencies, generated runtime or database are copied in.
The smoke API uses an in-memory SQLite database and an ephemeral localhost port.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output"
ARCHIVE = OUTPUT / "asha-saath-website-source.zip"
REPORT = OUTPUT / "website-source-packaging.json"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--node", default=shutil.which("node"))
    args = parser.parse_args()
    if not args.node:
        raise SystemExit("Node 24 is required for clean-package backend verification.")
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    if sha256(ARCHIVE.read_bytes()).hexdigest() != report["archive_sha256"]:
        raise SystemExit("Archive differs from its recorded SHA256.")
    smoke = """
      import { createBackend } from './backend/server.mjs';
      const app = await createBackend({filename: ':memory:'});
      const address = await app.listen(0);
      try {
        const base = `http://127.0.0.1:${address.port}`;
        const healthResponse = await fetch(base + '/api/health');
        const health = await healthResponse.json();
        if (healthResponse.status !== 200 || !health.ok || !health.synthetic || health.database !== 'SQLite')
          throw new Error('Clean-package health check failed');
        const signIn = await fetch(base + '/api/session', {
          method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1'},
          body: JSON.stringify({actorId: 'COORD-DEMO-01'})
        });
        const state = await signIn.json();
        if (signIn.status !== 200 || state.session?.role !== 'coordinator' || state.state?.tasks.length !== 24)
          throw new Error('Clean-package synthetic fixture initialization failed');
        console.log(JSON.stringify({passed: true, health, seeded_tasks: state.state.tasks.length}));
      } finally { await app.close(); }
    """
    OUTPUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="asha-package-smoke-", dir=OUTPUT) as temporary:
        sandbox = Path(temporary).resolve()
        # Verify the exact generated cleanup target remains inside this output
        # directory before the TemporaryDirectory context can remove it.
        if sandbox.parent != OUTPUT.resolve() or not sandbox.name.startswith("asha-package-smoke-"):
            raise SystemExit("Unsafe package verification workspace.")
        with zipfile.ZipFile(ARCHIVE, "r") as z:
            if z.testzip():
                raise SystemExit("Archive CRC verification failed.")
            manifest = json.loads(z.read("lovable-source-manifest.json"))
            for item in manifest["packaging"]["current_files"]:
                data = z.read("asha-saath-lovable/" + item["path"])
                if sha256(data).hexdigest() != item["sha256"] or len(data) != item["bytes"]:
                    raise SystemExit("Packaged inventory mismatch.")
            for item in z.infolist():
                name = PurePosixPath(item.filename)
                if name.is_absolute() or ".." in name.parts or ":" in item.filename or "\\" in item.filename:
                    raise SystemExit("Archive contains an unsafe path.")
                target = sandbox.joinpath(*name.parts)
                if not target.resolve().is_relative_to(sandbox):
                    raise SystemExit("Archive path leaves verification workspace.")
                if item.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(z.read(item.filename))
        app = sandbox / "asha-saath-lovable"
        if (app / "node_modules").exists() or (app / "backend/runtime").exists() or (app / "backend/data").exists():
            raise SystemExit("Package unexpectedly contains dependency/runtime/private state.")
        version = subprocess.run([args.node, "--version"], capture_output=True, text=True, check=True).stdout.strip()
        if not version.startswith("v24."):
            raise SystemExit("Clean-package verification expects Node 24.")
        result = subprocess.run([args.node, "--input-type=module", "-e", smoke],
                                cwd=app, capture_output=True, text=True, timeout=60)
        if result.returncode:
            raise SystemExit("Clean source backend failed: " + result.stderr[-2000:])
        evidence = json.loads(result.stdout.strip())
        runtime = app / "backend/runtime"
        if not all((runtime / (name + ".mjs")).is_file() for name in ["csv", "fixtures", "time", "planner", "domain"]):
            raise SystemExit("Backend did not regenerate its runtime from clean source.")
        evidence["node_version"] = version
        evidence["runtime_regenerated_from_packaged_source"] = True
        evidence["frontend_dependency_install_or_build"] = "Not rerun by this packaging check; app-level evidence is separate"
        report["clean_extract_backend_startup"] = evidence
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["clean_extract_backend_startup"], indent=2))


if __name__ == "__main__":
    main()
