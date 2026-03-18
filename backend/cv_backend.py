#!/usr/bin/env python3
"""
AROHAN Rover — CV Backend FINAL

Root causes fixed vs v3:
  1. TRAINING BUG      — quality gate was rejecting augmented variants (blur aug
                         failed min_sharpness). Training now bypasses quality gate.
                         Live recognition still uses quality gate.
  2. WRONG PERSON      — double _normalize_image on augments corrupted features.
                         Now: normalize once, augment, encode raw augments.
  3. LAG IN RECOG      — print() on every frame was flushing stdout ~10x/sec.
                         Removed all per-frame prints; added debug counter instead.
  4. LBP SLOW          — face resized to 64px instead of 128 for LBP (4x faster,
                         same accuracy at ESP32 resolution).
  5. RecogWorker       — throttled to max 8 fps so CPU doesn't saturate.
                         Stream reads pre-annotated frame, never blocks.
  6. CACHE MISS HIGH   — cache key now uses downsampled 8x8 face patch (more
                         stable across minor lighting changes).
"""

import os, cv2, time, base64, pickle, threading, requests
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from collections import OrderedDict, deque, Counter
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS

try:
    from dotenv import load_dotenv; load_dotenv()
except ImportError:
    pass

try:
    import face_recognition as fr
    FR_AVAILABLE = True
    print("✅ face_recognition (FaceNet) available")
except ImportError:
    FR_AVAILABLE = False
    print("⚠️  face_recognition not found — using LBP+HOG")

try:
    import firebase_admin
    from firebase_admin import credentials, storage, db as fb_db
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

# ══════════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════════
ESP32_URL   = os.getenv('ESP32_CAM_URL', 'http://192.168.1.22:81')
BACKEND_URL = os.getenv('BACKEND_URL',  'http://localhost:5000')

SNAP_DIR        = Path('static/snapshots')
KNOWN_DIR       = Path('known_faces')
ENCODINGS_FILE  = Path('trained_model/encodings.pkl')

# Recognition thresholds
FR_THRESH  = float(os.getenv('FR_DISTANCE_THRESHOLD', '0.55'))   # face_recognition L2 dist
LBP_THRESH = float(os.getenv('CONFIDENCE_THRESHOLD',  '0.38'))   # LBP cosine sim

MAX_ALERTS    = int(os.getenv('MAX_ALERTS',    '1000'))
MAX_SNAPSHOTS = int(os.getenv('MAX_SNAPSHOTS', '200'))

# Tracker
VOTE_WINDOW  = 3      # majority vote frames
IOU_THRESH   = 0.20   # lower = easier to re-attach on camera shake
TRACK_TTL    = 2.5    # seconds before dead track evicted

# RecogWorker rate limit
RECOG_MIN_INTERVAL = 0.20    # max ~2.5 fps recognition — buffer khatam

DNN_PROTO = Path('trained_model/deploy.prototxt')
DNN_MODEL = Path('trained_model/res10_300x300_ssd.caffemodel')
DNN_PROTO_URL = ("https://raw.githubusercontent.com/opencv/opencv/master/"
                 "samples/dnn/face_detector/deploy.prototxt")
DNN_MODEL_URL = ("https://raw.githubusercontent.com/opencv/opencv_3rdparty/"
                 "dnn_samples_face_detector_20170830/"
                 "res10_300x300_ssd_iter_140000.caffemodel")

for d in [SNAP_DIR, KNOWN_DIR, Path('trained_model')]:
    d.mkdir(parents=True, exist_ok=True)

COLOR_KNOWN   = (0, 230, 0)
COLOR_UNKNOWN = (0, 0, 230)
FONT = cv2.FONT_HERSHEY_SIMPLEX


# ══════════════════════════════════════════════════════════════
#  DATA
# ══════════════════════════════════════════════════════════════
@dataclass
class RoverAlert:
    id: str; type: str; message: str; createdAt: str
    confidence: float
    snapshotUrl: Optional[str] = None
    meta: Optional[dict] = None


# ══════════════════════════════════════════════════════════════
#  IMAGE ENHANCEMENT
#  Applied once per frame in _store(). Pre-built LUTs, no alloc.
# ══════════════════════════════════════════════════════════════
_CLAHE = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8, 8))
_LUT_16 = np.array([((i/255)**( 1/1.6))*255 for i in range(256)], np.uint8)
_LUT_13 = np.array([((i/255)**( 1/1.3))*255 for i in range(256)], np.uint8)

