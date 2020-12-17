# Google recaptcha module

The [NestJS](https://docs.nestjs.com/) module to protect your endpoints via [google recaptcha](https://www.google.com/recaptcha/about/).

- [Installation](#Installation)
- [Configuration](#Configuration)
- [Usage](#Usage)
- [Error handling](#ErrorHandling)

Usage example [here](https://github.com/chvarkov/google-recaptcha-example)


### Installation <a name="Installation"></a>

```
$ npm i @nestlab/google-recaptcha
```

### Configuration <a name="Configuration"></a>

```typescript
@Module({
    imports: [
        GoogleRecaptchaModule.forRoot({
            secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
            response: req => req.headers.recaptcha,
            skipIf: process.env.NODE_ENV !== 'production',
            useRecaptchaNet: false,
            agent: null
        })
    ],
})
export class AppModule {
}
```

**Configuration options**

| Property          | Description |
|-------------------|-------------|
| `secretKey`       | **Required.**<br> Type: `string`<br> Google recaptcha secret key |
| `response`        | **Required.**<br> Type: `(request) => string`<br> Function that returns response (recaptcha token) by request |
| `skipIf`          | Optional.<br> Type: `boolean` \| `(request) => boolean \| Promise<boolean>` <br> Function that returns true if you allow the request to skip the recaptcha verification. Useful for involing other check methods (e.g. custom privileged API key) or for development or testing |
| `useRecaptchaNet` | Optional.<br> Type: `boolean`<br> If your server has trouble connecting to https://www.google.com. You can use https://recaptcha.net instead, just set true |
| `agent`           | Optional.<br> Type: `https.Agent`<br> If you need to use an agent |

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

### Usage <a name="Usage"></a>

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

### Error handling <a name="ErrorHandling"></a>

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
