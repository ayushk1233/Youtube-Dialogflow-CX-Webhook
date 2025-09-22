const fs = require("fs");
const path = require("path");
const { buildTextResponse } = require("../utils/response");

const properties = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../properties.json"), "utf8")
);

function normalizeBudget(value) {
  if (!value) return null;
  const str = value.toString().toLowerCase();
  const num = parseFloat(str.match(/[\d\.]+/)?.[0]);
  if (isNaN(num)) return null;
  if (str.includes("crore") || str.includes("cr")) return num * 100;
  return num; // assume lakhs
}

function parseBHK(value) {
  if (!value) return null;
  const str = value.toString().toLowerCase();
  // Handle both "3" and "3bhk" formats
  const match = str.match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

async function propertyController(body) {
  const params = body.queryResult?.parameters || {};
  console.log('Parsed parameters:', JSON.stringify(params, null, 2));
  
  // Handle array parameters from Dialogflow ES
  const location = Array.isArray(params.location) ? params.location[0] : 
    (params.location || params.city || params["geo-city"] || params.locality || "");
  
  const bhkConfig = Array.isArray(params["bhk-config"]) ? params["bhk-config"][0] : params["bhk-config"];
  const bhk = parseBHK(bhkConfig || params.bhk);
  
  const budgetParam = Array.isArray(params.budget) ? params.budget[0] : params.budget;
  const budget = normalizeBudget(budgetParam);
  
  const propertyType = params.property_type || params["property-type"] || "";
  const amenity = params.amenity || "";

  console.log('Processed parameters:', {
    location,
    bhk,
    budget,
    propertyType,
    amenity
  });

  let results = [...properties];
  console.log('Initial properties count:', results.length);

  // Apply location filter first if specified
  if (location) {
    const loc = location.toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.locality.toLowerCase().includes(loc) ||
        p.city.toLowerCase().includes(loc)
    );
    console.log('After location filter:', results.length);
    // Return early if no matches for location
    if (results.length === 0) {
      return buildTextResponse("❌ No properties found in this location. Try a different area.");
    }
  }

  // Apply other filters
  if (bhk) {
    results = results.filter((p) => parseInt(p.bhk) === bhk);
    console.log('After BHK filter:', results.length);
  }
  
  if (budget) {
    results = results.filter((p) => p.price_lakhs <= budget);
    console.log('After budget filter:', results.length);
  }
  
  if (propertyType) {
    const pt = propertyType.toLowerCase().replace(/s$/, "");
    results = results.filter((p) => p.type.toLowerCase().includes(pt));
    console.log('After property type filter:', results.length);
  }
  
  if (amenity) {
    const a = amenity.toLowerCase();
    results = results.filter((p) =>
      p.amenities.map((x) => x.toLowerCase()).includes(a)
    );
    console.log('After amenity filter:', results.length);
  }

  // Deduplicate results by property ID
  results = Array.from(new Map(results.map(p => [p.id, p])).values());

  // Sort by budget closeness if budget is specified
  if (budget) {
    results.sort((a, b) => Math.abs(a.price_lakhs - budget) - Math.abs(b.price_lakhs - budget));
  }

  let responseText;
  if (results.length > 0) {
    // Include location in header if specified
    responseText = `Here are some options${location ? ` in ${location}` : ""}:\n\n`;
    results.slice(0, 3).forEach((p) => {
      responseText += `🏠 ${p.title} (${p.locality}, ${p.city}) — ${p.bhk} BHK ${p.type}, ₹${p.price_lakhs} lakhs\nBuilder: ${p.builder}, RERA: ${p.rera_status}, Possession: ${p.possession_status}\n\n`;
    });
    
    // Add total count if there are more results
    if (results.length > 3) {
      responseText += `\n✨ Found ${results.length} matching properties. Showing top 3 results.`;
    }
  } else {
    responseText = "❌ No matches found. Try adjusting budget or filters.";
  }

  return buildTextResponse(responseText);
}

module.exports = { propertyController };
