"""Bundle the local prototype sources into a standalone HTML preview."""
from pathlib import Path

root = Path(__file__).resolve().parent
shell = (root / "prototype-shell.html").read_text()
css = (root / "prototype.css").read_text()
javascript = "\n".join((root / name).read_text() for name in (
    "prototype.js", "prototype-app.js", "prototype-renderer.js"
))
output = shell.replace("/* PROTOTYPE_CSS */", css).replace("/* PROTOTYPE_JS */", javascript)
(root / "02-high-fidelity.html").write_text(output)
print("Built 02-high-fidelity.html")
