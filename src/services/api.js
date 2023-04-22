import axios from 'axios';
import TokenService from './token.service';

const API_URL = 'http://localhost:8080/api';
const LOGIN_URL = '/auth/signin';
const REFRESH_TOKEN_URL = '/auth/refreshtoken';
const CONTENT_TYPE = 'application/json';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': CONTENT_TYPE,
  },
});

// Interceptor de requisição
instance.interceptors.request.use(
  (config) => {
    const token = TokenService.getLocalAccessToken();
    if (token) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalConfig = error.config;

    // Trata o token expirado
    if (originalConfig.url !== LOGIN_URL && error.response) {
      if (error.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;

        try {
          const response = await instance.post(REFRESH_TOKEN_URL, {
            refreshToken: TokenService.getLocalRefreshToken(),
          });

          const { accessToken } = response.data;
          TokenService.updateLocalAccessToken(accessToken);

          return instance(originalConfig);
        } catch (_error) {
          return Promise.reject(_error);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
