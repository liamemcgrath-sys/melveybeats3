import "server-only";
import { database } from "./catalog-store";
import { CheckoutError } from "./checkout";
import { identity } from "./auth-server";
export { requireAdministrator, isAdmin } from "./auth-server";

export async function findProfile(owner:string) {
  const {data,error}=await database().from("melvey_profiles").select("name,created_at").eq("owner_id",owner).maybeSingle();
  if(error)throw new CheckoutError("Could not load your account.",503);
  return data?{name:data.name,createdAt:data.created_at}:null;
}
export async function saveProfile(user:{id:string;email:string},name:string) {
  name=name.trim();if(name.length<2||name.length>60)throw new CheckoutError("Use a display name between 2 and 60 characters.");
  const {error}=await database().from("melvey_profiles").upsert({owner_id:user.id,email:user.email,name},{onConflict:"owner_id"});
  if(error)throw new CheckoutError("Could not save your account.",503);
}
export async function requireProfile() {
  const user=await identity();
  if(!await findProfile(user.id))throw new CheckoutError("Finish creating your Melvey account before checkout.",428);
  return user;
}
