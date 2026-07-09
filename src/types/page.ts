import type { User } from './index';

export interface PageProps {
  user: User | null;
  onLogout: () => void;
  onUpdateProfile?: (data: Record<string, unknown>) => Promise<User>;
}
