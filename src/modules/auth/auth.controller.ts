import type { Request, Response } from "express";
import authService from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import { signToken } from "../../utils/jwt";

export const signup = async (req: Request, res: Response) => {
    const user = await authService.createUser(req.body)
    if (!user) {
        sendResponse(res, { success: false, message: "Failed to Create user" }, 400)
        return
    }

    sendResponse(res, { message: "User registered successfully", data: user }, 201)
}


export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body
    const user = await authService.validateUser(email, password)

    if (!user) {
        return sendResponse(
            res,
            {
                success: false,
                message: "Invalid email or password",
                errors: "Authentication failed"
            },
            401
        );
    }

    const token = signToken({
        id: user.id,
        name: user.name,
        role: user.role
    });
    return sendResponse(res, {
        message: "Login successful", data: {
            token,
            user
        }
    }, 200)

}

