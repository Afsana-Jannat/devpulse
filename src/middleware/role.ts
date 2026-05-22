import type { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/sendResponse";


export const roleGuard = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {

        const user = req.user;

        if (!user) {
            return sendResponse(res, {
                success: false,
                message: "Unauthorized",
                errors: "User not found in request"
            }, 401);
        }

        if (!allowedRoles.includes(user.role)) {
            return sendResponse(res, {
                success: false,
                message: "Forbidden",
                errors: "You do not have permission"
            }, 403);
        }

        next();
    };
};