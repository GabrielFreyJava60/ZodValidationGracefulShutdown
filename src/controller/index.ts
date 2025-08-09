import express, { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import 'dotenv/config'
import _ from 'lodash'
import  { EmployeeAlreadyExistsError, EmployeeNotFoundError, persistNow } from '../service/EmployeesServiceMap.ts';
import { Employee } from '../model/Employee.ts';
import service from '../service/EmployeesServiceMap.ts';
import { EmployeeCreateSchema, EmployeeUpdateSchema } from '../model/EmployeeSchema.ts';
const app = express();
const {PORT, MORGAN_FORMAT, SKIP_CODE_THRESHOLD} = process.env;
const port = PORT || 3500;

const morganFormat = MORGAN_FORMAT ?? 'tiny';
const skipCodeThreshold = SKIP_CODE_THRESHOLD ??  400;
const server = app.listen(port, () => console.log("server is listening on port "+ port))
app.use(express.json());
app.use(morgan(morganFormat,{skip: (req, res) => res.statusCode < +skipCodeThreshold}));

app.get("/employees", (req, res) => {
    res.json(service.getAll(req.query.department as string))
})

app.post("/employees",(req, res, next) => {
    try {
        const valid = EmployeeCreateSchema.parse(req.body);
        res.json(service.addEmployee(valid as Employee))
    } catch (e) {
        next(e);
    }
} )

app.delete("/employees/:id",(req, res) => {
    res.json(service.deleteEmployee(req.params.id))
} )

app.patch("/employees/:id",(req, res, next) => {
    try {
        const valid = EmployeeUpdateSchema.parse(req.body);
        res.json(service.updateEmployee(req.params.id, valid))
    } catch (e) {
        next(e);
    }
} )
app.use((error: Error, __: Request, res: Response, ___: NextFunction) => {
    let status = 400;
    if(error instanceof EmployeeAlreadyExistsError) {
        status = 409;
    } else if (error instanceof EmployeeNotFoundError) {
        status = 404;
    }
    res.statusCode = status;
    res.send(error.message)
    
})
function shutdown() {
    
    try {
        persistNow();
    } catch {}
    server.close(() => console.log("server closed"));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown)
