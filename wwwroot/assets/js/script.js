// 1. GLOBAL STATE & SELECTORS
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin");
const soundBtn = document.getElementById("soundBtn");
const modifyBtn = document.getElementById("modifyBtn");
const resultsBtn = document.getElementById("resultsBtn");
const shareBtn = document.getElementById("shareBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const langToggle = document.getElementById("langToggle");
const langMenu = document.getElementById("langMenu");
const modal = document.getElementById("customModal");
const modalBody = document.querySelector(".modal-body");
const modalTitle = document.getElementById("modalTitle");
const confirmBtn = document.getElementById("modalConfirm");
const cancelBtn = document.getElementById("modalCancel");

let items = JSON.parse(localStorage.getItem("lunchPickerItems")) || [
    { name: "Pizza" },
    { name: "Burger" },
    { name: "Sushi" },
    { name: "Chicken" },
    { name: "Salad" },
    { name: "Pasta" },
    { name: "Oliver Salad" },
];

let results = JSON.parse(localStorage.getItem("lunchPickerHistory")) || [];
let currentLang = localStorage.getItem("lang") || "az";
let soundEnabled = JSON.parse(localStorage.getItem("soundEnabled")) ?? true;
let darkMode = JSON.parse(localStorage.getItem("darkMode")) ?? false;
let angle = 0;
let spinning = false;

// 2. DICTIONARY
const translations = {
    az: {
        title: "Lunch Wheel",
        spin: "Fırlat",
        modify: "Dəyiş",
        results: "Nəticələr",
        winTitle: "Təbriklər! 🎉",
        winMsg: "Bugünkü seçiminiz:",
        placeholder: "Yemək adı...",
        delete: "Siyahıdan sil",
        ok: "Bağla",
        copyMsg: "Link kopyalandı",
        historyTitle: "Son Nəticələr",
    },
    ru: {
        title: "Обеденное Колесо",
        spin: "Крутить",
        modify: "Изменить",
        results: "История",
        winTitle: "Поздравляем! 🎉",
        winMsg: "Ваш выбор:",
        placeholder: "Название...",
        delete: "Удалить",
        ok: "Закрыть",
        copyMsg: "Ссылка скопирована",
        historyTitle: "История",
    },
    en: {
        title: "Lunch Wheel",
        spin: "Spin",
        modify: "Modify",
        results: "History",
        winTitle: "Congrats! 🎉",
        winMsg: "Today's selection:",
        placeholder: "New item...",
        delete: "Remove",
        ok: "Close",
        copyMsg: "Link copied",
        historyTitle: "Results",
    },
};

// 3. AUDIO ENGINE
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration, vol = 0.05) {
    if (!soundEnabled) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    o.start();
    o.stop(audioCtx.currentTime + duration);
}
const triggerTickSound = () => playTone(280, 0.05, 0.02);
const triggerClickSound = () => playTone(450, 0.08, 0.03);
const triggerWinSound = () => {
    playTone(523, 0.4, 0.08);
    setTimeout(() => playTone(659, 0.4, 0.08), 150);
};
function drawWheel() {
    if (!canvas) return;
    const totalWeight = items.reduce((sum, i) => sum + (i.weight || 1), 0);
    let startAngle = angle - Math.PI / 2;

    ctx.clearRect(0, 0, 500, 500);
    items.forEach((item, i) => {
        const arc = ((item.weight || 1) / totalWeight) * (2 * Math.PI);
        ctx.beginPath();
        ctx.fillStyle = `hsl(${(i * 360) / items.length}, 65%, 60%)`;
        ctx.moveTo(250, 250);
        ctx.arc(250, 250, 240, startAngle, startAngle + arc);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.stroke();

        ctx.save();
        ctx.translate(250, 250);
        ctx.rotate(startAngle + arc / 2);
        ctx.fillStyle = "white";
        ctx.textAlign = "right";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(item.name, 210, 5);
        ctx.restore();
        startAngle += arc;
    });
}

