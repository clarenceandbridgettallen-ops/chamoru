#!/usr/bin/env python3
"""Optional offline Chromium audio-codec smoke test; NOT CHamoru pronunciation QA.

Requires locally installed Playwright Python, Chromium and FFmpeg with MP3,
Opus and Vorbis encoders. Generates a disposable original 440-Hz test tone.
No app data, network requests, third-party audio or speaker listening involved.
This checks decoding and playback-clock movement, not audible output.
"""
import base64
import json
import math
import struct
import subprocess
import tempfile
import wave
from pathlib import Path

from playwright.sync_api import sync_playwright

SAMPLE_RATE = 22050
SECONDS = 1.2
FORMATS = (
    ('wav', 'original.wav', 'audio/wav'),
    ('mp3', 'original.mp3', 'audio/mpeg'),
    ('opus', 'original.ogg', 'audio/ogg; codecs=opus'),
    ('vorbis', 'original.oga', 'audio/ogg; codecs=vorbis'),
)


def make_samples(directory):
    source = directory / 'original.wav'
    with wave.open(str(source), 'wb') as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(SAMPLE_RATE)
        stream.writeframes(b''.join(struct.pack('<h', int(9000 * math.sin(2 * math.pi * 440 * i / SAMPLE_RATE)))
                                    for i in range(round(SAMPLE_RATE * SECONDS))))
    for filename, encoder in (
        ('original.mp3', ['-codec:a', 'libmp3lame', '-b:a', '64k']),
        ('original.ogg', ['-codec:a', 'libopus', '-b:a', '48k']),
        ('original.oga', ['-codec:a', 'libvorbis', '-q:a', '4']),
    ):
        subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
                        '-i', str(source), *encoder, str(directory / filename)],
                       check=True, timeout=20)
    return {label: base64.b64encode((directory / filename).read_bytes()).decode('ascii')
            for label, filename, _ in FORMATS}


BROWSER_TEST = r"""async ({payload, formats}) => {
  const context = new AudioContext();
  const result = {browser: navigator.userAgent, formats: {}};
  for (const [label, filename, mime] of formats) {
    const audio = document.createElement('audio');
    audio.src = 'data:' + mime + ';base64,' + payload[label];
    const info = {canPlayType: audio.canPlayType(mime)};
    try {
      const raw = atob(payload[label]);
      const buffer = Uint8Array.from(raw, ch => ch.charCodeAt(0)).buffer;
      const decoded = await context.decodeAudioData(buffer);
      const samples = decoded.getChannelData(0);
      let power = 0;
      for (let i = 0; i < samples.length; i++) power += samples[i] ** 2;
      info.decodedRms = Math.sqrt(power / samples.length);
      info.decodedDuration = decoded.duration;
      await audio.play();
      await new Promise(resolve => setTimeout(resolve, 220));
      info.playbackSeconds = audio.currentTime;
      audio.pause();
      info.passed = info.decodedRms > 0.01 && info.playbackSeconds > 0.05 &&
                    info.decodedDuration > 1 && info.decodedDuration < 1.4;
    } catch (err) {
      info.passed = false;
      info.error = String(err);
    }
    result.formats[label] = info;
  }
  await context.close();
  return result;
}"""


def main():
    with tempfile.TemporaryDirectory(prefix='chamoru-codec-smoke-') as temp:
        payload = make_samples(Path(temp))
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True)
            try:
                page = browser.new_page()
                page.set_content('<!doctype html><title>Offline synthetic audio codec QA</title>')
                result = page.evaluate(BROWSER_TEST, {'payload': payload, 'formats': FORMATS})
            finally:
                browser.close()
    result['disclaimer'] = ('Synthetic tone only; no CHamoru voice, fluent review, human hearing, '
                            'Android device, site deployment, or real media tested.')
    print(json.dumps(result, indent=2))
    return 0 if len(result['formats']) == 4 and all(x['passed'] for x in result['formats'].values()) else 1


if __name__ == '__main__':
    raise SystemExit(main())
