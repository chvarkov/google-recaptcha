# Google recaptcha module

This package provides protection for endpoints using [reCAPTCHA](https://www.google.com/recaptcha/about/) for [NestJS](https://docs.nestjs.com/) REST and GraphQL applications. By integrating with reCAPTCHA, this package helps to prevent automated abuse such as spam and bots, improving the security and reliability of your application.

[![NPM Version](https://img.shields.io/npm/v/@nestlab/google-recaptcha.svg)](https://www.npmjs.com/package/@nestlab/google-recaptcha)
[![Licence](https://img.shields.io/npm/l/@nestlab/google-recaptcha.svg)](https://github.com/chvarkov/google-recaptcha/blob/master/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/dm/@nestlab/google-recaptcha.svg)](https://www.npmjs.com/package/@nestlab/google-recaptcha)
[![Build status](https://github.com/chvarkov/google-recaptcha/actions/workflows/test.yml/badge.svg)](https://github.com/chvarkov/google-recaptcha/actions/workflows/test.yml)
[![Coverage Status](https://chvarkov.github.io/google-recaptcha/badges/coverage.svg)](https://github.com/chvarkov/google-recaptcha/actions)


## Table of Contents

* [Installation](#installation)
* [Changes](#changes)
* [Configuration](#configuration)
  * [Options](#options)
  * [REST application](#rest-application)
    * [reCAPTCHA v2](#rest-recaptcha-v2)
    * [reCAPTCHA v3](#rest-recaptcha-v3)
    * [reCAPTCHA Enterprise](#rest-recaptcha-enterprise)
  * [Graphql application](#graphql-application)
    * [reCAPTCHA v2](#graphql-recaptcha-v2)
    * [reCAPTCHA v3](#graphql-recaptcha-v3)
    * [reCAPTCHA Enterprise](#graphql-recaptcha-enterprise)
* [Usage](#usage)
  * [REST application](#usage-in-rest-application)
  * [Graphql application](#usage-in-graphql-application)
  * [Validate in service](#validate-in-service)
  * [Validate in service (Enterprise)](#validate-in-service-enterprise)
  * [Dynamic Recaptcha configuration](#dynamic-recaptcha-configuration)
  * [Error handling](#error-handling)
* [Contribution](#contribution)
* [License](#license)

Usage example [here](https://github.com/chvarkov/google-recaptcha-example)


## Installation

```
$ npm i @nestlab/google-recaptcha
```

The package is published as an ES module and requires Node.js `^22.12.0 || >=24`.
It works in both ESM and CommonJS applications: in CommonJS `require('@nestlab/google-recaptcha')` loads it via
[`require(esm)`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).
TypeScript projects compiled to CommonJS need `"module": "nodenext"` (TypeScript 5.8+) or `"moduleResolution": "node"` / `"node10"`; `"module": "node16"` is not supported.

## Changes

The list of changes made in the project can be found in the [CHANGELOG.md](./CHANGELOG.md) file.

## Configuration

### Options

**GoogleRecaptchaModuleOptions**

| Property          | Description |
|-------------------|-------------|
| `response`        | **Required.**<br> Type: `(request) => string`<br> Function that returns response (recaptcha token) by request |
| `type`            | **Required.**<br> Type: `'v2'` \| `'v3'` \| `'enterprise'`<br> reCAPTCHA type. Defines available options and checks: <br> `'v2'` - `secretKey` is required, `score` / `actions` are not available (reCAPTCHA v2 response has neither); <br> `'v3'` - `secretKey` is required, `score` and `actions` are checked for every successful response; <br> `'enterprise'` - `enterprise` is required. |
| `secretKey`       | Required for `'v2'` / `'v3'`.<br> Type: `string`<br> Google recaptcha secret key. Cannot be used with `enterprise` option. |
| `unsupportedChecks` | Optional.<br> Type: `'reject'` \| `'ignore'` <br> Default: `'reject'` <br> Decorator `score` / `action` checks for reCAPTCHA v2 (its response has neither): `'reject'` - `GoogleRecaptchaException` with `ErrorCode.UnsupportedCheck`, `'ignore'` - the checks are skipped. Use `'ignore'` when v2 / v3 is switched at runtime via `RecaptchaConfigRef.setOptions()`. |
| `debug`           | Optional.<br> Type: `boolean` <br> Default: `false` <br> Enables logging requests, responses, errors and transformed results |
| `logger`          | Optional.<br> Type: `Logger` <br> Default: `new Logger()` <br> Instance of custom logger that extended from Logger (@nestjs/common) |
| `skipIf`          | Optional.<br> Type: `boolean` \| `(request) => boolean \| Promise<boolean>` <br> Function that returns true if you allow the request to skip the recaptcha verification. Useful for involing other check methods (e.g. custom privileged API key) or for development or testing |
| `enterprise`      | Required for `'enterprise'`.<br> Type: `GoogleRecaptchaEnterpriseOptions` <br> Options for using reCAPTCHA Enterprise API. Cannot be used with `secretKey` and `siteVerifyUrl` options.  |
| `siteVerifyUrl`   | Optional.<br> Type: `GoogleRecaptchaSiteVerifyUrl` \| `string`<br> Default: `GoogleRecaptchaSiteVerifyUrl.Google` <br> URL of the siteverify API (not used by Enterprise). If your server has trouble connecting to https://google.com then you can use:<br> `GoogleRecaptchaSiteVerifyUrl.Google` = 'https://www.google.com/recaptcha/api/siteverify'<br>`GoogleRecaptchaSiteVerifyUrl.Recaptcha` = 'https://recaptcha.net/recaptcha/api/siteverify'<br> or set any api url |
| `score`           | Optional.<br> Type: `number` \| `(score: number) => boolean`<br> Score validator for reCAPTCHA v3 or enterprise. Not available for `type: 'v2'`. <br> `number` - minimum available score. <br> `(score: number) => boolean` - function with custom validation rules. |
| `actions`         | Optional.<br> Type: `string[]`<br> Available action list for reCAPTCHA v3 or enterprise. Not available for `type: 'v2'`. <br> You can make this check stricter by passing the action property parameter to `@Recaptcha(...)` decorator. |
| `remoteIp`        | Optional.<br> Type: `(request) => string`<br> A function that returns a remote IP address from the request |
| `axiosConfig`     | Optional.<br> Type: `AxiosRequestConfig`<br> Allows to setup proxy, response timeout, https agent etc...<br> `headers` and request-specific fields (`url`, `method`, `data`, etc.) are ignored. |
| `global`          | Optional.<br> Type: `boolean` <br> Default: `false` <br> Defines a module in the [global scope](https://docs.nestjs.com/modules#global-modules). Set `true` if `@Recaptcha()` is used in modules that do not import `GoogleRecaptchaModule`. |

**GoogleRecaptchaEnterpriseOptions**

| Property        | Description |
|-----------------|-------------|
| `projectId`     | **Required.**<br> Type: `string`<br> Google Cloud project ID |
| `siteKey`       | **Required.**<br> Type: `string`<br> [reCAPTCHA key](https://cloud.google.com/recaptcha-enterprise/docs/keys) associated with the site/app. |
| `apiKey`        | **Required.**<br> Type: `string`<br> API key associated with the current project. <br>Must have permission `reCAPTCHA Enterprise API`. <br> You can manage credentials [here](https://console.cloud.google.com/apis/credentials). |


The module provides two static methods for configuration: `forRoot` and `forRootAsync`.

**forRoot**

> forRoot(options: GoogleRecaptchaModuleOptions): DynamicModule

The `forRoot` method accepts a `GoogleRecaptchaModuleOptions` object that configures the module. This method should be used in the root `AppModule`. <br/>Example usage:

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            type: 'v3',
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: req => req.headers.recaptcha,
        })
    ],
})
export class AppModule {
}
```

**forRootAsync**

> forRootAsync(options: ModuleAsyncOptions): DynamicModule

The `forRootAsync` method is similar to `forRoot`, but allows for asynchronous configuration.<br/>
It accepts a `GoogleRecaptchaModuleAsyncOptions` object that returns a configuration object or a Promise that resolves to a configuration object. <br/>
Read more about [ConfigService](https://docs.nestjs.com/techniques/configuration#getting-started) and [custom getter function](https://docs.nestjs.com/techniques/configuration#custom-getter-functions).

Example usage:

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => configService.googleRecaptchaOptions,
            inject: [ConfigService],
        })
    ],
})
export class AppModule {
}
```

### REST application

#### REST reCAPTCHA V2

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            type: 'v2',
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: req => req.headers.recaptcha,
            skipIf: process.env.NODE_ENV !== 'production',
        }),
    ],
})
export class AppModule {
}
```

**Tip: header names transforming to lower case.**

**For example:** If you send 'Recaptcha' header then use `(req) => req.headers.recaptcha`

<br/>

#### REST reCAPTCHA V3

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            type: 'v3',
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: req => req.headers.recaptcha,
            skipIf: process.env.NODE_ENV !== 'production',
            actions: ['SignUp', 'SignIn'],
            score: 0.8,
        }),
    ],
})
export class AppModule {
}
```

**Tip: header names transforming to lower case.**

**For example:** If you send 'Recaptcha' header then use `(req) => req.headers.recaptcha`

<br/>

#### REST reCAPTCHA Enterprise

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            type: 'enterprise',
            response: (req) => req.headers.recaptcha,
            skipIf: process.env.NODE_ENV !== 'production',
            actions: ['SignUp', 'SignIn'],
            score: 0.8,
            enterprise: {
                projectId: process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID,
                siteKey: process.env.RECAPTCHA_ENTERPRISE_SITE_KEY,
                apiKey: process.env.RECAPTCHA_ENTERPRISE_API_KEY,
            },
        }),
    ],
})
export class AppModule {
}
```

**Tip: header names transforming to lower case.**

**For example:** If you send 'Recaptcha' header then use `(req) => req.headers.recaptcha`

### Graphql application

#### Graphql reCAPTCHA V2

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            type: 'v2',
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: (req: IncomingMessage) => (req.headers.recaptcha || '').toString(),
            skipIf: process.env.NODE_ENV !== 'production',
        }),
    ],
})
export class AppModule {
}
```

**Tip: header names transforming to lower case.**

**For example:** If you send 'Recaptcha' header then use `(req: IncomingMessage) => (req.headers.recaptcha || '').toString()`

<br/>

#### Graphql reCAPTCHA V3

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            type: 'v3',
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: (req: IncomingMessage) => (req.headers.recaptcha || '').toString(),
            skipIf: process.env.NODE_ENV !== 'production',
            actions: ['SignUp', 'SignIn'],
            score: 0.8,
        }),
    ],
})
export class AppModule {
}
```

**Tip: header names transforming to lower case.**

**For example:** If you send 'Recaptcha' header then use `(req: IncomingMessage) => (req.headers.recaptcha || '').toString()`

<br/>

#### Graphql reCAPTCHA Enterprise

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            type: 'enterprise',
            response: (req: IncomingMessage) => (req.headers.recaptcha || '').toString(),
            skipIf: process.env.NODE_ENV !== 'production',
            actions: ['SignUp', 'SignIn'],
            score: 0.8,
            enterprise: {
                projectId: process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID,
                siteKey: process.env.RECAPTCHA_ENTERPRISE_SITE_KEY,
                apiKey: process.env.RECAPTCHA_ENTERPRISE_API_KEY,
            },
        }),
    ],
})
export class AppModule {
}
```

**Tip: header names transforming to lower case.**

**For example:** If you send 'Recaptcha' header then use `(req) => req.headers.recaptcha`


**Configuration for reCAPTCHA Enterprise**

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            type: 'enterprise',
            response: (req) => req.headers.recaptcha,
            skipIf: process.env.NODE_ENV !== 'production',
            actions: ['SignUp', 'SignIn'],
            score: 0.8,
            enterprise: { 
                projectId: process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID, 
                siteKey: process.env.RECAPTCHA_ENTERPRISE_SITE_KEY, 
                apiKey: process.env.RECAPTCHA_ENTERPRISE_API_KEY, 
            },
        }),
    ],
})
export class AppModule {
}
```

## Usage

### Usage in REST application

To protect your REST endpoints, you can use the `@Recaptcha` decorator.<br/>Example:

```typescript

@Controller('feedback')
export class FeedbackController {
    @Recaptcha()
    @Post('send')
    async send(): Promise<any> {
        // TODO: Your implementation.
    }
}

```

You can also override the default property that contains reCAPTCHA for a specific endpoint.<br/>

```typescript

@Controller('feedback')
export class FeedbackController {
    @Recaptcha({response: req => req.body.recaptha})
    @Post('send')
    async send(): Promise<any> {
        // TODO: Your implementation.
    }
}

```

Additionally, you can override reCAPTCHA v3 options.<br/>

```typescript

@Controller('feedback')
export class FeedbackController {
    @Recaptcha({response: req => req.body.recaptha, action: 'Send', score: 0.8})
    @Post('send')
    async send(): Promise<any> {
        // TODO: Your implementation.
    }
}

```

To get the verification result, you can use the @RecaptchaResult() decorator.<br/>

```typescript

@Controller('feedback')
export class FeedbackController {
    @Recaptcha()
    @Post('send')
    async send(@RecaptchaResult() recaptchaResult: RecaptchaVerificationResult): Promise<any> {
        console.log(`Action: ${recaptchaResult.action} Score: ${recaptchaResult.score}`);
        // TODO: Your implementation.
    }
}

```

If you want to use the Google reCAPTCHA guard in combination with other guards, you can use the `@UseGuards` decorator.<br/>
```typescript

@Controller('feedback')
export class FeedbackController {
    @SetRecaptchaOptions({action: 'Send', score: 0.8})
    @UseGuards(Guard1, GoogleRecaptchaGuard, Guard2)
    @Post('send')
    async send(): Promise<any> {
        // TODO: Your implementation.
    }
}

```

`@Recaptcha()` can also be set on a controller class: its options apply to all handlers, handler options override them.
If both the class and a handler have `@Recaptcha()`, the token is verified once per request with the merged options.<br/>
```typescript

@Recaptcha({action: 'Feedback'})
@Controller('feedback')
export class FeedbackController {
    @Recaptcha({score: 0.8}) // checks action 'Feedback' and score 0.8
    @Post('send')
    async send(): Promise<any> {
        // TODO: Your implementation.
    }
}

```

You can find a usage example in the following [link](https://github.com/chvarkov/google-recaptcha-example).

### Usage in Graphql application

To protect your resolver, use the `@Recaptcha` decorator.

```typescript
@Recaptcha()
@Resolver(of => Recipe)
export class RecipesResolver {
    @Query(returns => Recipe)
    async recipe(@Args('id') id: string): Promise<Recipe> {
        // TODO: Your implementation.
    }
}
```

Obtain verification result:

```typescript
@Recaptcha()
@Resolver(of => Recipe)
export class RecipesResolver {
    @Query(returns => Recipe)
    async recipe(@Args('id') id: string,
                 @RecaptchaResult() recaptchaResult: RecaptchaVerificationResult): Promise<Recipe> {
        console.log(`Action: ${recaptchaResult.action} Score: ${recaptchaResult.score}`);
        // TODO: Your implementation.
    }
}
```

You can override the default recaptcha property for a specific endpoint.

```typescript
@Recaptcha()
@Resolver(of => Recipe)
export class RecipesResolver {
    @Query(returns => Recipe)
    async recipe(@Args('id') id: string): Promise<Recipe> {
        // TODO: Your implementation.
    }

    // Overridden default header. This query using X-Recaptcha header 
    @Recaptcha({response: (req: IncomingMessage) => (req.headers['x-recaptcha'] || '').toString()})
    @Query(returns => [Recipe])
    recipes(@Args() recipesArgs: RecipesArgs): Promise<Recipe[]> {
        // TODO: Your implementation.
    }
}
```

### Validate in service

```typescript
@Injectable()
export class SomeService {
    constructor(private readonly recaptchaValidator: GoogleRecaptchaValidator) {
    }

    async someAction(recaptchaToken: string): Promise<void> {
        const result = await this.recaptchaValidator.validate({
            response: recaptchaToken,
            score: 0.8,
            action: 'SomeAction',
        });
        
        if (!result.success) {
            throw new GoogleRecaptchaException(result.errors);
        }
        // TODO: Your implemetation
    }
}
```

### Validate in service (Enterprise)

```typescript
@Injectable()
export class SomeService {
    constructor(private readonly recaptchaEnterpriseValidator: GoogleRecaptchaEnterpriseValidator) {
    }

    async someAction(recaptchaToken: string): Promise<void> {
        const result = await this.recaptchaEnterpriseValidator.validate({
            response: recaptchaToken,
            score: 0.8,
            action: 'SomeAction',
        });
        
        if (!result.success) {
            throw new GoogleRecaptchaException(result.errors);
        }
        
        const riskAnalytics = result.getEnterpriseRiskAnalytics();
        
        // TODO: Your implemetation
    }
}
```

### Dynamic Recaptcha configuration
The `RecaptchaConfigRef` class provides a convenient way to modify Recaptcha validation parameters within your application.
This can be particularly useful in scenarios where the administration of Recaptcha is managed dynamically, such as by an administrator.
The class exposes methods that allow the customization of various Recaptcha options.


**RecaptchaConfigRef API:**

```typescript
@Injectable()
class RecaptchaConfigRef {
  // Replaces type-dependent options at once and validates them: type, secretKey, siteVerifyUrl, enterprise, score, actions.
  // Omitted ones are reset. Use it to switch between v2, v3 and Enterprise keys. Throws on invalid options (config stays unchanged).
  setOptions(options: GoogleRecaptchaRuntimeOptions): this;

  // Sets the secret key for Recaptcha validation. Keeps type 'v2' / 'v3'; switches 'enterprise' to 'v3'.
  // Throws for an empty key (config stays unchanged).
  setSecretKey(secretKey: string): this;

  // Sets enterprise-specific options for Recaptcha validation (type becomes 'enterprise').
  // Throws if projectId / siteKey / apiKey is missing or empty (config stays unchanged).
  setEnterpriseOptions(options: GoogleRecaptchaEnterpriseOptions): this;

  // Sets the score threshold for Recaptcha validation. Throws for type 'v2'.
  setScore(score: ScoreValidator): this;

  // Sets conditions under which Recaptcha validation should be skipped.
  setSkipIf(skipIf: SkipIfValue): this;

  // Resets the keys: the guard behaves according to `whenNotConfigured` until setOptions() is called.
  clear(): this;

  // false while the keys are not set (forRootDeferred() before setOptions(), or after clear()).
  readonly isConfigured: boolean;
}
```

**Usage example:**

```typescript
@Injectable()
export class RecaptchaAdminService implements OnApplicationBootstrap {
	constructor(private readonly recaptchaConfigRef: RecaptchaConfigRef) {
	}

	async onApplicationBootstrap(): Promise<void> {
		// TODO: Pull recaptcha configs from your database 

		this.recaptchaConfigRef
			.setSecretKey('SECRET_KEY_VALUE')
			.setScore(0.3);
	}

	async updateSecretKey(secretKey: string): Promise<void> {
		// TODO: Save new secret key to your database

		this.recaptchaConfigRef.setSecretKey(secretKey);
	}
}
```

After call `this.recaptchaConfigRef.setSecretKey(...)` - `@Recaptcha` guard and `GoogleRecaptchaValidator` will use new secret key.

**Switching reCAPTCHA type at runtime** (e.g. an administrator replaces a v3 key with a v2 one):

```typescript
async updateRecaptcha(config: RecaptchaSettings): Promise<void> {
	// Validated before applying: an invalid config throws and the current one stays active.
	this.recaptchaConfigRef.setOptions(
		config.type === 'enterprise'
			? { type: 'enterprise', enterprise: config.enterprise, score: config.score }
			: config.type === 'v3'
				? { type: 'v3', secretKey: config.secretKey, score: config.score, actions: config.actions }
				: { type: 'v2', secretKey: config.secretKey },
	);
}
```

> **Switching to v2 and decorator checks.** reCAPTCHA v2 response has neither score nor action. If a route has
> `@Recaptcha({ action })` / `@Recaptcha({ score })` (or `@SetRecaptchaOptions(...)` with them), after switching to `type: 'v2'`
> every request to that route fails with `GoogleRecaptchaException` (`ErrorCode.UnsupportedCheck`, HTTP 500) - the check
> is not silently skipped, and the token is not sent to Google.
> If v2 / v3 is chosen at runtime (e.g. by an administrator) and routes have checks for v3, set `unsupportedChecks: 'ignore'`
> in the module options (`forRoot*()`): for v2 the decorator checks are skipped (logged in `debug` mode), for v3 / Enterprise they work as usual.
> Checks set in the module options (`score` / `actions`) are reset by `setOptions({ type: 'v2', ... })` and are not affected.

`setOptions()` changes only `type`, `secretKey`, `siteVerifyUrl`, `enterprise`, `score` and `actions`.
`response`, `remoteIp`, `skipIf`, `debug`, `logger` and `axiosConfig` are kept (`skipIf` can be changed via `setSkipIf()`).

**Keys are not known at startup** (e.g. they are set by an administrator and may be absent): use `forRootDeferred()`.
It accepts the same options as `forRoot()` except the keys (`type`, `secretKey`, `siteVerifyUrl`, `enterprise`, `score`, `actions`):
they are set later via `RecaptchaConfigRef.setOptions()`.

```typescript
@Module({
	imports: [
		GoogleRecaptchaModule.forRootDeferred({
			global: true,
			response: (req) => req.headers.recaptcha,
			// Guard behaviour until setOptions() is called (and after clear()):
			// 'reject' (default) - GoogleRecaptchaException with ErrorCode.NotConfigured (HTTP 500);
			// 'skip' - requests pass without verification.
			whenNotConfigured: 'reject',
		}),
	],
})
export class AppModule {}

@Injectable()
export class RecaptchaAdminService implements OnApplicationBootstrap {
	constructor(private readonly recaptchaConfigRef: RecaptchaConfigRef) {}

	async onApplicationBootstrap(): Promise<void> {
		const settings = await this.settingsRepository.findRecaptchaSettings();

		if (settings) {
			this.recaptchaConfigRef.setOptions(settings); // { type, secretKey | enterprise, score?, actions? }
		}
	}

	async disableRecaptcha(): Promise<void> {
		this.recaptchaConfigRef.clear(); // back to `whenNotConfigured`
	}
}
```

`forRootDeferredAsync()` takes the same `useFactory` / `useClass` / `useExisting` options as `forRootAsync()`.
`recaptchaConfigRef.isConfigured` tells whether the keys are set. While they are not, `setSecretKey()` and `setScore()` throw
(v2 or v3 is ambiguous: use `setOptions()`), and `GoogleRecaptchaValidator` / `GoogleRecaptchaEnterpriseValidator` throw
`GoogleRecaptchaException` with `ErrorCode.NotConfigured`.

If the keys are always present at startup, prefer `forRoot()` / `forRootAsync()` (e.g. load them from a database in `useFactory`):
a missing key is then a startup error instead of a runtime one.

> `RecaptchaConfigRef` is a provider of the `GoogleRecaptchaModule` instance. Call `forRoot*()` **once**
> (with `global: true` or re-export the module): each call creates its own `RecaptchaConfigRef`, and changes made
> through one of them are not visible to guards resolved from another.

### Error handling

**GoogleRecaptchaException**

`GoogleRecaptchaException` extends `HttpException` extends `Error`.

The `GoogleRecaptchaException` is an exception that can be thrown by the `GoogleRecaptchaGuard` when an error occurs. It extends the `HttpException` class provided by NestJS, which means that it can be caught by an ExceptionFilter in the same way as any other HTTP exception.

One important feature of the `GoogleRecaptchaException` is that it contains an array of Error Code values in the errorCodes property. These values  can be used to diagnose and handle the error.



| Error code                       | Description | Status code |
|----------------------------------|-------------|-------------|
| `ErrorCode.MissingInputSecret`   | The secret parameter is missing. (Returned by the reCAPTCHA API.) | 500         |
| `ErrorCode.InvalidInputSecret`   | The secret parameter is invalid or malformed. (Returned by the reCAPTCHA API.) | 500         |
| `ErrorCode.MissingInputResponse` | The response parameter is missing. (Returned by the reCAPTCHA API.) | 400         |
| `ErrorCode.InvalidInputResponse` | The response parameter is invalid or malformed. (Returned by the reCAPTCHA API.) | 400         |
| `ErrorCode.BadRequest`	       | The request is invalid or malformed. (Returned by the reCAPTCHA API.) | 500         |
| `ErrorCode.TimeoutOrDuplicate`   | The response is no longer valid: it is either too old or has already been used. (Returned by the reCAPTCHA API.) | 400         |
| `ErrorCode.UnknownError`         | Unknown error. (Returned by the reCAPTCHA API.) | 500         |
| `ErrorCode.ForbiddenAction`      | Forbidden action. (Thrown by the guard when the received action does not match the expected one.) | 400         |
| `ErrorCode.LowScore`             | Low score. (Thrown by the guard when the received score is below the expected one.) | 400         |
| `ErrorCode.InvalidKeys`          | The keys were copied incorrectly, the wrong keys were used for the environment (e.g. development vs production), or the keys were revoked or deleted in the Google reCAPTCHA admin console. (Returned by the reCAPTCHA API.) | 400         |
| `ErrorCode.NetworkError`         | Network error (e.g. ECONNRESET, ECONNREFUSED). | 500         |
| `ErrorCode.UnsupportedCheck`     | `score` / `action` check (e.g. `@Recaptcha({ action })`) is requested for reCAPTCHA v2: its response has neither. | 500         |
| `ErrorCode.NotConfigured`        | Keys are not set: `forRootDeferred()` before `RecaptchaConfigRef.setOptions()`, or after `clear()`. | 500         |
| `ErrorCode.SiteMismatch`         | Site mismatch. (Returned by the reCAPTCHA Enterprise API only.) | 400         |
| `ErrorCode.BrowserError`         | Browser error. (Returned by the reCAPTCHA Enterprise API only.) | 400         |


**GoogleRecaptchaNetworkException**

The `GoogleRecaptchaNetworkException` is an exception that extends the `GoogleRecaptchaException` class and is thrown in the case of a network error. <br/> It contains a `networkErrorCode` property, which contains the error code of the network error, retrieved from the `code` property of the `AxiosError` object.

You can handle it via [ExceptionFilter](https://docs.nestjs.com/exception-filters).

Example exception filter implementation.

```typescript

@Catch(GoogleRecaptchaException)
export class GoogleRecaptchaFilter implements ExceptionFilter {
    catch(exception: GoogleRecaptchaException, host: ArgumentsHost): any {
        // TODO: Your exception filter implementation
    }
}

```

And add your filter to application

```typescript

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new ErrorFilter(), new GoogleRecaptchaFilter());
    await app.listen(3000);
}
bootstrap();


```

## Contribution

We welcome any contributions to improve our package! If you find a bug, have a feature request, or want to suggest an improvement, feel free to submit an issue on our GitHub repository.

If you want to contribute to the codebase directly, please follow our contributing guidelines outlined in the [CONTRIBUTING.md](./CONTRIBUTING.md) file in the repository.

We value the contributions of our community and appreciate all efforts to make this package better for everyone. Thank you for your support!

## License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE) file for details.
