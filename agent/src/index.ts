import bodyParser from "body-parser";
import cors from "cors";
import express, { type Request as ExpressRequest } from "express";
import { Routes } from "./routes.ts";


export class AgentServer {
    public app: express.Application;
    private server: any; // Store server instance

    constructor() {
        this.app = express();
        this.app.use(cors());

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        const routes = new Routes(this);
        routes.setupRoutes(this.app);

        // Define an interface that extends the Express Request interface
        interface CustomRequest extends ExpressRequest {
            file?: Express.Multer.File;
        }
    }


    public start(port: number) {
        this.server = this.app.listen(port, () => {
            console.log(
                `REST API bound to 0.0.0.0:${port}.
                If running locally, access it at http://localhost:${port}.`
            );
        });

        // Handle graceful shutdown
        const gracefulShutdown = () => {
            console.log("Received shutdown signal, closing...");
            this.server.close(() => {
                console.log("Server closed successfully");
                process.exit(0);
            });

            // Force close after 5 seconds if server hasn't closed
            setTimeout(() => {
                console.error(
                    "Could not close in time, force shutting down"
                );
                process.exit(1);
            }, 5000);
        };

        // Handle different shutdown signals
        process.on("SIGTERM", gracefulShutdown);
        process.on("SIGINT", gracefulShutdown);
    }

    public stop() {
        if (this.server) {
            this.server.close(() => {
                console.log("Server stopped");
            });
        }
    }
}