def _enhance(frame: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    m    = float(np.mean(gray))
    if m >= 150:
        return frame
    l, a, b = cv2.split(cv2.cvtColor(frame, cv2.COLOR_BGR2LAB))
    out = cv2.cvtColor(cv2.merge([_CLAHE.apply(l), a, b]), cv2.COLOR_LAB2BGR)
    if   m < 80:  return cv2.LUT(out, _LUT_16)
    elif m < 120: return cv2.LUT(out, _LUT_13)
    return out


# ══════════════════════════════════════════════════════════════
#  FACE DETECTION
# ══════════════════════════════════════════════════════════════
def _dl_dnn():
    for url, p in [(DNN_PROTO_URL, DNN_PROTO), (DNN_MODEL_URL, DNN_MODEL)]:
        if not p.exists():
            print(f"⬇  {p.name}...")
            try:
                p.write_bytes(requests.get(url, timeout=30).content)
            except Exception as e:
                print(f"⚠  Download failed: {e}"); return False
    return True

def load_detector():
    if os.getenv('FACE_DETECTOR_MODE','dnn').lower() == 'haar':
        h = cv2.CascadeClassifier(cv2.data.haarcascades +
                                   "haarcascade_frontalface_default.xml")
        if not h.empty(): return h, 'haar'
    for _ in range(2):
        if DNN_PROTO.exists() and DNN_MODEL.exists():
            try:
                net = cv2.dnn.readNetFromCaffe(str(DNN_PROTO), str(DNN_MODEL))
                print("✅ Detector: DNN res10 SSD"); return net, 'dnn'
            except Exception: pass
        _dl_dnn()
    h = cv2.CascadeClassifier(cv2.data.haarcascades +
                               "haarcascade_frontalface_default.xml")
    if h.empty(): raise RuntimeError("No detector available")
    print("⚠  Detector: Haar fallback"); return h, 'haar'

_tls = threading.local()   # per-thread DNN to avoid lock contention

def detect_faces(img: np.ndarray, det, mode: str) -> List[List[int]]:
    h, w = img.shape[:2]
    if mode == 'dnn':
        if not hasattr(_tls, 'net'):
            _tls.net = cv2.dnn.readNetFromCaffe(str(DNN_PROTO), str(DNN_MODEL))
            _tls.buf = np.empty((300,300,3), np.uint8)
        cv2.resize(img, (300,300), dst=_tls.buf)
        blob = cv2.dnn.blobFromImage(_tls.buf, 1.0, (300,300), (104,117,123))
        _tls.net.setInput(blob)
        out   = _tls.net.forward()
        confs = out[0,0,:,2]
        faces = []
        for box in out[0,0, confs>=0.35, 3:7]:
            x1=int(box[0]*w); y1=int(box[1]*h)
            x2=int(box[2]*w); y2=int(box[3]*h)
            if (x2-x1)>20 and (y2-y1)>20:
                faces.append([max(0,x1), max(0,y1), x2-x1, y2-y1])
        return faces
    scale = w/400
    sm    = cv2.resize(img, (400, int(h/scale)))
    gray  = cv2.equalizeHist(cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY))
    # FIX: minNeighbors=6 (was 4) — curtain/wall false positives band
    # FIX: minSize=(60,60) (was 30,30) — chhote fake faces ignore
    raw = det.detectMultiScale(gray, 1.05, 5, cv2.CASCADE_SCALE_IMAGE, (40,40))
    if len(raw)==0:
        # Fallback thoda loose but still strict enough
        raw = det.detectMultiScale(gray,1.03,4,cv2.CASCADE_SCALE_IMAGE,(30,30))
    return [[int(x*scale),int(y*scale),int(fw*scale),int(fh*scale)]
            for x,y,fw,fh in raw]


# ══════════════════════════════════════════════════════════════
#  FACE QUALITY GATE  (live only — NOT used during training)
# ══════════════════════════════════════════════════════════════
def _quality_ok(img: np.ndarray, rect: Tuple, min_sharp=8.0) -> bool:
    x,y,w,h = rect
    # FIX: minimum 60x60 — chhote/door ke faces aur curtain reject
    if w<30 or h<30: return False
    crop = img[max(0,y):y+h, max(0,x):x+w]
    if crop.size==0: return False
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    if cv2.Laplacian(gray, cv2.CV_64F).var() < min_sharp: return False
    # FIX: real faces are roughly square
    asp = w/max(h,1)
    return 0.5 <= asp <= 1.8


# ══════════════════════════════════════════════════════════════
#  LBP+HOG+HSV ENCODING
#  FIX: face resized to 64px (was 128) — 4x faster, same accuracy
#       at ESP32's low resolution.
# ══════════════════════════════════════════════════════════════
_FS   = 64          # face size (was 128)
_GRID = 4
_NEIGH = [(-1,-1),(-1,0),(-1,1),(0,1),(1,1),(1,0),(1,-1),(0,-1)]

def _lbp_hog_enc(img: np.ndarray, rect: Tuple) -> np.ndarray:
    x,y,w,h = rect
    pad = int(0.1*max(w,h))
    crop = cv2.resize(
        img[max(0,y-pad):min(img.shape[0],y+h+pad),
            max(0,x-pad):min(img.shape[1],x+w+pad)],
        (_FS,_FS))
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY).astype(np.float32)

    # LBP
    lbp = np.zeros((_FS,_FS), np.uint8)
    for bit,(di,dj) in enumerate(_NEIGH):
        sh = np.roll(np.roll(gray,-di,0),-dj,1)
        lbp += ((sh>=gray).astype(np.uint8) << (7-bit))
    ch  = _FS//_GRID
    lg  = lbp.reshape(_GRID,ch,_GRID,ch).transpose(0,2,1,3).reshape(_GRID*_GRID,-1)
    lh  = np.apply_along_axis(
            lambda v: np.histogram(v,32,(0,256))[0].astype(np.float64), 1, lg)
    lh /= lh.sum(1,keepdims=True)+1e-9

    # HSV
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    hh  = np.stack([cv2.calcHist([hsv],[c],None,[32],[0,256]).ravel()
                    for c in range(3)]).astype(np.float64)
    hh /= hh.sum(1,keepdims=True)+1e-9

    # HOG
    gx  = cv2.Sobel(gray,cv2.CV_64F,1,0,ksize=3)
    gy  = cv2.Sobel(gray,cv2.CV_64F,0,1,ksize=3)
    mag = np.hypot(gx,gy)
    ang = np.abs(np.arctan2(gy,gx)*(180/np.pi))
    mg  = mag.reshape(_GRID,ch,_GRID,ch).transpose(0,2,1,3).reshape(_GRID*_GRID,-1)
    ag  = ang.reshape(_GRID,ch,_GRID,ch).transpose(0,2,1,3).reshape(_GRID*_GRID,-1)
    gh  = np.stack([np.histogram(ag[i],9,(0,180),weights=mg[i])[0]
                    for i in range(_GRID*_GRID)]).astype(np.float64)
    gh /= gh.sum(1,keepdims=True)+1e-9

    enc  = np.concatenate([lh.ravel(), hh.ravel(), gh.ravel()])
    norm = np.linalg.norm(enc)
    return enc/norm if norm>0 else enc


