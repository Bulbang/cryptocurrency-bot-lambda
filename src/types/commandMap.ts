import { Client } from '../controllers/Client'

export type Command = {
    handler: (bot: Client) => void
}
