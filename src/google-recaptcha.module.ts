import { DynamicModule, Logger, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard.js';
import { GoogleRecaptchaValidator } from './services/validators/google-recaptcha.validator.js';
import { GoogleRecaptchaEnterpriseValidator } from './services/validators/google-recaptcha-enterprise.validator.js';
import {
	GoogleRecaptchaModuleAsyncOptions,
	GoogleRecaptchaModuleOptions,
	GoogleRecaptchaOptionsFactory,
} from './interfaces/google-recaptcha-module-options.js';
import { RECAPTCHA_AXIOS_INSTANCE, RECAPTCHA_LOGGER, RECAPTCHA_OPTIONS } from './provider.declarations.js';
import { RecaptchaRequestResolver } from './services/recaptcha-request.resolver.js';
import { Reflector } from '@nestjs/core';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Agent } from 'https';
import { RecaptchaValidatorResolver } from './services/recaptcha-validator.resolver.js';
import { EnterpriseReasonTransformer } from './services/enterprise-reason.transformer.js';
import { xor } from './helpers/xor.js';
import { RecaptchaConfigRef } from './models/recaptcha-config-ref.js';
import { GoogleRecaptchaType } from './interfaces/google-recaptcha-validator-options.js';

const RECAPTCHA_TYPES: readonly string[] = ['v2', 'v3', 'enterprise'] satisfies GoogleRecaptchaType[];

export class GoogleRecaptchaModule {
	private static axiosDefaultConfig: AxiosRequestConfig = {
		timeout: 10_000,
		httpsAgent: new Agent({ keepAlive: true }),
	};

	static forRoot(options: GoogleRecaptchaModuleOptions): DynamicModule {
		return this.createDynamicModule({
			global: options.global,
			optionsProviders: [{ provide: RECAPTCHA_OPTIONS, useValue: options }],
		});
	}

	static forRootAsync(options: GoogleRecaptchaModuleAsyncOptions): DynamicModule {
		return this.createDynamicModule({
			global: options.global,
			imports: options.imports,
			optionsProviders: this.createAsyncProviders(options),
		});
	}

	private static createDynamicModule(params: {
		global?: boolean;
		imports?: GoogleRecaptchaModuleAsyncOptions['imports'];
		optionsProviders: Provider[];
	}): DynamicModule {
		const providers: Provider[] = [
			Reflector,
			GoogleRecaptchaGuard,
			GoogleRecaptchaValidator,
			GoogleRecaptchaEnterpriseValidator,
			RecaptchaRequestResolver,
			RecaptchaValidatorResolver,
			EnterpriseReasonTransformer,
			...params.optionsProviders,
			{
				provide: RECAPTCHA_LOGGER,
				useFactory: (options: GoogleRecaptchaModuleOptions): Logger => options.logger || new Logger(),
				inject: [RECAPTCHA_OPTIONS],
			},
			{
				provide: RecaptchaConfigRef,
				useFactory: (options: GoogleRecaptchaModuleOptions): RecaptchaConfigRef => {
					this.validateOptions(options);
					return new RecaptchaConfigRef(options);
				},
				inject: [RECAPTCHA_OPTIONS],
			},
		];

		const axiosProvider: Provider = {
			provide: RECAPTCHA_AXIOS_INSTANCE,
			useFactory: (options: GoogleRecaptchaModuleOptions): AxiosInstance =>
				axios.create(
					this.transformAxiosConfig({
						...this.axiosDefaultConfig,
						...options.axiosConfig,
						// User headers are ignored on purpose (see GoogleRecaptchaValidatorOptions.axiosConfig).
						headers: null as unknown as AxiosRequestConfig['headers'],
					})
				),
			inject: [RECAPTCHA_OPTIONS],
		};

		return {
			global: params.global ?? true,
			module: GoogleRecaptchaModule,
			imports: params.imports,
			providers: [...providers, axiosProvider],
			exports: providers,
		};
	}

	private static transformAxiosConfig(axiosConfig: AxiosRequestConfig): AxiosRequestConfig {
		const config = { ...axiosConfig };

		delete config.baseURL;
		delete config.url;
		delete config.responseType;
		delete config.method;
		delete config.transformRequest;
		delete config.transformResponse;
		delete config.paramsSerializer;
		delete config.validateStatus;
		delete config.data;
		delete config.adapter;

		return config;
	}

	private static createAsyncProviders(options: GoogleRecaptchaModuleAsyncOptions): Provider[] {
		const providers: Provider[] = [this.createAsyncOptionsProvider(options)];

		if (options.useClass) {
			providers.push({
				provide: options.useClass,
				useClass: options.useClass,
			});
		}

		return providers;
	}

	private static createAsyncOptionsProvider(options: GoogleRecaptchaModuleAsyncOptions): Provider {
		if (options.useFactory) {
			return {
				provide: RECAPTCHA_OPTIONS,
				useFactory: options.useFactory,
				inject: options.inject,
			};
		}

		const factoryClass = options.useExisting || options.useClass;

		if (!factoryClass) {
			throw new Error("GoogleRecaptchaModule.forRootAsync() requires one of 'useFactory', 'useClass' or 'useExisting'.");
		}

		return {
			provide: RECAPTCHA_OPTIONS,
			useFactory: async (optionsFactory: GoogleRecaptchaOptionsFactory): Promise<GoogleRecaptchaModuleOptions> => {
				if (!this.isGoogleRecaptchaFactory(optionsFactory)) {
					throw new Error("Factory must implement the 'GoogleRecaptchaOptionsFactory' interface.");
				}
				return optionsFactory.createGoogleRecaptchaOptions();
			},
			inject: [factoryClass],
		};
	}

	private static validateOptions(options: GoogleRecaptchaModuleOptions): void | never {
		const hasEnterpriseOptions = !!Object.keys(options.enterprise || {}).length;
		if (!xor(!!options.secretKey, hasEnterpriseOptions)) {
			throw new Error('Google reCAPTCHA options must contain either "secretKey" or "enterprise", but not both.');
		}

		// Types already guarantee the checks below; they are for JS users and untyped configs.
		const type: string | undefined = options.type;

		if (type === undefined) {
			throw new Error(`Google reCAPTCHA option "type" is required. Expected one of: ${RECAPTCHA_TYPES.join(', ')}.`);
		}

		if (!RECAPTCHA_TYPES.includes(type)) {
			throw new Error(`Unknown Google reCAPTCHA type '${type}'. Expected one of: ${RECAPTCHA_TYPES.join(', ')}.`);
		}

		if ((type === 'enterprise') !== hasEnterpriseOptions) {
			const required = type === 'enterprise' ? 'enterprise' : 'secretKey';
			throw new Error(`Google reCAPTCHA type '${type}' requires the "${required}" option.`);
		}

		if (type === 'v2' && (options.score != null || options.actions != null)) {
			throw new Error('Google reCAPTCHA v2 does not support "score" and "actions" options.');
		}
	}

	private static isGoogleRecaptchaFactory(object?: GoogleRecaptchaOptionsFactory): object is GoogleRecaptchaOptionsFactory {
		return !!object && typeof object.createGoogleRecaptchaOptions === 'function';
	}
}
