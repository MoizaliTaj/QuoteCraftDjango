import os
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from home.functions import *
from quotation.models import *
from .pdf_printer import *

@login_required(login_url="/login/")
def invoice_print(request, invoice_id):
    print_type = request.GET['print_type'] if request.GET['print_type'] is not None else "normal"   
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=invoice_id)
    if not invoice_data:
        return redirect("/unauthorised/")
    invoice_data = invoice_data[0]
    item_data = Item.objects.filter(invoice=invoice_data).order_by('entry_order')
    new_index = 1
    for item in item_data:
        item.entry_order = new_index
        new_index += 1
        item.save()
    printed_on = get_current_date_time(True)
    page_title = f"Ref # {invoice_data.id} - {invoice_data.customer_full_name.full_name} {printed_on[:10]}"
    if 'category' in request.GET:
        files = os.listdir(base + 'public/static/pdf_files/')
        for file in files:
            os.remove(base + 'public/static/pdf_files/' + file)
        printer_invoice(invoice_data, item_data, printed_on, f"{page_title}.pdf", print_type)
        file_path = f"{base}/public/static/pdf_files/{page_title}.pdf"
        with open(file_path, 'rb') as f:
            # Create an HTTP response with the file as its content
            response = HttpResponse(f.read(), content_type='application/octet-stream')
            # Set the appropriate Content-Disposition header to prompt download
            response['Content-Disposition'] = 'attachment; filename=' + os.path.basename(file_path)
            return response

    context = {
        "page_title": page_title,
        "invoice_data":invoice_data,
        "item_data": item_data,
        "type": print_type,
        "printed_on": printed_on,
    }
    return render(request, "print.html",context)
