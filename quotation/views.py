import os
from django.conf import settings
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .models import *
from datetime import date
from django.http import JsonResponse
from django.db.models import Q
from home.functions import *
from logs.models import customer_logs_save, invoice_logs_save


def update_customer_total(customer_id):
    invoice_data = Invoice.objects.filter(customer_full_name=Customer.objects.get(id=customer_id))
    total_amount = 0.00
    for invoice in invoice_data:
        try:
            total_amount += float(invoice.invoice_amount)
        except:
            pass
    customer_data = Customer.objects.get(id=customer_id)
    customer_data.total_amount=total_amount
    customer_data.save()


def update_invoice_total(invoice_id):
    invoice_data = Invoice.objects.get(id=invoice_id)
    item_data = Item.objects.filter(invoice=invoice_data)
    total_amount = 0.00
    for item in item_data:
        total_amount += float(item.total)
    total_amount = round((total_amount * 1.05), 2)
    invoice_data.invoice_amount = total_amount
    invoice_data.save()
    update_customer_total(invoice_data.customer_full_name.id)




@login_required(login_url="/login/")
def quotations_home_page(request):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    customer_data = Customer.objects.filter(group__in=group_ids)
    context = {
        "page_title": "Quotations Home Page",
        "customer_data": customer_data,
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "quotations.html",context)

@login_required(login_url="/login/")
def quotations_list(request):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids).order_by('-id')
    context = {
        "page_title": "Quotations Home Page",
        "invoice_data": invoice_data,
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "quotations_list.html",context)

