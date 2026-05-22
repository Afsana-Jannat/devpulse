// import type { Response } from "express";


// export function sendResponse<T>(
//     res: Response,
//     { message, data, error }: { message: unknown; data?: T; error?: boolean },
//     status = 200,
// ): void {
//     res.status(status).json({
//         success: error ? false : true,
//         message: message,
//         data: error ? undefined : data,
//     })
// }


import type { Response } from "express";

export function sendResponse<T>(
    res: Response,
    {
        message,
        data,
        errors,
        success = true,
    }: {
        message: string;
        data?: T;
        errors?: unknown;
        success?: boolean;
    },
    status = 200
): void {
    res.status(status).json({
        success,
        message,
        data: success ? data : undefined,
        errors: success ? undefined : errors,
    });
}