from django.contrib import admin
from .models import *


class SalesmanAdminConfig(admin.ModelAdmin):
    list_display = ['full_name', 'mobile_number', 'land_line_number', 'email', 'group']

class CustomerAdminConfig(admin.ModelAdmin):
    list_display = ['full_name', 'salesman_name', 'group']

class InvoiceAdminConfig(admin.ModelAdmin):
    list_display = ['id', 'customer_full_name', 'payment_terms', 'invoice_amount']

class ItemAdminConfig(admin.ModelAdmin):
    list_display = ["invoice_id", "id", "entry_order", "code", "description"]

admin.site.register(Salesman, SalesmanAdminConfig)
admin.site.register(Customer, CustomerAdminConfig)
admin.site.register(Invoice, InvoiceAdminConfig)
admin.site.register(Item, ItemAdminConfig)

