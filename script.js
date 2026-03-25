/* --- GLOBAL UTILS --- */
const AudioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioContext();
let isMuted = localStorage.getItem('isMuted') === 'true';

// Темная тема по умолчанию
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateSoundIcon();
}

function updateSoundIcon() {
    const btn = document.getElementById('sound_toggle');
    if(btn) btn.innerHTML = isMuted ? '<span class="icon has-text-grey"><i class="fas fa-volume-mute"></i></span>' : '<span class="icon has-text-primary"><i class="fas fa-volume-up"></i></span>';
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const btn = document.getElementById('theme_toggle');
    if(btn) btn.innerHTML = next === 'dark' ? '<span class="icon"><i class="fas fa-sun"></i></span>' : '<span class="icon"><i class="fas fa-moon"></i></span>';
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
    tick: () => playTone(1000, 'square', 0.01, 0.02),
    win: () => { if(!isMuted) { playTone(523, 'triangle', 0.2); setTimeout(()=>playTone(659, 'triangle', 0.2), 150); setTimeout(()=>playTone(783, 'triangle', 0.3), 300); } },
    roll: () => { if(!isMuted) for(let i=0; i<6; i++) setTimeout(() => playTone(200+Math.random()*300, 'sawtooth', 0.05), i*60); },
    magic: () => { if(!isMuted) playTone(400, 'sine', 0.5); }
};

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
    if(log.querySelector('.is-italic')) log.innerHTML = "";
    const item = document.createElement('div');
    item.style.borderBottom = "1px solid rgba(128,128,128,0.2)";
    item.style.padding = "5px 0";
    item.innerHTML = `<span class="has-text-grey-light mr-2">${new Date().toLocaleTimeString()}</span> <b>${text}</b>`;
    log.prepend(item);
}

/* --- HACKER SYSTEM --- */
const HackSystem = {
    state: { forcedNum: null, bannedNums: [], probNum: null, probVal: 0, godModeRPS: false, coinFix: null },
    
    init: function() {
        const saved = localStorage.getItem('hack_data_v2');
        if(saved) try { this.state = JSON.parse(saved); } catch(e){}
        if(!Array.isArray(this.state.bannedNums)) this.state.bannedNums = [];
        this.renderConsole();
    },
    
    save: function() { localStorage.setItem('hack_data_v2', JSON.stringify(this.state)); },
    
    log: function(msg) {
        const d = document.createElement('div'); d.textContent = `> ${msg}`;
        const out = document.getElementById('hacker_output'); out.appendChild(d); out.scrollTop = out.scrollHeight;
    },
    
    renderConsole: function() {
        const input = document.getElementById('hacker_cmd');
        if(input) input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') { this.runCommand(input.value.trim()); input.value = ""; }
        });
    },
    
    open: function() {
        document.getElementById('hacker_terminal').style.display = 'flex';
        document.getElementById('hacker_cmd').focus();
        const out = document.getElementById('hacker_output');
        out.innerHTML = "";
        this.log("SYSTEM_OVERRIDE_INITIATED...");
        this.log("Checking active overrides...");
        let active = false;
        if(this.state.forcedNum !== null) { this.log(`[!] FORCE NUMBER: ACTIVE -> ${this.state.forcedNum}`); active = true; }
        if(this.state.bannedNums.length > 0) { this.log(`[!] BANNED LIST: ACTIVE -> [${this.state.bannedNums.join(', ')}]`); active = true; }
        if(this.state.probNum !== null) { this.log(`[!] PROBABILITY: ACTIVE -> ${this.state.probNum} (${this.state.probVal}%)`); active = true; }
        if(this.state.godModeRPS) { this.log(`[!] RPS GODMODE: ACTIVE`); active = true; }
        if(this.state.coinFix) { this.log(`[!] COIN FIX: ACTIVE -> ${this.state.coinFix.toUpperCase()}`); active = true; }
        if(!active) this.log("No overrides active.");
        this.log("Ready.");
    },
    
    close: function() { document.getElementById('hacker_terminal').style.display = 'none'; },
    
    runCommand: function(str) {
        this.log(str);
        const parts = str.split(' ');
        const cmd = parts[0].toLowerCase();
        if (cmd === 'help') { this.log("Commands: force [n], ban [n,n], prob [n] [%], godmode, coin [orel/reshka], reset"); } 
        else if (cmd === 'force') { this.state.forcedNum = parseInt(parts[1]); this.log(`Force: ${this.state.forcedNum}`); }
        else if (cmd === 'ban') {
            const raw = str.substring(4); const nums = raw.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
            this.state.bannedNums = [...this.state.bannedNums, ...nums]; this.log(`Added to ban: ${nums.join(', ')}`);
        }
        else if (cmd === 'prob') { this.state.probNum = parseInt(parts[1]); this.state.probVal = parseInt(parts[2]); this.log(`Prob: ${this.state.probNum} (${this.state.probVal}%)`); }
        else if (cmd === 'godmode') { this.state.godModeRPS = !this.state.godModeRPS; this.log(`GodMode: ${this.state.godModeRPS}`); }
        else if (cmd === 'coin') {
            if(parts[1] === 'orel') this.state.coinFix = 'heads'; else if(parts[1] === 'reshka') this.state.coinFix = 'tails'; else this.state.coinFix = null;
            this.log(`Coin: ${this.state.coinFix}`);
        }
        else if (cmd === 'reset') { this.state = { forcedNum: null, bannedNums: [], probNum: null, probVal: 0, godModeRPS: false, coinFix: null }; this.log("Reset done."); }
        else if (cmd === 'exit') { this.close(); }
        else { this.log("Error."); }
        this.save();
    }
};
function closeConsole() { HackSystem.open(); }

