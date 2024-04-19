from django.db import models

# Create your models here.
class ProductData(models.Model):
    code = models.CharField(max_length=100, null=True)
    description_sheet = models.CharField(max_length=250, null=True)
    description_stock = models.CharField(max_length=250, null=True)
    brand = models.CharField(max_length=100, null=True)
    size = models.CharField(max_length=100, null=True)
    packaging = models.CharField(max_length=150, null=True)
    unit = models.CharField(max_length=100, null=True)
    cash_rate = models.FloatField(null=True)
    sale_rate = models.FloatField(null=True)
    purchase_rate = models.FloatField(null=True)
    stock = models.CharField(max_length=100, null=True)

class LastUpdated(models.Model):
    last = models.DateTimeField()