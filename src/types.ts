export type RecaptchaResponseProvider = (req) => string | Promise<string>;

export type ScoreValidator = number | ((score: number) => boolean);
