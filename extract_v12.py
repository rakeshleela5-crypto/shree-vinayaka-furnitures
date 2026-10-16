import os
import subprocess

video_path = r"c:\Users\rakes\shree vinayaka furnitures\downloads\playlist_retail_daddy\videos\12_Last Video for Sale Panel Video 10 Retail Daddy Billing Software [rEGJb7vh-yo].mp4"
output_dir = r"c:\Users\rakes\shree vinayaka furnitures\downloads\frames_v12"

os.makedirs(output_dir, exist_ok=True)

# Video 12 is ~2233 seconds. 1 frame every 4 seconds gives ~558 high-resolution frames capturing every second and sub-workflow
cmd = [
    "ffmpeg", "-y",
    "-i", video_path,
    "-vf", "fps=0.25",
    "-q:v", "3",
    os.path.join(output_dir, "frame_%04d.jpg")
]

print("Extracting frames from Video 12 (37 minutes duration)...")
subprocess.run(cmd, check=True)
print(f"Extracted frames to {output_dir}")
