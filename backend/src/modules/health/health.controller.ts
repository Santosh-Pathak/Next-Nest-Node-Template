import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  MongooseHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@common/decorators/authorization.decorator';

@ApiTags('health')
@SkipThrottle()
@Public()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Liveness — process is up (no external dependency checks).
   */
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok', info: { app: { status: 'up' } } };
  }

  /**
   * Readiness — Mongo required; disk optional via HEALTH_CHECK_DISK=true.
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (MongoDB)' })
  ready() {
    const checks: Array<() => Promise<HealthIndicatorResult>> = [
      () => this.mongoose.pingCheck('mongodb'),
    ];

    if (this.configService.get<boolean>('health.checkDisk')) {
      checks.push(() =>
        this.disk.checkStorage('disk', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.95,
        }),
      );
    }

    return this.health.check(checks);
  }
}
