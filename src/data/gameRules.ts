export const GAME_RULES = {
  input: {
    move: ['WASD', 'ArrowKeys'],
    interact: 'E',
    ladder: 'F',
    jump: 'Space',
    characterMenu: 'I',
  },
  player: {
    normalSpeed: 255,
    laneSpeed: 145,
    carryingLadderSpeedMultiplier: 0.5,
  },
  cleaning: {
    phaseHoldMs: 15000,
    testPhaseHoldMs: 250,
    phases: ['soap', 'squeegee'],
  },
  ladder: {
    playerOffsetX: 22,
    carryOffsetX: -28,
    carryOffsetY: -20,
    carryScale: 0.18,
    placedScale: 0.27,
    climbSpeed: 240,
    enterDistanceX: 68,
    enterMinY: 500,
    snapToUpperWindowDistance: 130,
    highWindowReachPlayerY: 470,
  },
  editor: {
    mapPath: '/assets/maps/andersen-auto-service.json',
    gridSize: 16,
  },
} as const;
