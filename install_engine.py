#!/usr/bin/env python3
"""Build Pikafish from official release source and install its official NNUE.

Compile failures print the *actual* compiler output in Render logs.
"""
import json
import os
import pathlib
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request

API = 'https://api.github.com/repos/official-pikafish/Pikafish/releases/latest'
NET = 'https://github.com/official-pikafish/Networks/releases/download/master-net/pikafish.nnue'
OUT = pathlib.Path('/opt/pikafish')
HEAD = {'User-Agent': 'pikafish-cloud-render-builder', 'Accept': 'application/vnd.github+json'}

def download(url, dest):
    req = urllib.request.Request(url, headers=HEAD)
    with urllib.request.urlopen(req, timeout=180) as response, open(dest, 'wb') as output:
        shutil.copyfileobj(response, output)

def run_build(folder, arch, comp):
    cmd = ['make', '-j2', 'build', 'ARCH=' + arch, 'COMP=' + comp]
    print('BUILD COMMAND:', ' '.join(cmd), 'in', folder, flush=True)
    result = subprocess.run(cmd, cwd=folder, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True, errors='replace')
    # Always emit compiler diagnostics, not only the final CalledProcessError.
    print(result.stdout[-18000:], flush=True)
    return result.returncode == 0

def run():
    with tempfile.TemporaryDirectory() as tmpname:
        tmp = pathlib.Path(tmpname)
        release = tmp / 'release.json'
        download(API, release)
        info = json.loads(release.read_text())
        print('Official Pikafish tag:', info.get('tag_name'), flush=True)
        archive = tmp / 'source.tar.gz'
        download(info['tarball_url'], archive)
        root = tmp / 'source'
        root.mkdir()
        # Safely extract the repo tree, retaining adjacent files needed by the Makefile.
        with tarfile.open(archive, 'r:gz') as tar:
            for member in tar:
                parts = pathlib.PurePosixPath(member.name).parts
                if len(parts) < 2 or not member.isfile() or '..' in parts:
                    continue
                relative = pathlib.Path(*parts[1:])
                target = root / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                stream = tar.extractfile(member)
                if stream is not None:
                    with stream, open(target, 'wb') as handle:
                        shutil.copyfileobj(stream, handle)
        builddir = root / 'src'
        if not (builddir / 'Makefile').is_file():
            raise RuntimeError('No Makefile in extracted Pikafish/src')
        print('Compiler versions:', flush=True)
        for compiler in ('clang++', 'g++'):
            subprocess.run([compiler, '--version'], check=False)
        # Avoid x86-64-universal: older Clang versions reject the vaes / avxvnni
        # builtin CPU feature checks. Start with the most portable GCC target.
        # Keep a non-universal Clang fallback for upstream build variations.
        attempts = [('x86-64', 'gcc'), ('x86-64', 'clang')]
        executable = builddir / 'pikafish'
        for arch, compiler in attempts:
            subprocess.run(['make', 'clean'], cwd=builddir, check=False,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if run_build(builddir, arch, compiler) and executable.is_file():
                break
        else:
            raise RuntimeError('All Pikafish build configurations failed. Read BUILD COMMAND compiler diagnostics above.')
        OUT.mkdir(parents=True, exist_ok=True)
        shutil.copy2(executable, OUT / 'pikafish')
        os.chmod(OUT / 'pikafish', 0o755)
        print('Downloading official NNUE...', flush=True)
        download(NET, OUT / 'pikafish.nnue')
        size = (OUT / 'pikafish.nnue').stat().st_size
        if size < 1_000_000:
            raise RuntimeError('NNUE file unexpectedly small: ' + str(size))
        print('Engine and NNUE installed; UCI operation must be validated on Render.', flush=True)

if __name__ == '__main__':
    run()
