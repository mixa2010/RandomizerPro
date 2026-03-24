// --- Core System ---
document.addEventListener('DOMContentLoaded', () => {
    // Theme Init
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Tools Init
    initWheel();
    generatePalette();
    
    // Sidebar Mobile Logic
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const burger = document.querySelector('.navbar-burger');
        if (!sidebar.contains(e.target) && !burger.contains(e.target) && !sidebar.classList.contains('is-hidden-mobile')) {
            sidebar.classList.add('is-hidden-mobile');
        }
    });
});

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    initWheel(); // Redraw wheel colors
}

function switchTool(id, el) {
    SFX.click();
    
    // Active menu state
    document.querySelectorAll('.menu-list a').forEach(a => a.classList.remove('is-active'));
    if(el) el.classList.add('is-active');
    
    // Active section state
    document.querySelectorAll('.tool-section').forEach(s => s.classList.remove('active'));
    document.getElementById('tool_' + id).classList.add('active');
    
    // Close sidebar on mobile after selection
    if(window.innerWidth < 768) {
        document.querySelector('.sidebar').classList.add('is-hidden-mobile');
    }
}

function addToHistory(text) {
    const log = document.getElementById('history_log');
    
    // Удаляем "Пусто"
    if (log.querySelector('.is-italic')) log.innerHTML = '';
    
    // BUG FIX: Limit history size to 15
    while (log.children.length >= 15) {
        log.removeChild(log.lastChild);
    }
    
    const item = document.createElement('div');
    item.className = "history-item";
    item.innerHTML = `
        <span class="has-text-grey-light mr-2">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
        <span class="has-text-weight-medium">${text}</span>
    `;
    
    log.prepend(item);
}

function fireConfetti() {
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#4361ee', '#f72585', '#4cc9f0', '#f8961e']
    });
}

// --- TOOLS LOGIC ---

