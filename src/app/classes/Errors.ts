abstract class CustomError extends Error {
  abstract readonly name: string;

  constructor(...messages: any) {
    let str = "";
    if (Array.isArray(messages))
      messages.forEach((message) => (str += ` ${message.toString()}`));
    else str = messages.toString();
    super(str);
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

export class ParameterError extends CustomError {
  name = "Parameter error";
}
