// Ensure the environment variable is defined
export const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_BASE_URL || '';

if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined in environment variables');
}

// Custom error class to include status code
class ApiError extends Error {
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export class ApiService {
    // Helper method to get the auth token from localStorage
    private getAuthToken(): string | null {
        return localStorage.getItem('token');
    }

    // Helper method to set the auth token in localStorage
    private setAuthToken(token: string): void {
        localStorage.setItem('token', token);
    }

    // Helper method to remove the auth token from localStorage
    private removeAuthToken(): void {
        localStorage.removeItem('token');
    }

    // Helper method to create headers with auth token
    private getAuthHeaders(): Record<string, string> {
        const token = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }

    // Helper method to handle API response errors
    private async handleApiError(res: Response, resource: string, action: string): Promise<void> {
        let errorMessage = `Failed to ${action} ${resource}`;
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (jsonError) {
            errorMessage = res.statusText || errorMessage;
        }

        if (res.status === 401) {
            throw new ApiError(`Authentication failed: Invalid or missing token for ${resource}`, res.status);
        } else if (res.status === 403) {
            throw new ApiError(`Authorization failed: You do not have permission to access ${resource}`, res.status);
        } else if (res.status === 404) {
            throw new ApiError(`Resource not found: ${resource} does not exist`, res.status);
        } else if (res.status >= 500) {
            throw new ApiError(`Server error: Failed to ${action} ${resource} (Status: ${res.status})`, res.status);
        } else {
            throw new ApiError(errorMessage, res.status);
        }
    }

    // Reusable error handler for catch blocks
    private handleCatchError(err: unknown, resource: string, action: string): never {
        if (err instanceof ApiError) {
            throw err;
        }
        const error = err as Error;
        if (error.message.includes('Failed to fetch')) {
            throw new ApiError(
                `Network error: Unable to ${action} ${resource}. This may be due to CORS issues, the backend not running, or a network failure.`,
                0
            );
        }
        throw new ApiError(error.message || `Failed to ${action} ${resource}`, 0);
    }

    // LOGIN: Authenticate user and store token
    public async login<T>(data: { email: string; password: string }): Promise<T> {
        try {
            const res = await fetch(`${API_BASE_URL}/token/pair`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                await this.handleApiError(res, 'authentication', 'login');
            }

            const response: T & { access: string; refresh?: string } = await res.json();
            this.setAuthToken(response.access);
            return response;
        } catch (err) {
            this.handleCatchError(err, 'authentication', 'login');
        }
    }

    // REGISTER: Create new user account
    public async register<T>(data: { username: string; password: string; email: string, role: string }): Promise<T> {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                await this.handleApiError(res, 'user', 'register');
            }

            const response: T = await res.json();
            return response;
        } catch (err) {
            this.handleCatchError(err, 'user', 'register');
        }
    }

    // LOGOUT: Clear authentication token
    public async logout(): Promise<void> {
        this.removeAuthToken();
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    // CREATE: Create a new resource
    public async create<T, U>(resource: string, data: U): Promise<T> {
        try {
            const res = await fetch(`${API_BASE_URL}/${resource}/`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                await this.handleApiError(res, resource, 'create');
            }

            const response: T = await res.json();
            return response;
        } catch (err) {
            this.handleCatchError(err, resource, 'create');
        }
    }

    public async getRecommended<T>(query: string): Promise<T> {
        try {
            const res = await fetch(`${API_BASE_URL}/recommend${query}`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });
            if (!res.ok) {
                await this.handleApiError(res, 'recommended courses', 'fetch');
            }
            return await res.json();
        } catch (err) {
            this.handleCatchError(err, 'recommended courses', 'fetch');
        }
    }

    // READ: Get all resources
    public async getAll<T>(resource: string): Promise<T[]> {
        try {
            const url = `${API_BASE_URL}/${resource}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            if (!res.ok) {
                await this.handleApiError(res, resource, 'fetch');
            }

            const response: T[] = await res.json();
            return response;
        } catch (err) {
            this.handleCatchError(err, resource, 'fetch');
        }
    }

    // READ: Get Me
    public async getMe<T>(resource: string): Promise<T> {
        try {
            const res = await fetch(`${API_BASE_URL}/${resource}/me`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            if (!res.ok) {
                await this.handleApiError(res, `${resource}`, 'fetch');
            }

            const response: T = await res.json();
            return response;
        } catch (err) {
            this.handleCatchError(err, `${resource}`, 'fetch');
        }
    }

    // READ: Get a single resource by ID
    public async getById<T>(resource: string, id: number | string): Promise<T> {
        try {
            const res = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            if (!res.ok) {
                await this.handleApiError(res, `${resource} with ID ${id}`, 'fetch');
            }

            const response: T = await res.json();
            return response;
        } catch (err) {
            this.handleCatchError(err, `${resource} with ID ${id}`, 'fetch');
        }
    }

    // UPDATE: Update a resource by ID
    public async update<T, U>(resource: string, id: number | string, data: U): Promise<T> {
        try {
            const res = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                await this.handleApiError(res, `${resource} with ID ${id}`, 'update');
            }

            const response: T = await res.json();
            return response;
        } catch (err) {
            this.handleCatchError(err, `${resource} with ID ${id}`, 'update');
        }
    }

    // DELETE: Delete a resource by ID
    public async delete(resource: string, id: number | string): Promise<void> {
        try {
            const res = await fetch(`${API_BASE_URL}/${resource}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders(),
            });

            if (!res.ok) {
                await this.handleApiError(res, `${resource} with ID ${id}`, 'delete');
            }
        } catch (err) {
            this.handleCatchError(err, `${resource} with ID ${id}`, 'delete');
        }
    }
}

// Create a singleton instance
export const apiService = new ApiService();
