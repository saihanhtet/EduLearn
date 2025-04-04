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
import { useState } from "react";

export default function Register() {
    const [email, setEmail] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [role, setRole] = useState<"student" | "teacher" | "admin">("student");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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
        <div className="min-h-screen flex items-center justify-center bg-gray-100 mx-2">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900">Register</h1>
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                />
                <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full"
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                />
                <Select onValueChange={(value) => setRole(value as "student" | "teacher" | "admin")} defaultValue="student">
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleRegister} className="w-full">
                    Register
                </Button>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-600 hover:underline">
                        Login here
                    </a>
                </p>
            </div>
        </div>
    );
}
