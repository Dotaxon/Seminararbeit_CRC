/* ─────────────────────────────────────────────────────────────────────────
 * CRC Shift Register Visualizer — script.js
 * Pure vanilla JS, no dependencies.
 * ⚡ Vibe coded — results should be taken with a grain of salt.
 * ───────────────────────────────────────────────────────────────────────── */

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  registerWidth:    8,
  register:         [],   // bit array, index 0 = MSB (leftmost / shifted-out first)
  taps:             [],   // bool array, length = registerWidth - 1 (user checkboxes)
  messageFormat:    'ascii',
  bitStream:        [],   // full flat stream: message bits + N flush zeros
  totalMessageBits: 0,
  currentBitIndex:  0,
  shiftedOutBit:    null, // 0 | 1 | null
  isAutoMode:       false,
  autoIntervalMs:   1000,
  autoTimer:        null,
};

// ── DOM refs ───────────────────────────────────────────────────────────────

const elRegWidth     = document.getElementById('reg-width');
const elMsgInput     = document.getElementById('msg-input');
const elParseError   = document.getElementById('parse-error');
const elRegLeds      = document.getElementById('register-leds');
const elTapRow       = document.getElementById('tap-row');
const elShiftedOut   = document.getElementById('shifted-out-led');
const elBitPreview   = document.getElementById('bit-preview');
const elHexValue     = document.getElementById('hex-value');
const elPhase        = document.getElementById('phase-indicator');
const elStepCounter  = document.getElementById('step-counter');
const elFlushItem    = document.getElementById('flush-item');
const elFlushCounter = document.getElementById('flush-counter');
const elBtnApply     = document.getElementById('btn-apply');
const elBtnStep      = document.getElementById('btn-step');
const elAutoToggle   = document.getElementById('auto-toggle');
const elAutoInterval = document.getElementById('auto-interval');
const elBtnReset     = document.getElementById('btn-reset');

// ── Utility ────────────────────────────────────────────────────────────────

/** Convert a bit-array to a zero-padded hex string. */
function bitsToHex(bits) {
  const n = bits.length;
  const hexDigits = Math.ceil(n / 4);
  if (n === 0) return '00';
  // Build from MSB to LSB
  let val = BigInt(0);
  for (let i = 0; i < n; i++) {
    val = (val << 1n) | BigInt(bits[i]);
  }
  return val.toString(16).toUpperCase().padStart(hexDigits, '0');
}

/** Show or hide the parse-error span. */
function setParseError(msg) {
  if (msg) {
    elParseError.textContent = msg;
    elParseError.hidden = false;
  } else {
    elParseError.hidden = true;
  }
}

// ── Message Parsing ────────────────────────────────────────────────────────

/**
 * Parse the current message input into a flat bit stream (message bits only,
 * without flush zeros). Returns null on error (and shows error).
 */
function parseMessage() {
  const raw = elMsgInput.value;
  const fmt = document.querySelector('input[name="fmt"]:checked').value;
  let bits = [];

  if (fmt === 'ascii') {
    if (raw.length === 0) { setParseError('Message is empty.'); return null; }
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i);
      for (let b = 7; b >= 0; b--) {
        bits.push((code >> b) & 1);
      }
    }

  } else if (fmt === 'hex') {
    const clean = raw.replace(/\s/g, '');
    if (clean.length === 0) { setParseError('Message is empty.'); return null; }
    if (!/^[0-9a-fA-F]+$/.test(clean)) {
      setParseError('Hex input contains invalid characters.'); return null;
    }
    if (clean.length % 2 !== 0) {
      setParseError('Hex input must have an even number of digits (full bytes).'); return null;
    }
    for (let i = 0; i < clean.length; i += 2) {
      const byte = parseInt(clean.slice(i, i + 2), 16);
      for (let b = 7; b >= 0; b--) {
        bits.push((byte >> b) & 1);
      }
    }

  } else { // binary
    const clean = raw.replace(/\s/g, '');
    if (clean.length === 0) { setParseError('Message is empty.'); return null; }
    if (!/^[01]+$/.test(clean)) {
      setParseError('Binary input may only contain 0, 1, and whitespace.'); return null;
    }
    for (const ch of clean) bits.push(Number(ch));
  }

  setParseError('');
  return bits;
}

// ── UI Building ────────────────────────────────────────────────────────────

