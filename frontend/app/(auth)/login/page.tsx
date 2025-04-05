"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiService } from "@/lib/apiService";
import { LoginResponse } from "@/lib/eventModels";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Login() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const router = useRouter();

    /* The `useEffect` hook in the provided code snippet is responsible for setting up a listener to detect
    changes in the user's preferred color scheme (light or dark mode) and updating the state variable
    `isDarkMode` accordingly. */
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);

        const handler = (e: { matches: boolean | ((prevState: boolean) => boolean); }) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    /**
     * The `handleLogin` function attempts to log in a user using the provided email and password,
     * redirecting to the dashboard upon successful login or displaying an error message if login
     * fails.
     */
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
        <div className={`min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 mx-2 ${isDarkMode ? 'dark' : ''}`}>
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Login</h1>
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Button
                    onClick={handleLogin}
                    className="w-full dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                    Login
                </Button>
                {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
                <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                    Don't have an account?{" "}
                    <a href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Register here
                    </a>
                </p>
            </div>
        </div>
    );
}
