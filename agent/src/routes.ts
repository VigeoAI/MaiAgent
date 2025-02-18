import express from "express";
import { AgentServer } from "./index";
import { Scraper } from "agent-twitter-client";
import { TwitterApi } from "twitter-api-v2";

interface ApiResponse<T = any> {
    status?: number;
    success: boolean;
    message: string;
    data?: T;
}


class ApiError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = "ApiError";
    }
}

class AuthUtils {
    constructor(private agent: AgentServer) {}

    private createResponse<T>(data?: T, message = "Success"): ApiResponse<T> {
        return {
            success: true,
            message,
            data,
        };
    }

    private createErrorResponse(error: Error | ApiError): ApiResponse {
        const status = error instanceof ApiError ? error.status : 500;
        const message = error.message ?? "Internal server error";

        return {
            status,
            success: false,
            message,
        };
    }

    async withErrorHandling<T>(
        req: express.Request,
        res: express.Response,
        handler: () => Promise<T>
    ) {
        try {
            const result = await handler();
            return res.json(this.createResponse(result));
        } catch (error) {
            console.error(`Error in handler:`, error);
            const response = this.createErrorResponse(error);
            return res
                .status(error instanceof ApiError ? error.status : 500)
                .json(response);
        }
    }

}

export class Routes {
    private authUtils: AuthUtils;

    constructor(
        private agent: AgentServer
    ) {
        this.authUtils = new AuthUtils(agent);
    }

    setupRoutes(app: express.Application): void {
        //app.post("/login", this.handleLogin.bind(this));
        app.post("/chat", this.handleChat.bind(this));
    }

    async handleChat(req: express.Request, res: express.Response) {
        return this.authUtils.withErrorHandling(req, res, async () => {
            const {
                msg
            } = req.body;

            if (!msg) {
                throw new ApiError(400, "Missing required fields");
            }

            return {
                ok: true,
            };
        });
    }

}
