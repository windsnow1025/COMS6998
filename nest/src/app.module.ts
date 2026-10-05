import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { createKeyv } from '@keyv/redis';
import configuration from './config/configuration';
import { AppConfig } from './config/config.interface';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { Image } from './images/image.entity';
import { Caption } from './captions/caption.entity';
import { CaptionsModule } from './captions/captions.module';
import { HumorFlavor } from './flavors/humor-flavor.entity';
import { FlavorsModule } from './flavors/flavors.module';
import { LlmCall } from './llm/llm-call.entity';
import { CaptionVote } from './votes/caption-vote.entity';
import { ImagesModule } from './images/images.module';
import { DailyBatch } from './batches/daily-batch.entity';
import { DailyBatchItem } from './batches/daily-batch-item.entity';
import { BatchesModule } from './batches/batches.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    // https://docs.nestjs.com/techniques/configuration
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    // https://docs.nestjs.com/techniques/database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<AppConfig>('app')!;
        return {
          type: 'postgres',
          host: config.postgres.host,
          port: config.postgres.port,
          username: config.postgres.user,
          password: config.postgres.password,
          database: config.postgres.database,
          entities: [
            User,
            Image,
            Caption,
            HumorFlavor,
            LlmCall,
            CaptionVote,
            DailyBatch,
            DailyBatchItem,
          ],
          synchronize: true,
          logging: ['query', 'error'],
          logger: 'advanced-console',
        };
      },
    }),
    // https://docs.nestjs.com/techniques/caching
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get<AppConfig>('app')!;
        const redisUrl = `redis://:${encodeURIComponent(config.redis.password)}@${config.redis.host}:${config.redis.port}`;

        const keyv = createKeyv(redisUrl);
        const redisClient = (keyv.store as KeyvRedis<unknown>).client;

        redisClient.on('error', (error: Error) =>
          console.error('error', error.message),
        );

        keyv.on('error', (error) => {
          console.error('error', error);
        });

        return {
          stores: [keyv],
        };
      },
    }),
    JwtModule,
    CoreModule,
    AuthModule,
    UsersModule,
    FilesModule,
    CaptionsModule,
    FlavorsModule,
    ImagesModule,
    BatchesModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // https://docs.nestjs.com/guards
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
