#!/usr/bin/env python3
import pathlib
import re
import subprocess
import time
import xml.etree.ElementTree as ET

OUT=pathlib.Path("native-artifacts")
OUT.mkdir(exist_ok=True)

def run(*parts):
    return subprocess.run(parts,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)

def dump():
    for attempt in range(4):
        try:
            run("adb","shell","uiautomator","dump","/sdcard/tv-touch-screen.xml")
            run("adb","pull","/sdcard/tv-touch-screen.xml",str(OUT/"current.xml"))
            return ET.parse(OUT/"current.xml")
        except Exception:
            time.sleep(2)
    raise RuntimeError("Could not obtain Android accessibility hierarchy")

def tap(label):
    root=dump()
    for node in root.iter("node"):
        text=node.get("text","")+" "+node.get("content-desc","")
        if label.casefold() not in text.casefold():
            continue
        match=re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]",node.get("bounds",""))
        if not match: continue
        x1,y1,x2,y2=map(int,match.groups())
        run("adb","shell","input","tap",str((x1+x2)//2),str((y1+y2)//2))
        time.sleep(3)
        return
    raise AssertionError("Android control not found: "+label)

def screenshot(name):
    with (OUT/name).open("wb") as f:
        subprocess.run(["adb","exec-out","screencap","-p"],check=True,stdout=f)

tap("Criar agora")
screenshot("02-builder.png")
run("adb","shell","input","keyevent","4")
time.sleep(2)
tap("Biblioteca")
screenshot("03-library.png")
print("TV Touch Studio Prism native UI smoke: home, builder, library OK")
