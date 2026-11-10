const MODULE_ID = "token-aura-rings-5e";
const RING_NAME = "tokenAuraRings5e";
const MIST_TEXTURE_SIZE = 288;
const MIST_FRAME_COUNT = 96;
const MIST_FRAME_DURATION = 50;
const DEFAULT_RADIUS = 10;

let mistFramesPromise;
let animationFrameId = null;
const animatedRings = new Set();

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "characterSettings", {
    scope: "client",
    config: false,
    type: Object,
    default: {},
    onChange: refreshAll
  });

  game.modules.get(MODULE_ID).api = {
    refresh: refreshAll,
    openSettings: openPlayerSettings
  };
});

Hooks.on("canvasReady", refreshAll);
Hooks.on("refreshToken", refreshTokenRing);
Hooks.on("createToken", refreshAll);
Hooks.on("deleteToken", refreshAll);
Hooks.on("updateToken", refreshAll);
Hooks.on("renderTokenHUD", addPlayerSettingsButton);

function addPlayerSettingsButton(hud, html) {
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector(".token-aura-rings-settings-button")) return;

  const token = hud.object ?? hud.document?.object ?? canvas.tokens.get(hud.document?.id);
  const actor = token?.actor ?? hud.document?.actor;
  if (!actor?.testUserPermission(game.user, "OWNER")) return;

  const container = root.querySelector(".col.right") ?? root.querySelector(".col.left");
  if (!container) return;

  const button = document.createElement("div");
  button.className = "control-icon token-aura-rings-settings-button";
  button.dataset.tooltip = "Aura Ring Settings";
  button.setAttribute("aria-label", "Aura Ring Settings");
  button.innerHTML = '<i class="fa-solid fa-wand-sparkles"></i>';
  button.addEventListener("click", () => openPlayerSettings(actor));
  container.append(button);
}

function refreshAll() {
  if (!canvas?.ready) return;
  for (const token of canvas.tokens.placeables) refreshTokenRing(token);
}

async function refreshTokenRing(token) {
  if (!canvas?.ready || !token) return;
  let actor = token.actor;
  let settings = actor ? getCharacterSettings(actor) : null;
  let existing = token[RING_NAME];

  if (!settings?.enabled || !token.isVisible) {
    if (existing) destroyTokenRing(token, existing);
    return;
  }

  const frames = await getMistFrames();
  if (!canvas?.ready || !token.actor || !token.isVisible) {
    existing = token[RING_NAME];
    if (existing) destroyTokenRing(token, existing);
    return;
  }
  actor = token.actor;
  settings = getCharacterSettings(actor);
  if (!settings.enabled) {
    existing = token[RING_NAME];
    if (existing) destroyTokenRing(token, existing);
    return;
  }

  const dimensions = canvas.dimensions;
  const gridSize = dimensions.size;
  const unitSize = dimensions.distance || 5;
  const radius = (settings.radius / unitSize) * gridSize;
  existing = token[RING_NAME];
  const ring = existing ?? new PIXI.Sprite(frames[0]);
  const spriteRadiusRatio = 0.46;
  const spriteSize = radius / spriteRadiusRatio;

  ring.scale.set(spriteSize / MIST_TEXTURE_SIZE);
  ring.anchor.set(0.5);
  ring.tint = normalizeColor(settings.color);
  ring.alpha = 0.92;
  ring.eventMode = "none";
  ring.position.set(token.w / 2, token.h / 2);

  if (!existing) {
    token.addChild(ring);
    token[RING_NAME] = ring;
    startTokenRingAnimation(ring, frames);
  }
}

function startTokenRingAnimation(ring, frames) {
  ring._tokenAuraFrames = frames;
  ring._tokenAuraStartedAt = performance.now();
  ring._tokenAuraLastFrame = 0;
  animatedRings.add(ring);
  if (animationFrameId === null) animationFrameId = requestAnimationFrame(animateTokenRings);
}

function animateTokenRings(now) {
  for (const ring of animatedRings) {
    const elapsed = now - ring._tokenAuraStartedAt;
    const frameIndex = Math.floor(elapsed / MIST_FRAME_DURATION) % ring._tokenAuraFrames.length;
    if (frameIndex !== ring._tokenAuraLastFrame) {
      ring.texture = ring._tokenAuraFrames[frameIndex];
      ring._tokenAuraLastFrame = frameIndex;
    }
  }

  if (animatedRings.size > 0) {
    animationFrameId = requestAnimationFrame(animateTokenRings);
  } else {
    animationFrameId = null;
  }
}

