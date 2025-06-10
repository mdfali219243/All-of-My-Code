#include <cs50.h>
#include <stdio.h>

int calculate_quartes(int cents);

int main(void)
{
    int cents;
    do
    {
        cents = get_int("Change owed: ");
    }
    while (cents < 0);
    int quarters = calculate_quartes(cents);
    cents = cents - (quarters * 25);
    int dimes = cents / 10;
    cents = cents - (dimes * 10);
    int nickels = cents / 5;
    cents = cents - (nickels * 5);
    int pennies = cents / 1;
    cents = cents - (pennies * 1);

    int total_coins = quarters + dimes + nickels + pennies;
    printf("%d\n", total_coins);
}

// we could made our own function
int calculate_quartes(int cents)
{
    {
        return cents / 25;
    }
}
