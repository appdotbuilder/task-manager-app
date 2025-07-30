
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, LoginInput } from '../../../server/src/schema';

interface UserAuthProps {
  onLogin: (user: User) => void;
}

export function UserAuth({ onLogin }: UserAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });

  // Registration form state
  const [registerData, setRegisterData] = useState<CreateUserInput>({
    email: '',
    name: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await trpc.loginUser.mutate(loginData);
      onLogin(user);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      // For demo purposes with stub handlers
      console.log('🔑 Login attempted with:', loginData);
      console.log('📝 Note: Using demo user since backend is stub');
      
      // Create a demo user for development
      const demoUser: User = {
        id: 1,
        email: loginData.email,
        name: 'Demo User',
        password_hash: 'hashed',
        created_at: new Date(),
        updated_at: new Date()
      };
      onLogin(demoUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await trpc.createUser.mutate(registerData);
      onLogin(user);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      // For demo purposes with stub handlers
      console.log('👤 Registration attempted with:', registerData);
      console.log('📝 Note: Using demo user since backend is stub');
      
      // Create a demo user for development
      const demoUser: User = {
        id: 1,
        email: registerData.email,
        name: registerData.name,
        password_hash: 'hashed',
        created_at: new Date(),
        updated_at: new Date()
      };
      onLogin(demoUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            📋 Welcome to TaskFlow
          </CardTitle>
          <CardDescription>
            Your personal task management and collaboration platform
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : '🔑 Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    value={registerData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Create a password (min 6 chars)"
                    minLength={6}
                    required
                  />
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : '👤 Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {/* Demo note */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            <strong>Demo Mode:</strong> Backend handlers are stubs. Any email/password combination will create a demo user for testing the interface.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
