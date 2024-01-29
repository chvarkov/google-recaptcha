import { ContextType } from '@nestjs/common';

export type RecaptchaResponseProvider = (req) => string | Promise<string>;

export type RecaptchaRemoteIpProvider = (req) => string | Promise<string>;

export type ScoreValidator = number | ((score: number) => boolean);

export type SkipIfValue = boolean | (<Req = unknown>(request: Req) => boolean | Promise<boolean>);

export type RecaptchaContextType = ContextType | 'graphql';
