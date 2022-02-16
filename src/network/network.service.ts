import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import * as FormData from 'form-data';
import {
  BYJUS_AUTH_URL,
  BYJUS_SIGN_IN_URL,
} from 'src/shared/constants/code-constants';

@Injectable()
export class NetworkService {
  async loginAccount(username: string, password: string) {
    return await axios({
      method: 'get',
      url: BYJUS_AUTH_URL,
      maxRedirects: 1,
    })
      .then((response) => {
        const cookie = response.headers['set-cookie'];
        const authenticity_token = response.data.match(
          /csrf-token"\scontent="(.+)"/,
        )[1];

        const data = new FormData();
        data.append('utf8', 'true');
        data.append('authenticity_token', authenticity_token);
        data.append('user[login]', username);
        data.append('user[password]', password);

        const config: AxiosRequestConfig = {
          method: 'post',
          url: BYJUS_SIGN_IN_URL,
          headers: {
            ['Cookie']: cookie[0],
            ...data.getHeaders(),
          },
          maxRedirects: 0,
          data: data,
        };

        return axios(config);
      })
      .catch((resp) => {
        const cookie = resp.response.headers['set-cookie'];
        const redirectUri = resp.response.headers.location;

        return axios({
          method: 'get',
          url: redirectUri,
          maxRedirects: 0,
          headers: {
            ['Cookie']: cookie,
          },
        });
      })
      .catch((resp) => ({
        username,
        token: resp.response.headers.location.match(
          /access_token=([a-f0-9]+)/i,
        )[1],
      }));
  }
}
