// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import type { User, ProfileUpdateData } from './index';

export interface PageProps {
  user: User | null;
  onLogout: () => void;
  onUpdateProfile?: (data: ProfileUpdateData) => Promise<User>;
}
