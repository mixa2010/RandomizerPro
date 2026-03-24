// --- HACKER SYSTEM ---
const HackSystem = {
    state: {
        forcedNum: null, bannedNum: null, probNum: null, probVal: 0,
        godModeRPS: false, coinFix: null
    },
    init: function() {
        const saved = localStorage.getItem('hack_data');
        if(saved) this.state = JSON.parse(saved);
        this.renderConsole();
    },
    save: function() { localStorage.setItem('hack_data', JSON.stringify(this.state)); },
    renderConsole: function() {
        const input = document.getElementById('hacker_cmd');
        if(!input) return;
        input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') {
                const val = input.value.trim();
                if(val) this.runCommand(val);
                input.value = '';
            }
        });
    },
    log: function(msg, isError=false) {
        const div = document.createElement('div');
        div.textContent = `> ${msg}`;
        div.style.color = isError ? '#ff4444' : '#00ff00';
        const out = document.getElementById('hacker_output');
        if(out) { out.appendChild(div); out.scrollTop = out.scrollHeight; }
    },
    open: function() {
        document.getElementById('hacker_terminal').style.display = 'flex';
        document.getElementById('hacker_cmd').focus();
        this.log("SYSTEM ACCESS GRANTED.");
    },
    close: function() { document.getElementById('hacker_terminal').style.display = 'none'; },
    runCommand: function(str) {
        this.log(str);
        const parts = str.split(' ');
        const cmd = parts[0].toLowerCase();
        switch(cmd) {
            case 'help':
                this.log("force [num] - Force number");
                this.log("ban [num] - Ban number");
                this.log("prob [num] [%] - Set probability");
                this.log("godmode - Win RPS");
                this.log("coin [orel/reshka] - Fix coin");
                this.log("reset - Reset hacks");
                break;
            case 'force':
                this.state.forcedNum = parseInt(parts[1]);
                this.state.bannedNum = null; this.state.probNum = null;
                this.save(); this.log(`FORCE: ${parts[1]}`); break;
            case 'ban':
                this.state.bannedNum = parseInt(parts[1]);
                this.state.forcedNum = null;
                this.save(); this.log(`BAN: ${parts[1]}`); break;
            case 'prob':
                this.state.probNum = parseInt(parts[1]);
                this.state.probVal = parseInt(parts[2]);
                this.state.forcedNum = null;
                this.save(); this.log(`PROB: ${parts[1]} @ ${parts[2]}%`); break;
            case 'godmode':
                this.state.godModeRPS = !this.state.godModeRPS;
                this.save(); this.log(`GODMODE: ${this.state.godModeRPS}`); break;
            case 'coin':
                this.state.coinFix = (parts[1] === 'orel') ? 'heads' : (parts[1] === 'reshka' ? 'tails' : null);
                this.save(); this.log(`COIN: ${this.state.coinFix}`); break;
            case 'reset':
                this.state = { forcedNum: null, bannedNum: null, probNum: null, probVal: 0, godModeRPS: false, coinFix: null };
                this.save(); this.log("RESET DONE"); break;
            case 'exit': this.close(); break;
            default: this.log("Unknown cmd", true);
        }
    }
};
function closeConsole() { HackSystem.close(); }

// --- AUDIO ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioContext();
let isMuted = localStorage.getItem('isMuted') === 'true';

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    const btn = document.getElementById('sound_toggle');
    if(btn) btn.innerHTML = isMuted ? '<span class="icon has-text-grey"><i class="fas fa-volume-mute"></i></span>' : '<span class="icon has-text-primary"><i class="fas fa-volume-up"></i></span>';
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
    },
    roll: () => {
        if(isMuted) return;
        for(let i=0; i<6; i++) setTimeout(() => playTone(200 + Math.random()*300, 'sawtooth', 0.05, 0.05), i*60);
    },
    error: () => playTone(150, 'sawtooth', 0.3, 0.1)
};

