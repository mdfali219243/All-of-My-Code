import re

def main():
    code = input("Hexadecimal color code: ")
    pattern = r"^#[0-9a-fA-F]{6}$"
    # Check if the input matches the pattern for a valid hex color code
    # The pattern matches either a 6-digit or a 3-digit hexadecimal color code
    # 6-digit: #RRGGBB
    match = re.search(pattern, code)
    if match:
        print(f"Valid. Matched with: {match.group()}")
    else:
        print("Invalid. No match found.")

main()
