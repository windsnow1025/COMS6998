import * as process from 'node:process';
import { registerAs } from '@nestjs/config';
import { AppConfig } from './config.interface';

// https://docs.nestjs.com/techniques/configuration
export default registerAs('app', (): AppConfig => {
  const isProduction = process.env.ENV !== 'development';
  console.log(`Using ${isProduction ? 'production' : 'development'} setting.`);

  return {
    port: isProduction ? 3000 : 3001,
    postgres: {
      host: process.env.POSTGRES_HOST!,
      port: 5432,
      user: process.env.POSTGRES_USER!,
      password: process.env.POSTGRES_PASSWORD!,
      database: process.env.POSTGRES_DB!,
    },
    s3: {
      host: process.env.S3_HOST!,
      port: 9000,
      useSSL: false,
      region: 'us-east-1',
      accessKey: process.env.S3_ACCESS_KEY!,
      secretKey: process.env.S3_SECRET_KEY!,
      bucketName: process.env.S3_BUCKET_NAME!,
      webUrl: process.env.S3_WEB_URL!,
    },
    redis: {
      host: process.env.REDIS_HOST!,
      port: 6379,
      password: process.env.REDIS_PASSWORD!,
    },
  };
});
