import Phaser from 'phaser';

type CanvasTexture = Phaser.Textures.CanvasTexture;

const BASE_SHEET_WIDTH = 1536;
const BASE_SHEET_HEIGHT = 1024;
const SPRITE_TEXTURE_SCALE = 4;
const PLAYER_FRAME_WIDTH = 170 * SPRITE_TEXTURE_SCALE;
const PLAYER_FRAME_HEIGHT = 240 * SPRITE_TEXTURE_SCALE;
const PLAYER_PORTRAIT_WIDTH = 258 * SPRITE_TEXTURE_SCALE;
const PLAYER_PORTRAIT_HEIGHT = 494 * SPRITE_TEXTURE_SCALE;
const VAN_TEXTURE_WIDTH = 430 * SPRITE_TEXTURE_SCALE;
const VAN_TEXTURE_HEIGHT = 195 * SPRITE_TEXTURE_SCALE;
const RONNY_TEXTURE_SCALE = 4;

export function createPlaceholderTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('player-sheet')) {
    createEmployeeFramesFromSheet(scene);
  } else {
    createEmployeeFrames(scene);
  }
  createVanTexture(scene);
  createEquipmentTexture(scene);
  createLadderTexture(scene);
  createNpcTexture(scene);
  createRonnyTexture(scene);
  createUiTextures(scene);
}

function makeCanvas(scene: Phaser.Scene, key: string, width: number, height: number): CanvasTexture {
  if (scene.textures.exists(key)) {
    return scene.textures.get(key) as CanvasTexture;
  }

  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    throw new Error(`Unable to create canvas texture: ${key}`);
  }

  return texture;
}

interface SpriteCrop {
  key: string;
  sourceKey?: string;
  backgroundMode?: 'checker' | 'darkBackdrop';
  x: number;
  y: number;
  width: number;
  height: number;
  outputWidth?: number;
  outputHeight?: number;
  drawX?: number;
  drawY?: number;
  drawWidth?: number;
  drawHeight?: number;
}

interface AnchoredCrop {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  footY: number;
  feetCenter: number;
  scale?: number;
}

function createEmployeeFramesFromSheet(scene: Phaser.Scene): void {
  const crops: SpriteCrop[] = [
    {
      key: 'employee-portrait',
      x: 2,
      y: 12,
      width: 258,
      height: 494,
      outputWidth: PLAYER_PORTRAIT_WIDTH,
      outputHeight: PLAYER_PORTRAIT_HEIGHT,
    },
    frameCrop('employee-idle-0', 782, 18, 47, 160),
    frameCrop('employee-idle-1', 782, 18, 47, 160),
    frameCrop('employee-idle-2', 782, 18, 47, 160),
    frameCrop('employee-walk-0', 782, 18, 47, 160),
    frameCrop('employee-walk-1', 851, 18, 42, 160),
    frameCrop('employee-walk-2', 988, 18, 75, 160),
    frameCrop('employee-walk-3', 1072, 19, 82, 159),
    // Soaping animation frames (Phase 1: smooth left-center-right motion)
    anchoredCrop('employee-soaping-0', 678, 527, 107, 200, 725, 744),
    anchoredCrop('employee-soaping-1', 796, 527, 104, 200, 725, 864),
    anchoredCrop('employee-soaping-2', 912, 527, 100, 200, 725, 971),
    anchoredCrop('employee-soaping-3', 796, 527, 104, 200, 725, 864),
    // Squeegee animation frames (Phase 2: squeegee wipe across window)
    anchoredCrop('employee-squeegee-0', 678, 527, 107, 200, 725, 744),
    anchoredCrop('employee-squeegee-1', 796, 527, 104, 200, 725, 864),
    anchoredCrop('employee-squeegee-2', 912, 527, 100, 200, 725, 971),
    anchoredCrop('employee-squeegee-3', 1024, 527, 110, 200, 725, 1078),
    // Legacy fallback aliases
    anchoredCrop('employee-cleaning-0', 678, 527, 107, 200, 725, 744),
    anchoredCrop('employee-cleaning-1', 796, 527, 104, 200, 725, 864),
    anchoredCrop('employee-cleaning-2', 912, 527, 100, 200, 725, 971),
    anchoredCrop('employee-cleaning-3', 1024, 527, 110, 200, 725, 1078),
  ];

  for (const crop of crops) {
    createTextureFromSheet(scene, crop);
  }
}

