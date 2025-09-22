
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('tasks/<int:year>/<int:month>/<int:day>/', views.daily_tasks, name='daily_tasks'),
    path('update-task/', views.update_task, name='update_task'),
]
