import librosa
import librosa.display
import json
import sys

def extract_beats(audio_path, output_json="beats.json"):
    # Ses dosyasını yükle
    y, sr = librosa.load(audio_path)

    # Tempogram analizi (tempo + beat tracking)
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units='frames')

    # Frame → Zaman (saniye)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)

    # JSON formatına dönüştür
    beat_data = {
        "file": audio_path,
        "tempo_bpm": float(tempo),
        "beats": [float(t) for t in beat_times]
    }

    # Kaydet
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(beat_data, f, indent=4)

    print(f"[OK] Tempo tahmini: {tempo:.2f} BPM")
    print(f"[OK] {len(beat_times)} adet beat bulundu")
    print(f"[OK] Sonuç kaydedildi: {output_json}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: python extract_beats.py input_audio.mp3 [output.json]")
    else:
        audio_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else "beats.json"
        extract_beats(audio_file, output_file)
