"""Deterministic, synthetic signal tests. No real CHamoru voices are used."""
import math
import os
import struct
import subprocess
import sys
import tempfile
import unittest
import wave
from pathlib import Path

from check_voice_wav import analyze


def write_wav(path, rate=16000, seconds=1.0, amplitude=.2, silence_start=0,
              channels=1, dc=0, clipped=False):
    n = int(rate * seconds)
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(channels)
        f.setsampwidth(2)
        f.setframerate(rate)
        for i in range(n):
            v = dc + (amplitude * math.sin(2 * math.pi * 220 * i / rate) if i >= int(rate * silence_start) else 0)
            if clipped:
                v = 1.0
            value = max(-32768, min(32767, round(v * 32767)))
            f.writeframesraw(struct.pack('<h', value) * channels)


class TestVoiceSignalGate(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'private-voice.wav'

    def test_audible_synthetic_signal_passes_but_never_certifies_pronunciation(self):
        write_wav(self.path, silence_start=.1)
        report = analyze(self.path)
        self.assertEqual(report['status'], 'SIGNAL_PASS_PRONUNCIATION_UNVERIFIED')
        self.assertGreater(report['rms_dbfs'], -25)
        self.assertNotIn(str(self.path), str(report))

    def test_all_silent_is_rejected(self):
        write_wav(self.path, amplitude=0)
        self.assertIn('RMS signal is too quiet', analyze(self.path)['problems'])

    def test_long_nearly_silent_asset_is_rejected(self):
        write_wav(self.path, seconds=2, silence_start=1.9)
        self.assertIn('Mostly silent 100ms windows', analyze(self.path)['problems'])

    def test_clipping_rejected(self):
        write_wav(self.path, clipped=True)
        self.assertIn('Clipping detected', analyze(self.path)['problems'])

    def test_dc_offset_rejected(self):
        write_wav(self.path, amplitude=0, dc=.3)
        self.assertIn('Large DC offset', analyze(self.path)['problems'])

    def test_stereo_supported(self):
        write_wav(self.path, channels=2)
        self.assertEqual(analyze(self.path)['channels'], 2)

    def test_invalid_rate_rejected(self):
        write_wav(self.path, rate=8000)
        with self.assertRaises(ValueError):
            analyze(self.path)

    def test_too_short_rejected(self):
        write_wav(self.path, seconds=.1)
        with self.assertRaises(ValueError):
            analyze(self.path)

    def test_truncated_wav_rejected(self):
        write_wav(self.path)
        self.path.write_bytes(self.path.read_bytes()[:-40])
        with self.assertRaises(ValueError):
            analyze(self.path)

    def test_command_line_never_prints_path(self):
        write_wav(self.path, amplitude=0)
        proc = subprocess.run([sys.executable, str(Path(__file__).with_name('check_voice_wav.py')), str(self.path)], capture_output=True, text=True)
        self.assertEqual(proc.returncode, 1)
        self.assertNotIn(str(self.path), proc.stdout + proc.stderr)

    def test_missing_path_not_exposed(self):
        proc = subprocess.run([sys.executable, str(Path(__file__).with_name('check_voice_wav.py')), str(self.path)], capture_output=True, text=True)
        self.assertEqual(proc.returncode, 2)
        self.assertNotIn(str(self.path), proc.stdout + proc.stderr)


if __name__ == '__main__':
    unittest.main()