// --- WHEEL LOGIC ---
let wheelCtx, wheelCanvas, wheelSegments = [], currentAngle = 0, isSpinning = false;
function initWheel() {
    wheelCanvas = document.getElementById('wheelCanvas');
    if(!wheelCanvas) return;
    wheelCtx = wheelCanvas.getContext('2d');
    const raw = document.getElementById('wheel_input').value;
    wheelSegments = raw.split('\n').filter(x => x.trim() !== '');
    drawWheel();
}
function drawWheel() {
    if (wheelSegments.length === 0) return;
    const num = wheelSegments.length;
    const arc = 2 * Math.PI / num;
    const colors = ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'];
    const radius = 250;
    wheelCtx.clearRect(0,0,500,500);
    wheelCtx.translate(250, 250);
    wheelCtx.rotate(currentAngle * Math.PI / 180);
    for(let i=0; i<num; i++) {
        const angle = i * arc;
        wheelCtx.beginPath();
        wheelCtx.fillStyle = colors[i % colors.length];
        wheelCtx.moveTo(0, 0);
        wheelCtx.arc(0, 0, radius, angle, angle + arc);
        wheelCtx.lineTo(0, 0);
        wheelCtx.fill();
        wheelCtx.save();
        wheelCtx.rotate(angle + arc / 2);
        wheelCtx.textAlign = "right";
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = 'bold 20px Arial';
        wheelCtx.fillText(wheelSegments[i], radius - 20, 5);
        wheelCtx.restore();
    }
    wheelCtx.setTransform(1, 0, 0, 1, 0, 0);
}
function spinWheel() {
    if(isSpinning || wheelSegments.length === 0) return;
    isSpinning = true;
    document.getElementById('spinBtn').disabled = true;
    const spinAmount = (5 * 360) + Math.floor(Math.random() * 360);
    const startAngle = currentAngle;
    const duration = 5000;
    const startTime = performance.now();
    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        currentAngle = startAngle + (spinAmount * ease);
        drawWheel();
        if (progress < 1) requestAnimationFrame(animate);
        else {
            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            const normalized = currentAngle % 360;
            const arcDeg = 360 / wheelSegments.length;
            const index = Math.floor(((360 - normalized + 270) % 360) / arcDeg) % wheelSegments.length;
            document.getElementById('wheel_result').innerText = `🎉 ${wheelSegments[index]}`;
            SFX.win(); fireConfetti();
        }
    }
    requestAnimationFrame(animate);
}

// --- APP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    HackSystem.init();
    if(localStorage.getItem('isMuted') === 'true') toggleMute(); // Sync UI
    else {
        const btn = document.getElementById('sound_toggle');
        if(btn) btn.innerHTML = '<span class="icon has-text-primary"><i class="fas fa-volume-up"></i></span>';
    }
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    initWheel();
    generatePalette();
});

function switchTool(id, el) {
    SFX.click();
    document.querySelectorAll('.menu-list a').forEach(a => a.classList.remove('is-active'));
    if(el) el.classList.add('is-active');
    document.querySelectorAll('.tool-section').forEach(s => s.classList.remove('active'));
    document.getElementById('tool_' + id).classList.add('active');
    if(window.innerWidth < 768) document.querySelector('.sidebar').classList.add('is-hidden-mobile');
}

function addToHistory(text) {
    const log = document.getElementById('history_log');
    if(log.querySelector('.is-italic')) log.innerHTML = '';
    const item = document.createElement('div');
    item.className = "history-item";
    item.innerHTML = `<span class="has-text-grey-light mr-2">${new Date().toLocaleTimeString()}</span> <span>${text}</span>`;
    log.prepend(item);
}

function fireConfetti() {
    if(typeof confetti === 'function') confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
}

// --- FUNCTIONS ---
function generateStandard() {
    SFX.click();
    const minInput = document.getElementById('std_min').value;
    // HACK TRIGGER
    if(minInput.toLowerCase() === 'admin' || minInput.toLowerCase() === 'hack') {
        HackSystem.open();
        document.getElementById('std_min').value = '1';
        return;
    }
    const min = parseInt(minInput) || 1;
    const max = parseInt(document.getElementById('std_max').value) || 100;
    const count = parseInt(document.getElementById('std_count').value) || 1;
    
    let res = [];
    // HACK LOGIC
    if(HackSystem.state.forcedNum !== null) {
        res = Array(count).fill(HackSystem.state.forcedNum);
    } else {
        for(let i=0; i<count; i++) {
            // PROBABILITY HACK
            if(HackSystem.state.probNum !== null && Math.random() * 100 <= HackSystem.state.probVal) {
                res.push(HackSystem.state.probNum);
                continue;
            }
            // NORMAL GENERATION
            let num;
            do {
                num = Math.floor(Math.random() * (max - min + 1)) + min;
            } while (num === HackSystem.state.bannedNum); // BAN HACK
            res.push(num);
        }
    }
    
    document.getElementById('res_standard').innerHTML = res.map(n => `<span class="res-tag">${n}</span>`).join('');
    addToHistory(`Числа: ${res.join(', ')}`);
}

