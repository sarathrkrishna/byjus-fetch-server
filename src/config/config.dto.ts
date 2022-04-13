export type EnvType = "development" | "production" | "staging";

export class ConfigDto {
  port: number;
  env: EnvType;
  db_connection_string: string;
  tel_bot_token: string;
  domain_url: string;
  json_enc_key: string;
}
