import express from "express";
import { AgentServer } from "./index.ts";
import { chatWithAI, chatWithChain, visionPicture } from "./chat.ts";
// import { Scraper } from "agent-twitter-client";
// import { TwitterApi } from "twitter-api-v2";

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
            const response = this.createErrorResponse(error as Error);
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
        app.post("/chat", this.handleChatWithChain.bind(this));
        app.post("/vision_picture", this.handleVisionPicture.bind(this));

    }
    async handleVisionPicture(req: express.Request, res: express.Response) {
        const imgbase64 = req.body.imagebase64.replace(/^data:image\/\w+;base64,/, "");
        console.log("handleVisionPicture");
        
        if (!imgbase64) {
            throw new ApiError(400, "Missing required fields");
        }

        let answer = await visionPicture(imgbase64);
        console.log(" handle chat.ans: " + answer);

        res.json({
            res: false,
            reason: answer,
        });
    }

    async handleChatWithChain(req: express.Request, res: express.Response) {
        const {
            msg
        } = req.body;
        console.log(" handle chat.");
        let answer = await chatWithChain("BTC is Good");
        console.log(" handle chat.ans: " + answer);

        if (!msg) {
            throw new ApiError(400, "Missing required fields");
        }
        res.json({
            res: false,
            reason: answer,
        });
    }

}
