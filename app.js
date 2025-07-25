const speedEl = document.getElementById('speed');
const unitEl = document.getElementById('unit');
const toggleBtn = document.getElementById('toggle-unit');

let useMph = false;
let currentSpeed = 0;
let displayedSpeed = 0;

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

function animate() {
  // Smoothly interpolate displayed speed
  displayedSpeed = lerp(displayedSpeed, currentSpeed, 0.18);
  const shown = useMph ? kmhToMph(displayedSpeed) : displayedSpeed;
  speedEl.textContent = Math.round(shown);
  unitEl.textContent = useMph ? 'mph' : 'km/h';

  // Smooth color transition
  const [bg, accent] = getColorForSpeed(displayedSpeed);
  document.documentElement.style.setProperty('--color-bg', bg);
  document.documentElement.style.setProperty('--color-accent', accent);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', bg);

  requestAnimationFrame(animate);
}

function updateSpeedFromPosition(pos) {
  let speedMps = pos.coords.speed;
  if (speedMps == null || isNaN(speedMps)) speedMps = 0;
  currentSpeed = speedMps * 3.6; // m/s to km/h
}

function handleError(err) {
  currentSpeed = 0;
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

requestAnimationFrame(animate);