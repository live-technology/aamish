"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconButton } from "./primitives";

export function SignOutButton(){const router=useRouter();return <IconButton aria-label="Sign out" onClick={()=>fetch("/api/auth/logout",{method:"POST"}).then(()=>router.push("/login"))}><LogOut size={18}/></IconButton>}
