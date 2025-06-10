class Account:
    def __init__(self):
        self._balance = 0


    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        self._balance += amount

    def withdraw(self, amount):
        self._balance -= amount

def main():
    account = Account()
    print(f"Initial balance: {account.balance}")
    account.deposit(100)
    print(f"Balance after deposit: {account.balance}")
    account.withdraw(50)
    print(f"Balance after withdrawal: {account.balance}")

if __name__ == "__main__":
    main()
