from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android/app/src/main/res"
OUT = RES / "drawable-nodpi"
OUT.mkdir(parents=True, exist_ok=True)

FRAME = '''<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432" viewBox="0 0 432 432">
  <rect width="432" height="432" fill="#000000"/>
  <g transform="translate(84 84) scale(2.64)">
    <defs>
      <radialGradient id="faceBg" cx="30%" cy="20%" r="120%"><stop offset="0" stop-color="#E8E5DD"/><stop offset="55%" stop-color="#DCD9D0"/><stop offset="100%" stop-color="#D0CDBF"/></radialGradient>
      <linearGradient id="phosphor" x1="50" y1="20" x2="50" y2="72" gradientUnits="userSpaceOnUse"><stop stop-color="#201738"/><stop offset="1" stop-color="#201738"/></linearGradient>
      <linearGradient id="squircleBorder" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#201738" stop-opacity=".3"/><stop offset="1" stop-color="#201738" stop-opacity=".1"/></linearGradient>
    </defs>
    <rect x="2" y="2" width="96" height="96" rx="25" fill="url(#faceBg)" stroke="url(#squircleBorder)" stroke-width="1.8"/>
    <rect x="6" y="6" width="88" height="88" rx="22" stroke="#201738" stroke-width=".8" stroke-dasharray="2 3" fill="none" opacity=".2"/>
    <g>
      <g transform="translate(37 37.5) scale(1 {LEFT}) translate(-37 -37.5)"><rect x="32" y="27" width="10" height="21" rx="5" fill="url(#phosphor)"/></g>
      <g transform="translate(63 37.5) scale(1 {RIGHT}) translate(-63 -37.5)"><rect x="58" y="27" width="10" height="21" rx="5" fill="url(#phosphor)"/></g>
      <path d="M 32 62 C 38 67.5, 62 67.5, 68 62" stroke="#201738" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".98"/>
    </g>
  </g>
</svg>'''

frames = [
    ("nexuss_splash_frame_1", "1", "1"),
    ("nexuss_splash_frame_2", ".55", ".55"),
    ("nexuss_splash_frame_3", ".08", ".08"),
    ("nexuss_splash_frame_4", ".35", ".75"),
    ("nexuss_splash_frame_5", ".55", ".55"),
    ("nexuss_splash_frame_6", "1", "1"),
]

generated = ROOT / ".generated"
generated.mkdir(exist_ok=True)
for name, left, right in frames:
    svg = generated / f"{name}.svg"
    svg.write_text(FRAME.format(LEFT=left, RIGHT=right), encoding="utf-8")
    subprocess.run(["rsvg-convert", "-w", "432", "-h", "432", "-o", str(OUT / f"{name}.png"), str(svg)], check=True)

subprocess.run(["rsvg-convert", "-w", "432", "-h", "432", "-o", str(OUT / "nexuss_favicon.png"), str(ROOT / "public/favicon.svg")], check=True)

for density, size in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    target = RES / f"mipmap-{density}"
    target.mkdir(exist_ok=True)
    for filename in ("ic_launcher.png", "ic_launcher_round.png"):
        subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), "-o", str(target / filename), str(ROOT / "public/favicon.svg")], check=True)

for path in generated.glob("*.svg"):
    path.unlink()
generated.rmdir()
print("Generated black proportional splash frames and favicon-based launcher icons.")
