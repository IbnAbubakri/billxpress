import type { User, ProfileUpdateData } from './index';

export interface PageProps {
  user: User | null;
  onLogout: () => void;
  onUpdateProfile?: (data: ProfileUpdateData) => Promise<User>;
}
