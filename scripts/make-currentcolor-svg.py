#!/usr/bin/env python3
"""
Create a currentColor SVG from the monochrome logo.
This SVG inherits text color from its parent, making it work
in both light and dark themes.
"""
import re
from pathlib import Path

PROJECT = Path(__file__).parent.parent
ASSETS = PROJECT / "assets" / "logo"

# Read the mono SVG
mono_svg = (ASSETS / "logo-mono.svg").read_text()

# Replace all fill colors with currentColor
currentcolor_svg = re.sub(r'fill="[^"]*"', 'fill="currentColor"', mono_svg)

# Save
(ASSETS / "logo-currentcolor.svg").write_text(currentcolor_svg)
print(f"Created: logo-currentcolor.svg ({len(currentcolor_svg)} bytes)")

# Also create a version from the white mono (might be cleaner)
white_svg = (ASSETS / "logo-mono-white.svg").read_text()
white_currentcolor = re.sub(r'fill="[^"]*"', 'fill="currentColor"', white_svg)
(ASSETS / "logo-currentcolor-from-white.svg").write_text(white_currentcolor)
print(f"Created: logo-currentcolor-from-white.svg ({len(white_currentcolor)} bytes)")
