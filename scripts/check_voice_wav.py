#!/usr/bin/env python3
"""Offline PCM-WAV signal gate for *experimental* CHamoru speech assets.

No network, speech synthesis, pronunciation scoring, recording, or file writes.
Outputs signal statistics only (never filenames, media, transcripts, or voices).
Passing signal QA is NOT approval of CHamoru pronunciation or redistribution.
"""
import argparse
import array
import json
import math
import sys
import wave

WINDOW_SECONDS = 0.10
SILENT_WINDOW_DBFS = -45.0
MIN_VOICE_DBFS = -38.0
MAX_SILENT_WINDOWS = 0.85
MAX_CLIPPED_SAMPLES = 0.005
MAX_DC_OFFSET = 0.10


def analyze(path):
    try:
        with wave.open(str(path), 'rb') as wav:
            rate = wav.getframerate()
            channels = wav.getnchannels()
            frames = wav.getnframes()
            if wav.getcomptype() != 'NONE' or wav.getsampwidth() != 2 or channels not in (1, 2):
                raise ValueError('Only uncompressed 16-bit mono/stereo PCM WAV is supported')
            if not 16000 <= rate <= 48000 or frames < int(rate * .2):
                raise ValueError('Unsupported sample rate or too-short audio')
            window_frames = max(1, round(rate * WINDOW_SECONDS))
            sample_count = 0
            sum_squares = 0
            signed_sum = 0
            max_absolute = 0
            clipped = 0
            silent_windows = 0
            windows = 0
            while True:
                raw = wav.readframes(window_frames)
                if not raw:
                    break
                if len(raw) % 2:
                    raise ValueError('Truncated PCM frame')
                samples = array.array('h')
                samples.frombytes(raw)
                if sys.byteorder != 'little':
                    samples.byteswap()
                if len(samples) % channels:
                    raise ValueError('Truncated PCM channel frame')
                squares = 0
                for sample in samples:
                    squares += sample * sample
                    signed_sum += sample
                    abs_sample = abs(sample)
                    max_absolute = max(max_absolute, abs_sample)
                    clipped += abs_sample >= 32760
                n = len(samples)
                sample_count += n
                sum_squares += squares
                windows += 1
                if math.sqrt(squares / n) / 32768 < 10 ** (SILENT_WINDOW_DBFS / 20):
                    silent_windows += 1
            if sample_count != frames * channels:
                raise ValueError('Truncated WAV sample data')
    except (wave.Error, EOFError, OSError) as exc:
        raise ValueError('Unreadable PCM WAV') from exc
    if not sample_count:
        raise ValueError('Empty WAV')
    rms = math.sqrt(sum_squares / sample_count) / 32768
    dbfs = round(20 * math.log10(max(rms, 1 / 32768)), 2)
    silence = round(silent_windows / windows, 4)
    clip_fraction = round(clipped / sample_count, 6)
    dc = round(abs(signed_sum / sample_count) / 32768, 5)
    problems = []
    if dbfs < MIN_VOICE_DBFS:
        problems.append('RMS signal is too quiet')
    if silence > MAX_SILENT_WINDOWS:
        problems.append('Mostly silent 100ms windows')
    if clip_fraction > MAX_CLIPPED_SAMPLES:
        problems.append('Clipping detected')
    if dc > MAX_DC_OFFSET:
        problems.append('Large DC offset')
    return {
        'status': 'SIGNAL_PASS_PRONUNCIATION_UNVERIFIED' if not problems else 'SIGNAL_FAIL',
        'sample_rate_hz': rate, 'channels': channels, 'duration_seconds': round(frames / rate, 3),
        'rms_dbfs': dbfs, 'peak_dbfs': round(20 * math.log10(max(max_absolute / 32768, 1 / 32768)), 2),
        'silent_window_fraction': silence, 'clipped_sample_fraction': clip_fraction,
        'dc_offset_fraction': dc, 'problems': problems,
        'limits': 'PCM signal only; no spoken-word audibility, codec-on-Android, licensing, or pronunciation certification',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('wav', help='Local WAV file; path is never printed')
    args = parser.parse_args()
    try:
        result = analyze(args.wav)
    except ValueError as exc:
        print(json.dumps({'status': 'INVALID_WAV', 'error': str(exc)}))
        return 2
    print(json.dumps(result, sort_keys=True))
    return 0 if result['status'].startswith('SIGNAL_PASS') else 1


if __name__ == '__main__':
    sys.exit(main())
