import express, { type Application, type Request, type Response } from "express"
import { auth } from "./middleware/auth";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import authRoutes from "./modules/auth/auth.route"


const app: Application = express();

app.use(auth)
app.use(express.json())

app.get("/", (req: Request, res: Response) => {
    res.send("hlw")

})

app.use("/api/auth", authRoutes)
app.use(globalErrorHandler)
export default app
