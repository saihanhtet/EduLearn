"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/lib/apiService";
import Loader from "@/components/partials/Loader";
import { UserDetail, ApiError } from "@/lib/eventModels";

/**
 * The `useUserProfile` custom hook in TypeScript React manages user profile data fetching, updating,
 * loading states, errors, and toast messages.
 * @returns The `useUserProfile` custom hook is returning an object with the following properties:
 */

export const useUserProfile = () => {
    const [user, setUser] = useState<UserDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    /**
     * The function `fetchUserProfile` is an asynchronous function that fetches the user profile data,
     * handles errors, and updates the state accordingly.
     */
    const fetchUserProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userData = await apiService.getById<UserDetail>("users", "me");
            setUser(userData);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || "Failed to load profile data");
            toast.error("Failed to Load Profile Data");
            if (apiError.status === 401) {
                router.push("/login");
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * The function `updateUserProfile` is an asynchronous function that updates a user's profile data
     * using an API service, handling loading states, errors, and displaying toast messages
     * accordingly.
     * @param {UserDetail} userData - The `userData` parameter in the `updateUserProfile` function is
     * of type `UserDetail`, which likely contains information about a user such as their name, email,
     * profile picture, etc. This data is used to update the user's profile information in the
     * application.
     */
    const updateUserProfile = async (userData: UserDetail) => {
        setIsLoading(true);
        console.log(userData);
        setError(null);
        try {
            if (user) {
                const updatedUser = await apiService.update<UserDetail, Partial<UserDetail>>("users", user.id, userData);
                setUser(updatedUser);
                toast.success("Profile updated successfully!");
            }
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || "Failed to update profile");
            toast.error(apiError.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    return { user, isLoading, error, updateUserProfile };
};

// Reusable Profile Form Component
const ProfileForm: React.FC<{
    user: UserDetail | null;
    onSubmit: (userData: Partial<UserDetail>) => void;
    isLoading: boolean;
}> = ({ user, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
        username: "",
        preferred_subject: "",
        bio: "",
        website: "",
        gender: "" as "" | "Male" | "Female" | "Other",
        date_of_birth: "",
        phone_number: "",
    });

    /* The `useEffect` hook you provided is responsible for updating the form data state (`formData`)
    whenever the `user` object changes. Here's a breakdown of what it does: */
    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || "",
                preferred_subject: user.preferred_subject || "",
                bio: user.profile.bio || "",
                website: user.profile.website || "",
                gender: user.profile.gender || "" as "" | "Male" | "Female" | "Other",
                date_of_birth: user.profile.date_of_birth || "",
                phone_number: user.profile.phone_number || "",
            });
        }
    }, [user]);

    /**
     * The handleChange function updates the form data based on the input value of an input field or
     * text area in a TypeScript React component.
     * @param e - The parameter `e` in the `handleChange` function is of type
     * `React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>`. This means it is an event object
     * that is triggered when the value of an input field or a text area element changes in a React
     * component.
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * The function `handleGenderChange` updates the gender value in the form data based on the
     * selected option.
     * @param {"Male" | "Female" | "Other"} value - The `value` parameter in the `handleGenderChange`
     * function is a string literal type that can only be one of three options: "Male", "Female", or
     * "Other".
     */
    const handleGenderChange = (value: "Male" | "Female" | "Other") => {
        setFormData((prev) => ({ ...prev, gender: value }));
    };

    /**
     * The handleSubmit function in TypeScript React handles form submission by extracting user data
     * and passing it to the onSubmit function.
     * @param e - The parameter `e` in the `handleSubmit` function is of type `React.FormEvent`. It is
     * an event object that represents a form submission event in React. In this function, it is used
     * to prevent the default form submission behavior using `e.preventDefault()`.
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userData: Partial<UserDetail> = {
            username: formData.username,
            preferred_subject: formData.preferred_subject || undefined,
            profile: {
                bio: formData.bio || undefined,
                website: formData.website || undefined,
                gender: formData.gender === "" ? undefined : formData.gender,
                date_of_birth: formData.date_of_birth || undefined,
                phone_number: formData.phone_number || undefined,
                account_status: user?.profile.account_status || "Active",
                joined_date: user?.profile.joined_date || "",
            },
        };
        onSubmit(userData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <Label htmlFor="preferred_subject">Preferred Subject</Label>
                    <Input
                        id="preferred_subject"
                        name="preferred_subject"
                        value={formData.preferred_subject}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    disabled={isLoading}
                />
            </div>
            <div>
                <Label htmlFor="website">Website</Label>
                <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={isLoading}
                />
            </div>
            <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                    value={formData.gender || undefined} // Allow undefined for initial empty state
                    onValueChange={handleGenderChange}
                    disabled={isLoading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                        id="phone_number"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        disabled={isLoading}
                    />
                </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? "Saving..." : "Save Changes"}
            </Button>
        </form>
    );
};

// Main Profile Update Page
export default function ProfileUpdatePage() {
    const { user, isLoading, error, updateUserProfile } = useUserProfile();

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader title="Update Profile" is_student={false} />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
                        {isLoading ? (
                            <div className="h-[80vh] flex justify-center items-center">
                                <Loader />
                            </div>
                        ) : error ? (
                            <div className="h-[80vh] flex justify-center items-center">
                                <p className="text-red-500 text-center">{error}</p>
                            </div>
                        ) : !user ? (
                            <div className="h-[80vh] flex justify-center items-center">
                                <p className="text-gray-500 text-center">No profile data available.</p>
                            </div>
                        ) : (
                            <Card className="max-w-2xl mx-auto">
                                <CardHeader>
                                    <CardTitle>Edit Profile</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ProfileForm user={user} onSubmit={updateUserProfile} isLoading={isLoading} />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
