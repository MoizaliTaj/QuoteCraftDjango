from django.db import models
from django.contrib.auth.models import Group
from data.models import ProductData
from django.db.models.signals import post_save
from django.dispatch import receiver


# Create your models here.
class Salesman(models.Model):
    full_name = models.CharField(max_length=200, unique=True)
    mobile_number = models.CharField(max_length=50)
    land_line_number = models.CharField(max_length=50)
    email = models.EmailField()
    group = models.ForeignKey(Group, related_name="salesman_group", on_delete=models.CASCADE)
    
    def __str__(self) -> str:
        return self.full_name

    class Meta:
        ordering=['full_name']
        verbose_name= "Salesman Detail"

    @classmethod
    def is_salesman_exist(cls, full_name, group, exclude_id=None):
        # Perform a case-insensitive query to check if a similar customer name exists
        query = cls.objects.filter(full_name__icontains=full_name, group=group)
        if exclude_id:
            query = query.exclude(id=exclude_id)
        return query.exists()


class Customer(models.Model):
    full_name = models.CharField(max_length=200)
    contact_number = models.CharField(max_length=50, null=True, blank=True)
    total_amount = models.FloatField(default=0)
    group = models.ForeignKey(Group, related_name="customer_group", on_delete=models.CASCADE)
    salesman_name = models.ForeignKey(Salesman, related_name="salesman_full_name", on_delete=models.CASCADE)

    def __str__(self) -> str:
        return self.full_name


    class Meta:
        ordering=['full_name']
        verbose_name= "Customer Detail"

    @classmethod
    def is_customer_exist(cls, full_name, group, exclude_id=None):
        # Perform a case-insensitive query to check if a similar customer name exists
        query = cls.objects.filter(full_name__icontains=full_name, group=group)
        if exclude_id:
            query = query.exclude(id=exclude_id)
        return query.exists()

class Invoice(models.Model):
    customer_full_name= models.ForeignKey(Customer, related_name="customer_full_name", on_delete=models.CASCADE)
    group = models.ForeignKey(Group, related_name="invoice_group", on_delete=models.CASCADE)
    date = models.DateField()
    payment_terms = models.CharField(max_length=200, blank=True, default="")
    attention_to = models.CharField(max_length=200, blank=True, default="")
    narration_internal = models.TextField(max_length=1000, blank=True, default="")
    narration_external = models.TextField(max_length=1000, blank=True, default="")
    invoice_amount = models.FloatField(default=0)

    def __str__(self) -> str:
        return f"Invoice ID: {self.id} {self.customer_full_name}"

    class Meta:
        ordering=['customer_full_name', 'id']
        verbose_name= "Invoice Detail"
        indexes = [
            models.Index(fields=['id', 'group']),
        ]


class Item(models.Model):
    invoice = models.ForeignKey(Invoice, related_name="invoice", on_delete=models.CASCADE)
    entry_order = models.FloatField(default=0)
    code = models.CharField(max_length=200,default="")
    description  = models.CharField(max_length=200,default="")
    size = models.CharField(max_length=200, blank=True, default="")
    packaging = models.CharField(max_length=200, blank=True, default="")
    selling_rate = models.FloatField(default=0)
    purchase_rate = models.FloatField(default=0)
    unit = models.CharField(max_length=200,default="")
    quantity = models.FloatField(default=0, blank=True, null=True)
    total = models.FloatField(default=0)
    notes = models.TextField(max_length=500, blank=True, default="")
    sp_price = models.CharField(max_length=200, blank=True, default="")
    stock = models.CharField(max_length=100, blank=True, default="")
    image = models.ImageField(upload_to="item_image", blank=True, null=True)
    last_edited_by = models.CharField(max_length=100, blank=True, null=True)


    def __str__(self) -> str:
        return f"{self.invoice.customer_full_name.full_name} - Invoice:id {self.invoice.id}"


    class Meta:
        ordering=['invoice_id', 'entry_order']
        verbose_name= "Item Detail"

    def update_stock(self) -> None:
        try:
            product_info = ProductData.objects.get(code__iexact=self.code)
            self.stock = product_info.stock
            self.save()
        except Exception:
            self.stock = "Unknown"
            self.save()


    def update_sp(self) -> None:
        try:
            product_info = ProductData.objects.get(code__iexact=self.code)
            self.sp_price = f"{str(product_info.sale_rate)} / {str(product_info.unit)}"
            self.save()
        except Exception:
            self.sp_price = "Unknown"
            self.save()

    def update_last_edit_by(self, request) -> None:
        try:
            current_user = request.user
            self.last_edited_by = current_user.username
            self.save()
        except Exception:
            self.last_edited_by = "Unknown"
            self.save()
