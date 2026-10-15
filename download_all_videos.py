import os
import sys
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

playlist_url = "https://youtube.com/playlist?list=PLk8SDfuPj1bCajqxoKAZ1-uX-Gy-bZgtt"
out_dir = os.path.abspath("downloads/playlist_retail_daddy/videos")
os.makedirs(out_dir, exist_ok=True)

out_template = os.path.join(out_dir, "%(playlist_index)02d_%(title)s [%(id)s].%(ext)s")

print(f"Starting bulk download of 24 playlist videos to: {out_dir}")

cmd = [
    "yt-dlp",
    "-f", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[ext=mp4]/best",
    "--no-check-certificates",
    "--ignore-errors",
    "--continue",
    "--no-overwrites",
    "-o", out_template,
    playlist_url
]

try:
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    for line in iter(process.stdout.readline, ''):
        if "[download]" in line or "Merging" in line or "Destination" in line:
            # print progress updates
            line_str = line.strip()
            if "%" in line_str and "ETA" in line_str:
                # print periodic progress
                sys.stdout.write(f"\r{line_str}")
                sys.stdout.flush()
            else:
                print(line_str)
    process.wait()
    print(f"\nBulk download completed with exit code: {process.returncode}")
except Exception as e:
    print(f"Error downloading playlist: {e}")
