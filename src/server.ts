import { Options, initInstance } from "@umk/statistic-server-database";
import { getMiddleware, execute, subscribe } from "@umk/statistic-server-core";
import { errorLogger, infoLogger } from "./loggers";
import { SubscriptionServer } from 'subscriptions-transport-ws';
import express from "express";
import cors from "cors";
export async function runServer(): Promise<void> {

    const port = process.env.PORT ? Number(process.env.PORT) : 8001;
    const apiPort = process.env.API_PORT ? Number(process.env.API_PORT) : 8002;
    const options: Options = {
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        dialect: "mssql",
        port: 1433,
        database: process.env.DATABASE_NAME,
        dialectOptions: {
            encrypt: false,
        },
        benchmark: true,
        host: process.env.DATABASE_HOST,
        pool: {
            max: 1000,
            min: 10,
            acquire: 15000,
            evict: 15000,
            idle: 15000,
        },
        logQueryParameters: true,
        logging: (sql: string, timing?: number) => {
            infoLogger.info(`${sql}\n benchmark ${timing?.toString()}`)
        },
    };
    const databaseApi = initInstance(options);

    try {
        await databaseApi.sequelize.authenticate();

    } catch (err) {

        errorLogger.error(err);
        throw err;

    }
    const graphql = getMiddleware(databaseApi, infoLogger, errorLogger);


    const app = express();
    app.use(cors());
    app.use(graphql.middleware);
    app.listen(apiPort, () => {
        infoLogger.info("graphiql is  running");
    });

    const subscriptionServer = new SubscriptionServer({
        schema: graphql.schema,
        execute,
        subscribe,
        onConnect: async () => {
            const map = await databaseApi.queries.findMapAssociations();
            const graphQLObjectMap = map.reduce((prev, val) => {

                const value = val.get();
                prev.set(value.NUMBER, value.tableName);
                return prev;

            }, new Map<string, string>());
            const context = {
                graphQLObjectMap,
                databaseApi,
                infoLogger,
                errorLogger,
            };
            return context;
        }

    }, {
        port,
        path: "/subscription",
    });

}