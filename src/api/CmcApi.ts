import { AxiosError } from 'axios'
import { IListRecentOptions } from '../types/CmcApi/IListRecentOptions'
import { IMetadataOptions } from '../types/CmcApi/IMetadataOptions'
import HttpClient from './HttpClient'

export class CmcApi extends HttpClient {
    constructor() {
        super(`https://pro-api.coinmarketcap.com`)
    }
    listRecent = async (options: Partial<IListRecentOptions>) => {
        try {
            const target = '/v1/cryptocurrency/listings/latest'
            const responce = await this.instance.get(target, {
                params: options,
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY!,
                },
            })

            return responce.data
        } catch (error) {
            const err = error as AxiosError
            throw new Error(JSON.stringify(error))
        }
    }

    getMetadata = async (options: IMetadataOptions) => {
        try {
            const target = '/v1/cryptocurrency/info'
            const responce = await this.instance.get(target, {
                params: options,
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY!,
                },
            })

            return responce.data[options.symbol]
        } catch (error) {
            return undefined
        }
    }
}
