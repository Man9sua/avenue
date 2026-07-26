const heartsLayer = document.querySelector(".hearts");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const palette = ["#ff1685", "#ff3d9d", "#ff006e", "#e93a91", "#ff5bac"];
const randomBetween = (min, max) => Math.random() * (max - min) + min;

function createHeart({ initial = false, x } = {}) {
  const heart = document.createElement("span");
  const size = randomBetween(14, 66);
  const duration = randomBetween(7.5, 14);
  const left = x ?? randomBetween(2, 98);

  heart.className = "heart";
  heart.innerHTML = `
    <svg viewBox="0 0 100 94" focusable="false">
      <path d="M50 87C43 80 10 58 10 31C10 14 31 7 43 20L50 28L57 20C69 7 90 14 90 31C90 58 57 80 50 87Z" />
    </svg>
  `;
  heart.style.setProperty("--size", `${size}px`);
  heart.style.setProperty("--left", `${left}%`);
  heart.style.setProperty("--duration", `${duration}s`);
  heart.style.setProperty(
    "--delay",
    initial ? `${randomBetween(-duration, -0.2)}s` : "0s",
  );
  heart.style.setProperty("--drift", `${randomBetween(-90, 90)}px`);
  heart.style.setProperty("--tilt", `${randomBetween(38, 52)}deg`);
  heart.style.setProperty("--opacity", randomBetween(0.38, 0.94).toFixed(2));
  heart.style.setProperty(
    "--color",
    palette[Math.floor(Math.random() * palette.length)],
  );

  heartsLayer.append(heart);
  heart.addEventListener("animationend", () => heart.remove(), { once: true });
}

function fillScene() {
  const count = Math.min(34, Math.max(18, Math.round(window.innerWidth / 45)));

  for (let index = 0; index < count; index += 1) {
    createHeart({ initial: true });
  }
}

fillScene();

let stream = window.setInterval(() => createHeart(), 520);

reduceMotion.addEventListener("change", (event) => {
  window.clearInterval(stream);

  if (!event.matches) {
    stream = window.setInterval(() => createHeart(), 520);
  }
});

document.addEventListener("pointerdown", (event) => {
  if (reduceMotion.matches) return;

  const x = (event.clientX / window.innerWidth) * 100;

  for (let index = 0; index < 4; index += 1) {
    window.setTimeout(
      () => createHeart({ x: x + randomBetween(-4, 4) }),
      index * 70,
    );
  }
});
