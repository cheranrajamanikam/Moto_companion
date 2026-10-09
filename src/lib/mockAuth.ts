// Mock authentication for demo mode — works without Supabase credentials

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    display_name: string;
    bike: string;
    riding_style: string;
  };
}

const MOCK_USER: MockUser = {
  id: 'mock-user-001',
  email: 'demo@motocompanion.in',
  user_metadata: {
    full_name: 'Arjun Kumar',
    display_name: 'Arjun Kumar',
    bike: 'Royal Enfield Classic 350',
    riding_style: 'Touring',
  },
};

const AUTH_KEY = 'mc_mock_auth';

export function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mc-auth-change'));
  }
}

export const mockAuth = {
  isLoggedIn(): boolean {
    return localStorage.getItem(AUTH_KEY) === 'true';
  },

  login(email: string, password: string): { user: MockUser | null; error: string | null } {
    if (!email || !password) {
      return { user: null, error: 'Please enter email and password' };
    }
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem('mc_mock_user', JSON.stringify({ ...MOCK_USER, email }));
    notifyAuthChange();
    return { user: { ...MOCK_USER, email }, error: null };
  },

  register(data: {
    email: string;
    password: string;
    fullName: string;
    bike: string;
    ridingStyle: string;
  }): { user: MockUser | null; error: string | null } {
    if (!data.email || !data.password || !data.fullName) {
      return { user: null, error: 'Please fill all required fields' };
    }
    const user: MockUser = {
      id: 'mock-user-' + Date.now(),
      email: data.email,
      user_metadata: {
        full_name: data.fullName,
        display_name: data.fullName,
        bike: data.bike || 'Royal Enfield Classic 350',
        riding_style: data.ridingStyle || 'Touring',
      },
    };
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem('mc_mock_user', JSON.stringify(user));
    notifyAuthChange();
    return { user, error: null };
  },

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('mc_mock_user');
    notifyAuthChange();
  },

  getCurrentUser(): MockUser | null {
    if (!this.isLoggedIn()) return null;
    const stored = localStorage.getItem('mc_mock_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored) as MockUser;
    } catch {
      return null;
    }
  },
};
