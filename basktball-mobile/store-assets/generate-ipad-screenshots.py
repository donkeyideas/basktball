from PIL import Image
import os

# iPad 12.9" / 13" required size
IPAD_WIDTH = 2048
IPAD_HEIGHT = 2732

# Dark background matching the app theme
BG_COLOR = (18, 18, 18)

input_dir = os.path.join(os.path.dirname(__file__), "apple")
output_dir = os.path.join(os.path.dirname(__file__), "apple-ipad")
os.makedirs(output_dir, exist_ok=True)

for filename in sorted(os.listdir(input_dir)):
    if not filename.endswith(".png"):
        continue

    img = Image.open(os.path.join(input_dir, filename))

    # Scale the iPhone screenshot to fit iPad height with some padding
    target_h = int(IPAD_HEIGHT * 0.85)
    scale = target_h / img.height
    new_w = int(img.width * scale)
    new_h = target_h
    img_resized = img.resize((new_w, new_h), Image.LANCZOS)

    # Create iPad canvas and center the screenshot
    canvas = Image.new("RGB", (IPAD_WIDTH, IPAD_HEIGHT), BG_COLOR)
    x = (IPAD_WIDTH - new_w) // 2
    y = (IPAD_HEIGHT - new_h) // 2
    canvas.paste(img_resized, (x, y))

    out_path = os.path.join(output_dir, filename)
    canvas.save(out_path, "PNG")
    print(f"Created: {filename} ({IPAD_WIDTH}x{IPAD_HEIGHT})")

print(f"\nDone! iPad screenshots saved to: {output_dir}")
