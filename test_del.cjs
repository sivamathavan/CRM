const SU = 'https://nwkoqyoakfyhdnezliil.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a29xeW9ha2Z5aGRuZXpsaWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTUzNDQsImV4cCI6MjA5MzU5MTM0NH0.Ev0-6RprJKHSjbGijNJ8QY8xqKhsHFFEu1EY9dcMF7M';

const SH = {
  'Content-Type': 'application/json',
  'apikey': SK,
  'Authorization': 'Bearer ' + SK
};

const sDelQ = (table, query) => 
  fetch(`${SU}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: SH
  })
    .then(async res => {
      if (!res.ok) {
        let text = await res.text();
        throw new Error(`sDelQ failed: ${res.statusText} - ${text}`);
      }
      return res;
    });

const sDel = (table, id) => 
  fetch(`${SU}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: SH
  })
    .then(async res => {
      if (!res.ok) {
        let text = await res.text();
        throw new Error(`sDel failed: ${res.statusText} - ${text}`);
      }
      return res;
    });

async function runTest() {
  console.log("--- Listing Sheets ---");
  const res = await fetch(`${SU}/rest/v1/sheets?select=*&limit=5`, { headers: SH });
  const sheets = await res.json();
  console.log("Available sheets:", sheets);

  if (sheets.length > 0) {
    const target = sheets[0];
    console.log(`--- Testing deletion of sheet: "${target.name}" (id=${target.id}) ---`);
    try {
      console.log("1. Deleting associated leads...");
      const dLeads = await sDelQ('leads', `sheet_id=eq.${target.id}`);
      console.log("Leads delete response status:", dLeads.status);

      console.log("2. Deleting sheet record...");
      const dSheet = await sDel('sheets', target.id);
      console.log("Sheet delete response status:", dSheet.status);

      console.log("✅ Deletion test complete!");
    } catch (e) {
      console.error("❌ Deletion failed with error:", e.message);
    }
  } else {
    console.log("No sheets found to delete.");
  }
}

runTest();
