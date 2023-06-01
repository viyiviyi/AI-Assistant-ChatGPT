import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class WebDavClient {
  private axiosInstance: AxiosInstance;

  constructor(private baseUrl: string, private username: string, private password: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      auth: {
        username: username,
        password: password,
      },
    });
  }

  async get(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.get(path, config);
  }

  async head(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.head(path, config);
  }

  async put(path: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.put(path, data, config);
  }

  async delete(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.delete(path, config);
  }

  async mkcol(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.request({
      method: 'MKCOL',
      url: path,
      ...config,
    });
  }

  async copy(path: string, destination: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.request({
      method: 'COPY',
      url: path,
      headers: {
        Destination: destination,
      },
      ...config,
    });
  }

  async move(path: string, destination: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.request({
      method: 'MOVE',
      url: path,
      headers: {
        Destination: destination,
      },
      ...config,
    });
  }

  async options(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.request({
      method: 'OPTIONS',
      url: path,
      ...config,
    });
  }

  async propfind(path: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.request({
      method: 'PROPFIND',
      url: path,
      ...config,
    });
  }

  async proppatch(path: string, data: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return await this.axiosInstance.request({
      method: 'PROPPATCH',
      url: path,
      data: data,
      ...config,
    });
  }
}

// 使用示例
// const client = new WebDavClient('https://example.com', 'username', 'password');
// const response = await client.get('/path/to/resource');
// console.log(response.data);