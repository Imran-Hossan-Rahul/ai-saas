import mongoose from "mongoose";
import config from ".";
import logger from "./logger";
import wait from "../utils/wait";

const CIRCUIT_OPEN_DURATION = 30_000; // ms
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2_000;

mongoose.set("strictPopulate", true);
mongoose.set("strictQuery", true);

// Singleton cache — persists across hot-reloads in dev via global
global.__mongoose__ ||= { conn: null, promise: null, circuitOpen: false };
const cached = global.__mongoose__;

function activateCircuitBreaker() {
  cached.conn = null;
  cached.promise = null;
  cached.circuitOpen = true;
  logger.warn("All MongoDB connection attempts failed. Circuit breaker activated.");
  setTimeout(() => {
    cached.circuitOpen = false;
    logger.info("Circuit breaker reset. Ready to reconnect to MongoDB.");
  }, CIRCUIT_OPEN_DURATION);
}

async function attemptConnect(retries, delayMs) {
  try {
    const connection = await mongoose.connect(config.db.uri, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      connectTimeoutMS: 10_000,
      retryWrites: true,
      w: "majority",
    });
    logger.info("MongoDB connected successfully.");
    return connection;
  } catch (error) {
    if (retries === 0) {
      activateCircuitBreaker();
      throw error;
    }
    logger.warn(
      `MongoDB connection failed. Retrying in ${delayMs}ms. Retries left: ${retries}.`
    );
    await wait(delayMs);
    return attemptConnect(retries - 1, delayMs * 2);
  }
}

/**
 * Returns a cached Mongoose connection.
 * Deduplicates concurrent in-flight connection requests (thundering herd protection).
 * O(1) on subsequent calls — returns cached conn immediately.
 */
async function connectDb() {
  if (cached.circuitOpen) {
    logger.warn("Circuit breaker active — DB connection blocked temporarily.");
    throw new Error("Circuit breaker: DB connection blocked temporarily.");
  }

  // ✅ Already connected — O(1) fast path
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // ✅ Deduplicate concurrent calls — only one real connect() in flight
  if (!cached.promise) {
    cached.promise = attemptConnect(MAX_RETRIES, BASE_DELAY_MS)
      .then((conn) => {
        cached.conn = conn;
        return conn;
      })
      .catch((err) => {
        cached.promise = null; // Reset so next call retries
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDb;
