export default function TaskCard({ task, onEdit, onDelete }) {
  let badgeClass = "status-todo";
  if (task.status === "Done") badgeClass = "status-done";
  if (task.status === "In Progress") badgeClass = "status-progress";

  const due = task.due_date ? new Date(task.due_date).toLocaleDateString() : "-";
  const created = new Date(task.created_at).toLocaleDateString();

  return (
    <div className="task-card">
      <div className="task-header">
        <h3>{task.title}</h3>
        <span className={"status-badge " + badgeClass}>{task.status}</span>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        <span>Due: {due}</span>
        <span>Created: {created}</span>
      </div>

      <div className="task-actions">
        <button className="btn btn-small" onClick={() => onEdit(task)}>Edit</button>
        <button className="btn btn-small btn-danger" onClick={() => onDelete(task.id)}>Delete</button>
      </div>
    </div>
  );
}
