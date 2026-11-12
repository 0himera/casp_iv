"""Download a checked public source, using no API key. Keep large raw data outside Git.

uv run python -m scripts.fetch_training_source mendeley
"""

import argparse
import hashlib
import json

import httpx

from app.config import BACKEND_ROOT, REPOSITORY_ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source")
    args = parser.parse_args()
    catalog = json.loads((REPOSITORY_ROOT / "data/training/sources.json").read_text())
    source = next((s for s in catalog["sources"] if s["id"] == args.source), None)
    if not source or not source.get("download_url"):
        raise SystemExit("Choose a downloadable source from data/training/sources.json")
    path = BACKEND_ROOT / source["local_raw_path"]
    expected = source["download_sha256"]
    if path.exists():
        with path.open("rb") as stream:
            actual = hashlib.file_digest(stream, "sha256").hexdigest()
        if actual == expected:
            print("Already downloaded and verified:", path)
            return
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".partial")
    checksum, count = hashlib.sha256(), 0
    with httpx.stream("GET", source["download_url"], follow_redirects=True, timeout=60) as response:
        response.raise_for_status()
        with temporary.open("wb") as stream:
            for chunk in response.iter_bytes(1024 * 1024):
                stream.write(chunk)
                checksum.update(chunk)
                count += len(chunk)
                if count > source["download_bytes"]:
                    raise SystemExit("Source changed: downloaded bytes exceed checked size")
    if checksum.hexdigest() != expected or count != source["download_bytes"]:
        raise SystemExit("Source checksum/size changed; inspect before accepting a new version")
    temporary.replace(path)
    print("Downloaded and verified:", path, count, "bytes")


if __name__ == "__main__":
    main()
