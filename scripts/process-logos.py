#!/usr/bin/env python3
"""
Process logo images into all needed variations:
- Clean PNG (transparent background) at multiple sizes
- SVG vectorized version
- Monochrome variations (white, black, purple)
- README banner
- Obsidian plugin icon (must be SVG, monochrome)
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageOps
    import vtracer
except ImportError:
    print("Install: pip3 install --break-system-packages Pillow vtracer")
    sys.exit(1)

PROJECT = Path(__file__).parent.parent
ASSETS = PROJECT / "assets" / "logo"
ASSETS.mkdir(parents=True, exist_ok=True)

# Best source logos (ranked by vectorization suitability)
# Last ones are flattest/simplest = best for SVG
SOURCES = sorted(PROJECT.glob("t3-chat-generated-image-*.jpg"), key=lambda f: f.stat().st_mtime)
LOGO_EXAMPLE = PROJECT / "logo-example-1.jpg"

def remove_dark_background(img: Image.Image, threshold: int = 45) -> Image.Image:
    """Remove near-black background, making it transparent."""
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    for r, g, b, a in data:
        if r < threshold and g < threshold and b < threshold:
            new_data.append((r, g, b, 0))
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)
    return img

def remove_white_background(img: Image.Image, threshold: int = 230) -> Image.Image:
    """Remove near-white background, making it transparent."""
    img = img.convert("RGBA")
    data = img.getdata()
    new_data = []
    for r, g, b, a in data:
        if r > threshold and g > threshold and b > threshold:
            new_data.append((r, g, b, 0))
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)
    return img

def make_monochrome(img: Image.Image, color: tuple) -> Image.Image:
    """Convert image to monochrome using alpha channel as mask."""
    img = img.convert("RGBA")
    r, g, b = color
    data = img.getdata()
    new_data = []
    for _, _, _, a in data:
        new_data.append((r, g, b, a))
    img.putdata(new_data)
    return img

def resize_square(img: Image.Image, size: int) -> Image.Image:
    """Resize to square, maintaining aspect ratio with padding."""
    img.thumbnail((size, size), Image.LANCZOS)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - img.width) // 2, (size - img.height) // 2)
    result.paste(img, offset, img)
    return result

def crop_to_content(img: Image.Image, padding: int = 10) -> Image.Image:
    """Crop to non-transparent content with padding."""
    bbox = img.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        left = max(0, left - padding)
        top = max(0, top - padding)
        right = min(img.width, right + padding)
        bottom = min(img.height, bottom + padding)
        return img.crop((left, top, right, bottom))
    return img

def vectorize(input_path: str, output_path: str):
    """Vectorize a PNG to SVG using vtracer."""
    vtracer.convert_image_to_svg_py(
        input_path,
        output_path,
        colormode="color",
        hierarchical="stacked",
        mode="polygon",
        filter_speckle=4,
        color_precision=6,
        layer_difference=16,
        corner_threshold=60,
        length_threshold=4.0,
        max_iterations=10,
        splice_threshold=45,
        path_precision=3,
    )

print("=== Processing Daily Notes NG Logos ===\n")

# Use the last (simplest/flattest) dark-bg logo as primary
primary_dark = SOURCES[-1] if SOURCES else None  # 1774659205815 - simplest
secondary_dark = SOURCES[-2] if len(SOURCES) >= 2 else None  # 1774659026075
primary_light = LOGO_EXAMPLE if LOGO_EXAMPLE.exists() else SOURCES[0] if SOURCES else None  # white bg version

if not primary_dark:
    print("No source logos found!")
    sys.exit(1)

print(f"Primary (dark bg): {primary_dark.name}")
print(f"Secondary (dark bg): {secondary_dark.name if secondary_dark else 'none'}")
print(f"Primary (light bg): {primary_light.name if primary_light else 'none'}")

# === Process primary dark-bg logo ===
print("\n--- Primary logo (dark bg, simplest) ---")
img = Image.open(primary_dark)
print(f"  Source: {img.size}")

# Remove dark background
transparent = remove_dark_background(img)
transparent = crop_to_content(transparent)
print(f"  After bg removal + crop: {transparent.size}")

# Save full-size transparent PNG
transparent.save(ASSETS / "logo-full.png", "PNG")
print(f"  Saved: logo-full.png")

# Multiple sizes
for size in [512, 256, 128, 64, 32]:
    resized = resize_square(transparent.copy(), size)
    resized.save(ASSETS / f"logo-{size}.png", "PNG")
    print(f"  Saved: logo-{size}.png ({size}x{size})")

# Monochrome variations
PURPLE = (147, 100, 210)
WHITE = (255, 255, 255)
BLACK = (30, 30, 30)

for name, color in [("purple", PURPLE), ("white", WHITE), ("black", BLACK)]:
    mono = make_monochrome(transparent.copy(), color)
    mono_256 = resize_square(mono, 256)
    mono_256.save(ASSETS / f"logo-mono-{name}-256.png", "PNG")
    # Also save 512 for README
    mono_512 = resize_square(mono, 512)
    mono_512.save(ASSETS / f"logo-mono-{name}-512.png", "PNG")
    print(f"  Saved: logo-mono-{name}-256.png, logo-mono-{name}-512.png")

# === Vectorize ===
print("\n--- Vectorization ---")

# Full color SVG
vec_input = str(ASSETS / "logo-512.png")
vec_output = str(ASSETS / "logo.svg")
vectorize(vec_input, vec_output)
print(f"  Saved: logo.svg (color)")

# Monochrome SVG (best for Obsidian plugin icon)
mono_input = str(ASSETS / "logo-mono-purple-512.png")
mono_output = str(ASSETS / "logo-mono.svg")
vectorize(mono_input, mono_output)
print(f"  Saved: logo-mono.svg (purple mono)")

# White mono SVG (for dark backgrounds)
white_input = str(ASSETS / "logo-mono-white-512.png")
white_output = str(ASSETS / "logo-mono-white.svg")
vectorize(white_input, white_output)
print(f"  Saved: logo-mono-white.svg")

# === Process white-bg logo (logo-example-1) ===
if primary_light and primary_light.exists():
    print("\n--- Light background logo ---")
    img_light = Image.open(primary_light)
    transparent_light = remove_white_background(img_light)
    transparent_light = crop_to_content(transparent_light)
    transparent_light.save(ASSETS / "logo-glossy-full.png", "PNG")
    glossy_256 = resize_square(transparent_light, 256)
    glossy_256.save(ASSETS / "logo-glossy-256.png", "PNG")
    glossy_512 = resize_square(transparent_light, 512)
    glossy_512.save(ASSETS / "logo-glossy-512.png", "PNG")
    print(f"  Saved: logo-glossy-full.png, logo-glossy-256.png, logo-glossy-512.png")

    # Vectorize glossy
    vec_glossy_input = str(ASSETS / "logo-glossy-512.png")
    vec_glossy_output = str(ASSETS / "logo-glossy.svg")
    vectorize(vec_glossy_input, vec_glossy_output)
    print(f"  Saved: logo-glossy.svg")

# === Process secondary dark-bg logo (slightly more detailed) ===
if secondary_dark and secondary_dark.exists():
    print("\n--- Secondary logo (dark bg, outlined) ---")
    img2 = Image.open(secondary_dark)
    transparent2 = remove_dark_background(img2)
    transparent2 = crop_to_content(transparent2)
    transparent2_256 = resize_square(transparent2, 256)
    transparent2_256.save(ASSETS / "logo-outlined-256.png", "PNG")
    print(f"  Saved: logo-outlined-256.png")

print("\n=== Done! ===")
print(f"Output: {ASSETS}")
print(f"Files: {len(list(ASSETS.glob('*')))}")
