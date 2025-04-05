"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiService } from "@/lib/apiService";
import { RegisterResponse } from "@/lib/eventModels";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Register() {
    const [email, setEmail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
    const [error, setError] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const router = useRouter();

    // Detect system preference for dark mode
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);

        const handler = (e) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const handleRegister = async () => {
        try {
            await apiService.register<RegisterResponse>({
                email: email,
                username: username,
                password: password,
                role: role,
            });
            router.push("/login");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || 'Registration failed');
            } else {
                setError('An unexpected error occurred during registration');
            }
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 mx-2 ${isDarkMode ? 'dark' : ''}`}>
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Register</h1>
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Select
                    onValueChange={(value) => setRole(value as "student" | "teacher" | "admin")}
                    defaultValue="student"
                >
                    <SelectTrigger className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                        <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:text-white">
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    onClick={handleRegister}
                    className="w-full dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                    Register
                </Button>
                {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
                <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Login here
                    </a>
                </p>
            </div>
        </div>
    );
}
