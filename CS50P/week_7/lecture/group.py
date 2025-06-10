import re

location = {"+1": "United States and Canada", "+62": "Indonesia", "+505": "Nicaragua"}

def main():
    pattern = r"(?P<country_code>\+\d{1,3}) \d{3}-\d{3}-\d{4}$"
    number = input("Phone number: ")

    match = re.search(pattern, number)
    if match:
        country_code = match.group(1)
        print(location[country_code])
    else:
        print("Invalid")
main()
