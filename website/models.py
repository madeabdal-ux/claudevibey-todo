from django.db import models
from django.contrib.auth.models import User
from datetime import time

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    time_slot = models.TimeField(null=True, blank=True)  # For hourly slots
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'time_slot', 'created_at']
        unique_together = ['user', 'date', 'time_slot']

    def __str__(self):
        time_str = self.time_slot.strftime('%I:%M %p') if self.time_slot else 'No time'
        return f"{self.user.username} - {self.date} {time_str}: {self.title}"
