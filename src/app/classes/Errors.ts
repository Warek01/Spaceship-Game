abstract class CustomError extends Error {
  abstract readonly name: string;

  constructor(message?: string) {
    super(message);
  }
}

export class SoundNotFoundError extends CustomError {
  name = "Sound Not Found Error";
}

export class BackgroondNotFoundError extends CustomError {
  name = "Background Not Found Error";
}

export class GameLauchError extends CustomError {
  name = "Game Launch Error";
}
