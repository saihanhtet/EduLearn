"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { UseApiDataProps } from "./eventModels";
import { useUserStore } from "./store";

// Environment variable validation
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined in environment variables");
}

// Custom error type
interface ApiError extends Error {
    status: number;
    details?: unknown;
}

const createApiError = (message: string, status: number, details?: unknown): ApiError => {
    const error = new Error(message) as ApiError;
    error.name = "ApiError";
    error.status = status;
    error.details = details;
    return error;
};

// Token management
const getAuthToken = (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

const setAuthToken = (token: string): void => {
    if (typeof window !== "undefined") localStorage.setItem("token", token);
};

const removeAuthToken = (): void => {
    if (typeof window !== "undefined") localStorage.removeItem("token");
};

// Header generation
const getHeaders = (includeContentType = true): Record<string, string> => {
    const token = getAuthToken();
    return {
        ...(includeContentType && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

// Request cache
const requestCache = new Map<string, Promise<unknown>>();

// Core fetch function with advanced features
const fetchApi = async <T>(
    url: string,
    options: RequestInit & { retries?: number; retryDelay?: number },
    resource: string,
    action: string,
    signal?: AbortSignal
): Promise<T> => {
    const cacheKey = `${options.method || "GET"}:${url}`;
    if (requestCache.has(cacheKey)) return requestCache.get(cacheKey) as Promise<T>;

    const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;
    let attempt = 0;

    const request = async (): Promise<T> => {
        try {
            const res = await fetch(url, { ...fetchOptions, signal });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw createApiError(
                    errorData.message || res.statusText || `Failed to ${action} ${resource}`,
                    res.status,
                    errorData
                );
            }
            return res.json();
        } catch (err) {
            if (signal?.aborted) throw createApiError("Request aborted", 0);
            if (err instanceof Error && err.message.includes("Failed to fetch")) {
                if (attempt < retries) {
                    attempt++;
                    await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
                    return request();
        }
                throw createApiError(
                    `Network error after ${retries} retries: Failed to ${action} ${resource}`,
                    0,
                    err
                );
            }
            throw err;
        }
    };

    const promise = request();
    requestCache.set(cacheKey, promise);
    promise.finally(() => requestCache.delete(cacheKey));
    return promise;
};

// API methods
export const apiService = {
    login: async <T>(data: { email: string; password: string }): Promise<T & { access: string }> => {
        const response = await fetchApi<T & { access: string }>(
            `${API_BASE_URL}/token/pair`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            },
            "authentication",
            "login"
        );
        setAuthToken(response.access);
        // Fetch user details after login
        try {
            const userData = await apiService.getMe<{ id: number; username: string; email: string; role: string }>("users");
            useUserStore.getState().setUser({
                id: userData.id,
                username: userData.username,
                email: userData.email,
                role: userData.role || "guest",
            });
        } catch (err) {
            console.error("Failed to fetch user details after login:", err);
            useUserStore.getState().setUser({ role: "student" });
        }
        return response;
    },

    register: async <T>(data: {
        username: string;
        password: string;
        email: string;
        role: string;
    }): Promise<T> =>
        fetchApi<T>(
            `${API_BASE_URL}/auth/register`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            },
            "user",
            "register"
        ),

    logout: async (): Promise<void> => {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: getHeaders(),
        });
        removeAuthToken();
        useUserStore.getState().clearUser();
    },

    getDashboard: <T>(): Promise<T> =>
        fetchApi<T>(
            `${API_BASE_URL}/dashboard`,
            { method: "GET", headers: getHeaders() },
            "dashboard",
            "get"
        ),

    create: async <T, U>(resource: string, data: U): Promise<T> =>
        fetchApi<T>(
            `${API_BASE_URL}/${resource}`,
            {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            },
            resource,
            "create"
        ),

    getRecommended: <T>(query: string): Promise<T> =>
        fetchApi<T>(
            `${API_BASE_URL}/recommend${query}`,
            { method: "GET", headers: getHeaders() },
            "recommended courses",
            "fetch"
        ),

    getAll: <T>(resource: string, signal?: AbortSignal): Promise<T[]> =>
        fetchApi<T[]>(
            `${API_BASE_URL}/${resource}`,
            { method: "GET", headers: getHeaders() },
            resource,
            "fetch",
            signal
        ),

    getMe: <T>(resource: string): Promise<T> =>
        fetchApi<T>(
            `${API_BASE_URL}/${resource}/me`,
            { method: "GET", headers: getHeaders() },
            resource,
            "fetch"
        ),

    getById: <T>(resource: string, id: number | string): Promise<T> =>
        fetchApi<T>(
            `${API_BASE_URL}/${resource}/${id}`,
            { method: "GET", headers: getHeaders() },
            `${resource} with ID ${id}`,
            "fetch"
        ),

    update: async <T, U>(resource: string, id: number | string, data: U): Promise<T> =>
        fetchApi<T>(
            `${API_BASE_URL}/${resource}/${id}`,
            {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify(data),
            },
            `${resource} with ID ${id}`,
            "update"
        ),

    delete: (resource: string, id: number | string): Promise<void> =>
        fetchApi<void>(
            `${API_BASE_URL}/${resource}/${id}`,
            { method: "DELETE", headers: getHeaders() },
            `${resource} with ID ${id}`,
            "delete"
        ),

    uploadFile: async <T>(
        resource: string,
        id: number | string,
        file: File,
        fieldName: string = "image"
    ): Promise<T> => {
        const formData = new FormData();
        formData.append(fieldName, file);
        return fetchApi<T>(
            `${API_BASE_URL}/${resource}/${id}/upload-image`,
            {
                method: "POST",
                headers: getHeaders(false),
                body: formData,
            },
            `${resource} image with ID ${id}`,
            "upload"
        );
    },
};

// Enhanced useApiData hook with abort and refresh
export const useApiData = <T>({ endpoint, mapData }: UseApiDataProps<T>) => {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleApiError = (err: ApiError) => {
        const errorMessage = err.message || "Failed to load data";
        setError(errorMessage);
        switch (err.status) {
            case 401:
                toast.error("Authentication failed. Please log in again.");
                router.push("/login");
                break;
            case 403:
                toast.error("You do not have permission to access this resource.");
                router.forward();
                break;
            case 404:
                toast.error("Resource not found.");
                break;
            case 0:
                toast.error("Network error. Please check your connection or server status.");
                break;
            default:
                toast.error(errorMessage);
        }
    };

    const fetchData = useCallback(
        async (signal?: AbortSignal) => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiService.getAll<unknown>(endpoint, signal);
                const mappedData = mapData ? mapData(response) : response;
                setData(mappedData as T[]);
            } catch (err) {
                if (!signal?.aborted) handleApiError(err as ApiError);
            } finally {
                setIsLoading(false);
            }
        },
        [endpoint] // eslint-disable-line react-hooks/exhaustive-deps
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData, router]);

    return {
        data,
        isLoading,
        error,
        refresh: () => fetchData(),
    };
};
