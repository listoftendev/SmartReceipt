from PIL import Image
import os

files = ['assets/images/icon.png', 'assets/images/splash-icon.png']
for f in files:
    if os.path.exists(f):
        img = Image.open(f)
        # Convert to RGB to ensure no transparency issues from JPG
        img = img.convert('RGB')
        img.save(f, 'PNG')
        print(f"Converted {f} to true PNG")