// 5. SPIN LOGIC
function spinWheel() {
    if (spinning || items.length < 2) return;
    spinning = true;
    spinBtn.disabled = true;
    triggerClickSound();

    const spinDuration = 5000 + Math.random() * 2000;
    const startTime = Date.now();
    const velocity = 0.7 + Math.random() * 0.5;
    let lastTickSegment = -1;

    function animate() {
        let elapsed = Date.now() - startTime;
        let progress = elapsed / spinDuration;
        if (progress < 1) {
            let ease = 1 - Math.pow(1 - progress, 4);
            angle += velocity * (1 - ease);
            let currentSegment = Math.floor(
                ((2 * Math.PI - (angle % (2 * Math.PI))) / (2 * Math.PI)) *
                items.length,
            );
            if (currentSegment !== lastTickSegment) {
                triggerTickSound();
                lastTickSegment = currentSegment;
            }
            drawWheel();
            requestAnimationFrame(animate);
        } else {
            finalizeSpin();
        }
    }
    animate();
}
function finalizeSpin() {
    spinning = false;
    spinBtn.disabled = false;

    // DÜZƏLİŞ: weight yoxdursa 1 say
    const totalWeight = items.reduce((sum, i) => sum + (i.weight || 1), 0);

    const normalizedAngle =
        (2 * Math.PI - (angle % (2 * Math.PI))) % (2 * Math.PI);

    let cumulative = 0,
        winnerIndex = 0;

    for (let i = 0; i < items.length; i++) {
        // DÜZƏLİŞ: weight yoxdursa 1 say
        cumulative += ((items[i].weight || 1) / totalWeight) * (2 * Math.PI);
        if (normalizedAngle <= cumulative) {
            winnerIndex = i;
            break;
        }
    }

    const winner = items[winnerIndex];
    results.unshift({
        name: winner.name,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        }),
        id: Date.now(),
    });
    saveData();
    showWinnerModal(winner, winnerIndex);
}
// 6. MODALS & API
async function showWinnerModal(winner, index) {
    const t = translations[currentLang];
    modalTitle.textContent = t.winTitle;
    let mealImg = "";
    try {
        const res = await fetch(
            `https://www.themealdb.com/api/json/v1/1/search.php?s=${winner.name}`,
        );
        const data = await res.json();
        if (data.meals && data.meals[0]) mealImg = data.meals[0].strMealThumb;
    } catch (e) {
        console.error("API Error");
    }

    modalBody.innerHTML = `<div style="text-align:center;padding:20px 0;">
      ${mealImg ? `<img src="${mealImg}" style="width:160px;height:160px;border-radius:20px;object-fit:cover;margin-bottom:15px;box-shadow:0 8px 20px rgba(0,0,0,0.2);">` : `<div style="font-size:50px;margin-bottom:15px;">🎉</div>`}
      <div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">${t.winMsg}</div>
      <div style="font-size:28px;font-weight:800;color:${darkMode ? "#818cf8" : "#1f2937"};margin-top:5px;">${winner.name}</div>
    </div>`;

    confirmBtn.textContent = t.delete;
    confirmBtn.onclick = () => {
        items.splice(index, 1);
        saveData();
        drawWheel();
        modal.classList.remove("active");
    };
    cancelBtn.style.display = "block";
    cancelBtn.textContent = t.ok;
    cancelBtn.onclick = () => modal.classList.remove("active");
    modal.classList.add("active");
    triggerWinSound();
    if (window.confetti)
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
}

function showManageMenu() {
    const t = translations[currentLang];
    modalTitle.textContent = t.modify;
    let html = `<div style="display:flex;flex-direction:column;gap:8px;width:100%;">`;
    items.forEach((item, i) => {
        html += `<div style="display:flex;align-items:center;padding:10px;border:1px solid ${darkMode ? "#374151" : "#e5e7eb"};border-radius:10px;background:${darkMode ? "#111827" : "#fff"};">
      <input type="text" value="${item.name}" onchange="updateItemName(${i}, this.value)" style="flex:1;border:none;outline:none;background:transparent;color:${darkMode ? "#fff" : "#000"};">
      <button onclick="removeItem(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
    </div>`;
    });
    html += `<div style="border:1.5px dashed #5b5df0;padding:10px;border-radius:10px;display:flex;align-items:center;">
    <input type="text" id="addInp" placeholder="${t.placeholder}" style="flex:1;border:none;outline:none;background:transparent;color:${darkMode ? "#fff" : "#000"};">
    <i class="fas fa-plus" onclick="addNewItem()" style="color:#5b5df0;cursor:pointer;"></i>
  </div></div>`;
    modalBody.innerHTML = html;
    confirmBtn.textContent = t.ok;
    confirmBtn.onclick = () => modal.classList.remove("active");
    cancelBtn.style.display = "none";
    modal.classList.add("active");
}

