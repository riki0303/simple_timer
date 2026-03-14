let totalMs = 0;
let elapsedMs = 0;
let intervalId = null;
let lastTick = null;
let alarms = [];

const timerDisplay = document.getElementById('timerDisplay');
const totalMinutesInput = document.getElementById('totalMinutes');
const totalSecondsInput = document.getElementById('totalSeconds');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const alarmMinutesInput = document.getElementById('alarmMinutes');
const alarmSecondsInput = document.getElementById('alarmSeconds');
const addAlarmBtn = document.getElementById('addAlarmBtn');
const alarmList = document.getElementById('alarmList');

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTotalMs() {
  const m = parseInt(totalMinutesInput.value) || 0;
  const s = parseInt(totalSecondsInput.value) || 0;
  return (m * 60 + s) * 1000;
}

function updateDisplay() {
  const remaining = Math.max(0, totalMs - elapsedMs);
  timerDisplay.textContent = formatTime(remaining);
  timerDisplay.classList.toggle('finished', elapsedMs >= totalMs && totalMs > 0);
}

function playBeep() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

function playFinishAlarm() {
  const ctx = new AudioContext();
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  [0, 0.4, 0.8].forEach((offset) => {
    const osc = ctx.createOscillator();
    osc.connect(gain);
    osc.frequency.value = 523;
    gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.35);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.35);
  });
}

function tick() {
  const now = performance.now();
  const delta = now - lastTick;
  lastTick = now;
  elapsedMs += delta;

  totalMs = getTotalMs();
  if (elapsedMs >= totalMs) {
    elapsedMs = totalMs;
    updateDisplay();
    stop();
    playFinishAlarm();
    return;
  }

  checkAlarms();
  updateDisplay();
}

function checkAlarms() {
  const remaining = totalMs - elapsedMs;
  alarms.forEach((alarm) => {
    if (!alarm.fired && remaining <= alarm.ms) {
      alarm.fired = true;
      playBeep();
      renderAlarms();
    }
  });
}

function start() {
  totalMs = getTotalMs();
  if (totalMs === 0) return;
  if (elapsedMs >= totalMs) return;

  lastTick = performance.now();
  intervalId = setInterval(tick, 100);

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  totalMinutesInput.disabled = true;
  totalSecondsInput.disabled = true;
}

function stop() {
  clearInterval(intervalId);
  intervalId = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  totalMinutesInput.disabled = false;
  totalSecondsInput.disabled = false;
}

function reset() {
  stop();
  elapsedMs = 0;
  totalMs = getTotalMs();
  alarms.forEach((a) => (a.fired = false));
  timerDisplay.classList.remove('finished');
  updateDisplay();
  renderAlarms();
}

function renderAlarms() {
  alarmList.innerHTML = '';
  alarms
    .slice()
    .sort((a, b) => a.ms - b.ms)
    .forEach((alarm) => {
      const li = document.createElement('li');
      li.className = 'alarm-item' + (alarm.fired ? ' fired' : '');

      const span = document.createElement('span');
      span.textContent = `残り ${formatTime(alarm.ms)}`;

      const delBtn = document.createElement('button');
      delBtn.className = 'alarm-delete';
      delBtn.textContent = '×';
      delBtn.setAttribute('aria-label', '削除');
      delBtn.addEventListener('click', () => {
        alarms = alarms.filter((a) => a !== alarm);
        renderAlarms();
      });

      li.appendChild(span);
      li.appendChild(delBtn);
      alarmList.appendChild(li);
    });
}

startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', stop);
resetBtn.addEventListener('click', reset);

addAlarmBtn.addEventListener('click', () => {
  const m = parseInt(alarmMinutesInput.value) || 0;
  const s = parseInt(alarmSecondsInput.value) || 0;
  const ms = (m * 60 + s) * 1000;
  if (ms === 0) return;

  alarms.push({ ms, fired: false });
  renderAlarms();
});

totalMs = getTotalMs();
updateDisplay();