@login_required(login_url="/login/")
def quotations_customer_page(request, customer_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    customer_data = Customer.objects.filter(group__in=group_ids, id=customer_id)
    if customer_data.exists():
        customer_data = customer_data[0]
        invoice_data = Invoice.objects.filter(customer_full_name=customer_data).order_by('-id').all()
        context = {
            "page_title": f"{customer_data.full_name} - Quotations List",
            "customer_data": customer_data,
            "invoice_data": invoice_data,
            "last_updated" : get_last_updated_date_time()
        }
        return render(request, "quotations_customer_page.html",context)
    else:
        return redirect('/unauthorised/')

@login_required(login_url="/login/")
def add_new_customer(request):
    if request.method == "POST":
        data=request.POST
        full_name = remove_extra_spaces(data.get('full_name'))
        contact_number = remove_extra_spaces(data.get('contact_number'))
        salesman_id = data.get('salesman_id')
        user_group = get_user_group(request)[0]
        if not Customer.is_customer_exist(full_name, user_group):
            salesman = Salesman.objects.filter(id=salesman_id)[0]
            Customer.objects.create(
                full_name = full_name,
                contact_number = contact_number,
                group = user_group,
                salesman_name = salesman,
            )
            new_customer_id = Customer.objects.filter(group=user_group, full_name=full_name)[0].id
            customer_logs_save(new_customer_id,"Initialization", "New customer added.", request)
            return redirect(f"/quotations/{new_customer_id}")
        else:
            messages.error(request, "Duplicate Customer.")
            return redirect("/quotations/add-new-customer/")
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    salesman_list = Salesman.objects.filter(group__in=group_ids)
    context = {
        "page_title": "Add A New Customer",
        "salesman_list": salesman_list,
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "add_new_customer.html", context)


@login_required(login_url="/login/")
def delete_invoice(request, invoice_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=invoice_id)
    if not invoice_data:
        return redirect("/unauthorised/")
    invoice_data = invoice_data[0]
    info = f"Customer Name: {str(invoice_data.customer_full_name.full_name)}\nInvoice ID: {str(invoice_data.id)}\n\n"
    item_data = Item.objects.filter(invoice=invoice_data)
    for item in item_data:
        info += f"Code: {item.code}\n"
        info += f"Description: {item.description}\n"
        info += f"Size: {str(item.size)}\n"
        info += f"Packaing: {item.packaging}\n"
        info += f"Selling Rate: {str(item.selling_rate)}\n"
        info += f"Quantity: {str(item.quantity)}\n"
        info += f"Notes: {str(item.notes)}\n"
        info += f"Unit: {item.unit}\n"
        info += f"Total: {str(item.total)}\n"
        info += f"Stock: {str(item.stock)}\n\n"
    customer_id = invoice_data.customer_full_name.id
    customer_logs_save(customer_id, "Invoice Deleted", info, request)
    invoice_logs_save(invoice_id, "Invoice Deleted", info, request)
    invoice_data.delete()
    update_customer_total(invoice_data.customer_full_name.id)
    return redirect(f"/quotations/{customer_id}")

@login_required(login_url="/login/")
def add_new_salesman(request):
    if request.method == "POST":
        data=request.POST
        full_name = remove_extra_spaces(data.get('full_name'), True)
        mobile_number = remove_extra_spaces(data.get('mobile_number'))
        land_line_number = remove_extra_spaces(data.get('land_line_number'))
        email = remove_extra_spaces(data.get('email'), True)
        user_group = get_user_group(request)[0]
        if not Salesman.is_salesman_exist(full_name, user_group):
            Salesman.objects.create(
                full_name = full_name,
                mobile_number = mobile_number,
                land_line_number = land_line_number,
                email = email,
                group = user_group
            )
            return redirect("/quotations/")
        else:
            messages.error(request, "Duplicate Salesman.")
            return redirect("/quotations/add-new-salesman/")
    context = {
        "page_title": "Add A New Salesman",
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "add_new_salesman.html", context)




@login_required(login_url="/login/")
def add_new_invoice(request, customer_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    customer_data = Customer.objects.filter(group__in=group_ids, id=customer_id)
    if not customer_data.exists():
        return redirect("/unauthorised/")
    if request.method == "POST":
        data=request.POST
        date_value = remove_extra_spaces(data.get('date'))
        payment_terms = remove_extra_spaces(data.get('payment_terms'))
        attention_to = remove_extra_spaces(data.get('attention_to'))
        narration_internal = data.get('narration_internal')
        narration_external = data.get('narration_external')
        new_entry = Invoice.objects.create(
            customer_full_name = Customer.objects.filter(id=customer_id).first(),
            group = user_groups[0],
            date = date_value,
            payment_terms = payment_terms,
            attention_to = attention_to,
            narration_internal = narration_internal,
            narration_external = narration_external
        )
        
        string_log = f"New Invoice Added\nInvoice ID: {str(new_entry.id)}\n"
        string_log += f"Date: {date_value}\n"
        if len(payment_terms) > 0:
            string_log += f"Payment Terms: {payment_terms}\n"
        if len(attention_to) > 0:
            string_log += f"Attention to: {attention_to}\n"
        if len(narration_internal) > 0:
            string_log += f"Narration: {narration_internal}\n"
        if len(narration_external) > 0:
            string_log += f"\nNarration External: {narration_external}\n"
        customer_logs_save(customer_id,"Invoice Added", string_log, request)
        return redirect(f"/invoice-manager/{new_entry.id}")

    invoice_data = Invoice.objects.filter(customer_full_name=Customer.objects.filter(id=customer_id)[0]).order_by('-id')
    last_payment_terms = (
        invoice_data[0].payment_terms if invoice_data.exists() else ""
    )
    customer_data = customer_data[0]
    context = {
        "page_title": "Add A New Salesman",
        "customer_data": customer_data,
        "todays_date": date.today().strftime('%Y-%m-%d'),
        "last_payment_terms": last_payment_terms,
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "add_new_invoice.html", context)

@login_required(login_url="/login/")
def update_customer(request, customer_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    customer_data = Customer.objects.filter(group__in=group_ids, id=customer_id)
    if customer_data.exists():
        customer_data = customer_data[0]
        if request.method == "POST":
            user_group = user_groups[0]
            data=request.POST
            full_name = remove_extra_spaces(data.get('full_name'))
            contact_number = remove_extra_spaces(data.get('contact_number'))
            salesman_id = data.get('salesman_id')
            if not Customer.is_customer_exist(full_name, user_group, customer_id):
                
                log_string = ""
                if customer_data.full_name != full_name:
                    log_string += f"Customer name changed from {customer_data.full_name} to {full_name}\n"
                if customer_data.contact_number != contact_number:
                    log_string += f"Contact Number changed from {customer_data.contact_number} to {contact_number}\n"
                if int(customer_data.salesman_name.id) != int(salesman_id):
                    log_string += f"Salesman ID changed from {str(customer_data.salesman_name.id)} to {str(salesman_id)} \n"
                    log_string += f"Salesman Name changed from {customer_data.salesman_name.full_name} to {Salesman.objects.get(id=salesman_id).full_name}\n"
                if len(log_string) > 0:
                    customer_logs_save(customer_data.id, "Meta Data Changed", log_string, request)
                
                customer_data.full_name = full_name
                customer_data.contact_number=contact_number
                customer_data.salesman_name = Salesman.objects.filter(id=salesman_id).first()
                customer_data.save()
                return redirect(f'/quotations/{customer_id}')
            else:
                messages.error(request, "New name already exists. Customer name should be unique")
                return redirect(f"/quotations/update-customer/{customer_id}")
                
        salesman_list = Salesman.objects.filter(group__in=group_ids)
        context = {
            "page_title": f"Update Customer | {customer_data.full_name}",
            "customer_data": customer_data,
            "salesman_list": salesman_list,
            "last_updated" : get_last_updated_date_time()
        }
        return render(request, "update_customer.html", context)
    else:
        return redirect('/unauthorised/')        


@login_required(login_url="/login/")
def update_salesman(request, salesman_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    salesman_data = Salesman.objects.filter(group__in=group_ids, id=salesman_id)
    if not salesman_data.exists():
        return redirect('/unauthorised/')
    salesman_data = salesman_data[0]
    if request.method == "POST":
        user_group = user_groups[0]
        data=request.POST
        full_name = remove_extra_spaces(data.get('full_name'), True)
        mobile_number = remove_extra_spaces(data.get('mobile_number'))
        land_line_number = remove_extra_spaces(data.get('land_line_number'))
        email = remove_extra_spaces(data.get('email'), True)
        if not Salesman.is_salesman_exist(full_name, user_group, salesman_id):
            salesman_data.full_name = full_name
            salesman_data.mobile_number = mobile_number
            salesman_data.land_line_number = land_line_number
            salesman_data.email = email
            salesman_data.save()
            return (
                redirect(f"/quotations/{request.POST['next']}")
                if 'next' in request.POST
                else redirect("/quotations/")
            )
        else:
            messages.error(request, "New name already exists. Salesman name should be unique")
            return redirect(f"/quotations/update-salesman/{salesman_id}")

    context = {
        "page_title": f"Update Salesman | {salesman_data.full_name}",
        "salesman_data": salesman_data,
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "update_salesman.html", context)


@login_required(login_url="/login/")
def invoice_manager(request, invoice_id):
    context = {
        "page_title": "Invoice Manager",
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "invoice_manager.html", context)

@login_required(login_url="/login/")
def item_details(request, invoice_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=invoice_id)
    if not invoice_data:
        return JsonResponse("unauthorised", safe=False)
    invoice_data = invoice_data[0]
    item_data = Item.objects.filter(invoice=invoice_data)
    result = []
    for item in item_data:
        item.update_stock()
        item.update_sp()
        result.append({
            'primary_key': item.id,
            'invoice_id': item.invoice.id,
            'entry_order': item.entry_order,
            'code': item.code,
            'description': item.description,
            'size': item.size,
            'packaging': item.packaging,
            'selling_rate': item.selling_rate,
            'quantity': item.quantity,
            'notes': item.notes,
            'unit': item.unit,
            'total': item.total,
            'sp_price': item.sp_price,
            'stock': item.stock,
            'purchase_price': item.purchase_rate,
            'image_path': item.image.name,
            'added_edited_by': item.last_edited_by
        })
    return JsonResponse(result, safe=False)

@login_required(login_url="/login/")
def invoice_details(request, invoice_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=invoice_id)
    if not invoice_data:
        return JsonResponse("unauthorised", safe=False)
    invoice_data = invoice_data[0]
    result = {
        'customer_id': invoice_data.customer_full_name.id,
        'invoice_id': invoice_data.id,
        'customer_name': invoice_data.customer_full_name.full_name,
        'salesman_id': invoice_data.customer_full_name.salesman_name.id,
        'salesman_name': invoice_data.customer_full_name.salesman_name.full_name,
        'date': invoice_data.date,
        'payment_terms': invoice_data.payment_terms,
        'attention_to': invoice_data.attention_to,
        'narration_internal': invoice_data.narration_internal,
        'narration_external': invoice_data.narration_external,
    }
    return JsonResponse(result, safe=False)

@login_required(login_url="/login/")
def update_invoice(request, invoice_id):
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=invoice_id)
    if not invoice_data:
        return redirect("/unauthorised/")
    invoice_data = invoice_data[0]
    if request.method == "POST":
        invoice_data_old = {
            'customer_id': invoice_data.customer_full_name.id,
            'date': invoice_data.date,
            'payment_terms': invoice_data.payment_terms,
            'attention_to': invoice_data.attention_to,
            'narration_internal': invoice_data.narration_internal,
            'narration_external': invoice_data.narration_external,
            'customer_name': invoice_data.customer_full_name.full_name,
        }
        
        data=request.POST
        customer_id = remove_extra_spaces(data.get('customer_id'))
        date_val = remove_extra_spaces(data.get('date'))
        payment_terms = remove_extra_spaces(data.get('payment_terms'))
        attention_to = remove_extra_spaces(data.get('attention_to'))
        narration_internal = data.get('narration_internal')
        narration_external = data.get('narration_external')

        invoice_data.customer_full_name = Customer.objects.get(id=customer_id)
        invoice_data.group = Customer.objects.get(id=customer_id).group
        invoice_data.date = date_val
        invoice_data.payment_terms = payment_terms
        invoice_data.attention_to = attention_to
        invoice_data.narration_internal = narration_internal
        invoice_data.narration_external = narration_external
        invoice_data.save()
        
        log_string = ""

        if int(invoice_data_old['customer_id']) != int(invoice_data.customer_full_name.id):
            moved_out_log_string = f"Invoice ID: {str(invoice_id)}\n"
            moved_out_log_string += "Invoice was moved out to another customer.\n"
            moved_out_log_string += f"New Customer ID: {str(invoice_data.customer_full_name.id)}\n"
            moved_out_log_string += f"New Customer Name: {invoice_data.customer_full_name.full_name}"
            customer_logs_save(invoice_data_old['customer_id'], "Invoice Moved Out", moved_out_log_string, request)
            
            move_in_log_string = f"Invoice ID: {str(invoice_id)}\n"
            move_in_log_string += "Invoice was moved in from another customer.\n"
            move_in_log_string += f"Old Customer ID: {str(invoice_data_old['customer_id'])}\n"
            move_in_log_string += f"Old Customer Name: {invoice_data_old['customer_name']}"
            customer_logs_save(int(invoice_data.customer_full_name.id), "Invoice Moved In", move_in_log_string, request)
            log_string += "Invoice was moved\n"
            log_string += f"from Customer: {invoice_data_old['customer_name']}\n"
            log_string += f"To Customer: {invoice_data.customer_full_name.full_name}\n\n"
        if invoice_data_old['date'] != invoice_data.date:
            log_string += f"Date changed from {invoice_data_old['date']} to {invoice_data.date}\n\n"
        if invoice_data_old['payment_terms'] != invoice_data.payment_terms:
            log_string += f"Payment terms changed from {invoice_data_old['payment_terms']} to {invoice_data.payment_terms}\n\n"
        if invoice_data_old['attention_to'] != invoice_data.attention_to:
            log_string += f"Attention changed from {invoice_data_old['attention_to']} to {invoice_data.attention_to}\n\n"
        if invoice_data_old['narration_internal'] != invoice_data.narration_internal:
            log_string += f"Internal Narration changed\nfrom {invoice_data_old['narration_internal']}\nto {invoice_data.narration_internal}\n\n"
        if invoice_data_old['narration_external'] != invoice_data.narration_external:
            log_string += f"Internal Narration changed\nfrom {invoice_data_old['narration_external']}\nto {invoice_data.narration_external}\n\n"

        if len(log_string) > 0:
            invoice_logs_save(invoice_id, "Meta Data Changed", log_string, request)
        update_customer_total(invoice_data.customer_full_name.id)
        update_customer_total(int(invoice_data_old['customer_id']))
        
        return redirect(f'/invoice-manager/{invoice_id}')

    customer_list = Customer.objects.filter(group__in=group_ids)
    context = {
        "page_title": f"Update Invoice | {invoice_data.id}",
        "customer_list": customer_list,
        "invoice_data": invoice_data,
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "update_invoice.html", context)

@login_required(login_url="/login/")
def item_add(request, invoice_id):
    
    def logger(invoice_id_, code_, description_, size_, packing_, price_, unit_, quantity_, notes_, purchase_price_):
        details = f"Code: {code}\n"
        details += f"Description: {description_}\n"
        details += f"Size: {size_}\n"
        details += f"Packing: {packing_}\n"
        details += f"Price: {price_}\n"
        details += f"Unit: {unit_}\n"
        details += f"Quantity: {quantity_}\n"
        details += f"Notes: {notes_}\n"
        details += f"Purchase Price: {purchase_price_}\n"
        invoice_logs_save(invoice_id_, "Item Added", details, request)
    
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=invoice_id)
    if not invoice_data.exists():
        return JsonResponse("unauthorised", safe=False)

    invoice_data = invoice_data[0]
    # get values from link
    entry_order = len(Item.objects.filter(invoice=invoice_data)) + 1
    code = remove_extra_spaces(request.GET['code'])
    description = remove_extra_spaces(request.GET['description'])
    size = remove_extra_spaces(request.GET['size'])
    packaging = remove_extra_spaces(request.GET['packaging'])
    selling_rate = remove_extra_spaces(request.GET['selling_rate'])
    purchase_rate = remove_extra_spaces(request.GET['purchase_rate'])
    if not is_number_string(purchase_rate):
        purchase_rate = 0
    unit = remove_extra_spaces(request.GET['unit'])
    quantity = remove_extra_spaces(request.GET['quantity'])
    total = round(float(selling_rate) * float(quantity), 2)
    notes = remove_extra_spaces(request.GET['notes'])
    new_entry = Item.objects.create(
        invoice=invoice_data,
        entry_order=entry_order,
        code=code,
        description=description,
        size=size,
        packaging=packaging,
        selling_rate=selling_rate,
        purchase_rate=purchase_rate,
        unit=unit,
        quantity=quantity,
        total=total,
        notes=notes
    )
    new_entry.update_last_edit_by(request)
    update_invoice_total(invoice_id)
    logger(new_entry.invoice.id, code, description, size, packaging, selling_rate, unit, quantity, notes, purchase_rate)
    return JsonResponse("Done", safe=False)

@login_required(login_url="/login/")
def item_update(request, item_id):
        
    def log_edit_invoice_content(invoice_id_log, current_data_list, new_data_list):
        headers = ['Entry Order #', 'Code', 'Description', 'Size', 'Packing', 'Price', 'Unit', 'Quantity', 'Purchase Price', 'Notes']
        output_string = ""
        for index in range(len(current_data_list)):
            if str(current_data_list[index]) != str(new_data_list[index]):
                output_string = output_string + headers[index] + " Changed from '" + str(current_data_list[index]) + "' to '" + str(new_data_list[index]) + "'\n"
        if len(output_string) > 0:
            log_string = f"Code: {current_data_list[1]}\n\n{output_string}"
            invoice_logs_save(invoice_id_log, "Item Edited", log_string, request)
    try:
        item_data = Item.objects.get(id=item_id)
    except:
        return JsonResponse("unauthorised", safe=False)
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=item_data.invoice.id)
    if not invoice_data.exists():
        return JsonResponse("unauthorised", safe=False)

    # get values from link
    entry_order = remove_extra_spaces(request.GET['entry_order'])
    code = remove_extra_spaces(request.GET['code'])
    description = remove_extra_spaces(request.GET['description'])
    size = remove_extra_spaces(request.GET['size'])
    packaging = remove_extra_spaces(request.GET['packaging'])
    selling_rate = remove_extra_spaces(request.GET['selling_rate'])
    purchase_rate = remove_extra_spaces(request.GET['purchase_rate'])
    if not is_number_string(purchase_rate):
        purchase_rate = 0
    unit = remove_extra_spaces(request.GET['unit'])
    quantity = remove_extra_spaces(request.GET['quantity'])
    notes = remove_extra_spaces(request.GET['notes'])
    current_data_list = [item_data.entry_order, item_data.code, item_data.description, item_data.size, item_data.packaging, item_data.selling_rate, item_data.unit, item_data.quantity, item_data.purchase_rate, item_data.notes]
    new_data_list = [entry_order, code, description, size, packaging, selling_rate, unit, quantity, purchase_rate, notes]
    log_edit_invoice_content(item_data.invoice.id, current_data_list, new_data_list)
    #update values
    item_data.entry_order=entry_order
    item_data.code=code
    item_data.description=description
    item_data.size=size
    item_data.packaging=packaging
    item_data.selling_rate=selling_rate
    item_data.purchase_rate=purchase_rate
    item_data.unit=unit
    item_data.quantity=quantity
    item_data.notes=notes
    item_data.total = round(float(float(quantity) * float(selling_rate)), 2)
    item_data.save()
    item_data.update_last_edit_by(request)
    update_invoice_total(item_data.invoice.id)
    return JsonResponse("Done", safe=False)

@login_required(login_url="/login/")
def item_delete(request, item_id):
    try:
        item_data = Item.objects.get(id=item_id)
    except:
        return JsonResponse("unauthorised", safe=False)
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=item_data.invoice.id)
    if not invoice_data.exists():
        return JsonResponse("unauthorised", safe=False)
    invoice_delete_log_string = f"Customer Name: {item_data.invoice.customer_full_name.full_name}\n"
    invoice_delete_log_string += f"Invoice ID: {str(item_data.id)}\n\n"
    invoice_delete_log_string += f"Code: {item_data.code}\n"
    invoice_delete_log_string += f"Description: {item_data.description} \n"
    invoice_delete_log_string += f"Size: {item_data.size} \n"
    invoice_delete_log_string += f"Packing: {item_data.packaging} \n"
    invoice_delete_log_string += f"Price: {item_data.selling_rate} \n"
    invoice_delete_log_string += f"Price: {item_data.purchase_rate} \n"
    invoice_delete_log_string += f"Unit: {item_data.unit} \n"
    invoice_delete_log_string += f"Quantity: {item_data.quantity} \n"
    invoice_delete_log_string += f"Notes: {item_data.notes} \n"
    invoice_delete_log_string += f"Total: {item_data.total} \n"
    invoice_delete_log_string += f"Stock: {item_data.stock}" 
    invoice_logs_save(item_data.invoice.id, "Item Deleted", invoice_delete_log_string, request)
    item_data.delete()
    update_invoice_total(item_data.invoice.id)
    return JsonResponse("Done", safe=False)


