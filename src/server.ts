import { Options,  initInstance } from "@umk-stat/statistic-server-database";
import { Options as ClientOptions, initСlientInstance } from "@umk-stat/statistic-server-client-database";
import { getMiddleware, execute, subscribe } from "@umk-stat/statistic-server-graphql-route";
import { errorLogger, infoLogger } from "./loggers";
import { SubscriptionServer } from 'subscriptions-transport-ws';
import express from "express";
import cors from "cors";
import { createServer } from "http";
import bodyParser from "body-parser";

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
    const clientDatabaseApi = initСlientInstance(options as ClientOptions);
    try {
        await databaseApi.sequelize.authenticate();
        await clientDatabaseApi.sequelize.authenticate();
    } catch (err) {

        errorLogger.error(err);
        throw err;

    }
    const graphql = getMiddleware(databaseApi, clientDatabaseApi, infoLogger, errorLogger);


    const app = express();
    app.use(cors());
    app.use(bodyParser.json({
        limit: "50mb",
    }));
    app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
    app.use(graphql.middleware);
    const server = createServer(app);

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
                clientDatabaseApi,
                infoLogger,
                errorLogger,
            };
            return context;
        }

    }, {
        server,
        path: "/subscription",
    });

    server.listen(apiPort, () => {
        infoLogger.info("graphiql is  running");
    });
}