# Changelog

## v3.3.0
- Reworked to use axios instead of @nestjs/axios.
- Removed peer dependencies:
  - `@nestjs/axios`
  - `rxjs`

## v3.2.0

- Upgraded peer dependencies versions:
  - `@nestjs/axios`: >=1.0.0 <2.0.0
  - `axios`: >=1.0.0 <2.0.0

## v3.1.9

- Declared used axios package as peerDependency.

## v3.1.8

- Fixed async module options type in ts strict mode.
- Declared used `rxjs` package as peerDependency.

## v3.1.7

- Smallfix with logging recaptcha results.
- Fixed resolving error codes for enterprise validator.

## v3.1.6

- Fixed handling enterprise response without token properties info.

## v3.1.5

- Fixed recaptcha enterprise error handling.

## v3.1.4

- Fixed instance of response for recaptcha v2.
- Fixed error handling for recaptcha enterprise.
- Internal fixes.
- Test coverage.

## v3.1.3

- Fixed response type for `RecaptchaVerificationResult.getEnterpriseRiskAnalytics()`.

## v3.1.2

- Fixed http exception statuses for error codes: `site-mismatch`, `browser-error` (HTTP status - 400).
- Added error code: `incorrect-captcha-sol`.

## v3.1.1

- Minor type fixes by eslint rules.
- Fixes in: README.md, package.json.

## v3.1.0

- Added support reCAPTCHA Enterprise API.
- Updated module options:
  - Updated `secretKey` as optional (shouldn't use for enterprise configuration).
  - Added `enterprise` option

| Property                        | Description |
|---------------------------------|-------------|
| `enterprise.projectId`     | **Required.**<br> Type: `string`<br> Google Cloud project ID |
| `enterprise.siteKey`       | **Required.**<br> Type: `string`<br> [reCAPTCHA key](https://cloud.google.com/recaptcha-enterprise/docs/keys) associated with the site/app. |
| `enterprise.apiKey`        | **Required.**<br> Type: `string`<br> API key associated with the current project. <br>Must have permission `reCAPTCHA Enterprise API`. <br> You can manage credentials [here](https://console.cloud.google.com/apis/credentials). |

**Updated GoogleRecaptchaValidator interface**

```typescript
class GoogleRecaptchaValidator {
    validate(options: VerifyResponseOptions): Promise<RecaptchaVerificationResult<VerifyResponseV3>>;
}
``` 

**Addded recaptcha validator for enterprise**

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
        
        console.log('score', riskAnalysis.score);
        console.log('score', riskAnalysis.reasons);

        // TODO: Your implemetation
    }
}
```


## v3.0.3

- Updated README.md.

## v3.0.2

- Added debug mode and logging
- Added module options
  - `debug?: boolean` enables debug mode
  - `logger?: Logger` instance of Logger from @nestjs/common or extended from this

## v3.0.1

- Fixed published root dir

## v3.0.0

- Compat with NestJS 9
- Removed deprecated options:
  - `applicationType?: ApplicationType` (now detect it automatically)
  - `agent?: https.Agent` (use option axiosConfig.httpsAgent)

## v2.1.2

- Fixed decorators reexports

## v2.1.1

- Removed source maps. Little fixes in readme file.

## v2.1.0

- Added request type auto detection from execution context`applicationType` configuration option marked as deprecated. Will removed in next major release.

## v2.0.8

- Fixed README.md.

## 2.0.7

- Added axiosConfig: AxiosRequestConfig option.
- Option agent?: https.Agent marked as deprecated.
- Added GoogleRecaptchaNetworkException.

## v2.0.6

- Added support NestJS 8.
- Dynamic loading HttpModule from `@nestjs/axios` or `@nestjs/common`.

## v2.0.5

- Fixed dynamic module loading.

## v2.0.4

- Added `RecaptchaResult` decorator.

## v2.0.3

- Added `SetRecaptchaOptions` decorator.

## v2.0.2

- Added error handling for invalid-keys.

## v2.0.1

- Removed console.log

## v2.0.0

- Added validation by action and score for reCAPTCHA v3.
- Updated external interfaces. Affected places:
  -  service GoogleRecaptchaValidator
  -  decorator Recaptcha
  -  module options (added optional default parameters)

## v1.2.4

- Fixed readme.

## v.1.2.3

- Updated readme. Added example to use validation in service.

## v1.2.2

- Added support GraphQL.

## v1.2.1

- Added LICENSE, CONTRIBUTING.md to build. Fixed readme.

## v1.2.0

- Updated google recaptcha module options.
- Removed option useRecaptchaNet: boolean
- Added option: network: GoogleRecaptchaNetwork | string <br>If your server has trouble connecting to 'https://google.com' then you can set networks:
<br/>GoogleRecaptchaNetwork.Google = 'https://www.google.com/recaptcha/api/siteverify'
</br>GoogleRecaptchaNetwork.Recaptcha = 'https://recaptcha.net/recaptcha/api/siteverify'
or set any api url

## v1.1.11

Removed unused dev dependencies. Updated readme.

## v1.1.10

- Extended peer dependencies versions:
	- @nestjs/core: >=6.0.0 <8.0.0
	- @nestjs/common: >=6.0.0 <8.0.0

## v1.1.9

- Fixed global option for `forRootAsync` method.

## v1.1.8

- Module declared as global.

## v1.1.7

- Fixed readme.md file.

## v1.1.6

- Updated `skipIf` option to `boolean | ((request: any) => boolean | Promise<boolean>)`

## v1.1.5

- Updated skipIf argument from `() => boolean` to `(request) => boolean | Promise<boolean>`.

## v1.1.4

- Added option to use recaptcha.net and agent support.

## v1.1.3

- Async module initialization.

## v1.1.2

- Added override ability default recaptcha property.

## v1.1.1

- Updated `GoogleRecaptchaException`.


## v1.1.0

- Added `GoogleRecaptchaException`. Error handling via exception filter.

## v1.0.13

- Reexported types
