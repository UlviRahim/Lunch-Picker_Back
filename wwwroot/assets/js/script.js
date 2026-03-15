document.addEventListener("DOMContentLoaded", function () {

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

    // Default elements (leave empty when database has data)
    const defaultItems = [];

    // Wheel items
    let items = defaultItems.slice();

    // Username and deleted defaults
    let currentUserName = "guest";
    let deletedDefaults = [];

    let results = [];
    let currentLang = localStorage.getItem("lang") || "az";
    let soundEnabled = localStorage.getItem("soundEnabled") === "false" ? false : true;
    let darkMode = localStorage.getItem("darkMode") === "true";
    let angle = 0;
    let spinning = false;

    // Selected meal
    let selectedMealName = '';

    // 2. API FUNCTIONS

    // Load Users Data
    function loadUserInfo() {
        return fetch('/api/wheel/userinfo')
            .then(function (res) {
                if (res.ok) return res.json();
                throw new Error('Error');
            })
            .then(function (data) {
                currentUserName = data.userName || "guest";
            })
            .catch(function () {
                currentUserName = "guest";
            })
            .then(function () {
                deletedDefaults = JSON.parse(localStorage.getItem("deletedDefaults_" + currentUserName)) || [];
                results = JSON.parse(localStorage.getItem("lunchPickerHistory_" + currentUserName)) || [];
            });
    }

    // Save Deleted Elements
    function saveDeletedDefaults() {
        localStorage.setItem("deletedDefaults_" + currentUserName, JSON.stringify(deletedDefaults));
    }

    // Loading Elements 
    function fetchWheelItems() {
        items = defaultItems.filter(function (item) {
            return !deletedDefaults.includes(item.name.toLowerCase());
        });

        fetch('/api/wheel/items')
            .then(function (res) {
                if (res.ok) return res.json();
                throw new Error('Error');
            })
            .then(function (data) {
                if (data && data.length > 0) {
                    var defaultNames = defaultItems.map(function (d) { return d.name.toLowerCase(); });
                    var newItems = data.filter(function (item) {
                        return !defaultNames.includes(item.name.toLowerCase());
                    }).map(function (item) { return { id: item.id, name: item.name }; });

                    items = items.concat(newItems);
                }
            })
            .catch(function (e) {
                console.log('API error, using defaults:', e);
            })
            .then(function () {
                console.log('User:', currentUserName, '| Items:', items);
                drawWheel();
            });
    }

    // Save SpinResults to Database
    function saveSpinToDatabase(wheelItemId, resultName) {
        fetch('/api/wheel/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wheelItemId: wheelItemId,
                result: resultName
            })
        }).catch(function (e) {
            console.log('Could not save to database:', e);
        });
    }

    // Fetch Results from Database
    function fetchResultsFromDB() {
        return fetch('/api/wheel/results')
            .then(function (res) {
                if (res.ok) return res.json();
                throw new Error('Error');
            })
            .then(function (data) {
                return data.map(function (r) {
                    return {
                        id: r.id,
                        name: r.name,
                        time: r.time,
                        userName: r.userName
                    };
                });
            })
            .catch(function (e) {
                console.log('Could not fetch results:', e);
                return results;
            });
    }

    // Add New Element
    function addNewItemToDB(name) {
        return fetch('/api/wheel/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        })
            .then(function (res) {
                if (res.ok) return res.json();
                return null;
            })
            .catch(function (e) {
                console.error('API error:', e);
                return null;
            });
    }

    // Delete Element
    function deleteItemFromDB(id) {
        if (!id) return;
        fetch('/api/wheel/items/' + id, {
            method: 'DELETE'
        }).catch(function (e) {
            console.error('Delete error:', e);
        });
    }

    // 3. DICTIONARY

    var translations = {
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

    // 4. AUDIO ENGINE

    var audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, duration, vol) {
        vol = vol || 0.05;
        if (!soundEnabled) return;
        if (!audioCtx) initAudio();
        if (audioCtx.state === 'suspended') return;

        var o = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.setValueAtTime(freq, audioCtx.currentTime);
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        o.start();
        o.stop(audioCtx.currentTime + duration);
    }

    function triggerTickSound() { playTone(280, 0.05, 0.02); }
    function triggerClickSound() { playTone(450, 0.08, 0.03); }
    function triggerWinSound() {
        playTone(523, 0.4, 0.08);
        setTimeout(function () { playTone(659, 0.4, 0.08); }, 150);
    }

    // 5. DRAW WHEEL

    function drawWheel() {
        if (!canvas) return;
        if (items.length === 0) {
            console.log('No items to draw');
            return;
        }

        var totalWeight = items.reduce(function (sum, i) { return sum + (i.weight || 1); }, 0);
        var startAngle = angle - Math.PI / 2;

        ctx.clearRect(0, 0, 500, 500);
        items.forEach(function (item, i) {
            var arc = ((item.weight || 1) / totalWeight) * (2 * Math.PI);
            ctx.beginPath();
            ctx.fillStyle = 'hsl(' + ((i * 360) / items.length) + ', 65%, 60%)';
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

    // 6. SPIN LOGIC
    function spinWheel() {
        initAudio();
        if (spinning || items.length < 2) return;
        spinning = true;
        spinBtn.disabled = true;
        triggerClickSound();

        var spinDuration = 5000 + Math.random() * 2000;
        var startTime = Date.now();
        var velocity = 0.7 + Math.random() * 0.5;
        var lastTickSegment = -1;

        function animate() {
            var elapsed = Date.now() - startTime;
            var progress = elapsed / spinDuration;
            if (progress < 1) {
                var ease = 1 - Math.pow(1 - progress, 4);
                angle += velocity * (1 - ease);
                var currentSegment = Math.floor(
                    ((2 * Math.PI - (angle % (2 * Math.PI))) / (2 * Math.PI)) * items.length
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

        var totalWeight = items.reduce(function (sum, i) { return sum + (i.weight || 1); }, 0);
        var normalizedAngle = (2 * Math.PI - (angle % (2 * Math.PI))) % (2 * Math.PI);

        var cumulative = 0;
        var winnerIndex = 0;

        for (var i = 0; i < items.length; i++) {
            cumulative += ((items[i].weight || 1) / totalWeight) * (2 * Math.PI);
            if (normalizedAngle <= cumulative) {
                winnerIndex = i;
                break;
            }
        }

        var winner = items[winnerIndex];

        // Save to Database
        saveSpinToDatabase(winner.id, winner.name);

        // Save to LocalStorage
        results.unshift({
            name: winner.name,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            id: Date.now(),
        });
        saveData();

        // Send selected meal to Index.cshtml
        setSelectedMeal(winner.name);

        showWinnerModal(winner, winnerIndex);
    }

    // 7. MODAL WINDOWS

    function showWinnerModal(winner, index) {
        var t = translations[currentLang];
        modalTitle.textContent = t.winTitle;
        var mealImg = "";

        fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=' + winner.name)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.meals && data.meals[0]) mealImg = data.meals[0].strMealThumb;
            })
            .catch(function () { console.error("API Error"); })
            .then(function () {
                var imgHtml = mealImg
                    ? '<img src="' + mealImg + '" style="width:160px;height:160px;border-radius:20px;object-fit:cover;margin-bottom:15px;box-shadow:0 8px 20px rgba(0,0,0,0.2);">'
                    : '<div style="font-size:50px;margin-bottom:15px;">🎉</div>';

                var bgColor = darkMode ? "#818cf8" : "#1f2937";

                modalBody.innerHTML = '<div style="text-align:center;padding:20px 0;">' +
                    imgHtml +
                    '<div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;">' + t.winMsg + '</div>' +
                    '<div style="font-size:28px;font-weight:800;color:' + bgColor + ';margin-top:5px;">' + winner.name + '</div>' +
                    '</div>';

                confirmBtn.textContent = t.delete;
                confirmBtn.onclick = function () {
                    items.splice(index, 1);
                    saveData();
                    drawWheel();
                    modal.classList.remove("active");
                };
                cancelBtn.style.display = "block";
                cancelBtn.textContent = t.ok;
                cancelBtn.onclick = function () { modal.classList.remove("active"); };
                modal.classList.add("active");
                triggerWinSound();
                if (window.confetti) {
                    confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
                }
            });
    }

    function showManageMenu() {
        var t = translations[currentLang];
        modalTitle.textContent = t.modify;
        var html = '<div style="display:flex;flex-direction:column;gap:8px;width:100%;">';

        items.forEach(function (item, i) {
            var borderColor = darkMode ? "#374151" : "#e5e7eb";
            var bgColor = darkMode ? "#111827" : "#fff";
            var textColor = darkMode ? "#fff" : "#000";
            html += '<div style="display:flex;align-items:center;padding:10px;border:1px solid ' + borderColor + ';border-radius:10px;background:' + bgColor + ';">' +
                '<input type="text" value="' + item.name + '" onchange="updateItemName(' + i + ', this.value)" style="flex:1;border:none;outline:none;background:transparent;color:' + textColor + ';">' +
                '<button onclick="removeItem(' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;"><i class="fas fa-trash-alt"></i></button>' +
                '</div>';
        });

        var textColor = darkMode ? "#fff" : "#000";
        html += '<div style="border:1.5px dashed #5b5df0;padding:10px;border-radius:10px;display:flex;align-items:center;">' +
            '<input type="text" id="addInp" placeholder="' + t.placeholder + '" style="flex:1;border:none;outline:none;background:transparent;color:' + textColor + ';">' +
            '<i class="fas fa-plus" onclick="addNewItem()" style="color:#5b5df0;cursor:pointer;"></i>' +
            '</div></div>';

        modalBody.innerHTML = html;
        confirmBtn.textContent = t.ok;
        confirmBtn.onclick = function () { modal.classList.remove("active"); };
        cancelBtn.style.display = "none";
        modal.classList.add("active");
    }

    function showHistory() {
        var t = translations[currentLang];
        modalTitle.textContent = t.historyTitle;

        fetchResultsFromDB().then(function (apiResults) {
            var html = '<div class="modal-scroll-content" style="display:flex;flex-direction:column;gap:8px;">';

            if (apiResults.length === 0) {
                html += '<div style="text-align:center;padding:20px;color:#9ca3af;">Nəticə yoxdur</div>';
            } else {
                apiResults.forEach(function (r, i) {
                    var borderColor = darkMode ? "#374151" : "#e5e7eb";
                    var bgColor = darkMode ? "#111827" : "#f9fafb";
                    html += '<div style="display:flex;justify-content:space-between;padding:12px;background:' + bgColor + ';border-radius:10px;border:1px solid ' + borderColor + ';">' +
                        '<span style="font-weight:600;">#' + (apiResults.length - i) + ' ' + r.name + '</span>' +
                        '<span style="font-size:11px;color:#9ca3af;">' + r.time + '</span>' +
                        '</div>';
                });
            }
            html += '</div>';

            modalBody.innerHTML = html;
            confirmBtn.textContent = t.ok;
            confirmBtn.onclick = function () { modal.classList.remove("active"); };
            cancelBtn.style.display = "none";
            modal.classList.add("active");
        });
    }

    function closeCustomModal() {
        modal.classList.remove("active");
    }

    // 8. ELEMENT OPERATIONS

    window.updateItemName = function (idx, val) {
        if (val.trim()) {
            items[idx].name = val.trim();
            saveData();
            drawWheel();
        }
    };

    window.removeItem = function (idx) {
        var item = items[idx];

        var defaultNames = defaultItems.map(function (d) { return d.name.toLowerCase(); });
        if (defaultNames.includes(item.name.toLowerCase())) {
            deletedDefaults.push(item.name.toLowerCase());
            saveDeletedDefaults();
        }

        if (item.id) {
            deleteItemFromDB(item.id);
        }

        items.splice(idx, 1);
        saveData();
        drawWheel();
        showManageMenu();
    };

    window.addNewItem = function () {
        var inp = document.getElementById("addInp");
        if (inp && inp.value.trim()) {
            var name = inp.value.trim();

            addNewItemToDB(name).then(function (result) {
                if (result && result.id) {
                    items.push({ id: result.id, name: name, weight: 1 });
                } else {
                    items.push({ name: name, weight: 1 });
                }

                saveData();
                drawWheel();
                showManageMenu();
            });
        }
    };

    function saveData() {
        localStorage.setItem("lunchPickerItems_" + currentUserName, JSON.stringify(items));
        localStorage.setItem("lunchPickerHistory_" + currentUserName, JSON.stringify(results));
    }

    // 9. DARK MODE
    function applyDarkMode() {
        document.body.classList.toggle("dark", darkMode);
        var btn = document.getElementById("themeToggleBtn");
        if (btn) btn.innerHTML = darkMode ? sunIcon : moonIcon;
        localStorage.setItem("darkMode", darkMode);
    }

    var moonIcon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    var sunIcon = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

    function initDarkMode() {
        var navRight = document.querySelector(".nav-right");
        if (!navRight) return;
        var btn = document.createElement("button");
        btn.id = "themeToggleBtn";
        btn.className = "theme-toggle-btn";
        btn.innerHTML = darkMode ? sunIcon : moonIcon;
        btn.onclick = function () {
            darkMode = !darkMode;
            applyDarkMode();
        };
        var langEl = navRight.querySelector(".language");
        if (langEl) {
            navRight.insertBefore(btn, langEl);
        } else {
            navRight.appendChild(btn);
        }
        applyDarkMode();
    }

    // 10. EVENT LISTENERS

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") modal.classList.remove("active");
        if (e.key === "Enter" && modal.classList.contains("active"))
            confirmBtn.click();
        if (e.code === "Space" && !spinning && !modal.classList.contains("active")) {
            e.preventDefault();
            spinWheel();
        }
    });

    spinBtn.addEventListener("click", spinWheel);
    modifyBtn.addEventListener("click", showManageMenu);
    resultsBtn.addEventListener("click", showHistory);

    soundBtn.addEventListener("click", function () {
        soundEnabled = !soundEnabled;
        localStorage.setItem("soundEnabled", soundEnabled);
        soundBtn.innerHTML = soundEnabled
            ? '<i class="fas fa-volume-up"></i>'
            : '<i class="fas fa-volume-mute"></i>';
    });

    function showToast(message) {
        var toast = document.getElementById("toast");
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(function () {
            toast.classList.remove("show");
        }, 2500);
    }

    shareBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(window.location.href)
            .then(function () { showToast(translations[currentLang].copyMsg); });
    });

    fullscreenBtn.addEventListener("click", function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            showToast(currentLang === "az" ? "Tam ekran aktivləşdi" : currentLang === "ru" ? "Полноэкранный режим" : "Fullscreen activated");
        } else {
            document.exitFullscreen();
            showToast(currentLang === "az" ? "Tam ekrandan çıxıldı" : currentLang === "ru" ? "Выход из полноэкранного режима" : "Exited fullscreen");
        }
    });

    langToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        langMenu.style.display = langMenu.style.display === "flex" ? "none" : "flex";
    });

    document.querySelectorAll(".lang-menu div").forEach(function (el) {
        el.addEventListener("click", function () {
            currentLang = el.getAttribute("data-lang");
            localStorage.setItem("lang", currentLang);
            location.reload();
        });
    });

    document.addEventListener("click", function () { langMenu.style.display = "none"; });

    // 11. RECIPE FUNCTIONS (Index.cshtml connection)

    function setSelectedMeal(name) {
        selectedMealName = name;
        var selectedDiv = document.getElementById('selectedMeal');
        var selectedNameEl = document.getElementById('selectedName');
        if (selectedDiv && selectedNameEl) {
            selectedNameEl.textContent = name;
            selectedDiv.style.display = 'block';
        }
    }

    window.getRandomMeal = function () {
        openMealModal();
        fetch('/Home/RandomMeal')
            .then(function (response) { return response.json(); })
            .then(function (meal) {
                if (meal.error) {
                    showMealError(meal.error);
                } else {
                    showMealDetails(meal);
                }
            })
            .catch(function () { showMealError('Xəta baş verdi'); });
    };

    window.searchMealByName = function () {
        if (!selectedMealName) return;
        openMealModal();
        fetch('/Home/SearchMeal?name=' + encodeURIComponent(selectedMealName))
            .then(function (response) { return response.json(); })
            .then(function (meal) {
                if (meal.error) {
                    showMealError(meal.error + '. Random tövsiyə alın...');
                    setTimeout(getRandomMeal, 1500);
                } else {
                    showMealDetails(meal);
                }
            })
            .catch(function () { showMealError('Xəta baş verdi'); });
    };

    function openMealModal() {
        var modal = document.getElementById('mealModal');
        var content = document.getElementById('mealContent');
        if (modal) modal.style.display = 'block';
        if (content) {
            content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Yemək axtarılır...</p></div>';
        }
    }

    window.closeMealModal = function () {
        var modal = document.getElementById('mealModal');
        if (modal) modal.style.display = 'none';
    };

    function showMealError(message) {
        var content = document.getElementById('mealContent');
        if (content) {
            content.innerHTML = '<div class="loading"><div style="font-size: 48px; margin-bottom: 15px;">😕</div><p>' + message + '</p></div>';
        }
    }

    function showMealDetails(meal) {
        var content = document.getElementById('mealContent');
        if (!content) return;

        var youtubeHtml = '';
        if (meal.youtube) {
            var videoUrl = meal.youtube.replace('watch?v=', 'embed/');
            youtubeHtml = '<div class="section-title">🎬 Video Resept</div>' +
                '<div class="video-container"><iframe src="' + videoUrl + '" frameborder="0" allowfullscreen></iframe></div>';
        }

        var ingredientsHtml = '';
        if (meal.ingredients && meal.ingredients.length > 0) {
            meal.ingredients.forEach(function (ing) {
                ingredientsHtml += '<div class="ingredient"><span>✓</span><span>' + ing + '</span></div>';
            });
        }

        var categoryBadge = meal.category ? '<span class="badge">' + meal.category + '</span>' : '';
        var areaBadge = meal.area ? '<span class="badge">' + meal.area + '</span>' : '';

        content.innerHTML = '<img src="' + meal.image + '" alt="' + meal.name + '" class="meal-image">' +
            '<div class="meal-info">' +
            '<h2 class="meal-title">' + meal.name + '</h2>' +
            '<div class="meal-badges">' + categoryBadge + areaBadge + '</div>' +
            '<div class="section-title">🥗 Tərkiblər</div>' +
            '<div class="ingredients-list">' + ingredientsHtml + '</div>' +
            '<div class="section-title">👨‍🍳 Hazırlanma</div>' +
            '<div class="instructions">' + meal.instructions + '</div>' +
            youtubeHtml +
            '</div>' +
            '<div class="modal-footer">' +
            '<button class="modal-btn btn-secondary" onclick="getRandomMeal()">🔄 Başqa</button>' +
            '<button class="modal-btn btn-primary" onclick="closeMealModal()">Bağla</button>' +
            '</div>';
    }

    // Close modal on outside click
    window.addEventListener("click", function (event) {
        var mealModal = document.getElementById('mealModal');
        if (event.target == mealModal) {
            closeMealModal();
        }
    });

    // 12. INITIALIZATION

    initDarkMode();

    loadUserInfo().then(function () {
        fetchWheelItems();
    });

    var titleEl = document.querySelector(".title");
    if (titleEl) titleEl.textContent = translations[currentLang].title;
    spinBtn.textContent = translations[currentLang].spin;
    modifyBtn.textContent = translations[currentLang].modify;
    resultsBtn.textContent = translations[currentLang].results;

});