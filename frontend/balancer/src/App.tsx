import { useEffect, useState } from "react";
import type { FormEvent } from "react";

const API_URL = "http://localhost:3000";

type Priority = "low" | "medium" | "high";

interface Task {
  id: number;
  title: string;
  durationHours: number;
  dueDate: string; // "yyyy-mm-dd"
  priority: Priority;
}

interface Slot {
  taskId: number;
  taskTitle: string;
  hours: number;
}

interface DaySchedule {
  date: string;
  totalHours: number;
  slots: Slot[];
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const [weekStart, setWeekStart] = useState("");
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);

  // load tasks on mount
  useEffect(() => {
    fetch(`${API_URL}/tasks`)
      .then(res => res.json())
      .then((data: Task[]) => setTasks(data))
      .catch(err => console.error("Failed to load tasks", err));
  }, []);

  function handleAddTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        durationHours: Number(durationHours),
        dueDate,
        priority
      })
    })
      .then(res => res.json())
      .then((newTask: Task) => {
        setTasks(prev => [...prev, newTask]);
        setTitle("");
        setDurationHours("");
        setDueDate("");
        setPriority("medium");
      })
      .catch(err => console.error("Failed to add task", err));
  }

  function handleDeleteTask(id: number) {
    fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" })
      .then(() => {
        setTasks(prev => prev.filter(t => t.id !== id));
      })
      .catch(err => console.error("Failed to delete task", err));
  }

  function handleBalance(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!weekStart) return;

    fetch(`${API_URL}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart })
    })
      .then(res => res.json())
      .then((data: DaySchedule[]) => setSchedule(data))
      .catch(err => console.error("Failed to balance", err));
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <h1>Scheduling Balancer</h1>

      {/* Add Task */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Add Task</h2>
        <form onSubmit={handleAddTask}>
          <div>
            <input
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              placeholder="Duration (hours)"
              type="number"
              min="0.5"
              step="0.5"
              value={durationHours}
              onChange={e => setDurationHours(e.target.value)}
              required
            />
          </div>
          <div>
            <label>
              Due date:{" "}
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Priority:{" "}
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>
          </div>
          <button type="submit">Add task</button>
        </form>
      </section>

      {/* Task list */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Tasks</h2>
        {tasks.length === 0 ? (
          <p>No tasks yet.</p>
        ) : (
          <ul>
            {tasks.map(task => (
              <li key={task.id}>
                <strong>{task.title}</strong> — {task.durationHours}h — due{" "}
                {task.dueDate} — {task.priority}
                <button
                  style={{ marginLeft: "0.5rem" }}
                  onClick={() => handleDeleteTask(task.id)}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Balancer */}
      <section>
        <h2>Balance Week</h2>
        <form onSubmit={handleBalance}>
          <label>
            Week start:{" "}
            <input
              type="date"
              value={weekStart}
              onChange={e => setWeekStart(e.target.value)}
              required
            />
          </label>
          <button type="submit" style={{ marginLeft: "0.5rem" }}>
            Generate schedule
          </button>
        </form>

        {schedule.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            {schedule.map(day => (
              <div
                key={day.date}
                style={{
                  border: "1px solid #ccc",
                  padding: "0.5rem",
                  marginBottom: "0.5rem"
                }}
              >
                <h3>
                  {day.date} — total {day.totalHours}h
                </h3>
                {day.slots.length === 0 ? (
                  <p>No tasks.</p>
                ) : (
                  <ul>
                    {day.slots.map((slot, idx) => (
                      <li key={idx}>
                        {slot.taskTitle} — {slot.hours}h
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

