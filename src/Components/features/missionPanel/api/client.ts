import axios from 'axios'
import config from '../../../../../config.json'

/** REST base URL of the data server — change it in config.json. */
export const SERVER_URL: string = config.DataServerURL

/** Plain axios instance for the mission feature; paths are relative to `<server>/api`. */
export const api = axios.create({ baseURL: `${SERVER_URL}/api` })
