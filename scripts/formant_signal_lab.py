"""Original, OFFLINE, non-linguistic formant signal experiment.

This is not CHamoru pronunciation, a voice model, a phoneme dictionary, or a
learner asset. It creates a short synthetic PCM WAV from self-authored math.
No external media, speech models, dependencies, recordings, or network use.
A fluent speaker must review future CHamoru-specific mapping separately.
"""
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

RATE = 16000
F0 = 140.0
# Generic acoustic demonstration profiles, NOT CHamoru phonemes.
PROFILES = ((760.0, 1180.0), (300.0, 2350.0), (350.0, 900.0))


def render_samples(rate: int = RATE) -> list[int]:
    """Return an original three-profile, speech-like signal with silent gaps."""
    if not isinstance(rate, int) or not 8000 <= rate <= 48000:
        raise ValueError('sample rate must be an integer between 8000 and 48000')
    samples: list[float] = []
    for f1, f2 in PROFILES:
        n = round(rate * 0.42)
        harmonics = []
        for h in range(1, int(min(6000, rate * 0.45) // F0) + 1):
            hz = h * F0
            strength = (
                math.exp(-0.5 * ((hz - f1) / 160.0) ** 2)
                + 0.72 * math.exp(-0.5 * ((hz - f2) / 260.0) ** 2)
                + 0.025
            ) / h ** 0.65
            harmonics.append((hz, strength))
        for i in range(n):
            t = i / rate
            fade = min(1.0, i / (rate * 0.025), (n - i - 1) / (rate * 0.035))
            samples.append(max(0.0, fade) * sum(
                gain * math.sin(2 * math.pi * hz * t) for hz, gain in harmonics
            ))
        samples.extend([0.0] * round(rate * 0.10))
    peak = max((abs(v) for v in samples), default=0.0)
    if peak <= 1e-9:
        raise ValueError('generated signal is silent')
    return [round(max(-1.0, min(1.0, v / peak * 0.72)) * 32767) for v in samples]


def write_demo_wav(path: str | Path) -> dict:
    """Write original mono PCM16. No app or microphone is accessed."""
    samples = render_samples()
    with wave.open(str(path), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
    return {'sample_rate': RATE, 'samples': len(samples),
            'duration_s': round(len(samples) / RATE, 3),
            'status': 'EXPERIMENTAL_SIGNAL_NOT_PRONUNCIATION'}


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('output', type=Path, help='local WAV output path')
    print(write_demo_wav(p.parse_args().output))
