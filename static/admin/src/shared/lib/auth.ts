import { User } from "../types";

const API_BASE_URL = "/api";
const TOKEN_KEY = "zalopay_admin_token";
const USER_KEY = "zalopay_admin_user";

export class AuthService {
  /**
   * Login with username and password
   */
  static async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    
    // Store token and user data
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data;
  }

  /**
   * Logout user
   */
  static logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Get stored authentication token
   */
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get stored user data
   */
  static getUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * Get current user info from API
   */
  static async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token");
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error("Session expired");
      }
      throw new Error("Failed to get user info");
    }

    const user = await response.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  }

  /**
   * Make authenticated API request
   */
  static async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        window.location.href = "/login";
        throw new Error("Session expired");
      }
      
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      
      // Transform backend paginated response to frontend format
      if (data.success && data.data && Array.isArray(data.data) && data.pagination) {
        return {
          items: data.data,
          total: data.pagination.total,
          pages: data.pagination.totalPages,
          current_page: data.pagination.page,
          per_page: data.pagination.limit,
        } as T;
      }
      
      // Return data directly if it's already in the expected format
      if (data.success && data.data) {
        return data.data as T;
      }
      
      // Return the whole response if no transformation needed
      return data as T;
    }
    
    return response.text() as T;
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<void> {
    try {
      await this.getCurrentUser();
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  /**
   * Setup automatic token refresh
   */
  static setupTokenRefresh(): void {
    // Refresh token every 30 minutes
    setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().catch(() => {
          // Silent fail - user will be redirected on next API call
        });
      }
    }, 30 * 60 * 1000);
  }
}

// Initialize token refresh on app start
if (typeof window !== "undefined") {
  AuthService.setupTokenRefresh();
}
