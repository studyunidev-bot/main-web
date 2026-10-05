

export interface TableType {
  id: number;
  name?: string;
  username?: string;
  role?: string
  start_date?: string
  end_date?: string
  is_active?: boolean
  fullname?: string
  created_at?: string
  role_id?: number
  role_name?: string

  // donation-type
  donation_type_name?: string

  // donation
  donation_name?: string
  donation_price?: number

  // payment
  updated_at?: string
  payment_type_name?: string

  // Customer
  address?: string
  tel?: string

  // orders
  donation_code?: string
  total_amount? : string | number
  order_status?: number
  cancelled_by_fullname?: string

  value: string; 
  label: string;



}

// Bill all
export type BillItem = {
  donation_id: number;
  quantity: number;
  price: number;
  
};

export type BillForm = {
  customer_id: number;
  payment_type_id: number;
  items: BillItem[];
  note: string
};

export type Option = {
  id: number;
  name: string;
  fullname: string
  payment_type_name: string
  donation_name: string
  donation_price: number
};

export const emptyForm: BillForm = {
  customer_id: 0,
  payment_type_id: 0,
  items: [{ donation_id: 0, quantity: 1, price: 0 }],
  note : "",
};

