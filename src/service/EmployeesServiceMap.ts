import { Employee } from "../model/Employee.ts";
import EmployeesService from "./EmployeesService.ts";
import fs from "node:fs";
import path from "node:path";
import { EmployeeCreateSchema } from "../model/EmployeeSchema.ts";
export class EmployeeAlreadyExistsError extends Error {
    constructor(id: string) {
        super(`employee with id ${id} already exists`);
        Object.setPrototypeOf(this, EmployeeAlreadyExistsError.prototype)
    }
}
export class EmployeeNotFoundError extends Error {
    constructor(id: string) {
        super(`employee with id ${id} not found`);
         Object.setPrototypeOf(this, EmployeeNotFoundError.prototype)
    }
}
 class EmployeesServiceMap implements EmployeesService {
     private _employees: Map<string, Employee> = new Map();
     private readonly dataFilePath: string;
     private isRestoringFromDisk = false;

     constructor(dataFilePath?: string) {
         this.dataFilePath = dataFilePath ?? path.resolve(process.cwd(), "data", "employees.json");
         this.restoreFromFileSync();
     }

    addEmployee(empl: Employee): Employee {
        const id = empl.id ?? (empl.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
        if (this._employees.has(id)) {
            throw new EmployeeAlreadyExistsError(id);
        }
        this._employees.set(id, empl);
        this.persistToFileIfNeeded();
        return empl;
    }
    getAll(department?: string): Employee[] {
        let res: Employee[] = Array.from(this._employees.values());
        if(department) {
            res = res.filter(empl => empl.department === department)
        }
        return res;
    }
    updateEmployee(id: string, empl: Partial<Employee>): Employee {
        const employee =  this.getEmployee(id);
        const { id: _ignoredId, ...rest } = empl;
        Object.assign(employee, rest);
        this.persistToFileIfNeeded();
        return employee;
    }
    deleteEmployee(id: string): Employee {
       const employee =  this.getEmployee(id);
       this._employees.delete(id);
       this.persistToFileIfNeeded();
       return employee;
    }
   

    private getEmployee(id: string): Employee {
        const employee = this._employees.get(id);
        if (!employee) {
            throw new EmployeeNotFoundError(id);
        }
        return employee;
    }

    private persistToFileIfNeeded(): void {
        if (this.isRestoringFromDisk) return;
        this.persistToFile();
    }

    persistToFile(): void {
        const directoryPath = path.dirname(this.dataFilePath);
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        const dataArray = Array.from(this._employees.values());
        const jsonString = JSON.stringify(dataArray, null, 2);
        fs.writeFileSync(this.dataFilePath, jsonString, { encoding: "utf-8" });
    }

    private restoreFromFileSync(): void {
        try {
            if (!fs.existsSync(this.dataFilePath)) {
                return;
            }
            const content = fs.readFileSync(this.dataFilePath, { encoding: "utf-8" });
            if (!content.trim()) return;
            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed)) return;

            this.isRestoringFromDisk = true;
            for (const raw of parsed) {
                try {
                    const valid = EmployeeCreateSchema.parse(raw);
                    this.addEmployee(valid);
                } catch (e) {
                 
                }
            }
        } catch {
           
        } finally {
            this.isRestoringFromDisk = false;
           
            this.persistToFileIfNeeded();
        }
    }
}
const serviceInstance: EmployeesServiceMap = new EmployeesServiceMap();
export const persistNow = () => serviceInstance.persistToFile();
const service: EmployeesService = serviceInstance;
export default service;