import { EmployeePortal } from "@/components/employee-portal";
import { employeePageData } from "@/lib/employee-page-data";

export default async function EmployeePage(){return <EmployeePortal {...await employeePageData()} view="today"/>}
