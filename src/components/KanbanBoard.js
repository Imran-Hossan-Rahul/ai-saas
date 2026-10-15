"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Clock, CheckCircle2, MessageSquare, ListChecks } from "lucide-react";
import TaskDetailModal from "./TaskDetailModal";

const COLUMNS = [
  { id: "todo", title: "To Do", color: "border-slate-500", bg: "bg-slate-500/10" },
  { id: "in-progress", title: "In Progress", color: "border-amber-500", bg: "bg-amber-500/10" },
  { id: "review", title: "Review", color: "border-indigo-500", bg: "bg-indigo-500/10" },
  { id: "done", title: "Done", color: "border-emerald-500", bg: "bg-emerald-500/10" },
];

export default function KanbanBoard({ initialTasks, projectId, role }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [isClient, setIsClient] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    setTasks(initialTasks || []);
  }, [initialTasks]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const syncWithBackend = async (updatedTasks) => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks }),
      });
    } catch (error) {
      console.error("Failed to sync tasks", error);
    }
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const draggedTaskIndex = tasks.findIndex(t => t._id === draggableId);
    if (draggedTaskIndex === -1) return;

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedTaskIndex, 1);

    draggedTask.status = destination.droppableId;
    newTasks.splice(destination.index, 0, draggedTask);
    
    const updatedTasksToSync = [];
    newTasks.forEach((task, index) => {
      if (task.status === destination.droppableId || task._id === draggableId) {
        task.order = index;
        updatedTasksToSync.push({ _id: task._id, status: task.status, order: index });
      }
    });

    setTasks(newTasks);
    syncWithBackend(updatedTasksToSync);
  };

  if (!isClient) return <div className="animate-pulse h-96 bg-slate-800/50 rounded-xl"></div>;

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col h-full min-h-[500px]">
              <div className={"flex items-center justify-between p-3 mb-4 rounded-xl border-t-2 bg-slate-900/50 " + column.color + " shadow-lg"}>
                <h3 className="font-semibold text-white">{column.title}</h3>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-full font-medium">
                  {tasks.filter((t) => t.status === column.id).length}
                </span>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={"flex-1 rounded-2xl p-3 transition-colors duration-200 " + (snapshot.isDraggingOver ? "bg-slate-800/60 ring-2 ring-indigo-500/30" : "bg-slate-900/30")}
                  >
                    {tasks
                      .filter((t) => t.status === column.id)
                      .sort((a, b) => a.order - b.order)
                      .map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={role === "client"}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              onClick={() => setSelectedTask(task)}
                              className={"mb-3 rounded-xl p-4 border transition-all duration-200 group cursor-pointer " + (snapshot.isDragging ? "bg-slate-800 border-indigo-500 shadow-2xl scale-105 rotate-1 z-50" : "bg-slate-900 border-slate-700 shadow-lg hover:border-slate-500 hover:bg-slate-800/80")}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-slate-200 text-sm">{task.title}</h4>
                                <div
                                  {...provided.dragHandleProps}
                                  onClick={(e) => e.stopPropagation()}
                                  className={"text-slate-500 " + (role === "client" ? "hidden" : "cursor-grab active:cursor-grabbing hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity")}
                                >
                                  <GripVertical size={16} />
                                </div>
                              </div>
                              {task.description && (
                                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                              )}
                              <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-800">
                                <span className={"text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider " + (
                                  task.priority === "urgent" ? "bg-rose-500/20 text-rose-400" :
                                  task.priority === "high" ? "bg-amber-500/20 text-amber-400" :
                                  "bg-slate-700/50 text-slate-300"
                                )}>
                                  {task.priority}
                                </span>
                                <div className="flex items-center gap-3">
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="flex items-center gap-1 text-slate-500 text-[10px] font-medium" title="Subtasks">
                                      <ListChecks size={12} />
                                      {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                                    </div>
                                  )}
                                  {task.comments && task.comments.length > 0 && (
                                    <div className="flex items-center gap-1 text-slate-500 text-[10px] font-medium" title="Comments">
                                      <MessageSquare size={12} />
                                      {task.comments.length}
                                    </div>
                                  )}
                                  {task.status === "done" ? (
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                  ) : task.dueDate ? (
                                    <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.dueDate) < new Date() ? 'text-rose-400' : 'text-slate-500'}`}>
                                      <Clock size={12} />
                                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                  ) : (
                                    <Clock size={14} className="text-slate-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          isOpen={!!selectedTask} 
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={() => {
            router.refresh(); 
          }} 
        />
      )}
    </>
  );
}