def delete_item_image(item):
    # Check if item has an image
    if item.image:
        # Get the image path
        image_path = os.path.join(settings.MEDIA_ROOT, str(item.image))
        # Delete the image file from storage
        if os.path.exists(image_path):
            os.remove(image_path)
        # Clear the image field
        item.image.delete(save=False)

@login_required(login_url="/login/")
def image_delete(request, item_id):
    try:
        item_data = Item.objects.get(id=item_id)
    except:
        return JsonResponse("unauthorised", safe=False)
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=item_data.invoice.id)
    if not invoice_data.exists():
        return JsonResponse("unauthorised", safe=False)
    delete_item_image(item_data)
    item_data.image = None
    item_data.save()
    invoice_logs_save(item_data.invoice.id, "Image Deleted", f"Image deleted for Code: {item_data.code}", request)
    return JsonResponse("Done", safe=False)

@login_required(login_url="/login/")
def image_upload(request, item_id):
    try:
        item_data = Item.objects.get(id=item_id)
    except:
        return JsonResponse("unauthorised", safe=False)
    user_groups = get_user_group(request)
    group_ids = [group.id for group in user_groups]
    invoice_data = Invoice.objects.filter(group__in=group_ids, id=item_data.invoice.id)
    if not invoice_data.exists():
        return redirect("/unauthorised/")
    if request.method == "POST":
        item_image = request.FILES.get('item_image')
        if not item_image:
            return redirect(f"/invoice-manager/{invoice_data[0].id}")
        
        extension = item_image.name.split(".")[-1]
        new_filename = f"{item_data.id}.{extension}"
        item_image.name = new_filename
        
        item_data.image=item_image
        try:
            item_data.save()
            invoice_logs_save(item_data.invoice.id, "Image Added", f"Image added to Code: {item_data.code}", request)
            return redirect(f"/invoice-manager/{invoice_data[0].id}")
        except:
            return redirect(f"/invoice-manager/{invoice_data[0].id}")
        
    else:
        return JsonResponse("nochange", safe=False)

