import os
import subprocess

videos_dir = r"downloads\playlist_retail_daddy\videos"
target_file = None
for f in os.listdir(videos_dir):
    if f.startswith("09_") and f.endswith(".mp4"):
        target_file = os.path.join(videos_dir, f)
        break

if target_file:
    clean_path = os.path.join(videos_dir, "09_video_clean.mp4")
    if not os.path.exists(clean_path):
        os.rename(target_file, clean_path)
    print("Renamed to:", clean_path)
    video_path = clean_path
else:
    video_path = os.path.join(videos_dir, "09_video_clean.mp4")

output_dir = r"downloads\frames_v09"
os.makedirs(output_dir, exist_ok=True)

# 934 seconds -> extract 1 frame per 2 seconds -> ~467 frames
cmd = ['ffmpeg', '-y', '-i', video_path, '-vf', 'fps=0.5', os.path.join(output_dir, 'frame_%04d.jpg')]
print("Running ffmpeg on", video_path, flush=True)
subprocess.run(cmd)
frames = os.listdir(output_dir)
print(f"Done! Extracted {len(frames)} frames into {output_dir}", flush=True)
