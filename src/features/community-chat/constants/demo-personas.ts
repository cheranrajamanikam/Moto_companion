import { ChatUser, ChatRoom } from '../types';

export const DEMO_PERSONAS: ChatUser[] = [
  {
    id: 'rider-arjun-001',
    name: 'Arjun Kumar',
    bike: 'Royal Enfield Himalayan 450',
    avatarUrl: '',
    experienceLevel: 'intermediate',
    role: 'rider',
  },
  {
    id: 'rider-priya-002',
    name: 'Priya Sharma',
    bike: 'KTM 390 Adventure',
    avatarUrl: '',
    experienceLevel: 'advanced',
    role: 'rider',
  },
  {
    id: 'rider-vikram-003',
    name: 'Vikram Rathore',
    bike: 'Royal Enfield Interceptor 650',
    avatarUrl: '',
    experienceLevel: 'intermediate',
    // DEV / DEMO MODE ONLY — Injected persona role. Not production authorization.
    role: 'moderator',
  },
];

export const DEFAULT_GLOBAL_ROOM: ChatRoom = {
  id: 'global-riders',
  name: 'Global Rider Lounge',
  description: 'Live corridor updates, road condition chatter, and rider camaraderie',
  corridorName: 'All Highway Corridors',
  createdAt: 1715000000000,
};
