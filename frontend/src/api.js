const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(url, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const res = await fetch(BASE_URL + url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data.detail || "Request failed";
    throw new Error(typeof err === "string" ? err : err[0]?.msg || "Request failed");
  }
  return data;
}

export function register(username, email, password) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login(username, password) {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(BASE_URL + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Login failed");
  }
  return data;
}

export function getTasks(page = 1, search = "", status = "", limit = 10) {
  let url = `/tasks?page=${page}&page_size=${limit}`;
  if (search) url += `&search=${search}`;
  if (status) url += `&status=${status}`;
  return request(url);
}

export function createTask(task) {
  return request("/tasks", { method: "POST", body: JSON.stringify(task) });
}

export function updateTask(id, task) {
  return request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(task) });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: "DELETE" });
}
