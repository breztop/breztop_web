"""Firefox regression checks against a locally served build (no Python packages required)."""
import argparse
import json
import time
import urllib.error
import urllib.request

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:4191/')
parser.add_argument('--webdriver', default='http://127.0.0.1:4459')
parser.add_argument('--firefox-binary')
args = parser.parse_args()


def request(path, data=None, method=None):
    payload = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(args.webdriver.rstrip('/') + path, data=payload,
                                 headers={'Content-Type': 'application/json'}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)['value']
    except urllib.error.HTTPError as error:
        raise RuntimeError(error.read().decode()) from error


options = {'args': ['-headless'], 'prefs': {'ui.prefersReducedMotion': 1}}
if args.firefox_binary:
    options['binary'] = args.firefox_binary
session = request('/session', {'capabilities': {'alwaysMatch': {
    'browserName': 'firefox', 'pageLoadStrategy': 'eager', 'moz:firefoxOptions': options}}})['sessionId']


def req(path, data=None, method=None):
    return request('/session/' + session + path, data, method)


def js(source, *values):
    return req('/execute/sync', {'script': source, 'args': list(values)})


def chrome(source):
    req('/moz/context', {'context': 'chrome'})
    try:
        return js(source)
    finally:
        req('/moz/context', {'context': 'content'})


def size(width, height):
    req('/window/rect', {'width': width, 'height': height})
    extra = js('return {w:outerWidth-innerWidth,h:outerHeight-innerHeight}')
    req('/window/rect', {'width': width + extra['w'], 'height': height + extra['h']})
    time.sleep(.15)
    assert js('return innerWidth') == width


def key(value):
    req('/actions', {'actions': [{'type': 'key', 'id': 'keyboard', 'actions': [
        {'type': 'keyDown', 'value': value}, {'type': 'keyUp', 'value': value}]}]})


def go(stop):
    js('document.querySelector(`[data-stop="${arguments[0]}"]`).click()', stop)
    time.sleep(.1)


try:
    chrome("document.documentElement.style.setProperty('min-width','0','important')")
    size(390, 844)
    req('/url', {'url': args.url})
    time.sleep(.3)
    assert js('return !!window.breezePark && !document.querySelector("dialog").open')
    assert js('return !document.querySelector("a[href*=download]") && !!document.querySelector("#ride-carousel a[href*=resume]")')
    for width, height in [(320, 740), (390, 844), (768, 900), (1024, 768), (1440, 900), (844, 390)]:
        size(width, height)
        for stop in ['bilibili', 'ferris', 'carousel', 'coaster', 'pirate', 'windmill', 'bumper', 'snackstreet']:
            go(stop)
            result = js('''
                const entry = arguments[0] === 'bilibili' ? document.querySelector('#entrance-scene .page-entry')
                    : document.querySelector(`#ride-${arguments[0]} .page-entry`);
                const rect = entry.getBoundingClientRect();
                const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
                return {visible:rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight,
                    clickable:hit?.closest('.page-entry') === entry};
            ''', stop)
            assert all(result.values()), (width, height, stop, result)
        js('document.querySelector("#guide-fixed").click()')
        time.sleep(.1)
        assert js('return document.querySelector("dialog").open')
        assert js('''const map=document.querySelector('#guide-map svg').getBoundingClientRect();
            return [...document.querySelectorAll('.map-stop text')].every(e=>{
                const r=e.getBoundingClientRect();return r.left>=map.left && r.right<=map.right && r.bottom<=map.bottom});''')
        js('document.querySelector("#guide-scroll").scrollTop=9999')
        time.sleep(.1)
        assert js('return document.querySelector("#guide-more").hidden')
        js('document.querySelector("#guide-close").click()')
        print(f'PASS {width}x{height}: entry visibility, hit testing, guide and map')

    js('document.querySelector("#park-viewport").focus()')
    key('\ue010')
    assert js('return document.querySelector("#travel-status").textContent') == '已到达好吃小镇'
    js('document.querySelector("#guide-fixed").focus()')
    key('\ue007')
    assert js('return document.querySelector("dialog").open')
    key('\ue00c')
    assert js('return !document.querySelector("dialog").open && document.activeElement.id==="guide-fixed"')
    print('PASS End destination, keyboard dialog and focus restoration')

    # Use real pointer input to enter a local destination.
    size(1024, 768)
    go('windmill')
    point = js('const r=document.querySelector("#ride-windmill .page-entry").getBoundingClientRect();return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}')
    req('/actions', {'actions': [{'type': 'pointer', 'id': 'mouse', 'parameters': {'pointerType': 'mouse'}, 'actions': [
        {'type': 'pointerMove', 'duration': 0, **point}, {'type': 'pointerDown', 'button': 0}, {'type': 'pointerUp', 'button': 0}]}]})
    time.sleep(.2)
    assert js('return location.pathname.endsWith("/project-show/")')
    print('PASS physical click opens portfolio in same tab')
    req('/url', {'url': args.url})
    time.sleep(.2)
    js('window.copies=0;Object.defineProperty(navigator,"share",{configurable:true,value:()=>Promise.reject(new DOMException("cancel","AbortError"))});Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>{window.copies++;return Promise.resolve()}}});document.querySelector("#share-btn").click()')
    time.sleep(.1)
    assert js('return window.copies') == 0
    js('Object.defineProperty(navigator,"share",{value:()=>Promise.reject(new Error("unavailable"))});document.querySelector("#share-btn").click()')
    time.sleep(.1)
    assert js('return window.copies') == 1
    print('PASS share cancellation and clipboard fallback')

    chrome("Services.prefs.setIntPref('ui.prefersReducedMotion',0)")
    size(390, 844)
    js('localStorage.clear()')
    req('/refresh', {})
    time.sleep(.2)
    assert js('return document.querySelector("#cycle-mode span").textContent') == '10 分钟'
    js('document.querySelector("[data-stop=snackstreet]").click()')
    time.sleep(3.9)
    assert js('return document.querySelector("#travel-status").textContent') == '已到达好吃小镇'
    print('PASS mobile clock default and animated travel')

    js('Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));window.progress=document.querySelector("#cycle-mode").style.cssText')
    time.sleep(1.2)
    assert js('return window.progress===document.querySelector("#cycle-mode").style.cssText')
    js('delete document.hidden;document.dispatchEvent(new Event("visibilitychange"))')
    time.sleep(1.1)
    assert js('return window.progress!==document.querySelector("#cycle-mode").style.cssText')
    print('PASS hidden clock suspension and resume')
finally:
    req('', method='DELETE')
