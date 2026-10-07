import axios from 'axios'
import config from '../../config.json'

/** REST base URL of the data server — change it in config.json. */
export const DEMO_SERVER_URL: string = config.DataServerURL

/** Shared axios instance; every request path is relative to `<server>/api`. */
export const api = axios.create({ baseURL: `${DEMO_SERVER_URL}/api` })