@login_required(login_url="/login/")
def history_specific(request, customer_id):
    code = code_remove_zero_prefix(request.GET['code'])
    description = remove_extra_spaces(request.GET['description'])
    try:
        customer_data = Customer.objects.get(id=customer_id)
    except:
        return JsonResponse("Error", safe=False)
    
    invoice_data = Invoice.objects.filter(customer_full_name=customer_data)
    invoice_ids = [invoice.id for invoice in invoice_data]

    item_data = Item.objects.filter(invoice__in=invoice_ids)

    if (len(code) > 0) and (len(description) > 0):
        item_data = item_data.filter(
            Q(code__icontains = code) | 
            Q(description__icontains = description)
        ).order_by('-id')
    elif len(code) > 0:
        item_data = item_data.filter(
            Q(code__icontains = code)
        ).order_by('-id')
    elif len(description) > 0:
        item_data = item_data.filter(
            Q(description__icontains = description)
        ).order_by('-id')
    else:
        item_data = []

    result = []
    for item in item_data:
        result.append({
            'invoice_id': item.invoice.id,
            'code': item.code,
            'description': item.description,
            'size': item.size,
            'packaging': item.packaging,
            'selling_rate': item.selling_rate,
            'quantity': item.quantity,
            'notes': item.notes,
            'unit': item.unit,
            'purchase_rate': item.purchase_rate,
            'date': item.invoice.date,
        })
    return JsonResponse(result, safe=False)

