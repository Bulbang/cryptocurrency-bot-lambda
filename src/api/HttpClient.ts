import axios, { AxiosInstance, AxiosResponse } from 'axios'

declare module 'axios' {
    interface AxiosResponse<T = any> extends Promise<T> {}
}

export class HttpClient {
    protected readonly instance: AxiosInstance

    public constructor(baseURL: string) {
        this.instance = axios.create({ baseURL })

        this._initializeResponseInterceptor()
    }

    private _initializeResponseInterceptor = () => {
        this.instance.interceptors.response.use(this._handleResponse)
    }

    private _handleResponse = ({ data }: AxiosResponse) => data
}

export default HttpClient
