function showLoader() {
    var overlay = document.getElementById('overlay');
    overlay.style.display = 'block';
}
function hideLoader() {
    var overlay = document.getElementById('overlay');
    overlay.style.display = 'none';
} 

async function customer_data(customer_id, sort) {
    showLoader()
    customer_logs_load(customer_id);
    let no_data_template = `Error Occurred.`
    try {
        const response = await fetch(`/customer_details?customer_id=${customer_id}`);
        if (!response.ok) {
            document.getElementById("main_content").innerHTML = no_data_template
            hideLoader()
        }
        let data = await response.json();
        if (data){
            let customer_details_html = `<p style="text-decoration:none; font-size:small;cursor:pointer;color:#1D3B86;" onClick="load_customer_list('customer_name')">&#x2190 Back to customer list</p>
            <h6>Customer Name: ` + data['customer_name'] + ` | Salesman Name: `+ data['salesman_name'] + `</h6>
            <button class="button" onClick="add_invoice('` + data['primarykey'] + `', '`+ data['customer_name'] + `')">Add New Invoice</button>
            <a href="/invoice?view=update_customer&customer_id=` + data['primarykey'] + `"><button class="button">Update Customer Details</button></a>
            <button class="button" onClick="logs()" id="log_button">Hide Logs</button>
            <a href="/invoice_logs"><button class="button">Check Invoice Logs</button></a>
            <br><br>
            `
            if (data['total_amount']>0){
                customer_details_html += `<div id="customer_invoice_list">` + number_formater(data['total_amount']) + `</div>`
            } else {
                customer_details_html += `<div id="customer_invoice_list"></div>
                `
            }

            document.getElementById("main_content").innerHTML = customer_details_html
            if (sessionStorage.getItem("log_show") == "true"){
                document.getElementById("log_button").textContent = "Hide Logs";
                document.getElementById("logs_table").style.display = '';
            } else {
                document.getElementById("log_button").textContent = "Show Logs";
                document.getElementById("logs_table").style.display = 'none'
            }

            customer_invoice_list_load(customer_id,sort)

        }else {
            document.getElementById("main_content").innerHTML = no_data_template
        }
        hideLoader()
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("main_content").innerHTML = no_data_template
        hideLoader()
    }

}
async function customer_invoice_list_load(customer_id, sort) {
    showLoader()
    let no_data_template = `No Invoices.`
    try {
        const response = await fetch(`/invoice_details?customer_id=${customer_id}&sort=${sort}&sort_by=desc`);
        if (!response.ok) {
            document.getElementById("customer_invoice_list").innerHTML = no_data_template
            hideLoader()
        }
        let data = await response.json();
        if (data){
            let total_amount = document.getElementById("customer_invoice_list").innerText
            let customer_invoice_list = `<table>
            <tr><th>Sr.</th><th>Invoice ID</th><th>Date</th><th>Payment Terms</th><th>Amount</th><th>Prepared By</th><th colspan="2">Actions</th></tr>`
            for (let i=0;i<data.length;i++){
                if (i % 2 == 0){
                    customer_invoice_list += `<tr class="light">`
                }
                else {
                    customer_invoice_list += `<tr class="dark">`
                }
                customer_invoice_list += `<td>` + (i+1) + `</td>
                <td>` + data[i]['invoice_id'] + `</td>
                <td>` + data[i]['date'] + `</td>
                <td>` + data[i]['payment_terms'] + `</td>
                <td class="right">` + number_formater(data[i]['invoice_amount']) + `</td>
                <td>` + data[i]['user_name'] + `</td>
                <td><a href="/invoice?view=invoice_manager&invoice_id=` + data[i]['invoice_id'] + `">View</a></td>
                <td><a href="/invoice?view=invoice_delete&invoice_id=` + data[i]['invoice_id'] + `">Delete</a></td></tr>`
            }
            customer_invoice_list += `<tr><td colspan="4" style="text-align:center;"><strong>Total Amount</strong></td><td>`+ total_amount +`</td></tr>`
            customer_invoice_list += `</table>`
            document.getElementById("customer_invoice_list").innerHTML = customer_invoice_list

        }else {
            document.getElementById("customer_invoice_list").innerHTML = no_data_template
        }
        hideLoader()
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("customer_invoice_list").innerHTML = no_data_template
        hideLoader()
    }

}
async function customer_logs_load(customer_id) {
    showLoader()
    let no_data_template = `<br><br><hr>No Logs.`
    try {
        const response = await fetch(`/customer_logs_json/${customer_id}`);
        if (!response.ok) {
            document.getElementById("logs_table").innerHTML = no_data_template
            hideLoader()
        }
        let data = await response.json();
        if (data.length > 0){

            let log_table_code = `<br><br><hr><table>
            <tr><th colspan=6 style="text-align:center;">Logs</th></tr>
            <tr><th>Sr.</th><th>User ID</th><th>User Name</th><th>Date & Time</th><th>Type</th><th>Details</th></tr>
            `
            for (let i=0; i<data.length; i++){
                if (i+1 % 2 == 0){
                    log_table_code += `<tr class="dark">`
                } else {
                    log_table_code += `<tr class="light">`
                }
                log_table_code += `<td>`+ (i+1) +`</td>`
                log_table_code += `<td>`+ data[i]['user'] +`</td>`
                log_table_code += `<td>`+ data[i]['user_full_name'] +`</td>`
                log_table_code += `<td>`+ data[i]['date_time'] +`</td>`
                log_table_code += `<td>`+ data[i]['type'] +`</td>`
                log_table_code += `<td><pre>`+ data[i]['details'] +`</pre></td></tr>`
            }
            log_table_code += `</table>`

            document.getElementById("logs_table").innerHTML = log_table_code
            hideLoader()
        }else {
            document.getElementById("logs_table").innerHTML = no_data_template
        }
        hideLoader()
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("logs_table").innerHTML = no_data_template
        hideLoader()
    }
}
async function add_customer(){
    showLoader()
    let no_data_template = `Error`
    try {
        const response = await fetch(`/salesman_details`);
        if (!response.ok) {
            document.getElementById("main_content").innerHTML = no_data_template
            hideLoader()
        }
        let data = await response.json();
        if (data){
            let add_customer_template = `
            <table>
                <tr><td>Customer Name</td><td><input type="text" id="customer_name" name="customer_name" required/></td></tr>
                <tr><td>Contact Number</td><td><input type="text" id="contact_number" name="contact_number" /></td></tr>
                <tr><td>Salesman Name</td><td id="addManual">
                    <select name="salesman_id" id="salesman_id" required>
                    <option value="" selected disabled hidden >Choose here</option>`

            for (let i=0; i<data.length;i++){
                add_customer_template += `<option value="` + data[i]['salesman_id'] + `">` + data[i]['salesman_name'] + `</option>`
            }
            add_customer_template += `</select><br>
                    <br>
                    <a href="/invoice?view=add_salesman">Add New Salesman</a>
                </td></tr>
            </table>
            <br>
            <button class="button" onClick="add_customer_submit()">Add Customer</button><br><br><div id="add_customer_message"></div>`
            document.getElementById("main_content").innerHTML = add_customer_template
        }else {
            document.getElementById("main_content").innerHTML = no_data_template
        }
        hideLoader()
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("customer_invoice_list").innerHTML = no_data_template
        hideLoader()
    }
}
function todays_date(){
    // Get current date and time
var currentDate = new Date();

// Get year, month, and day
var year = currentDate.getFullYear();
var month = ('0' + (currentDate.getMonth() + 1)).slice(-2); // Months are zero-based
var day = ('0' + currentDate.getDate()).slice(-2);

// Format the date as "yyyy-mm-dd"
var formattedDate = year + '-' + month + '-' + day;
return formattedDate
}


