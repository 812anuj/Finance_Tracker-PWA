from django.urls import path
from .views import (index, dashboard, register, log_in, log_out, create_income, create_expense,
                    create_category, delete_category, delete_expense, delete_income, 
                    update_record, offline)


urlpatterns = [
    path('', index, name='index'),
    path('dashboard/', dashboard, name='dashboard'),
    path('dashboard/update/<slug:record_type>/<int:record_id>/', update_record, name='update_record'),

    path('sign-up/', register, name='register'),
    path('log-in/', log_in, name='log_in'),
    path('log_out/', log_out, name='logout'),

    path('income/create/', create_income, name='create_income'),
    path('income/delete/<int:income_id>/', delete_income, name='delete_income'),

    path('expense/create/', create_expense, name='create_expense'),
    path('expense/delete/<int:expense_id>/', delete_expense, name='delete_expense'),

    path('category/create/', create_category, name='create_category'),
    path('category/delete/<int:category_id>/', delete_category, name='delete_category'),

    path('offline/', offline, name='offline'),
]