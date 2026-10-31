import importlib.util
import math
from pathlib import Path
import shutil
import subprocess
import sys
import wave
import pytest

spec = importlib.util.spec_from_file_location('candidate', Path(__file__).with_name('prototype_speech_candidate.py'))
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)


def write_wav(path, amplitude=7000, duration=.8):
    import array
    rate = 22050
    samples = array.array('h', (int(amplitude * math.sin(2 * math.pi * 220 * i / rate))
                                  for i in range(int(rate * duration))))
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes(samples.tobytes())


def fake_runner(args, **kwargs):
    write_wav(args[args.index('-w')+1])
    return subprocess.CompletedProcess(args, 0)


def test_creates_measurable_wav(tmp_path):
    out = tmp_path/'candidate.wav'
    stats = c.generate(out, runner=fake_runner)
    assert out.is_file()
    assert stats['status'].endswith('PRONUNCIATION_UNVERIFIED')
    assert stats['rms_dbfs'] > -38
    assert stats['android_playback'] == 'NOT TESTED'


def test_rejects_overwrite(tmp_path):
    out = tmp_path/'candidate.wav'; out.write_bytes(b'KEEP')
    with pytest.raises(ValueError, match='overwrites'):
        c.generate(out, runner=fake_runner)
    assert out.read_bytes() == b'KEEP'


def test_rejects_symlink(tmp_path):
    original = tmp_path/'original.wav'; original.write_bytes(b'KEEP')
    (tmp_path/'candidate.wav').symlink_to(original)
    with pytest.raises(ValueError, match='overwrites'):
        c.generate(tmp_path/'candidate.wav', runner=fake_runner)
    assert original.read_bytes() == b'KEEP'


def test_rejects_invalid_output_extension(tmp_path):
    with pytest.raises(ValueError, match='.wav'):
        c.generate(tmp_path/'candidate.mp3', runner=fake_runner)


def test_rejects_silence_and_cleans_temp(tmp_path):
    def silent(args, **kwargs):
        write_wav(args[args.index('-w')+1], amplitude=0)
        return subprocess.CompletedProcess(args, 0)
    with pytest.raises(ValueError, match='too quiet'):
        c.generate(tmp_path/'candidate.wav', runner=silent)
    assert list(tmp_path.iterdir()) == []


def test_rejects_failed_engine_and_cleans_temp(tmp_path):
    def failed(args, **kwargs):
        return subprocess.CompletedProcess(args, 1)
    with pytest.raises(ValueError, match='synthesis failed'):
        c.generate(tmp_path/'candidate.wav', runner=failed)
    assert list(tmp_path.iterdir()) == []


def test_rejects_timeout(tmp_path):
    def timeout(args, **kwargs):
        raise subprocess.TimeoutExpired(args, 15)
    with pytest.raises(ValueError, match='timed out'):
        c.generate(tmp_path/'candidate.wav', runner=timeout)
    assert list(tmp_path.iterdir()) == []


def test_rejects_short_wav(tmp_path):
    def short(args, **kwargs):
        write_wav(args[args.index('-w')+1], duration=.1)
        return subprocess.CompletedProcess(args, 0)
    with pytest.raises(ValueError, match='duration'):
        c.generate(tmp_path/'candidate.wav', runner=short)


@pytest.mark.skipif(shutil.which('espeak') is None, reason='independent local eSpeak absent')
def test_real_offline_espeak_signal(tmp_path):
    stats = c.generate(tmp_path/'candidate.wav')
    assert stats['duration_seconds'] > .3
    assert stats['rms_dbfs'] > -38
    assert stats['language_review'] == 'NOT REVIEWED'
