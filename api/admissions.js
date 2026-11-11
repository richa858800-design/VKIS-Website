import { createClient } from "@supabase/supabase-js";
const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  if(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({error:"Server is not configured"});
  const body=req.body||{};
  const allowed=["student_name","parent_name","email","phone","class_applied","message"];
  const record={}; for(const k of allowed) if(typeof body[k]==="string") record[k]=body[k].trim().slice(0,2000);
  if(!record.student_name || !record.parent_name || !record.email) return res.status(400).json({error:"Student name, parent name and email are required"});
  const {error}=await db().from("admissions").insert(record);
  if(error) return res.status(400).json({error:"Could not save application"});
  return res.status(201).json({ok:true});
}
