import librosa
import json

# Path to your audio file
audio_path = "content_warning_pixelart.wav"#"test.wav"  # or "song.mp3"
target_path = "content_warning_pixelart.json"

# Load audio
y, sr = librosa.load(audio_path, sr=None)  # sr=None keeps original sample rate

# Extract tempo and beat frames
tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)

# Convert beat frames to timestamps in seconds
beat_times = librosa.frames_to_time(beat_frames, sr=sr)

# Convert to list of floats for JSON
beat_times_list = beat_times.tolist()

# Save to JSON
with open(target_path, "w") as f:
    json.dump(beat_times_list, f, indent=2)

print(f"Detected {len(beat_times_list)} beats at approx {tempo[0]:.2f} BPM.")
print("Saved beats to song_beats.json")
