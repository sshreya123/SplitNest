import type {
  MoneyValue
} from "./expense";


export interface MemberBalance {
  user_id: string;
  name: string;
  total_paid: MoneyValue;
  total_share: MoneyValue;
  net_balance: MoneyValue;
}


export interface GroupBalance {
  group_id: string;
  currency: string;
  total_expenses: MoneyValue;
  members: MemberBalance[];
}