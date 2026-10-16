import os
import subprocess

video_path = r"c:\Users\rakes\shree vinayaka furnitures\downloads\playlist_retail_daddy\videos\13_Loyalty Point Option and Sale Return Adjustment option Retail Daddy Billing Software [_CvPherccNE].mp4"
output_dir = r"c:\Users\rakes\shree vinayaka furnitures\downloads\frames_v13"

os.makedirs(output_dir, exist_ok=True)

# Extract 1 frame every 2 seconds
cmd = [
    "ffmpeg", "-y",
    "-i", video_path,
    "-vf", "fps=0.5",
    os.path.join(output_dir, "frame_%04d.jpg")
]

print("Extracting frames from Video 13...")
subprocess.run(cmd, check=True)
print(f"Extracted frames to {output_dir}")
