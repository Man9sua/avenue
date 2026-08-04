// 1. DOM elements
const dom = {
  body: document.body,
  scene: document.querySelector("#card-scene"),
  particles: document.querySelector("#particles"),
  cardText: document.querySelector("#card-text"),
  edgeTrigger: document.querySelector("#edge-trigger"),
  editorFab: document.querySelector("#editor-fab"),
  motionPermission: document.querySelector("#motion-permission"),
  backdrop: document.querySelector("#editor-backdrop"),
  panel: document.querySelector("#editor-panel"),
  closeEditor: document.querySelector("#close-editor"),
  backgroundInputs: [...document.querySelectorAll('input[name="background"]')],
  textInput: document.querySelector("#text-input"),
  textCounter: document.querySelector("#text-counter"),
  selectionHint: document.querySelector("#selection-hint"),
  colorInput: document.querySelector("#highlight-color"),
  colorPresets: [...document.querySelectorAll("[data-color]")],
  glowOn: document.querySelector("#glow-on"),
  glowOff: document.querySelector("#glow-off"),
  formatReset: document.querySelector("#format-reset"),
  copyLink: document.querySelector("#copy-link"),
  linkResult: document.querySelector("#link-result"),
  generatedLink: document.querySelector("#generated-link"),
  resetAll: document.querySelector("#reset-all"),
  resetModal: document.querySelector("#reset-modal"),
  confirmReset: document.querySelector("#confirm-reset"),
  modalCloseButtons: [...document.querySelectorAll("[data-modal-close]")],
  toastRegion: document.querySelector("#toast-region"),
};

// 2. Application state
const DEFAULT_TEXT = dom.cardText.textContent.trim();
const DEFAULT_COLOR = "#ff4b99";
const DEFAULT_TEXT_COLOR = "#fff8fb";
const CARD_VERSION = 1;
const MAX_TEXT_LENGTH = 700;
const MAX_FRAGMENT_LENGTH = 500;
const MAX_FRAGMENTS = 80;
const MAX_SERIALIZED_BYTES = 50000;
const validBackgrounds = new Set(["hearts", "stars", "fire"]);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

const state = {
  mode: "editor",
  background: "hearts",
  color: DEFAULT_COLOR,
  glow: true,
  selectedOffsets: null,
  particleTimer: null,
  generatedUrl: null,
  motionListenerEnabled: false,
  motionLastSample: 0,
  lastShakeAt: 0,
  lastAcceleration: null,
};

const storageKeys = {
  background: "avenueCardV2.background",
  text: "avenueCardV2.text",
  markup: "avenueCardV2.markup",
  color: "avenueCardV2.color",
  glow: "avenueCardV2.glow",
  shakePermission: "avenueCardV2.shakePermission",
};

