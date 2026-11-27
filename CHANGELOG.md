# Changelog

## v4.0.0

### Breaking changes

- The package is published as an **ES module** only.
    - CommonJS applications load it via [`require(esm)`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require), no code changes needed.
    - TypeScript projects compiled to CommonJS need `"module": "nodenext"` (TypeScript 5.8+) or `"moduleResolution": "node"` / `"node10"`; `"module": "node16"` is not supported.
    - Deep imports (`@nestlab/google-recaptcha/...`) are no longer available: import everything from the package root.
- Node.js requirement: `>=20` ⇒ `^22.12.0 || >=24` (Node.js 20 is EOL, 22.12 is the first 22.x with `require(esm)` enabled by default).
- New required module option `type`: `'v2'` | `'v3'` | `'enterprise'`. It defines which options are available and which checks are performed:
    - `'v2'` - `secretKey` is required, `score` and `actions` are not allowed (reCAPTCHA v2 response has neither);
    - `'v3'` - `secretKey` is required, `score` and `actions` are checked for every successful response;
    - `'enterprise'` - `enterprise` is required, `secretKey` and `siteVerifyUrl` are not allowed.
- `GoogleRecaptchaModuleOptions` is a union of `GoogleRecaptchaV2ModuleOptions`, `GoogleRecaptchaV3ModuleOptions` and `GoogleRecaptchaEnterpriseModuleOptions`: invalid combinations (missing `type`, both `secretKey` and `enterprise`, `score` for v2, etc.) are compile errors. They are also validated at startup for JavaScript users and untyped configs: `secretKey` and `enterprise.projectId` / `siteKey` / `apiKey` must be non-empty strings.
- reCAPTCHA v3: a successful response without `action` / `score` (e.g. a v2 key configured as v3) is rejected with `forbidden-action` / `low-score` when `actions` / `score` are configured. Previously it was silently accepted as v2.
- reCAPTCHA v2: `@Recaptcha({ action, score })` throws `GoogleRecaptchaException` with `ErrorCode.UnsupportedCheck` (`unsupported-check`, HTTP 500) instead of silently skipping the checks. The token is not sent to Google. Set module option `unsupportedChecks: 'ignore'` to skip them (e.g. when v2 / v3 is switched at runtime).
- Option `network` renamed to `siteVerifyUrl`.
- Enum `GoogleRecaptchaNetwork` renamed to `GoogleRecaptchaSiteVerifyUrl` (values are unchanged).
- `RecaptchaConfigRef`:
    - the options passed to `forRoot()` / returned by `forRootAsync()` are copied: mutating that object no longer changes the config, use `RecaptchaConfigRef` setters;
    - `setEnterpriseOptions()` sets `type: 'enterprise'` and resets `secretKey` and `siteVerifyUrl`;
    - `setSecretKey()` keeps `type: 'v2'` / `'v3'` and switches `'enterprise'` to `'v3'`;
    - `setScore()` throws for `type: 'v2'`;
    - `setSecretKey()` / `setEnterpriseOptions()` validate the new config (empty `secretKey`, missing or empty `projectId` / `siteKey` / `apiKey`) and throw without changing the current one;
    - `valueOf` is `GoogleRecaptchaConfig`: `type`, `secretKey` and `enterprise` are `undefined` while not configured (`forRootDeferred()`, `clear()`);
    - `setSecretKey()` / `setScore()` throw while not configured;
    - setters replace the options object instead of mutating it: read `configRef.valueOf` each time instead of keeping a reference to it.
- `score` moved from `GoogleRecaptchaGuardOptions` to the validator options (`GoogleRecaptchaModuleOptions` still contains it).
- Stricter result types:
    - default generic of `RecaptchaVerificationResult` is `RecaptchaNativeResponse` (`VerifyResponseV2 | VerifyResponseV3 | VerifyResponseEnterprise | undefined`) instead of an `any`-based object;
    - `toObject()` returns `RecaptchaVerificationResultOptions<Res>`;
    - `GoogleRecaptchaEnterpriseValidator` returns `RecaptchaVerificationResult<VerifyResponseEnterprise | undefined>`: `nativeResponse` is `undefined` on HTTP error.
- Module option `global` is `false` by default. The documentation always stated `false`, but the module was actually registered as global (`true`); the code now matches the documentation.
  If `@Recaptcha()` is used in controllers or resolvers of modules that do not import `GoogleRecaptchaModule`, the application fails at startup with `Nest can't resolve dependencies of the GoogleRecaptchaGuard`. Set `global: true` (in `forRoot()` / `forRootAsync()`) or re-export the configured module from a shared module and import that module where `@Recaptcha()` is used:
  `@Module({ imports: [GoogleRecaptchaModule.forRoot({...})], exports: [GoogleRecaptchaModule] })`.
- Default axios `timeout`: 60s ⇒ 10s. Can be changed via `axiosConfig.timeout`.
- Error messages are reworded (e.g. `Low recaptcha score.` ⇒ `Low reCAPTCHA score.`). Use `GoogleRecaptchaException.errorCodes` instead of matching messages.

#### Migration

```diff
 GoogleRecaptchaModule.forRoot({
+    type: 'v3',
+    global: true, // if @Recaptcha() is used outside the module that imports GoogleRecaptchaModule
     secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
     response: (req) => req.headers.recaptcha,
-    network: GoogleRecaptchaNetwork.Recaptcha,
+    siteVerifyUrl: GoogleRecaptchaSiteVerifyUrl.Recaptcha,
     score: 0.8,
 });

 GoogleRecaptchaModule.forRoot({
+    type: 'enterprise',
     response: (req) => req.headers.recaptcha,
     enterprise: { projectId, siteKey, apiKey },
 });
```

