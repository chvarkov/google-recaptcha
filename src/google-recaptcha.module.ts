import { DynamicModule, Logger, Provider } from '@nestjs/common';
import { GoogleRecaptchaGuard } from './guards/google-recaptcha.guard';
import { GoogleRecaptchaValidator } from './services/validators/google-recaptcha.validator';
import { GoogleRecaptchaEnterpriseValidator } from './services/validators/google-recaptcha-enterprise.validator';
import {
	GoogleRecaptchaModuleAsyncOptions,
	GoogleRecaptchaModuleOptions,
	GoogleRecaptchaOptionsFactory,
} from './interfaces/google-recaptcha-module-options';
import { RECAPTCHA_AXIOS_INSTANCE, RECAPTCHA_LOGGER, RECAPTCHA_OPTIONS } from './provider.declarations';
import { RecaptchaRequestResolver } from './services/recaptcha-request.resolver';
import { Reflector } from '@nestjs/core';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Agent } from 'https';
import { RecaptchaValidatorResolver } from './services/recaptcha-validator.resolver';
import { EnterpriseReasonTransformer } from './services/enterprise-reason.transformer';
import { xor } from './helpers/xor';
import { RecaptchaConfigRef } from './models/recaptcha-config-ref';

export class GoogleRecaptchaModule {
	private static axiosDefaultConfig: AxiosRequestConfig = {
		timeout: 60_000,
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
						headers: null,
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

		return {
			provide: RECAPTCHA_OPTIONS,
			useFactory: async (optionsFactory: GoogleRecaptchaOptionsFactory): Promise<GoogleRecaptchaModuleOptions> => {
				if (!this.isGoogleRecaptchaFactory(optionsFactory)) {
					throw new Error("Factory must be implement 'GoogleRecaptchaOptionsFactory' interface.");
				}
				return optionsFactory.createGoogleRecaptchaOptions();
			},
			inject: [options.useExisting || options.useClass],
		};
	}

	private static validateOptions(options: GoogleRecaptchaModuleOptions): void | never {
		const hasEnterpriseOptions = !!Object.keys(options.enterprise || {}).length;
		if (!xor(!!options.secretKey, hasEnterpriseOptions)) {
			throw new Error('Google recaptcha options must be contains "secretKey" xor "enterprise".');
		}
	}

	private static isGoogleRecaptchaFactory(object?: GoogleRecaptchaOptionsFactory): object is GoogleRecaptchaOptionsFactory {
		return !!object && typeof object.createGoogleRecaptchaOptions === 'function';
	}
}
