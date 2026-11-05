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
    js('document.querySelector("#guide-fixed").click();document.querySelector(`.guide-skate[data-skate="${arguments[0]}"]`).click()', stop)
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
        js('document.querySelector("#home-button").click()')
        assert js('return Math.abs(document.querySelector("#park-viewport").getBoundingClientRect().bottom-innerHeight)<1')
        assert js('''
            const label=document.querySelector('#park-direction text').getBoundingClientRect();
            const clear=selector=>{const r=document.querySelector(selector).getBoundingClientRect();
                return label.right<=r.left || label.left>=r.right || label.bottom<=r.top || label.top>=r.bottom;};
            return label.left>=0 && label.right<=innerWidth && ['#sloth-drag','#park-robot','#move-right','.park-tools'].every(clear);
        ''')
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
    go('snackstreet')
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

    # Every entrance starts with the entire SVG in view, then approaches the character.
    req('/refresh', {})
    time.sleep(.2)
    assert js('return document.documentElement.dataset.intro') == 'playing'
    overview = js('const r=document.querySelector(".park-scene").getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}')
    assert overview['left'] >= -1 and overview['right'] <= 391, overview
    time.sleep(1.1)
    assert js('return document.querySelector(".park-scene").getBoundingClientRect().width') > overview['width'] * 1.1
    time.sleep(2.5)
    assert js('return document.documentElement.dataset.intro==="ready" && !document.querySelector("#park-camera").style.transform')
    assert js('return document.querySelector("#sloth-drag").getBoundingClientRect().bottom<=innerHeight')
    req('/refresh', {})
    time.sleep(.2)
    assert js('return document.documentElement.dataset.intro') == 'playing'
    js('window.dispatchEvent(new WheelEvent("wheel"))')
    assert js('return document.documentElement.dataset.intro') == 'ready'
    print('PASS overview-to-character camera, repeat on entry, and user interruption')

    req('/url', {'url': args.url.rstrip('/') + '/project-show/'})
    req('/back', {})
    time.sleep(.2)
    assert js('return document.documentElement.dataset.intro') == 'playing'
    js('window.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))')
    assert js('return document.documentElement.dataset.intro') == 'ready'
    print('PASS browser Back replays the entrance camera')

    chrome("Services.prefs.setIntPref('ui.prefersReducedMotion',1)")
    for width, height in [(320,740),(390,844),(768,900),(1440,900),(844,390)]:
        size(width,height)
        req('/url', {'url':args.url.rstrip('/')+'/snack-town/'})
        time.sleep(.2)
        assert js('return document.documentElement.dataset.intro') == 'ready'
        assert js('return document.querySelector(".town-art").complete && document.querySelector(".town-art").naturalWidth>0')
        for stop in ['follow','message']:
            js('document.querySelector(`[data-walk="${arguments[0]}"]`).click()',stop)
            result=js('''
                const station=document.querySelector(`.station-${arguments[0]}`);
                return [...station.querySelectorAll('a,button')].every(node=>{
                    const r=node.getBoundingClientRect();
                    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
                    return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight && node.contains(hit);
                });
            ''',stop)
            assert result,(width,height,stop)
        js('window.invite=null;Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:value=>{window.invite=value;return Promise.resolve()}}});document.querySelector("#copy-invite").click()')
        time.sleep(.05)
        assert js('return window.invite')=='请吃饭'
        req('/url', {'url':args.url.rstrip('/')+'/404.html'})
        time.sleep(.1)
        assert js('return !!document.querySelector(".boundary-scene .sloth-bob") && !!document.querySelector(".home")')
        assert js('return document.documentElement.scrollWidth<=innerWidth')
        assert js('return document.querySelector(".home").getBoundingClientRect().right<=innerWidth')
        print(f'PASS {width}x{height}: matching town/404 scenes, stall hit testing and clipboard')
finally:
    req('', method='DELETE')
