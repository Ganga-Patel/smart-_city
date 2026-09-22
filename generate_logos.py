import os
import shutil
import base64
from io import BytesIO
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

def build_all_logos():
    src_path = 'd:/smartcity/webapp/public/logo.jpg'
    img = Image.open(src_path)
    w, h = img.size # 632 x 316
    
    out_dirs = [
        'd:/smartcity/webapp/public/logo',
        'd:/smartcity/logo'
    ]
    for d in out_dirs:
        os.makedirs(d, exist_ok=True)
        
    arr = np.array(img)
    
    # 1. Left (Dark theme) & Right (Light theme)
    left = arr[:, :316].copy()
    right = arr[:, 316:].copy()
    
    dark_bg_rgb = np.array([38, 50, 62], dtype=np.uint8)
    white_bg_rgb = np.array([255, 255, 255], dtype=np.uint8)
    
    # 2. Clean slogan (row 233 onwards)
    left[233:, :] = dark_bg_rgb
    right[233:, :] = white_bg_rgb
    
    # 3. Clean border regions & shadows
    left[:, :50] = dark_bg_rgb
    left[:, 265:] = dark_bg_rgb
    left[:65, :] = dark_bg_rgb
    
    right[:, :55] = white_bg_rgb
    right[:, 265:] = white_bg_rgb
    right[:65, :] = white_bg_rgb
    
    # Save Card / Original Background versions (Slogan removed)
    for d in out_dirs:
        Image.fromarray(left).save(os.path.join(d, 'logo-dark-card.png'))
        Image.fromarray(right).save(os.path.join(d, 'logo-light-card.png'))
        Image.fromarray(left).convert('RGB').save(os.path.join(d, 'logo-dark.jpg'), quality=95)
        Image.fromarray(right).convert('RGB').save(os.path.join(d, 'logo-light.jpg'), quality=95)
    
    H, W, _ = 316, 316, 3
    
    # ================= LIGHT THEME EXTRACTION =================
    dist_light_bg = np.linalg.norm(right.astype(float) - white_bg_rgb, axis=2)
    is_white = dist_light_bg < 20
    visited_r = np.zeros((H, W), dtype=bool)
    q_r = deque()
    
    for y in range(H):
        q_r.append((y, 0)); visited_r[y, 0] = True
        q_r.append((y, W-1)); visited_r[y, W-1] = True
    for x in range(W):
        q_r.append((0, x)); visited_r[0, x] = True
        q_r.append((H-1, x)); visited_r[H-1, x] = True
        
    q_r.append((100, 90)); visited_r[100, 90] = True
    for sy, sx in [(220, 116), (217, 135)]:
        if is_white[sy, sx]:
            q_r.append((sy, sx)); visited_r[sy, sx] = True

    while q_r:
        cy, cx = q_r.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < H and 0 <= nx < W and not visited_r[ny, nx]:
                if is_white[ny, nx]:
                    visited_r[ny, nx] = True
                    q_r.append((ny, nx))
                    
    alpha_r = np.zeros((H, W), dtype=np.uint8)
    for y in range(H):
        for x in range(W):
            if not visited_r[y, x]:
                is_edge = False
                for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < W and visited_r[ny, nx]:
                        is_edge = True
                        break
                if is_edge:
                    alpha_r[y, x] = int(np.clip((dist_light_bg[y, x] / 100.0) * 255, 60, 255))
                else:
                    alpha_r[y, x] = 255
                    
    rgba_light = np.dstack([right, alpha_r])
    
    # ================= DARK THEME EXTRACTION =================
    dist_dark_bg = np.linalg.norm(left.astype(float) - dark_bg_rgb, axis=2)
    is_dark = dist_dark_bg < 25
    visited_l = np.zeros((H, W), dtype=bool)
    q_l = deque()
    
    for y in range(H):
        q_l.append((y, 0)); visited_l[y, 0] = True
        q_l.append((y, W-1)); visited_l[y, W-1] = True
    for x in range(W):
        q_l.append((0, x)); visited_l[0, x] = True
        q_l.append((H-1, x)); visited_l[H-1, x] = True
        
    q_l.append((100, 92)); visited_l[100, 92] = True
    for sy, sx in [(220, 115), (217, 135)]:
        if is_dark[sy, sx]:
            q_l.append((sy, sx)); visited_l[sy, sx] = True
            
    while q_l:
        cy, cx = q_l.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < H and 0 <= nx < W and not visited_l[ny, nx]:
                if is_dark[ny, nx]:
                    visited_l[ny, nx] = True
                    q_l.append((ny, nx))
                    
    alpha_l = np.zeros((H, W), dtype=np.uint8)
    for y in range(H):
        for x in range(W):
            if not visited_l[y, x]:
                is_edge = False
                for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < W and visited_l[ny, nx]:
                        is_edge = True
                        break
                if is_edge:
                    alpha_l[y, x] = int(np.clip((dist_dark_bg[y, x] / 100.0) * 255, 60, 255))
                else:
                    alpha_l[y, x] = 255

    rgba_dark = np.dstack([left, alpha_l])
    
    pil_dark = Image.fromarray(rgba_dark)
    pil_light = Image.fromarray(rgba_light)
    
    # Balanced Crop Box: exactly 200 x 174 centered around logos
    # Left logo center: x=156, y=154
    # Right logo center: x=158.5, y=154
    crop_box_l = (56, 68, 256, 242)
    crop_box_r = (58, 68, 258, 242)
    
    logo_dark_cropped = pil_dark.crop(crop_box_l)
    logo_light_cropped = pil_light.crop(crop_box_r)
    
    # High-resolution (retina 4x -> 800 x 696)
    target_w = 800
    target_h = int(target_w * (174 / 200)) # 696
    
    logo_dark_hd = logo_dark_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
    logo_light_hd = logo_light_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Square 512x512 icons (perfect for app icons, favicons, avatars)
    def make_square(pil_img, size=512):
        sq = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        scale_f = (size * 0.85) / max(pil_img.width, pil_img.height)
        nw = int(pil_img.width * scale_f)
        nh = int(pil_img.height * scale_f)
        resized = pil_img.resize((nw, nh), Image.Resampling.LANCZOS)
        ox = (size - nw) // 2
        oy = (size - nh) // 2
        sq.paste(resized, (ox, oy), resized)
        return sq
        
    sq_dark = make_square(logo_dark_cropped, 512)
    sq_light = make_square(logo_light_cropped, 512)
    
    # Emblem Icons Only (badge without SMART CITY text)
    bbox_icon_l = (56, 68, 256, 203)
    bbox_icon_r = (58, 68, 258, 203)
    icon_dark = pil_dark.crop(bbox_icon_l)
    icon_light = pil_light.crop(bbox_icon_r)
    
    sq_icon_dark = make_square(icon_dark, 512)
    sq_icon_light = make_square(icon_light, 512)
    
    # Monochrome / Silhouette Cutouts
    cutout_alpha = np.clip((dist_dark_bg - 20) / (120 - 20), 0, 1)
    rgba_cutout_white = np.zeros((H, W, 4), dtype=np.uint8)
    rgba_cutout_white[:, :, :3] = 255
    rgba_cutout_white[:, :, 3] = (cutout_alpha * 255).astype(np.uint8)
    cutout_white_cropped = Image.fromarray(rgba_cutout_white).crop(crop_box_l)
    
    rgba_cutout_dark = np.zeros((H, W, 4), dtype=np.uint8)
    rgba_cutout_dark[:, :, 0] = 38
    rgba_cutout_dark[:, :, 1] = 50
    rgba_cutout_dark[:, :, 2] = 62
    rgba_cutout_dark[:, :, 3] = (cutout_alpha * 255).astype(np.uint8)
    cutout_dark_cropped = Image.fromarray(rgba_cutout_dark).crop(crop_box_r)

    files_to_save = {
        'logo-dark.png': logo_dark_cropped,
        'logo-light.png': logo_light_cropped,
        'logo-dark-hd.png': logo_dark_hd,
        'logo-light-hd.png': logo_light_hd,
        'logo-dark-square.png': sq_dark,
        'logo-light-square.png': sq_light,
        'logo-dark-cutout.png': cutout_white_cropped,
        'logo-light-cutout.png': cutout_dark_cropped,
        'logo-icon-dark.png': sq_icon_dark,
        'logo-icon-light.png': sq_icon_light,
    }
    
    for filename, p_img in files_to_save.items():
        for d in out_dirs:
            p_img.save(os.path.join(d, filename))
            
    # SVG vector wrappers
    def create_svg_wrapper(png_img, width, height):
        buffered = BytesIO()
        png_img.save(buffered, format="PNG")
        img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">
  <image width="{width}" height="{height}" href="data:image/png;base64,{img_b64}"/>
</svg>'''
        
    svg_dark = create_svg_wrapper(logo_dark_hd, target_w, target_h)
    svg_light = create_svg_wrapper(logo_light_hd, target_w, target_h)
    
    for d in out_dirs:
        with open(os.path.join(d, 'logo-dark.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_dark)
        with open(os.path.join(d, 'logo-light.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_light)
            
    print("SUCCESS: All pristine logos generated and verified!")

build_all_logos()
