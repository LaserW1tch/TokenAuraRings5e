# LaserW1tch's Token Aura Rings 5e

A Foundry VTT module for manually configured, player-facing aura rings. Rings follow tokens with a slow swirling mist animation and show a visual boundary only; they do not create measured templates or activate game rules.

## Requirements

- Foundry VTT 13 or newer (verified with Foundry 14).
- The dnd5e system 5.0 or newer (verified with 6.0.6).

## Controls

Open a token's HUD (right-click the token), then click the wand-and-sparkles icon to open **Aura Ring Settings**.

- Rings start **off** for every character.
- Turn the selected character's ring on or off.
- Choose its color.
- Set its radius in feet.
- Choose **Sphere** to measure the radius from the token's center, or **Emanation** to measure outward from the token's occupied edge. Emanation adds half the smaller token dimension to the configured radius; the drawn boundary remains circular.
- The circle is centered on the token; its diameter is twice the displayed radius.

Settings are local to each client and saved separately for each actor. There is no automatic aura or ability detection.

## Install

Download and extract the release ZIP into `Data/modules/token-aura-rings-5e/`, then enable **LaserW1tch's Token Aura Rings 5e** in Manage Modules. If you have the release's manifest URL, you can install or update it through Foundry's Add-on Modules screen.

## Development

The module source is in `scripts/token-aura-rings.js`. Aura settings are client-local and stored separately for each actor.
