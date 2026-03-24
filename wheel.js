let wheelCtx, wheelCanvas;
let wheelSegments = [];
let currentAngle = 0; // Текущий угол поворота колеса
let isSpinning = false;

function initWheel() {
    wheelCanvas = document.getElementById('wheelCanvas');
    if(!wheelCanvas) return;
    wheelCtx = wheelCanvas.getContext('2d');
    
    const raw = document.getElementById('wheel_input').value;
    wheelSegments = raw.split('\n').filter(x => x.trim() !== '');
    
    // Перерисовка
    drawWheel();
}

function drawWheel() {
    if (wheelSegments.length === 0) return;
    
    const num = wheelSegments.length;
    const arc = 2 * Math.PI / num;
    const colors = ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0', '#f72585', '#4895ef'];
    const radius = 250;
    
    wheelCtx.clearRect(0,0,500,500);
    wheelCtx.translate(250, 250);
    
    // Вращаем канвас на текущий угол, чтобы сохранить позицию
    // Переводим градусы в радианы для отрисовки
    wheelCtx.rotate(currentAngle * Math.PI / 180);
    
    for(let i=0; i<num; i++) {
        const angle = i * arc;
        wheelCtx.beginPath();
        wheelCtx.fillStyle = colors[i % colors.length];
        wheelCtx.moveTo(0, 0);
        wheelCtx.arc(0, 0, radius, angle, angle + arc);
        wheelCtx.lineTo(0, 0);
        wheelCtx.fill();
        
        // Текст
        wheelCtx.save();
        wheelCtx.rotate(angle + arc / 2);
        wheelCtx.textAlign = "right";
        wheelCtx.fillStyle = '#fff';
        wheelCtx.font = 'bold 20px Arial';
        wheelCtx.shadowColor = "rgba(0,0,0,0.5)";
        wheelCtx.shadowBlur = 5;
        wheelCtx.fillText(wheelSegments[i], radius - 20, 5);
        wheelCtx.restore();
    }
    
    // Сброс трансформации
    wheelCtx.setTransform(1, 0, 0, 1, 0, 0);
}

function spinWheel() {
    if(isSpinning || wheelSegments.length === 0) return;
    isSpinning = true;
    
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;
    document.getElementById('wheel_result').innerText = "";
    
    // Логика вращения
    // Добавляем к текущему углу много оборотов (минимум 5) + случайный сектор
    const minSpins = 5; 
    const randomDegree = Math.floor(Math.random() * 360);
    const spinAmount = (minSpins * 360) + randomDegree;
    
    const startAngle = currentAngle;
    const targetAngle = startAngle + spinAmount;
    
    const duration = 5000; // ms
    const startTime = performance.now();
    
    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutQuart) для плавного замедления
        const ease = 1 - Math.pow(1 - progress, 4);
        
        currentAngle = startAngle + (spinAmount * ease);
        drawWheel(); // Рисуем кадр
        
        // Звук тиканья (симуляция)
        if(progress < 1 && Math.floor(currentAngle / 45) !== Math.floor((currentAngle - 10)/45)) {
             if(Math.random() > 0.7) SFX.tick();
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            finishSpin();
        }
    }
    
    requestAnimationFrame(animate);
}

function finishSpin() {
    isSpinning = false;
    document.getElementById('spinBtn').disabled = false;
    
    // Вычисляем победителя
    // Стрелка сверху (270 градусов или -90 в Canvas).
    // Мы вращаем колесо по часовой стрелке (увеличиваем угол).
    // Сектор, который окажется под стрелкой - это:
    // (360 - (текущий_угол % 360) + смещение_стрелки) % 360
    
    // Упрощенно: Нормализуем угол
    const normalizedAngle = currentAngle % 360;
    // Определяем угол сектора
    const arcDeg = 360 / wheelSegments.length;
    // Индекс победителя. Стрелка справа (0 град), колесо повернуто.
    // Т.к. мы рисуем текст справа, индекс 0 - это 0-arcDeg.
    // Стрелка сверху (270 град).
    // Формула для Canvas (0 справа, clockwise):
    // Index = floor( (360 - currentAngle + 270) % 360 / arcDeg )
    // Но так как у нас текст выровнен к краю, используем простую логику "что визуально совпало"
    
    // Для надежности просто берем мат. расчет:
    const index = Math.floor(((360 - normalizedAngle + 270) % 360) / arcDeg) % wheelSegments.length;
    
    const winner = wheelSegments[index];
    
    const resEl = document.getElementById('wheel_result');
    resEl.innerText = `🏆 ${winner}`;
    
    SFX.win();
    fireConfetti();
    addToHistory(`Колесо: ${winner}`);
}