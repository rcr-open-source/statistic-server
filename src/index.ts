import { runServer } from "./server";
import dotenv from "dotenv";

async function index() {
    try {

        const ans = dotenv.config();

        if (ans.error) {
            console.error(ans.error);
            process.exit(1);
        }

        runServer();
    } catch (err) {
        console.error(err);
    }
}
index();