/** Rebuild the LED row and tap checkbox row for the current registerWidth. */
function buildUI() {
  const n = state.registerWidth;

  // ── Register LEDs ──────────────────────────────────────────────────
  elRegLeds.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const led = document.createElement('div');
    led.className = 'led led-off';
    led.dataset.index = i;
    led.title = `Bit ${i} (${i === 0 ? 'MSB' : i === n - 1 ? 'LSB' : ''})`;
    led.addEventListener('click', () => {
      state.register[i] ^= 1;
      updateLeds();
      updateHex();
    });
    elRegLeds.appendChild(led);
  }

  // ── Tap Row ────────────────────────────────────────────────────────
  // Layout: N-1 user checkboxes (one between every adjacent LED pair)
  //         1 always-active ⊕ marker  (after the last LED, at the entry point)
  // Each cell is 36px wide (= LED 32 + gap 4) to align with gaps between LEDs.
  elTapRow.innerHTML = '';

  // Preserve existing tap values if possible
  const oldTaps = state.taps.slice();
  state.taps = [];

  // N-1 user checkboxes: tap[i] is between LED[i] and LED[i+1]
  // When checked, feedback is XORed into register[i] after the shift
  // (because register[i] just received old register[i+1] = the bit that
  //  was shifted in from the right side of the tap)
  for (let i = 0; i < n - 1; i++) {
    const cell = document.createElement('div');
    cell.className = 'tap-cell';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.title = `XOR tap between stage ${i} and ${i + 1} — XORs feedback into register[${i}]`;
    cb.checked = (oldTaps[i] === true);
    cb.addEventListener('change', () => { state.taps[i] = cb.checked; });

    state.taps.push(cb.checked);
    cell.appendChild(cb);
    elTapRow.appendChild(cell);
  }

  // Always-active marker: after LED[N-1], at the rightmost entry point
  if (n >= 2) {
    const always = document.createElement('div');
    always.className = 'tap-always';
    always.textContent = '⊕';
    always.title = 'Always active: feedback is always XORed into the incoming bit (register[N-1])';
    elTapRow.appendChild(always);
  }
}

// ── Display Updates ────────────────────────────────────────────────────────

function updateLeds() {
  const leds = elRegLeds.querySelectorAll('.led');
  leds.forEach((led, i) => {
    led.classList.toggle('led-on',  state.register[i] === 1);
    led.classList.toggle('led-off', state.register[i] === 0);
  });
}

function updateShiftedOut() {
  const bit = state.shiftedOutBit;
  elShiftedOut.classList.toggle('led-on',  bit === 1);
  elShiftedOut.classList.toggle('led-off', bit === 0 || bit === null);
}

function updateHex() {
  elHexValue.textContent = bitsToHex(state.register);
}

/** Render up to 16 preview dots from the bit stream ahead of currentBitIndex. */
function updatePreview() {
  elBitPreview.innerHTML = '';
  const start = state.currentBitIndex;
  const end   = state.bitStream.length;
  if (start >= end) return;

  const BITS_PER_ROW = 24; // 3 bytes per row

  for (let rowStart = start; rowStart < end; rowStart += BITS_PER_ROW) {
    const rowEl = document.createElement('div');
    rowEl.className = 'preview-row';

    for (let byteIdx = 0; byteIdx < 3; byteIdx++) {
      const byteStart = rowStart + byteIdx * 8;
      if (byteStart >= end) break;

      const byteEl = document.createElement('div');
      byteEl.className = 'preview-byte';

      for (let b = 0; b < 8; b++) {
        const i = byteStart + b;
        if (i >= end) break;

        const dot = document.createElement('div');
        dot.className = 'preview-dot ' + (state.bitStream[i] === 1 ? 'bit-1' : 'bit-0');
        dot.title = `bit ${i}: ${state.bitStream[i]} (click to toggle)`;
        dot.addEventListener('click', () => {
          state.bitStream[i] ^= 1;
          updatePreview();
        });
        byteEl.appendChild(dot);
      }

      rowEl.appendChild(byteEl);
    }

    elBitPreview.appendChild(rowEl);
  }
}

function updateStatus() {
  const n          = state.registerWidth;
  const total      = state.bitStream.length; // message bits + N flush zeros
  const cur        = state.currentBitIndex;
  const msgBits    = state.totalMessageBits;

  elStepCounter.textContent = `${cur} / ${total}`;

  if (cur >= total) {
    elPhase.textContent = 'Done';
    elPhase.className = 'status-value phase-done';
    elFlushItem.hidden = false;
    elFlushCounter.textContent = `${n} / ${n}`;
  } else if (cur >= msgBits) {
    // In flush phase
    const flushDone = cur - msgBits;
    elPhase.textContent = 'Flush';
    elPhase.className = 'status-value phase-flush';
    elFlushItem.hidden = false;
    elFlushCounter.textContent = `${flushDone} / ${n}`;
  } else {
    elPhase.textContent = 'Message';
    elPhase.className = 'status-value phase-message';
    elFlushItem.hidden = true;
  }
}

function updateAll() {
  updateLeds();
  updateShiftedOut();
  updateHex();
  updatePreview();
  updateStatus();
}

