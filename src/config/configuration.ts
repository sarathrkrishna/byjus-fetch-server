import { DEF_ENV, DEF_PORT } from 'src/shared/constants/system-constants';
import { ConfigDto, EnvType } from './config.dto';

export default (): ConfigDto => ({
  port: parseInt(process.env.PORT, 10) || DEF_PORT,
  env: (process.env.NODE_ENV as EnvType) || DEF_ENV,
});
