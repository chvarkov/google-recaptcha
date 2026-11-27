import { DynamicModule, Logger, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard.js';
import { GoogleRecaptchaValidator } from './services/validators/google-recaptcha.validator.js';
import { GoogleRecaptchaEnterpriseValidator } from './services/validators/google-recaptcha-enterprise.validator.js';
import {
	GoogleRecaptchaDeferredModuleAsyncOptions,
	GoogleRecaptchaDeferredModuleOptions,
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
import { validateCommonOptions, validateDeferredOptions, validateOptions } from './helpers/validate-options.js';
import { RecaptchaConfigRef } from './models/recaptcha-config-ref.js';

type AsyncMethodName = 'forRootAsync' | 'forRootDeferredAsync';

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
			optionsProviders: this.createAsyncProviders(options, 'forRootAsync'),
		});
	}

	/**
	 * Keys (`type`, `secretKey` / `enterprise`, `score`, `actions`) are not known at startup (e.g. set by an administrator):
	 * set them later via `RecaptchaConfigRef.setOptions()`. Until then the guard behaves according to `whenNotConfigured`.
	 */
	static forRootDeferred(options: GoogleRecaptchaDeferredModuleOptions): DynamicModule {
		return this.createDynamicModule({
			global: options.global,
			deferred: true,
			optionsProviders: [{ provide: RECAPTCHA_OPTIONS, useValue: options }],
		});
	}

	/** Async variant of `forRootDeferred()`. */
	static forRootDeferredAsync(options: GoogleRecaptchaDeferredModuleAsyncOptions): DynamicModule {
		return this.createDynamicModule({
			global: options.global,
			imports: options.imports,
			deferred: true,
			optionsProviders: this.createAsyncProviders(options, 'forRootDeferredAsync'),
		});
	}

	private static createDynamicModule(params: {
		global?: boolean;
		imports?: GoogleRecaptchaModuleAsyncOptions['imports'];
		deferred?: boolean;
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
				useFactory: (options: GoogleRecaptchaModuleOptions | GoogleRecaptchaDeferredModuleOptions): RecaptchaConfigRef => {
					validateCommonOptions(options);

					if (params.deferred) {
						validateDeferredOptions(options as GoogleRecaptchaDeferredModuleOptions);
					} else {
						validateOptions(options as GoogleRecaptchaModuleOptions);
					}

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
			global: params.global ?? false,
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

	private static createAsyncProviders<T>(options: GoogleRecaptchaModuleAsyncOptions<T>, method: AsyncMethodName): Provider[] {
		const providers: Provider[] = [this.createAsyncOptionsProvider(options, method)];

		if (options.useClass) {
			providers.push({
				provide: options.useClass,
				useClass: options.useClass,
			});
		}

		return providers;
	}

	/** @param method used in error messages: the helper is shared by `forRootAsync()` and `forRootDeferredAsync()`. */
	private static createAsyncOptionsProvider<T>(options: GoogleRecaptchaModuleAsyncOptions<T>, method: AsyncMethodName): Provider {
		if (options.useFactory) {
			return {
				provide: RECAPTCHA_OPTIONS,
				useFactory: options.useFactory,
				inject: options.inject,
			};
		}

		const factoryClass = options.useExisting || options.useClass;

		if (!factoryClass) {
			throw new Error(`GoogleRecaptchaModule.${method}() requires one of 'useFactory', 'useClass' or 'useExisting'.`);
		}

		return {
			provide: RECAPTCHA_OPTIONS,
			useFactory: async (optionsFactory: GoogleRecaptchaOptionsFactory<T>): Promise<T> => {
				if (!this.isGoogleRecaptchaFactory(optionsFactory)) {
					throw new Error("Factory must implement the 'GoogleRecaptchaOptionsFactory' interface.");
				}
				return optionsFactory.createGoogleRecaptchaOptions();
			},
			inject: [factoryClass],
		};
	}

	private static isGoogleRecaptchaFactory<T>(object?: GoogleRecaptchaOptionsFactory<T>): object is GoogleRecaptchaOptionsFactory<T> {
		return !!object && typeof object.createGoogleRecaptchaOptions === 'function';
	}
}