const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomItem = (items) => items[Math.floor(Math.random() * items.length)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// 3. Background configurations
const backgroundModes = {
  hearts: {
    className: "heart",
    palette: ["#ff1685", "#ff3d9d", "#ff006e", "#e93a91", "#ff5bac"],
    size: [14, 66],
    duration: [8.5, 15],
    interval: [650, 880],
    density: 62,
    minCount: 14,
    maxCount: 26,
    opacity: [0.38, 0.94],
    viewBox: [100, 94],
    exportPath: "M50 87C43 80 10 58 10 31C10 14 31 7 43 20L50 28L57 20C69 7 90 14 90 31C90 58 57 80 50 87Z",
    svg: `
      <svg class="particle__shape" viewBox="0 0 100 94" focusable="false">
        <path d="M50 87C43 80 10 58 10 31C10 14 31 7 43 20L50 28L57 20C69 7 90 14 90 31C90 58 57 80 50 87Z" />
      </svg>
    `,
  },
  stars: {
    className: "star",
    palette: ["#ffd54a", "#ffbf00", "#ffe98a", "#ffcf40"],
    interval: [560, 820],
    density: 50,
    minCount: 16,
    maxCount: 26,
    mobileFactor: 0.78,
    centerBias: 0.74,
    midRise: "-40vh",
    endRise: "-112vh",
    variants: [
      {
        className: "star-dust",
        weight: 58,
        size: [2, 5],
        duration: [22, 36],
        opacity: [0.16, 0.52],
        drift: [6, 24],
        sway: [7, 12],
        blur: [0, 0.45],
        glow: [3, 7],
        markup: '<span class="particle__shape particle__dot"></span>',
      },
      {
        className: "star-soft",
        weight: 18,
        size: [4, 10],
        duration: [25, 42],
        opacity: [0.12, 0.38],
        drift: [5, 19],
        sway: [9, 15],
        blur: [1.1, 2.8],
        glow: [8, 16],
        markup: '<span class="particle__shape particle__dot"></span>',
      },
      {
        className: "star-flare",
        weight: 19,
        size: [6, 15],
        duration: [18, 31],
        opacity: [0.24, 0.68],
        drift: [8, 28],
        sway: [6, 10],
        blur: [0, 0.25],
        glow: [7, 13],
        markup: '<span class="particle__shape particle__flare"></span>',
      },
      {
        className: "star-accent",
        weight: 5,
        size: [9, 18],
        duration: [20, 34],
        opacity: [0.3, 0.66],
        drift: [7, 24],
        sway: [7, 12],
        blur: [0, 0.2],
        glow: [8, 15],
        markup: `
          <svg class="particle__shape particle__accent-star" viewBox="0 0 100 100" focusable="false">
            <path d="M50 6C54 34 58 42 94 50C58 58 54 66 50 94C46 66 42 58 6 50C42 42 46 34 50 6Z" />
          </svg>
        `,
      },
    ],
  },
  fire: {
    className: "fire",
    palette: ["#ff2a1a", "#ff5a1f", "#ff8a00", "#ff3b1f", "#c90016"],
    interval: [620, 920],
    density: 62,
    minCount: 12,
    maxCount: 20,
    mobileFactor: 0.75,
    centerBias: 0.68,
    midRise: "-54vh",
    endRise: "-132vh",
    variants: [
      {
        className: "ember-dust",
        weight: 55,
        size: [2, 5],
        duration: [10, 18],
        opacity: [0.22, 0.66],
        drift: [7, 28],
        sway: [3.8, 7],
        blur: [0, 0.35],
        glow: [5, 10],
        markup: '<span class="particle__shape particle__ember-dot"></span>',
      },
      {
        className: "ember-soft",
        weight: 18,
        size: [5, 11],
        duration: [14, 23],
        opacity: [0.13, 0.42],
        drift: [8, 25],
        sway: [5, 9],
        blur: [1.4, 3.4],
        glow: [10, 20],
        markup: '<span class="particle__shape particle__ember-dot"></span>',
      },
      {
        className: "ember-streak",
        weight: 22,
        size: [7, 17],
        duration: [6.8, 11.5],
        opacity: [0.3, 0.76],
        drift: [10, 36],
        sway: [2.8, 5.5],
        blur: [0, 0.5],
        glow: [7, 14],
        markup: '<span class="particle__shape particle__ember-streak"></span>',
      },
      {
        className: "ember-haze",
        weight: 5,
        size: [16, 34],
        duration: [18, 29],
        opacity: [0.08, 0.2],
        drift: [5, 20],
        sway: [7, 12],
        blur: [4, 8],
        glow: [14, 24],
        markup: '<span class="particle__shape particle__ember-haze"></span>',
      },
    ],
  },
};

// 4. Animated particle generation
function getParticleLimit(config) {
  let regularCount = clamp(
    Math.round(window.innerWidth / config.density),
    config.minCount,
    config.maxCount,
  );

  if (window.innerWidth < 640 && config.mobileFactor) {
    regularCount = Math.max(6, Math.round(regularCount * config.mobileFactor));
  }

  return reducedMotion.matches ? Math.max(7, Math.round(regularCount * 0.52)) : regularCount;
}

function pickParticleVariant(config) {
  if (!config.variants?.length) return null;

  const totalWeight = config.variants.reduce((total, variant) => total + variant.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const variant of config.variants) {
    roll -= variant.weight;
    if (roll <= 0) return variant;
  }

  return config.variants.at(-1);
}

function getParticleLeft(config, requestedX) {
  if (typeof requestedX === "number") return clamp(requestedX, -3, 103);

  if (config.centerBias && Math.random() < config.centerBias) {
    return Math.random() < 0.5 ? randomBetween(2, 32) : randomBetween(68, 98);
  }

  return randomBetween(2, 98);
}

function createParticle({ initial = false, x } = {}) {
  const config = backgroundModes[state.background];
  const variant = pickParticleVariant(config);
  const settings = variant ? { ...config, ...variant } : config;
  const limit = getParticleLimit(config);

  if (dom.particles.children.length >= limit + 4) return;

  const particle = document.createElement("span");
  const durationMultiplier = reducedMotion.matches ? 1.65 : 1;
  const duration = randomBetween(...settings.duration) * durationMultiplier;
  const size = randomBetween(...settings.size);
  const left = getParticleLeft(config, x);
  const drift = settings.drift || [10, state.background === "fire" ? 34 : 54];
  const sway = settings.sway || [3.4, 6.4];
  const blur = settings.blur || [0, 0];
  const glow = settings.glow || [7, 7];
  const tilt = settings.tilt || (state.background === "hearts" ? [2, 8] : [1, state.background === "stars" ? 10 : 7]);

  particle.className = `particle particle--${config.className}${variant ? ` particle--${variant.className}` : ""}`;
  particle.innerHTML = settings.markup || config.svg;
  particle.style.setProperty("--size", `${size}px`);
  particle.style.setProperty("--left", `${left}%`);
  particle.style.setProperty("--duration", `${duration}s`);
  particle.style.setProperty("--mid-rise", settings.midRise || "-56vh");
  particle.style.setProperty("--end-rise", settings.endRise || "-128vh");
  particle.style.setProperty(
    "--delay",
    initial ? `${randomBetween(-duration, -0.25)}s` : "0s",
  );
  particle.style.setProperty("--drift", `${randomBetween(...drift)}px`);
  particle.style.setProperty("--tilt", `${randomBetween(...tilt)}deg`);
  particle.style.setProperty("--sway-duration", `${randomBetween(...sway)}s`);
  particle.style.setProperty("--sway-delay", `${randomBetween(-6, 0)}s`);
  particle.style.setProperty("--opacity", randomBetween(...settings.opacity).toFixed(2));
  particle.style.setProperty("--color", randomItem(settings.palette || config.palette));
  particle.style.setProperty("--blur", `${randomBetween(...blur)}px`);
  particle.style.setProperty("--glow", `${randomBetween(...glow)}px`);
  particle.style.setProperty("--twinkle-duration", `${randomBetween(4.8, 9.5)}s`);
  particle.style.setProperty("--twinkle-delay", `${randomBetween(-9, 0)}s`);
  particle.style.setProperty("--flicker-duration", `${randomBetween(1.8, 4.2)}s`);
  particle.style.setProperty("--flicker-delay", `${randomBetween(-4, 0)}s`);

  dom.particles.append(particle);
  particle.addEventListener("animationend", () => particle.remove(), { once: true });
}

function fillBackground() {
  const count = getParticleLimit(backgroundModes[state.background]);

  for (let index = 0; index < count; index += 1) {
    createParticle({ initial: true });
  }
}

function stopParticleStream() {
  window.clearTimeout(state.particleTimer);
  state.particleTimer = null;
}

function queueNextParticle() {
  stopParticleStream();
  if (document.hidden) return;

  const config = backgroundModes[state.background];
  const intervalMultiplier = reducedMotion.matches ? 1.8 : 1;
  const delay = randomBetween(...config.interval) * intervalMultiplier;

  state.particleTimer = window.setTimeout(() => {
    if (!document.hidden) {
      requestAnimationFrame(() => createParticle());
      queueNextParticle();
    }
  }, delay);
}

function changeBackground(mode, { persist = true, force = false } = {}) {
  if (state.mode === "view" && !force) return;
  if (!validBackgrounds.has(mode)) mode = "hearts";

  stopParticleStream();
  state.background = mode;
  dom.body.dataset.background = mode;
  dom.particles.replaceChildren();

  dom.backgroundInputs.forEach((input) => {
    input.checked = input.value === mode;
    input.closest(".background-option")?.classList.toggle("is-selected", input.checked);
  });

  fillBackground();
  queueNextParticle();

  if (persist) {
    storage.set(storageKeys.background, mode);
    invalidateGeneratedLink();
  }
}

// 5. Editor panel controls
function openEditor({ focus = false } = {}) {
  if (state.mode === "view") return;
  dom.body.classList.add("editor-open");
  dom.body.classList.remove("preview-mode");
  dom.panel.setAttribute("aria-hidden", "false");
  dom.editorFab.setAttribute("aria-expanded", "true");
  if (focus) dom.closeEditor.focus({ preventScroll: true });
}

function closeEditor({ returnFocus = false } = {}) {
  dom.body.classList.remove("editor-open");
  dom.panel.setAttribute("aria-hidden", "true");
  dom.editorFab.setAttribute("aria-expanded", "false");
  if (returnFocus && dom.editorFab.offsetParent !== null) {
    dom.editorFab.focus({ preventScroll: true });
  }
}

function enterPreview() {
  if (state.mode === "view") return;
  closeEditor();
  dom.body.classList.add("preview-mode");
  showToast("Card preview");
}

function openResetModal() {
  if (state.mode === "view") return;
  dom.resetModal.classList.add("is-open");
  dom.resetModal.setAttribute("aria-hidden", "false");
  dom.confirmReset.focus({ preventScroll: true });
}

function closeResetModal() {
  dom.resetModal.classList.remove("is-open");
  dom.resetModal.setAttribute("aria-hidden", "true");
}

// 6. Shake detection
function enableMotionListener() {
  if (state.mode === "view" || state.motionListenerEnabled || !("DeviceMotionEvent" in window)) return;
  window.addEventListener("devicemotion", handleDeviceMotion, { passive: true });
  state.motionListenerEnabled = true;
}

function handleDeviceMotion(event) {
  const now = performance.now();
  if (now - state.motionLastSample < 90) return;
  state.motionLastSample = now;

  const acceleration = event.acceleration || event.accelerationIncludingGravity;
  if (!acceleration) return;

  const current = {
    x: Number(acceleration.x) || 0,
    y: Number(acceleration.y) || 0,
    z: Number(acceleration.z) || 0,
  };

  if (!state.lastAcceleration) {
    state.lastAcceleration = current;
    return;
  }

  const deltaX = current.x - state.lastAcceleration.x;
  const deltaY = current.y - state.lastAcceleration.y;
  const deltaZ = current.z - state.lastAcceleration.z;
  const shakeStrength = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);
  state.lastAcceleration = current;

  if (shakeStrength < 24 || now - state.lastShakeAt < 1500) return;

  state.lastShakeAt = now;
  if (state.mode === "editor" && !dom.body.classList.contains("editor-open")) openEditor();
}

