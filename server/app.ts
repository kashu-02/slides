import { Hono } from 'hono'
import root from './routes/root'

const app = new Hono()

app.route('/', root)

export default app
