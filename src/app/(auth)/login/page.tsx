'use client';

import { useState } from 'react';

import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Guardar el token en una cookie (httpOnly sería mejor en producción real)
      document.cookie = `firebaseAuthToken=${idToken}; path=/; max-age=3600`;

      toast.success('Inicio de sesión exitoso.');
      router.push('/app'); // Redirigir al dashboard
    } catch (error) {
      console.error(error);
      toast.error('Error al iniciar sesión. Verifique sus credenciales.');
    }
  };

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, 'admin@kikes.com', 'Admin123');
      toast.success('Admin creado. Ahora puede iniciar sesión.');
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        toast.info('El usuario admin ya existe. Inicie sesión.');
      } else {
        const message = error instanceof FirebaseError ? error.message : 'Desconocido';
        toast.error(`Error al registrar admin: ${message}`);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <Toaster position="top-right" richColors />
      <Card className="w-[400px] bg-secondary border-none text-text-dark">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/assets/logos/LOGO-KIKES.avif"
              alt="Huevos Kikes"
              width={180}
              height={180}
              priority
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Inicio de Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-base focus:border-accent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-base focus:border-accent"
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-text-dark hover:bg-accent/90">
                Ingresar
              </Button>
              <Link href="/recuperar-password" passHref>
                <Button variant="link" className="w-full text-text-dark">
                  ¿Olvidó su contraseña?
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                onClick={handleRegister}
              >
                Registrar Admin (Primer Uso)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
