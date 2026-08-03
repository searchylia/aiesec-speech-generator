const fs = require('fs');

function makeWav(type, sec) {
    const sr = 44100;
    const n = Math.floor(sr * sec);
    const buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(36 + n * 2, 4);
    buf.write('WAVE', 8);
    buf.write('fmt ', 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20); // PCM
    buf.writeUInt16LE(1, 22); // Mono
    buf.writeUInt32LE(sr, 24);
    buf.writeUInt32LE(sr * 2, 28);
    buf.writeUInt16LE(2, 32);
    buf.writeUInt16LE(16, 34);
    buf.write('data', 36);
    buf.writeUInt32LE(n * 2, 40);

    for (let i = 0; i < n; i++) {
        const t = i / sr;
        let s = 0;
        if (type === 'tick') {
            s = Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 90);
        } else if (type === 'chime') {
            s = (Math.sin(2 * Math.PI * 523 * t) + Math.sin(2 * Math.PI * 659 * t) + Math.sin(2 * Math.PI * 784 * t) + Math.sin(2 * Math.PI * 1046 * t)) * 0.25 * Math.exp(-t * 4);
        } else if (type === 'alarm') {
            const p = (t % 0.25) < 0.15 ? 1 : 0;
            s = p * Math.sin(2 * Math.PI * 880 * t) * 0.7;
        }
        buf.writeInt16LE(Math.floor(Math.min(32767, Math.max(-32768, s * 32767))), 44 + i * 2);
    }
    return 'data:audio/wav;base64,' + buf.toString('base64');
}

const tickB64 = makeWav('tick', 0.04);
const chimeB64 = makeWav('chime', 0.5);
const alarmB64 = makeWav('alarm', 0.9);

const audioTags = `<audio id="tickAudioTag" preload="auto" src="${tickB64}"></audio>
<audio id="chimeAudioTag" preload="auto" src="${chimeB64}"></audio>
<audio id="alarmAudioTag" preload="auto" src="${alarmB64}"></audio>`;

['c:/GC 7.0/index.html', 'c:/GC 7.0/.vscode/LeadScript-v1.html'].forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/<audio id="tickAudioTag"[\s\S]*?<\/audio>/gi, '');
    content = content.replace(/<audio id="chimeAudioTag"[\s\S]*?<\/audio>/gi, '');
    content = content.replace(/<audio id="alarmAudioTag"[\s\S]*?<\/audio>/gi, '');
    content = content.replace(/<audio id="alertSound"[\s\S]*?<\/audio>/gi, '');
    content = content.replace('</body>', audioTags + '\n</body>');
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Successfully embedded high-quality 16-bit 44.1kHz audio tags!');
