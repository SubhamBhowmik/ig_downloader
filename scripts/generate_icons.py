from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public')
OUT = os.path.abspath(OUT)

# Brand gradient colors
TOP = (131, 58, 180)      # #833ab4
MID = (225, 48, 108)      # #e1306c
BOTTOM = (247, 119, 55)   # #f77737


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_color(t):
    if t < 0.5:
        return lerp(TOP, MID, t * 2)
    return lerp(MID, BOTTOM, (t - 0.5) * 2)


def make_icon(size, radius_ratio=0.235):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background with diagonal gradient
    radius = int(size * radius_ratio)
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)

    # Draw gradient by rows
    for y in range(size):
        t = y / (size - 1)
        draw.line([(0, y), (size, y)], fill=gradient_color(t))

    # Apply rounded mask
    bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bg.paste(img, (0, 0), mask)

    # Play triangle
    tri_center = 0.5
    tri_h = size * 0.36
    tri_w = size * 0.30
    cx = size * 0.52
    cy = size * 0.5
    pts = [
        (cx - tri_w * 0.5, cy - tri_h * 0.5),
        (cx - tri_w * 0.5, cy + tri_h * 0.5),
        (cx + tri_w * 0.6, cy),
    ]
    draw = ImageDraw.Draw(bg)
    draw.polygon(pts, fill=(255, 255, 255, 255))

    # Side bar (like a vertical play bar accent)
    bar_w = size * 0.055
    bar_x = size * 0.34
    bar_top = size * 0.30
    bar_bottom = size * 0.70
    draw.rounded_rectangle([bar_x, bar_top, bar_x + bar_w, bar_bottom], radius=bar_w / 2, fill=(255, 255, 255, 90))

    return bg


def save_icon(size, filename):
    icon = make_icon(size)
    icon.save(os.path.join(OUT, filename))


# Favicons
save_icon(16, 'favicon-16x16.png')
save_icon(32, 'favicon-32x32.png')

# Apple touch icon (iOS)
save_icon(180, 'apple-touch-icon.png')

# PWA icons
save_icon(192, 'icon-192.png')
save_icon(512, 'icon-512.png')

# Android chrome
save_icon(192, 'android-chrome-192x192.png')
save_icon(512, 'android-chrome-512x512.png')

# Multi-size favicon.ico
make_icon(16).save(os.path.join(OUT, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])


def make_og():
    """Open Graph image 1200x630 for Google / social sharing."""
    W, H = 1200, 630
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Full diagonal gradient background
    for y in range(H):
        t = y / (H - 1)
        draw.line([(0, y), (W, y)], fill=gradient_color(t))

    # Rounded icon centered-left area
    icon_size = 380
    icon = make_icon(icon_size, radius_ratio=0.22)
    img.paste(icon, (110, (H - icon_size) // 2), icon)

    # Use a basic font — try to find a TTF available on Windows
    font_paths = [
        "C:/Windows/Fonts/segoeuib.ttf",   # Segoe UI Bold
        "C:/Windows/Fonts/arialbd.ttf",    # Arial Bold
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/dejavusans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    font_title = None
    font_tag = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font_title = ImageFont.truetype(fp, 96)
                break
            except Exception:
                continue

    if font_title is None:
        try:
            font_title = ImageFont.load_default()
        except Exception:
            font_title = None

    text_x = 110 + icon_size + 60  # right of icon

    if font_title is not None:
        draw.text((text_x, 210), "ReelSnap", font=font_title, fill=(255, 255, 255, 255))

    # Tagline
    try:
        font_tag = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 44)
    except Exception:
        font_tag = None
    if font_tag is not None:
        draw.text((text_x, 340), "Download Instagram Reels, Videos & Stories", font=font_tag, fill=(255, 255, 255, 220))

    img.save(os.path.join(OUT, 'og-image.png'))


make_og()

print("Icons generated successfully.")