"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Send, Clock, User, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function TaskDetailModal({ task, isOpen, onClose, onTaskUpdate }) {
  const [comments, setComments] = useState(task?.comments || []);
  const [newComment, setNewComment] = useState("");
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState("");
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (task) {
      setComments(task.comments || []);
      setSubtasks(task.subtasks || []);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    }
  }, [task]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment }),
      });

      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      } else {
        toast.error(data.error || "Failed to post comment");
      }
    } catch (error) {
      toast.error("Error posting comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === "urgent") return "bg-rose-500/20 text-rose-400";
    if (priority === "high") return "bg-amber-500/20 text-amber-400";
    return "bg-slate-700/50 text-slate-300";
  };

  const updateTaskData = async (updates) => {
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        if (onTaskUpdate) onTaskUpdate();
      } else {
        toast.error("Failed to update task");
      }
    } catch (err) {
      toast.error("Error updating task");
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const updatedSubtasks = [...subtasks, { title: newSubtask, isCompleted: false }];
    setSubtasks(updatedSubtasks);
    setNewSubtask("");
    await updateTaskData({ subtasks: updatedSubtasks });
  };

  const toggleSubtask = async (index) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index].isCompleted = !updatedSubtasks[index].isCompleted;
    setSubtasks(updatedSubtasks);
    await updateTaskData({ subtasks: updatedSubtasks });
  };

  const handleDueDateChange = async (e) => {
    const date = e.target.value;
    setDueDate(date);
    await updateTaskData({ dueDate: date });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md border uppercase tracking-wider bg-slate-800 text-slate-300 border-slate-700">
                {task.status.replace("-", " ")}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left Column: Details */}
          <div className="w-full md:w-5/12 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-8">
              {task.description || "No description provided for this task."}
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                  <Clock size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-slate-500 text-xs">Due Date</p>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={handleDueDateChange}
                    className="bg-transparent text-slate-200 focus:outline-none cursor-pointer w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                  <CheckCircle2 size={16} className={task.status === "done" ? "text-emerald-500" : ""} />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Status</p>
                  <p className="text-slate-200 capitalize">{task.status.replace("-", " ")}</p>
                </div>
              </div>
            </div>

            {/* Subtasks Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Subtasks ({subtasks.filter(s => s.isCompleted).length}/{subtasks.length})</h3>
              
              <div className="space-y-2 mb-3">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <button onClick={() => toggleSubtask(idx)} className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${st.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-600 text-transparent hover:border-indigo-500"}`}>
                      <CheckCircle2 size={14} />
                    </button>
                    <span className={`text-sm ${st.isCompleted ? "text-slate-500 line-through" : "text-slate-300"}`}>{st.title}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a new subtask..."
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button type="submit" disabled={!newSubtask.trim()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors">
                  Add
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Comments Section */}
          <div className="w-full md:w-7/12 flex flex-col bg-slate-950">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">Activity & Comments</h3>
            </div>
            
            {/* Comment List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6" ref={scrollRef} style={{ minHeight: "250px" }}>
              {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <MessageSquare size={32} className="mb-3 opacity-20" />
                  <p className="text-sm">No comments yet.</p>
                  <p className="text-xs mt-1">Start the conversation!</p>
                </div>
              ) : (
                comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0 border border-indigo-500/20">
                      {comment.user?.name?.charAt(0).toUpperCase() || <User size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-slate-200 text-sm">{comment.user?.name || "Unknown"}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm p-3 text-slate-300 text-sm whitespace-pre-wrap">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask a question or post an update..."
                  className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
