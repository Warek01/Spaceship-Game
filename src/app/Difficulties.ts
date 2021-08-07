import { PickupItemType } from "./services/game.service";

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
      }, // hp
      ammo: {
        initial: 10,
        max: 10,
        maxAllowed: 25,
        genRate: 750,
      }, // ammo
      asteroidGenRate: 350,
      pickup: {
        disabled: ["Immunity", "XpBoost"],
        genRate: 1000,
        chances: new Map<PickupItemType, number>([
          ["Hp", 30],
          ["MaxHp", 12.5],
          ["Ammo", 40],
          ["MaxAmmo", 100] // 17.5%
        ]),
      }, // pickup
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
      pickup: {
        genRate: 3000,
        disabled: [],
        chances: new Map<PickupItemType, number>([
          ["Hp", 25],
          ["MaxHp", 10],
          ["Ammo", 20],
          ["MaxAmmo", 20],
          ["Immunity", 20],
          ["XpBoost", 100] // 5%
        ]),
      },
    },
  ], // Easy
  [
    D.Medium,
    {
      hp: { initial: 3, max: 3, maxAllowed: 5 },
      ammo: { initial: 3, max: 10, genRate: 2, maxAllowed: 15 },
      asteroidGenRate: 350,
      pickup: {
        genRate: 4000,
        disabled: [],
        chances: new Map<PickupItemType, number>([
          ["Hp", 20],
          ["MaxHp", 5],
          ["Ammo", 35],
          ["MaxAmmo", 10],
          ["Immunity", 15],
          ["XpBoost", 100], // 10%
        ]),
      },
    },
  ], // Medium
  [
    D.Hard,
    {
      hp: { initial: 3, max: 3, maxAllowed: 4 },
      ammo: { initial: 0, max: 5, genRate: 3, maxAllowed: 8 },
      asteroidGenRate: 300,
      pickup: {
        genRate: 4500,
        disabled: [],
        chances: new Map<PickupItemType, number>([
          ["Hp", 20],
          ["MaxHp", 5],
          ["Ammo", 35],
          ["MaxAmmo", 10],
          ["Immunity", 15],
          ["XpBoost", 100], // 15%
        ]),
      },
    },
  ], // Hard
  [
    D.Challenging,
    {
      hp: { initial: 1, max: 1, maxAllowed: 1 },
      ammo: { initial: 0, max: 1, genRate: 3, maxAllowed: 2 },
      asteroidGenRate: 200,
      pickup: {
        genRate: 6000,
        disabled: ["Immunity", "MaxHp", "Hp"],
        chances: new Map<PickupItemType, number>([
          ["MaxAmmo", 10],
          ["XpBoost", 20],
          ["Ammo", 100], // 70%
        ]),
      },
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
  pickup: {
    /** Millieconds to create a pickable item */
    genRate: number;
    /** Items that won't be generated */
    disabled: PickupItemType[] | "all";
    chances: Map<PickupItemType, number>;
  };
}
