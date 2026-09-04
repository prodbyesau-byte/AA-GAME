# Sprite Assets

Game-ready PNG assets live in `public/assets`. Source sprite sheets live in `sprites`.

Current 4K character and vehicle sheets:

- `player-sprite-4k.png`
- `player-offjob-sprite-4k.png`
- `ronny-sprite-4k.png`
- `car-sprite-4k.png`
- `aa-logo-hd.png`

The current prototype generates temporary canvas textures in `src/utils/textureFactory.ts`.
Current supplied sheets are copied into `public/assets` so Phaser can load them in the browser.
