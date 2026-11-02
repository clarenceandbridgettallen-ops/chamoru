"""Dependency-free offline signal checks; not listening or language QA."""
import math
import tempfile
import unittest
import wave
from pathlib import Path

from formant_transition_lab import RATE, STATUS, render_transition, write_transition_wav


class TransitionLabTests(unittest.TestCase):
    def test_repeatable_and_distinct_profile_order(self):
        a = render_transition('open', 'front')
        self.assertEqual(a, render_transition('open', 'front'))
        self.assertNotEqual(a, render_transition('front', 'open'))

    def test_pcm_non_silent_and_not_clipped(self):
        a = render_transition()
        self.assertEqual(len(a), round(RATE * .84))
        rms = math.sqrt(sum(x*x for x in a) / len(a)) / 32767
        self.assertGreater(rms, .03)
        self.assertLess(rms, .70)
        self.assertLess(max(abs(x) for x in a), 32767)
        middle = a[int(.35 * len(a)):int(.65 * len(a))]
        self.assertGreater(math.sqrt(sum(x*x for x in middle)/len(middle))/32767, .03)

    def test_reject_invalid_profile_and_rate(self):
        for rate in (True, 0, 7999, 48001, 16000.0):
            with self.assertRaises(ValueError):
                render_transition(rate=rate)
        with self.assertRaises(ValueError):
            render_transition('unknown', 'front')

    def test_exclusive_pcm_wav_and_review_gates(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / 'demo.wav'
            result = write_transition_wav(path)
            self.assertEqual(result['status'], STATUS)
            self.assertFalse(result['reviewed_by_fluent_speaker'])
            self.assertFalse(result['learner_publish_approved'])
            with wave.open(str(path), 'rb') as w:
                self.assertEqual((w.getnchannels(), w.getsampwidth(), w.getframerate()), (1, 2, RATE))
                self.assertEqual(w.getnframes(), result['samples'])
            with self.assertRaises(FileExistsError):
                write_transition_wav(path)


if __name__ == '__main__':
    unittest.main()
