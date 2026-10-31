"""Synthetic codec QA only: tones are NOT CHamoru speech or pronunciation."""
import math
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import wave
import pytest
from check_encoded_voice import compare, main

pytestmark = pytest.mark.skipif(not shutil.which('ffmpeg') or not shutil.which('ffprobe'), reason='free FFmpeg required')


def wav(path, amplitude=10000, seconds=1.0, silence=False):
    with wave.open(str(path), 'wb') as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(16000)
        out.writeframes(b''.join(struct.pack('<h', 0 if silence else round(amplitude * math.sin(2 * math.pi * 440 * i / 16000))) for i in range(round(16000 * seconds))))
    return path


def encode(src, dest, codec='libmp3lame'):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-c:a', codec, str(dest)], check=True)
    return dest


def test_mp3_roundtrip_pass(tmp_path):
    src = wav(tmp_path / 'source.wav'); dst = encode(src, tmp_path / 'test.mp3')
    result = compare(src, dst)
    assert result['status'] == 'CODEC_SIGNAL_PASS_ONLY'
    assert result['encoded_codec'] == 'mp3'
    assert 'Android/browser' in result['limits']


def test_opus_roundtrip_pass(tmp_path):
    src = wav(tmp_path / 'source.wav'); dst = encode(src, tmp_path / 'test.opus', 'libopus')
    assert compare(src, dst)['status'] == 'CODEC_SIGNAL_PASS_ONLY'


def test_silent_encoded_fails(tmp_path):
    src = wav(tmp_path / 'source.wav'); muted = wav(tmp_path / 'muted.wav', silence=True)
    dst = encode(muted, tmp_path / 'muted.mp3')
    assert compare(src, dst)['status'] == 'CODEC_SIGNAL_FAIL'


def test_silent_reference_fails(tmp_path):
    src = wav(tmp_path / 'source.wav', silence=True); dst = encode(src, tmp_path / 'test.mp3')
    assert compare(src, dst)['status'] == 'CODEC_SIGNAL_FAIL'


def test_duration_mismatch_fails(tmp_path):
    src = wav(tmp_path / 'source.wav', seconds=1); other = wav(tmp_path / 'other.wav', seconds=2)
    dst = encode(other, tmp_path / 'test.mp3')
    assert 'duration' in ' '.join(compare(src, dst)['problems']).lower()


def test_rejects_symlink(tmp_path):
    src = wav(tmp_path / 'source.wav'); link = tmp_path / 'link.wav'; link.symlink_to(src)
    with pytest.raises(ValueError, match='symlink'):
        compare(link, src)


def test_rejects_corrupt_audio(tmp_path):
    src = wav(tmp_path / 'source.wav'); bad = tmp_path / 'bad.mp3'; bad.write_bytes(b'not audio')
    with pytest.raises(ValueError, match='decode|metadata'):
        compare(src, bad)


def test_rejects_unsupported_short_audio(tmp_path):
    src = wav(tmp_path / 'short.wav', seconds=.1)
    with pytest.raises(ValueError, match='duration'):
        compare(src, src)


def test_no_path_leak_on_cli_error(tmp_path, capsys, monkeypatch):
    secret = tmp_path / 'private_name.wav'
    monkeypatch.setattr(sys, 'argv', ['check_encoded_voice.py', str(secret), str(secret)])
    assert main() == 2
    assert 'private_name' not in capsys.readouterr().out
