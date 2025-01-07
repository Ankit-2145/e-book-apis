import { config as conf } from "dotenv";

conf();

const _config = {
  port: process.env.PORT,
  databaseURI: process.env.MONGODB_CONNECTION_URI,
};

export const config = Object.freeze(_config);