async function requestMotionPermission() {
  try {
    const permission = await DeviceMotionEvent.requestPermission();

    if (permission === "granted") {
      storage.set(storageKeys.shakePermission, "granted");
      dom.motionPermission.hidden = true;
      enableMotionListener();
      showToast("Shake controls enabled");
    } else {
      storage.set(storageKeys.shakePermission, "denied");
      showToast("Motion access was denied — use the button on the left");
    }
  } catch (error) {
    console.warn("Could not request motion access", error);
    showToast("Could not enable shake controls — use the button on the left");
  }
}

function initializeMotionControl() {
  if (state.mode === "view" || !("DeviceMotionEvent" in window)) return;

  const needsPermission = typeof DeviceMotionEvent.requestPermission === "function";
  const savedPermission = storage.get(storageKeys.shakePermission);

  if (needsPermission && savedPermission !== "granted") {
    dom.motionPermission.hidden = false;
    return;
  }

  enableMotionListener();
}

// 7. Live text editor
function updateTextCounter() {
  dom.textCounter.textContent = `${dom.textInput.value.length} / ${MAX_TEXT_LENGTH}`;
}

function renderPlainText(value, { persist = true } = {}) {
  if (state.mode === "view") return;
  const safeValue = String(value ?? "").slice(0, MAX_TEXT_LENGTH);
  dom.cardText.textContent = safeValue || "\u00a0";
  dom.cardText.dataset.empty = safeValue ? "false" : "true";
  dom.textInput.value = safeValue;
  state.selectedOffsets = null;
  updateTextCounter();
  updateSelectionHint();

  if (persist) {
    storage.set(storageKeys.text, safeValue);
    storage.set(storageKeys.markup, dom.cardText.innerHTML);
    invalidateGeneratedLink();
  }
}

function isValidColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "");
}

function sanitizeStoredMarkup(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup;
  const safeFragment = document.createDocumentFragment();

  function copyNode(node, parent, inheritedStyle = null) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.nodeValue || ""));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    if (node.tagName === "BR") {
      parent.append(document.createTextNode("\n"));
      return;
    }

    let nextStyle = inheritedStyle;
    if (node.tagName === "SPAN" && node.classList.contains("custom-highlight")) {
      const color = isValidColor(node.dataset.color) ? node.dataset.color : DEFAULT_COLOR;
      nextStyle = { color, glow: node.dataset.glow === "true" };
    }

    const target = nextStyle
      ? createHighlightSpan(nextStyle.color, nextStyle.glow)
      : document.createDocumentFragment();

    [...node.childNodes].forEach((child) => copyNode(child, target, nextStyle));
    parent.append(target);
  }

  [...template.content.childNodes].forEach((node) => copyNode(node, safeFragment));
  return safeFragment;
}

// 8. Selection formatting
function createHighlightSpan(color, glow) {
  const span = document.createElement("span");
  span.className = "custom-highlight";
  span.dataset.color = color;
  span.dataset.glow = String(Boolean(glow));
  span.style.setProperty("--highlight-color", color);
  return span;
}

function rangeBelongsToCard(range) {
  return (
    dom.cardText.contains(range.startContainer) &&
    dom.cardText.contains(range.endContainer) &&
    !range.collapsed
  );
}

