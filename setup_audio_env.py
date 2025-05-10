import os
import shutil
import subprocess
import importlib.util

FFMPEG_PATH = r"C:\ffmpeg\bin"  # 👈 Customize if your path is different

def check_exec(command):
    try:
        result = subprocess.run([command, '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def check_module(module_name):
    return importlib.util.find_spec(module_name) is not None

def setup():
    print("🔍 Checking audio environment...\n")

    # Step 1: Check ffmpeg & ffprobe
    ffmpeg_ok = check_exec("ffmpeg")
    ffprobe_ok = check_exec("ffprobe")

    if not (ffmpeg_ok and ffprobe_ok):
        print("❌ FFmpeg not found in PATH.")
        print(f"👉 Adding fallback path: {FFMPEG_PATH}\n")
        os.environ["PATH"] += os.pathsep + FFMPEG_PATH
        ffmpeg_ok = check_exec("ffmpeg")
        ffprobe_ok = check_exec("ffprobe")

    if ffmpeg_ok and ffprobe_ok:
        print("✅ FFmpeg and ffprobe are working.\n")
    else:
        print("❌ Still can't find ffmpeg or ffprobe. Please check your installation manually.\n")

    # Step 2: Check required Python libraries
    for lib in ['librosa', 'soundfile', 'audioread']:
        if check_module(lib):
            print(f"✅ {lib} is installed.")
        else:
            print(f"❌ {lib} is missing. Run: pip install {lib}")

    print("\n🔁 Ready to go. If issues persist, restart your terminal after running this.")

if __name__ == "__main__":
    setup()