function number_formater(numberString){
    numberString = parseFloat(numberString);
    numberString = (numberString + 0.0000000001).toFixed(2);
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
async function customer_logs_load(customer_id) {
    showLoader()
    let no_data_template = `<br><br><hr>No Logs.`
    try {
        const response = await fetch(`/logs/customer/${customer_id}`);
        if (!response.ok) {
            document.getElementById("logs_table").innerHTML = no_data_template
            hideLoader()
        }
        let data = await response.json();
        if (data.length > 0){

            let log_table_code = `<br><br><hr><table class="table table-striped">
            <tr class="inv_manager_font" >
            <th scope="col" colspan="6" class="text-center">Logs</th>
            </tr>
            <tr class="inv_manager_font">
            <th scope="col">Sr.</th>
            <th scope="col">User ID</th>
            <th scope="col">User Name</th>
            <th scope="col">Date & Time</th>
            <th scope="col">Type</th>
            <th scope="col">Details</th></tr>
            `
            for (let i=0; i<data.length; i++){
                log_table_code += `<tr class="inv_manager_font">`
                log_table_code += `<td>`+ (i+1) +`</td>`
                log_table_code += `<td>`+ data[i]['user'] +`</td>`
                log_table_code += `<td>`+ data[i]['user_full_name'] +`</td>`
                log_table_code += `<td>`+ data[i]['date_time'] +`</td>`
                log_table_code += `<td>`+ data[i]['type'] +`</td>`
                log_table_code += `<td><pre>`+ data[i]['details'] +`</pre></td></tr>`
            }
            log_table_code += `</table>`

            document.getElementById("logs_table").innerHTML = log_table_code
            hideLoader()
        }else {
            document.getElementById("logs_table").innerHTML = no_data_template
        }
        hideLoader()
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("logs_table").innerHTML = no_data_template
        hideLoader()
    }
}
