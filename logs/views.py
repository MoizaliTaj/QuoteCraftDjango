from django.shortcuts import render
from home.functions import *
from quotation.models import *
from .models import *
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required

def from_user_name_to_full_name(user_name):
    User = get_user_model()
    user_data = User.objects.filter().all().values()
    for dict_entry in user_data:
        if dict_entry["username"] == user_name:
            return dict_entry["first_name"] + " " + dict_entry["last_name"]
    return "unknown" 

@login_required(login_url="/login/")
def invoice_logs(request, invoice_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=invoice_id)
    if not invoice_data:
        return JsonResponse("unauthorised", safe=False)
    invoice_logs = LogsInvoice.objects.filter(invoice_id=invoice_id)
    result = []
    for row in invoice_logs:
        result.append({
            'primary_key': row.id,
            'invoice_id': row.invoice_id,
            'type': row.type,
            'user': row.user,
            'user_full_name': from_user_name_to_full_name(row.user),
            'details': row.details,
            'date_time': timezone.localtime(row.date_time).strftime("%Y-%m-%d %H:%M:%S"),
        })
    return JsonResponse(result, safe=False)

@login_required(login_url="/login/")
def customer_logs(request, customer_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    customer_data = Customer.objects.filter(group__in=group_ids, id=customer_id)
    if not customer_data:
        return JsonResponse("unauthorised", safe=False)
    customer_logs = LogsCustomer.objects.filter(customer_id=customer_id)
    result = []
    for row in customer_logs:
        result.append({
            'primary_key': row.id,
            'customer_id': row.customer_id,
            'type': row.type,
            'user': row.user,
            'user_full_name': from_user_name_to_full_name(row.user),
            'details': row.details,
            'date_time': timezone.localtime(row.date_time).strftime("%Y-%m-%d %H:%M:%S"),
        })
    return JsonResponse(result, safe=False)

@login_required(login_url="/login/")
def invoice_logs_master(request):
    logs_data = []
    invoice_id = ""
    if 'invoice_id' in request.GET:
        invoice_id = request.GET['invoice_id']
        if len(invoice_id) > 0:
            try:
                print("I was called")
                logs_data = LogsInvoice.objects.filter(invoice_id=int(invoice_id))
            except:
                logs_data = []
            print(logs_data)
    context = {
        "page_title": "Invoice Logs",
        "logs_data": logs_data,
        "invoice_id": invoice_id,
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "invoice_logs.html",context)
