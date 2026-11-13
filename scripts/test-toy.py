"""Firefox checks for the Toy ZIP under a strict subpath without directory redirects."""
import argparse
import base64
import json
import mimetypes
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import time
import urllib.parse
import urllib.error
import urllib.request
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--webdriver', default='http://127.0.0.1:4459')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
folder = root / 'dist-toy'
prefix = '/toy/brez-test/'
missing = []


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        pathname = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        file = (folder / pathname[len(prefix):]).resolve()
        if not pathname.startswith(prefix) or not file.is_relative_to(folder) or not file.is_file():
            missing.append(pathname)
            self.send_error(404)
            return
        self.send_response(200)
        mime = mimetypes.guess_type(file)[0] or 'application/octet-stream'
        self.send_header('Content-Type', mime + ('; charset=utf-8' if mime.startswith('text/') else ''))
        self.end_headers()
        self.wfile.write(file.read_bytes())

    def log_message(self, *args):
        pass


def request(path, data=None, method=None):
    payload = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(args.webdriver.rstrip('/') + path, data=payload,
                                 headers={'Content-Type': 'application/json'}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)['value']
    except urllib.error.HTTPError as error:
        raise RuntimeError(error.read().decode()) from error


def req(path, data=None, method=None):
    return request('/session/' + session + path, data, method)


def js(source, *values):
    return req('/execute/sync', {'script': source, 'args': list(values)})


def wait_js(source):
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        if js(source):
            return
        time.sleep(.05)
    raise AssertionError(source)


def open_page(file='index.html'):
    req('/url', {'url': base + file})


def check_links():
    invalid = js('''return [...document.querySelectorAll('a[href]')].map(link=>new URL(link.getAttribute('href'),document.baseURI).href)
        .filter(url=>!url.startsWith(arguments[0]) && url!=='https://space.bilibili.com/630698674')''', base)
    assert not invalid, invalid


with zipfile.ZipFile(root / 'brez-toy.zip') as archive:
    names = set(archive.namelist())
    assert 'index.html' in names and not any(name.startswith(('dist/', 'dist-toy/')) for name in names)
    assert archive.testzip() is None
    assert names == {str(file.relative_to(folder)) for file in folder.rglob('*') if file.is_file()}
    assert all(archive.read(name) == (folder / name).read_bytes() for name in names)
print('PASS ZIP root entry and exact artifact contents', flush=True)

server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f'http://127.0.0.1:{server.server_port}' + prefix
session = None
try:
    session = request('/session', {'capabilities': {'alwaysMatch': {
        'browserName': 'firefox', 'pageLoadStrategy': 'eager',
        'moz:firefoxOptions': {'args': ['-headless'], 'prefs': {'ui.prefersReducedMotion': 1}}}}})['sessionId']
    req('/moz/context', {'context': 'chrome'})
    js("document.documentElement.style.setProperty('min-width','0','important')")
    req('/moz/context', {'context': 'content'})
    for width, height in [(320, 740), (390, 844), (768, 900), (1440, 900), (844, 390)]:
        req('/window/rect', {'width': width, 'height': height})
        extra = js('return {w:outerWidth-innerWidth,h:outerHeight-innerHeight}')
        req('/window/rect', {'width': width + extra['w'], 'height': height + extra['h']})
        assert js('return innerWidth') == width
        open_page()
        wait_js('return document.documentElement.dataset.intro === "ready" && !!window.breezePark')
        assert js('return document.querySelectorAll("#page-navigation").length===1 && document.querySelectorAll("#page-navigation a").length===5')
        assert js('return ["ferris","coaster","pirate"].every(id=>!document.querySelector(`#ride-${id} a`) && !!document.querySelector(`#ride-${id} .entry-unavailable`))')
        js('document.querySelector("#guide-fixed").click()')
        assert js('return document.querySelector("#park-guide").open && document.querySelectorAll("#guide-list li").length===9')
        if width == 1440:
            preview = root / '.preview'
            preview.mkdir(exist_ok=True)
            (preview / 'toy-guide.png').write_bytes(base64.b64decode(req('/screenshot')))
        js('document.querySelector("#guide-map-tab").click()')
        assert js('return document.querySelectorAll(".map-stop").length===13')
        js('document.querySelector(".map-stop[data-skate=windmill]").dispatchEvent(new MouseEvent("click",{bubbles:true}))')
        wait_js('return !document.querySelector("#park-guide").open && document.querySelector("#travel-status").textContent==="已到达Project"')
        check_links()
    print('PASS Toy homepage, directory, map and unavailable entries across screen sizes', flush=True)

    # The canonical still identifies the original site; sharing must use the Toy URL.
    js('''Object.defineProperty(navigator,'share',{configurable:true,value:()=>Promise.reject(new Error('fallback'))});
        Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.copied=value}}});
        document.querySelector('#share-btn').click()''')
    wait_js('return window.copied === "https://www.bilibili.com/toy/brez-test/index.html"')
    assert js('try { window.breezePark.setRobotDestination("https://example.com/");return false } catch { return true }')
    print('PASS Toy sharing and robot destination restrictions', flush=True)

    js('document.querySelector("#guide-fixed").click();document.querySelector("#guide-list [data-ride=windmill] a").click()')
    wait_js('return location.pathname.endsWith("/project-show/index.html")')
    js('document.querySelector(".desk-piece").click()')
    wait_js('return location.pathname.endsWith("/project-show/projects/p2p/index.html")')
    check_links()
    js('document.querySelector(".park-return").click()')
    wait_js('return location.pathname.endsWith("/toy/brez-test/index.html")')
    open_page('resume/index.html#projects')
    wait_js('return location.pathname.endsWith("/project-show/index.html")')
    print('PASS nested portfolio links, return navigation and legacy resume redirect', flush=True)

    # Inspect every page after scripts run, including translated and interactive content.
    for file in sorted(folder.rglob('*.html')):
        open_page(str(file.relative_to(folder)))
        if file.parent.name == 'resume':
            wait_js('return document.documentElement.classList.contains("resume-ready")')
            for language in ['zh', 'en', 'ja']:
                js('document.querySelector(`.lang-btn[data-lang="${arguments[0]}"]`).click()', language)
                check_links()
        if file.parent.name == 'personal-match-site':
            for quest in ['walk', 'game', 'meal']:
                js('document.querySelector(`[data-quest="${arguments[0]}"]`).click()', quest)
                check_links()
        check_links()
    assert not missing, missing
    print('PASS all Toy pages and language/quest changes without outbound links or missing resources', flush=True)

    req('/moz/context', {'context': 'chrome'})
    js("Services.prefs.setBoolPref('javascript.enabled',false)")
    req('/moz/context', {'context': 'content'})
    open_page()
    assert js('return document.querySelectorAll(".fallback-nav a").length===5 && !document.querySelector(".park-scene")')
    check_links()
    print('PASS no-script Toy navigation', flush=True)
finally:
    if session:
        req('', method='DELETE')
    server.shutdown()
    server.server_close()
