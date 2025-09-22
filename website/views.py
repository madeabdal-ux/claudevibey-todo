from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import calendar
from datetime import datetime, date, time
import json
from .models import Task

def home(request):
	context = {}
	if request.user.is_authenticated:
		# Get current date
		today = date.today()
		year = request.GET.get('year', today.year)
		month = request.GET.get('month', today.month)

		try:
			year = int(year)
			month = int(month)
		except (ValueError, TypeError):
			year = today.year
			month = today.month

		# Generate calendar
		cal = calendar.Calendar(firstweekday=6)  # Start week on Sunday
		month_days = cal.monthdayscalendar(year, month)

		# Get month and year names
		month_name = calendar.month_name[month]

		# Calculate previous and next month/year
		if month == 1:
			prev_month, prev_year = 12, year - 1
		else:
			prev_month, prev_year = month - 1, year

		if month == 12:
			next_month, next_year = 1, year + 1
		else:
			next_month, next_year = month + 1, year

		context.update({
			'calendar_data': month_days,
			'current_month': month,
			'current_year': year,
			'month_name': month_name,
			'today': today,
			'prev_month': prev_month,
			'prev_year': prev_year,
			'next_month': next_month,
			'next_year': next_year,
		})

	return render(request, 'home.html', context)

@login_required
def dashboard(request):
	return render(request, 'dashboard.html', {'user': request.user})

def login_view(request):
	if request.method == 'POST':
		username = request.POST['username']
		password = request.POST['password']
		user = authenticate(request, username=username, password=password)
		if user is not None:
			login(request, user)
			return redirect('home')
		else:
			messages.error(request, 'Invalid username or password.')
	return render(request, 'login.html', {})

def signup_view(request):
	if request.method == 'POST':
		username = request.POST['username']
		email = request.POST['email']
		password = request.POST['password']
		password_confirm = request.POST['password_confirm']

		if password != password_confirm:
			messages.error(request, 'Passwords do not match.')
			return render(request, 'signup.html', {})

		if User.objects.filter(username=username).exists():
			messages.error(request, 'Username already exists.')
			return render(request, 'signup.html', {})

		user = User.objects.create_user(username=username, email=email, password=password)
		login(request, user)
		messages.success(request, 'Account created successfully!')
		return redirect('home')

	return render(request, 'signup.html', {})

def logout_view(request):
	logout(request)
	messages.success(request, 'You have been logged out.')
	return redirect('home')

@login_required
def daily_tasks(request, year, month, day):
	try:
		selected_date = date(int(year), int(month), int(day))
	except ValueError:
		messages.error(request, 'Invalid date selected.')
		return redirect('home')

	# Handle task creation/update
	if request.method == 'POST':
		task_title = request.POST.get('task_title')
		task_description = request.POST.get('task_description', '')
		task_priority = request.POST.get('task_priority', 'medium')
		time_slot_str = request.POST.get('time_slot')

		if task_title:
			# Parse time slot if provided
			time_slot = None
			if time_slot_str:
				try:
					time_slot = datetime.strptime(time_slot_str, '%H:%M').time()
				except ValueError:
					pass

			# Create or update task
			task, created = Task.objects.get_or_create(
				user=request.user,
				date=selected_date,
				time_slot=time_slot,
				defaults={
					'title': task_title,
					'description': task_description,
					'priority': task_priority,
				}
			)

			if not created:
				# Update existing task
				task.title = task_title
				task.description = task_description
				task.priority = task_priority
				task.save()

			messages.success(request, 'Task saved successfully!')
		else:
			messages.error(request, 'Task title is required.')

		return redirect('daily_tasks', year=year, month=month, day=day)

	# Generate hourly time slots from 4am to 10pm
	hourly_slots = []
	for hour in range(4, 23):  # 4am to 10pm
		time_slot = time(hour, 0)
		task = Task.objects.filter(
			user=request.user,
			date=selected_date,
			time_slot=time_slot
		).first()
		hourly_slots.append({
			'time': time_slot,
			'time_str': time_slot.strftime('%I:%M %p'),
			'time_value': time_slot.strftime('%H:%M'),
			'task': task
		})

	# Get tasks without time slots (general tasks for the day)
	general_tasks = Task.objects.filter(
		user=request.user,
		date=selected_date,
		time_slot__isnull=True
	)

	# Format date for display
	formatted_date = selected_date.strftime('%A, %B %d, %Y')

	context = {
		'selected_date': selected_date,
		'formatted_date': formatted_date,
		'year': year,
		'month': month,
		'day': day,
		'hourly_slots': hourly_slots,
		'general_tasks': general_tasks,
	}

	return render(request, 'daily_tasks.html', context)

@login_required
@csrf_exempt
def update_task(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body)
			task_id = data.get('task_id')
			field = data.get('field')
			value = data.get('value')

			task = get_object_or_404(Task, id=task_id, user=request.user)

			if field == 'title':
				task.title = value
			elif field == 'description':
				task.description = value
			elif field == 'completed':
				task.completed = bool(value)
			elif field == 'priority':
				task.priority = value

			task.save()
			return JsonResponse({'success': True})

		except Exception as e:
			return JsonResponse({'success': False, 'error': str(e)})

	return JsonResponse({'success': False, 'error': 'Invalid request'})