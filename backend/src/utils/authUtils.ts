import jwt, { SignOptions } from 'jsonwebtoken';

export const generateToken = (userId: string) => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256'
  };
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    options
  );
}; 