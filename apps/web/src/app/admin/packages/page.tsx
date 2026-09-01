import { redirect } from "next/navigation";
import { PackageManager, type MenuPackage } from "@/components/package-manager";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export default async function PackagesPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect("/");
  const menus = await db()<MenuPackage[]>`SELECT id, title, description, category, price::float, status, image_mobile_url FROM menus ORDER BY created_at DESC`;
  return <PackageManager initialMenus={[...menus]} />;
}