@login_required(login_url="/login/")
def history(request):
    history_data = []
    search_query = ""
    if 'search' in request.GET:
        search_query = request.GET['search']
        if len(search_query) > 2:
            user_group = get_user_group(request)[0]
            invoice_data = Invoice.objects.filter(customer_full_name__group = user_group)
            invoice_ids = [invoice.id for invoice in invoice_data]
            history_data = Item.objects.filter(invoice__in=invoice_ids)
            history_data = history_data.filter(
                Q(invoice__id__icontains = search_query) | 
                Q(invoice__customer_full_name__full_name__icontains = search_query) | 
                Q(code__icontains = search_query) | 
                Q(description__icontains = search_query) | 
                Q(size__icontains = search_query) | 
                Q(packaging__icontains = search_query) | 
                Q(selling_rate__icontains = search_query) | 
                Q(purchase_rate__icontains = search_query) | 
                Q(unit__icontains = search_query) | 
                Q(quantity__icontains = search_query) | 
                Q(notes__icontains = search_query) | 
                Q(sp_price__icontains = search_query) | 
                Q(stock__icontains = search_query) | 
                Q(last_edited_by__icontains = search_query)
            ).order_by('code', '-invoice__id', 'description')
    context = {
        "page_title": "History",
        "history_data": history_data,
        "search_query": search_query,
        "last_updated" : get_last_updated_date_time()
    }
    return render(request, "history.html",context)
