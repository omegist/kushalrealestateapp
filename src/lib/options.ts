// Shared dropdown options used across the enquiry form, schedule-visit flow and admin.
// Keeping them in one place means the same choices power lead capture everywhere.

export const BUDGET_OPTIONS = [
  "Under ₹50 Lakh",
  "₹50 Lakh – ₹75 Lakh",
  "₹75 Lakh – ₹1 Cr",
  "₹1 Cr – ₹1.5 Cr",
  "₹1.5 Cr – ₹2 Cr",
  "₹2 Cr – ₹3 Cr",
  "Above ₹3 Cr",
] as const;

// Popular Thane / Kalwa localities the business actively serves.
export const LOCATION_OPTIONS = [
  "Kalwa",
  "Dhokali",
  "Thane West",
  "Thane East",
  "Kharigaon",
  "Manpada",
  "Ghodbunder Road",
  "Majiwada",
  "Vartak Nagar",
  "Kolshet",
  "Wagle Estate",
  "Other",
] as const;

// Time windows offered when a customer books a site visit.
export const VISIT_SLOTS = [
  "Morning (9 AM – 12 PM)",
  "Afternoon (12 PM – 4 PM)",
  "Evening (4 PM – 7 PM)",
] as const;
