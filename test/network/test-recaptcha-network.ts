import { Controller, INestApplication, Module, Post } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { LiteralObject } from '../../src/interfaces/literal-object';

@Controller('api')
class TestSiteVerifyController {
	private value: LiteralObject;

	@Post('siteverify')
	verify(): LiteralObject {
		return this.value;
	}

	setResult(value: LiteralObject): void {
		this.value = value;
	}
}

@Module({
	controllers: [TestSiteVerifyController],
})
class TestRecaptchaModule {}

export class TestRecaptchaNetwork {
	constructor(private readonly app: INestApplication, private readonly port: number) {}

	get url(): string {
		return `http://localhost:${this.port}/api/siteverify`;
	}

	setResult(value: LiteralObject): void {
		this.app.get(TestSiteVerifyController).setResult(value);
	}

	close(): Promise<void> {
		return this.app.close();
	}

	static async create(port: number): Promise<TestRecaptchaNetwork> {
		const app = await NestFactory.create(TestRecaptchaModule, { logger: false });
		await app.listen(port);

		return new TestRecaptchaNetwork(app, port);
	}
}
