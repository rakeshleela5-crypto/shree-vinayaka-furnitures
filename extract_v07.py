import subprocess
import os

video_path = r"downloads\playlist_retail_daddy\videos\07_Customer Supplier Details Outstanding Analysis Details in Billing Software [YfZZPbbY1bw].mp4"
output_dir = r"downloads\frames_v07"

os.makedirs(output_dir, exist_ok=True)

cmd = [
    "ffmpeg",
    "-y",
    "-i", video_path,
    "-vf", "fps=0.5",
    os.path.join(output_dir, "frame_%04d.jpg")
]

print(f"Running ffmpeg extraction for Video 7...")
res = subprocess.run(cmd, capture_output=True, text=True)
print(f"Exit code: {res.returncode}")
count = len([f for f in os.listdir(output_dir) if f.endswith('.jpg')])
print(f"Extracted {count} frames to {output_dir}")
