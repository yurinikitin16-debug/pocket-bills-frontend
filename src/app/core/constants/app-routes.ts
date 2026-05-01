import {UserProfile} from '../auth/auth.models';


export const APP_ROUTES = {
  AFTER_AUTH: {
    USER: '/dashboard',
    ADMIN: '/profile'
  },
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
} as const;

export function getAfterAuthRoute(user: UserProfile): string {
  console.log(user)
  return user.role === 'ADMIN'
    ? APP_ROUTES.AFTER_AUTH.ADMIN
    : APP_ROUTES.AFTER_AUTH.USER;
}