// 1. Numbers
function generateStandard() {
    SFX.click();
    const min = parseInt(document.getElementById('std_min').value) || 1;
    const max = parseInt(document.getElementById('std_max').value) || 100;
    const count = parseInt(document.getElementById('std_count').value) || 1;
    const unique = document.getElementById('std_unique').checked;
    
    if (min > max) return alert("Ошибка: Мин > Макс");
    if (unique && count > (max - min + 1)) return alert("Диапазон слишком мал для уникальных чисел");
    
    let res = [];
    if(unique) {
        let pool = new Set();
        while(pool.size < count) {
            pool.add(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        res = Array.from(pool);
    } else {
        for(let i=0; i<count; i++) res.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    
    const box = document.getElementById('res_standard');
    box.innerHTML = res.map(n => `<span class="res-tag">${n}</span>`).join('');
    addToHistory(`Числа [${min}-${max}]: ${res.join(', ')}`);
}

// 2. Teams
function generateTeams() {
    SFX.click();
    const raw = document.getElementById('team_names').value.trim();
    if(!raw) return alert("Введите имена участников");
    
    let names = raw.split('\n').map(n=>n.trim()).filter(n=>n);
    const count = parseInt(document.getElementById('team_count').value);
    
    // Fisher-Yates Shuffle
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }
    
    let html = '';
    for(let i=0; i<count; i++) {
        const group = names.filter((_, idx) => idx % count === i);
        html += `
        <div class="column is-half">
            <div class="glass-box p-4 h-100">
                <h3 class="title is-5 has-text-primary">Группа ${i+1}</h3>
                <ul>${group.map(n=>`<li><i class="fas fa-check is-size-7 mr-2 has-text-grey-light"></i>${n}</li>`).join('')}</ul>
            </div>
        </div>`;
    }
    document.getElementById('res_teams').innerHTML = html;
    fireConfetti();
    SFX.win();
    addToHistory(`Создано ${count} команд`);
}

// 3. RPS Game
function playRPS(user) {
    SFX.roll();
    const choices = ['rock', 'scissors', 'paper'];
    const icons = {'rock': 'far fa-hand-rock', 'scissors': 'far fa-hand-scissors', 'paper': 'far fa-hand-paper'};
    
    const uiUser = document.getElementById('rps_user');
    const uiCpu = document.getElementById('rps_cpu');
    const uiRes = document.getElementById('rps_result');
    
    uiUser.innerHTML = '<i class="far fa-hand-rock"></i>';
    uiCpu.innerHTML = '<i class="far fa-hand-rock"></i>';
    uiUser.className = "rps-icon rps-shake";
    uiCpu.className = "rps-icon rps-shake";
    uiRes.innerText = "";
    
    setTimeout(() => {
        const cpu = choices[Math.floor(Math.random() * 3)];
        uiUser.className = "rps-icon";
        uiCpu.className = "rps-icon";
        
        uiUser.innerHTML = `<i class="${icons[user]} has-text-primary"></i>`;
        uiCpu.innerHTML = `<i class="${icons[cpu]} has-text-danger"></i>`;
        
        let msg = "";
        if(user === cpu) {
            msg = "Ничья!";
            SFX.tick();
        } else if ((user === 'rock' && cpu === 'scissors') || 
                   (user === 'scissors' && cpu === 'paper') || 
                   (user === 'paper' && cpu === 'rock')) {
            msg = "ПОБЕДА!";
            SFX.win();
            fireConfetti();
        } else {
            msg = "Поражение...";
            SFX.error();
        }
        uiRes.innerText = msg;
        addToHistory(`RPS: ${msg} (${user} vs ${cpu})`);
    }, 1200);
}

// 4. Magic 8 Ball
function shakeBall() {
    const answers = ["Бесспорно", "Предрешено", "Никаких сомнений", "Определенно да", "Мне кажется - да", "Вероятнее всего", "Знаки говорят - да", "Да", "Пока не ясно", "Спроси позже", "Лучше не рассказывать", "Сконцентрируйся", "Даже не думай", "Мой ответ - нет", "По моим данным - нет", "Весьма сомнительно"];
    
    const ball = document.querySelector('.magic-8-ball');
    const text = document.getElementById('ball_answer');
    
    SFX.roll();
    ball.classList.add('shaking');
    text.style.opacity = 0;
    
    setTimeout(() => {
        ball.classList.remove('shaking');
        const ans = answers[Math.floor(Math.random() * answers.length)];
        text.innerText = ans;
        text.style.opacity = 1;
        SFX.click();
        addToHistory(`Шар: ${ans}`);
        
        if(["Да", "Бесспорно", "Определенно да"].includes(ans)) fireConfetti();
    }, 500);
}

// 5. Colors
function generatePalette() {
    SFX.click();
    const container = document.getElementById('color_container');
    container.innerHTML = '';
    
    for(let i=0; i<5; i++) {
        const hex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        const div = document.createElement('div');
        div.className = "column color-swatch";
        div.style.backgroundColor = hex;
        div.innerHTML = `<span style="background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px;">${hex}</span>`;
        div.onclick = () => {
            navigator.clipboard.writeText(hex);
            SFX.win();
            alert("Скопировано: " + hex);
        };
        container.appendChild(div);
    }
    addToHistory('Палитра обновлена');
}

// 6. Dice
function rollDice(num = null) {
    // Если вызов без аргумента (кнопка БРОСИТЬ), берем случайное 1-3 или последнее
    const count = num || Math.floor(Math.random() * 3) + 1;
    SFX.roll();
    
    const box = document.getElementById('res_dice');
    const icons = ['one','two','three','four','five','six'];
    let html = '';
    let sum = 0;
    
    for(let i=0; i<count; i++) {
        const val = Math.floor(Math.random() * 6) + 1;
        sum += val;
        html += `<i class="fas fa-dice-${icons[val-1]} has-text-danger mx-3" style="font-size: 5rem; text-shadow: 0 4px 10px rgba(0,0,0,0.2);"></i>`;
    }
    
    box.innerHTML = html + `<div class="title is-4 mt-4 has-text-grey">Сумма: ${sum}</div>`;
    addToHistory(`Кубики: ${sum}`);
}

// 7. Coin
function flipCoin() {
    SFX.roll();
    const isHeads = Math.random() < 0.5;
    const face = document.querySelector('.coin-face');
    const resEl = document.getElementById('coin_result');
    
    resEl.innerText = "";
    face.style.transition = "transform 0.5s ease-in-out";
    face.style.transform = "rotateY(1080deg)";
    
    setTimeout(() => {
        face.style.transition = "none";
        face.style.transform = "rotateY(0deg)";
        face.innerHTML = isHeads ? '<i class="fas fa-user-astronaut"></i>' : '<i class="fas fa-1"></i>';
        const txt = isHeads ? "ОРЕЛ" : "РЕШКА";
        resEl.innerText = txt;
        addToHistory(`Монетка: ${txt}`);
        if(isHeads) SFX.win();
    }, 500);
}

// 8. Password
function generatePassword() {
    SFX.click();
    const len = document.getElementById('pass_len').value;
    const useUp = document.getElementById('chk_upper').checked;
    const useLow = document.getElementById('chk_lower').checked;
    const useNum = document.getElementById('chk_num').checked;
    const useSym = document.getElementById('chk_sym').checked;
    
    let chars = "";
    if(useUp) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(useLow) chars += "abcdefghijklmnopqrstuvwxyz";
    if(useNum) chars += "0123456789";
    if(useSym) chars += "!@#$%^&*()_+";
    
    if(!chars) return alert("Выберите хотя бы один тип символов");
    
    let pass = "";
    const array = new Uint32Array(len);
    window.crypto.getRandomValues(array);
    
    for(let i=0; i<len; i++) {
        pass += chars[array[i] % chars.length];
    }
    
    document.getElementById('pass_output').value = pass;
    addToHistory('Пароль создан');
}

function copyPass() {
    const el = document.getElementById('pass_output');
    el.select();
    document.execCommand('copy');
    SFX.win();
    alert("Пароль скопирован!");
}

document.getElementById('pass_len').oninput = function() {
    document.getElementById('pass_len_val').innerText = this.value;
}