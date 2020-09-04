import fs from "fs";
import path from "path";

export const logDir: string = path.normalize(`${__dirname}${process.env.LOG_PATH ? process.env.LOG_PATH : "/../../logs"}`);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
