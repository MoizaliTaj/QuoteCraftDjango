"""
URL configuration for QuoteCraft_Django project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from home.views import *
from accounts.views import *
from quotation.views import *
from data.views import *
from logs.views import *
from print.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name="home"),
    path('quotations/', quotations_home_page, name="quotations_home_page"),
    path('quotations/list/', quotations_list, name="quotations_list"),
    path('quotations/<customer_id>', quotations_customer_page, name="quotations_customer_page"),
    path('quotations/add-new-customer/', add_new_customer, name="add_new_customer"),
    path('quotations/update-customer/<customer_id>', update_customer, name="update_customer"),
    path('quotations/add-new-salesman/', add_new_salesman, name="add_new_salesman"),
    path('quotations/update-salesman/<salesman_id>', update_salesman, name="update_salesman"),
    path('quotations/add-new-invoice/<customer_id>', add_new_invoice, name="add_new_invoice"),
    path('quotations/update-invoice/<invoice_id>', update_invoice, name="update_invoice"),
    path('quotations/delete-invoice/<invoice_id>', delete_invoice, name="delete_invoice"),
    path('invoice-manager/<invoice_id>', invoice_manager, name="invoice_manager"),
    path('invoice-manager/json-item-details/<invoice_id>', item_details, name="item_details"),
    path('invoice-manager/json-invoice-details/<invoice_id>', invoice_details, name="invoice_details"),
    path('invoice-manager/json-item-add/<invoice_id>', item_add, name="item_add"),
    path('invoice-manager/json-item-update/<item_id>', item_update, name="item_update"),
    path('invoice-manager/json-item-delete/<item_id>', item_delete, name="item_delete"),
    path('invoice-manager/json-image-delete/<item_id>', image_delete, name="image_delete"),
    path('invoice-manager/json-image-upload/<item_id>', image_upload, name="image_upload"),
    path('history/', history, name="history"),
    path('invoice-print/<invoice_id>', invoice_print, name="invoice_print"),
    path('logs/invoice/<invoice_id>', invoice_logs, name="invoice_logs"),
    path('logs/customer/<customer_id>', customer_logs, name="customer_logs"),
    path('logs/invoice-logs/', invoice_logs_master, name="invoice_logs_master"),
    path('product-search/', product_search, name="product_search"),
    path('product-search/add_product/<product_id>', add_product, name="add_product"),
    path('history-specific/<customer_id>/', history_specific, name="history_specific"),
    path('login/', login_page, name="login_page"),
    path('logout/', logout_page, name="logout_page"),
    path('change_password/', change_password, name="change_password"),
    path('unauthorised/', unauthorised, name="unauthorised"),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)

urlpatterns += staticfiles_urlpatterns()
