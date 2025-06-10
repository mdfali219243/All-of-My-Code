import re
import sys

def main():
    ip = input("IPv4 Address: ")
    if validate(ip):
        print("Valid")
    else:
        sys.exit("Invalid IPv4 address")

def validate(ip):
    pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    match = re.match(pattern, ip)
    if match:
        octets = ip.split('.')
        for octet in octets:
            if not (0 <= int(octet) <= 255):
                return False
        return True
    return False

if __name__ == "__main__":
    main()
