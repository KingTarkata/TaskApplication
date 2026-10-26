import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category';
import { Task, TaskStatus, SubTask, generateUUID } from '../../models/task.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-task-modals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-modals.html',
  styleUrl: './task-modals.css',
})
export class TaskModals implements OnDestroy {
  eTaskStatus = TaskStatus;

  // Variables
  newTaskTitle: string = '';
  newTaskType: string = '';
  newTaskDesc: string = '';
  newTaskDate: string = ''; // String for input field
  tempSubtasks: SubTask[] = [];
  newSubtaskTitle: string = '';

  // Edit state
  isEditing: boolean = false;
  editingId: string | null = null;
  editingCreatedAt: Date | null = null;
  currentTaskStatus: TaskStatus = TaskStatus.TODO;

  // Category variables
  newCatName: string = '';
  newCatColor: string = 'primary';
  showCatManager: boolean = false;

  private editSub: Subscription;

  constructor(public taskService: TaskService, public categoryService: CategoryService) {
    if (this.categoryService.categories.length > 0) {
      this.newTaskType = this.categoryService.categories[0].name;
    }

    // Edit event listener
    this.editSub = this.taskService.editTaskSubject.subscribe((task) => {
      if (task) {
        // Fill form with existing data
        this.isEditing = true;
        this.editingId = task.id;
        this.editingCreatedAt = task.createdAt;
        this.showCatManager = false;
        this.newTaskTitle = task.title;
        this.newTaskType = task.type;
        this.newTaskDesc = task.description;
        this.currentTaskStatus = task.status;

        // Convert Date to String
        if (task.dueDate) {
          const localIso = new Date(
            task.dueDate.getTime() - task.dueDate.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16);
          this.newTaskDate = localIso;
        } else {
          this.newTaskDate = '';
        }
        this.tempSubtasks = task.subtasks.map((st) => ({ ...st }));
      } else {
        this.resetForm();
      }
    });
  }

  ngOnDestroy() {
    this.editSub.unsubscribe();
  }

  // Add SubTask functionality
  addSubtask() {
    if (!this.newSubtaskTitle.trim()) return;

    const newItem: SubTask = {
      id: generateUUID(),
      title: this.newSubtaskTitle.trim(),
      completed: false,
    };

    this.tempSubtasks.push(newItem);
    this.newSubtaskTitle = '';
  }

  removeSubtask(index: number) {
    this.tempSubtasks.splice(index, 1);
  }

  // Save task
  saveTask() {
    if (this.newTaskTitle.trim().length === 0) return;
    this.newTaskTitle = this.newTaskTitle.trim();
    const finalDate = this.newTaskDate ? new Date(this.newTaskDate) : undefined;

    // Update if editing task
    if (this.isEditing && this.editingId) {
      const updatedTask = new Task(
        this.newTaskTitle,
        this.newTaskType,
        this.newTaskDesc,
        finalDate,
        this.tempSubtasks
      );
      updatedTask.id = this.editingId;
      updatedTask.status = this.currentTaskStatus;
      updatedTask.createdAt = this.editingCreatedAt ?? updatedTask.createdAt;
      this.taskService.updateExistingTask(updatedTask);
    } else {
      // Create if new task
      const task = new Task(
        this.newTaskTitle,
        this.newTaskType,
        this.newTaskDesc,
        finalDate,
        this.tempSubtasks
      );
      this.taskService.addTask(task);
    }
    this.resetForm();
  }

  resetForm() {
    this.isEditing = false;
    this.editingId = null;
    this.editingCreatedAt = null;
    this.currentTaskStatus = TaskStatus.TODO;
    this.showCatManager = false;
    this.newTaskTitle = '';
    this.newTaskDesc = '';
    this.newTaskDate = '';
    this.tempSubtasks = [];
    this.newSubtaskTitle = '';
    if (this.categoryService.categories.length > 0) {
      this.newTaskType = this.categoryService.categories[0].name;
    }
  }

  // Add new category with name and color options
  addNewCategory() {
    if (this.newCatName.trim().length === 0) return;
    this.categoryService.addCategory(this.newCatName, this.newCatColor);
    this.newCatName = '';
  }

  // Delete existing categories
  deleteCategory(id: string) {
    this.categoryService.removeCategory(id);
    if (this.categoryService.categories.length > 0) {
      this.newTaskType = this.categoryService.categories[0].name;
    }
  }

  // Permanently delete an archived task (its XP is removed with it)
  deleteTask(task: Task) {
    if (confirm(`Permanently delete "${task.title}"? Its XP will be lost.`)) {
      this.taskService.removeTask(task.id);
    }
  }

  updateStatus(t: Task, s: TaskStatus) {
    t.status = s;
    this.taskService.saveToStorage();
  }
  getTasksByStatus(s: TaskStatus) {
    return this.taskService.tasks.filter((t) => t.status === s);
  }
}
