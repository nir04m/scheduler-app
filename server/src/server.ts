import "dotenv/config";
import app from './app';
import { env } from "./config/env";

const PORT = Number(process.env.PORT) || 5000;

app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${env.PORT}`);
});