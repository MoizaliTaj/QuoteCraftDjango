from django.contrib import admin
from .models import *


class ProductAdminConfig(admin.ModelAdmin):
    list_display = ["code", "description_sheet", "description_stock", "stock"]

admin.site.register(ProductData, ProductAdminConfig)