function destroyTokenRing(token, ring) {
  animatedRings.delete(ring);
  if (animatedRings.size === 0 && animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (ring.parent) ring.parent.removeChild(ring);
  ring.destroy();
  if (token[RING_NAME] === ring) delete token[RING_NAME];
}

function getMistFrames() {
  if (mistFramesPromise) return mistFramesPromise;
  mistFramesPromise = createMistFrames();
  return mistFramesPromise;
}

async function createMistFrames() {
  const image = new Image();
  image.src = `modules/${MODULE_ID}/assets/aura-mist-ring.png`;
  await image.decode();

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = MIST_TEXTURE_SIZE;
  sourceCanvas.height = MIST_TEXTURE_SIZE;
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0, MIST_TEXTURE_SIZE, MIST_TEXTURE_SIZE);
  const sourcePixels = sourceContext.getImageData(0, 0, MIST_TEXTURE_SIZE, MIST_TEXTURE_SIZE).data;
  const center = (MIST_TEXTURE_SIZE - 1) / 2;

  return Array.from({ length: MIST_FRAME_COUNT }, (_, frameIndex) => {
    const canvasFrame = document.createElement("canvas");
    canvasFrame.width = MIST_TEXTURE_SIZE;
    canvasFrame.height = MIST_TEXTURE_SIZE;
    const context = canvasFrame.getContext("2d");
    const framePixels = context.createImageData(MIST_TEXTURE_SIZE, MIST_TEXTURE_SIZE);
    const progress = frameIndex / MIST_FRAME_COUNT;
    const basePhase = progress * Math.PI * 2;
    const phase = basePhase + 0.28 * Math.sin(basePhase) + 0.08 * Math.sin(basePhase * 2 + 0.6);

    for (let y = 0; y < MIST_TEXTURE_SIZE; y += 1) {
      const dy = y - center;
      for (let x = 0; x < MIST_TEXTURE_SIZE; x += 1) {
        const dx = x - center;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const swirl = 0.12 * Math.sin(angle * 5 - phase * 2 + (distance / center) * 10);
        const sourceAngle = angle + phase + swirl;
        const sourceX = Math.round(center + Math.cos(sourceAngle) * distance);
        const sourceY = Math.round(center + Math.sin(sourceAngle) * distance);
        if (sourceX < 0 || sourceX >= MIST_TEXTURE_SIZE || sourceY < 0 || sourceY >= MIST_TEXTURE_SIZE) continue;

        const sourceOffset = (sourceY * MIST_TEXTURE_SIZE + sourceX) * 4;
        const targetOffset = (y * MIST_TEXTURE_SIZE + x) * 4;
        framePixels.data[targetOffset] = sourcePixels[sourceOffset];
        framePixels.data[targetOffset + 1] = sourcePixels[sourceOffset + 1];
        framePixels.data[targetOffset + 2] = sourcePixels[sourceOffset + 2];
        framePixels.data[targetOffset + 3] = sourcePixels[sourceOffset + 3];
      }
    }

    context.putImageData(framePixels, 0, 0);
    return PIXI.Texture.from(canvasFrame);
  });
}

function getCharacterSettings(actor) {
  const allSettings = game.settings.get(MODULE_ID, "characterSettings") ?? {};
  const key = actor.uuid ?? actor.id;
  const saved = allSettings[key] ?? {};
  return {
    enabled: saved.enabled === true,
    color: normalizeColorString(saved.color ?? "#f4d35e"),
    radius: normalizeRadius(saved.radius ?? DEFAULT_RADIUS)
  };
}

function openPlayerSettings(actor = canvas.tokens.controlled[0]?.actor) {
  if (!actor) {
    ui.notifications.warn("Open the Aura Ring Settings from a token HUD, or select a token first.");
    return;
  }

  const current = getCharacterSettings(actor);
  new Dialog({
    title: "Aura Ring Settings",
    content: `<form class="token-aura-rings-settings">
      <div class="form-group">
        <label for="tar5e-enabled">Show this character's aura ring</label>
        <div class="form-fields"><input id="tar5e-enabled" type="checkbox" ${current.enabled ? "checked" : ""}></div>
      </div>
      <div class="form-group">
        <label for="tar5e-color">Ring color</label>
        <div class="form-fields"><input id="tar5e-color" type="color" value="${current.color}"></div>
      </div>
      <div class="form-group">
        <label for="tar5e-radius">Radius (feet)</label>
        <div class="form-fields"><input id="tar5e-radius" type="number" min="1" max="500" step="1" value="${current.radius}"></div>
      </div>
      <p class="notes">The radius is measured from the center of the token. Diameter is twice the radius.</p>
    </form>`,
    buttons: {
      save: {
        label: "Save",
        callback: async (html) => {
          const allSettings = { ...(game.settings.get(MODULE_ID, "characterSettings") ?? {}) };
          allSettings[actor.uuid ?? actor.id] = {
            enabled: html.find("#tar5e-enabled").prop("checked"),
            color: normalizeColorString(html.find("#tar5e-color").val()),
            radius: normalizeRadius(html.find("#tar5e-radius").val())
          };
          await game.settings.set(MODULE_ID, "characterSettings", allSettings);
          refreshAll();
        }
      },
      cancel: { label: "Cancel" }
    },
    default: "save"
  }).render(true);
}

function normalizeColorString(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value ?? "")) ? String(value) : "#f4d35e";
}

function normalizeColor(value) {
  return Number.parseInt(normalizeColorString(value).slice(1), 16);
}

function normalizeRadius(value) {
  const radius = Number(value);
  return Number.isFinite(radius) ? Math.min(500, Math.max(1, radius)) : DEFAULT_RADIUS;
}
