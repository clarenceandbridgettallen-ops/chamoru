"""Offline original vowel-transition signal laboratory, NOT CHamoru speech.

No external audio, speaker data, machine-learning models or dependencies.
Profiles are generic acoustic targets, NOT approved vowel pronunciations.
A fluent CHamoru speaker must review any later word-level candidate before use.
This file is not imported by the learner application.
"""
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

RATE = 16000
# Invented demonstration profiles, not a language or dialect mapping.
PROFILES = {
    'open': (730.0, 1200.0),
    'front': (340.0, 2250.0),
    'back': (360.0, 920.0),
}
STATUS = 'EXPERIMENTAL_TRANSITION_NOT_SPEECH_OR_PRONUNCIATION'


def render_transition(first: str = 'open', second: str = 'front',
                      rate: int = RATE) -> list[int]:
    """Generate one continuous voiced glide between two generic profiles."""
    if type(rate) is not int or not 8000 <= rate <= 48000:
        raise ValueError('rate must be an integer from 8000 to 48000')
    if first not in PROFILES or second not in PROFILES:
        raise ValueError('unknown generic acoustic profile')
    n = round(rate * 0.84)
    out = []
    max_harmonic = int(min(5200, rate * 0.44) // 155)
    for i in range(n):
        t = i / rate
        progress = i / (n - 1)
        # Smooth coarticulation from 28% through 72% of the signal.
        u = min(1.0, max(0.0, (progress - 0.28) / 0.44))
        blend = u * u * (3 - 2 * u)
        f1 = PROFILES[first][0] * (1 - blend) + PROFILES[second][0] * blend
        f2 = PROFILES[first][1] * (1 - blend) + PROFILES[second][1] * blend
        fundamental = 145 + 9 * math.sin(math.pi * progress)
        phase = 2 * math.pi * (145 * t + 9 * (1 - math.cos(math.pi * progress)) * 0.84 / math.pi)
        amplitude = min(1.0, i / (rate * 0.025), (n - i - 1) / (rate * 0.035))
        value = 0.0
        for h in range(1, max_harmonic + 1):
            hz = h * fundamental
            gain = (math.exp(-0.5 * ((hz - f1) / 165) ** 2)
                    + 0.72 * math.exp(-0.5 * ((hz - f2) / 270) ** 2)
                    + 0.022) / h ** 0.65
            value += gain * math.sin(h * phase)
        out.append(max(0.0, amplitude) * value)
    peak = max((abs(v) for v in out), default=0.0)
    if peak < 1e-8:
        raise ValueError('generated signal is silent')
    return [round(max(-1, min(1, x / peak * 0.70)) * 32767) for x in out]


def write_transition_wav(path: str | Path, first: str = 'open',
                         second: str = 'front') -> dict:
    """Write new PCM16 mono WAV, never overwrite an existing file."""
    samples = render_transition(first, second)
    with Path(path).open('xb') as stream, wave.open(stream, 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
    return {'sample_rate': RATE, 'samples': len(samples),
            'duration_s': round(len(samples) / RATE, 3), 'status': STATUS,
            'reviewed_by_fluent_speaker': False, 'learner_publish_approved': False}


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--first', choices=tuple(PROFILES), default='open')
    parser.add_argument('--second', choices=tuple(PROFILES), default='front')
    args = parser.parse_args()
    print(write_transition_wav(args.output, args.first, args.second))
