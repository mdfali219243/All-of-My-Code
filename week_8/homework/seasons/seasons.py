import sys
from datetime import date
import inflect

def calculate_minutes(birthday):
    try:
        birthdate = date.fromisoformat(birthday)
    except ValueError:
        raise ValueError("Invalid date format")

    today = date.today()
    delta = today - birthdate
    minutes = delta.days * 24 * 60

    p = inflect.engine()
    words = p.number_to_words(minutes, andword="", comma=True)
    return f"{words.capitalize()} minutes"

def main():
    birthday_input = input("Date of birth (YYYY-MM-DD): ").strip()
    try:
        print(calculate_minutes(birthday_input))
    except ValueError:
        sys.exit("Invalid date")

if __name__ == "__main__":
    main()
