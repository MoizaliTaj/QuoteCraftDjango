from django.db import models
from datetime import datetime
from home.functions import *
from django.utils import timezone

# Create your models here.
class LogsCustomer(models.Model):
    customer_id = models.IntegerField()
    type = models.CharField(max_length=500)
    user = models.CharField(max_length=500)
    details = models.TextField(max_length=5000)
    date_time = models.DateTimeField()

class LogsInvoice(models.Model):
    invoice_id = models.IntegerField()
    type = models.CharField(max_length=500)
    user = models.CharField(max_length=500)
    details = models.TextField(max_length=5000)
    date_time = models.DateTimeField()

 
def customer_logs_save(customer_id, type, details, request):
    user_name = request.user.username
    LogsCustomer.objects.create(
        customer_id=customer_id,
        type=type,
        user=user_name,
        details=details,
        date_time=timezone.now(),
    )

def invoice_logs_save(invoice_id, type, details, request):
    user_name = request.user.username
    LogsInvoice.objects.create(
        invoice_id=invoice_id,
        type=type,
        user=user_name,
        details=details,
        date_time=timezone.now(),
    )

class LogsLoginLogout(models.Model):
    date_time = models.DateTimeField()
    user = models.CharField(max_length=500)
    ip_address = models.CharField(max_length=500)
    type = models.CharField(max_length=500)

class LogsSalesman(models.Model):
    salesman_id = models.IntegerField()
    type = models.CharField(max_length=500)
    user = models.CharField(max_length=500)
    details = models.TextField(max_length=5000)
    date_time = models.DateTimeField()

