import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import struct
import zlib
import math
import base64

def create_png(width, height, pixels):
    """Create a PNG from RGBA pixel data"""
    def png_chunk(chunk_type, data):
        chunk_len = struct.pack('>I', len(data))
        chunk_crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return chunk_len + chunk_type + data + chunk_crc

    signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = png_chunk(b'IHDR', ihdr_data)

    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'
        for x in range(width):
            idx = (y * width + x) * 4
            r = max(0, min(255, pixels[idx]))
            g = max(0, min(255, pixels[idx + 1]))
            b = max(0, min(255, pixels[idx + 2]))
            a = max(0, min(255, pixels[idx + 3]))
            raw_data += bytes([r, g, b, a])

    compressed = zlib.compress(raw_data, 9)
    idat = png_chunk(b'IDAT', compressed)
    iend = png_chunk(b'IEND', b'')

    return signature + ihdr + idat + iend

def lerp(a, b, t):
    return int(a + (b - a) * t)

def draw_ring(pixels, w, h, cx, cy, r, thickness, color):
    """Draw a ring (circle outline) with anti-aliasing"""
    for py in range(max(0, int(cy - r - thickness - 1)), min(h, int(cy + r + thickness + 2))):
        for px in range(max(0, int(cx - r - thickness - 1)), min(w, int(cx + r + thickness + 2))):
            dist = math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
            # Anti-aliased ring
            inner = r - thickness / 2
            outer = r + thickness / 2

            if inner <= dist <= outer:
                idx = (py * w + px) * 4
                # Calculate alpha based on distance from ideal ring
                if dist < r:
                    alpha = (dist - inner) / thickness
                else:
                    alpha = (outer - dist) / thickness
                alpha = max(0, min(1, alpha)) * color[3] / 255

                final_alpha = int(alpha * 255)
                if pixels[idx + 3] == 0:
                    pixels[idx:idx+4] = (*color[:3], final_alpha)
                else:
                    old_a = pixels[idx + 3] / 255.0
                    new_a = final_alpha / 255.0
                    out_a = new_a + old_a * (1 - new_a)
                    if out_a > 0:
                        for c in range(3):
                            pixels[idx + c] = int((color[c] * new_a + pixels[idx + c] * old_a * (1 - new_a)) / out_a)
                        pixels[idx + 3] = int(out_a * 255)

def draw_rounded_rect(pixels, w, h, rx, ry, rw, rh, radius, color):
    """Draw a filled rounded rectangle with gradient"""
    for py in range(max(0, ry), min(h, ry + rh)):
        for px in range(max(0, rx), min(w, rx + rw)):
            ix = px - rx
            iy = py - ry

            inside = True
            # Corner checks
            if ix < radius and iy < radius:
                if (ix - radius) ** 2 + (iy - radius) ** 2 > radius ** 2:
                    inside = False
            elif ix >= rw - radius and iy < radius:
                if (ix - (rw - radius - 1)) ** 2 + (iy - radius) ** 2 > radius ** 2:
                    inside = False
            elif ix < radius and iy >= rh - radius:
                if (ix - radius) ** 2 + (iy - (rh - radius - 1)) ** 2 > radius ** 2:
                    inside = False
            elif ix >= rw - radius and iy >= rh - radius:
                if (ix - (rw - radius - 1)) ** 2 + (iy - (rh - radius - 1)) ** 2 > radius ** 2:
                    inside = False

            if inside:
                idx = (py * w + px) * 4
                # Diagonal gradient: brass to copper
                t = (ix + iy) / (rw + rh - 2)
                t = max(0, min(1, t))
                r_col = lerp(color[0], color[3], t)
                g_col = lerp(color[1], color[4], t)
                b_col = lerp(color[2], color[5], t)

                # Anti-aliasing
                edge_dist = min(ix, rw - 1 - ix, iy, rh - 1 - iy)
                if edge_dist >= 1:
                    pixels[idx:idx+4] = (r_col, g_col, b_col, 255)
                elif edge_dist > 0:
                    pixels[idx:idx+4] = (r_col, g_col, b_col, int(255 * edge_dist))

def draw_path(pixels, w, h, path_d, scale, offset_x, offset_y, color):
    """
    Draw an SVG path (simplified - supports M, L, C, Q, Z commands)
    This is a basic rasterizer
    """
    # Parse path and draw
    import re

    # Simple fill using scanline
    commands = re.findall(r'([MLHVCSQTAZ])([^MLHVCSQTAZ]*)', path_d, re.IGNORECASE)

    points = []
    current_x, current_y = 0, 0
    start_x, start_y = 0, 0

    for cmd, args in commands:
        args = [float(x) for x in re.findall(r'-?\d+\.?\d*', args)]

        if cmd == 'M':
            current_x, current_y = args[0] * scale + offset_x, args[1] * scale + offset_y
            start_x, start_y = current_x, current_y
            points.append((current_x, current_y))
        elif cmd == 'L':
            for i in range(0, len(args), 2):
                current_x, current_y = args[i] * scale + offset_x, args[i+1] * scale + offset_y
                points.append((current_x, current_y))
        elif cmd == 'C':
            # Cubic bezier - approximate with line segments
            x1, y1, x2, y2, x, y = args
            x1, y1 = x1 * scale + offset_x, y1 * scale + offset_y
            x2, y2 = x2 * scale + offset_x, y2 * scale + offset_y
            x, y = x * scale + offset_x, y * scale + offset_y
            # Simple approximation
            for t in [0.25, 0.5, 0.75, 1.0]:
                px = (1-t)**3 * current_x + 3*(1-t)**2*t*x1 + 3*(1-t)*t**2*x2 + t**3*x
                py = (1-t)**3 * current_y + 3*(1-t)**2*t*y1 + 3*(1-t)*t**2*y2 + t**3*y
                points.append((px, py))
            current_x, current_y = x, y
        elif cmd == 'Z':
            points.append((start_x, start_y))
            current_x, current_y = start_x, start_y

    # Fill polygon using scanline
    if len(points) >= 3:
        min_y = int(min(p[1] for p in points))
        max_y = int(max(p[1] for p in points))

        for y in range(max(0, min_y), min(h, max_y + 1)):
            intersections = []
            for i in range(len(points)):
                p1 = points[i]
                p2 = points[(i + 1) % len(points)]

                if p1[1] == p2[1]:
                    continue

                if min(p1[1], p2[1]) <= y < max(p1[1], p2[1]):
                    x = p1[0] + (y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1])
                    intersections.append(x)

            intersections.sort()

            for i in range(0, len(intersections) - 1, 2):
                x_start = int(intersections[i])
                x_end = int(intersections[i + 1])

                for x in range(max(0, x_start), min(w, x_end + 1)):
                    idx = (y * w + x) * 4
                    pixels[idx:idx+4] = color

