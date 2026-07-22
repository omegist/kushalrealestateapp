export interface Property {
  id: string;
  title: string;
  description: string | null;
  category_slug: string;
  property_type: string | null;
  location: string;
  city: string | null;
  price_label: string | null;
  price_value: number | null;
  negotiable: boolean;
  bedrooms: string | null;
  bathrooms: number | null;
  builtup_area: string | null;
  carpet_area: string | null;
  floor_info: string | null;
  construction_age: string | null;
  amenities: string[];
  features: string[];
  contact_name: string | null;
  contact_phone: string | null;
  contact_phone_alt: string | null;
  map_lat: number | null;
  map_lng: number | null;
  cover_image: string | null;
  featured: boolean;
  status: string;
  listing_type: "sale" | "rent";
  nearby_hospital: string | null;
  nearby_school: string | null;
  nearby_highway: string | null;
  nearby_market: string | null;
  virtual_tour_url: string | null;
  possession_status: string | null;
  facing: string | null;
  rera_number: string | null;
  verified: boolean;
  video_url: string | null;
  locality: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  property_id: string | null;
  name: string;
  rating: number;
  comment: string | null;
  review_type: string;
  approved: boolean;
  created_at: string;
}


export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  cta_label: string | null;
  link_to: string | null;
  sort_order: number;
  enabled: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  designation: string | null;
  experience: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  photo_url: string | null;
  is_founder: boolean;
  sort_order: number;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  property_id: string | null;
  property_title: string | null;
  message: string | null;
  budget: string | null;
  preferred_location: string | null;
  status: string;
  created_at: string;
}