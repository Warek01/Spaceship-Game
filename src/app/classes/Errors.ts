abstract class CustomError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class SoundNotFoundError extends CustomError {}
export class BackgroondNotFoundError extends CustomError {}