For reCAPTCHA v2 use `type: 'v2'` and remove `score` / `actions` from the module options and `@Recaptcha(...)` decorators.

### Added

- Module option `unsupportedChecks`: `'reject'` (default) or `'ignore'` - decorator `score` / `action` checks for reCAPTCHA v2. Type `GoogleRecaptchaUnsupportedChecks` is exported.
- `GoogleRecaptchaModule.forRootDeferred()` / `forRootDeferredAsync()`: start without keys when they are set at runtime (e.g. by an administrator) via `RecaptchaConfigRef.setOptions()`. Option `whenNotConfigured`: `'reject'` (default) or `'skip'`.
- `RecaptchaConfigRef.isConfigured` and `RecaptchaConfigRef.clear()`.
- `ErrorCode.NotConfigured` (`not-configured`, HTTP 500): keys are not set.
- Exported types `GoogleRecaptchaDeferredModuleOptions`, `GoogleRecaptchaDeferredModuleAsyncOptions`, `GoogleRecaptchaWhenNotConfigured`, `GoogleRecaptchaConfig`. `GoogleRecaptchaModuleAsyncOptions` and `GoogleRecaptchaOptionsFactory` accept the options type as a generic parameter.
- `RecaptchaConfigRef.setOptions()`: replaces `type`, `secretKey`, `siteVerifyUrl`, `enterprise`, `score` and `actions` at once with validation. Allows switching between v2, v3 and Enterprise at runtime without restart (in v3.x the v2/v3 type was detected from the response). Type `GoogleRecaptchaRuntimeOptions` is exported.
- Support Node.js 26.
- Public types exported from the package root: module, guard and validator options (including per-type variants), `GoogleRecaptchaType`, `GoogleRecaptchaModuleAsyncOptions`, `GoogleRecaptchaOptionsFactory`, `VerifyResponseDecoratorOptions`, `VerifyResponseOptions`, `VerifyResponseV2`, `VerifyResponseV3`, `VerifyResponseEnterprise*`, `ScoreValidator`, `SkipIfValue`, `RecaptchaResponseProvider`, `RecaptchaRemoteIpProvider`, `RecaptchaNativeResponse`, `RecaptchaVerificationResultOptions`, `GoogleRecaptchaEnterpriseOptions`.
- Exported enum `GoogleRecaptchaEnterpriseReason`.
- GraphQL: the request is resolved from `req`, `request` or `reply.request` of the GraphQL context (Apollo and Mercurius on Express / Fastify). A clear error is thrown if the request is not exposed in the context.
- `@nestjs/graphql` is declared as an optional peer dependency (`>=8.0.0 <15.0.0`).
- Packages are published with npm provenance.

### Fixed

- `@Recaptcha(...)` options set on a controller class were ignored.
- `@Recaptcha(...)` on both a controller class and a handler verified the same token twice, and the second check failed with `timeout-or-duplicate`. Now the token is verified once per request and handler with the merged options.
- `score: 0` in `@Recaptcha(...)` was replaced by the module `score`.
- reCAPTCHA secret key was logged in plain text in `debug` mode; now it is masked.
- `RecaptchaConfigRef` setters mutated the options object passed to `forRoot()`.
- An exception thrown by the logger in `debug` mode turned a successful verification into `unknown-error` (or escaped from the guard). Logger errors are now ignored.
- An empty siteverify / Enterprise assessment response (2xx with an empty or `null` body) failed with `TypeError`; now it results in `unknown-error`.
- `skipIf` did not accept a callback with a typed request parameter (`(req: Request) => boolean`).

## v3.12.0
- Support NestJS 12. Upgraded peer dependencies versions:
    - `@nestjs/common`: >=8.0.0 <13.0.0
    - `@nestjs/core`: >=8.0.0 <13.0.0

- Added `engines` requirement: Node.js >=20
- Replaced deprecated `querystring` with `URLSearchParams` for building the verify request body.
- Upgraded axios 1.19.0 ⇒ 1.21.1

## v3.11.3
- Upgraded axios 1.16.0 ⇒ 1.19.0

## v3.11.2
- Upgraded axios 1.13.5 ⇒ 1.16.0

## v3.11.1
- Upgraded axios 1.13.2 => 1.13.5

## v3.11.0
- Upgraded axios 1.8.4 => 1.13.2

## v3.10.0
- Upgraded axios 1.7.7 => 1.8.4

## v3.9.0
- Support NestJS 11. Upgraded peer dependencies versions:
    - `@nestjs/common`: >=8.0.0 <12.0.0
    - `@nestjs/core`: >=8.0.0 <12.0.0

- Fixed getting `networkErrorCode` from `AxiosError`
- Upgraded axios 1.7.4 => 1.7.7

## v3.8.0
- Updated `GoogleRecaptchaModuleAsyncOptions` interface

## v3.7.0
- Added `RecaptchaConfigRef` for dynamic configuration

## v3.6.0
- Added `remoteIp?: (req) => string` option into:
  - Module options
  - Decorator options to override default
  - Validator options

## v3.5.0
- Added `global?: boolean` module option

## v3.4.1
- Fixed import LiteralObject for NestJS 10

## v3.4.0
- Upgraded peer dependencies versions:
	- `@nestjs/common`: >=8.0.0 <11.0.0
	- `@nestjs/core`: >=8.0.0 <11.0.0

## v3.3.1
- Reworked readme docs.
- Added changelog file.

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
