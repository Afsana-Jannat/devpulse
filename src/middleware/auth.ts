import type { NextFunction, Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";
import config from "../config";
import jwt from "jsonwebtoken";

export const auth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization;

    if (!token) {
        return sendResponse(
            res,
            {
                success: false,
                message: "Unauthorized",
                errors: "Token missing"
            },
            401
        );
    }

    try {
        const decoded = jwt.verify(
            token,
            config.jwt_secret
        ) as {
            id: number;
            name: string;
            role: string;
        };

        req.user = decoded;

        next();

    } catch {
        return sendResponse(
            res,
            {
                success: false,
                message: "Unauthorized",
                errors: "Invalid token"
            },
            401
        );
    }
};