def draw_sparkle_shape(pixels, w, h, cx, cy, size, color):
    """Draw a sparkle/star shape based on lucide Sparkles icon"""
    # Main star path (simplified from lucide)
    # M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z

    # Scale factor
    s = size / 24  # lucide icons are 24x24

    # Draw the star shape using polygon
    # Simplified 4-point star
    points = []

    # Create 4-point star
    for i in range(8):
        angle = i * math.pi / 4 - math.pi / 2
        if i % 2 == 0:
            r = size * 0.5
        else:
            r = size * 0.2
        px = cx + r * math.cos(angle)
        py = cy + r * math.sin(angle)
        points.append((px, py))

    # Fill polygon
    min_y = int(min(p[1] for p in points))
    max_y = int(max(p[1] for p in points))

    for y in range(max(0, min_y), min(h, max_y + 1)):
        intersections = []
        for i in range(len(points)):
            p1 = points[i]
            p2 = points[(i + 1) % len(points)]

            if p1[1] == p2[1]:
                continue

            if min(p1[1], p2[1]) <= y < max(p1[1], p2[1]):
                x = p1[0] + (y - p1[1]) * (p2[0] - p1[0]) / (p2[1] - p1[1])
                intersections.append(x)

        intersections.sort()

        for i in range(0, len(intersections) - 1, 2):
            x_start = int(intersections[i])
            x_end = int(intersections[i + 1])

            for x in range(max(0, x_start), min(w, x_end + 1)):
                idx = (y * w + x) * 4
                pixels[idx:idx+4] = color

def create_logo_icon(size, for_tray=False):
    """
    Create logo icon matching the UI design exactly:
    - Teal ring (circle outline)
    - Brass-copper gradient inner square (rounded rect)
    - Sparkle in center (matching lucide-react Sparkles)
    """
    pixels = [0] * (size * size * 4)

    # Colors from the UI
    brass = (201, 168, 108)
    copper = (184, 115, 51)
    teal = (0, 212, 170)
    teal_ring = (0, 212, 170, int(255 * 0.4))  # 40% opacity
    void = (6, 8, 16, 255)

    # Scale based on reference 28px design
    scale = size / 28

    # Outer ring: 28px diameter, 1px stroke
    ring_radius = 13.5 * scale  # (28-1)/2
    ring_thickness = 1 * scale

    # Inner square: 20px, 4px radius
    inner_size = 20 * scale
    inner_radius = 4 * scale

    center = size / 2

    # 1. Draw teal ring
    draw_ring(pixels, size, size, center, center, ring_radius, ring_thickness, teal_ring)

    # 2. Draw inner rounded rect with brass-copper gradient
    x = int(center - inner_size / 2)
    y = int(center - inner_size / 2)
    draw_rounded_rect(pixels, size, size, x, y, int(inner_size), int(inner_size), int(inner_radius),
                      (*brass, *copper))  # Pass both colors for gradient

    # 3. Draw sparkle in center (void color)
    sparkle_size = inner_size * 0.6
    draw_sparkle_shape(pixels, size, size, center, center, sparkle_size, void)

    return pixels

# Generate icons
print("Generating icons with lucide Sparkles design...")

# Tray icon 16x16
pixels_16 = create_logo_icon(16, for_tray=True)
png_16 = create_png(16, 16, pixels_16)
with open('E:/LEON/selection-assistant/resources/tray.png', 'wb') as f:
    f.write(png_16)
print("Saved: resources/tray.png (16x16)")

# Tray icon 32x32
pixels_32 = create_logo_icon(32, for_tray=True)
png_32 = create_png(32, 32, pixels_32)
with open('E:/LEON/selection-assistant/resources/tray@2x.png', 'wb') as f:
    f.write(png_32)
print("Saved: resources/tray@2x.png (32x32)")

# Window icon 256x256
pixels_256 = create_logo_icon(256, for_tray=False)
png_256 = create_png(256, 256, pixels_256)
with open('E:/LEON/selection-assistant/resources/icon.png', 'wb') as f:
    f.write(png_256)
print("Saved: resources/icon.png (256x256)")

# Base64 for embedded tray icons
b64_16 = base64.b64encode(png_16).decode('ascii')
b64_32 = base64.b64encode(png_32).decode('ascii')
print(f"\nTRAY_ICON_16 = '{b64_16}'")
print(f"\nTRAY_ICON_32 = '{b64_32}'")

print("\nDone!")
