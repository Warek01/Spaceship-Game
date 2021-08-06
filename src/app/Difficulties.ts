export enum Difficulty {
  Test,
  Easy,
  Medium, // -default
  Hard,
  Challenging,
}

const D = Difficulty;

export const GameDifficulties: Map<Difficulty, GameDifficultyConfig> = new Map([
  [
    D.Test,
    {
      hp: {
        initial: 3,
        max: 5,
        maxAllowed: 10,
      },
      ammo: {
        initial: 10,
        max: 10,
        maxAllowed: 25,
        genRate: 750,
      },
      asteroidGenRate: 350,
      itemGenRate: 2000,
      upgradeItemChance: 35,
    },
  ], // Test
  [
    D.Easy,
    {
      hp: { initial: 4, max: 4, maxAllowed: 6 },
      ammo: {
        initial: 10,
        max: 10,
        genRate: 2,
        maxAllowed: 20,
      },
      asteroidGenRate: 400,
      itemGenRate: 3000,
      upgradeItemChance: 35,
    },
  ], // Easy
  [
    D.Medium,
    {
      hp: { initial: 3, max: 3, maxAllowed: 5 },
      ammo: { initial: 3, max: 10, genRate: 2, maxAllowed: 15 },
      asteroidGenRate: 350,
      itemGenRate: 4000,
      upgradeItemChance: 30,
    },
  ], // Medium
  [
    D.Hard,
    {
      hp: { initial: 3, max: 3, maxAllowed: 4 },
      ammo: { initial: 0, max: 5, genRate: 3, maxAllowed: 8 },
      asteroidGenRate: 300,
      itemGenRate: 4500,
      upgradeItemChance: 20,
    },
  ], // Hard
  [
    D.Challenging,
    {
      hp: { initial: 1, max: 1, maxAllowed: 1 },
      ammo: { initial: 0, max: 1, genRate: 3, maxAllowed: 2 },
      asteroidGenRate: 200,
      itemGenRate: 5000,
      upgradeItemChance: 15,
    },
  ], // Challenging
]);

export interface GameDifficultyConfig {
  hp: {
    initial: number;
    max: number;
    /** Max hp that can be got with items */
    maxAllowed: number;
  };
  ammo: {
    /** Starting number of shells */
    initial: number;
    max: number;
    /** Max ammo that can be got with items */
    maxAllowed: number;
    /** Millieconds to refill 1 shell */
    genRate: number;
  };
  /** Millieconds to create an asteroid */
  asteroidGenRate: number;
  /** Millieconds to create a pickable item */
  itemGenRate: number;
  /** Chance (0-100) that generated item will upgrade ship */
  upgradeItemChance: number;
}
