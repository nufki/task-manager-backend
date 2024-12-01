export enum TaskPriority {
    Low = "low",
    Medium = "medium",
    High = "high",
}

export enum TaskStatus {
    NotStarted = "not-started",
    InProgress = "in-progress",
    Completed = "completed",
}

export interface Task {
    id: string; // Generated UIIDV4
    userId: string;  // The ID of the user who owns / created this task
    name: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date;
    assignedUser?: string;
}
