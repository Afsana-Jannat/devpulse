import type { Request, Response } from "express";
import authService from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";

export const signup = async (req: Request, res: Response) => {
    const user = await authService.createUser(req.body)
    if (!user) {
        sendResponse(res, { message: "Failed to Create user" }, 400)
        return
    }

    sendResponse(res, { message: "User registered successfully", data: user }, 201)
}