/* --- GAMES --- */
function generateStandard() {
    SFX.click();
    const minInput = document.getElementById('std_min').value;
    if(minInput.toLowerCase() === 'admin' || minInput.toLowerCase() === 'hack') { HackSystem.open(); return; }
    const min = parseInt(minInput)||1, max = parseInt(document.getElementById('std_max').value)||100, count = parseInt(document.getElementById('std_count').value)||1;
    let res = [];
    if(HackSystem.state.forcedNum !== null) { res = Array(count).fill(HackSystem.state.forcedNum); } else {
        for(let i=0; i<count; i++) {
            if (HackSystem.state.probNum !== null && Math.random() * 100 < HackSystem.state.probVal) { res.push(HackSystem.state.probNum); continue; }
            let num, safe=0;
            do { num = Math.floor(Math.random() * (max - min + 1)) + min; safe++; } while (HackSystem.state.bannedNums.includes(num) && safe < 100);
            res.push(num);
        }
    }
    document.getElementById('res_standard').innerHTML = res.map(n => `<span class="res-tag">${n}</span>`).join('');
    addToHistory(`Числа: ${res.join(', ')}`);
}

function playRPS(user) {
    SFX.click();
    const userIcon = document.getElementById('rps_user'); const cpuIcon = document.getElementById('rps_cpu'); const resTitle = document.getElementById('rps_result');
    userIcon.innerHTML = '<i class="far fa-hand-rock"></i>'; cpuIcon.innerHTML = '<i class="far fa-hand-rock"></i>';
    resTitle.innerText = "Камень... Ножницы... Бумага...";
    userIcon.classList.add('hand-shake'); cpuIcon.classList.add('hand-shake');
    setTimeout(() => {
        userIcon.classList.remove('hand-shake'); cpuIcon.classList.remove('hand-shake');
        const choices = ['rock', 'scissors', 'paper'];
        const icons = {'rock':'far fa-hand-rock','scissors':'far fa-hand-scissors','paper':'far fa-hand-paper'};
        let cpu = choices[Math.floor(Math.random() * 3)];
        if(HackSystem.state.godModeRPS) { if(user === 'rock') cpu = 'scissors'; if(user === 'scissors') cpu = 'paper'; if(user === 'paper') cpu = 'rock'; }
        userIcon.innerHTML = `<i class="${icons[user]} has-text-primary"></i>`; cpuIcon.innerHTML = `<i class="${icons[cpu]} has-text-danger"></i>`;
        let msg = "";
        if(user === cpu) msg = "Ничья!"; else if((user==='rock'&&cpu==='scissors')||(user==='scissors'&&cpu==='paper')||(user==='paper'&&cpu==='rock')) { msg = "ПОБЕДА!"; SFX.win(); if(typeof confetti==='function') confetti(); } else { msg = "Поражение..."; }
        resTitle.innerText = msg; addToHistory(`КНБ: ${msg}`);
    }, 1500);
}

function flipCoin() {
    SFX.roll();
    const face = document.querySelector('.coin-face');
    face.style.transition = "transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)"; face.style.transform = "rotateY(1080deg)";
    setTimeout(() => {
        face.style.transition = "none"; face.style.transform = "rotateY(0deg)";
        let isHeads = Math.random() < 0.5;
        if(HackSystem.state.coinFix === 'heads') isHeads = true; if(HackSystem.state.coinFix === 'tails') isHeads = false;
        face.innerHTML = isHeads ? '<i class="fas fa-user-circle"></i>' : '<i class="fas fa-circle"></i>';
        const res = isHeads ? "ОРЕЛ" : "РЕШКА"; document.getElementById('coin_result').innerText = res; if(isHeads) SFX.win(); addToHistory(`Монетка: ${res}`);
    }, 600);
}

function shakeBall() {
    const ball = document.getElementById('magicBall');
    if(ball.classList.contains('shaking')) return;
    SFX.roll(); ball.classList.add('shaking'); document.getElementById('ball_answer').innerText = ""; 
    setTimeout(() => {
        ball.classList.remove('shaking');
        const ans = ["ДА", "НЕТ", "ВОЗМОЖНО", "ТОЧНО ДА", "ВРЯД ЛИ", "СПРОСИ ПОЗЖЕ", "НИКОГДА"];
        const res = ans[Math.floor(Math.random()*ans.length)];
        const el = document.getElementById('ball_answer'); el.innerText = res; SFX.magic();
    }, 500);
}

