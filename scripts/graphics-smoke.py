#!/usr/bin/env python3
"""Local WebGL smoke test. Run from repo root: python scripts/graphics-smoke.py
Requires Python playwright and a Chromium install. No CI, upload or production traffic.
"""
import json, os, pathlib, threading, tempfile
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=pathlib.Path(os.environ.get("AGV_QA_OUT", tempfile.mkdtemp(prefix="agv-graphics-")))
OUT.mkdir(parents=True, exist_ok=True)
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT/"public")))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f"http://127.0.0.1:{server.server_port}/graphics-lab/viewer.html"
report={"status":"pending","cases":[],"errors":[]}
try:
 with sync_playwright() as p:
  opts={"headless":True,"args":["--enable-unsafe-swiftshader"]}
  if os.environ.get("CHROMIUM_PATH"): opts["executable_path"]=os.environ["CHROMIUM_PATH"]
  browser=p.chromium.launch(**opts)
  page=browser.new_page(viewport={"width":1280,"height":720},accept_downloads=True)
  page.on("pageerror",lambda e:report["errors"].append(str(e)))
  page.on("console",lambda m:report["errors"].append(m.text) if m.type=="error" else None)
  caps=page.evaluate("""()=>{const g=document.createElement('canvas').getContext('webgl2');return g?{version:g.getParameter(g.VERSION),renderer:g.getParameter(g.RENDERER),hdr:!!g.getExtension('EXT_color_buffer_float')}:null}""")
  report["webgl"]=caps
  if not caps: raise RuntimeError("BLOCKED: WebGL2 unavailable")
  page.goto(url)
  page.locator("#metric").wait_for(state="visible")
  page.wait_for_function("document.querySelector('#metric').textContent.includes('triângulos')",timeout=30000)
  def check(name):
   assert page.locator("#fatal").is_hidden(), name
   assert page.locator("#viewport canvas").count()==1, name
   report["cases"].append(name)
  check("initial")
  for w,h in [(1280,720),(1280,630),(844,390),(390,844)]:
   page.set_viewport_size({"width":w,"height":h})
   page.wait_for_timeout(400)
   check(f"viewport {w}x{h}")
   page.screenshot(path=str(OUT/f"viewport-{w}x{h}.png"))
  page.set_viewport_size({"width":1280,"height":720})
  for quality in ["eco","balanced","ultra","auto"]:
   page.select_option("#quality",quality)
   for model in ["turbine","piston","sensor","wheel"]:
    page.select_option("#industrial",model)
    page.wait_for_timeout(300)
    check(f"{quality}/{model}")
  page.click("#sample")
  page.wait_for_function("document.querySelector('#title').textContent==='Estúdio de materiais'",timeout=30000)
  check("GLB sample")
  page.select_option("#industrial","turbine")
  page.select_option("#quality","balanced")
  page.locator("details").filter(has_text="Acabamento cinematográfico").locator("summary").click()
  for fx in ["off","studio","cinema","technical"]:
   page.select_option("#fxPreset",fx)
   page.wait_for_timeout(300)
   check("cinematic "+fx)
   if fx!="off" and caps["hdr"]: assert "Efeitos" in page.locator("#fxState").inner_text(), "HDR fallback"
  page.locator("details").filter(has_text="Partículas e efeitos").locator("summary").click()
  for effect in ["energy","sparks","mist","trail","hologram","impact","off"]:
   page.select_option("#particlePreset",effect)
   page.wait_for_timeout(400)
   check("particle "+effect)
  page.locator("details").filter(has_text="Diagnóstico gráfico").locator("summary").click()
  page.click("#benchmark")
  page.wait_for_function("document.querySelector('#benchState').textContent.startsWith('Concluído')",timeout=30000)
  with page.expect_download() as d: page.click("#exportReport")
  d.value.save_as(str(OUT/"benchmark.json"))
  data=json.loads((OUT/"benchmark.json").read_text())
  assert data["measurements"]["samples"]>=2
  check("benchmark JSON")
  assert not report["errors"],report["errors"]
  report["status"]="passed"
  browser.close()
except Exception as e:
 report["status"]="blocked" if "BLOCKED:" in str(e) else "failed"
 report["failure"]=str(e)
finally:
 server.shutdown()
 (OUT/"smoke-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False,indent=2))
 print("Evidence:",OUT)
if report["status"]!="passed": raise SystemExit(1)
