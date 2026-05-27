"""
Renders slides 7 (STAT LAB) and 8 (TAKE CARD) from the
screenshots-google.html and screenshots-apple.html files to PNG/JPG
and saves them into the Google Play / Apple App Store folders
at the dimensions that match the existing screenshots.

Usage: python capture_slides_7_8.py
"""
import os, re, subprocess, sys, tempfile, time
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

GOOGLE_HTML = ROOT / "screenshots-google.html"
APPLE_HTML = ROOT / "screenshots-apple.html"

GOOGLE_OUT = ROOT / "Google Play"
APPLE_OUT = ROOT / "Apple App Store"

# Existing target dimensions in the folders
GOOGLE_W, GOOGLE_H = 1080, 1920
APPLE_TARGET_W, APPLE_TARGET_H = 1284, 2778

# Native slide dimensions in HTML
GOOGLE_NATIVE = (1080, 1920)
APPLE_NATIVE = (1320, 2868)


def build_capture_html(src_html_path: Path, slide_id: str) -> Path:
    html = src_html_path.read_text(encoding="utf-8")

    # Override: hide everything but the chosen slide, strip transforms/margins
    inject_css = f"""
    html, body {{ background: transparent !important; padding: 0 !important; margin: 0 !important; }}
    body > * {{ display: none !important; }}
    body > #{slide_id} {{ display: flex !important; transform: none !important; margin: 0 !important; }}
    #{slide_id} {{ transform: none !important; margin: 0 !important; }}
    """
    html = html.replace("</style>", inject_css + "</style>", 1)

    # Remove ALL script tags so the auto-scaling JS doesn't run
    html = re.sub(r"<script[\s\S]*?</script>", "", html)

    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=f"_{slide_id}.html", delete=False, encoding="utf-8",
        dir=str(ROOT)
    )
    tmp.write(html)
    tmp.close()
    return Path(tmp.name)


def chrome_screenshot(html_file: Path, out_png: Path, width: int, height: int):
    url = "file:///" + str(html_file).replace(os.sep, "/")
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-sandbox",
        "--force-device-scale-factor=1",
        "--default-background-color=00000000",
        f"--window-size={width},{height}",
        f"--screenshot={out_png}",
        "--virtual-time-budget=4000",
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if not out_png.exists():
        print("Chrome stdout:", result.stdout[-500:])
        print("Chrome stderr:", result.stderr[-500:])
        raise RuntimeError(f"Failed to render {out_png}")


def render(src: Path, slide_id: str, out_png: Path, width: int, height: int):
    print(f"  Rendering {slide_id} -> {out_png.name} ({width}x{height})")
    tmp_html = build_capture_html(src, slide_id)
    try:
        chrome_screenshot(tmp_html, out_png, width, height)
    finally:
        try:
            tmp_html.unlink()
        except FileNotFoundError:
            pass


def resize_png(png_path: Path, target_w: int, target_h: int):
    img = Image.open(png_path).convert("RGBA")
    if img.size != (target_w, target_h):
        img = img.resize((target_w, target_h), Image.LANCZOS)
        img.save(png_path, "PNG")


def png_to_jpg(png_path: Path, jpg_path: Path, quality: int = 92):
    img = Image.open(png_path).convert("RGB")
    img.save(jpg_path, "JPEG", quality=quality, optimize=True)


def main():
    if not Path(CHROME).exists():
        print(f"ERROR: Chrome not found at {CHROME}")
        sys.exit(1)

    GOOGLE_OUT.mkdir(parents=True, exist_ok=True)
    APPLE_OUT.mkdir(parents=True, exist_ok=True)

    # --- Google Play (1080 x 1920) ---
    print("\n[Google Play]")
    for slide_id, n in [("slide-7-statlab", 7), ("slide-8-takecard", 8)]:
        out_png = GOOGLE_OUT / f"screenshot_{n}.png"
        render(GOOGLE_HTML, slide_id, out_png, GOOGLE_NATIVE[0], GOOGLE_NATIVE[1])
        resize_png(out_png, GOOGLE_W, GOOGLE_H)
        png_to_jpg(out_png, GOOGLE_OUT / f"screenshot_{n}.jpg")
        print(f"  Saved {out_png.name} + .jpg")

    # --- Apple App Store (1284 x 2778, rendered at 1320x2868 then downsampled) ---
    print("\n[Apple App Store]")
    for slide_id, n in [("slide-7-statlab", 7), ("slide-8-takecard", 8)]:
        out_png = APPLE_OUT / f"screenshot_{n}.png"
        render(APPLE_HTML, slide_id, out_png, APPLE_NATIVE[0], APPLE_NATIVE[1])
        resize_png(out_png, APPLE_TARGET_W, APPLE_TARGET_H)
        png_to_jpg(out_png, APPLE_OUT / f"screenshot_{n}.jpg")
        print(f"  Saved {out_png.name} + .jpg")

    print("\nDone.")


if __name__ == "__main__":
    main()
