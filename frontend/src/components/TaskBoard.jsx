import TaskCard from "./TaskCard";

const cols = ["Todo", "In Progress", "Done"];

export default function TaskBoard({ tasks, onEdit, onDelete, onDrop }) {
  return (
    <div className="board">
      {cols.map((col) => (
        <div
          key={col}
          className="board-column"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = Number(e.dataTransfer.getData("id"));
            onDrop(id, col);
          }}
        >
          <h3>{col}</h3>
          {tasks.filter((t) => t.status === col).map((t) => (
            <div
              key={t.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("id", t.id)}
            >
              <TaskCard task={t} onEdit={onEdit} onDelete={onDelete} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
