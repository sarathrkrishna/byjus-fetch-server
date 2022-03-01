import { Injectable } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import * as FormData from "form-data";
import {
  BYJUS_AUTH_URL,
  BYJUS_DOUBT_URL,
  BYJUS_SIGN_IN_URL,
  DOUBT_ERROR_CODES,
} from "src/shared/constants/code-constants";
import { NetworkError } from "./network.error";

@Injectable()
export class NetworkService {
  // byjus doubt axios configuration

  private byjusDoubtAxiosConfig: AxiosInstance;

  constructor() {
    this.byjusDoubtAxiosConfig = axios.create({
      baseURL: BYJUS_DOUBT_URL,
      headers: {
        ["Content-Type"]: "application/json",
      },
    });
  }

  async loginAccount(username: string, password: string) {
    return await axios({
      method: "get",
      url: BYJUS_AUTH_URL,
      maxRedirects: 1,
    })
      .then((response) => {
        const cookie = response.headers["set-cookie"];
        const authenticity_token = response.data.match(
          /csrf-token"\scontent="(.+)"/
        )[1];

        const data = new FormData();
        data.append("utf8", "true");
        data.append("authenticity_token", authenticity_token);
        data.append("user[login]", username);
        data.append("user[password]", password);

        const config: AxiosRequestConfig = {
          method: "post",
          url: BYJUS_SIGN_IN_URL,
          headers: {
            ["Cookie"]: cookie[0],
            ...data.getHeaders(),
          },
          maxRedirects: 0,
          data: data,
        };

        return axios(config);
      })
      .catch((resp) => {
        const cookie = resp.response.headers["set-cookie"];
        const redirectUri = resp.response.headers.location;

        return axios({
          method: "get",
          url: redirectUri,
          maxRedirects: 0,
          headers: {
            ["Cookie"]: cookie,
          },
        });
      })
      .catch((resp) => ({
        username,
        token: resp.response.headers.location.match(
          /access_token=([a-f0-9]+)/i
        )[1],
      }));
  }

  async checkAvailableDoubts(token: string) {
    try {
      return await this.byjusDoubtAxiosConfig.get("pick", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      const errorCode = error.response?.data.error.code;
      switch (errorCode) {
        case DOUBT_ERROR_CODES.noDoubts.respCode:
          throw new NetworkError(
            DOUBT_ERROR_CODES.noDoubts.mapCode,
            "No doubts  available at the moment"
          );

        case DOUBT_ERROR_CODES.alreadyFetched.respCode:
          throw new NetworkError(
            DOUBT_ERROR_CODES.alreadyFetched.mapCode,
            "Doubt already fetched"
          );

        case DOUBT_ERROR_CODES.tokenExp.respCode:
          throw new NetworkError(
            DOUBT_ERROR_CODES.tokenExp.mapCode,
            "Token Expired, login again"
          );

        case DOUBT_ERROR_CODES.tooMuchReq.respCode:
          throw new NetworkError(
            DOUBT_ERROR_CODES.tooMuchReq.mapCode,
            "Too much requests"
          );
        case DOUBT_ERROR_CODES.invalidTocken.respCode:
          throw new NetworkError(
            DOUBT_ERROR_CODES.invalidTocken.mapCode,
            "Invalid token"
          );
        default:
          throw new NetworkError(
            DOUBT_ERROR_CODES.unknownError.mapCode,
            "Unknown error thrown"
          );
      }
    }
  }

  async getDoubtPost(token: string) {
    return await this.byjusDoubtAxiosConfig.get("", {
      headers: {
        authorization: `Bearer ${token}`,
      },
      params: { q: "pending", sort: "updated_at", direction: "desc" },
    });
  }
}