// ── Shift Step ─────────────────────────────────────────────────────────────

function step() {
  if (state.currentBitIndex >= state.bitStream.length) {
    stopAuto();
    return;
  }

  const n        = state.registerWidth;
  const nextBit  = state.bitStream[state.currentBitIndex];
  const feedback = state.register[0];          // 1. Save MSB

  // 2. Shift left: register[i] = register[i+1] for i = 0..n-2
  for (let i = 0; i < n - 1; i++) {
    state.register[i] = state.register[i + 1];
  }
  state.register[n - 1] = nextBit;             // rightmost gets next message/flush bit

  // 3. XOR feedback into each user-selected tap position.
  //    tap[i] sits between LED[i] and LED[i+1]. After the left-shift,
  //    register[i] holds what was register[i+1] before the shift.
  //    So the XOR applies to register[i] — the LEFT side of the tap.
  for (let i = 0; i < state.taps.length; i++) {
    if (state.taps[i]) {
      state.register[i] ^= feedback;
    }
  }

  // 4. Always XOR feedback into rightmost (position n-1)
  state.register[n - 1] ^= feedback;

  state.shiftedOutBit = feedback;
  state.currentBitIndex++;

  updateAll();

  if (state.currentBitIndex >= state.bitStream.length) {
    stopAuto();
    elBtnStep.disabled = true;
  }
}

// ── Auto Mode ──────────────────────────────────────────────────────────────

function startAuto() {
  if (state.autoTimer !== null) clearInterval(state.autoTimer);
  state.isAutoMode = true;
  state.autoTimer = setInterval(() => {
    if (state.currentBitIndex >= state.bitStream.length) {
      stopAuto();
      return;
    }
    step();
  }, state.autoIntervalMs);
}

function stopAuto() {
  if (state.autoTimer !== null) {
    clearInterval(state.autoTimer);
    state.autoTimer = null;
  }
  state.isAutoMode = false;
  elAutoToggle.checked = false;
}

// ── Reset ──────────────────────────────────────────────────────────────────

function reset() {
  stopAuto();
  state.register.fill(0);
  state.shiftedOutBit = null;
  state.currentBitIndex = 0;

  // Explicitly reset flush counter display
  elFlushCounter.textContent = `0 / ${state.registerWidth}`;
  elFlushItem.hidden = true;

  // Re-parse message; on error keep last valid stream or use empty
  const messageBits = parseMessage();
  if (messageBits !== null) {
    state.totalMessageBits = messageBits.length;
    const flushZeros = new Array(state.registerWidth).fill(0);
    state.bitStream = messageBits.concat(flushZeros);
  } else {
    state.totalMessageBits = 0;
    state.bitStream = [];
  }

  elBtnStep.disabled = (state.bitStream.length === 0);
  updateAll();
}

// ── Initialization ─────────────────────────────────────────────────────────

function init() {
  // Apply current width and interval from DOM inputs
  state.registerWidth  = Math.max(2, Math.min(64, parseInt(elRegWidth.value, 10) || 8));
  state.register       = new Array(state.registerWidth).fill(0);
  state.autoIntervalMs = Math.max(50, parseInt(elAutoInterval.value, 10) || 1000);

  buildUI();
  reset();
}

// ── Event Listeners ────────────────────────────────────────────────────────

// Register width change
elRegWidth.addEventListener('change', () => {
  const w = parseInt(elRegWidth.value, 10);
  if (isNaN(w) || w < 2 || w > 64) return;
  state.registerWidth = w;
  state.register      = new Array(w).fill(0);
  buildUI();
  reset();
});

// Message format change — just re-validate visual feedback
document.querySelectorAll('input[name="fmt"]').forEach(radio => {
  radio.addEventListener('change', () => { state.messageFormat = radio.value; });
});

// Message input live validation (show/hide error without resetting step)
elMsgInput.addEventListener('input', () => { setParseError(''); });

// Step button
elBtnStep.addEventListener('click', () => { step(); });

// Auto toggle
elAutoToggle.addEventListener('change', () => {
  if (elAutoToggle.checked) {
    if (state.currentBitIndex >= state.bitStream.length) {
      elAutoToggle.checked = false;
      return;
    }
    startAuto();
  } else {
    stopAuto();
  }
});

// Interval input
elAutoInterval.addEventListener('change', () => {
  const ms = parseInt(elAutoInterval.value, 10);
  if (isNaN(ms) || ms < 50) return;
  state.autoIntervalMs = ms;
  if (state.isAutoMode) {
    // Restart with new interval
    startAuto();
  }
});

// Apply button (load message → full reset)
elBtnApply.addEventListener('click', () => { reset(); });

// Reset button
elBtnReset.addEventListener('click', () => { reset(); });

// ── Boot ───────────────────────────────────────────────────────────────────
init();