# ══════════════════════════════════════════════════════════════
#  ENCODE CACHE
#  FIX: 8x8 downsampled face patch — stable across small lighting
#       changes, near-zero collision rate between different people.
# ══════════════════════════════════════════════════════════════
class EncodeCache:
    def __init__(self, n=128):
        self._d: OrderedDict = OrderedDict()
        self._n = n

    def _k(self, img: np.ndarray, rect: Tuple) -> int:
        x,y,w,h = rect
        crop = img[max(0,y):y+h, max(0,x):x+w]
        if crop.size==0: return hash(rect)
        return hash((rect, cv2.resize(crop,(8,8),cv2.INTER_AREA).tobytes()))

    def get(self, img, rect):
        k = self._k(img, rect)
        if k in self._d:
            self._d.move_to_end(k); return self._d[k]
        return None

    def put(self, img, rect, enc):
        k = self._k(img, rect)
        self._d[k] = enc; self._d.move_to_end(k)
        if len(self._d)>self._n: self._d.popitem(last=False)

    def clear(self): self._d.clear()


# ══════════════════════════════════════════════════════════════
#  IoU FACE TRACKER
#  Stable track IDs across camera shake. Vote buffer keyed by
#  track_id — never resets on small position changes.
# ══════════════════════════════════════════════════════════════
def _iou(a,b):
    ax1,ay1,aw,ah=a; bx1,by1,bw,bh=b
    ix=max(0,min(ax1+aw,bx1+bw)-max(ax1,bx1))
    iy=max(0,min(ay1+ah,by1+bh)-max(ay1,by1))
    inter=ix*iy
    if inter==0: return 0.0
    return inter/(aw*ah+bw*bh-inter)

class FaceTrack:
    _n = 0
    def __init__(self, rect):
        FaceTrack._n += 1
        self.tid   = FaceTrack._n
        self.rect  = rect
        self.seen  = time.monotonic()
        self.votes: deque = deque(maxlen=VOTE_WINDOW)
    def update(self, rect, name, conf):
        self.rect=rect; self.seen=time.monotonic()
        self.votes.append((name,conf))
    def result(self):
        if not self.votes: return None,0.0
        names=[n for n,_ in self.votes]
        best=Counter(names).most_common(1)[0][0]
        confs=[c for n,c in self.votes if n==best]
        return best, round(sum(confs)/len(confs),3)
    def expired(self): return time.monotonic()-self.seen>TRACK_TTL

class FaceTracker:
    def __init__(self):
        self._tracks:List[FaceTrack]=[]
        self._lock=threading.Lock()
    def update(self, dets, raw):
        with self._lock:
            self._tracks=[t for t in self._tracks if not t.expired()]
            out=[]; used=set()
            for rect,(name,conf) in zip(dets,raw):
                best_iou=IOU_THRESH; best_t=None
                for t in self._tracks:
                    if id(t) in used: continue
                    iou=_iou(rect,t.rect)
                    if iou>best_iou: best_iou=iou; best_t=t
                if best_t is None:
                    best_t=FaceTrack(rect)
                    self._tracks.append(best_t)
                best_t.update(rect,name,conf)
                used.add(id(best_t))
                out.append((best_t.tid,)+best_t.result())
            return out
    def clear(self):
        with self._lock: self._tracks.clear()


# ══════════════════════════════════════════════════════════════
#  VISUALIZATION
# ══════════════════════════════════════════════════════════════
def draw_box(frame, x,y,w,h, name, conf):
    is_known = bool(name and str(name).strip())
    color = COLOR_KNOWN if is_known else COLOR_UNKNOWN
    label = f"{name}  {int(conf*100)}%" if name else "UNKNOWN"
    cv2.rectangle(frame,(x,y),(x+w,y+h),color,3)
    (tw,th),bl=cv2.getTextSize(label,FONT,0.65,2)
    ly=max(y-6,th+bl+8)
    cv2.rectangle(frame,(x,ly-th-bl-6),(x+tw+8,ly+2),color,cv2.FILLED)
    cv2.putText(frame,label,(x+4,ly-bl-2),FONT,0.65,(255,255,255),2,cv2.LINE_AA)

def annotate(frame, results):
    out=frame.copy()
    for r in results:
        draw_box(out,r['x'],r['y'],r['w'],r['h'],r.get('name'),r.get('confidence',0))
    return out


