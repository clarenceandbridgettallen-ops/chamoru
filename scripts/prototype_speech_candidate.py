#!/usr/bin/env python3
"""Offline *unreviewed* synthetic-speech experiment, never an app asset.

This runs an independently installed eSpeak executable. It does NOT provide a
CHamoru voice, certified phonology, redistribution rights, or Android proof.
The English phonetic approximation is a test input, NOT a pronunciation guide.
No media, names, recordings or transcripts are uploaded or logged.
"""
import argparse
import json
import math
import os
from pathlib import Path
import subprocess
import tempfile
import wave

EXPERIMENT = ('Håfa adai', 'hah fah ah dye')
MAX_BYTES = 1024 * 1024


def inspect_signal(path):
    with wave.open(str(path), 'rb') as wav:
        if wav.getcomptype() != 'NONE' or wav.getnchannels() != 1 or wav.getsampwidth() != 2:
            raise ValueError('Unsupported synthesized WAV format')
        rate, frames = wav.getframerate(), wav.getnframes()
        if not (16000 <= rate <= 48000 and .3 <= frames / rate <= 8):
            raise ValueError('Unsupported synthesized WAV duration or sample rate')
        if frames * 2 > MAX_BYTES:
            raise ValueError('Synthesized WAV exceeds size limit')
        import array
        import sys
        samples = array.array('h')
        samples.frombytes(wav.readframes(frames))
        if sys.byteorder != 'little':
            samples.byteswap()
        if len(samples) != frames:
            raise ValueError('Truncated synthesized WAV')
        rms = math.sqrt(sum(v*v for v in samples) / len(samples)) / 32768
        dbfs = round(20 * math.log10(max(rms, 1 / 32768)), 2)
        if dbfs < -38:
            raise ValueError('Synthesized speech candidate is too quiet')
        return {'status': 'SPEECH_SIGNAL_ONLY_PRONUNCIATION_UNVERIFIED',
                'duration_seconds': round(frames / rate, 3),
                'sample_rate_hz': rate, 'rms_dbfs': dbfs,
                'engine': 'independent local espeak (GPL terms require review)',
                'language_review': 'NOT REVIEWED',
                'android_playback': 'NOT TESTED'}


def generate(output, *, executable='espeak', runner=subprocess.run):
    target = Path(output)
    if target.suffix.lower() != '.wav' or target.is_symlink() or target.exists():
        raise ValueError('Choose a new .wav output path; overwrites are forbidden')
    if not target.parent.is_dir() or target.parent.is_symlink():
        raise ValueError('Output parent must be an existing regular directory')
    fd, tmp_name = tempfile.mkstemp(prefix='.chamoru-lab-', suffix='.wav', dir=target.parent)
    os.close(fd)
    try:
        try:
            result = runner([executable, '-v', 'en-us', '-s', '118', '-p', '45',
                             '-a', '135', '-w', tmp_name, EXPERIMENT[1]],
                            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                            stderr=subprocess.PIPE, timeout=15, check=False)
        except (OSError, subprocess.TimeoutExpired) as exc:
            raise ValueError('Local synthesis unavailable or timed out') from exc
        if result.returncode:
            raise ValueError('Local synthesis failed')
        metrics = inspect_signal(tmp_name)
        os.link(tmp_name, target)  # O_EXCL-like publish: cannot overwrite existing files
        return metrics
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', required=True)
    p.add_argument('--unreviewed-experiment', action='store_true')
    args = p.parse_args()
    if not args.unreviewed_experiment:
        p.error('Pass --unreviewed-experiment to acknowledge this is not CHamoru speech approval')
    try:
        metrics = generate(args.output)
    except (ValueError, OSError, wave.Error) as exc:
        print(json.dumps({'status': 'EXPERIMENT_FAILED', 'error': str(exc)}))
        return 2
    print(json.dumps(metrics, sort_keys=True))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
