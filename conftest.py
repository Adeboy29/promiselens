"""Test-only compatibility for genlayer-test 0.29.2; no site-package edits."""
import os
from pathlib import Path
import tarfile
import shutil


def pytest_configure():
    import gltest.direct.sdk_loader as sdk
    sdk.CACHE_DIR = Path(__file__).resolve().parent / ".test-cache"
    if os.name != "nt":
        return
    # Windows cannot unlink the duplicated stdin file while fd 0 is open.
    import gltest.direct.loader as loader
    original = loader._inject_message_to_fd0
    def inject(vm):
        try:
            original(vm)
        except PermissionError as error:
            import linecache
            trace = error.__traceback__
            while trace.tb_next:
                trace = trace.tb_next
            if trace.tb_frame.f_code.co_name != "_inject_message_to_fd0" or "os.unlink(path)" not in linecache.getline(trace.tb_frame.f_code.co_filename, trace.tb_lineno):
                raise
    loader._inject_message_to_fd0 = inject
    # Avoid Windows tarfile realpath restrictions. Extract only regular files
    # and directories with explicitly validated relative paths; reject links.
    def extract(tarball_path, runner_type, runner_hash=None, version=None):
        version = version or "v0.2.12"
        base = sdk.CACHE_DIR / "extracted" / version / runner_type
        if runner_hash and (base / runner_hash).exists():
            return base / runner_hash
        with tarfile.open(tarball_path, "r:xz") as outer:
            names = sorted(m.name for m in outer.getmembers() if m.name.startswith(f"runners/{runner_type}/") and m.name.endswith(".tar"))
            target = f"runners/{runner_type}/{runner_hash[:2]}/{runner_hash[2:]}.tar" if runner_hash else names[-1]
            parts = target.split("/")
            destination = base / (parts[-2] + parts[-1][:-4])
            with tarfile.open(fileobj=outer.extractfile(target), mode="r:") as inner:
                for member in inner.getmembers():
                    relative = Path(member.name)
                    if relative.is_absolute() or relative.drive or ".." in relative.parts or "\\" in member.name:
                        raise ValueError("Unsafe SDK archive path")
                    path = destination / relative
                    if member.isdir():
                        path.mkdir(parents=True, exist_ok=True)
                    elif member.isfile():
                        path.parent.mkdir(parents=True, exist_ok=True)
                        with inner.extractfile(member) as source, path.open("wb") as output:
                            shutil.copyfileobj(source, output)
                    else:
                        raise ValueError("SDK archive contains unsupported link or special file")
        return destination
    sdk.extract_runner = extract