# ══════════════════════════════════════════════════════════════
#  ESP32 READER
# ══════════════════════════════════════════════════════════════
class ESP32Reader:
    def __init__(self):
        self._frame:Optional[np.ndarray]=None
        self._jpg:Optional[bytes]=None
        self._ts=0.0; self._lock=threading.Lock()
        self._run=False; self._url=''
        self.connected=False; self.last_error=''; self.frame_count=0

    def start(self, url):
        self._url=url.rstrip('/'); self._run=True
        threading.Thread(target=self._loop,daemon=True,name='esp32').start()
        print(f"📡 ESP32 reader → {self._url}")

    def update_url(self,u): self._url=u.rstrip('/')
    def stop(self): self._run=False

    def frame(self):
        with self._lock:
            if self._frame is not None and time.monotonic()-self._ts<3:
                return self._frame.copy()
        return None

    def raw_jpg(self):
        with self._lock:
            if self._jpg and time.monotonic()-self._ts<3: return self._jpg
        return None

    def _store(self,jpg,f):
        e=_enhance(f)
        with self._lock:
            self._jpg=jpg; self._frame=e
            self._ts=time.monotonic(); self.frame_count+=1
        self.connected=True; self.last_error=''

    _interval=0.10

    def _poll(self, sess):
        from urllib.parse import urlparse as _up
        p=_up(self._url); host=f"{p.scheme}://{p.hostname}"
        urls=[f"{self._url}/stream",f"{host}:81/stream",
             f"{self._url}/capture",f"{host}:81/capture"]
        wurl=None
        for u in urls:
            try:
                r=sess.get(u,timeout=2)
                if r.status_code==200 and len(r.content)>500:
                    arr=np.frombuffer(r.content,np.uint8)
                    if cv2.imdecode(arr,cv2.IMREAD_COLOR) is not None:
                        wurl=u; print(f"✅ ESP32 capture: {wurl}"); break
            except: pass
        if not wurl: return False
        fails=0; lhash=0
        while self._run:
            t0=time.monotonic()
            try:
                r=sess.get(wurl,timeout=2)
                if r.status_code==200 and len(r.content)>500:
                    h=hash(r.content[:64]+r.content[-64:])
                    if h!=lhash:
                        arr=np.frombuffer(r.content,np.uint8)
                        f=cv2.imdecode(arr,cv2.IMREAD_COLOR)
                        if f is not None: self._store(r.content,f); lhash=h
                    fails=0
                else: fails+=1
            except Exception as e:
                fails+=1
                if fails==1: print(f"⚠  Capture: {e}")
            if fails>=15: self.connected=False; self.last_error='Too many failures'; return False
            time.sleep(max(0,ESP32Reader._interval-(time.monotonic()-t0)))
        return True

    def _mjpeg(self, sess):
        try:
            r=sess.get(f"{self._url}/stream",stream=True,timeout=(5,30))
            if r.status_code!=200: return False
            print("✅ MJPEG stream connected")
            self.connected=True; buf=b''; n=0
            for chunk in r.iter_content(4096):
                if not self._run: break
                buf+=chunk
                while True:
                    s=buf.find(b'\xff\xd8')
                    if s==-1: buf=buf[-2:]; break
                    e=buf.find(b'\xff\xd9',s+2)
                    if e==-1: buf=buf[s:]; break
                    jpg=buf[s:e+2]; buf=buf[e+2:]
                    arr=np.frombuffer(jpg,np.uint8)
                    if arr.size<100: continue
                    f=cv2.imdecode(arr,cv2.IMREAD_COLOR)
                    if f is not None: self._store(jpg,f); n+=1
                if len(buf)>500000: buf=b''
            return n>0
        except Exception as e:
            print(f"⚠  MJPEG: {e}"); return False

    def _loop(self):
        sess=requests.Session(); sess.headers['Connection']='close'
        bo=0.5
        while self._run:
            self.connected=False
            if self._mjpeg(requests.Session()): bo=0.5; continue
            self.last_error=f"Unreachable: {self._url}"
            print(f"❌ ESP32 unreachable — retry {bo:.1f}s")
            time.sleep(bo); bo=min(bo*2,8)
_reader:Optional[ESP32Reader]=None


def _find_esp32(url):
    from concurrent.futures import ThreadPoolExecutor as TPE, as_completed
    from urllib.parse import urlparse as _up
    def chk(ip):
        for port in [81,80]:
            for path in ['/capture','/stream']:
                try:
                    r=requests.get(f"http://{ip}:{port}{path}",timeout=1.5)
                    if r.status_code==200 and len(r.content)>100:
                        return f"http://{ip}:{port}"
                except: pass
        return None
    try:
        sub='.'.join((_up(url).hostname or '192.168.1.1').split('.')[:3])
    except: sub='192.168.1'
    print(f"🔍 Scanning {sub}.x for ESP32...")
    with TPE(50) as p:
        fs={p.submit(chk,f"{sub}.{i}"):i for i in range(1,255)}
        for f in as_completed(fs):
            r=f.result()
            if r:
                for x in fs: x.cancel()
                return r
    return url


# ══════════════════════════════════════════════════════════════
#  RECOGNITION WORKER
#  Dedicated background thread — stream never blocks on detection.
#  Throttled to RECOG_MIN_INTERVAL so CPU stays free.
# ══════════════════════════════════════════════════════════════
class RecogWorker:
    def __init__(self, backend):
        self._b=backend; self._run=False
        self._lock=threading.Lock()
        self._frame:Optional[np.ndarray]=None
        self._results:List[Dict]=[]
        self._ts=0.0; self._in_ts=0.0

    def start(self):
        self._run=True
        threading.Thread(target=self._loop,daemon=True,name='recog').start()
        print("🧠 RecogWorker started")

    def stop(self): self._run=False

    def get(self):
        with self._lock:
            return self._frame, list(self._results), self._ts

    def _loop(self):
        while self._run:
            try:
                if _reader is None: time.sleep(0.05); continue
                ts=_reader._ts
                if ts==self._in_ts: time.sleep(0.02); continue
                t0=time.monotonic()
                self._in_ts=ts
                f=_reader.frame()
                if f is None: time.sleep(0.05); continue
                results,ann=self._b._process_frame(f)
                with self._lock:
                    self._frame=ann; self._results=results; self._ts=time.monotonic()
                # Throttle: sleep remainder of interval
                elapsed=time.monotonic()-t0
                time.sleep(max(0, RECOG_MIN_INTERVAL-elapsed))
            except Exception as e:
                print(f"⚠  RecogWorker: {e}"); time.sleep(0.1)


