import { createLogger, format, transports, Logger as WinLogger } from "winston";

import { logDir } from "./logDir";

const infoTransport = new transports.File({
    filename: "info.statistic.log",
    dirname: logDir,
    maxsize: 10000000,
    maxFiles: 100,
    level: "info",
});
export const infoLogger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp}: [${level === "info" ? level : level.toUpperCase()}] ${message}`;
        }),
    ),
    transports: [
        infoTransport,
    ],
});

const errorTransport = new transports.File({
    filename: "error.statistic.log",
    dirname: logDir,
    maxsize: 10000000,
    maxFiles: 100,
    level: "info",
});

export const errorLogger = createLogger({
    level: "error",
    format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp}: [${level === "info" ? level : level.toUpperCase()}] ${message}`;
        }),
    ),
    transports: [
        errorTransport,
    ],
});
