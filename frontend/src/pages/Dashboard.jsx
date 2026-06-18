import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import TaskBoard from "../components/TaskBoard";

const statuses = ["", "Todo", "In Progress", "Done"];

function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [view, setView] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const limit = view === "board" ? 50 : 10;
      const res = await getTasks(page, search, view === "board" ? "" : filter, limit);
      setTasks(res.tasks);
      setTotal(res.total);
    } catch (err) {
      if (err.message.includes("credentials")) {
        navigate("/login");
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [page, filter, view]);

  const onSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setError("");
    try {
      const limit = view === "board" ? 50 : 10;
      const res = await getTasks(1, search, view === "board" ? "" : filter, limit);
      setTasks(res.tasks);
      setTotal(res.total);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="dashboard">
      <div className="header">
        <h1>My Tasks</h1>
        <div className="header-right">
          <span>Hi, {username}</span>
          <button className="btn btn-small" onClick={toggleTheme}>Theme</button>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="toolbar">
        <form onSubmit={onSearch} className="search-form">
          <input
            placeholder="search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-small">Go</button>
        </form>

        {view === "list" && (
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            {statuses.map((s) => (
              <option key={s} value={s}>{s || "All"}</option>
            ))}
          </select>
        )}

        <button
          className={"btn btn-small" + (view === "list" ? " active" : "")}
          onClick={() => setView("list")}
        >List</button>
        <button
          className={"btn btn-small" + (view === "board" ? " active" : "")}
          onClick={() => { setView("board"); setPage(1); }}
        >Board</button>

        <button className="btn btn-primary" style={{ width: "auto" }} onClick={() => setShowForm(true)}>
          + Add Task
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {loading && <p className="loading">loading...</p>}

      {!loading && tasks.length === 0 && <p className="empty">no tasks yet</p>}

      {!loading && tasks.length > 0 && view === "list" && (
        <div className="task-list">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onEdit={setEditTask}
              onDelete={async (id) => {
                if (!confirm("delete this task?")) return;
                await deleteTask(id);
                fetchTasks();
              }}
            />
          ))}
        </div>
      )}

      {!loading && tasks.length > 0 && view === "board" && (
        <TaskBoard
          tasks={tasks}
          onEdit={setEditTask}
          onDelete={async (id) => {
            if (!confirm("delete this task?")) return;
            await deleteTask(id);
            fetchTasks();
          }}
          onDrop={(id, status) => {
            updateTask(id, { status }).then(fetchTasks);
          }}
        />
      )}

      {view === "list" && totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>prev</button>
          <span>{page} / {totalPages}</span>
          <button className="btn btn-small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>next</button>
        </div>
      )}

      {showForm && (
        <TaskForm
          onSave={async (data) => {
            await createTask(data);
            setShowForm(false);
            fetchTasks();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editTask && (
        <TaskForm
          task={editTask}
          onSave={async (data) => {
            await updateTask(editTask.id, data);
            setEditTask(null);
            fetchTasks();
          }}
          onCancel={() => setEditTask(null)}
        />
      )}
    </div>
  );
}
