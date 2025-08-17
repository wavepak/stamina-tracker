(() => {
    const $ = (id) => document.getElementById(id);

    // DOM Refs
    const totalInput = $("total");
    const leftInput = $("left");
    const startBtn = $("start");
    const pauseBtn = $("pause");
    const batteryEl = $("battery");
    const fillEl = $("fill");
    const percentEl = $("percent");
    const badgeEl = $("badge");
    const teamsPre = $("teams");
    const live = $("live");
    const copyBtn = $("copy");

    // State
    let total = 500; // total_minutes_for_work (default)
    let left = 500;  // minutes_left_for_work (default)
    let active = false; // tracking active?
    let tickTimer = null;
    let refresh10mTimer = null;
    let lastTickMs = null;
    let dragging = false;

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
    const percent = () => total > 0 ? (left / total) * 100 : 0;

    function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
    }

    const DESCRIPTIONS = {
    high: ["Going strong", "Plenty in the tank", "All systems go", "Cruising", "Fresh as a daisy"],
    mid: ["Holding steady", "Chugging along", "Keep pace", "Manageable load", "On track"],
    low: ["Running low", "Battery critical", "Last stretch", "Nearly out", "Coffee required"]
    };

    function colorFor(p) {
    if (p >= 25) return { name: 'GREEN', class: 'green', emoji: '🟢', hex: getComputedStyle(document.documentElement).getPropertyValue('--green').trim() };
    if (p >= 10)  return { name: 'YELLOW', class: 'yellow', emoji: '🟡', hex: getComputedStyle(document.documentElement).getPropertyValue('--yellow').trim() };
    return { name: 'RED', class: 'red', emoji: '🔴', hex: getComputedStyle(document.documentElement).getPropertyValue('--red').trim() };
    }

    function teamsBar(p) {
    const width = 20; // 20 characters wide bar
    const filled = Math.round((clamp(p,0,100) / 100) * width);
    const empty = width - filled;
    return '【' + '█'.repeat(filled) + '░'.repeat(empty) + '】';
    }

    function descriptionFor(p) {
    if (p >= 25) return pick(DESCRIPTIONS.high);
    if (p >= 10)  return pick(DESCRIPTIONS.mid);
    return pick(DESCRIPTIONS.low);
    }

    function renderTeams() {
    const p = percent();
    const pDisp = Math.round(p);
    const { emoji } = colorFor(p);
    const text = `${emoji} Stamina ${pDisp}% ${teamsBar(p)} — ${descriptionFor(p)}`;
    teamsPre.textContent = text;
    }

    function setBadge(color) {
    badgeEl.textContent = color.name;
    badgeEl.classList.remove('green','yellow','red');
    badgeEl.classList.add(color.class);
    }

    function updateBatteryVisuals() {
    const p = percent();
    const pDisp = Math.round(p);
    const color = colorFor(p);
    // Height reflects actual percent (0..100)
    fillEl.style.height = `${clamp(p, 0, 100)}%`;
    fillEl.style.background = color.hex;
    percentEl.textContent = `${clamp(pDisp, 0, 100)}%`;
    batteryEl.setAttribute('aria-valuenow', String(clamp(pDisp, 0, 100)));
    setBadge(color);
    }

    function updateInputs() {
    totalInput.value = String(total);
    leftInput.value = String(left);
    }

    function updateUI() {
    updateBatteryVisuals();
    renderTeams();
    }

    function startTracking() {
    if (active) return;
    active = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    totalInput.disabled = true;
    leftInput.disabled = true;
    batteryEl.classList.remove('idle');
    batteryEl.classList.add('active');
    lastTickMs = Date.now();
    tickTimer = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - lastTickMs;
        const wholeMinutes = Math.floor(elapsedMs / 60000);
        if (wholeMinutes >= 1) {
        left = clamp(left - wholeMinutes, 0, total);
        lastTickMs += wholeMinutes * 60000;
        updateInputs();
        updateUI();
        if (left <= 0) {
            pauseTracking();
        }
        }
    }, 1000);
    // Explicit 10-minute refresh as requested
    refresh10mTimer = setInterval(() => updateUI(), 600000);
    live.textContent = 'Tracking started';
    }

    function pauseTracking() {
    if (!active) return;
    active = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    totalInput.disabled = false;
    leftInput.disabled = false;
    batteryEl.classList.remove('active');
    batteryEl.classList.add('idle');
    if (tickTimer) clearInterval(tickTimer);
    if (refresh10mTimer) clearInterval(refresh10mTimer);
    tickTimer = refresh10mTimer = null;
    updateUI();
    live.textContent = 'Tracking paused';
    }

    // Drag to set when paused
    function setFromPointer(clientY) {
    const rect = batteryEl.getBoundingClientRect();
    const relY = clamp(clientY - rect.top, 0, rect.height);
    const fromBottomPx = rect.height - relY;
    const p = (fromBottomPx / rect.height) * 100; // 0..100
    const mins = Math.round((clamp(p, 0, 100) / 100) * total);
    left = clamp(mins, 0, total);
    updateInputs();
    updateUI();
    }

    function bindDragging() {
    batteryEl.addEventListener('pointerdown', (e) => {
        if (active) return; // disabled while active
        dragging = true;
        batteryEl.setPointerCapture(e.pointerId);
        setFromPointer(e.clientY);
    });
    batteryEl.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        setFromPointer(e.clientY);
    });
    window.addEventListener('pointerup', (e) => {
        if (!dragging) return;
        dragging = false;
        try { batteryEl.releasePointerCapture(e.pointerId); } catch {}
    });
    }

    // Keyboard support (slider-like)
    function bindKeyboard() {
    batteryEl.addEventListener('keydown', (e) => {
        if (active) return;
        const step = {
        ArrowUp:   1,
        ArrowDown: -1,
        PageUp:    5,
        PageDown:  -5,
        Home:      'max',
        End:       'min'
        }[e.key];
        if (step === undefined) return;
        e.preventDefault();
        if (step === 'max') left = total;
        else if (step === 'min') left = 0;
        else left = clamp(left + Math.round((step/100) * total), 0, total);
        updateInputs();
        updateUI();
    });
    }

    // Inputs
    totalInput.addEventListener('input', () => {
    if (active) return;
    let v = parseInt(totalInput.value || '0', 10);
    if (Number.isNaN(v)) v = 1;
    v = clamp(v, 1, 1000000);
    total = v;
    left = clamp(left, 0, total);
    updateInputs();
    updateUI();
    });
    leftInput.addEventListener('input', () => {
    if (active) return;
    let v = parseInt(leftInput.value || '0', 10);
    if (Number.isNaN(v)) v = 0;
    v = clamp(v, 0, total);
    left = v;
    updateInputs();
    updateUI();
    });

    // Buttons
    startBtn.addEventListener('click', startTracking);
    pauseBtn.addEventListener('click', pauseTracking);

    // Copy Teams message
    copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(teamsPre.textContent);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
    } catch (err) {
        // Fallback: select text
        const r = document.createRange();
        r.selectNodeContents(teamsPre);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        copyBtn.textContent = 'Select → Copy';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 2000);
    }
    });

    // Initialize
    bindDragging();
    bindKeyboard();
    updateInputs();
    updateUI();
})();