function rangeToOffsets(range) {
  const prefix = range.cloneRange();
  prefix.selectNodeContents(dom.cardText);
  prefix.setEnd(range.startContainer, range.startOffset);
  const start = prefix.toString().length;
  return { start, end: start + range.toString().length };
}

function captureCardSelection() {
  if (state.mode === "view") return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!rangeBelongsToCard(range)) return;

  const offsets = rangeToOffsets(range);
  if (offsets.end <= offsets.start) return;

  state.selectedOffsets = offsets;
  updateSelectionHint();
}

function updateSelectionHint(message) {
  if (message) {
    dom.selectionHint.textContent = message;
    dom.selectionHint.classList.remove("is-active");
    return;
  }

  const selectionLength = state.selectedOffsets
    ? state.selectedOffsets.end - state.selectedOffsets.start
    : 0;

  if (selectionLength > 0) {
    dom.selectionHint.textContent = `Selected characters: ${selectionLength}`;
    dom.selectionHint.classList.add("is-active");
  } else {
    dom.selectionHint.textContent = "Select part of the card text, then choose a style.";
    dom.selectionHint.classList.remove("is-active");
  }
}

function readStyledCharacters() {
  const characters = [];

  function walk(node, inheritedStyle = null) {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const character of node.nodeValue || "") {
        characters.push({ character, style: inheritedStyle ? { ...inheritedStyle } : null });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    let nextStyle = inheritedStyle;
    if (node.classList.contains("custom-highlight")) {
      nextStyle = {
        color: isValidColor(node.dataset.color) ? node.dataset.color : DEFAULT_COLOR,
        glow: node.dataset.glow === "true",
      };
    }

    [...node.childNodes].forEach((child) => walk(child, nextStyle));
  }

  [...dom.cardText.childNodes].forEach((node) => walk(node));
  return characters;
}

function stylesMatch(first, second) {
  if (!first && !second) return true;
  if (!first || !second) return false;
  return first.color === second.color && first.glow === second.glow;
}

function renderStyledCharacters(characters) {
  const fragment = document.createDocumentFragment();
  let index = 0;

  while (index < characters.length) {
    const style = characters[index].style;
    let text = characters[index].character;
    let nextIndex = index + 1;

    while (nextIndex < characters.length && stylesMatch(style, characters[nextIndex].style)) {
      text += characters[nextIndex].character;
      nextIndex += 1;
    }

    if (style) {
      const span = createHighlightSpan(style.color, style.glow);
      span.textContent = text;
      fragment.append(span);
    } else {
      fragment.append(document.createTextNode(text));
    }

    index = nextIndex;
  }

  dom.cardText.replaceChildren(fragment);
}

function findTextPoint(offset) {
  const walker = document.createTreeWalker(dom.cardText, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let lastNode = null;

  while (walker.nextNode()) {
    lastNode = walker.currentNode;
    const length = lastNode.nodeValue.length;
    if (remaining <= length) return { node: lastNode, offset: remaining };
    remaining -= length;
  }

  return lastNode
    ? { node: lastNode, offset: lastNode.nodeValue.length }
    : { node: dom.cardText, offset: 0 };
}

function restoreSelection(offsets) {
  const start = findTextPoint(offsets.start);
  const end = findTextPoint(offsets.end);
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  state.selectedOffsets = { ...offsets };
}

function applySelectionFormatting(type, value) {
  if (state.mode === "view") return;
  const offsets = state.selectedOffsets;
  const characters = readStyledCharacters();

  if (!offsets || offsets.end <= offsets.start || offsets.end > characters.length) {
    updateSelectionHint("Select part of the text first");
    showToast("Select part of the text first");
    return;
  }

  for (let index = offsets.start; index < offsets.end; index += 1) {
    const existingStyle = characters[index].style;

    if (type === "reset") {
      characters[index].style = null;
    } else if (type === "color") {
      characters[index].style = {
        color: value,
        glow: existingStyle ? existingStyle.glow : state.glow,
      };
    } else if (type === "glow") {
      characters[index].style = {
        color: existingStyle?.color || state.color,
        glow: Boolean(value),
      };
    }
  }

  renderStyledCharacters(characters);
  restoreSelection(offsets);
  persistTextState();
  invalidateGeneratedLink();
  updateSelectionHint();
}

function setActiveColor(color, { apply = true } = {}) {
  if (!isValidColor(color)) return;

  state.color = color.toLowerCase();
  dom.colorInput.value = state.color;
  dom.colorPresets.forEach((preset) => {
    preset.classList.toggle("is-selected", preset.dataset.color.toLowerCase() === state.color);
  });
  storage.set(storageKeys.color, state.color);

  if (apply) applySelectionFormatting("color", state.color);
}

// 9. localStorage
const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage is unavailable", error);
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (error) {
      console.warn("Could not save a setting", error);
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("Could not remove a setting", error);
    }
  },
};

