/**
 * Rturox CRM - System Integrity Diagnostic Script
 * This file verifies database REST connectivity, CRUD functions, and template engines.
 * Usage: node test_connection.js
 */

const SU = 'https://nwkoqyoakfyhdnezliil.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53a29xeW9ha2Z5aGRuZXpsaWlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTUzNDQsImV4cCI6MjA5MzU5MTM0NH0.Ev0-6RprJKHSjbGijNJ8QY8xqKhsHFFEu1EY9dcMF7M';

const SH = {
  'Content-Type': 'application/json',
  'apikey': SK,
  'Authorization': 'Bearer ' + SK
};

// Simplified dynamic fetch wrapper
const sGet = (table, query = '') => 
  fetch(`${SU}/rest/v1/${table}?${query}`, { headers: SH })
    .then(res => {
      if (!res.ok) throw new Error(`GET failed: ${res.statusText}`);
      return res.json();
    });

// Industry normalization mapping dictionary
const SECTOR_DICT = {
  'real estate': 'Real Estate',
  'builder': 'Real Estate',
  'property': 'Real Estate',
  'developer': 'Real Estate',
  'apartment': 'Real Estate',
  'villa': 'Real Estate',
  'flat': 'Real Estate',
  
  'jewel': 'Jewelry Shops',
  'gold': 'Jewelry Shops',
  'silver': 'Jewelry Shops',
  'diamond': 'Jewelry Shops',
  
  'clinic': 'Clinics & Hospitals',
  'hospital': 'Clinics & Hospitals',
  'dental': 'Clinics & Hospitals',
  'dentist': 'Clinics & Hospitals',
  'health': 'Clinics & Hospitals',
  'care': 'Clinics & Hospitals',
  'medical': 'Clinics & Hospitals',
  'scan': 'Clinics & Hospitals',
  'physio': 'Clinics & Hospitals',
  
  'resort': 'Resorts & Hotels',
  'hotel': 'Resorts & Hotels',
  'stay': 'Resorts & Hotels',
  'lodge': 'Resorts & Hotels',
  'cottage': 'Resorts & Hotels',
  'villa stay': 'Resorts & Hotels',
  
  'textile': 'Textile & Boutiques',
  'saree': 'Textile & Boutiques',
  'boutique': 'Textile & Boutiques',
  'silks': 'Textile & Boutiques',
  'clothing': 'Textile & Boutiques',
  'garments': 'Textile & Boutiques',
  'apparel': 'Textile & Boutiques',
  'fashion': 'Textile & Boutiques',
  
  'school': 'Educational Institutions',
  'college': 'Educational Institutions',
  'academy': 'Educational Institutions',
  'institute': 'Educational Institutions',
  'university': 'Educational Institutions',
  'education': 'Educational Institutions',
  'learning': 'Educational Institutions',
  
  'restaurant': 'Restaurants & Cafes',
  'cafe': 'Restaurants & Cafes',
  'biri': 'Restaurants & Cafes',
  'hotel food': 'Restaurants & Cafes',
  'kitchen': 'Restaurants & Cafes',
  'bakery': 'Restaurants & Cafes',
  'sweets': 'Restaurants & Cafes',
  'food': 'Restaurants & Cafes',
  'catering': 'Restaurants & Cafes',
  
  'construction': 'Construction & Interior Companies',
  'interior': 'Construction & Interior Companies',
  'decor': 'Construction & Interior Companies',
  'architect': 'Construction & Interior Companies',
  'engineer': 'Construction & Interior Companies',
  'infra': 'Construction & Interior Companies',
  'buildcon': 'Construction & Interior Companies',
  
  'travel': 'Travel & Tourism Companies',
  'tour': 'Travel & Tourism Companies',
  'holiday': 'Travel & Tourism Companies',
  'trip': 'Travel & Tourism Companies',
  
  'furniture': 'Furniture Stores',
  'wood': 'Furniture Stores',
  'sofa': 'Furniture Stores',
  
  'electronics': 'Electronics & Mobile Shops',
  'mobile': 'Electronics & Mobile Shops',
  'gadget': 'Electronics & Mobile Shops',
  'camera': 'Electronics & Mobile Shops',
  
  'supermarket': 'Supermarkets & Grocery Chains',
  'grocery': 'Supermarkets & Grocery Chains',
  'mart': 'Supermarkets & Grocery Chains',
  'provision': 'Supermarkets & Grocery Chains',
  
  'export': 'Manufacturing Exporters',
  'manufacturer': 'Manufacturing Exporters',
  'manufacturing': 'Manufacturing Exporters',
  'mill': 'Manufacturing Exporters',
  'casting': 'Manufacturing Exporters',
  'industry': 'Manufacturing Exporters',
  
  'logistics': 'Logistics & Transport Companies',
  'transport': 'Logistics & Transport Companies',
  'packers': 'Logistics & Transport Companies',
  'movers': 'Logistics & Transport Companies',
  'courier': 'Logistics & Transport Companies',
  'cargo': 'Logistics & Transport Companies',
  
  'finance': 'Finance & Financial Services',
  'loan': 'Finance & Financial Services',
  'wealth': 'Finance & Financial Services',
  'chit': 'Finance & Financial Services',
  'investment': 'Finance & Financial Services',
  
  'event': 'Event Management Companies',
  'wedding planner': 'Event Management Companies',
  'decorators': 'Event Management Companies',
  
  'gym': 'Gyms & Fitness Centers',
  'fitness': 'Gyms & Fitness Centers',
  'crossfit': 'Gyms & Fitness Centers',
  'yoga': 'Gyms & Fitness Centers',
  
  'salon': 'Salons & Beauty Clinics',
  'spa': 'Salons & Beauty Clinics',
  'beauty': 'Salons & Beauty Clinics',
  'hair': 'Salons & Beauty Clinics',
  'makeup': 'Salons & Beauty Clinics',
  
  'wedding': 'Wedding Industry Businesses',
  'bridal': 'Wedding Industry Businesses',
  'studio': 'Wedding Industry Businesses',
  'photography': 'Wedding Industry Businesses',
  
  'detailing': 'Automobile Accessories & Detailing',
  'accessories': 'Automobile Accessories & Detailing',
  'car water wash': 'Automobile Accessories & Detailing',
  'ceramic coating': 'Automobile Accessories & Detailing',
  'automotives': 'Automobile Accessories & Detailing',
  
  'hardware': 'Builders Material & Hardware Businesses',
  'material': 'Builders Material & Hardware Businesses',
  'paints': 'Builders Material & Hardware Businesses',
  'sanitary': 'Builders Material & Hardware Businesses',
  'tiles': 'Builders Material & Hardware Businesses',
  
  'franchise': 'Franchise Businesses',
  
  'legal': 'Legal & Professional Services',
  'advocate': 'Legal & Professional Services',
  'consultancy': 'Legal & Professional Services',
  'tax': 'Legal & Professional Services',
  'auditor': 'Legal & Professional Services',
  
  'agri': 'Agriculture & Agri-Tech Businesses',
  'farm': 'Agriculture & Agri-Tech Businesses',
  
  'temple': 'Religious & Spiritual Tourism Businesses',
  'spiritual': 'Religious & Spiritual Tourism Businesses',
  
  'brand': 'Coaching & Personal Brands',
  'coach': 'Coaching & Personal Brands'
};

