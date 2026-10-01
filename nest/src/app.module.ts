import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { createKeyv } from '@keyv/redis';
import configuration from './config/configuration';
import { AppConfig } from './config/config.interface';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { Image } from './images/image.entity';
import { Caption } from './captions/caption.entity';
import { CaptionsModule } from './captions/captions.module';

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
          entities: [Image, Caption],
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
    FilesModule,
    CaptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
