from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from home.functions import *

firm_name = 'Generic'

@login_required(login_url="/login/")
def home(request):
    context = {
        "firm_name": firm_name,
        "page_title":"Home",
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "index.html", context)