let wheelCtx, wheelCanvas, wheelSegments = [], currentAngle = 0, isSpinning = false;
function initWheel() {
    wheelCanvas = document.getElementById('wheelCanvas'); if(!wheelCanvas) return;
    wheelCtx = wheelCanvas.getContext('2d');
    wheelSegments = document.getElementById('wheel_input').value.split('\n').filter(x=>x.trim());
    drawWheel();
}
function drawWheel() {
    if (wheelSegments.length === 0) return;
    const num = wheelSegments.length; const arc = 2 * Math.PI / num;
    const colors = ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'];
    wheelCtx.clearRect(0,0,500,500); wheelCtx.translate(250, 250); wheelCtx.rotate(currentAngle * Math.PI / 180);
    for(let i=0; i<num; i++) {
        const angle = i * arc; wheelCtx.beginPath(); wheelCtx.fillStyle = colors[i % colors.length];
        wheelCtx.moveTo(0, 0); wheelCtx.arc(0, 0, 250, angle, angle + arc); wheelCtx.fill();
        wheelCtx.save(); wheelCtx.rotate(angle + arc / 2); wheelCtx.textAlign = "right";
        wheelCtx.fillStyle = '#fff'; wheelCtx.font = 'bold 20px Arial'; wheelCtx.fillText(wheelSegments[i], 230, 5); wheelCtx.restore();
    }
    wheelCtx.setTransform(1, 0, 0, 1, 0, 0);
}
function spinWheel() {
    if(isSpinning || wheelSegments.length === 0) return;
    isSpinning = true; document.getElementById('spinBtn').disabled = true;
    const spinAmount = (5 * 360) + Math.floor(Math.random() * 360); 
    const startAngle = currentAngle; const duration = 4000; const startTime = performance.now();
    let lastTick = 0;
    function animate(time) {
        const progress = Math.min((time - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        currentAngle = startAngle + (spinAmount * ease);
        drawWheel();
        if(Math.floor(currentAngle / 45) > lastTick) { SFX.tick(); lastTick = Math.floor(currentAngle / 45); }
        if (progress < 1) requestAnimationFrame(animate);
        else {
            isSpinning = false; document.getElementById('spinBtn').disabled = false;
            const index = Math.floor(((360 - (currentAngle % 360) + 270) % 360) / (360 / wheelSegments.length)) % wheelSegments.length;
            document.getElementById('wheel_result').innerText = ` ${wheelSegments[index]} `;
            SFX.win(); if(typeof confetti === 'function') confetti();
        }
    }
    requestAnimationFrame(animate);
}

function rollDice(num) {
    SFX.roll(); const count = num || Math.floor(Math.random()*3)+1;
    let html = "", sum = 0;
    for(let i=0; i<count; i++) {
        const val = Math.floor(Math.random()*6)+1; sum += val;
        html += `<i class="fas fa-dice-${['one','two','three','four','five','six'][val-1]} fa-4x mx-3"></i>`;
    }
    document.getElementById('res_dice').innerHTML = html + `<div class="title is-4 mt-3">Сумма: ${sum}</div>`;
}
function generateTeams() {
    SFX.click();
    const names = document.getElementById('team_names').value.split('\n').filter(n=>n.trim()).sort(()=>Math.random()-0.5);
    const count = parseInt(document.getElementById('team_count').value);
    let html = "";
    for(let i=0; i<count; i++) html += `<div class="column is-half"><div class="glass-box p-4"><b>Группа ${i+1}</b><ul>${names.filter((_,x)=>x%count===i).map(n=>`<li>${n}</li>`).join('')}</ul></div></div>`;
    document.getElementById('res_teams').innerHTML = html;
}
function generatePalette() {
    const c = document.getElementById('color_container'); c.innerHTML = "";
    for(let i=0; i<5; i++) {
        const hex = '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
        const d = document.createElement('div'); d.className = 'column color-swatch'; d.style.backgroundColor = hex;
        d.onclick = () => { navigator.clipboard.writeText(hex); SFX.win(); alert(hex); };
        c.appendChild(d);
    }
}
function generatePassword() {
    SFX.click();
    const len = document.getElementById('pass_len').value;
    let chars = "abcdefghijklmnopqrstuvwxyz";
    if(document.getElementById('chk_upper').checked) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(document.getElementById('chk_num').checked) chars += "0123456789";
    if(document.getElementById('chk_sym').checked) chars += "!@#$%^&*";
    let pass = "";
    for(let i=0; i<len; i++) pass += chars[Math.floor(Math.random()*chars.length)];
    document.getElementById('pass_output').value = pass;
}
function copyPass() { const t = document.getElementById('pass_output').value; if(t) navigator.clipboard.writeText(t).then(()=>alert("Скопировано!")); }

document.addEventListener('DOMContentLoaded', () => {
    HackSystem.init(); updateSoundIcon(); initWheel();
});