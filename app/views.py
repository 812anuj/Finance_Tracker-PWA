from itertools import chain

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import AuthenticationForm

from django.http import JsonResponse

from .forms import IncomeForm, ExpenseForm, CategoryForm, UpdateForm, RegistrationForm
from .models import Income, Expense, Category

# Create your views here.
def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)

        if form.is_valid():
            user = form.save()

            login(request, user)

            return JsonResponse({'success': True})
        
    return redirect('index')


def log_in(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        authenticateUser = authenticate(request, username=username, password=password)

        if authenticateUser is not None:
            login(request, authenticateUser)

            return JsonResponse({'success': True})
        
        return JsonResponse({'success': False, 'password_error': 'Invalid username or password!'})
    
    return redirect('index')


@login_required
def log_out(request):
    logout(request)

    return redirect('index')


def index(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    registration_form = RegistrationForm()

    login_form = AuthenticationForm()

    context = {
        'registration_form': registration_form,
        'login_form': login_form,
    }

    return render(request=request, template_name='app/general/index.html', context=context)


@login_required
def dashboard(request):
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
              'September', 'October', 'November', 'December']
    
    income_form = IncomeForm()
    expense_form = ExpenseForm()
    category_form = CategoryForm()
    update_form = UpdateForm()

    income_monthly_data = {}
    expense_monthly_data = {}

    for month in months:
        income_monthly_data[month] = 0
        expense_monthly_data[month] = 0

    incomes = Income.objects.filter(user=request.user)

    for income in incomes:
        month = income.date_received.strftime('%B')

        income_monthly_data[month] += income.amount

    income_data = [float(y) for y in income_monthly_data.values()]

    expenses = Expense.objects.filter(user=request.user)

    for expense in expenses:
        month = expense.date_incurred.strftime('%B')

        expense_monthly_data[month] += expense.amount

    expense_data = [-float(y) if y > 0 else float(y) for y in expense_monthly_data.values()]

    combined_records = list(chain(incomes, expenses))

    sorted_records = sorted(combined_records, key=lambda x: x.created_at)

    categories = Category.objects.filter(user=request.user)

    # Modify income and expense form dates to display a place holder.
    income_form.fields['date_received'].widget.attrs.update({'placeholder': 'YYYY-MM-DD'})
    expense_form.fields['date_incurred'].widget.attrs.update({'placeholder': 'YYYY-MM-DD'})

    context = {
        'income_data': income_data,
        'expenses_data': expense_data,
        'total_income': sum(income_data),
        'total_expense': abs(sum(expense_data)),
        'current_balance': sum((sum(income_data), sum(expense_data))),
        'months': months,
        'income_form': income_form,
        'expense_form': expense_form,
        'category_form': category_form,
        'update_form': update_form,
        'incomes': incomes,
        'expenses': expenses,
        'categories': categories,
        'sorted_records': sorted_records,
    }

    return render(request=request, template_name='app/general/dashboard.html', context=context)


@login_required
def create_income(request):
    if request.method == 'POST':
        form = IncomeForm(request.POST)

        if form.is_valid():
            income = form.save(commit=False)

            income.user = request.user

            income.save()

            return JsonResponse({'succes': True})
        
        print(form)

    return JsonResponse({'success': False})


@login_required
def delete_income(request, income_id):
    if request.method == 'DELETE':
        income = Income.objects.filter(id=income_id, user=request.user).last()

        if income:
            income.delete()

            return JsonResponse({'success': True})

    return redirect('dashboard')


@login_required
def create_expense(request):
    if request.method == 'POST':
        form = ExpenseForm(request.POST)

        if form.is_valid():
            expense = form.save(commit=False)

            expense.user = request.user

            expense.save()

            return JsonResponse({'success': True})

    return JsonResponse({'success': False})



@login_required
def delete_expense(request, expense_id):
    if request.method == 'DELETE':
        expense = Expense.objects.filter(id=expense_id, user=request.user).last()

        if expense:
            expense.delete()

            return JsonResponse({'success': True})

    return redirect('dashboard')


@login_required
def create_category(request):
    if request.method == 'POST':
        form = CategoryForm(request.POST)

        if form.is_valid():
            category = form.save(commit=False)

            category.user = request.user

            category.save()

            # return JsonResponse({'success': True})

    # return JsonResponse({'success': False})
    return redirect('dashboard')


@login_required
def delete_category(request, category_id):
    if request.method == 'DELETE':
        category = Category.objects.filter(id=category_id, user=request.user).last()

        if category:
            category.delete()

            return JsonResponse({'success': True})

    return redirect('dashboard')



@login_required
def update_record(request, record_type, record_id):
    if request.method == 'POST':
        form = UpdateForm(request.POST)

        if record_type == 'income':
            got_income = Income.objects.filter(user=request.user, id=record_id).last()

            if form.is_valid() and got_income:
                got_income.amount = form.cleaned_data['amount']
                got_income.category = form.cleaned_data['category']
                got_income.description = form.cleaned_data['description']

                got_income.save()

        elif record_type == 'expense':
            got_expense = Expense.objects.filter(user=request.user, id=record_id).last()

            if form.is_valid() and got_expense:
                got_expense.amount = form.cleaned_data['amount']
                got_expense.category = form.cleaned_data['category']
                got_expense.description = form.cleaned_data['description']

                got_expense.save()

    return redirect('dashboard')


def offline(request):
    return render(request=request, template_name='app/general/offline.html')