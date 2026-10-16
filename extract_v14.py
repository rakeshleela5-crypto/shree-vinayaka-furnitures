import os
import sys
import glob
import subprocess

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

videos = glob.glob(r"downloads/playlist_retail_daddy/videos/*14_*")
if not videos:
    print("No video found for 14!")
    exit(1)

video_path = videos[0]
out_dir = r"downloads/frames_v14"
os.makedirs(out_dir, exist_ok=True)

cmd = [
    "ffmpeg",
    "-y",
    "-i", video_path,
    "-vf", "fps=0.5",
    "-q:v", "2",
    os.path.join(out_dir, "frame_%04d.jpg")
]

print("Running ffmpeg frame extraction...")
subprocess.run(cmd, check=True)
count = len([f for f in os.listdir(out_dir) if f.endswith(".jpg")])
print(f"Extracted {count} frames to {out_dir}")
