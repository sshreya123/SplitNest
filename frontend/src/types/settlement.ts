import type {
  MoneyValue
} from "./expense";


export interface Settlement {
  id: string;
  group_id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: MoneyValue;
  currency: string;
  note: string | null;
  settlement_date: string;
  created_by_id: string;
  created_at: string;
}


export interface CreateSettlementPayload {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  note: string;
  settlement_date: string;
}