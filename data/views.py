from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import *
from django.db.models import Q
from home.functions import *
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from QuoteCraft import settings
import os


def remove_extra_spaces(input_string):
    if isinstance(input_string, str):
        return ' '.join(input_string.split()).upper()
    else:
        return input_string

@login_required(login_url="/login/")
def product_search(request):
    query = remove_extra_spaces(request.GET['query'])
    if len(query) > 1:
        data = ProductData.objects.filter(
            Q(code__icontains= code_remove_zero_prefix(query)) |
            Q(description_sheet__icontains = query) |
            Q(description_stock__icontains = query) |
            Q(brand__icontains = query) |
            Q(size__icontains = query) |
            Q(packaging__icontains = query) |
            Q(unit__icontains = query) |
            Q(cash_rate__icontains = query) |
            Q(sale_rate__icontains = query) |
            Q(purchase_rate__icontains = query) |
            Q(stock__icontains = query)
        )
    else:
        data = []
    result = []
    for row in data:
        result.append({
            'id': row.id,
            'code': row.code,
            'description_sheet': row.description_sheet,
            'description_stock': row.description_stock,
            'brand': row.brand,
            'size': row.size,
            'packaging': row.packaging,
            'unit': row.unit,
            'cash_rate': row.cash_rate,
            'sale_rate': row.sale_rate,
            'purchase_rate': row.purchase_rate,
            'stock': row.stock,
        })
    return JsonResponse(result, safe=False)

@login_required(login_url="/login/")
def add_product(request, product_id):
    try:
        data = ProductData.objects.get(id=product_id)
        result = {
            'id': data.id,
            'code': data.code,
            'description_sheet': data.description_sheet,
            'description_stock': data.description_stock,
            'brand': data.brand,
            'size': data.size,
            'packaging': data.packaging,
            'unit': data.unit,
            'cash_rate': data.cash_rate,
            'sale_rate': data.sale_rate,
            'purchase_rate': data.purchase_rate,
            'stock': data.stock,
        }
        return JsonResponse(result)
    except:
        return JsonResponse({})

    
@login_required(login_url="/login/")
def update_db(request):
    if (request.user.is_superuser):
        if request.method == "POST":
            # Define the desired file names
            file_names = {
                'sanitary': 'sanitary.xlsx',
                'stock': 'stock.xlsx',
                'vachet': 'vachet.xls'
            }

            # Handle file uploads
            for field_name, desired_name in file_names.items():
                file = request.FILES.get(field_name)
                if file:
                    # Construct the file path
                    file_path = os.path.join(settings.BASE_DIR, 'public', 'static', 'excel_files', desired_name)
                    # Save the file to the desired directory
                    with open(file_path, 'wb') as destination:
                        for chunk in file.chunks():
                            destination.write(chunk)

            messages.success(request, "Files uploaded successfully. Database will be updated later.")
            return render(request, "update_db.html", {"page_title": "Update Data Base", "last_updated": get_last_updated_date_time()})

        context = {
        "page_title": "Update Data Base",
        "last_updated" : get_last_updated_date_time()
        }
        return render(request, "update_db.html",context)
    else:
        return redirect("/unauthorised/")
