import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "12kb",}))
app.use(express.urlencoded({extented: true, limit: "16kb"}))
app.use(express.static("public")) 
app.use(cookieParser()) 


// routes import 
import userRouter from "./routes/user.routes.js"

// routes declaration
//not directly use .get need middleware
app.use("/api/v1/users", userRouter)  // :"users": prefix

// http://localhost:8000/api/v1/users/register


export { app }