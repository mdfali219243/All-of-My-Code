import requests
import sys

def main():
    try:
        if len(sys.argv) == 2:
            amount = float(sys.argv[1])
        elif len(sys.argv) > 2:
            sys.exit("Too many argument")
        else:
            sys.exit("Missing command-line argument")
    except ValueError:
        sys.exit("Command-line argument is not a number")
        return
    try:
        response = requests.get("https://api.coindesk.com/v1/bpi/currentprice.json")
        response.raise_for_status()  # Raise an error for bad HTTP responses
    except requests.RequestException:
        sys.exit("Couldn't complete the request")

    content = response.json()
    rate_in_usd = float(content["bpi"]["USD"]["rate"].replace(",", ""))
    total_amount = rate_in_usd * amount
    print(f"${total_amount:,.4f}")


main()