function persistTextState() {
  const text = dom.cardText.textContent === "\u00a0" ? "" : dom.cardText.textContent;
  dom.textInput.value = text;
  updateTextCounter();
  storage.set(storageKeys.text, text);
  storage.set(storageKeys.markup, dom.cardText.innerHTML);
}

function restoreSettings() {
  const storedBackground = storage.get(storageKeys.background);
  const storedText = storage.get(storageKeys.text);
  const storedMarkup = storage.get(storageKeys.markup);
  const storedColor = storage.get(storageKeys.color);
  const storedGlow = storage.get(storageKeys.glow);

  if (isValidColor(storedColor)) state.color = storedColor.toLowerCase();
  state.glow = storedGlow === null ? true : storedGlow === "true";
  setActiveColor(state.color, { apply: false });

  const text = storedText ?? DEFAULT_TEXT;
  dom.textInput.value = text;

  if (storedMarkup) {
    const safeMarkup = sanitizeStoredMarkup(storedMarkup);
    dom.cardText.replaceChildren(safeMarkup);

    if (dom.cardText.textContent !== text) {
      renderPlainText(text, { persist: false });
    }
  } else {
    renderPlainText(text, { persist: false });
  }

  updateTextCounter();
  changeBackground(validBackgrounds.has(storedBackground) ? storedBackground : "hearts", {
    persist: false,
  });
}

function resetEverything() {
  if (state.mode === "view") return;
  Object.values(storageKeys).forEach((key) => storage.remove(key));
  state.color = DEFAULT_COLOR;
  state.glow = true;
  state.selectedOffsets = null;
  setActiveColor(DEFAULT_COLOR, { apply: false });
  renderPlainText(DEFAULT_TEXT, { persist: false });
  changeBackground("hearts", { persist: false });
  closeResetModal();
  closeEditor();
  invalidateGeneratedLink();
  showToast("Card reset");
}

// 10. Link creation and sharing
function invalidateGeneratedLink() {
  state.generatedUrl = null;
  dom.generatedLink.value = "";
  dom.linkResult.hidden = true;
}

function collectCardContent() {
  const characters = readStyledCharacters();
  const content = [];
  let index = 0;

  while (index < characters.length) {
    const style = characters[index].style || {
      color: DEFAULT_TEXT_COLOR,
      glow: false,
    };
    let text = characters[index].character;
    let nextIndex = index + 1;

    while (
      nextIndex < characters.length &&
      stylesMatch(characters[nextIndex].style, characters[index].style) &&
      text.length < MAX_FRAGMENT_LENGTH
    ) {
      text += characters[nextIndex].character;
      nextIndex += 1;
    }

    content.push({ text, color: style.color, glow: Boolean(style.glow) });
    index = nextIndex;
  }

  if (content.length > MAX_FRAGMENTS) {
    throw new Error("The card contains too many separately styled fragments");
  }

  return content;
}

function collectCardState() {
  const content = collectCardContent();
  const fullText = content.map((fragment) => fragment.text).join("");

  if (!fullText.trim()) throw new Error("EMPTY_TEXT");
  if (fullText.length > MAX_TEXT_LENGTH) throw new Error("TEXT_TOO_LONG");

  return {
    version: CARD_VERSION,
    background: state.background,
    content,
  };
}

function sanitizeCardState(value) {
  if (!value || typeof value !== "object" || value.version !== CARD_VERSION) return null;
  if (!Array.isArray(value.content) || value.content.length === 0) return null;
  if (value.content.length > MAX_FRAGMENTS) return null;

  const background = validBackgrounds.has(value.background) ? value.background : "hearts";
  const content = [];
  let totalLength = 0;

  for (const fragment of value.content) {
    if (!fragment || typeof fragment !== "object" || typeof fragment.text !== "string") {
      return null;
    }

    if (fragment.text.length > MAX_FRAGMENT_LENGTH) return null;
    totalLength += fragment.text.length;
    if (totalLength > MAX_TEXT_LENGTH) return null;

    if (!fragment.text) continue;
    content.push({
      text: fragment.text,
      color: isValidColor(fragment.color) ? fragment.color.toLowerCase() : DEFAULT_TEXT_COLOR,
      glow: fragment.glow === true,
    });
  }

  if (!content.length || !content.map((fragment) => fragment.text).join("").trim()) return null;
  return { version: CARD_VERSION, background, content };
}

