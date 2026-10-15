import 'dotenv/config';
import logger from './logger';
import validateEnvs from '@/utils/validateEnvs';


const requiredEnvs = [
    "PORT",
    "MONGODB_URI"
]

validateEnvs(requiredEnvs)
logger.info("All required environment variable are set");

const config = {
    port: process.env.PORT || 3000,
    db: {
        uri: process.env.MONGODB_URI
    }
}

export default config;