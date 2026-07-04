export interface UserAddress {
  id: string;
  label?: string;
  recipient: string;
  phone?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  zipcode?: string;
  addressLine: string;
  isDefault: boolean;
}

export interface UserProfile {
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  addresses?: UserAddress[];
  oauthProvider?: string;
  oauthId?: string;
}

export interface UserAccount extends UserProfile {
  passwordHash?: string;
}