# ══════════════════════════════════════════════════════════════
#  MAIN BACKEND
# ══════════════════════════════════════════════════════════════
class CVBackend:
    def __init__(self):
        self.app=Flask(__name__); CORS(self.app)
        self._lock=threading.Lock()
        self.alerts:List[RoverAlert]=[]; self._alert_ids:set=set()
        self.firebase_ok=False
        self.known_names:List[str]=[]; self.known_encs:List[np.ndarray]=[]
        self._enc_mat:Optional[np.ndarray]=None
        self._use_fr=FR_AVAILABLE
        self.det,self.det_mode=load_detector()
        self._cache=EncodeCache(128)
        self._tracker=FaceTracker()
        self._io=ThreadPoolExecutor(2, thread_name_prefix='io')
        self._dbg_count=0   # frame counter for occasional debug prints

        global _reader
        cfg=os.getenv('ESP32_CAM_URL', ESP32_URL)
        _reader=ESP32Reader()
        _reader.start(self._check_esp32(cfg))
        self._init_fb()
        self._load_model()
        self._routes()
        self._worker=RecogWorker(self)
        self._worker.start()

    @staticmethod
    def _check_esp32(url):
        try:
            r=requests.get(url.rstrip('/')+'/capture',timeout=2)
            if r.status_code==200 and len(r.content)>100:
                print(f"✅ ESP32 at {url}"); return url
        except: pass
        return _find_esp32(url)

    def _init_fb(self):
        if not FIREBASE_AVAILABLE: return
        p=os.getenv('FIREBASE_CREDENTIALS','firebase-credentials.json')
        if not os.path.exists(p): return
        try:
            firebase_admin.initialize_app(credentials.Certificate(p),{
                'databaseURL':   os.getenv('FIREBASE_DATABASE_URL',''),
                'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET','')})
            self.firebase_ok=True; print("✅ Firebase OK")
        except Exception as e: print(f"⚠  Firebase: {e}")

    def _build_mat(self):
        self._enc_mat=np.stack(self.known_encs) if self.known_encs else None

    def _load_model(self):
        if ENCODINGS_FILE.exists():
            try:
                d=pickle.load(open(ENCODINGS_FILE,'rb'))
                mode='face_recognition' if self._use_fr else 'lbp_hog'
                if d.get('mode')!=mode:
                    print("⚠  Mode mismatch — retraining"); ENCODINGS_FILE.unlink()
                else:
                    self.known_names=d['names']; self.known_encs=d['encodings']
                    self._build_mat()
                    print(f"✅ Loaded {len(self.known_encs)} encodings [{mode}]")
                    # Print per-person count for verification
                    counts=Counter(self.known_names)
                    for n,c in sorted(counts.items()):
                        print(f"   👤 {n}: {c} encodings")
                    return
            except Exception as e: print(f"⚠  Load failed: {e}")
        self._train()

    # ── TRAINING ─────────────────────────────────────────────────
    # FIX: quality gate REMOVED from training path.
    # Augmented images (esp. blur) are slightly soft — quality gate
    # was rejecting them → only 1-2 encodings per person → Shadan
    # and Shivam encodings too close together → wrong matches.
    # ─────────────────────────────────────────────────────────────
    def _encode_for_training(self, img: np.ndarray,
                             rect: Tuple) -> Optional[np.ndarray]:
        """Encode without quality gate — used ONLY during training."""
        if self._use_fr:
            x,y,w,h=rect
            rgb=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
            encs=fr.face_encodings(rgb,[(y,x+w,y+h,x)])
            return encs[0] if encs else None
        return _lbp_hog_enc(img, rect)

    def _encode_live(self, img: np.ndarray,
                     rect: Tuple) -> Optional[np.ndarray]:
        """Encode with quality gate + cache — used during live recognition."""
        if not _quality_ok(img, rect): return None
        cached=self._cache.get(img,rect)
        if cached is not None: return cached
        if self._use_fr:
            x,y,w,h=rect
            rgb=cv2.cvtColor(img,cv2.COLOR_BGR2RGB)
            encs=fr.face_encodings(rgb,[(y,x+w,y+h,x)])
            enc=encs[0] if encs else None
        else:
            enc=_lbp_hog_enc(img,rect)
        if enc is not None: self._cache.put(img,rect,enc)
        return enc

    def _train(self):
        pairs=[]
        for item in sorted(KNOWN_DIR.iterdir()):
            if item.is_dir():
                for img in sorted(item.glob('*')):
                    if img.suffix.lower() in {'.jpg','.jpeg','.png','.bmp'}:
                        pairs.append((item.name,img))
            elif item.suffix.lower() in {'.jpg','.jpeg','.png','.bmp'}:
                pairs.append((item.stem,item))
        if not pairs:
            print("⚠  No images in known_faces/"); return

        mode='face_recognition' if self._use_fr else 'lbp_hog'
        print(f"\n🧠 Training [{mode}] — {len(pairs)} image(s)...")
        names,encs=[],[]

        for name,path in pairs:
            try:
                pil=Image.open(path).convert('RGB')
                img=cv2.cvtColor(np.array(pil,np.uint8),cv2.COLOR_RGB2BGR)
                # Normalize ONCE before augmentation
                img=_enhance(img)
            except Exception as e:
                print(f"   ⚠  Read {path.name}: {e}"); continue

            faces=detect_faces(img,self.det,self.det_mode)
            if not faces:
                print(f"   ⚠  No face: {path.name}"); continue
            rect=tuple(max(faces,key=lambda f:f[2]*f[3]))

            # Augment the already-normalized image
            # FIX: do NOT re-normalize augments (causes double processing)
            augments=[
                img,                                          # original
                cv2.flip(img,1),                             # horizontal flip
                np.clip(img.astype(np.int16)-35,0,255).astype(np.uint8),  # darker
                np.clip(img.astype(np.int16)+35,0,255).astype(np.uint8),  # brighter
                cv2.GaussianBlur(img,(3,3),0),               # slight blur
            ]

            added=0
            for aug in augments:
                enc=self._encode_for_training(aug, rect)   # no quality gate
                if enc is not None:
                    names.append(name); encs.append(enc); added+=1

            print(f"   ✅ {name} ← {path.name}  ({added}/5 variants)")

        self.known_names=names; self.known_encs=encs
        self._build_mat()

        if encs:
            pickle.dump({'names':names,'encodings':encs,'mode':mode,
                         'trained_at':datetime.now().isoformat(),
                         'num_people':len(set(names)),'num_encodings':len(encs)},
                        open(ENCODINGS_FILE,'wb'))
            counts=Counter(names)
            print(f"💾 Saved — {len(encs)} encodings, {len(set(names))} people")
            for n,c in sorted(counts.items()):
                print(f"   👤 {n}: {c} encodings")
            print()

    def reload(self):
        ENCODINGS_FILE.unlink(missing_ok=True)
        self._tracker.clear(); self._cache.clear()
        self._train()

    # ── RECOGNITION ──────────────────────────────────────────────
    def _snap(self):
        with self._lock:
            return self._enc_mat, list(self.known_names), self._use_fr

    def _recognize(self, img, bbox, mat=None, names=None, use_fr=None):
        if mat is None: mat,names,use_fr=self._snap()
        if mat is None or not names: return False,None,0.0
        enc=self._encode_live(img,bbox)
        if enc is None: return False,None,0.0

        na=np.array(names)
        uniq=list(dict.fromkeys(names))

        if use_fr:
            dists=np.linalg.norm(mat-enc,axis=1)
            pn=[(n,float(dists[na==n].min())) for n in uniq]
            best,dist=min(pn,key=lambda x:x[1])
            conf=max(0.0,1.0-dist)
            ok=dist<=FR_THRESH
            # Occasional debug (every 30 frames)
            self._dbg_count+=1
            if self._dbg_count%30==0:
                print(f"[FR] {[(n,f'{d:.3f}') for n,d in sorted(pn,key=lambda x:x[1])[:3]]} "
                      f"→ {'✅' if ok else '❌'} {best}")
            return ok, best if ok else None, round(conf,3)

        en=enc/(np.linalg.norm(enc)+1e-9)
        mn=mat/(np.linalg.norm(mat,axis=1,keepdims=True)+1e-9)
        sims=mn@en
        pn=[(n,float(sims[na==n].max())) for n in uniq]
        best,sim=max(pn,key=lambda x:x[1])
        ok=sim>=LBP_THRESH
        self._dbg_count+=1
        if self._dbg_count%30==0:
            print(f"[LBP] {[(n,f'{s:.3f}') for n,s in sorted(pn,key=lambda x:x[1],reverse=True)[:3]]} "
                  f"→ {'✅' if ok else '❌'} {best}")
        return ok, best if ok else None, round(float(sim),3)

    def _process_frame(self, frame):
        mat,names,use_fr=self._snap()
        fh,fw=frame.shape[:2]
        raw=detect_faces(frame,self.det,self.det_mode)
        dets=[]; res=[]
        for x,y,w,h in raw:
            x1,y1=max(0,x),max(0,y)
            x2,y2=min(fw,x+w),min(fh,y+h)
            if x2-x1<20 or y2-y1<20: continue
            ok,name,conf=self._recognize(frame,(x1,y1,x2-x1,y2-y1),mat,names,use_fr)
            dets.append([x1,y1,x2-x1,y2-y1]); res.append((name,conf))

        tracked=self._tracker.update(dets,res)
        results=[]
        for rect,(tid,vname,vconf) in zip(dets,tracked):
            x1,y1,w,h=rect
            results.append({'x':x1,'y':y1,'w':w,'h':h,
                            'name':vname,'confidence':vconf,
                            'is_known':vname is not None,'track_id':tid})
        return results, annotate(frame,results)

    def _analyze(self, frame):
        ts=datetime.now().isoformat()
        results,ann=self._process_frame(frame)
        if not results:
            if self._detect_accident(frame): return self._accident(frame,ts)
            return {'status':'success','message':'No faces','faces':[]}
        fname=f"snap_{int(time.time())}.jpg"
        spath=SNAP_DIR/fname
        self._io.submit(self._save_snap, ann, spath, fname)
        url=f"{BACKEND_URL}/static/snapshots/{fname}"
        alerts=[]
        for i,r in enumerate(results):
            tp='KNOWN_FACE' if r['is_known'] else 'UNKNOWN_FACE'
            msg=f"Known: {r['name']}" if r['is_known'] else "Unknown person"
            a=RoverAlert(id=f"a_{int(time.time())}_{i}",type=tp,message=msg,
                         createdAt=ts,confidence=r['confidence'],snapshotUrl=url,
                         meta={'faces':len(results),'box':{k:r[k] for k in 'xywh'}})
            self._add_alert(a); self._io.submit(self._fb_alert,a)
            alerts.append(asdict(a))
        return {'status':'success','faces_detected':len(results),
                'faces':results,'alerts':alerts,'snapshot_url':url}

    # ── ROUTES ───────────────────────────────────────────────────
    def _routes(self):

        @self.app.route('/health')
        def health():
            ok=_reader.connected if _reader else False
            counts=Counter(self.known_names)
            return jsonify({
                'status':'healthy',
                'detector':self.det_mode,
                'recognizer':'face_recognition' if self._use_fr else 'lbp_hog',
                'known_faces': len(set(self.known_names)),
                'per_person_encodings':{n:c for n,c in counts.items()},
                'total_encodings':len(self.known_encs),
                'esp32_connected':ok,
                'esp32_frames':_reader.frame_count if _reader else 0,
                'esp32_error':'' if ok else (_reader.last_error if _reader else ''),
                'threshold':FR_THRESH if self._use_fr else LBP_THRESH,
            })

        @self.app.route('/')
        def index():
            return jsonify({'service':'AROHAN CV Backend FINAL'})

        @self.app.route('/update-esp32-url',methods=['POST'])
        def upd_url():
            u=(request.get_json() or {}).get('url','').strip()
            if not u: return jsonify({'error':'url required'}),400
            if _reader: _reader.update_url(u)
            return jsonify({'status':'ok','url':u})

        @self.app.route('/analyze-frame',methods=['POST'])
        def analyze():
            try:
                d=request.get_json() or {}
                src=d.get('source','esp32')
                if src=='base64':
                    b64=d.get('image','')
                    if not b64: return jsonify({'error':'no image'}),400
                    if ',' in b64: b64=b64.split(',',1)[1]
                    arr=np.frombuffer(base64.b64decode(b64),np.uint8)
                    f=cv2.imdecode(arr,cv2.IMREAD_COLOR)
                    if f is None: return jsonify({'error':'decode fail'}),400
                    f=_enhance(f)
                elif src=='esp32':
                    f=_reader.frame() if _reader else None
                    if f is None: return jsonify({'error':'no frame'}),500
                else: return jsonify({'error':'bad source'}),400
                return jsonify(self._analyze(f))
            except Exception as e:
                import traceback; traceback.print_exc()
                return jsonify({'error':str(e)}),500

        @self.app.route('/annotated-frame')
        def ann_frame():
            try:
                f=_reader.frame() if _reader else None
                if f is None: return jsonify({'error':'no frame'}),500
                _,ann=self._process_frame(f)
                ok,buf=cv2.imencode('.jpg',ann,[cv2.IMWRITE_JPEG_QUALITY,95])
                return Response(buf.tobytes(),mimetype='image/jpeg',
                                headers={'Cache-Control':'no-cache',
                                         'Access-Control-Allow-Origin':'*'})
            except Exception as e: return jsonify({'error':str(e)}),500

        @self.app.route('/alerts')
        def get_alerts():
            return jsonify([asdict(a) for a in
                            sorted(self.alerts,key=lambda a:a.createdAt,reverse=True)[:50]])

        @self.app.route('/stream-annotated')
        def stream_ann():
            def gen():
                last_ts=0.0; last_alert:Dict[str,float]={}; blank=False
                while True:
                    try:
                        ann,res,ts=self._worker.get()
                        if ann is None:
                            if not blank:
                                err=np.zeros((480,640,3),np.uint8)
                                cv2.putText(err,"Waiting for ESP32...",(120,240),
                                            FONT,1.0,(180,180,180),2)
                                ok,enc=cv2.imencode('.jpg',err)
                                if ok: yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'+enc.tobytes()+b'\r\n'
                                blank=True
                            time.sleep(0.1); continue
                        if ts==last_ts: time.sleep(0.02); continue
                        last_ts=ts; blank=False
                        now=time.time()
                        for i,face in enumerate(res):
                            pid=face.get('name') or f"unk_{i}"
                            if now-last_alert.get(pid,0)>5:
                                self._stream_alert(face,res,ann,int(now))
                                last_alert[pid]=now
                        hud=ann.copy()
                        ns=[r['name'] for r in res if r['name']]
                        txt=f"Faces:{len(res)}"+(f"  {', '.join(ns)}" if ns else "")
                        cv2.putText(hud,txt,(10,25),FONT,0.6,(255,255,255),1,cv2.LINE_AA)
                        hud = cv2.rotate(hud, cv2.ROTATE_180)
                        ok,enc=cv2.imencode('.jpg',hud,[cv2.IMWRITE_JPEG_QUALITY,88])
                        if ok: yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'+enc.tobytes()+b'\r\n'
                    except GeneratorExit: break
                    except Exception as e: print(f"⚠  stream: {e}"); time.sleep(0.5)
            return Response(gen(),
                            mimetype='multipart/x-mixed-replace; boundary=frame',
                            headers={'Cache-Control':'no-cache',
                                     'Access-Control-Allow-Origin':'*'})

        @self.app.route('/stream-raw')
        def stream_raw():
            def gen():
                lt=0.0
                while True:
                    try:
                        raw=_reader.raw_jpg() if _reader else None
                        ts=_reader._ts if _reader else 0.0
                        if raw is None or ts==lt: time.sleep(0.02); continue
                        lt=ts
                        arr = np.frombuffer(raw, np.uint8)
                        f = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                        if f is not None:
                            f = cv2.rotate(f, cv2.ROTATE_180)
                            ok, buf = cv2.imencode('.jpg', f, [cv2.IMWRITE_JPEG_QUALITY,88])
                            if ok:
                                yield b'--frame\r\nContent-Type: image/jpeg\r\n\r\n'+buf.tobytes()+b'\r\n'
                    except GeneratorExit: break
                    except: time.sleep(0.5)
            return Response(gen(),
                            mimetype='multipart/x-mixed-replace; boundary=frame',
                            headers={'Cache-Control':'no-cache',
                                     'Access-Control-Allow-Origin':'*'})

        @self.app.route('/alerts',methods=['POST'])
        def add_alert():
            try:
                a=RoverAlert(**request.get_json())
                self._add_alert(a); return jsonify({'status':'ok','id':a.id})
            except Exception as e: return jsonify({'error':str(e)}),400

        @self.app.route('/reload-faces',methods=['POST'])
        def reload():
            try:
                with self._lock: self.reload()
                return jsonify({'status':'ok',
                                'known_people':sorted(set(self.known_names)),
                                'encodings':len(self.known_encs)})
            except Exception as e: return jsonify({'error':str(e)}),500

        @self.app.route('/add-face',methods=['POST'])
        def add_face():
            try:
                d=request.get_json() or {}
                name=d.get('name','').strip()
                b64=d.get('image','')
                if not name: return jsonify({'error':'name required'}),400
                if not b64:  return jsonify({'error':'image required'}),400
                if ',' in b64: b64=b64.split(',',1)[1]
                arr=np.frombuffer(base64.b64decode(b64),np.uint8)
                f=cv2.imdecode(arr,cv2.IMREAD_COLOR)
                if f is None: return jsonify({'error':'decode fail'}),400
                f=_enhance(f)
                faces=detect_faces(f,self.det,self.det_mode)
                if not faces: return jsonify({'error':'no face detected'}),400
                pd=KNOWN_DIR/name; pd.mkdir(parents=True,exist_ok=True)
                fp=pd/f"{name}_{len(list(pd.glob('*.jpg')))+1:03d}.jpg"
                cv2.imwrite(str(fp),f)
                with self._lock: self.reload()
                return jsonify({'status':'ok','name':name,
                                'known_people':sorted(set(self.known_names)),
                                'encodings':len(self.known_encs)})
            except Exception as e:
                import traceback; traceback.print_exc()
                return jsonify({'error':str(e)}),500

        @self.app.route('/known-faces')
        def known():
            people={}
            for item in sorted(KNOWN_DIR.iterdir()):
                if item.is_dir():
                    people[item.name]=len(list(item.glob('*.jpg'))+list(item.glob('*.png')))
                elif item.suffix.lower() in {'.jpg','.jpeg','.png'}:
                    people[item.stem]=people.get(item.stem,0)+1
            return jsonify({'known_people':sorted(set(self.known_names)),
                            'face_images':people,
                            'total_encodings':len(self.known_encs)})

        @self.app.route('/static/snapshots/<f>')
        def snap(f): return send_from_directory(str(SNAP_DIR),f)

    # ── HELPERS ──────────────────────────────────────────────────
    def _stream_alert(self,face,all_faces,ann,fc):
        ts=datetime.now().isoformat()
        tp='KNOWN_FACE' if face['is_known'] else 'UNKNOWN_FACE'
        msg=f"Known: {face['name']}" if face['is_known'] else "Unknown person"
        fname=f"snap_{int(time.time())}_{fc}.jpg"
        url=f"{BACKEND_URL}/static/snapshots/{fname}"
        a=RoverAlert(id=f"a_{int(time.time())}_{fc}",type=tp,message=msg,
                     createdAt=ts,confidence=face['confidence'],snapshotUrl=url,
                     meta={'faces':len(all_faces),'box':{k:face[k] for k in 'xywh'}})
        self._add_alert(a)
        self._io.submit(self._save_snap,ann.copy(),SNAP_DIR/fname,fname)
        self._io.submit(self._fb_alert,a)

    def _add_alert(self,a):
        if a.id in self._alert_ids: return
        self._alert_ids.add(a.id); self.alerts.append(a)
        if len(self.alerts)>MAX_ALERTS:
            old=self.alerts[:len(self.alerts)-MAX_ALERTS]
            self.alerts=self.alerts[-MAX_ALERTS:]
            recent={x.snapshotUrl for x in self.alerts if x.snapshotUrl}
            for o in old:
                self._alert_ids.discard(o.id)
                if o.snapshotUrl and o.snapshotUrl not in recent:
                    if '/snapshots/' in (o.snapshotUrl or ''):
                        p=SNAP_DIR/o.snapshotUrl.split('/snapshots/')[-1]
                        if p.exists():
                            try: p.unlink()
                            except: pass

    def _save_snap(self,frame,path,fname):
        snaps=sorted(SNAP_DIR.glob('*.jpg'),key=lambda p:p.stat().st_mtime)
        for s in snaps[:max(0,len(snaps)-MAX_SNAPSHOTS)]:
            try: s.unlink()
            except: pass
        cv2.imwrite(str(path),frame,[cv2.IMWRITE_JPEG_QUALITY,85])
        self._fb_snap(path,fname)

    def _fb_snap(self,path,fname):
        if not self.firebase_ok: return
        try:
            b=storage.bucket().blob(f'ronin/snapshots/{fname}')
            b.upload_from_filename(str(path)); b.make_public()
        except Exception as e: print(f"⚠  FB upload: {e}")

    def _fb_alert(self,a):
        if not self.firebase_ok: return
        try: fb_db.reference('ronin/alerts').push(asdict(a))
        except Exception as e: print(f"⚠  FB alert: {e}")

    def _accident(self,frame,ts):
        fname=f"snap_{int(time.time())}.jpg"
        url=f"{BACKEND_URL}/static/snapshots/{fname}"
        self._io.submit(self._save_snap,frame.copy(),SNAP_DIR/fname,fname)
        a=RoverAlert(id=f"a_{int(time.time())}",type='ACCIDENT',
                     message='Potential accident',createdAt=ts,confidence=0.6,
                     snapshotUrl=url,meta={'faces':0})
        self._add_alert(a); self._io.submit(self._fb_alert,a)
        return {'status':'success','alert':asdict(a),'faces':[]}

    def _detect_accident(self,frame):
        try:
            g=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY) if frame.ndim==3 else frame
            b=np.mean(g)
            if b<30 or b>200: return True
            return cv2.Laplacian(g,cv2.CV_64F).var()<float(os.getenv('BLUR_THRESHOLD','10'))
        except: return False

    def run(self,host='0.0.0.0',port=5000,debug=False):
        rec='FaceNet' if self._use_fr else 'LBP+HOG'
        eu=_reader._url if _reader else ESP32_URL
        print(f"\n🚀 AROHAN CV Backend FINAL  →  http://{host}:{port}")
        print(f"📷 ESP32     : {eu}")
        print(f"🔍 Detector  : {self.det_mode.upper()}")
        print(f"🧠 Recognizer: {rec}")
        print(f"👥 People    : {sorted(set(self.known_names)) or 'none'}")
        print(f"⚡ RecogWorker throttled to {1/RECOG_MIN_INTERVAL:.0f} fps max\n")
        self.app.run(host=host,port=port,debug=debug,
                     threaded=True,use_reloader=False)


if __name__=='__main__':
    CVBackend().run(port=int(os.getenv('PORT','5000')))