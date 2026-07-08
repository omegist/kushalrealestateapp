export const BRAND = {
  name: "Kushal Enterprises",
  tagline: "Real Estate Consultant",
  rera: "RERA No. A51700014818",
  phone: "9029847968",
  phoneAlt: "9326313320",
  email: "anilpatil_30@yahoo.com",
  address:
    "Shop No. 5, Thakursingh Smruti Dham, Behind Domino's, Vithal Mandir Road, Kharigaon Kalwa, Thane - 400605",
} as const;

/** Strip non-digits and ensure a country code for India. */
export function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length >= 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function telLink(raw: string): string {
  return `tel:+${normalizePhone(raw)}`;
}

export function whatsappLink(raw: string, message?: string): string {
  const phone = normalizePhone(raw);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${phone}${text}`;
}

export function defaultEnquiryMessage(propertyTitle?: string): string {
  if (propertyTitle) {
    return `Hello Kushal Enterprises, I am interested in this property: "${propertyTitle}". Please share more details.`;
  }
  return "Hello Kushal Enterprises, I am interested in your properties. Please share more details.";
}

export function formatPrice(p: { price_label: string | null; price_value: number | null }): string {
  if (p.price_label) return p.price_label;
  if (p.price_value == null) return "Price on request";
  const v = p.price_value;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)} Lakh`;
  return `₹${v.toLocaleString("en-IN")}`;
}
