#include <cs50.h>
#include <stdio.h>

int factorial(int n);

int main(void)
{
    // get a positivwe number for n
    int n;
    do
    {
        n = get_int("n: ");
    }
    while (n < 0);
// Print factorial
    printf("%i\n", factorial(n));
}

int factorial(int n)
{
    if (n == 1)
    {
        return 1; // base case
    }

    return n * factorial(n-1);
}
