import mongoose from "mongoose";
import dns from "dns";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const shouldTrySrvFallback = (error) => {
    const msg = String(error?.message || "").toLowerCase();
    return (
        error?.code === "ECONNREFUSED" ||
        error?.code === "ENOTFOUND" ||
        error?.code === "ETIMEOUT" ||
        msg.includes("querysrv") ||
        msg.includes("srv")
    );
};

const parseTxtOptions = (txtRows = []) => {
    const params = new URLSearchParams();
    for (const row of txtRows) {
        const value = Array.isArray(row) ? row.join("") : String(row || "");
        const pieces = value.split("&");
        for (const piece of pieces) {
            const [rawKey, rawVal] = piece.split("=");
            const key = (rawKey || "").trim();
            const val = (rawVal || "").trim();
            if (key && !params.has(key)) {
                params.set(key, val);
            }
        }
    }
    return params;
};

const buildStandardMongoUriFromSrv = async (mongoSrvUri) => {
    const parsed = new URL(mongoSrvUri);
    const srvHost = parsed.hostname;

    const resolver = new dns.promises.Resolver();
    // Public resolvers are often more reliable than local DNS for Atlas SRV.
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);

    const [srvResult, txtResult] = await Promise.allSettled([
        resolver.resolveSrv(`_mongodb._tcp.${srvHost}`),
        resolver.resolveTxt(srvHost),
    ]);

    if (srvResult.status !== "fulfilled" || !srvResult.value?.length) {
        return null;
    }

    const hosts = srvResult.value.map((record) => `${record.name}:${record.port}`);
    const txtParams = txtResult.status === "fulfilled" ? parseTxtOptions(txtResult.value) : new URLSearchParams();

    const searchParams = new URLSearchParams(parsed.searchParams.toString());
    for (const [k, v] of txtParams.entries()) {
        if (!searchParams.has(k)) {
            searchParams.set(k, v);
        }
    }

    // Non-SRV URI needs explicit TLS for Atlas.
    if (!searchParams.has("tls") && !searchParams.has("ssl")) {
        searchParams.set("tls", "true");
    }

    const auth = parsed.username
        ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@`
        : "";
    const dbPath = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "";
    const query = searchParams.toString();

    return `mongodb://${auth}${hosts.join(",")}${dbPath}${query ? `?${query}` : ""}`;
};

const connectWithFallback = async (mongoUri) => {
    const options = {
        bufferCommands: false,
        family: 4,
        serverSelectionTimeoutMS: 15000,
        dbName: "stratos",
    };

    try {
        return await mongoose.connect(mongoUri, options);
    } catch (error) {
        const isSrvUri = mongoUri.startsWith("mongodb+srv://");
        if (!isSrvUri || !shouldTrySrvFallback(error)) {
            throw error;
        }

        const fallbackUri = await buildStandardMongoUriFromSrv(mongoUri);
        if (!fallbackUri) {
            throw error;
        }

        console.warn("MongoDB SRV lookup failed, retrying with resolved host list fallback.");
        return mongoose.connect(fallbackUri, options);
    }
};

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not set in environment variables");
    }

    if (!cached.promise) {
        cached.promise = connectWithFallback(mongoUri);
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error(`MongoDB connection error: ${error.message}`);
        throw error;
    }
};

export default connectDB;