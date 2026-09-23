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
  };
});
