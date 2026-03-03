import { NextAuthOptions } from 'next-auth';
import { authConfig } from './auth-config';

export const authOptions: NextAuthOptions = {
  ...authConfig,
};
