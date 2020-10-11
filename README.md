# Google recaptcha module

Usage example [here](https://github.com/chvarkov/google-recaptcha-example)

### Install
```
$ npm i @nestlab/google-recaptcha
```

### Configuration

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

### Usage

```typescript

@Controller('feedback')
export class FeedbackController {
    @Recaptcha()
    @Post('send')
    async send(): Promise<any> {
        // TODO: Implement it.
    }
}

```

### Error handling

Example error customization. You can return or throw HttpException or return string.

If you will return string, then response will have status code 400 (Bad request).

```typescript
GoogleRecaptchaModule.forRoot({
    secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
    response: req => req.headers.recaptcha,
    skipIf: () => process.env.NODE_ENV !== 'production',
    onError: (errorCodes: ErrorCode[]) => {
        switch (errorCodes.shift()) {
            case ErrorCode.MissingInputSecret:
                return 'The secret parameter is missing.';
            case ErrorCode.InvalidInputSecret:
                return 'The secret parameter is invalid or malformed.';
            case ErrorCode.MissingInputResponse:
                return 'The response parameter is missing.';
            case ErrorCode.InvalidInputResponse:
                return 'The response parameter is invalid or malformed.';
            case ErrorCode.BadRequest:
                return 'The request is invalid or malformed.';
            case ErrorCode.TimeoutOrDuplicate:
                return 'The response is no longer valid: either is too old or has been used previously.';
            case ErrorCode.UnknownError:
            default:
                return new BadGatewayException('Unknown error when checking captcha.');
        }
    },
})
```

Enjoy!
