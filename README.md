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
            skipIf: req => process.env.NODE_ENV !== 'production',
            onError: () => {
                throw new BadRequestException('Invalid recaptcha.')
            }
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

Enjoy!
