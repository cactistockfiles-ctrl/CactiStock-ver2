export interface UserProfile {
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

export interface UserAccount extends UserProfile {
  passwordHash: string;
}
