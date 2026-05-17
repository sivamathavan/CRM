const SU = 'https://nwkoqyoakfyhdnezliil.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a29xeW9ha2Z5aGRuZXpsaWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTUzNDQsImV4cCI6MjA5MzU5MTM0NH0.Ev0-6RprJKHSjbGijNJ8QY8xqKhsHFFEu1EY9dcMF7M';

const SH = {
  'Content-Type': 'application/json',
  'apikey': SK,
  'Authorization': 'Bearer ' + SK
};

async function testDeleteWithLogs() {
  const sheetId = 37; // Target sheet
  console.log(`--- Testing deletion of sheet id=${sheetId} ---`);
  
  // Fetch leads of sheet 37
  const rL = await fetch(`${SU}/rest/v1/leads?sheet_id=eq.${sheetId}&select=id`, { headers: SH });
  const leads = await rL.json();
  const leadIds = leads.map(l => l.id);
  console.log(`Found ${leadIds.length} leads in sheet ${sheetId}.`);

  if (leadIds.length > 0) {
    // Check call logs referencing these lead ids
    const leadIdsStr = `(${leadIds.join(',')})`;
    const rC = await fetch(`${SU}/rest/v1/call_logs?lead_id=in.${leadIdsStr}&select=*`, { headers: SH });
    const callLogs = await rC.json();
    console.log(`Found ${callLogs.length} call logs referencing these leads.`);

    // Check activity log referencing these lead ids
    const rA = await fetch(`${SU}/rest/v1/activity_log?lead_id=in.${leadIdsStr}&select=*`, { headers: SH });
    const activities = await rA.json();
    console.log(`Found ${activities.length} activity_log entries referencing these leads.`);

    try {
      console.log("Attempting to delete leads of sheet 37 directly...");
      const res = await fetch(`${SU}/rest/v1/leads?sheet_id=eq.${sheetId}`, {
        method: 'DELETE',
        headers: SH
      });
      const text = await res.text();
      console.log(`Status: ${res.status}. Response: ${text}`);
    } catch (e) {
      console.error("Direct delete failed:", e.message);
    }
  }
}

testDeleteWithLogs();