// DÜZƏLİŞ: Scroll üçün xüsusi class və limit
function showHistory() {
    const t = translations[currentLang];
    modalTitle.textContent = t.historyTitle;
    // 'modal-scroll-content' class-ı əlavə edildi
    let html = `<div class="modal-scroll-content" style="display:flex;flex-direction:column;gap:8px;">`;
    results.forEach((r, i) => {
        html += `<div style="display:flex;justify-content:space-between;padding:12px;background:${darkMode ? "#111827" : "#f9fafb"};border-radius:10px;border:1px solid ${darkMode ? "#374151" : "#e5e7eb"};">
      <span style="font-weight:600;">#${results.length - i} ${r.name}</span><span style="font-size:11px;color:#9ca3af;">${r.time}</span>
    </div>`;
    });
    html += `</div>`;
    modalBody.innerHTML = html;
    confirmBtn.textContent = t.ok;
    confirmBtn.onclick = () => modal.classList.remove("active");
    cancelBtn.style.display = "none";
    modal.classList.add("active");
}

// DÜZƏLİŞ: X düyməsi üçün funksiya
function closeCustomModal() {
    modal.classList.remove("active");
}

// 7. UTILS & DARK MODE
function updateItemName(idx, val) {
    if (val.trim()) {
        items[idx].name = val.trim();
        saveData();
        drawWheel();
    }
}
function removeItem(idx) {
    items.splice(idx, 1);
    saveData();
    drawWheel();
    showManageMenu();
}
function addNewItem() {
    const inp = document.getElementById("addInp");
    if (inp && inp.value.trim()) {
        items.push({ name: inp.value.trim(), weight: 1 });
        saveData();
        drawWheel();
        showManageMenu();
    }
}
function saveData() {
    localStorage.setItem("lunchPickerItems", JSON.stringify(items));
    localStorage.setItem("lunchPickerHistory", JSON.stringify(results));
}

function applyDarkMode() {
    document.body.classList.toggle("dark", darkMode);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = darkMode ? sunIcon : moonIcon;
    localStorage.setItem("darkMode", darkMode);
}

const moonIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const sunIcon = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

// 8. EVENT LISTENERS
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.classList.remove("active");
    if (e.key === "Enter" && modal.classList.contains("active"))
        confirmBtn.click();
    if (e.code === "Space" && !spinning && !modal.classList.contains("active")) {
        e.preventDefault();
        spinWheel();
    }
});

spinBtn.onclick = spinWheel;
modifyBtn.onclick = showManageMenu;
resultsBtn.onclick = showHistory;
soundBtn.onclick = () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("soundEnabled", soundEnabled);
    soundBtn.innerHTML = soundEnabled
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>';
};

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

shareBtn.onclick = () => {
    navigator.clipboard
        .writeText(window.location.href)
        .then(() => showToast(translations[currentLang].copyMsg));
};
fullscreenBtn.onclick = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        showToast(
            currentLang === "az"
                ? "Tam ekran aktivləşdi"
                : currentLang === "ru"
                    ? "Полноэкранный режим"
                    : "Fullscreen activated",
        );
    } else {
        document.exitFullscreen();
        showToast(
            currentLang === "az"
                ? "Tam ekrandan çıxıldı"
                : currentLang === "ru"
                    ? "Выход из полноэкранного режима"
                    : "Exited fullscreen",
        );
    }
};
langToggle.onclick = (e) => {
    e.stopPropagation();
    langMenu.style.display = langMenu.style.display === "flex" ? "none" : "flex";
};
document.querySelectorAll(".lang-menu div").forEach((el) => {
    el.onclick = () => {
        currentLang = el.getAttribute("data-lang");
        localStorage.setItem("lang", currentLang);
        location.reload();
    };
});
document.addEventListener("click", () => (langMenu.style.display = "none"));

function initDarkMode() {
    const navRight = document.querySelector(".nav-right");
    const btn = document.createElement("button");
    btn.id = "themeToggleBtn";
    btn.className = "theme-toggle-btn";
    btn.onclick = () => {
        darkMode = !darkMode;
        applyDarkMode();
    };
    navRight.insertBefore(btn, navRight.querySelector(".language"));
    applyDarkMode();
}

// 9. START
initDarkMode();
drawWheel();
document.querySelector(".title").textContent = translations[currentLang].title;
spinBtn.textContent = translations[currentLang].spin;
modifyBtn.textContent = translations[currentLang].modify;
resultsBtn.textContent = translations[currentLang].results;
