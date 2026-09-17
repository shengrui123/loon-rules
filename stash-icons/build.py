#!/usr/bin/env python3
"""Rebuild Stash icon sets from pinned upstream inventories; optionally check URLs."""
import argparse
import concurrent.futures
import datetime
import json
from pathlib import Path
import struct
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent
PACKS = {'dashboard': 'Global Apps and Websites', 'apps': 'Apps Supplement', 'qure': 'Qure Color and Policies'}

def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def validate(data):
    assert set(data) == {'name', 'icons'} and isinstance(data['name'], str) and data['name']
    assert isinstance(data['icons'], list) and data['icons']
    names, urls = set(), set()
    for icon in data['icons']:
        assert set(icon) == {'name', 'url'}
        assert isinstance(icon['name'], str) and icon['name']
        assert icon['name'].casefold() not in names, icon['name']
        assert icon['url'] not in urls, icon['url']
        url = urllib.parse.urlsplit(icon['url'])
        assert url.scheme == 'https' and url.netloc == 'raw.githubusercontent.com'
        assert url.path.endswith('.png') and not url.query and not url.fragment
        names.add(icon['name'].casefold()); urls.add(icon['url'])

def check(icon):
    for attempt in range(3):
        try:
            request = urllib.request.Request(icon['url'], headers={'User-Agent': 'Stash-Icon-Validator/1.0'})
            with urllib.request.urlopen(request, timeout=25) as response:
                header = response.read(24)
                assert response.status == 200
                assert header[:8] == b'\x89PNG\r\n\x1a\n' and header[12:16] == b'IHDR', 'Not PNG'
                width, height = struct.unpack('>II', header[16:24])
                assert width > 0 and height > 0
                return {'name': icon['name'], 'ok': True, 'width': width, 'height': height}
        except Exception as error:
            last = str(error)
    return {'name': icon['name'], 'ok': False, 'error': last, 'url': icon['url']}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check-links', action='store_true', help='GET every image and check PNG header')
    args = parser.parse_args()
    combined = []
    counts = {}
    for key, title in PACKS.items():
        source = json.loads((ROOT / 'sources' / f'{key}.json').read_text())
        revision = source['revision']
        assert len(revision) == 40 and all(c in '0123456789abcdef' for c in revision)
        icons = [{'name': f'{Path(path).stem} [{key}]', 'url': f'https://raw.githubusercontent.com/{source["repository"]}/{revision}/{urllib.parse.quote(path, safe="/")}'} for path in sorted(source['paths'], key=str.casefold)]
        data = {'name': f'Stash · {title}', 'icons': icons}
        validate(data)
        save(ROOT / f'{key}.json', data)
        combined.extend(icons)
        counts[key] = len(icons)
    combined.sort(key=lambda icon: icon['name'].casefold())
    data = {'name': 'Stash · Global Icon Collection', 'icons': combined}
    validate(data)
    save(ROOT / 'stash-global.json', data)
    print(json.dumps({'counts': counts, 'total': len(combined)}, ensure_ascii=False), flush=True)
    if args.check_links:
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
            for result in pool.map(check, combined):
                results.append(result)
                if len(results) % 500 == 0:
                    print(f'Checked {len(results)}/{len(combined)}', flush=True)
        failures = [item for item in results if not item['ok']]
        report = {'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'total': len(results), 'passed': len(results)-len(failures), 'failures': failures, 'method': 'HTTP GET, status 200, PNG signature and IHDR positive dimensions; no Stash client import test'}
        save(ROOT / 'validation-report.json', report)
        print(json.dumps(report, ensure_ascii=False), flush=True)
        if failures:
            raise SystemExit(1)

if __name__ == '__main__':
    main()
