export const FETCH_CYCLE_CRON_NAME = "FETCH_CYCLE";
export const FETCH_CYCLE_CRON_TIME = "*/12 * * * * *";

export const BYJUS_AUTH_URL =
  "https://tllms.com/oauth/authorize?client_id=30cdc90c6b176d2e79c490176807bf9c16ac5bfef0cca89b74d0158174690b6e&redirect_uri=https%3A%2F%2Fexperts.tllms.com%2Fcallback&response_type=token&scope=profile+manage_doubts+manage_subject_experts+doubts_statistics&auth_type=email";
export const BYJUS_SIGN_IN_URL = "https://tllms.com/users/sign_in";
export const BYJUS_DOUBT_URL =
  "https://marketing.tllms.com/web/v1/doubt_management/posts";

export const DOUBT_ERROR_CODES = {
  noDoubts: {
    respCode: 400003,
    mapCode: 403,
  },
  alreadyFetched: {
    respCode: 400002,
    mapCode: 402,
  },
  tokenExp: {
    respCode: 401,
    mapCode: 401,
  },
  tooMuchReq: {
    respCode: 400429,
    mapCode: 429,
  },
  invalidTocken: {
    respCode: 400000,
    mapCode: 412,
  },
  unknownError: {
    mapCode: 400,
  },
};
