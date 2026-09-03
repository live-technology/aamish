export type EnterpriseLocationRecord = { id: string; name: string; code: string; address: string; is_active: boolean };
export type EditableEnterprise = { id:string;name:string;slug:string;status:string;poc_name:string;poc_phone:string;poc_email:string;location_count:number;admin_count:number;admin_username?:string|null;locations:EnterpriseLocationRecord[] };
export type EnterpriseEditPayload = { id:string;name:string;pocName:string;pocPhone:string;pocEmail:string;status:string;locations:Array<{id?:string;name:string;code:string;address:string;isActive:boolean}> };

export function validateEnterpriseEdit(value: EnterpriseEditPayload) {
  if (!value.id || !value.name.trim() || !value.pocName.trim() || !value.pocPhone.trim() || !/^\S+@\S+\.\S+$/.test(value.pocEmail.trim())) return "MISSING_REQUIRED_FIELDS";
  if (!new Set(["ACTIVE", "INACTIVE"]).has(value.status)) return "INVALID_ENTERPRISE_STATUS";
  if (!value.locations.length || !value.locations.some((location) => location.isActive)) return "ACTIVE_LOCATION_REQUIRED";
  if (value.locations.some((location) => !location.name.trim() || !location.address.trim())) return "MISSING_REQUIRED_FIELDS";
  const ids = value.locations.map((location) => location.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) return "INVALID_LOCATION";
  return "";
}
