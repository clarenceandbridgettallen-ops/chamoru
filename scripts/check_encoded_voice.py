#!/usr/bin/env python3
"""Offline, read-only codec round-trip signal QA for *experimental* CHamoru clips.

Requires locally installed FFmpeg/ffprobe. No network, synthesis, file writes,
transcripts, recording uploads, or pronunciation judgments. This checks that
an encoded clip retains audible-range signal compared with an original WAV.
A pass does NOT establish spoken-word intelligibility, Android playback,
CHamoru pronunciation, or media rights. Input paths are never printed.
"""
import argparse
import array
import json
import math
import os
from pathlib import Path
import subprocess
import sys

MAX_FILE_BYTES = 16 * 1024 * 1024
MAX_DURATION = 30.0
MAX_DECODE_BYTES = 2 * 16000 * 32


def _local_file(value):
    path = Path(value)
    if path.is_symlink() or not path.is_file() or not 0 < path.stat().st_size <= MAX_FILE_BYTES:
        raise ValueError('Input must be a bounded regular local file (not a symlink)')
    return path


def _run(argv, *, timeout=15):
    try:
        p = subprocess.run(argv, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                           stderr=subprocess.PIPE, timeout=timeout, check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ValueError('Offline FFmpeg/ffprobe unavailable or timed out') from exc
    if p.returncode:
        raise ValueError('Local audio metadata or decode failed')
    return p.stdout


def _inspect(path):
    raw = _run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe',
                '-show_entries', 'format=duration:stream=codec_name,codec_type',
                '-of', 'json', str(path)])
    try:
        info = json.loads(raw)
        duration = float(info['format']['duration'])
        codecs = [s['codec_name'] for s in info['streams'] if s.get('codec_type') == 'audio']
    except (ValueError, TypeError, KeyError, OverflowError) as exc:
        raise ValueError('Invalid local audio metadata') from exc
    if not codecs or not math.isfinite(duration) or not 0.25 <= duration <= MAX_DURATION:
        raise ValueError('Missing audio or unsupported clip duration')
    return duration, codecs[0]


def _pcm_metrics(path):
    raw = _run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin',
                '-protocol_whitelist', 'file,pipe', '-i', str(path), '-map', '0:a:0',
                '-ac', '1', '-ar', '16000', '-t', '31', '-fs',
                str(MAX_DECODE_BYTES + 1), '-f', 's16le', 'pipe:1'])
    if not raw or len(raw) % 2 or len(raw) > MAX_DECODE_BYTES:
        raise ValueError('Invalid or excessive decoded PCM')
    samples = array.array('h')
    samples.frombytes(raw)
    if sys.byteorder != 'little':
        samples.byteswap()
    if len(samples) < 4000:
        raise ValueError('Decoded audio is too short')
    sq = sum(x * x for x in samples)
    rms = math.sqrt(sq / len(samples)) / 32768
    rms_db = round(20 * math.log10(max(rms, 1 / 32768)), 2)
    quiet = 0
    windows = 0
    for start in range(0, len(samples), 1600):
        block = samples[start:start + 1600]
        power = sum(x * x for x in block) / len(block)
        quiet += math.sqrt(power) / 32768 < 10 ** (-45 / 20)
        windows += 1
    return rms_db, round(quiet / windows, 4), len(samples) / 16000


def compare(original_wav, encoded):
    src = _local_file(original_wav)
    dst = _local_file(encoded)
    src_duration, src_codec = _inspect(src)
    dst_duration, dst_codec = _inspect(dst)
    if src_codec != 'pcm_s16le' or src.suffix.lower() != '.wav':
        raise ValueError('Reference must be 16-bit PCM WAV')
    if dst_codec not in ('mp3', 'opus', 'vorbis', 'aac', 'flac', 'pcm_s16le'):
        raise ValueError('Encoded format is not in the reviewed codec allowlist')
    original_db, original_quiet, original_len = _pcm_metrics(src)
    decoded_db, decoded_quiet, decoded_len = _pcm_metrics(dst)
    problems = []
    if original_db < -38 or original_quiet > 0.85:
        problems.append('Original signal is too quiet or mostly silent')
    if decoded_db < -38 or decoded_quiet > 0.85:
        problems.append('Encoded signal is too quiet or mostly silent')
    if abs(decoded_db - original_db) > 6:
        problems.append('Encoded level differs from reference by more than 6 dB')
    if abs(dst_duration - src_duration) > 0.30 or abs(decoded_len - original_len) > 0.30:
        problems.append('Encoded duration differs from reference by more than 300 ms')
    return {'status': 'CODEC_SIGNAL_PASS_ONLY' if not problems else 'CODEC_SIGNAL_FAIL',
            'reference_codec': src_codec, 'encoded_codec': dst_codec,
            'reference_rms_dbfs': original_db, 'encoded_rms_dbfs': decoded_db,
            'reference_silent_fraction': original_quiet,
            'encoded_silent_fraction': decoded_quiet,
            'problems': problems,
            'limits': 'No Android/browser decode, speech intelligibility, pronunciation, or rights verification'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('reference_wav')
    parser.add_argument('encoded_clip')
    args = parser.parse_args()
    try:
        result = compare(args.reference_wav, args.encoded_clip)
    except ValueError as exc:
        print(json.dumps({'status': 'INVALID_AUDIO', 'error': str(exc)}))
        return 2
    print(json.dumps(result, sort_keys=True))
    return 0 if result['status'] == 'CODEC_SIGNAL_PASS_ONLY' else 1


if __name__ == '__main__':
    sys.exit(main())
