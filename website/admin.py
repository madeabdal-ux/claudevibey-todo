from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'date', 'time_slot', 'priority', 'completed', 'created_at']
    list_filter = ['date', 'priority', 'completed', 'user']
    search_fields = ['title', 'description', 'user__username']
    ordering = ['-date', 'time_slot']
