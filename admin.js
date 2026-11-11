// Replace these two values with the Supabase Project URL and anon/public key.
// NEVER put the service_role key in this file or in any public website file.
const SUPABASE_URL = "PASTE_SUPABASE_PROJECT_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_PUBLIC_KEY_HERE";
const configured = !SUPABASE_URL.startsWith("PASTE_") && !SUPABASE_ANON_KEY.startsWith("PASTE_");
const $ = (id) => document.getElementById(id);
let db, currentKind = "admissions";

if (!configured || !window.supabase) {
  $("setup").hidden = false;
  $("login").hidden = true;
} else {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault(); $("login-message").textContent = "Signing in…";
    const {data,error} = await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
    if(error){$("login-message").textContent = error.message;return;}
    await showDashboard(data.user);
  });
  $("logout").addEventListener("click", async()=>{await db.auth.signOut();$("dashboard").hidden=true;$("login").hidden=false;});
  $("refresh").addEventListener("click", loadRows);
  document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentKind=b.dataset.kind;loadRows();}));
  db.auth.getSession().then(async({data})=>{if(data.session) await showDashboard(data.session.user);});
}
async function showDashboard(user){
  $("login").hidden=true;$("dashboard").hidden=false;$("signed-in").textContent="Signed in as "+user.email;
  loadRows();
}
async function loadRows(){
  $("dash-message").textContent="Loading…";
  const table = currentKind === "admissions" ? "admissions" : "job_applications";
  const {data,error}=await db.from(table).select("*").order("created_at",{ascending:false}).limit(200);
  if(error){$("dash-message").textContent="Could not load records: "+error.message;return;}
  const rows=data||[];
  const columns=rows.length?Object.keys(rows[0]).filter(k=>k!=="id" && k!=="user_id"):[];
  $("table-head").innerHTML="<tr>"+(columns.length?columns.map(k=>`<th>${escapeHtml(k.replaceAll("_"," "))}</th>`).join(""):"<th>No applications yet</th>")+"</tr>";
  $("table-body").innerHTML=rows.map(row=>"<tr>"+columns.map(k=>`<td>${escapeHtml(formatValue(row[k]))}</td>`).join("")+"</tr>").join("");
  $("dash-message").textContent=rows.length?`${rows.length} record(s) shown (maximum 200).`:"No applications received yet.";
}
function formatValue(v){return v===null||v===undefined?"":typeof v==="object"?JSON.stringify(v):String(v)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
