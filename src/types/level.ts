import type { WindowData } from './game';

export interface Point2 {
  x: number;
  y: number;
}

export interface RectZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LadderLevelConfig {
  roofSpawn: Point2;
  pickupZone: RectZone;
  wallZone: RectZone;
  baseY: number;
  climbBottomY: number;
  climbTopY: number;
  cleanDistance: number;
}

export interface ReachLevelConfig {
  groundReachY: number;
  groundCleanDistance: number;
}

export interface PlayerLaneConfig {
  top: number;
  bottom: number;
}

export interface JobLevelConfig {
  windows: WindowData[];
  spawns: {
    player: Point2;
    van: Point2;
    cleaningKit: Point2;
    ronny: Point2;
  };
  ladder: LadderLevelConfig;
  reach: ReachLevelConfig;
  playerLane: PlayerLaneConfig;
}