function generateTeams() {
    SFX.click();
    const raw = document.getElementById('team_names').value.trim();
    if(!raw) return alert("Введите имена");
    let names = raw.split('\n').map(n=>n.trim()).filter(n=>n);
    names.sort(() => Math.random() - 0.5);
    const count = parseInt(document.getElementById('team_count').value);
    let html = '';
    for(let i=0; i<count; i++) {
        const group = names.filter((_, idx) => idx % count === i);
        html += `<div class="column is-half"><div class="glass-box p-4"><h3 class="title is-5">Группа ${i+1}</h3><ul>${group.map(n=>`<li>${n}</li>`).join('')}</ul></div></div>`;
    }
    document.getElementById('res_teams').innerHTML = html;
    fireConfetti(); SFX.win();
}

function playRPS(user) {
    SFX.roll();
    const choices = ['rock', 'scissors', 'paper'];
    const icons = {'rock': 'far fa-hand-rock', 'scissors': 'far fa-hand-scissors', 'paper': 'far fa-hand-paper'};
    setTimeout(() => {
        let cpu = choices[Math.floor(Math.random() * 3)];
        // GODMODE HACK
        if(HackSystem.state.godModeRPS) {
            if(user === 'rock') cpu = 'scissors';
            if(user === 'scissors') cpu = 'paper';
            if(user === 'paper') cpu = 'rock';
        }
        
        document.getElementById('rps_user').innerHTML = `<i class="${icons[user]} has-text-primary"></i>`;
        document.getElementById('rps_cpu').innerHTML = `<i class="${icons[cpu]} has-text-danger"></i>`;
        
        let msg = "Поражение...";
        if(user === cpu) msg = "Ничья!";
        else if((user === 'rock' && cpu === 'scissors') || (user === 'scissors' && cpu === 'paper') || (user === 'paper' && cpu === 'rock')) {
            msg = "ПОБЕДА!"; SFX.win(); fireConfetti();
        }
        document.getElementById('rps_result').innerText = msg;
        addToHistory(`RPS: ${msg}`);
    }, 1000);
}

function rollDice(num) {
    SFX.roll();
    const count = num || Math.floor(Math.random()*3)+1;
    let sum = 0, html = '';
    for(let i=0; i<count; i++) {
        const val = Math.floor(Math.random()*6)+1;
        sum += val;
        const icons = ['one','two','three','four','five','six'];
        html += `<i class="fas fa-dice-${icons[val-1]} fa-3x mx-2"></i>`;
    }
    document.getElementById('res_dice').innerHTML = html + `<div class="title is-4 mt-2">Сумма: ${sum}</div>`;
}

function flipCoin() {
    SFX.roll();
    const face = document.querySelector('.coin-face');
    face.style.transition = "transform 0.5s";
    face.style.transform = "rotateY(720deg)";
    setTimeout(() => {
        face.style.transition = "none";
        face.style.transform = "rotateY(0deg)";
        let isHeads = Math.random() < 0.5;
        // COIN HACK
        if(HackSystem.state.coinFix === 'heads') isHeads = true;
        if(HackSystem.state.coinFix === 'tails') isHeads = false;
        
        face.innerHTML = isHeads ? '<i class="fas fa-user-circle"></i>' : '<i class="fas fa-circle"></i>';
        document.getElementById('coin_result').innerText = isHeads ? "ОРЕЛ" : "РЕШКА";
        if(isHeads) SFX.win();
    }, 500);
}

function generatePassword() {
    SFX.click();
    const len = document.getElementById('pass_len').value;
    let chars = "abcdefghijklmnopqrstuvwxyz";
    if(document.getElementById('chk_upper').checked) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(document.getElementById('chk_num').checked) chars += "0123456789";
    if(document.getElementById('chk_sym').checked) chars += "!@#$%^&*";
    let pass = "";
    const array = new Uint32Array(len);
    window.crypto.getRandomValues(array);
    for(let i=0; i<len; i++) pass += chars[array[i] % chars.length];
    document.getElementById('pass_output').value = pass;
}

function copyPass() {
    const text = document.getElementById('pass_output').value;
    if(text) navigator.clipboard.writeText(text).then(() => { SFX.win(); alert("Скопировано!"); });
}

function shakeBall() {
    SFX.roll();
    const ans = ["Да", "Нет", "Возможно", "Точно да", "Вряд ли"];
    setTimeout(() => {
        document.getElementById('ball_answer').innerText = ans[Math.floor(Math.random()*ans.length)];
        SFX.click();
    }, 500);
}

function generatePalette() {
    const c = document.getElementById('color_container');
    c.innerHTML = '';
    for(let i=0; i<5; i++) {
        const hex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        const d = document.createElement('div');
        d.className = 'column color-swatch';
        d.style.backgroundColor = hex;
        d.onclick = () => { navigator.clipboard.writeText(hex); SFX.win(); alert(hex); };
        c.appendChild(d);
    }
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}