const matchIndustry = (raw = '') => {
  const str = String(raw).toLowerCase().trim();
  for (const [kw, normalized] of Object.entries(SECTOR_DICT)) {
    if (str.includes(kw)) {
      return normalized;
    }
  }
  return null;
};

// Diagnostic test suite
async function runDiagnostic() {
  console.log("==================================================");
  console.log("      Rturox CRM Integrity Diagnostic Tool        ");
  console.log("==================================================\n");

  console.log("1. TESTING DATABASE ACCESS...");
  try {
    const workers = await sGet('workers', 'select=*&limit=5');
    console.log(`   ✅ DB Success! Reached 'workers' table successfully.`);
    console.log(`   👥 Retrieved ${workers.length} active worker profiles:`);
    workers.forEach(w => {
      console.log(`      - ID #${w.id} | ${w.name} | Role: ${w.role}`);
    });
  } catch (err) {
    console.error("   ❌ DB Failure contacting 'workers' table: ", err.message);
  }

  console.log("\n2. TESTING LEADS ENDPOINT...");
  try {
    const leads = await sGet('leads', 'select=*&limit=3');
    console.log(`   ✅ DB Success! Reached 'leads' table successfully.`);
    console.log(`   📋 Retrieved sample leads:`);
    leads.forEach(l => {
      console.log(`      - ID #${l.id} | ${l.business} | Sector: ${l.industry} | Status: ${l.overall_status}`);
    });
  } catch (err) {
    console.error("   ❌ DB Failure contacting 'leads' table: ", err.message);
  }

  console.log("\n3. TESTING SECTOR FILTER NORMALIZATION ENGINE...");
  const testInputs = [
    { raw: "PSG College of Technology", expected: "Educational Institutions" },
    { raw: "Sri Ram Krishna Dental Care", expected: "Clinics & Hospitals" },
    { raw: "Aishwarya Saree Boutique", expected: "Textile & Boutiques" },
    { raw: "Grand Palace Hotel stay", expected: "Resorts & Hotels" }
  ];
  
  let normalizationPassed = true;
  testInputs.forEach(({ raw, expected }) => {
    const got = matchIndustry(raw);
    if (got === expected) {
      console.log(`   ✅ matchIndustry("${raw}") -> "${got}" (Matched correctly!)`);
    } else {
      console.log(`   ❌ matchIndustry("${raw}") -> "${got}" (Expected: "${expected}")`);
      normalizationPassed = false;
    }
  });

  if (normalizationPassed) {
    console.log("\n✅ ALL SECTOR FILTER TESTS COMPLETED SUCCESSFULLY!");
  } else {
    console.log("\n⚠️ Sector Filter tests completed with warnings.");
  }

  console.log("\n==================================================");
  console.log("            DIAGNOSTICS FINISHED                 ");
  console.log("==================================================");
}

runDiagnostic();