function getDefaultSharedCard() {
  return {
    version: CARD_VERSION,
    background: "hearts",
    content: [{ text: DEFAULT_TEXT, color: DEFAULT_TEXT_COLOR, glow: false }],
  };
}

function renderSharedContent(content) {
  const fragment = document.createDocumentFragment();

  content.forEach((part) => {
    if (part.color === DEFAULT_TEXT_COLOR && !part.glow) {
      fragment.append(document.createTextNode(part.text));
      return;
    }

    const span = createHighlightSpan(part.color, part.glow);
    span.textContent = part.text;
    fragment.append(span);
  });

  dom.cardText.replaceChildren(fragment);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encodeCardState(cardState) {
  const json = JSON.stringify(cardState);
  const source = new TextEncoder().encode(json);

  if (typeof CompressionStream === "function") {
    try {
      const stream = new Blob([source]).stream().pipeThrough(new CompressionStream("deflate"));
      const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
      return `z.${bytesToBase64Url(compressed)}`;
    } catch (error) {
      console.warn("Compression is unavailable; using a safe uncompressed link", error);
    }
  }

  return `j.${bytesToBase64Url(source)}`;
}

async function readStreamWithLimit(stream, limit = MAX_SERIALIZED_BYTES) {
  const reader = stream.getReader();
  const chunks = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalLength += value.byteLength;

    if (totalLength > limit) {
      await reader.cancel();
      throw new Error("Decoded card data is too large");
    }

    chunks.push(value);
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return result;
}

async function decodeCardState(encodedState) {
  if (typeof encodedState !== "string" || encodedState.length > 16000) return null;
  const separator = encodedState.indexOf(".");
  if (separator !== 1) return null;

  const format = encodedState.slice(0, separator);
  const bytes = base64UrlToBytes(encodedState.slice(separator + 1));
  if (bytes.byteLength > MAX_SERIALIZED_BYTES) return null;
  let decodedBytes = bytes;

  if (format === "z") {
    if (typeof DecompressionStream !== "function") return null;
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    decodedBytes = await readStreamWithLimit(stream);
  } else if (format !== "j") {
    return null;
  }

  const json = new TextDecoder("utf-8", { fatal: true }).decode(decodedBytes);
  return sanitizeCardState(JSON.parse(json));
}

async function readSharedCardFromHash() {
  if (!window.location.hash.startsWith("#card=")) return { present: false, card: null };

  try {
    const encodedState = window.location.hash.slice("#card=".length);
    const card = await decodeCardState(encodedState);
    return { present: true, card };
  } catch (error) {
    console.warn("The card link is invalid", error);
    return { present: true, card: null };
  }
}

function enterViewMode(cardState) {
  const safeCard = sanitizeCardState(cardState) || getDefaultSharedCard();
  state.mode = "view";
  state.selectedOffsets = null;
  dom.body.dataset.mode = "view";
  dom.body.classList.remove("editor-open", "preview-mode");
  dom.panel.setAttribute("aria-hidden", "true");
  dom.editorFab.setAttribute("aria-expanded", "false");
  dom.motionPermission.hidden = true;
  renderSharedContent(safeCard.content);
  changeBackground(safeCard.background, { persist: false, force: true });
  document.title = "A card for you";
}

function isPublicLocation() {
  if (!/^https?:$/.test(window.location.protocol)) return false;
  const hostname = window.location.hostname.toLowerCase();
  return !["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"].includes(hostname);
}

async function createCardLink({ notify = true } = {}) {
  if (state.mode === "view") return null;
  if (!isPublicLocation()) {
    showToast("Publish the site before creating a link");
    return null;
  }

  try {
    const cardState = collectCardState();
    const encodedState = await encodeCardState(cardState);
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const generatedUrl = `${baseUrl}#card=${encodedState}`;

    state.generatedUrl = generatedUrl;
    dom.generatedLink.value = generatedUrl;
    dom.linkResult.hidden = false;
    if (notify) showToast("Link created");
    return generatedUrl;
  } catch (error) {
    if (error?.message === "EMPTY_TEXT") showToast("Add some text first");
    else {
      console.error("Could not create the card link", error);
      showToast("Could not create link");
    }
    return null;
  }
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = value;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";
  document.body.append(temporaryInput);
  temporaryInput.select();
  const copied = document.execCommand("copy");
  temporaryInput.remove();
  if (!copied) throw new Error("Clipboard access is unavailable");
}

async function copyCardLink() {
  if (state.mode === "view") return;
  const generatedUrl = state.generatedUrl || (await createCardLink({ notify: false }));
  if (!generatedUrl) return;

  try {
    await copyText(generatedUrl);
    showToast("Link copied");
  } catch (error) {
    console.error("Could not copy the link", error);
    showToast("Could not copy link");
  }
}

async function shareCardLink() {
  if (state.mode === "view") return;
  const generatedUrl = state.generatedUrl || (await createCardLink({ notify: false }));
  if (!generatedUrl) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "A card for you",
        text: "Someone made an animated card for you ✨",
        url: generatedUrl,
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Could not share the link", error);
        showToast("Could not share link");
      }
    }
    return;
  }

  try {
    await copyText(generatedUrl);
    showToast("Link copied. You can send it now.", 3800);
  } catch (error) {
    console.error("Could not copy the link", error);
    showToast("Could not share link");
  }
}

