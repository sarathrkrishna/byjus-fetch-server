export type EnvType = 'development' | 'production' | 'staging';

export class ConfigDto {
  port: number;
  env: EnvType;
}
