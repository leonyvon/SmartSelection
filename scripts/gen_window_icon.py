import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import struct
import zlib
import math

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
            # Clamp values to 0-255
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

def create_window_icon_256():
    """Create 256x256 window icon - reactor design"""
    w, h = 256, 256
    pixels = [0] * (w * h * 4)

    # Colors
    void = (6, 8, 16, 255)
    brass = (201, 168, 108, 255)
    brass_dark = (139, 115, 85, 255)
    teal = (0, 212, 170, 255)
    violet = (123, 104, 238, 255)
    transparent = (0, 0, 0, 0)

    center_x, center_y = 128, 128

    # Fill background with rounded rect
    radius = 32
    for y in range(h):
        for x in range(w):
            # Check if inside rounded rect
            in_rect = True
            # Check corners
            if x < radius and y < radius:
                if (x - radius) ** 2 + (y - radius) ** 2 > radius ** 2:
                    in_rect = False
            elif x >= w - radius and y < radius:
                if (x - (w - radius - 1)) ** 2 + (y - radius) ** 2 > radius ** 2:
                    in_rect = False
            elif x < radius and y >= h - radius:
                if (x - radius) ** 2 + (y - (h - radius - 1)) ** 2 > radius ** 2:
                    in_rect = False
            elif x >= w - radius and y >= h - radius:
                if (x - (w - radius - 1)) ** 2 + (y - (h - radius - 1)) ** 2 > radius ** 2:
                    in_rect = False

            idx = (y * w + x) * 4
            if in_rect:
                pixels[idx:idx+4] = void
            else:
                pixels[idx:idx+4] = transparent

    def draw_ring(cx, cy, r, color, thickness=1, alpha=1.0):
        for y in range(max(0, int(cy - r - thickness)), min(h, int(cy + r + thickness + 1))):
            for x in range(max(0, int(cx - r - thickness)), min(w, int(cx + r + thickness + 1))):
                dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
                if r - thickness/2 <= dist <= r + thickness/2:
                    idx = (y * w + x) * 4
                    # Anti-aliasing
                    aa = 1.0 - min(1.0, abs(dist - r) - thickness/2 + 0.5)
                    final_alpha = int(alpha * aa * color[3])
                    if pixels[idx + 3] == 0:
                        pixels[idx:idx+4] = (*color[:3], final_alpha)
                    else:
                        # Blend
                        old_a = pixels[idx + 3] / 255.0
                        new_a = final_alpha / 255.0
                        out_a = new_a + old_a * (1 - new_a)
                        if out_a > 0:
                            for c in range(3):
                                pixels[idx + c] = int((color[c] * new_a + pixels[idx + c] * old_a * (1 - new_a)) / out_a)
                            pixels[idx + 3] = int(out_a * 255)

    def draw_filled_circle(cx, cy, r, color):
        for y in range(max(0, int(cy - r)), min(h, int(cy + r + 1))):
            for x in range(max(0, int(cx - r)), min(w, int(cx + r + 1))):
                dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
                if dist <= r:
                    idx = (y * w + x) * 4
                    # Anti-aliasing at edge
                    if dist > r - 1:
                        aa = r - dist
                        pixels[idx:idx+4] = (*color[:3], int(color[3] * aa))
                    else:
                        pixels[idx:idx+4] = color

    def draw_glow(cx, cy, r, color):
        for y in range(max(0, int(cy - r)), min(h, int(cy + r + 1))):
            for x in range(max(0, int(cx - r)), min(w, int(cx + r + 1))):
                dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
                if dist <= r:
                    idx = (y * w + x) * 4
                    intensity = 1.0 - (dist / r)
                    alpha = int(intensity * color[3])
                    if pixels[idx + 3] == 0:
                        pixels[idx:idx+4] = (*color[:3], alpha)
                    else:
                        old_a = pixels[idx + 3] / 255.0
                        new_a = alpha / 255.0
                        out_a = new_a + old_a * (1 - new_a)
                        if out_a > 0:
                            for c in range(3):
                                pixels[idx + c] = int((color[c] * new_a + pixels[idx + c] * old_a * (1 - new_a)) / out_a)
                            pixels[idx + 3] = int(out_a * 255)

    # Outer protective ring (brass)
    draw_ring(center_x, center_y, 106, brass, thickness=4)

    # Inner orbit 1
    draw_ring(center_x, center_y, 80, (0, 212, 170, 80), thickness=2)

    # Inner orbit 2
    draw_ring(center_x, center_y, 58, (0, 212, 170, 60), thickness=2)

    # Core glow
    draw_glow(center_x, center_y, 50, (0, 212, 170, 200))

    # Core - gradient from teal to violet
    for y in range(h):
        for x in range(w):
            dist = math.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)
            if dist <= 26:
                idx = (y * w + x) * 4
                # Diagonal gradient
                t = (x + y - 2 * center_x) / (52) + 0.5  # Normalize to 0-1
                t = max(0, min(1, t))
                r = lerp(teal[0], violet[0], t)
                g = lerp(teal[1], violet[1], t)
                b = lerp(teal[2], violet[2], t)
                # Anti-alias at edge
                if dist > 25:
                    aa = 26 - dist
                    pixels[idx:idx+4] = (r, g, b, int(255 * aa))
                else:
                    pixels[idx:idx+4] = (r, g, b, 255)

    # Electron 1 (top-right on orbit 1)
    e1_angle = -math.pi / 4
    e1_x = center_x + 80 * math.cos(e1_angle)
    e1_y = center_y + 80 * math.sin(e1_angle)
    draw_glow(e1_x, e1_y, 10, (0, 212, 170, 150))
    draw_filled_circle(e1_x, e1_y, 5, teal)

    # Electron 2 (bottom-left on orbit 2)
    e2_angle = math.pi * 0.75
    e2_x = center_x + 58 * math.cos(e2_angle)
    e2_y = center_y + 58 * math.sin(e2_angle)
    draw_glow(e2_x, e2_y, 8, (0, 212, 170, 150))
    draw_filled_circle(e2_x, e2_y, 4, teal)

    return pixels

# Generate window icon
print("Generating window icon (256x256)...")
pixels_256 = create_window_icon_256()
png_256 = create_png(256, 256, pixels_256)

with open('E:/LEON/selection-assistant/resources/icon.png', 'wb') as f:
    f.write(png_256)
print("Saved: resources/icon.png")

print("Done!")
