import express, { type Application, type Request, type Response } from "express"
import { auth } from "./middleware/auth";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import authRoutes from "./modules/auth/auth.route"
import router from "./modules/issue/issue.route";


const app: Application = express();


app.use(express.json())

app.get("/", (req: Request, res: Response) => {
    res.send("server is running")

})
app.use("/api/auth", authRoutes);
app.use("/api/issues", router);
app.use(globalErrorHandler)

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});
export default app
