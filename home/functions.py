from pytz import timezone as special_timezone
from datetime import datetime
from data.models import LastUpdated

def get_last_updated_date_time():
    return LastUpdated.objects.filter()[0].last

def get_current_date_time(print_format=False):
    # Provides current date and time for UAE
    current_data_time = datetime.now(special_timezone('Asia/Dubai')).strftime('%Y-%m-%d_%H-%M-%S')
    if print_format:
        # This provides details in dd-mm-yyyy hh:mm format
        return current_data_time[8:10] + "-" + current_data_time[5:7] + "-" + current_data_time[0:4] + " " + current_data_time[11:13] + ":" + current_data_time[14:16]
    else:
        # This provides details in yyyy-mm-dd hh:mm:ss format
        return current_data_time[:10] + " " + current_data_time[11:13] + ":" + current_data_time[14:16] + ":" + current_data_time[17:19]


def get_user_group(request):
    user = request.user
    return user.groups.all()


def is_number_string(input_str):
    try:
        float(input_str)
        return True
    except ValueError:
        return False

def code_remove_zero_prefix(input_string):
    # some product codes that people search have an additional zero. This function is used to rectify such code.
    # For example a product code is G53A but in some places it could be passed as G053A. This function will change it back to G53A
    input_string_removespace = " ".join(str(input_string).split()).upper()
    input_string_to_list = input_string_removespace.split(" ")
    if len(input_string_to_list) == 1:
        try:
            number_has_occurred = False
            output_string = ""
            for character in input_string_removespace:
                if character != "0":
                    if character in ["1", "2", "3", "4", "5", "6", "7", "8", "9"]:
                        number_has_occurred = True
                    output_string = output_string + character
                elif (character == "0") and (number_has_occurred is True):
                    output_string = output_string + character
            return output_string
        except:
            print("function code_remove_ZeroPrefix triggered an error")
            return input_string_removespace
    else:
        return input_string_removespace


def remove_extra_spaces(input_string, dont_change_case=False):
    if isinstance(input_string, str):
        if dont_change_case:
            return ' '.join(input_string.split())
        else:
            return ' '.join(input_string.split()).upper()
    else:
        return input_string