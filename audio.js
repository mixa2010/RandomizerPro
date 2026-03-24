const AudioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioContext();
let isMuted = false;

// Загрузка состояния из памяти
if(localStorage.getItem('isMuted') === 'true') {
    isMuted = true;
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateMuteIcon();
}

function updateMuteIcon() {
    const btn = document.getElementById('sound_toggle');
    if(isMuted) {
        btn.innerHTML = '<span class="icon has-text-grey"><i class="fas fa-volume-mute"></i></span>';
    } else {
        btn.innerHTML = '<span class="icon has-text-primary"><i class="fas fa-volume-up"></i></span>';
    }
}

function playTone(freq, type, duration, vol = 0.1) {
    if (isMuted) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type; 
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
}

const SFX = {
    click: () => playTone(800, 'sine', 0.1, 0.05),
    tick: () => playTone(1200, 'square', 0.03, 0.03),
    win: () => {
        if(isMuted) return;
        setTimeout(() => playTone(523.25, 'triangle', 0.2, 0.2), 0);
        setTimeout(() => playTone(659.25, 'triangle', 0.2, 0.2), 150);
        setTimeout(() => playTone(783.99, 'triangle', 0.4, 0.2), 300);
        setTimeout(() => playTone(1046.50, 'sine', 0.6, 0.1), 450);
    },
    roll: () => {
        if(isMuted) return;
        for(let i=0; i<6; i++) setTimeout(() => playTone(200 + Math.random()*300, 'sawtooth', 0.05, 0.05), i*60);
    },
    error: () => playTone(150, 'sawtooth', 0.3, 0.1)
};

// Инит иконки при старте
document.addEventListener('DOMContentLoaded', updateMuteIcon);