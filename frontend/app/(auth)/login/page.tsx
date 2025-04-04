"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiService } from "@/lib/apiService";
import { LoginResponse } from "@/lib/eventModels";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await apiService.login<LoginResponse>({
                email: email,
                password: password,
            });
            router.push("/dashboard");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || 'Login failed');
            } else {
                setError('An unexpected error occurred during login');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 mx-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900">Login</h1>
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                />
                <Button onClick={handleLogin} className="w-full">
                    Login
                </Button>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <p className="text-center text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <a href="/register" className="text-blue-600 hover:underline">
                        Register here
                    </a>
                </p>
            </div>
        </div>
    );
}
