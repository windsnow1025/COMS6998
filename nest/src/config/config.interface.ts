export interface PostgresConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AppConfig {
  port: number;
  postgres: PostgresConfig;
}
