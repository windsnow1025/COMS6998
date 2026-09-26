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

export interface AppConfig {
  port: number;
  postgres: PostgresConfig;
  s3: S3Config;
}
