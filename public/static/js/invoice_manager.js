let invoice_id = null;
let customer_id = null;
let edit_item_in_progress = false;
let col_prefernce_flag = false;
let sort_string = 'entry_order'
let sort_by = 'asc'
let addFunctionEventListenerSpecial = null
let addFunctionEventListenerNormal = null
let csrf_token = null
function driver(invoiceId_argument, csrf_toke){
    csrf_token = csrf_toke; 
    if (sessionStorage.getItem('print_option')){} else {sessionStorage.setItem('print_option', 'normal')}
    invoice_id = invoiceId_argument
    document.getElementById("specialtable").style.maxHeight=(window.innerHeight-308)+"px";
    fetchInvoiceData(invoiceId_argument)
    fetchLogData(invoiceId_argument)
    reload_scroll_position(1)
    fetchCustomerInfo(invoice_id)
    remove_special_shortcuts()
    document.getElementById('add_product_div').style.display = '';
}
function remove_special_shortcuts(){
    if (addFunctionEventListenerSpecial) {
        document.removeEventListener('keydown', addFunctionEventListenerSpecial);
        addFunctionEventListenerSpecial = null;
    }
    if (addFunctionEventListenerNormal) {
        document.removeEventListener('keydown', addFunctionEventListenerNormal);
        addFunctionEventListenerNormal = null;
    }
}
function logs(){
    if (sessionStorage.getItem("log_show") == "true"){
        sessionStorage.removeItem("log_show")
        document.getElementById("log_button").textContent = "Show Logs"
        document.getElementById("logs_table").style.display = 'none'
    } else {
        sessionStorage.setItem("log_show", "true")
        document.getElementById("log_button").textContent = "Hide Logs"
        document.getElementById("logs_table").style.display = ''
    }
}
async function fetchCustomerInfo(invoice_id) {
    showLoader()
    try {
        const response = await fetch(`/invoice-manager/json-invoice-details/${invoice_id}`);
        if (!response.ok) {
            document.getElementById("customer_details_div").innerHTML = "Error Occurred"
            hideLoader()
        }
        let data = await response.json();
        if (data){
            if (data == 'unauthorised'){

            }else {
                if (sessionStorage.getItem("print_pref")){
                    print_header_type = 1
                } else {
                    print_header_type = 0
                }
                customer_id = data['customer_id'];
                let customer_details_div_code = `<a class="link-primary fs-6" href="/quotations/` + data['customer_id'] + `" >&#x2190 Back to customer list for ` + data['customer_name'] + `</a>
                <br>
                <h6>Customer Name: ` + data['customer_name'] + `
                    |
                    Salesman Name: ` + data['salesman_name'] + `
                </h6>
                <h6>Invoice ID : ` + data['invoice_id'] + ` | Date: ` + data['date'] + ` | Payment Terms: ` + data['payment_terms'] + `</h6>
                <a class="btn btn-primary" href="/invoice-print/` + data['invoice_id'] + `?print_type=`+ sessionStorage.getItem('print_option') + `" target="_blank">Print</a>&nbsp;&nbsp;&nbsp;
                <a class="btn btn-primary" href="/invoice-print/` + data['invoice_id'] + `?print_type=`+ sessionStorage.getItem('print_option') + `&category=special" >Save PDF</a>&nbsp;&nbsp;&nbsp;
                <a class="btn btn-primary" href="/quotations/update-invoice/` + data['invoice_id'] + `">Update Invoice Details</a>&nbsp;&nbsp;&nbsp;
                <button class="btn btn-primary" onClick="col_preference()">&#9881;</button>&nbsp;&nbsp;&nbsp;
                <button class="btn btn-primary" onClick="logs()" id="log_button">Hide Logs</button>&nbsp;&nbsp;&nbsp;
                <div id="preference"></div>
                <br>`
                document.getElementById("customer_details_div").innerHTML = customer_details_div_code
                let narration_code = ``
                if (data['narration_internal'].length > 0){
                    narration_code += `<div class="alert alert-secondary" role="alert">Internal Narration : <pre>` + data['narration_internal'] + `</pre></div>`
                }
                if (data['narration_external'].length > 0){
                    narration_code += `<div class="alert alert-secondary" role="alert">External Narration : <pre>` + data['narration_external'] + `</pre></div>`
                }
                if (narration_code.length > 0){
                    narration_code = `<hr>` + narration_code + `<br>`
                    document.getElementById('narration_div').innerHTML = narration_code;
                }

                hideLoader()
                try {
                    if (sessionStorage.getItem("log_show") == "true"){
                        document.getElementById("log_button").textContent = "Hide Logs";
                        document.getElementById("logs_table").style.display = '';
                    } else {
                        document.getElementById("log_button").textContent = "Show Logs";
                        document.getElementById("logs_table").style.display = 'none'}
                }catch(error){}
            }
        } else {
            document.getElementById("customer_details_div").innerHTML = "Error Occurred"
            hideLoader()
        }
    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }
}
async function fetchInvoiceData(invoiceId) {
    showLoader()
    try {
        const response = await fetch(`/invoice-manager/json-item-details/${invoiceId}?sort=${sort_string}&sort_by=${sort_by}`);
        if (!response.ok) {
            document.getElementById("invoice_content_table").innerHTML = "Some Error Occurred in loading data"
            hideLoader()
        }
        let data = await response.json();
        if (data.length > 0){
            if (data == 'unauthorised'){
                window.location.href = "/unauthorised/";
            }
            table_formater(data)
            hideLoader()
        } else {
            document.getElementById("invoice_content_table").innerHTML = "No items. To add items search the product then click on add to list."
            hideLoader()
        }
    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }

    function table_formater(data){
        function margin(purchase_rate, selling_rate){
            purchase_rate = parseFloat(purchase_rate)
            selling_rate = parseFloat(selling_rate)
            let margin_value = (((selling_rate / purchase_rate) - 1) * 100).toFixed(2)
            if (Number.isNaN(margin_value) || !isFinite(margin_value)){
                return NaN
            } else {
                return margin_value
            }
        }
        edit_item_in_progress = false;
        let table_code = `
        <table class="table table-striped">
        <thead class="fixed-header">
        <tr class="inv_manager_font">
        <th scope="col" id="head_serial" >Sr.</th>
        <th scope="col" id="head_order" onClick="change_sort('entry_order')" style="cursor:pointer;color:#1D3B86;">Entry No.</th>
        <th scope="col" id="head_code" onClick="change_sort('code')" style="cursor:pointer;color:#1D3B86;">Code</th>
        <th scope="col" id="head_description" onClick="change_sort('description')" style="cursor:pointer;color:#1D3B86;">Description</th>
        <th scope="col" id="head_size" onClick="change_sort('size')" style="cursor:pointer;color:#1D3B86;">Size</th>
        <th scope="col" id="head_packing" onClick="change_sort('packing')" style="cursor:pointer;color:#1D3B86;">Packing</th>
        <th scope="col" id="head_quantity" onClick="change_sort('quantity')" style="cursor:pointer;color:#1D3B86;">Quantity</th>
        <th scope="col" id="head_unit" onClick="change_sort('unit')" style="cursor:pointer;color:#1D3B86;">Unit</th>
        <th scope="col" id="head_price" onClick="change_sort('price')" style="cursor:pointer;color:#1D3B86;">Unit Price</th>
        <th scope="col" id="head_total" onClick="change_sort('total')" style="cursor:pointer;color:#1D3B86;">Total</th>
        <th scope="col" id="head_purchase" >Purchase<br>Price</th>
        <th scope="col" id="head_margin" >Margin<br>%</th>
        <th scope="col" id="head_stock" >Current<br>Stock</th>
        <th scope="col" id="head_notes" >Notes</th>
        <th scope="col" id="head_sp" >Vachet SP</th>
        <th scope="col" id="head_last_edited_by" >Last<br>Edited By</th>
        <th scope="col" id="head_actions" colspan="3" style="text-align: center">Actions</th>
        </tr>
        </thead>
        <tbody>`
        for (let i=0; i<data.length; i++){
            table_code += '<tr class="inv_manager_font" id="' + String(i) + '_tr_content_table">'
            table_code += `<td id='` + String(i + 1) + `_content_id' style="display:none;">` + data[i]['primary_key'] + `</td>`
            table_code += `<td scope="row" id='` + String(i + 1) + `_serial'>` + String(i + 1) + `</td>`
            table_code += `<td id='` + String(i + 1) + `_order'>` + data[i]['entry_order'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_code'>` + data[i]['code'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_description'>` + data[i]['description'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_size'>` + data[i]['size'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_packing'>` + data[i]['packaging'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_quantity'>` + data[i]['quantity'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_unit'>` + data[i]['unit'] + `</td>`
            table_code += `<td class="text-end" id='` + String(i + 1) + `_price'>` + data[i]['selling_rate'] + `</td>`
            table_code += `<td class="text-end" id='` + String(i + 1) + `_total'>` + data[i]['total'] + `</td>`
            table_code += `<td class="text-end" id='` + String(i + 1) + `_purchase'>` + data[i]['purchase_price'] + `</td>`
            table_code += `<td class="text-end" id='` + String(i + 1) + `_margin'>`+ margin(data[i]['purchase_price'], data[i]['selling_rate']) +` %</td>`
            table_code += `<td id='` + String(i + 1) + `_stock'>` + data[i]['stock'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_notes'>` + data[i]['notes'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_sp'>` + data[i]['sp_price'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_last_edited_by'>` + data[i]['added_edited_by'] + `</td>`
            table_code += `<td id='` + String(i + 1) + `_edit'><button class="btn btn-success" id="btn-edit" onClick="edit_item(` + String(i + 1) + `)" title="Edit">&#9998;</button></td>`
            table_code += `<td id='` + String(i + 1) + `_delete'><button class="btn btn-danger" id="btn-delete" onClick="delete_item(` + String(i + 1) + `)" title="Delete"><i class="fa fa-trash"></i></button></td>`
            table_code += `<td id='` + String(i + 1) + `_image'>`
            if (data[i]['image_path']){
                table_code += `<button class="btn btn-danger" onClick="image_delete(` + String(i + 1) + `)" title="Delete Image"><i class="material-icons" style="font-size:16px">add_a_photo</i></button>`
            } else {
                table_code += `<form id="` + String(i + 1) + `_imageform" action='/invoice-manager/json-image-upload/` + data[i]['primary_key'] + `' method="POST"  enctype="multipart/form-data">`+ csrf_token +`<input type="file" name="item_image" id="` + String(i + 1) + `_image_upload" style="display: none;" accept="image/png, image/gif, image/jpeg" onchange="image_upload(` + String(i + 1) + `)" /><button type="button" class="btn btn-success" onclick="document.getElementById('` + String(i + 1) + `_image_upload').click()" title="Upload Image"><i class="material-icons" style="font-size:16px">add_a_photo</i></button></form>`
            }
            table_code += `</td></tr>`

        }
        table_code += `
        <tr id="tr_blank_line"><td colspan="19" id="blank_line"></td></tr>
        <tr id="tr_cumulative_total"><td colspan="9" id="label_cumulative_total" class="right">Total</td><td id="cumulative_total" class="right"></td></tr>
        <tr id="tr_vat"><td colspan="9" id="label_vat" class="right">VAT @ 5%</td><td id="vat" class="right"></td></tr>
        <tr id="tr_grand_total"><td colspan="9" id="label_grand_total"  class="right">Total with VAT</td><td id="grand_total" class="right"></td></tr>
        </tbody>
        </table>
        <div id="amount_words"></div>
        <div id="margin_stats"></div>`
        document.getElementById("invoice_content_table").innerHTML = table_code
        update_totals(data.length);
        overall_margin_stats(data.length);
        update_numbers(data.length);
        margin_checker(data.length);
        column_pref_applier(data.length);
    }
}
async function fetchLogData(invoiceId) {
    showLoader()
    try {
        const response = await fetch(`/logs/invoice/${invoiceId}`);
        if (!response.ok) {
            document.getElementById("logs_table").innerHTML = "<hr>No Logs"
            hideLoader()
        }
        let data = await response.json();
        if (data.length > 0){
            let log_table_code = `<hr>
            <table class="table table-striped">
            <tr class="inv_manager_font">
            <th scope="col" colspan=6 style="text-align:center;">Logs</th></tr>
            <tr class="inv_manager_font">
            <th scope="col">Sr.</th>
            <th scope="col">User ID</th>
            <th scope="col">User Name</th>
            <th scope="col">Date & Time</th>
            <th scope="col">Type</th>
            <th scope="col">Details</th>
            </tr>
            `
            for (let i=0; i<data.length; i++){
                log_table_code += `<tr class="inv_manager_font">`
                log_table_code += `<td scope="row">`+ (i+1) +`</td>`
                log_table_code += `<td>`+ data[i]['user'] +`</td>`
                log_table_code += `<td>`+ data[i]['user_full_name'] +`</td>`
                log_table_code += `<td>`+ data[i]['date_time'] +`</td>`
                log_table_code += `<td>`+ data[i]['type'] +`</td>`
                log_table_code += `<td><pre>`+ data[i]['details'] +`</pre></td></tr>`
            }
            log_table_code += `</table>`
            document.getElementById("logs_table").innerHTML = log_table_code
            hideLoader()
        } else {
            document.getElementById("logs_table").innerHTML = "No Logs"
            hideLoader()
        }
    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }
}
function update_totals(number_of_rows){
    let grand_total = 0;
    for (let i=1; i<=number_of_rows; i++){
        current_field_total = parseFloat(document.getElementById(String(i) + "_total").textContent.replace(",",""));
        grand_total += current_field_total;
    }
    document.getElementById("cumulative_total").textContent = grand_total;
    document.getElementById("vat").textContent = (grand_total * 0.05).toFixed(2);
    document.getElementById("grand_total").textContent = (grand_total * 1.05).toFixed(2);
    if ((grand_total * 1.05) > 0){document.getElementById("amount_words").textContent = "Amount in Words: " + convert_amount_to_words((grand_total * 1.05).toFixed(2))};
}
function update_numbers(number_of_rows){
    for (let i =1; i<=number_of_rows; i++){
        document.getElementById(String(i) + "_total").innerHTML = number_formater(document.getElementById(String(i) + "_total").innerHTML);
        document.getElementById(String(i) + "_price").innerHTML = number_formater(document.getElementById(String(i) + "_price").innerHTML);
    }
    document.getElementById("cumulative_total").innerHTML = number_formater(document.getElementById("cumulative_total").innerHTML);
    document.getElementById("vat").innerHTML = number_formater(document.getElementById("vat").innerHTML);
    document.getElementById("grand_total").innerHTML = number_formater(document.getElementById("grand_total").innerHTML);
}
function margin_checker(number_of_rows){
    for(let i=1; i<=number_of_rows; i++){
        purchase_rate = parseFloat(document.getElementById(String(i) + "_purchase").textContent.replace(",",""))
        selling_rate = parseFloat(document.getElementById(String(i) + "_price").textContent.replace(",",""))
        margin = selling_rate / purchase_rate
        if ((margin > 1.15) && isFinite(margin)){}
        else {
            row_highlighter(i, "#FFA500", "#005AFF")
        }
    }
}
function overall_margin_stats(number_of_rows){
    purchase_amount_total = 0;
    sale_amount_total = 0;
    for (let i=1; i<=number_of_rows; i++){
        purchase_rate = parseFloat(document.getElementById(String(i) + "_purchase").textContent.replace(",",""))
        selling_rate = parseFloat(document.getElementById(String(i) + "_price").textContent.replace(",",""))
        quantity = parseFloat(document.getElementById(String(i) + "_quantity").textContent.replace(",",""))
        if ((!Number.isNaN(purchase_rate)) && (purchase_rate > 0) && (selling_rate > 0) && (quantity > 0)){
            purchase_amount_total += (purchase_rate * quantity)
            sale_amount_total += (selling_rate * quantity)
        }
    }
    let profit_amount = sale_amount_total - purchase_amount_total;
    margin = (((sale_amount_total / purchase_amount_total) - 1) * 100).toFixed(2)
    if (Number.isNaN(margin) || !isFinite(margin)){} else {
        document.getElementById("margin_stats").innerHTML = "<strong>Margin Stats: </strong> Gross Total Amount: <strong>"+ number_formater(sale_amount_total) + "</strong> | ";
        document.getElementById("margin_stats").innerHTML += "Profit Amount: <strong>"+ number_formater(profit_amount) + "</strong> | ";
        document.getElementById("margin_stats").innerHTML += "Margin Percent: <strong>" + margin + " %</strong> <br>";
    }
}
function number_formater(numberString){
    numberString = (parseFloat(numberString) + 0.0000000001).toFixed(2);
    numberString = String(numberString)
    crossed_decimal = false;
    let output = ""
    for (i=0; i<numberString.length; i++){
        output = output + numberString[i];
        if (numberString[i] == "."){
            crossed_decimal = true;
        }
        if (crossed_decimal == false){
            let remaining_number = numberString.slice(i+1).split('.')[0];
            if (Number.isNaN(parseFloat(remaining_number)) == false){
                if (remaining_number.length % 3 == 0){
                    output = output + ","
                }
            }
        }
    }
    return output;
}
function string_fixer(string_input){
    output_string = ''
    for (index=0; index< string_input.length; index ++){
        if (string_input[index] == '"'){
            output_string = output_string + '&quot;'
        } else {
            output_string = output_string + string_input[index]
        }
    }
    return output_string
}
function cancel(){
    fetchInvoiceData(invoice_id);
    fetchLogData(invoice_id);
    hideLoader();
}
function row_highlighter(content_id, bg_color, txt_color){
    let ids = ['_serial', '_order', '_code', '_description', '_size', '_packing', '_quantity', '_unit', '_price', '_total', '_purchase', '_stock', '_last_edited_by','_notes', '_edit', '_delete', '_image','_sp', '_margin']
    for (let i=0; i<ids.length; i++){
        document.getElementById(content_id + ids[i]).style.color = txt_color;
        document.getElementById(content_id + ids[i]).style.backgroundColor = bg_color;
    }
}
function delete_item(index){
    let content_id = document.getElementById(index+"_content_id").textContent
    if (edit_item_in_progress == false){
        edit_item_in_progress = true;
        row_highlighter(index, "red", "white")
        document.getElementById(index+"_delete").innerHTML = '<button class="btn btn-success" onClick="delete_item_confirm(' + content_id +')"><i class="fa fa-check"></i></button>&nbsp;<button class="btn btn-danger" onClick="cancel()"><i class="fa fa-close"></i></button>'
    }
}
async function delete_item_confirm(content_id){
    showLoader()
    try {
        const response = await fetch(`/invoice-manager/json-item-delete/${content_id}`);
        if (!response.ok) {
            edit_item_in_progress = false
            cancel();
        }
        let response_message = await response.json();
        if (response_message == "Done"){
            edit_item_in_progress = false
            fetchInvoiceData(invoice_id)
            fetchLogData(invoice_id)
            hideLoader()
        } else {
            edit_item_in_progress = false
            cancel()
        }
    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }
}
function image_upload(index){
    save_scroll_data()
    document.getElementById(index+"_imageform").submit()
}
function image_delete(index){
    let content_id = document.getElementById(index+"_content_id").textContent
    if (edit_item_in_progress == false){
        edit_item_in_progress = true;
        row_highlighter(index, "red", "white");
        document.getElementById(index+"_image").innerHTML = '<button class="btn btn-success" onClick="delete_image_confirm(' + content_id +')"><i class="fa fa-check"></i></button>&nbsp;<button class="btn btn-danger" onClick="cancel()"><i class="fa fa-close"></i></button>'
    }
}
async function delete_image_confirm(content_id){
    showLoader()
    try {
        const response = await fetch(`/invoice-manager/json-image-delete/${content_id}`);
        if (!response.ok) {
            edit_item_in_progress = false
            cancel();
        }
        let response_message = await response.json();
        if (response_message == "Done"){
            edit_item_in_progress = false
            fetchInvoiceData(invoice_id)
            fetchLogData(invoice_id)
            hideLoader()
        } else {
            edit_item_in_progress = false
            cancel()
        }
    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }
}
function margin_calculate_edit_items(index){
    let selling_price = document.getElementById(index + "price").value
    let purchase_price = document.getElementById(index+"purchase_price").value
    let margin_value = (((selling_price / purchase_price) - 1) * 100).toFixed(2)
    if (Number.isNaN(margin_value) || !isFinite(margin_value)){
        margin_value = NaN
    }
    document.getElementById(index+"_margin").innerHTML = margin_value + " %"
}
function edit_item(index){
    let content_id = document.getElementById(index+"_content_id").textContent
    function edit_item_input_generation(id_table, type, name, id_input, function_value=false){
        if (type == 'number'){
            if (function_value){
                document.getElementById(id_table).innerHTML = '<input class="input" type="number" STEP="0.01" id="' + id_input + '" name="' + name + '" required value="' + string_fixer(document.getElementById(id_table).textContent).replace(",","") + '" style="width:'+ String((document.getElementById(id_table).textContent.length * 8) + 50) +'px" onBlur="margin_calculate_edit_items('+ index + ')" />'
            }else {
                document.getElementById(id_table).innerHTML = '<input class="input" type="number" STEP="0.01" id="' + id_input + '" name="' + name + '" required value="' + string_fixer(document.getElementById(id_table).textContent).replace(",","") + '" style="width:'+ String((document.getElementById(id_table).textContent.length * 8) + 50) +'px" />'
            }

        } else {
            document.getElementById(id_table).innerHTML = '<input class="input" type="text" id="' + id_input + '" name="' + name + '" required value="' + string_fixer(document.getElementById(id_table).textContent) + '"  style="width:'+ String((document.getElementById(id_table).textContent.length * 8) + 50) +'px" />'
        }
    }
    if (edit_item_in_progress == false){
        edit_item_in_progress = true;
        row_highlighter(index, "red", "white");
        edit_item_input_generation(index+'_order', 'number', 'entry_order', index + 'entry_order');
        edit_item_input_generation(index+'_code', 'text', 'code', index + 'code');
        edit_item_input_generation(index+'_description', 'text', 'description', index + 'description');
        edit_item_input_generation(index+'_size', 'text', 'size', index + 'size');
        edit_item_input_generation(index+'_packing', 'text', 'packing', index + 'packing');
        edit_item_input_generation(index+'_quantity', 'number', 'quantity', index + 'quantity');
        edit_item_input_generation(index+'_unit', 'text', 'unit', index + 'unit');
        edit_item_input_generation(index+'_price', 'number', 'price', index + 'price', index);
        edit_item_input_generation(index+'_purchase', 'number', 'purchase_price', index + 'purchase_price', index);
        edit_item_input_generation(index+'_notes', 'text', 'notes', index + 'notes');
        document.getElementById(index+'_edit').innerHTML = '<button class="btn btn-success" onClick="submitform(' + content_id +',' + index+')"><i class="fa fa-check"></i></button>&nbsp;<button class="btn btn-danger" onClick="cancel()"><i class="fa fa-close"></i></button>'

        editItemEventListener = function(event) {
            if (event.key === 'Enter') {
                submitform(content_id, index);
            }
        };

        document.addEventListener('keydown', editItemEventListener);
    }
}
async function submitform(content_id, index){
    showLoader()
    if (editItemEventListener) {
        document.removeEventListener('keydown', editItemEventListener);
        editItemEventListener = null;
    }
    let url = `/invoice-manager/json-item-update/${encodeURIComponent(content_id)}?`;
    url += "entry_order=" + encodeURIComponent(document.getElementById(index + "entry_order").value)
    url += "&code=" + encodeURIComponent(document.getElementById(index + "code").value)
    url += "&description=" + encodeURIComponent(document.getElementById(index + "description").value)
    url += "&size=" + encodeURIComponent(document.getElementById(index + "size").value)
    url += "&packaging=" + encodeURIComponent(document.getElementById(index + "packing").value)
    url += "&selling_rate=" + encodeURIComponent(document.getElementById(index + "price").value) 
    url += "&purchase_rate=" + encodeURIComponent(document.getElementById(index + "purchase_price").value) 
    url += "&unit=" + encodeURIComponent(document.getElementById(index + "unit").value) 
    if (document.getElementById(index + "quantity").value > 0){
        url += "&quantity=" + encodeURIComponent(document.getElementById(index + "quantity").value)
    } else {
        url += "&quantity=" + encodeURIComponent(0)
    }
    url += "&notes=" + encodeURIComponent(document.getElementById(index + "notes").value) 


    try {
        const response = await fetch(url);
        if (!response.ok) {
            edit_item_in_progress = false
            cancel();
        }
        let response_message = await response.json();
        if (response_message == "Done"){
            edit_item_in_progress = false
            fetchInvoiceData(invoice_id)
            fetchLogData(invoice_id)
            hideLoader()
        } else {
            edit_item_in_progress = false
            cancel()
        }
    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }
}
function col_preference(){
    if (col_prefernce_flag == true){
        document.getElementById("preference").innerHTML = "";
        col_prefernce_flag = false;
    } else {
        let ids = ['', '', '', '', '', '', '', '', '', '', '', '', '','', '', '', '','', '']
        document.getElementById("preference").innerHTML = `<br>
        <legend>Select Print preference</legend>
        <input type="radio" id="print_option1" name="print_options" value="normal"><label for="normal">Normal (Default Value)</label><br>
        <input type="radio" id="print_option2" name="print_options" value="normal_proforma_only"><label for="normal_proforma_only">Normal Proforma only (This option will print with heading as "Proforma" and not as "Proforma / Quotation.")</label><br>
        <input type="radio" id="print_option3" name="print_options" value="without_vat"><label for="without_vat">Without VAT (This option will print quotation without VAT amount)</label><br>
        <input type="radio" id="print_option4" name="print_options" value="without_quantity"><label for="without_quantity">Without Quantity (This option will print only rates and will not print quantity)</label><br><br>
        <button class="btn btn-success" onClick="save_col_preference()">Save Preference</button></a>&nbsp;&nbsp;&nbsp;<button class="btn btn-danger" onclick="col_preference()">Cancel</button><br>
        <br>
        <fieldset>
            <legend>Select the column names that you want to hide. Then click on save.</legend>
            <input type="checkbox" name="option" value="_serial"> Sr.<br>
            <input type="checkbox" name="option" value="_order"> Entry No.<br>
            <input type="checkbox" name="option" value="_code"> Code<br>
            <input type="checkbox" name="option" value="_description"> Description<br>
            <input type="checkbox" name="option" value="_size"> Size<br>
            <input type="checkbox" name="option" value="_packing"> Packing<br>
            <input type="checkbox" name="option" value="_quantity"> Quantity<br>
            <input type="checkbox" name="option" value="_unit"> Unit<br>
            <input type="checkbox" name="option" value="_price"> Unit Price<br>
            <input type="checkbox" name="option" value="_total"> Total<br>
            <input type="checkbox" name="option" value="_purchase"> Purchase Price<br>
            <input type="checkbox" name="option" value="_margin"> Margin %<br>
            <input type="checkbox" name="option" value="_stock"> Current Stock<br>
            <input type="checkbox" name="option" value="_notes"> Notes<br>
            <input type="checkbox" name="option" value="_sp"> Vachet SP<br>
            <input type="checkbox" name="option" value="_last_edited_by"> Last Edited By<br>
            <input type="checkbox" name="option" value="_actions"> Actions<br>
            <button class="btn btn-success" onClick="save_col_preference()">Save Preference</button>&nbsp;&nbsp;&nbsp;<button class="btn btn-danger" onclick="col_preference()">Cancel</button><br>`;
        col_prefernce_flag = true;

        if (sessionStorage.getItem('print_option')){
            let print_options = document.getElementsByName('print_options');
            for (let i = 0; i < print_options.length; i++) {
                if (print_options[i].value == sessionStorage.getItem('print_option')) {
                    print_options[i].checked = true
                }
            }
        } else {
            sessionStorage.setItem('print_option', 'normal')
            document.getElementById("print_option1").checked = true
        }

        let retrievedArrayAsString = localStorage.getItem('colpref');
        let retrievedArray = JSON.parse(retrievedArrayAsString);
        if (retrievedArray){
            let checkboxes = document.getElementsByName('option');
            for (let i = 0; i < checkboxes.length; i++) {
                if (retrievedArray.includes(checkboxes[i].value)){
                    checkboxes[i].checked = true
                }
            }
        }
    }
}
function save_col_preference(){
    let print_options = document.getElementsByName('print_options');
    let selected_print_option = null
    for (let i = 0; i < print_options.length; i++) {
        if (print_options[i].checked) {
            selected_print_option = print_options[i].value
        }
    }
    if (selected_print_option == null){
        selected_print_option = 'normal'
    }
    sessionStorage.setItem('print_option', selected_print_option)


    let checkboxes = document.getElementsByName('option');
    let selectedValues = [];
    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        selectedValues.push(checkboxes[i].value)
      }
    }
    let arrayAsString = JSON.stringify(selectedValues);
    localStorage.setItem('colpref', arrayAsString);
    location.reload();
}
function column_pref_applier(number_of_rows){
    let retrievedArrayAsString = localStorage.getItem('colpref');
    let retrievedArray = JSON.parse(retrievedArrayAsString);
    if (retrievedArray){
        for (let i = 0; i< retrievedArray.length; i++){
            column_hider(retrievedArray[i], number_of_rows)
        }
    }
}
function column_hider(column_identifier, number_of_rows){
    let inner_items = ['_serial', '_order', '_code', '_description', '_size', '_packing', '_quantity', '_unit', '_price',]
    document.getElementById("head" + column_identifier).style.display = 'none'
    for (let i=1; i<=number_of_rows;i++){
        if (column_identifier == '_actions'){
            document.getElementById(String(i) + '_edit').style.display = 'none'
            document.getElementById(String(i) + '_delete').style.display = 'none'
            document.getElementById(String(i) + '_image').style.display = 'none'
        } else {
            document.getElementById(String(i) + column_identifier).style.display = 'none'
        }
    }

    document.getElementById("blank_line").colSpan = parseInt(document.getElementById("blank_line").colSpan) - 1;
    if (inner_items.includes(column_identifier)){
        document.getElementById("label_cumulative_total").colSpan = parseInt(document.getElementById("label_cumulative_total").colSpan) - 1;
        document.getElementById("label_vat").colSpan = parseInt(document.getElementById("label_vat").colSpan) - 1;
        document.getElementById("label_grand_total").colSpan = parseInt(document.getElementById("label_grand_total").colSpan) - 1;
    }
    if (column_identifier == '_total'){
        document.getElementById("tr_blank_line").style.display = 'none'
        document.getElementById("tr_cumulative_total").style.display = 'none'
        document.getElementById("tr_vat").style.display = 'none'
        document.getElementById("tr_grand_total").style.display = 'none'
        document.getElementById("amount_words").style.display = 'none'
    }
}
function showLoader() {
    var overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
}
function hideLoader() {
    var overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
}
function close_add(){
    let current_find = document.getElementById("add_product_div");
    current_find.innerHTML = `<button class="btn btn-primary" id="button_add" onClick=add_new_item()>Add Item</button>`
    remove_special_shortcuts()
}
function add_new_item(query=""){
    console.log(query)
    let current_find = document.getElementById("add_product_div");
    sessionStorage.setItem("add_open", "true");
    current_find.innerHTML = `<button class="btn btn-primary" onClick=close_add()>Close</button>
    <br>
<div class="input-group">
    <div class="form-outline" data-mdb-input-init>
        <input type="search" id="search_value" name="search_value" class="form-control" value="` + query + `" placeholder="Enter Key word search" onBlur="add_item_search()" />
    </div>
    <button type="button" class="btn btn-primary" onClick="add_item_search()">
        Search
    </button>
</div>
    <div id="search_results"></div><hr>`;
    add_item_search()
}
async function add_item_search(){
    showLoader()
    remove_special_shortcuts()
    let search_string = encodeURIComponent(document.getElementById("search_value").value)
    try {
        const response = await fetch(`/product-search?query=${search_string}`);
        if (!response.ok) {
            console.log("Error")
            hideLoader()
        }
        let data = await response.json();
        if (data.length > 0){
            table_code = `<table class="table table-striped">
            <thead>
            <tr class="inv_manager_font">
                <th scope="col">Sr. #</th>
                <th scope="col">Code</th>
                <th scope="col">Description</th>
                <th scope="col">Brand</th>
                <th scope="col">Size</th>
                <th scope="col">Packaging</th>
                <th scope="col">Cash Price</th>
                <th scope="col">Sale Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Actions</th>
            </tr>
            </thead><tbody>`
            for (let i=0; i<data.length; i++){
                table_code += `<tr class="inv_manager_font">`
                table_code += `<td scope="row">` + (i+1) +`</td>`
                table_code += `<td>` + data[i]['code'] + `</td>`
                if((data[i]['description_sheet']).length > 0){
                    table_code += `<td>` + data[i]['description_sheet'] + `</td>`
                } else{
                    table_code += `<td>` + data[i]['description_stock'] + `</td>`
                }
                table_code += `<td>` + data[i]['brand'] + `</td>`
                table_code += `<td>` + data[i]['size'] + `</td>`
                table_code += `<td>` + data[i]['packaging'] + `</td>`
                table_code += `<td>` + data[i]['cash_rate'] + ` / ` + data[i]['unit'] + `</td>`
                table_code += `<td>` + data[i]['sale_rate'] + ` / ` + data[i]['unit'] + `</td>`
                table_code += `<td>` + data[i]['stock'] + `</td>`
                table_code += `<td><button class="btn btn-success inv_manager_font" onClick="add_item_add(` + data[i]['id'] + `)">Add</button></td>`
                table_code += `</tr>`
            }
            table_code += `</tbody></table>`
            document.getElementById("search_results").innerHTML = table_code;
        } else {
            document.getElementById("search_results").innerHTML = "No Results Found"
        }
        hideLoader()
    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }
}
function margin_calculate(){
    let purchase_price = document.getElementById("purchase_price").value
    let selling_price = document.getElementById("price").value
    let margin = (((selling_price / purchase_price) - 1) * 100 ).toFixed(2)
    document.getElementById("margin_amount").innerHTML = "Margin : " + margin + " %"
}
function history_table_code_generator(history_fetch_data_function){
    let history_table_code = ``
    for (let i=0; i<history_fetch_data_function.length;i++){
        history_table_code += `<tr class="inv_manager_font">
        <td>` + String((i+1)) + `</td>
        <td>` + history_fetch_data_function[i]['date'] + `</td>
        <td><a href="/invoice-manager/`+ history_fetch_data_function[i]['invoice_id'] + `" target="_blank">` + history_fetch_data_function[i]['invoice_id'] + `</a></td>
        <td>` + history_fetch_data_function[i]['code'] + `</td>
        <td>` + history_fetch_data_function[i]['description'] + `</td>
        <td>` + history_fetch_data_function[i]['size'] + `</td>
        <td>` + history_fetch_data_function[i]['packaging'] + `</td>
        <td>` + history_fetch_data_function[i]['quantity'] + `</td>
        <td>` + history_fetch_data_function[i]['unit'] + `</td>
        <td>` + history_fetch_data_function[i]['selling_rate'] + `</td>
        <td>` + history_fetch_data_function[i]['notes'] + `</td>
        <td>` + history_fetch_data_function[i]['purchase_rate'] + `</td>
        </tr>`
    }
    if (history_table_code.length > 0){
        history_table_code = `<table class="table table-striped">
        <tr class="inv_manager_font">
        <th scope="col" >Sr.</th>
        <th>Date</th>
        <th>Invoice ID</th>
        <th>Code</th>
        <th>Description</th>
        <th>Size</th>
        <th>Packing</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Rate</th>
        <th>Notes</th>
        <th>Purchase Price</th>
        </tr>` + history_table_code + `</table>`
    } else {
        history_table_code = "No history found"
    }
    return history_table_code;
}
async function add_item_add(product_id){
    save_scroll_data()
    showLoader()
    try {
        const response = await fetch(`/product-search/add_product/${product_id}`);
        if (!response.ok) {
            console.log("Error")
            hideLoader()
        }
        let data = await response.json();
        let description_details = ``
            let table_code = `
            <table><tr><td id="add_info_td" style="vertical-align: top;">
            <table>
                <tr><td>Code</td><td><input class="input" type="text" id="code" name="code" required value='${data['code']}' onBlur="add_item_history()" /></td></tr>`
                if((data['description_sheet']).length > 0){
                    description_details = data['description_sheet']
                } else {
                    description_details = data['description_stock']
                }
                if((data['brand']).length > 0){
                    description_details += ` (Brand: ${data['brand']})`
                }
                table_code += `<tr><td>Description</td><td><input class="input" type="text" id="description" name="description" required value='${description_details}' onBlur="add_item_history()") /></tr>
                <tr><td>Size</td><td><input class="input" type="text" id="size" name="size" value='${data['size']}'/></td></tr>
                <tr><td>Packing</td><td><input class="input" type="text" id="packing" name="packing" value='${data['packaging']}'/></td></tr>
                <tr><td>Price</td><td><input class="input" type="number" step="0.01" id="price" name="price" style="width: 60px;" required value='${data['sale_rate']}' onblur="margin_calculate()" /> / <input class="input" type="text" id="unit" name="unit" style="width: 50px;" required value='${data['unit']}' /><div id="margin_amount"></div></td></tr>
                <tr><td>Quantity</td><td><input class="input" type="number" step="0.01" id="quantity" name="quantity" required /></td></tr>
                <tr><td>Purchase Rate</td><td><input class="input" type="number" step="0.0001" id="purchase_price" name="purchase_price" value="${data['purchase_rate']}" onblur="margin_calculate()" /></td></tr>
                <tr><td>Notes</td><td><input class="input" type="text" id="notes" name="notes"/></td></tr>
                <tr><td><button class="btn btn-success" onClick="add_item_submit('No')" title="Shortcut CTRL + ENTER">Add</button></td><td class="right"><button class="btn btn-success" onClick="add_item_submit('Yes')" title="Shortcut ALT + ENTER">Add Special</button></td></tr>
            </table>
        </td><td id="history_td" style="vertical-align: top;">`
        const history_fetch = await fetch(`/history-specific/`+ customer_id + `?code=`+ data['code'] + `&description=`+ description_details);
        if (!history_fetch.ok) {
            console.log("Error")
        }
        let history_fetch_data = await history_fetch.json();
        table_code += history_table_code_generator(history_fetch_data)
        table_code += `</td></tr></table>`
            document.getElementById("search_results").innerHTML = table_code;
            margin_calculate()
            hideLoader()

            addFunctionEventListenerSpecial = function(event) {
                if (event.key === 'Enter' && event.altKey) {
                    add_item_submit('Yes');
                }
            };
            document.addEventListener('keydown', addFunctionEventListenerSpecial);

            addFunctionEventListenerNormal = function(event) {
                if (event.key === 'Enter' && event.ctrlKey) {
                    add_item_submit('No');
                }
            };
            document.addEventListener('keydown', addFunctionEventListenerNormal);
    

    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }
}
async function add_item_history(){
    let current_code = document.getElementById('code').value
    let current_description = document.getElementById('description').value
    try {
        const history_fetch = await fetch(`/history-specific/`+ customer_id + `?code=`+ current_code + `&description=`+ current_description + ``);
        if (!history_fetch.ok) {
            console.log("Error")
            hideLoader()
        }
        let history_fetch_data = await history_fetch.json();
        document.getElementById('history_td').innerHTML = history_table_code_generator(history_fetch_data)
        hideLoader()
    } catch (error) {
        console.error('Error:', error);
        hideLoader()
    }
}
async function add_item_submit(special){
    showLoader()

    function sanity_check(array){
        output = true;
        for (let i=0; i<array.length;i++){
            if ((document.getElementById(array[i]).value).length > 0){}
            else {
                document.getElementById(array[i]).style.backgroundColor = 'red'
                output=false
            }
        }
        if (output == false){
            hideLoader()
        }
        return output
    }

    let search_string = encodeURIComponent(document.getElementById("search_value").value)

    let code = encodeURIComponent(document.getElementById("code").value)
    let description = encodeURIComponent(document.getElementById("description").value)
    let size = encodeURIComponent(document.getElementById("size").value)
    let packing = encodeURIComponent(document.getElementById("packing").value)
    let price = encodeURIComponent(document.getElementById("price").value)
    let unit = encodeURIComponent(document.getElementById("unit").value)
    let quantity = encodeURIComponent(document.getElementById("quantity").value)
    let purchase_price = encodeURIComponent(document.getElementById("purchase_price").value)
    let notes = encodeURIComponent(document.getElementById("notes").value)
    if (sanity_check(['code','description','price','unit','quantity',]) == true){
        try {
            const response = await fetch(`/invoice-manager/json-item-add/${invoice_id}?code=${code}&description=${description}&size=${size}&packaging=${packing}&selling_rate=${price}&unit=${unit}&quantity=${quantity}&purchase_rate=${purchase_price}&notes=${notes}`);
            if (!response.ok) {
                console.log("Error")
                hideLoader()
            }
            let data = await response.json();
            if (data == 'Done'){
                fetchInvoiceData(invoice_id);
                fetchLogData(invoice_id);
                if (special=="No"){
                    add_new_item(decodeURIComponent(search_string))
                    reload_scroll_position(2)
                }
                hideLoader()

            }
        } catch (error) {
            console.error('Error:', error);
            hideLoader()
        }
    }
}
function save_scroll_data(){
    try {
        let element = document.getElementById("specialtable")
        let scrollPosition = element.scrollTop;
        sessionStorage.setItem("element_scroll_required", "true");
        sessionStorage.setItem("element_scroll_value", scrollPosition);
    }catch(error){}
}
function wait(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds*1000); // 2000 milliseconds = 2 seconds
    });
}
async function reload_scroll_position(seconds) {
    await wait(seconds)
    try {
        if (sessionStorage.getItem("element_scroll_required")){
            let scrollValue = parseInt(sessionStorage.getItem("element_scroll_value"));
            let element = document.getElementById("specialtable")
            element.scrollTop = scrollValue;
            sessionStorage.removeItem("element_scroll_required");
            sessionStorage.removeItem("element_scroll_value");
        }
    } catch (error) {}
}
function change_sort(sort_value){
    if (sort_string == sort_value){
        if (sort_by == 'asc'){
            sort_by = 'desc'
        } else {
            sort_by = 'asc'
        }
    }
    sort_string = sort_value
    fetchInvoiceData(invoice_id);
}