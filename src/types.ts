import { ContextType } from '@nestjs/common';

// `any` on purpose: request shape depends on the platform (express, fastify, graphql context).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRequest = any;

export type RecaptchaResponseProvider = (req: AnyRequest) => string | undefined | Promise<string | undefined>;

export type RecaptchaRemoteIpProvider = (req: AnyRequest) => string | undefined | Promise<string | undefined>;

export type ScoreValidator = number | ((score: number) => boolean);

export type SkipIfValue = boolean | ((req: AnyRequest) => boolean | Promise<boolean>);

export type RecaptchaContextType = ContextType | 'graphql';
