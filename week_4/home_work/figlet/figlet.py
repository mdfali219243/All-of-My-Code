from pyfiglet import Figlet
import sys

def main():
    if len(sys.argv) == 1:
        figlet = Figlet()
    elif len(sys.argv) == 3 and (sys.argv[1] == "-f" or sys.argv[1] == "--font"):
        figlet = Figlet(font=sys.argv[2])
    else:
        sys.exit("Invalid usage")

    s = input("Text: ")
    print(figlet.renderText(s))


main()


