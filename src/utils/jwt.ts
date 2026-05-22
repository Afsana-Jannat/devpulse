// import config from "../config";
// import type { RUser } from "../types";
// import jwt from "jsonwebtoken"

// export const signToken = (payload: RUser & { id: number }) => {
//     const accessToken = jwt.sign(payload, config.jwt_secret, {
//         expiresIn: "1d"
//     })

//     return { accessToken }
// }

import config from "../config";
import jwt from "jsonwebtoken";

export const signToken = (
    payload: {
        id: number;
        name: string;
        role: string;
    }
) => {
    return jwt.sign(
        payload,
        config.jwt_secret,
        {
            expiresIn: "1d"
        }
    );
};