function openGeneratedCard() {
  if (state.mode === "view" || !state.generatedUrl) return;
  window.open(state.generatedUrl, "_blank", "noopener,noreferrer");
}

// Toast notifications
function showToast(message, duration = 2800) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  dom.toastRegion.append(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);
}

// 11. Event handlers
dom.edgeTrigger.addEventListener("pointerenter", () => {
  if (finePointer.matches) openEditor();
});

dom.editorFab.addEventListener("click", () => openEditor({ focus: true }));
dom.closeEditor.addEventListener("click", () => closeEditor({ returnFocus: true }));
dom.backdrop.addEventListener("click", () => closeEditor());
dom.motionPermission.addEventListener("click", requestMotionPermission);

dom.backgroundInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) changeBackground(input.value);
  });
});

dom.textInput.addEventListener("input", () => renderPlainText(dom.textInput.value));

document.addEventListener("selectionchange", captureCardSelection);
dom.cardText.addEventListener("pointerup", captureCardSelection);
dom.cardText.addEventListener("keyup", captureCardSelection);

dom.colorInput.addEventListener("input", () => setActiveColor(dom.colorInput.value));
dom.colorPresets.forEach((preset) => {
  preset.addEventListener("click", () => setActiveColor(preset.dataset.color));
});

dom.glowOn.addEventListener("click", () => {
  state.glow = true;
  storage.set(storageKeys.glow, "true");
  applySelectionFormatting("glow", true);
});

dom.glowOff.addEventListener("click", () => {
  state.glow = false;
  storage.set(storageKeys.glow, "false");
  applySelectionFormatting("glow", false);
});

dom.formatReset.addEventListener("click", () => applySelectionFormatting("reset"));
dom.copyLink.addEventListener("click", copyCardLink);
dom.resetAll.addEventListener("click", openResetModal);
dom.confirmReset.addEventListener("click", resetEverything);
dom.modalCloseButtons.forEach((button) => button.addEventListener("click", closeResetModal));

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (dom.resetModal.classList.contains("is-open")) closeResetModal();
  else if (dom.body.classList.contains("editor-open")) closeEditor();
});

dom.scene.addEventListener("pointerdown", (event) => {
  if (state.mode === "view") return;
  if (event.button !== undefined && event.button !== 0) return;
  const x = (event.clientX / window.innerWidth) * 100;

  for (let index = 0; index < 2; index += 1) {
    window.setTimeout(() => createParticle({ x: x + randomBetween(-3, 3) }), index * 90);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopParticleStream();
  else queueNextParticle();
});

const handleReducedMotionChange = () =>
  changeBackground(state.background, { persist: false, force: state.mode === "view" });
if (typeof reducedMotion.addEventListener === "function") {
  reducedMotion.addEventListener("change", handleReducedMotionChange);
} else {
  reducedMotion.addListener(handleReducedMotionChange);
}

window.addEventListener("resize", () => {
  if (dom.particles.children.length > getParticleLimit(backgroundModes[state.background]) + 4) {
    changeBackground(state.background, { persist: false, force: state.mode === "view" });
  }
});

// 12. Application initialization
async function initializeApplication() {
  const sharedCard = await readSharedCardFromHash();

  if (sharedCard.present) {
    enterViewMode(sharedCard.card || getDefaultSharedCard());
    return;
  }

  state.mode = "editor";
  dom.body.dataset.mode = "editor";
  restoreSettings();
  initializeMotionControl();
  updateSelectionHint();
}

initializeApplication().catch((error) => {
  console.error("Could not initialize the card", error);
  enterViewMode(getDefaultSharedCard());
});
