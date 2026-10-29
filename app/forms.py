from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django import forms

from .models import Income, Expense, Category

class RegistrationForm(UserCreationForm):
    email = forms.EmailField()

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password1', 'password2'
        ]



class IncomeForm(forms.ModelForm):
    class Meta:
        model = Income
        fields = ['amount', 'source', 'date_received', 'category', 'description']


class ExpenseForm(forms.ModelForm):
    class Meta:
        model = Expense
        fields = ['amount', 'category', 'date_incurred', 'description', 'receipt_image']


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'type']


class UpdateForm(forms.Form):
    amount = forms.DecimalField(max_digits=10, decimal_places=2, required=True)
    category = forms.ModelChoiceField(label="Category", required=True, queryset=Category.objects.all())
    description = forms.CharField(widget=forms.Textarea, required=True, label="Description")
    