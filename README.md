# Google recaptcha module
[![NPM Version](https://img.shields.io/npm/v/@nestlab/google-recaptcha.svg)](https://www.npmjs.com/package/@nestlab/google-recaptcha)
[![Licence](https://img.shields.io/npm/l/@nestlab/google-recaptcha.svg)](https://github.com/chvarkov/google-recaptcha/blob/master/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/dm/@nestlab/google-recaptcha.svg)](https://www.npmjs.com/package/@nestlab/google-recaptcha)
[![Circle CI build](https://img.shields.io/circleci/build/github/chvarkov/google-recaptcha/master)](https://github.com/chvarkov/google-recaptcha/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/chvarkov/google-recaptcha/badge.svg?branch=master)](https://coveralls.io/github/chvarkov/google-recaptcha?branch=master)

The [NestJS](https://docs.nestjs.com/) module to protect your endpoints via [google recaptcha](https://www.google.com/recaptcha/about/).

Supported for HTTP and GraphQL [NestJS](https://docs.nestjs.com/) applications.

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
    -  [Validate in service](#validate-in-service)
    -  [Validate in service (enterprise)](#validate-in-service-enterprise)
    -  [Guard](#guard)
    -  [GraphQL guard](#graphql-guard)
- [Error handling](#error-handling)

Usage example [here](https://github.com/chvarkov/google-recaptcha-example)


## Installation

```
$ npm i @nestlab/google-recaptcha
```

## Configuration

**Configuration for REST application**

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: req => req.headers.recaptcha,
            skipIf: process.env.NODE_ENV !== 'production',
            network: GoogleRecaptchaNetwork.Recaptcha,
        })
    ],
})
export class AppModule {
}
```

**Configuration for reCAPTCHA V3**

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: (req: IncomingMessage) => (req.headers.recaptcha || '').toString(),
            skipIf: process.env.NODE_ENV !== 'production',
            actions: ['SignUp', 'SignIn'],
            score: 0.8,
        })
    ],
})
export class AppModule {
}
```

**Configuration for reCAPTCHA Enterprise**

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
        })
    ],
})
export class AppModule {
}
```

**Tip: header names transforming to lower case.**

**For example:** If you send 'Recaptcha' header then use `(req) => req.headers.recaptcha`

#### Configuration options

| Property          | Description |
|-------------------|-------------|
| `response`        | **Required.**<br> Type: `(request) => string`<br> Function that returns response (recaptcha token) by request |
| `secretKey`       | Optional.<br> Type: `string`<br> Google recaptcha secret key. Must be set if you don't use reCAPTCHA Enterprise |
| `debug`           | Optional.<br> Type: `boolean` <br> Default: `false` <br> Enables logging requests, responses, errors and transformed results |
| `logger`          | Optional.<br> Type: `Logger` <br> Default: `new Logger()` <br> Instance of custom logger that extended from Logger (@nestjs/common) |
| `skipIf`          | Optional.<br> Type: `boolean` \| `(request) => boolean \| Promise<boolean>` <br> Function that returns true if you allow the request to skip the recaptcha verification. Useful for involing other check methods (e.g. custom privileged API key) or for development or testing |
| `enterprise`      | Optional.<br> Type: [`GoogleRecaptchaEnterpriseOptions`](#GoogleRecaptchaEnterpriseOptions) <br> Options for using recCAPTCHA Enterprise API. Cannot using with `secretKey` option.  |
| `network`         | Optional.<br> Type: `GoogleRecaptchaNetwork` \| `string`<br> Default: `GoogleRecaptchaNetwork.Google` <br> If your server has trouble connecting to https://google.com then you can set networks:<br> `GoogleRecaptchaNetwork.Google` = 'https://www.google.com/recaptcha/api/siteverify'<br>`GoogleRecaptchaNetwork.Recaptcha` = 'https://recaptcha.net/recaptcha/api/siteverify'<br> or set any api url |
| `score`           | Optional.<br> Type: `number` \| `(score: number) => boolean`<br> Score validator for reCAPTCHA v3 or enterprise. <br> `number` - minimum available score. <br> `(score: number) => boolean` - function with custom validation rules. |
| `actions`         | Optional.<br> Type: `string[]`<br> Available action list for reCAPTCHA v3 or enterprise. <br> You can make this check stricter by passing the action property parameter to `@Recaptcha(...)` decorator. |
| `axiosConfig`     | Optional.<br> Type: `AxiosRequestConfig`<br> Allows to setup proxy, response timeout, https agent etc... |

#### GoogleRecaptchaEnterpriseOptions

| Property        | Description |
|-----------------|-------------|
| `projectId`     | **Required.**<br> Type: `string`<br> Google Cloud project ID |
| `siteKey`       | **Required.**<br> Type: `string`<br> [reCAPTCHA key](https://cloud.google.com/recaptcha-enterprise/docs/keys) associated with the site/app. |
| `apiKey`        | **Required.**<br> Type: `string`<br> API key associated with the current project. <br>Must have permission `reCAPTCHA Enterprise API`. <br> You can manage credentials [here](https://console.cloud.google.com/apis/credentials). |

If you want import configs from your [ConfigService](https://docs.nestjs.com/techniques/configuration#getting-started) via [custom getter function](https://docs.nestjs.com/techniques/configuration#custom-getter-functions) that will return `GoogleRecaptchaModuleOptions` object.

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

## Usage

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

### Guard

Use `@Recaptcha` decorator to protect your endpoints.

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

You can override default property that contain recaptcha for specific endpoint.

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

Also you can override recaptcha v3 options.

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

Get verification result

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

If you want use google recaptcha guard in combination with another guards then you can use `@UseGuards` decorator.

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

### GraphQL guard

Use `@Recaptcha` decorator to protect your resolver.

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

You can override default property that contain recaptcha for specific query, mutation or subscription.

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

## Error handling

Google recaptcha guard will throw GoogleRecaptchaException on error.

**GoogleRecaptchaException**

`GoogleRecaptchaException` has data with google recaptcha error codes.

`GoogleRecaptchaException` ← `HttpException` ← `Error`.

**GoogleRecaptchaNetworkException**

`GoogleRecaptchaNetworkException` has error code `ErrorCode.NetworkError`.

`GoogleRecaptchaNetworkException` ← `GoogleRecaptchaException`

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

Enjoy!