function anchoredCrop(
  key: string,
  x: number,
  y: number,
  width: number,
  height: number,
  footY: number,
  feetCenter: number,
  scale = 0.88,
): SpriteCrop {
  const targetFootY = 236 * SPRITE_TEXTURE_SCALE;
  const targetCenterX = 85 * SPRITE_TEXTURE_SCALE;
  const drawWidth = Math.round(width * scale * SPRITE_TEXTURE_SCALE);
  const drawHeight = Math.round(height * scale * SPRITE_TEXTURE_SCALE);
  const scaledFootY = (footY - y) * scale * SPRITE_TEXTURE_SCALE;
  const scaledFeetCenterX = (feetCenter - x) * scale * SPRITE_TEXTURE_SCALE;

  return {
    key,
    x,
    y,
    width,
    height,
    outputWidth: PLAYER_FRAME_WIDTH,
    outputHeight: PLAYER_FRAME_HEIGHT,
    drawX: Math.round(targetCenterX - scaledFeetCenterX),
    drawY: Math.round(targetFootY - scaledFootY),
    drawWidth,
    drawHeight,
  };
}

function frameCrop(key: string, x: number, y: number, width: number, height: number): SpriteCrop {
  const drawWidth = width * SPRITE_TEXTURE_SCALE;
  const drawHeight = height * SPRITE_TEXTURE_SCALE;

  return {
    key,
    x,
    y,
    width,
    height,
    outputWidth: PLAYER_FRAME_WIDTH,
    outputHeight: PLAYER_FRAME_HEIGHT,
    drawX: Math.round((PLAYER_FRAME_WIDTH - drawWidth) / 2),
    drawY: PLAYER_FRAME_HEIGHT - drawHeight,
    drawWidth,
    drawHeight,
  };
}

function createTextureFromSheet(scene: Phaser.Scene, crop: SpriteCrop): void {
  if (scene.textures.exists(crop.key)) {
    scene.textures.remove(crop.key);
  }

  const width = crop.outputWidth ?? crop.width;
  const height = crop.outputHeight ?? crop.height;
  const source = scene.textures.get(crop.sourceKey ?? 'player-sheet').getSourceImage() as CanvasImageSource;
  const sourceSize = getCanvasImageSize(source);
  const sourceScaleX = sourceSize.width / BASE_SHEET_WIDTH;
  const sourceScaleY = sourceSize.height / BASE_SHEET_HEIGHT;
  const texture = makeCanvas(scene, crop.key, width, height);
  const ctx = texture.context;
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const drawWidth = crop.drawWidth ?? (crop.drawX === undefined ? width : crop.width);
  const drawHeight = crop.drawHeight ?? (crop.drawY === undefined ? height : crop.height);

  ctx.drawImage(
    source,
    Math.round(crop.x * sourceScaleX),
    Math.round(crop.y * sourceScaleY),
    Math.round(crop.width * sourceScaleX),
    Math.round(crop.height * sourceScaleY),
    crop.drawX ?? 0,
    crop.drawY ?? 0,
    drawWidth,
    drawHeight,
  );
  if (crop.backgroundMode === 'darkBackdrop') {
    removeDarkBackdropBackground(ctx, width, height);
  } else {
    removeSheetBackground(ctx, width, height);
  }
  texture.refresh();
}

function getCanvasImageSize(source: CanvasImageSource): { width: number; height: number } {
  const image = source as HTMLImageElement & HTMLCanvasElement & HTMLVideoElement;
  return {
    width: image.naturalWidth || image.videoWidth || image.width,
    height: image.naturalHeight || image.videoHeight || image.height,
  };
}

function removeSheetBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const enqueue = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const pixel = y * width + x;
    if (visited[pixel]) {
      return;
    }

    const offset = pixel * 4;
    if (!isLikelyCheckerboard(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) {
      return;
    }

    visited[pixel] = 1;
    queue.push(pixel);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const pixel = queue[queueIndex];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    data[pixel * 4 + 3] = 0;

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  ctx.putImageData(image, 0, 0);
}

