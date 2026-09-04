import Phaser from 'phaser';
import type { PrototypeJob, WindowData } from '../types/game';
import type { JobLevelConfig, Point2, RectZone } from '../types/level';

type TiledPropertyValue = string | number | boolean;

interface TiledProperty {
  name: string;
  value: TiledPropertyValue;
}

type TiledObject = Phaser.Types.Tilemaps.TiledObject & {
  properties?: TiledProperty[];
};

const DEFAULT_LEVEL: JobLevelConfig = {
  windows: [],
  spawns: {
    player: { x: 410, y: 652 },
    van: { x: 190, y: 646 },
    cleaningKit: { x: 340, y: 662 },
    ronny: { x: 1034, y: 656 },
  },
  ladder: {
    roofSpawn: { x: 190, y: 500 },
    pickupZone: { x: 0, y: 545, width: 535, height: 145 },
    wallZone: { x: 380, y: 540, width: 550, height: 150 },
    baseY: 630,
    climbBottomY: 652,
    climbTopY: 404,
    cleanDistance: 92,
  },
  reach: {
    groundReachY: 470,
    groundCleanDistance: 82,
  },
  playerLane: {
    top: 558,
    bottom: 670,
  },
};

export function loadTiledJobLevel(
  scene: Phaser.Scene,
  mapKey: string,
  fallbackJob: PrototypeJob,
): JobLevelConfig {
  if (!scene.cache.tilemap.exists(mapKey)) {
    return createFallbackLevel(fallbackJob);
  }

  const map = scene.make.tilemap({ key: mapKey });
  const windows = readWindows(map) ?? fallbackJob.windows.map((window) => ({ ...window }));
  const spawnsLayer = map.getObjectLayer('spawns');
  const zonesLayer = map.getObjectLayer('zones');
  const playerLane = findObject(zonesLayer, 'player-lane');
  const ladderWall = findObject(zonesLayer, 'ladder-wall');

  return {
    windows,
    spawns: {
      player: pointFromObject(findObject(spawnsLayer, 'player'), DEFAULT_LEVEL.spawns.player),
      van: pointFromObject(findObject(spawnsLayer, 'van'), DEFAULT_LEVEL.spawns.van),
      cleaningKit: pointFromObject(findObject(spawnsLayer, 'cleaning-kit'), DEFAULT_LEVEL.spawns.cleaningKit),
      ronny: pointFromObject(findObject(spawnsLayer, 'ronny'), DEFAULT_LEVEL.spawns.ronny),
    },
    ladder: {
      roofSpawn: pointFromObject(findObject(spawnsLayer, 'ladder-roof'), DEFAULT_LEVEL.ladder.roofSpawn),
      pickupZone: rectFromObject(findObject(zonesLayer, 'van-ladder-pickup'), DEFAULT_LEVEL.ladder.pickupZone),
      wallZone: rectFromObject(ladderWall, DEFAULT_LEVEL.ladder.wallZone),
      baseY: numberProperty(ladderWall, 'baseY', DEFAULT_LEVEL.ladder.baseY),
      climbBottomY: numberProperty(ladderWall, 'climbBottomY', DEFAULT_LEVEL.ladder.climbBottomY),
      climbTopY: numberProperty(ladderWall, 'climbTopY', DEFAULT_LEVEL.ladder.climbTopY),
      cleanDistance: numberProperty(ladderWall, 'ladderCleanDistance', DEFAULT_LEVEL.ladder.cleanDistance),
    },
    reach: {
      groundReachY: numberProperty(ladderWall, 'groundReachY', DEFAULT_LEVEL.reach.groundReachY),
      groundCleanDistance: numberProperty(ladderWall, 'groundCleanDistance', DEFAULT_LEVEL.reach.groundCleanDistance),
    },
    playerLane: {
      top: numberProperty(playerLane, 'laneTop', DEFAULT_LEVEL.playerLane.top),
      bottom: numberProperty(playerLane, 'laneBottom', DEFAULT_LEVEL.playerLane.bottom),
    },
  };
}

function createFallbackLevel(fallbackJob: PrototypeJob): JobLevelConfig {
  return {
    ...DEFAULT_LEVEL,
    windows: fallbackJob.windows.map((window) => ({ ...window })),
    spawns: {
      ...DEFAULT_LEVEL.spawns,
    },
    ladder: {
      ...DEFAULT_LEVEL.ladder,
      pickupZone: { ...DEFAULT_LEVEL.ladder.pickupZone },
      wallZone: { ...DEFAULT_LEVEL.ladder.wallZone },
      roofSpawn: { ...DEFAULT_LEVEL.ladder.roofSpawn },
    },
    reach: { ...DEFAULT_LEVEL.reach },
    playerLane: { ...DEFAULT_LEVEL.playerLane },
  };
}

function readWindows(map: Phaser.Tilemaps.Tilemap): WindowData[] | undefined {
  const layer = map.getObjectLayer('windows');
  if (!layer || layer.objects.length === 0) {
    return undefined;
  }

  return layer.objects.map((object) => ({
    id: object.name || `window-${object.id}`,
    x: Math.round((object.x ?? 0) + (object.width ?? 0) / 2),
    y: Math.round((object.y ?? 0) + (object.height ?? 0) / 2),
    width: Math.round(object.width ?? 0),
    height: Math.round(object.height ?? 0),
    completed: false,
  }));
}

function findObject(
  layer: Phaser.Tilemaps.ObjectLayer | null | undefined,
  name: string,
): TiledObject | undefined {
  return layer?.objects.find((object) => object.name === name) as TiledObject | undefined;
}

function pointFromObject(object: TiledObject | undefined, fallback: Point2): Point2 {
  if (!object) {
    return { ...fallback };
  }

  return {
    x: Math.round(object.x ?? fallback.x),
    y: Math.round(object.y ?? fallback.y),
  };
}

function rectFromObject(object: TiledObject | undefined, fallback: RectZone): RectZone {
  if (!object) {
    return { ...fallback };
  }

  return {
    x: Math.round(object.x ?? fallback.x),
    y: Math.round(object.y ?? fallback.y),
    width: Math.round(object.width ?? fallback.width),
    height: Math.round(object.height ?? fallback.height),
  };
}

function numberProperty(object: TiledObject | undefined, name: string, fallback: number): number {
  const properties = object?.properties as TiledProperty[] | undefined;
  const value = properties?.find((property) => property.name === name)?.value;
  return typeof value === 'number' ? value : fallback;
}
