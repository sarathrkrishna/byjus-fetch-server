import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import * as FormData from "form-data";
import { ConfigDto } from "src/config/config.dto";
import {
  BYJUS_AUTH_URL,
  BYJUS_DOUBT_URL,
  BYJUS_SIGN_IN_URL,
  DOUBT_ERROR_CODES,
} from "src/shared/constants/code-constants";
import { DoubtCheckDto } from "src/tasks/dto/task.dto";
import { NetworkError } from "./network.error";

@Injectable()
export class NetworkService {
  // byjus doubt axios configuration

  private byjusDoubtAxiosConfig: AxiosInstance;
  private selfAxiosConfig: AxiosInstance;

  constructor(private readonly configService: ConfigService<ConfigDto>) {
    this.byjusDoubtAxiosConfig = axios.create({
      baseURL: BYJUS_DOUBT_URL,
      headers: {
        ["Content-Type"]: "application/json",
      },
    });

    this.selfAxiosConfig = axios.create({
      baseURL: this.configService.get("domain_url"),
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

  async handleCheckDoubt(
    token: string,
    doubtFetchedHandler: (postId: number) => Promise<DoubtCheckDto>,
    noDoubtsHandler: () => void,
    alreadyFetchedHandler: () => DoubtCheckDto,
    tokenExpiredHandler: () => Promise<void>,
    tooMuchRequestsHandler: () => Promise<DoubtCheckDto>,
    invalidTockenHandler: () => Promise<void>,
    unknownErrorHandler: (error: Error) => void
  ) {
    try {
      const {
        post: { id },
      } = (await this.checkAvailableDoubts(token)).data as {
        post: { id: number };
      };

      return await doubtFetchedHandler(id);
    } catch (error) {
      switch (error.code) {
        case DOUBT_ERROR_CODES.noDoubts.mapCode:
          noDoubtsHandler();
          return undefined;
        case DOUBT_ERROR_CODES.alreadyFetched.mapCode:
          return alreadyFetchedHandler();
        case DOUBT_ERROR_CODES.tokenExp.mapCode:
          await tokenExpiredHandler();
          return undefined;
        case DOUBT_ERROR_CODES.tooMuchReq.mapCode:
          return await tooMuchRequestsHandler();
        case DOUBT_ERROR_CODES.invalidTocken.mapCode:
          await invalidTockenHandler();
          return undefined;
        default:
          unknownErrorHandler(error);
          return undefined;
      }
    }
  }

  pingSelf() {
    return this.selfAxiosConfig.get("/ping");
  }
}
