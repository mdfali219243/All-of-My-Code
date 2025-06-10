import re
email = input("What's your email? ").strip()

if re.search(r"^\w+@(\w+\.)?\w+\w.edu$", email, re.IGNORECASE):
    print("Valid email")
else:
    print("Invalid email")


