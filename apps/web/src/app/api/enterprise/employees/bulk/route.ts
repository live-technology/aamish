import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId=crypto.randomUUID(); const session=await currentSession();
  if(session?.role!=="ENTERPRISE_ADMIN"||!session.enterpriseId)return NextResponse.json({error:"FORBIDDEN",requestId},{status:403});
  try { const { employees }=await request.json(); if(!Array.isArray(employees)||employees.length<1||employees.length>500)return NextResponse.json({error:"INVALID_ROWS",requestId},{status:400});
    const errors:{row:number;error:string}[]=[]; let inserted=0;
    for(const [index,item] of employees.entries()) try { await db().begin(async tx=>{ if(!item.employeeCode||!item.fullName||!item.email||!item.locationCode)throw new Error("MISSING_REQUIRED_FIELDS"); const loc=await tx<{id:string}[]>`SELECT id FROM delivery_locations WHERE enterprise_id=${session.enterpriseId} AND code=${item.locationCode} AND is_active=TRUE`; if(!loc[0])throw new Error("INVALID_LOCATION_CODE"); const ep=await tx<{id:string}[]>`INSERT INTO employees(enterprise_id,employee_code,full_name,email,location_id) VALUES(${session.enterpriseId},${item.employeeCode},${item.fullName},${item.email},${loc[0].id}) RETURNING id`; await tx`INSERT INTO app_users(username,password_hash,full_name,role,enterprise_id,employee_id) VALUES(${item.username||item.employeeCode},crypt(${item.password||"welcome123"},gen_salt('bf')),${item.fullName},'EMPLOYEE',${session.enterpriseId},${ep[0].id})`; await tx`INSERT INTO meal_preferences(schedule_id,employee_id,location_id,selected_option_id) SELECT ms.id,${ep[0].id},${loc[0].id},(SELECT id FROM menu_schedule_options WHERE schedule_id=ms.id ORDER BY option_label LIMIT 1) FROM menu_schedules ms WHERE ms.enterprise_id=${session.enterpriseId} AND ms.schedule_date>=CURRENT_DATE ON CONFLICT DO NOTHING`; }); inserted++; } catch(error){errors.push({row:index+2,error:error instanceof Error?error.message:"ROW_FAILED"});}
    log("employees.bulk_created",{requestId,actorUserId:session.userId,inserted,errors:errors.length}); return NextResponse.json({totalRows:employees.length,inserted,errors,requestId});
  } catch(error){logError("employees.bulk_failed",error,{requestId});return NextResponse.json({error:"BULK_UPLOAD_FAILED",requestId},{status:500});}
}
