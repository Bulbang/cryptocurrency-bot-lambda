import { boomify } from '@hapi/boom';
import axios, { AxiosError } from 'axios';
import { IListRecentOptions } from '../interfaces/CmcApi/IListRecentOptions';
import { IMetadataOptions } from '../interfaces/CmcApi/IMetadataOptions';

export class CmcApiController {
  static async listRecent(options: Partial<IListRecentOptions>) {
    try {
      const target = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
      const responce = await axios.get(target, {
        params: options,
        headers: {
          'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY!,
        },
      });

      return responce.data.data;
    } catch (error) {
      const err = error as AxiosError;
      return boomify(err, { statusCode: err.response!.status });
    }
  }

  static async getMetadata(options: IMetadataOptions) {
    try {
      const target = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/info';
      const responce = await axios.get(target, {
        params: options,
        headers: {
          'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY!,
        },
      });

      return responce.data.data[options.symbol];
    } catch (error) {
      return undefined;
    }
  }
}
