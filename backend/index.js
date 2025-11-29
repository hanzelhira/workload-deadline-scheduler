const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// in-memory task store
let tasks = [];
let nextId = 1;

function getWeekDays(startDateStr) {
  const days = [];
  const start = new Date(startDateStr);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push(iso);
  }

  return days;
}

function balanceTasks(tasks, weekStartStr) {
  const weekDays = getWeekDays(weekStartStr);

  const schedule = {};
  for (const date of weekDays) {
    schedule[date] = {
      date,
      totalHours: 0,
      slots: []
    };
  }

  const priorityWeight = { high: 1, medium: 2, low: 3 };

  const relevantTasks = [...tasks].sort((a, b) => {
    if (a.dueDate === b.dueDate) {
      return (priorityWeight[a.priority || "medium"] || 2) -
             (priorityWeight[b.priority || "medium"] || 2);
    }
    return a.dueDate < b.dueDate ? -1 : 1;
  });

  for (const task of relevantTasks) {
    let remaining = task.durationHours;

    const weekDaysSorted = [...weekDays].sort();
    const eligibleDays = weekDaysSorted.filter(d => d <= task.dueDate);
    if (eligibleDays.length === 0) continue;

    while (remaining > 0) {
      let bestDay = eligibleDays[0];
      for (const d of eligibleDays) {
        if (schedule[d].totalHours < schedule[bestDay].totalHours) {
          bestDay = d;
        }
      }

      const chunk = Math.min(1, remaining);
      schedule[bestDay].slots.push({
        taskId: task.id,
        taskTitle: task.title,
        hours: chunk
      });
      schedule[bestDay].totalHours += chunk;
      remaining -= chunk;
    }
  }

  return weekDays.map(d => schedule[d]);
}

// routes
app.get("/", (req, res) => {
  res.send("Scheduling Balancer API is alive");
});

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/tasks", (req, res) => {
  const { title, durationHours, dueDate, priority } = req.body;

  if (!title || !durationHours || !dueDate) {
    return res
      .status(400)
      .json({ error: "title, durationHours, and dueDate are required" });
  }

  const newTask = {
    id: nextId++,
    title,
    durationHours: Number(durationHours),
    dueDate,
    priority: priority || "medium"
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  tasks = tasks.filter(t => t.id !== id);
  res.status(204).send();
});

app.post("/balance", (req, res) => {
  const { weekStart } = req.body;
  if (!weekStart) {
    return res.status(400).json({ error: "weekStart is required" });
  }

  const result = balanceTasks(tasks, weekStart);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
