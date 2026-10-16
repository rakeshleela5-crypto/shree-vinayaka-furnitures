import os
import subprocess

video_path = r"downloads/playlist_retail_daddy/videos/11_Billing Software Login Panel Features Retail Daddy [-0hS3D9pXBc].mp4"
output_dir = r"downloads/frames_v11"
os.makedirs(output_dir, exist_ok=True)

# Extract 1 frame every 4 seconds or 0.25 fps to get all screens, dialogs and workflows
cmd = [
    "ffmpeg",
    "-y",
    "-i", video_path,
    "-vf", "fps=0.5",
    os.path.join(output_dir, "frame_%04d.jpg")
]

print("Extracting frames from Video 11...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Finished extracting. Return code:", res.returncode)

frames = [f for f in os.listdir(output_dir) if f.endswith('.jpg')]
print(f"Total extracted frames: {len(frames)}")
