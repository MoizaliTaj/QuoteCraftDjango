from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import User
from home.functions import *

def login_page(request):
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')
        if not User.objects.filter(username=username):
            messages.error(request, "Invalid Username")
            return redirect("/login/")
        user = authenticate(username=username, password=password)
        if user is None:
            messages.error(request, "Incorrect username or password")
            return redirect("/login/")
        else:
            login(request, user)
            if 'next' in request.GET:
                return redirect(request.GET['next'])
            else:
                return redirect("/")
    context = {
        'page_title': "Login",
        "last_updated" : "",
    }
    return render(request, "login.html", context)

def logout_page(request):
    logout(request)
    return redirect('/login/')


def unauthorised(request):
    context = {
        'page_title': "Unauthorised",
        "last_updated" : "",
    }
    return render(request, "unauthorised.html", context)


@login_required(login_url="/login/")
def change_password(request):
    if request.method == "POST":
        user_current = request.user.username
        current_user_obj = User.objects.get(username=user_current)
        current_password = request.POST.get('current_password')
        new_password = request.POST.get('new_password')
        confirm_new_password = request.POST.get('confirm_new_password')
        if check_password(current_password, current_user_obj.password):
            if new_password != confirm_new_password:
                messages.error(request, "New password and Confirm new password doesnot match")
                context = {
                    'page_title': "Change Password",
                    "current_password": current_password,
                    "new_password": new_password,
                    "confirm_new_password": confirm_new_password,
                    "last_updated" : get_last_updated_date_time()
                }
                return render(request, "change_password.html", context)
            elif len(new_password) < 8 :
                messages.error(request, "New password must be minimum 8 characters long.")
                context = {
                    'page_title': "Change Password",
                    "current_password": current_password,
                    "new_password": new_password,
                    "confirm_new_password": confirm_new_password,
                    "last_updated" : get_last_updated_date_time()
                }
                return render(request, "change_password.html", context)
            else:
                
                current_user_obj.set_password(new_password)
                current_user_obj.save()
                messages.error(request, "Password Change Succcessfull")
                context = {
                    'page_title': "Change Password",
                    "current_password": "",
                    "new_password": "",
                    "confirm_new_password": "",
                    "last_updated" : get_last_updated_date_time()
                }
                return render(request, "change_password.html", context)
        else:
            messages.error(request, "Current Password is incorrect.")
            context = {
                'page_title': "Change Password",
                "current_password": current_password,
                "new_password": new_password,
                "confirm_new_password": confirm_new_password,
                "last_updated" : get_last_updated_date_time()
            }
            return render(request, "change_password.html", context)

    context = {
        'page_title': "Change Password",
        "current_password": "",
        "new_password": "",
        "confirm_new_password":"",
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "change_password.html", context)
