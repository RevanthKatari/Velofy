const speedEl = document.getElementById('speed');
const unitEl = document.getElementById('unit');
const toggleBtn = document.getElementById('toggle-unit');
const testBtn = document.getElementById('test-visualization');

let useMph = false;
let currentSpeed = 0;
let displayedSpeed = 0;
let testActive = false;

function kmhToMph(kmh) {
  return kmh * 0.621371;
}

function mphToKmh(mph) {
  return mph / 0.621371;
}

function getColorForSpeed(speedKmh) {
  // 0-20: blue, 20-60: green, 60-120: yellow, 120+: red
  if (speedKmh < 20) return ['#1a237e', '#2196f3']; // deep blue
  if (speedKmh < 60) return ['#004d40', '#00bfae']; // teal
  if (speedKmh < 120) return ['#fbc02d', '#ffeb3b']; // yellow
  return ['#b71c1c', '#ff5252']; // red
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// --- Add color interpolation helpers ---
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function lerpColor(a, b, t) {
  return a.map((v, i) => Math.round(lerp(v, b[i], t)));
}

let colorState = {
  bg: hexToRgb(getColorForSpeed(0)[0]),
  accent: hexToRgb(getColorForSpeed(0)[1])
};
let colorTarget = {
  bg: hexToRgb(getColorForSpeed(0)[0]),
  accent: hexToRgb(getColorForSpeed(0)[1])
};

let lastTime = performance.now();
let numberAnimStart = 0;
let numberAnimFrom = 0;
let numberAnimTo = 0;
let numberAnimDuration = 0.5; // seconds

function animate(now) {
  if (!now) now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  // --- Number animation ---
  if (Math.abs(numberAnimTo - numberAnimFrom) > 0.1) {
    const elapsed = Math.min((now - numberAnimStart) / (numberAnimDuration * 1000), 1);
    displayedSpeed = lerp(numberAnimFrom, numberAnimTo, 1 - Math.pow(1 - elapsed, 2)); // ease out
    if (elapsed >= 1) displayedSpeed = numberAnimTo;
  } else {
    displayedSpeed = numberAnimTo;
  }
  const shown = useMph ? kmhToMph(displayedSpeed) : displayedSpeed;
  speedEl.textContent = Math.round(shown);
  unitEl.textContent = useMph ? 'mph' : 'km/h';

  // --- Color animation ---
  colorState.bg = lerpColor(colorState.bg, colorTarget.bg, Math.min(1, dt * 8));
  colorState.accent = lerpColor(colorState.accent, colorTarget.accent, Math.min(1, dt * 8));
  const bgHex = rgbToHex(colorState.bg);
  const accentHex = rgbToHex(colorState.accent);
  document.documentElement.style.setProperty('--color-bg', bgHex);
  document.documentElement.style.setProperty('--color-accent', accentHex);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', bgHex);

  requestAnimationFrame(animate);
}

function updateSpeedFromPosition(pos) {
  let speedMps = pos.coords.speed;
  if (speedMps == null || isNaN(speedMps)) speedMps = 0;
  currentSpeed = speedMps * 3.6; // m/s to km/h
  // Animate number
  numberAnimFrom = displayedSpeed;
  numberAnimTo = currentSpeed;
  numberAnimStart = performance.now();
  // Animate color
  const [bg, accent] = getColorForSpeed(currentSpeed);
  colorTarget.bg = hexToRgb(bg);
  colorTarget.accent = hexToRgb(accent);
}

function handleError(err) {
  currentSpeed = 0;
  numberAnimFrom = displayedSpeed;
  numberAnimTo = 0;
  numberAnimStart = performance.now();
  const [bg, accent] = getColorForSpeed(0);
  colorTarget.bg = hexToRgb(bg);
  colorTarget.accent = hexToRgb(accent);
}

if ('geolocation' in navigator) {
  navigator.geolocation.watchPosition(updateSpeedFromPosition, handleError, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 10000
  });
}

// Unit toggle
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    useMph = !useMph;
    localStorage.setItem('useMph', useMph ? '1' : '0');
  });
}

// Restore unit preference
if (localStorage.getItem('useMph') === '1') {
  useMph = true;
}

if (testBtn) {
  testBtn.addEventListener('click', () => {
    if (testActive) return;
    testActive = true;
    let testStart = performance.now();
    let testDuration = 3000; // ms
    let testEnd = testStart + testDuration;
    let testBackDuration = 1000;
    let testBackEnd = testEnd + testBackDuration;
    function testStep(now) {
      if (now < testEnd) {
        let t = (now - testStart) / testDuration;
        let speed = lerp(0, 180, t);
        numberAnimFrom = displayedSpeed;
        numberAnimTo = speed;
        numberAnimStart = performance.now();
        const [bg, accent] = getColorForSpeed(speed);
        colorTarget.bg = hexToRgb(bg);
        colorTarget.accent = hexToRgb(accent);
        requestAnimationFrame(testStep);
      } else if (now < testBackEnd) {
        let t = (now - testEnd) / testBackDuration;
        let speed = lerp(180, 0, t);
        numberAnimFrom = displayedSpeed;
        numberAnimTo = speed;
        numberAnimStart = performance.now();
        const [bg, accent] = getColorForSpeed(speed);
        colorTarget.bg = hexToRgb(bg);
        colorTarget.accent = hexToRgb(accent);
        requestAnimationFrame(testStep);
      } else {
        numberAnimFrom = displayedSpeed;
        numberAnimTo = 0;
        numberAnimStart = performance.now();
        const [bg, accent] = getColorForSpeed(0);
        colorTarget.bg = hexToRgb(bg);
        colorTarget.accent = hexToRgb(accent);
        testActive = false;
      }
    }
    requestAnimationFrame(testStep);
  });
}

requestAnimationFrame(animate);