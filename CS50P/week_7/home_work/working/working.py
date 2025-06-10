import re
import sys


def main():
    print(convert(input("Hours: ")))


def convert(s):
    pattern = r"^(\d{1,2})(?::(\d{2}))? (AM|PM) to (\d{1,2})(?::(\d{2}))? (AM|PM)$"
    matches = re.match(pattern, s)
    if matches:
        h1, m1, p1, h2, m2, p2 = matches.groups()
        h1 = int(h1)
        m1 = int(m1) if m1 is not None else 0
        h2 = int(h2)
        m2 = int(m2) if m2 is not None else 0

        # Validate minutes
        if not (0 <= m1 < 60 and 0 <= m2 < 60):
            raise ValueError("invalid time format")

        def to_24h(hour, minute, period):
            if hour < 1 or hour > 12:
                raise ValueError("invalid time format")
            if period == "AM":
                if hour == 12:
                    hour = 0
            else:  # PM
                if hour != 12:
                    hour += 12
            return f"{hour:02}:{minute:02}"

        return f"{to_24h(h1, m1, p1)} to {to_24h(h2, m2, p2)}"
    else:
        raise ValueError("invalid time format")


if __name__ == "__main__":
    main()
