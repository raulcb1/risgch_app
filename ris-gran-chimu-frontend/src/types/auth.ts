export type LoginResponse = {
  user: {
    id: number;
    nombre: string;
    email: string;
    rol: 'admin' | 'editor';
  };
  token: string;
};