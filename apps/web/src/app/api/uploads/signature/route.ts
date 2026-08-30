import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";

export async function POST(request:NextRequest){const session=await currentSession();if(!session)return NextResponse.json({error:"FORBIDDEN"},{status:403});const{kind}=await request.json();if(kind!=="menu"&&kind!=="review")return NextResponse.json({error:"INVALID_UPLOAD_KIND"},{status:400});const cloudName=process.env.CLOUDINARY_CLOUD_NAME,apiKey=process.env.CLOUDINARY_API_KEY,secret=process.env.CLOUDINARY_API_SECRET;if(!cloudName||!apiKey||!secret)return NextResponse.json({error:"CLOUDINARY_NOT_CONFIGURED"},{status:503});const timestamp=Math.floor(Date.now()/1000);const folder=`aamish/${kind}s`;const signature=createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");return NextResponse.json({cloudName,apiKey,timestamp,folder,signature});}
