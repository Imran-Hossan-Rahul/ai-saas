import logger from "@/lib/logger";


export default function validateEnvs(requiredEnvs){
    for(const env of requiredEnvs){
        if(!process.env[env]){
            logger.error(`Fatal Error: ${env} is missing in .env file`);
            process.exit(1);
        }
    }
}