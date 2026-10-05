import { FirebaseOptions } from 'firebase/app';
import { ServiceAccount } from 'firebase-admin';

export interface PostgresConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface S3Config {
  host: string;
  port: number;
  useSSL: boolean;
  region: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  webUrl: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
}

export interface FastApiConfig {
  host: string;
  port: number;
}

export interface FirebaseConfig {
  config: FirebaseOptions;
  serviceAccountKey: ServiceAccount;
}

export interface AppConfig {
  port: number;
  jwtSecret: string;
  postgres: PostgresConfig;
  s3: S3Config;
  redis: RedisConfig;
  fastapi: FastApiConfig;
  googleClientId: string;
  firebase: FirebaseConfig;
  frontendUrl: string;
}
