import rates from "./shipping-rates.json";

export type LocalShippingRate = {
  id: string;
  agent_name: string;
  line_name: string;
  base_price: number;
  price_per_kg: number;
  min_weight: number;
  max_weight: number;
  sort_order: number;
  price_table: Record<string, number>;
  discount_percent: number;
  coupon_code: string;
  signup_url: string;
};

/** Lokalny cennik wysyłki — działa bez połączenia z bazą. */
export const LOCAL_SHIPPING_RATES = rates as LocalShippingRate[];
