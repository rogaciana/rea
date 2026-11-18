"""Trilha leve e sons de "pop" nos cortes, gerados do zero (sem material de terceiros).
Uso: python3 audio.py saida.wav"""
import math
import struct
import sys
import wave

SR = 44100
DUR = 35
CORTES = [0, 5, 11, 17, 25, 30]
EFEITOS = {2.3: 880, 6.4: 988, 8.2: 784, 14.4: 196, 19.5: 659, 21.6: 784, 25.2: 392}  # carimbo, plaquinha etc.

n = SR * DUR
buf = [0.0] * n


def soma(t0, dur, freq, vol, forma="seno", queda=6.0):
    i0 = int(t0 * SR)
    for i in range(int(dur * SR)):
        if i0 + i >= n:
            break
        t = i / SR
        env = math.exp(-queda * t) * min(1, t * 200)
        fase = 2 * math.pi * freq * t
        v = math.sin(fase) if forma == "seno" else (1 if math.sin(fase) > 0 else -1) * 0.5
        buf[i0 + i] += v * env * vol


# batida suave (120 bpm) + baixo em Lá menor
notas = [110, 110, 131, 98]
for k in range(DUR * 2):
    t = k * 0.5
    soma(t, 0.18, 70, 0.30, queda=22)  # bumbo macio
    if k % 2 == 1:
        soma(t, 0.06, 2400, 0.04, forma="quad", queda=60)  # chimbau
    soma(t, 0.45, notas[(k // 4) % 4], 0.10, queda=4)
# pequena melodia em pentatônica
mel = [440, 523, 587, 659, 587, 523, 440, 392]
for k in range(DUR * 2):
    if k % 2 == 0:
        soma(k * 0.5 + 0.25, 0.35, mel[(k // 2) % len(mel)], 0.045, queda=7)
# "pop" nos cortes e efeitos
for c in CORTES[1:]:
    soma(c, 0.25, 520, 0.28, queda=14)
    soma(c, 0.25, 780, 0.18, queda=18)
for t0, f in EFEITOS.items():
    soma(t0, 0.3, f, 0.22, queda=12)

pico = max(1e-9, max(abs(x) for x in buf))
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x / pico * 0.85)) * 32767)) for x in buf))
