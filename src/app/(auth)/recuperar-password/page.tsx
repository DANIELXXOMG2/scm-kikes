'use client';

import { useState } from 'react';

import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/lib/firebase';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.warning('Ingresa un correo válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, trimmedEmail);
      if (methods.length === 0) {
        toast.warning('El correo ingresado no está registrado.');
        return;
      }

      await sendPasswordResetEmail(auth, trimmedEmail);
      toast.success('Enlace de recuperación enviado a su correo.');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar el correo.');
    } finally {
      setIsSubmitting(false);
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
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-center">Ingrese su correo para enviar el enlace.</p>
          <form onSubmit={handleReset}>
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
              <Button
                type="submit"
                className="w-full bg-accent text-text-dark hover:bg-accent/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Enlace'}
              </Button>
              <Link href="/login" passHref>
                <Button variant="link" className="w-full text-text-dark">
                  Volver a Inicio de Sesión
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
