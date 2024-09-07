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

## Changes

The list of changes made in the project can be found in the [CHANGELOG.md](./CHANGELOG.md) file.

## Configuration

### Options

**GoogleRecaptchaModuleOptions**

| Property          | Description |
|-------------------|-------------|
| `response`        | **Required.**<br> Type: `(request) => string`<br> Function that returns response (recaptcha token) by request |
| `secretKey`       | Optional.<br> Type: `string`<br> Google recaptcha secret key. Must be set if you don't use reCAPTCHA Enterprise |
| `debug`           | Optional.<br> Type: `boolean` <br> Default: `false` <br> Enables logging requests, responses, errors and transformed results |
| `logger`          | Optional.<br> Type: `Logger` <br> Default: `new Logger()` <br> Instance of custom logger that extended from Logger (@nestjs/common) |
| `skipIf`          | Optional.<br> Type: `boolean` \| `(request) => boolean \| Promise<boolean>` <br> Function that returns true if you allow the request to skip the recaptcha verification. Useful for involing other check methods (e.g. custom privileged API key) or for development or testing |
| `enterprise`      | Optional.<br> Type: `GoogleRecaptchaEnterpriseOptions` <br> Options for using reCAPTCHA Enterprise API. Cannot be used with `secretKey` option.  |
| `network`         | Optional.<br> Type: `GoogleRecaptchaNetwork` \| `string`<br> Default: `GoogleRecaptchaNetwork.Google` <br> If your server has trouble connecting to https://google.com then you can set networks:<br> `GoogleRecaptchaNetwork.Google` = 'https://www.google.com/recaptcha/api/siteverify'<br>`GoogleRecaptchaNetwork.Recaptcha` = 'https://recaptcha.net/recaptcha/api/siteverify'<br> or set any api url |
| `score`           | Optional.<br> Type: `number` \| `(score: number) => boolean`<br> Score validator for reCAPTCHA v3 or enterprise. <br> `number` - minimum available score. <br> `(score: number) => boolean` - function with custom validation rules. |
| `actions`         | Optional.<br> Type: `string[]`<br> Available action list for reCAPTCHA v3 or enterprise. <br> You can make this check stricter by passing the action property parameter to `@Recaptcha(...)` decorator. |
| `remoteIp`        | Optional.<br> Type: `(request) => string`<br> A function that returns a remote IP address from the request |
| `axiosConfig`     | Optional.<br> Type: `AxiosRequestConfig`<br> Allows to setup proxy, response timeout, https agent etc... |
| `global`     		| Optional.<br> Type: `boolean` <br> Default: `false` Defines a module in the [global scope](https://docs.nestjs.com/modules#global-modules). |

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
  // Sets the secret key for Recaptcha validation.
  setSecretKey(secretKey: string): this;

  // Sets enterprise-specific options for Recaptcha validation
  setEnterpriseOptions(options: GoogleRecaptchaEnterpriseOptions): this;

  // Sets the score threshold for Recaptcha validation.
  setScore(score: ScoreValidator): this;

  // Sets conditions under which Recaptcha validation should be skipped.
  setSkipIf(skipIf: SkipIfValue): this;
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

### Error handling

**GoogleRecaptchaException**

`GoogleRecaptchaException` extends `HttpException` extends `Error`.

The `GoogleRecaptchaException` is an exception that can be thrown by the `GoogleRecaptchaGuard` when an error occurs. It extends the `HttpException` class provided by NestJS, which means that it can be caught by an ExceptionFilter in the same way as any other HTTP exception.

One important feature of the `GoogleRecaptchaException` is that it contains an array of Error Code values in the errorCodes property. These values  can be used to diagnose and handle the error.



| Error code                       | Description | Status code |
|----------------------------------|-------------|-------------|
| `ErrorCode.MissingInputSecret`   | The secret parameter is missing. (Throws from reCAPTCHA api). | 500         |
| `ErrorCode.InvalidInputSecret`   | The secret parameter is invalid or malformed. (Throws from reCAPTCHA api). | 500         |
| `ErrorCode.MissingInputResponse` | The response parameter is missing. (Throws from reCAPTCHA api). | 400         |
| `ErrorCode.InvalidInputResponse` | The response parameter is invalid or malformed. (Throws from reCAPTCHA api). | 400         |
| `ErrorCode.BadRequest`	       | The request is invalid or malformed. (Throws from reCAPTCHA api). | 500         |
| `ErrorCode.TimeoutOrDuplicate`   | The response is no longer valid: either is too old or has been used previously. (Throws from reCAPTCHA api). | 400         |
| `ErrorCode.UnknownError`         | Unknown error. (Throws from reCAPTCHA api). | 500         |
| `ErrorCode.ForbiddenAction`      | Forbidden action. (Throws from guard when expected action not equals to received). | 400         |
| `ErrorCode.LowScore`             | Low score (Throws from guard when expected score less than received). | 400         |
| `ErrorCode.InvalidKeys`          | keys were copied incorrectly, the wrong keys were used for the environment (e.g. development vs production), or if the keys were revoked or deleted from the Google reCAPTCHA admin console.. (Throws from reCAPTCHA api). | 400         |
| `ErrorCode.NetworkError`         | Network error (like ECONNRESET, ECONNREFUSED...). | 500         |
| `ErrorCode.SiteMismatch`         | Site mismatch (Throws from reCAPTCHA Enterprise api only). | 400         |
| `ErrorCode.BrowserError`         | Browser error (Throws from reCAPTCHA Enterprise api only). | 400         |


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
