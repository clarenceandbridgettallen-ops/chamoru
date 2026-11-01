"""Regression tests for the non-linguistic, original offline signal lab."""
import math
import struct
import tempfile
import unittest
import wave
from pathlib import Path

from formant_signal_lab import RATE, render_samples, write_demo_wav


class FormantSignalTests(unittest.TestCase):
    def test_rate_validation(self):
        for bad in (0, 7999, 48001, 16000.5, '16000'):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                render_samples(bad)

    def test_signal_has_duration_and_nonzero_ac_energy(self):
        s = render_samples()
        self.assertEqual(len(s), int(RATE * 0.52) * 3)
        rms = math.sqrt(sum(v*v for v in s) / len(s)) / 32768
        self.assertGreater(rms, 0.03)
        self.assertLess(max(abs(v) for v in s), 32767)
        self.assertGreater(len(set(s)), 1000)

    def test_three_profiles_differ_and_gaps_are_silent(self):
        s = render_samples()
        n = round(RATE * 0.52)
        self.assertTrue(all(v == 0 for v in s[round(RATE*.42):n]))
        self.assertTrue(all(v == 0 for v in s[n+round(RATE*.42):2*n]))
        chunks = [s[k*n:(k+1)*n] for k in range(3)]
        self.assertNotEqual(chunks[0], chunks[1])
        self.assertNotEqual(chunks[1], chunks[2])

    def test_wav_is_real_mono_pcm16(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'signal.wav'
            report = write_demo_wav(path)
            with wave.open(str(path), 'rb') as w:
                self.assertEqual((w.getnchannels(), w.getsampwidth(), w.getframerate()), (1,2,RATE))
                self.assertEqual(w.getnframes(), report['samples'])
                vals = struct.unpack('<' + 'h'*w.getnframes(), w.readframes(w.getnframes()))
                self.assertGreater(max(vals), 1000)
            self.assertEqual(report['status'], 'EXPERIMENTAL_SIGNAL_NOT_PRONUNCIATION')


if __name__ == '__main__':
    unittest.main()
