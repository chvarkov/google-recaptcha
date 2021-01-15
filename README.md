# Google recaptcha module

The [NestJS](https://docs.nestjs.com/) module to protect your endpoints via [google recaptcha](https://www.google.com/recaptcha/about/).

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Error handling](#error-handling)

Usage example [here](https://github.com/chvarkov/google-recaptcha-example)


## Installation

```
$ npm i @nestlab/google-recaptcha
```

## Configuration

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: req => req.headers.recaptcha,
            skipIf: process.env.NODE_ENV !== 'production',
            network: GoogleRecaptchaNetwork.Recaptcha,
            agent: null
        })
    ],
})
export class AppModule {
}
```

**Configuration options**

| Property    | Description |
|-------------|-------------|
| `secretKey` | **Required.**<br> Type: `string`<br> Google recaptcha secret key |
| `response`  | **Required.**<br> Type: `(request) => string`<br> Function that returns response (recaptcha token) by request |
| `skipIf`    | Optional.<br> Type: `boolean` \| `(request) => boolean \| Promise<boolean>` <br> Function that returns true if you allow the request to skip the recaptcha verification. Useful for involing other check methods (e.g. custom privileged API key) or for development or testing |
| `network`   | Optional.<br> Type: `GoogleRecaptchaNetwork` \| `boolean`<br> Default: `GoogleRecaptchaNetwork.Google` <br> If your server has trouble connecting to https://google.com then you can set networks:<br> `GoogleRecaptchaNetwork.Google` = 'https://www.google.com/recaptcha/api/siteverify'<br>`GoogleRecaptchaNetwork.Recaptcha` = 'https://recaptcha.net/recaptcha/api/siteverify'<br> or set any api url |
| `agent`     | Optional.<br> Type: `https.Agent`<br> If you need to use an agent |

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
    @Recaptcha(req => req.body.recaptha)
    @Post('send')
    async send(): Promise<any> {
        // TODO: Your implementation.
    }
}

```

If you want use google recaptcha guard in combination with another guards then you can use `@UseGuards` decorator.

```typescript

@Controller('feedback')
export class FeedbackController {
    @UseGuards(Guard1, GoogleRecaptchaGuard, Guard2)
    @Post('send')
    async send(): Promise<any> {
        // TODO: Your implementation.
    }
}

```

### Error handling

Google recaptcha guard will throw GoogleRecaptchaException on error.

`GoogleRecaptchaException` has data with google recaptcha error codes.

`GoogleRecaptchaException` ← `HttpException` ← `Error`.

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