function isLikelyCheckerboard(red: number, green: number, blue: number, alpha: number): boolean {
  if (alpha === 0) {
    return true;
  }

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return max - min < 15 && min > 240;
}

function removeDarkBackdropBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const enqueue = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const pixel = y * width + x;
    if (visited[pixel]) {
      return;
    }

    const offset = pixel * 4;
    if (!isLikelyDarkBackdrop(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) {
      return;
    }

    visited[pixel] = 1;
    queue.push(pixel);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const pixel = queue[queueIndex];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    data[pixel * 4 + 3] = 0;

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  ctx.putImageData(image, 0, 0);
}

function isLikelyDarkBackdrop(red: number, green: number, blue: number, alpha: number): boolean {
  if (alpha === 0) {
    return true;
  }

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const saturation = max - min;
  const brightness = (red + green + blue) / 3;
  const smokyRed = red > green + 10 && red > blue + 10 && brightness < 92;

  return brightness < 78 || (brightness < 125 && saturation < 42) || smokyRed;
}

function createEmployeeFrames(scene: Phaser.Scene): void {
  const frameSpecs = [
    { key: 'employee-idle-0', leftLeg: -2, rightLeg: 2, frontArm: 0, backArm: 0, lean: 0, bob: 0, tool: 0 },
    { key: 'employee-idle-1', leftLeg: -2, rightLeg: 2, frontArm: 1, backArm: -1, lean: 0, bob: -1, tool: 0 },
    { key: 'employee-idle-2', leftLeg: -2, rightLeg: 2, frontArm: 0, backArm: 1, lean: 0, bob: 0, tool: 0 },
    { key: 'employee-walk-0', leftLeg: -10, rightLeg: 8, frontArm: 9, backArm: -8, lean: 2, bob: 0, tool: 0 },
    { key: 'employee-walk-1', leftLeg: -4, rightLeg: 3, frontArm: 2, backArm: -2, lean: 1, bob: -3, tool: 0 },
    { key: 'employee-walk-2', leftLeg: 9, rightLeg: -9, frontArm: -8, backArm: 8, lean: -2, bob: 0, tool: 0 },
    { key: 'employee-walk-3', leftLeg: 3, rightLeg: -4, frontArm: -2, backArm: 2, lean: -1, bob: -3, tool: 0 },
    { key: 'employee-cleaning-0', leftLeg: -3, rightLeg: 3, frontArm: 18, backArm: 1, lean: 3, bob: 0, tool: -8 },
    { key: 'employee-cleaning-1', leftLeg: -3, rightLeg: 3, frontArm: 10, backArm: 1, lean: 5, bob: -2, tool: 0 },
    { key: 'employee-cleaning-2', leftLeg: -3, rightLeg: 3, frontArm: 22, backArm: 1, lean: 4, bob: 0, tool: 8 },
    { key: 'employee-cleaning-3', leftLeg: -3, rightLeg: 3, frontArm: 12, backArm: 1, lean: 2, bob: -1, tool: 2 },
    { key: 'employee-soaping-0', leftLeg: -3, rightLeg: 3, frontArm: 14, backArm: 1, lean: 2, bob: 0, tool: -6 },
    { key: 'employee-soaping-1', leftLeg: -3, rightLeg: 3, frontArm: 18, backArm: 1, lean: 4, bob: -1, tool: 0 },
    { key: 'employee-soaping-2', leftLeg: -3, rightLeg: 3, frontArm: 24, backArm: 1, lean: 5, bob: 0, tool: 6 },
    { key: 'employee-soaping-3', leftLeg: -3, rightLeg: 3, frontArm: 12, backArm: 1, lean: 3, bob: -2, tool: -2 },
    { key: 'employee-squeegee-0', leftLeg: -3, rightLeg: 3, frontArm: 20, backArm: 2, lean: 3, bob: 0, tool: 8 },
    { key: 'employee-squeegee-1', leftLeg: -3, rightLeg: 3, frontArm: 10, backArm: 1, lean: 4, bob: -2, tool: 4 },
    { key: 'employee-squeegee-2', leftLeg: -3, rightLeg: 3, frontArm: 24, backArm: 2, lean: 5, bob: 0, tool: 10 },
    { key: 'employee-squeegee-3', leftLeg: -3, rightLeg: 3, frontArm: 14, backArm: 1, lean: 2, bob: -1, tool: 0 },
  ];

  for (const spec of frameSpecs) {
    const texture = makeCanvas(scene, spec.key, 94, 128);
    const ctx = texture.context;
    ctx.clearRect(0, 0, 94, 128);
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.ellipse(46, 118, 31, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(spec.lean, spec.bob);

    ctx.strokeStyle = '#15191f';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(38, 79);
    ctx.lineTo(31 + spec.leftLeg, 113);
    ctx.moveTo(54, 79);
    ctx.lineTo(60 + spec.rightLeg, 113);
    ctx.stroke();

    ctx.strokeStyle = '#0b0f14';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(31 + spec.leftLeg, 113);
    ctx.lineTo(21 + spec.leftLeg, 117);
    ctx.moveTo(60 + spec.rightLeg, 113);
    ctx.lineTo(72 + spec.rightLeg, 117);
    ctx.stroke();

    ctx.fillStyle = '#1f6f3d';
    ctx.beginPath();
    ctx.roundRect(28, 48, 37, 39, 11);
    ctx.fill();
    ctx.fillStyle = '#39a35b';
    ctx.beginPath();
    ctx.roundRect(25, 44, 34, 38, 10);
    ctx.fill();
    ctx.fillStyle = '#2b8a4a';
    ctx.fillRect(50, 49, 11, 31);
    ctx.fillStyle = '#e9f7ef';
    ctx.fillRect(31, 55, 18, 5);
    ctx.fillStyle = '#17212f';
    ctx.fillRect(34, 63, 16, 4);

    ctx.strokeStyle = '#e7b48c';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(62, 56);
    ctx.lineTo(76, 75 - spec.frontArm);
    ctx.stroke();

    if (spec.key.startsWith('employee-cleaning')) {
      ctx.strokeStyle = '#d9e6ed';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(76, 72 - spec.frontArm);
      ctx.lineTo(88, 28 + spec.tool);
      ctx.stroke();
      ctx.fillStyle = '#17212f';
      ctx.beginPath();
      ctx.roundRect(75, 24 + spec.tool, 30, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#ecfbff';
      ctx.fillRect(80, 24 + spec.tool, 20, 2);
    }

    ctx.strokeStyle = '#dca77f';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(28, 57);
    ctx.lineTo(16, 77 + spec.backArm);
    ctx.stroke();

    ctx.fillStyle = '#f0c49d';
    ctx.beginPath();
    ctx.roundRect(33, 21, 24, 25, 8);
    ctx.fill();
    ctx.fillStyle = '#dca77f';
    ctx.fillRect(52, 29, 5, 13);
    ctx.fillStyle = '#402a22';
    ctx.beginPath();
    ctx.roundRect(29, 16, 31, 10, 5);
    ctx.fill();
    ctx.fillRect(29, 23, 6, 11);
    ctx.fillStyle = '#101820';
    ctx.fillRect(40, 31, 3, 3);
    ctx.fillRect(52, 32, 3, 3);
    ctx.fillStyle = '#8b3826';
    ctx.fillRect(43, 39, 10, 2);

    ctx.restore();

    texture.refresh();
  }
}

function createVanTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('car-sheet')) {
    createTextureFromSheet(scene, {
      key: 'anders-van',
      sourceKey: 'car-sheet',
      x: 67,
      y: 13,
      width: 772,
      height: 350,
      outputWidth: VAN_TEXTURE_WIDTH,
      outputHeight: VAN_TEXTURE_HEIGHT,
    });
    return;
  }

  const texture = makeCanvas(scene, 'anders-van', 384, 174);
  const ctx = texture.context;
  ctx.clearRect(0, 0, 384, 174);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(188, 156, 166, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d8d8d3';
  ctx.beginPath();
  ctx.roundRect(34, 69, 298, 74, 10);
  ctx.fill();
  ctx.fillStyle = '#f7f6ef';
  ctx.beginPath();
  ctx.roundRect(28, 58, 300, 78, 12);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(88, 27, 143, 42, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(48, 61, 192, 67);

  ctx.fillStyle = '#d4362f';
  ctx.fillRect(28, 120, 300, 14);
  ctx.fillStyle = '#16476d';
  ctx.fillRect(28, 134, 300, 5);
  ctx.fillStyle = '#eff3ef';
  ctx.fillRect(39, 52, 46, 15);

  ctx.fillStyle = '#9ed4e8';
  ctx.beginPath();
  ctx.roundRect(99, 36, 50, 25, 5);
  ctx.roundRect(158, 36, 53, 25, 5);
  ctx.roundRect(249, 73, 48, 31, 5);
  ctx.fill();
  ctx.fillStyle = '#16476d';
  ctx.fillRect(305, 76, 16, 32);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.fillRect(104, 39, 23, 4);
  ctx.fillRect(254, 77, 22, 4);

  ctx.fillStyle = '#d4362f';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('ANDERS', 52, 92);
  ctx.fillStyle = '#16476d';
  ctx.fillText('ANDERSEN', 52, 115);
  ctx.fillStyle = '#243242';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('WINDOW SERVICE', 184, 110);

  ctx.strokeStyle = '#303943';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(219, 30);
  ctx.lineTo(275, 9);
  ctx.stroke();
  ctx.strokeStyle = '#ccd4d7';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(257, 7);
  ctx.lineTo(343, 7);
  ctx.stroke();
  ctx.strokeStyle = '#7c858b';
  ctx.lineWidth = 2;
  for (let x = 267; x <= 333; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 2);
    ctx.lineTo(x + 5, 12);
    ctx.stroke();
  }

  ctx.fillStyle = '#18212d';
  ctx.beginPath();
  ctx.arc(90, 142, 23, 0, Math.PI * 2);
  ctx.arc(272, 142, 23, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#aab6bf';
  ctx.beginPath();
  ctx.arc(90, 142, 10, 0, Math.PI * 2);
  ctx.arc(272, 142, 10, 0, Math.PI * 2);
  ctx.fill();

  texture.refresh();
}

function createEquipmentTexture(scene: Phaser.Scene): void {
  const texture = makeCanvas(scene, 'cleaning-kit', 96, 70);
  const ctx = texture.context;
  ctx.clearRect(0, 0, 96, 70);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(45, 63, 33, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4362f';
  ctx.fillRect(16, 34, 33, 24);
  ctx.fillStyle = '#f7efe1';
  ctx.fillRect(20, 38, 25, 6);
  ctx.strokeStyle = '#d9e6ed';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(61, 58);
  ctx.lineTo(78, 11);
  ctx.stroke();
  ctx.fillStyle = '#243242';
  ctx.fillRect(67, 8, 22, 7);
  ctx.strokeStyle = '#f7efe1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(22, 33);
  ctx.quadraticCurveTo(32, 20, 45, 33);
  ctx.stroke();

  texture.refresh();
}

function createLadderTexture(scene: Phaser.Scene): void {
  const texture = makeCanvas(scene, 'work-ladder', 92 * SPRITE_TEXTURE_SCALE, 360 * SPRITE_TEXTURE_SCALE);
  const ctx = texture.context;
  const width = texture.width;
  const height = texture.height;
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const railLeft = 22 * SPRITE_TEXTURE_SCALE;
  const railRight = 70 * SPRITE_TEXTURE_SCALE;
  const top = 18 * SPRITE_TEXTURE_SCALE;
  const bottom = 344 * SPRITE_TEXTURE_SCALE;

  ctx.strokeStyle = '#5f6971';
  ctx.lineWidth = 10 * SPRITE_TEXTURE_SCALE;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(railLeft, top);
  ctx.lineTo(railLeft, bottom);
  ctx.moveTo(railRight, top);
  ctx.lineTo(railRight, bottom);
  ctx.stroke();

  ctx.strokeStyle = '#d7dee3';
  ctx.lineWidth = 6 * SPRITE_TEXTURE_SCALE;
  for (let y = 48 * SPRITE_TEXTURE_SCALE; y <= 314 * SPRITE_TEXTURE_SCALE; y += 34 * SPRITE_TEXTURE_SCALE) {
    ctx.beginPath();
    ctx.moveTo(railLeft + 3 * SPRITE_TEXTURE_SCALE, y);
    ctx.lineTo(railRight - 3 * SPRITE_TEXTURE_SCALE, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2 * SPRITE_TEXTURE_SCALE;
  ctx.beginPath();
  ctx.moveTo(railLeft - 5 * SPRITE_TEXTURE_SCALE, top + 4 * SPRITE_TEXTURE_SCALE);
  ctx.lineTo(railLeft - 5 * SPRITE_TEXTURE_SCALE, bottom - 10 * SPRITE_TEXTURE_SCALE);
  ctx.moveTo(railRight - 5 * SPRITE_TEXTURE_SCALE, top + 4 * SPRITE_TEXTURE_SCALE);
  ctx.lineTo(railRight - 5 * SPRITE_TEXTURE_SCALE, bottom - 10 * SPRITE_TEXTURE_SCALE);
  ctx.stroke();

  texture.refresh();
}

function createNpcTexture(scene: Phaser.Scene): void {
  const texture = makeCanvas(scene, 'customer-mechanic', 82, 118);
  const ctx = texture.context;
  ctx.clearRect(0, 0, 82, 118);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(42, 110, 27, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#34414e';
  ctx.fillRect(24, 55, 36, 34);
  ctx.fillStyle = '#efc49a';
  ctx.fillRect(31, 23, 21, 24);
  ctx.fillStyle = '#24211e';
  ctx.fillRect(28, 18, 27, 9);
  ctx.fillStyle = '#f1c232';
  ctx.fillRect(22, 47, 40, 10);
  ctx.fillStyle = '#26313d';
  ctx.fillRect(27, 88, 13, 24);
  ctx.fillRect(46, 88, 13, 24);
  ctx.fillStyle = '#101820';
  ctx.fillRect(21, 111, 22, 6);
  ctx.fillRect(44, 111, 22, 6);
  ctx.strokeStyle = '#efc49a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(24, 58);
  ctx.lineTo(11, 73);
  ctx.moveTo(60, 58);
  ctx.lineTo(70, 68);
  ctx.stroke();

  texture.refresh();
}

function createRonnyTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists('ronny-sheet')) {
    createTextureFromSheet(scene, {
      key: 'ronny-boss',
      sourceKey: 'ronny-sheet',
      x: 35,
      y: 68,
      width: 278,
      height: 662,
      outputWidth: 430 * RONNY_TEXTURE_SCALE,
      outputHeight: 760 * RONNY_TEXTURE_SCALE,
      drawX: 76 * RONNY_TEXTURE_SCALE,
      drawY: 78 * RONNY_TEXTURE_SCALE,
      drawWidth: 278 * RONNY_TEXTURE_SCALE,
      drawHeight: 662 * RONNY_TEXTURE_SCALE,
    });
    return;
  }

  const texture = makeCanvas(scene, 'ronny-boss', 92, 128);
  const ctx = texture.context;
  ctx.clearRect(0, 0, 92, 128);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.ellipse(46, 120, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12171d';
  ctx.fillRect(30, 58, 34, 35);
  ctx.fillRect(31, 92, 13, 28);
  ctx.fillRect(49, 92, 13, 28);
  ctx.fillStyle = '#f0c29a';
  ctx.fillRect(35, 27, 23, 26);
  ctx.fillStyle = '#9aa0a7';
  ctx.fillRect(31, 20, 30, 9);
  ctx.fillRect(29, 28, 6, 10);
  ctx.fillRect(57, 28, 6, 10);
  ctx.fillStyle = '#101820';
  ctx.fillRect(40, 36, 3, 3);
  ctx.fillRect(52, 36, 3, 3);
  ctx.fillStyle = '#f7efe1';
  ctx.fillRect(42, 45, 12, 3);
  ctx.strokeStyle = '#f0c29a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(31, 62);
  ctx.lineTo(18, 80);
  ctx.moveTo(63, 62);
  ctx.lineTo(76, 77);
  ctx.stroke();

  texture.refresh();
}

function createUiTextures(scene: Phaser.Scene): void {
  const sparkle = makeCanvas(scene, 'sparkle', 36, 36);
  const ctx = sparkle.context;
  ctx.clearRect(0, 0, 36, 36);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.lineTo(18, 34);
  ctx.moveTo(2, 18);
  ctx.lineTo(34, 18);
  ctx.moveTo(8, 8);
  ctx.lineTo(28, 28);
  ctx.moveTo(28, 8);
  ctx.lineTo(8, 28);
  ctx.stroke();
  sparkle.refresh();
}
