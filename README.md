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
            skipIf: () => process.env.NODE_ENV !== 'production',
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
