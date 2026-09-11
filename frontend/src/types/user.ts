export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}


export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}